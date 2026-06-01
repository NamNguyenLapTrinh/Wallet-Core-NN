#pragma once

// =============================================================================
// TWHelpers.hpp
// -----------------------------------------------------------------------------
// Thin RAII layer over Trust Wallet Core's C handles.
//
// All of the previous responsibilities (hex / base64 / secureWipe) moved to:
//   - crypto/Hex.hpp
//   - crypto/Base64.hpp
//   - memory/SecureMemory.hpp
//
// This file is intentionally small now — its only job is to make C handles
// leak-free under exceptions.
// =============================================================================

#include <WalletCore/TWData.h>
#include <WalletCore/TWString.h>
#include <WalletCore/TWHDWallet.h>
#include <WalletCore/TWPrivateKey.h>
#include <WalletCore/TWPublicKey.h>
#include <WalletCore/TWAnyAddress.h>

#include <cstdint>
#include <memory>
#include <string>
#include <string_view>
#include <vector>

namespace margelo::nitro::walletmgr {

struct TWStringDeleter {
  void operator()(TWString* s) const noexcept { if (s) TWStringDelete(s); }
};
struct TWDataDeleter {
  void operator()(TWData* d) const noexcept { if (d) TWDataDelete(d); }
};
struct TWHDWalletDeleter {
  void operator()(TWHDWallet* w) const noexcept { if (w) TWHDWalletDelete(w); }
};
struct TWPrivateKeyDeleter {
  void operator()(TWPrivateKey* k) const noexcept { if (k) TWPrivateKeyDelete(k); }
};
struct TWPublicKeyDeleter {
  void operator()(TWPublicKey* k) const noexcept { if (k) TWPublicKeyDelete(k); }
};
struct TWAnyAddressDeleter {
  void operator()(TWAnyAddress* a) const noexcept { if (a) TWAnyAddressDelete(a); }
};

using TWStringPtr     = std::unique_ptr<TWString,     TWStringDeleter>;
using TWDataPtr       = std::unique_ptr<TWData,       TWDataDeleter>;
using TWHDWalletPtr   = std::unique_ptr<TWHDWallet,   TWHDWalletDeleter>;
using TWPrivateKeyPtr = std::unique_ptr<TWPrivateKey, TWPrivateKeyDeleter>;
using TWPublicKeyPtr  = std::unique_ptr<TWPublicKey,  TWPublicKeyDeleter>;
using TWAnyAddressPtr = std::unique_ptr<TWAnyAddress, TWAnyAddressDeleter>;

[[nodiscard]] inline TWStringPtr makeTWString(std::string_view s) {
  // TWStringCreateWithUTF8Bytes copies the buffer, so view → temporary cstr ok.
  std::string z(s);
  return TWStringPtr(TWStringCreateWithUTF8Bytes(z.c_str()));
}

[[nodiscard]] inline TWDataPtr makeTWData(const std::vector<std::uint8_t>& bytes) {
  return TWDataPtr(TWDataCreateWithBytes(bytes.data(), bytes.size()));
}

[[nodiscard]] inline std::vector<std::uint8_t> twDataToBytes(TWData* d) {
  if (!d) return {};
  const auto size = TWDataSize(d);
  std::vector<std::uint8_t> out(size);
  if (size > 0) TWDataCopyBytes(d, 0, size, out.data());
  return out;
}

[[nodiscard]] inline std::string twStringToStd(TWString* s) {
  if (!s) return {};
  return std::string(TWStringUTF8Bytes(s));
}

}  // namespace margelo::nitro::walletmgr
