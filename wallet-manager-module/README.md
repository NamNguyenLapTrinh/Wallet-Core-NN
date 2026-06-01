# wallet-manager-module

React Native wallet management layer wrapping Trust Wallet Core. Provides:

- `WalletManager` orchestrator
- Keyring strategies (HD / Imported / WatchOnly)
- `WalletCoreAdapter` (Nitro/JSI bridge wrap)
- `KeychainSecureStorage` (`react-native-keychain`)
- Zustand store + hooks
- Multi-chain (Ethereum / Bitcoin / Solana / TON, extensible via `CHAINS` map)

Wallet Core cryptography is **not** re-implemented — this is pure management layer.

## Folder structure

```
wallet-manager-module/
├── cpp/                              # C++ Nitro hybrid object → TW C ABI
│   ├── HybridWalletCore.hpp/.cpp     # impl of NativeWalletCoreSpec
│   ├── HybridWalletCoreRegister.cpp  # registers hybrid object name "WalletCore"
│   ├── SignMessageEth.cpp            # chain-specific message signing
│   ├── Base64.cpp                    # base64 helper (proto SigningInput IO)
│   └── TWHelpers.hpp                 # RAII wrappers (TWString/TWData/wipe)
├── nitrogen/nitro.json               # Nitro autolinking config
├── ios/WalletManagerModule.podspec   # iOS build
├── android/CMakeLists.txt            # Android build
└── src/
    ├── native/
    │   └── NativeWalletCore.ts       # TS Nitro spec (matches the C++ class)
    └── wallet/
        ├── adapters/                  # WalletCoreAdapter (interface + impl)
        ├── hooks/                     # React hooks
        ├── keyring/                   # IKeyring + HD/Imported/WatchOnly + factory
        ├── manager/                   # WalletManager, SessionCache
        ├── services/                  # WalletService façade
        ├── state/                     # Zustand walletStore
        ├── storage/                   # ISecureStorage + KeychainSecureStorage
        ├── types/                     # Wallet / Account / Chain / errors
        ├── utils/                     # id, memory, validation
        └── index.ts                   # public surface
```

## C++ layer

`cpp/HybridWalletCore.cpp` is the actual implementation that satisfies the
TypeScript spec in `src/native/NativeWalletCore.ts`. It delegates entirely to
Trust Wallet Core's C ABI (`TWHDWallet*`, `TWPrivateKey*`, `TWAnyAddress*`,
`TWAnySigner*`, `TWEthereumMessageSigner*`) — no cryptography is
reimplemented.

Key points:
- RAII wrappers (`TWStringPtr`, `TWDataPtr`, `TWHDWalletPtr`, ...) guarantee
  every TW handle is released even on exception.
- Secret material (`std::vector<uint8_t>`, `std::string`) is wiped via
  `secureWipe()` before destruction.
- `signMessage` dispatches by `TWCoinType`; per-chain signers live in their
  own translation units (e.g. `SignMessageEth.cpp`) so adding a chain is
  one new `.cpp` + one `case` in `HybridWalletCore::signMessage`.
- Nitrogen generates the JSI glue from `nitrogen/nitro.json` + the TS spec.
  The hybrid object is registered under the name `"WalletCore"` —
  `NitroModules.createHybridObject<NativeWalletCoreSpec>('WalletCore')`
  resolves to this C++ class.

## Quick start

```ts
// 1. Boot at app start
import { initWalletService, getWalletManager, useAutoLockOnBackground } from './src/wallet';

initWalletService({ autoLockMs: 5 * 60_000 });
await getWalletManager().initialize();

// 2. Create a new HD wallet
const { wallet, account, mnemonic } = await getWalletManager().createWallet({
  name: 'Main',
  chain: 'ethereum',
});

// 3. Restore
await getWalletManager().restoreWallet({ mnemonic: input, chain: 'ethereum' });

// 4. Add another account on a different chain
await getWalletManager().addAccount({ walletId: wallet.id, chain: 'solana' });

// 5. Switch
await getWalletManager().switchAccount(account.id);

// 6. Sign
const signed = await getWalletManager().signTransaction(account.id, base64SigningInput);

// 7. Lock / unlock
getWalletManager().lock();
await getWalletManager().unlock();
```

## Wiring the native bridge

### 1. Generate Nitro bindings

```bash
# from repo root
pnpm nitrogen          # → calls `pnpm --filter wallet-manager-module nitrogen`

# or directly inside the package
cd wallet-manager-module && pnpm nitrogen
```

This reads [`nitrogen/nitro.json`](nitrogen/nitro.json) + the TS spec in
[`src/native/NativeWalletCore.ts`](src/native/NativeWalletCore.ts) and emits:

```
nitrogen/generated/
├── shared/c++/HybridWalletCoreSpec.hpp   # pure-virtual base
├── shared/c++/HybridWalletCoreSpec.cpp   # nitro registration glue
├── ios/c++/...                            # Swift + ObjC++ autolinking
└── android/c++/...                        # JNI + Java autolinking
```

`nitrogen/generated/` is `.gitignore`-d by default; CI runs `pnpm nitrogen`
before the build. To commit the generated tree instead, remove the entry
from `.gitignore`.

### 2. Build native

```bash
cd ios && pod install     # picks up generated podspec sources
# Android: gradle picks up generated CMake sources on next build
```

### 3. Re-run when the TS spec changes

`src/native/NativeWalletCore.ts` is the source of truth. Any edit there
(new method, new param) needs a re-run of `pnpm nitrogen` plus a matching
override in `cpp/core/HybridWalletCore.cpp`.

## Adding a chain

Append an entry to `CHAINS` in [src/wallet/types/chains.ts](src/wallet/types/chains.ts).
No manager / keyring code changes required.

## Security guarantees

- Mnemonics & private keys: Keychain / Keystore at rest, biometric-gated
- Zustand store holds metadata only — no secrets
- Session cache cleared on `lock()` and app backgrounding
- Private keys live only for the duration of a single signing call
- No `console.log` of secret material in any code path
