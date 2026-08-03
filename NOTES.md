# Ghi chú các bước đã làm — TrustWalletFork

> Ngày cập nhật: 2026-07-04

---

## Vấn đề 1: Mất ví mỗi lần restart app

**Nguyên nhân:** `hasInternetCredentials()` trên Android trả về `false` cho các item được bảo vệ bằng biometric khi Android Keystore chưa unlock. Dẫn đến `initialize()` tưởng không có ví nào → xóa hết metadata.

**Giải pháp:**
- Bỏ hoàn toàn `has()` / `hasInternetCredentials()` khỏi cả `initialize()` và `unlock()`.
- Thay bằng gọi thẳng `getItem()` → nếu `null` = không có, nếu throw = lỗi auth.
- File: `KeychainSecureStorage.ts`, `WalletManager.ts`

---

## Vấn đề 2: Không unlock được sau khi cài lại app

**Nguyên nhân:** Metadata (wallet list) bị xóa khi reinstall nhưng Keychain vẫn giữ mnemonic (Keychain persistent qua reinstall trên iOS). `initialize()` đọc metadata = rỗng → không có ví → `unlock()` throw "Wallet secret not found".

**Giải pháp:**
- `getItem()` trả về `null` thay vì throw khi item không tồn tại (`ItemNotFound`).
- Phân biệt 3 loại lỗi: `ItemNotFound → null`, biometric fail → `AUTH_FAILED`, còn lại → `STORAGE_FAILURE`.
- File: `KeychainSecureStorage.ts`

---

## Vấn đề 3: Lỗi -25293 errSecAuthFailed khi mở app từ background

**Nguyên nhân:** iOS từ chối biometric khi window chưa fully active (app vừa chuyển từ background lên foreground, transition chưa xong).

**Giải pháp:**
- Thêm `-25293` vào danh sách error code là auth fail trong `getItem()`.
- Rewrite `UnlockScreen.tsx`: nếu `AppState !== 'active'` thì chờ event `change → active` trước khi gọi `unlock()`. Thêm delay 300ms để iOS window activation xong.
- `hasTriggered` ref ngăn gọi 2 lần; nút Unlock reset ref để retry.
- File: `KeychainSecureStorage.ts`, `src/screens/auth/UnlockScreen.tsx`

---

## Refactor: Model ví — 1 seed phrase = 1 wallet, nhiều accounts

**Trước:** Mỗi chain là 1 wallet riêng biệt; không có khái niệm BIP44 index.

**Sau:**
- 1 seed phrase = 1 `Wallet` (HD wallet).
- Trong mỗi wallet có nhiều account groups theo BIP44 index (0, 1, 2, ...).
- Mỗi index có địa chỉ riêng cho từng chain (ETH, BTC, SOL, TON).
- `activeAccountIndex` track BIP44 index đang chọn.

**Files thay đổi:**
- `WalletManager.ts` — `createWallet()` derive ALL chains cùng lúc (1 biometric prompt)
- `HDKeyring.ts` — thêm `deriveAccountGroup(chains, index)`
- `walletStore.ts` — thêm `activeAccountIndex`, `setActiveAccountGroup()`
- `IKeyring.ts`, `BaseKeyring.ts`, `ImportedKeyring.ts`, `WatchOnlyKeyring.ts` — implement interface mới

---

## Tính năng mới: addAccountGroup

**Mục đích:** Thêm account mới từ cùng seed phrase (BIP44 index tiếp theo) mà chỉ cần 1 lần biometric.

**Luồng:**
1. `WalletManager.addAccountGroup(walletId)` → tìm `maxIndex` hiện tại → `nextIndex = maxIndex + 1`
2. `HDKeyring.deriveAccountGroup(ALL_CHAINS, nextIndex)` → 1 biometric, derive tất cả chains
3. Tạo `WalletAccount[]` mới → `persistState()`

---

## UI mới: AccountSelectorScreen

**Layout:** Wallet sections → trong mỗi section là các account rows theo index.

