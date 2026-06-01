#pragma once

// =============================================================================
// WalletCoreException.hpp
// -----------------------------------------------------------------------------
// Typed exception hierarchy for the wallet-core adapter layer.
//
// Why typed:
//   - JS side can branch on `e.code` (Nitro converts thrown `std::exception` to
//     a JS Error; we use a stable `code` token in the message so the TS layer
//     can map to wallet-manager-module WalletError codes).
//   - Forces every native callsite to be explicit about which contract was
//     violated. Generic `std::runtime_error("derivation failed")` is gone.
//
// Convention:
//   - All exceptions inherit from `WalletCoreException` (which is a
//     `std::runtime_error`) so they bubble through Nitro normally.
//   - `code()` returns a stable, machine-readable token (UPPER_SNAKE_CASE).
//   - `what()` returns a human-readable message including the code.
// =============================================================================

#include <stdexcept>
#include <string>
#include <string_view>

namespace margelo::nitro::walletmgr {

class WalletCoreException : public std::runtime_error {
 public:
  WalletCoreException(std::string code, const std::string& message)
      : std::runtime_error("[" + code + "] " + message),
        code_(std::move(code)) {}

  [[nodiscard]] const std::string& code() const noexcept { return code_; }

 private:
  std::string code_;
};

#define WALLETCORE_DEFINE_EXCEPTION(ClassName, CodeToken)                  \
  class ClassName final : public WalletCoreException {                     \
   public:                                                                 \
    explicit ClassName(const std::string& message)                         \
        : WalletCoreException(CodeToken, message) {}                       \
  }

WALLETCORE_DEFINE_EXCEPTION(InvalidMnemonicError,      "INVALID_MNEMONIC");
WALLETCORE_DEFINE_EXCEPTION(InvalidPrivateKeyError,    "INVALID_PRIVATE_KEY");
WALLETCORE_DEFINE_EXCEPTION(InvalidPathError,          "INVALID_DERIVATION_PATH");
WALLETCORE_DEFINE_EXCEPTION(SignTransactionError,      "SIGN_TRANSACTION_FAILED");
WALLETCORE_DEFINE_EXCEPTION(SignMessageError,          "SIGN_MESSAGE_FAILED");
WALLETCORE_DEFINE_EXCEPTION(UnsupportedChainError,     "UNSUPPORTED_CHAIN");
WALLETCORE_DEFINE_EXCEPTION(AddressDerivationError,    "ADDRESS_DERIVATION_FAILED");
WALLETCORE_DEFINE_EXCEPTION(InvalidArgumentError,      "INVALID_ARGUMENT");
WALLETCORE_DEFINE_EXCEPTION(InvalidBase64Error,        "INVALID_BASE64");
WALLETCORE_DEFINE_EXCEPTION(InvalidHexError,           "INVALID_HEX");
WALLETCORE_DEFINE_EXCEPTION(InternalWalletCoreError,   "WALLETCORE_INTERNAL");

#undef WALLETCORE_DEFINE_EXCEPTION

}  // namespace margelo::nitro::walletmgr