**Mỗi row hiển thị:**
- BIP44 index (Account #0, #1, ...)
- Địa chỉ của chain đang chọn hiện tại
- Nút xóa (🗑) với Alert confirm

**Nút:**
- `+ Add account` trong section → `addAccountGroup(walletId)`
- `+ New seed phrase` ở dưới → navigate `AddWallet`
- Chain badge ở header → navigate `ChainSelector`

---

## UI mới: ChainSelectorScreen

**Mục đích:** Đổi chain đang xem (không phải switch wallet/account).

**Luồng:** Tap chain → `walletStore.setSelectedChain(chain)` → `navigation.goBack()`

Truy cập từ: header badge trong AccountSelectorScreen, card row trong HomeScreen.

---

## UI mới: AddWalletScreen

**Tabs:**
- **New wallet**: `generateMnemonic()` → hiện seed phrase → "Tôi đã lưu" → `createWallet(mnemonic)` → AccountSelector. Cancel → `removeWallet()`.
- **Import phrase**: nhập mnemonic → `restoreWallet({ mnemonic })` → AccountSelector.

**Lưu ý quan trọng:** `createWallet()` nhận mnemonic từ ngoài (đã hiện cho user xem), KHÔNG tự gen nữa. Đây là flow đúng — user thấy mnemonic trước khi lưu.

---

## HomeScreen refactor

**Trước:** Tabs chain ở trên.

**Sau:** 1 card row tappable hiển thị chain name + địa chỉ → tap → `ChainSelectorScreen`.

---

## Delete wallet

**Luồng:**
1. Alert confirm "Xóa ví? Không thể hoàn tác."
2. `WalletManager.removeWallet(walletId)`
3. Xóa mnemonic khỏi Keychain
4. Xóa accounts khỏi danh sách
5. Nếu xóa active wallet → reset `activeAccountIndex = 0`, chọn wallet khác

---

## Comment tiếng Việt — tất cả core files

Tất cả file sau đều có JSDoc tiếng Việt đầy đủ:

| File | Nội dung comment chính |
|------|------------------------|
| `WalletManager.ts` | Toàn bộ public + private methods, params, returns |
| `HDKeyring.ts` | `withUnlockedMnemonic` pattern, biometric timing |
| `ImportedKeyring.ts` | Giới hạn single-chain, single-index |
| `WatchOnlyKeyring.ts` | Không có private key |
| `BaseKeyring.ts` | Abstract class description |
| `IKeyring.ts` | Contract interface, deprecated warnings |
| `ISecureStorage.ts` | Cảnh báo `has()` Android bug |
| `KeychainSecureStorage.ts` | Error handling, `-25293`, index management |
| `IWalletCoreAdapter.ts` | C++ mapping, quy tắc bảo mật |
| `WalletCoreAdapter.ts` | C++ function call cho từng method |
| `walletStore.ts` | Từng field và action |
| `SecureStorage.ts` | Wrapper pattern, mnemonic helpers |
| `useWalletLock.ts` | busy/error/locked states |
| `useAutoLockOnBackground.ts` | Tại sao bỏ qua `inactive` |

---

## File tài liệu

- **`ARCHITECTURE.md`** — tổng quan hệ thống, class tables, data model, 6 flow diagrams
- **`NOTES.md`** (file này) — ghi chú từng bước đã làm

---

## Commits

| Hash | Nội dung |
|------|----------|
| `329d857` | first commit |
| `c6968a4` | Base |
| `2d799b5` | Restore all TypeScript source files from stash |
| `a812be8` | Refactor wallet model: 1 seed phrase → multi-account, multi-chain UI |
| `bb12e54` | Thêm comment tiếng Việt và file ARCHITECTURE.md |

---

## Quy tắc bảo mật quan trọng

1. **Không dùng `has()`** cho secret có biometric — Android Keystore trả false khi chưa unlock.
2. **Không cache mnemonic trong RAM** — đọc từ Keychain mỗi lần cần, `wipeString()` sau khi dùng.
3. **Mọi thao tác mnemonic phải trigger biometric** (`requireBiometric: true`).
4. **Không log giá trị secret** — không `console.log(mnemonic)` hay `console.log(privateKey)`.
5. **Đọc Keychain chỉ khi `AppState === 'active'`** — tránh `-25293` khi app đang transition.
