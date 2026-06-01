// =============================================================================
// SolanaSigner.cpp
// -----------------------------------------------------------------------------
// Solana signing via TWAnySigner.
//
// Solana transactions are an ed25519 signature over the canonically encoded
// "message" portion of the transaction. The protobuf SigningInput contains
// either a pre-encoded message or a high-level transfer/program-call spec
// that Trust Wallet Core encodes internally.
//
// signMessage: Solana wallets typically sign arbitrary bytes with ed25519 of
// the wallet's private key (the "offchain message" convention). We currently
// surface it via TWAnySigner with a SigningInput configured for "raw bytes" —
// callers should pass a properly-built SigningInput.
// =============================================================================

#include "SolanaSigner.hpp"

#include "exceptions/WalletCoreException.hpp"
#include "helpers/TWHelpers.hpp"

#include <WalletCore/TWAnySigner.h>
#include <WalletCore/TWCoinType.h>

namespace margelo::nitro::walletmgr {

std::vector<std::uint8_t> SolanaSigner::signTransaction(
    const std::vector<std::uint8_t>& input,
    const std::vector<std::uint8_t>& /*privateKey*/) const {
  if (input.empty()) {
    throw SignTransactionError("empty signing input");
  }
  auto twInput = makeTWData(input);
  TWDataPtr signed_(TWAnySignerSign(twInput.get(), TWCoinTypeSolana));
  if (!signed_) {
    throw SignTransactionError("Solana TWAnySigner returned null");
  }
  return twDataToBytes(signed_.get());
}

std::string SolanaSigner::signMessage(
    const std::string& /*message*/,
    const std::vector<std::uint8_t>& /*privateKey*/) const {
  // Off-chain message signing for Solana is application-specific (e.g. SIWS).
  // Surface explicitly so the JS side knows it's not silently dropped.
  throw SignMessageError("Solana off-chain message signing not implemented");
}

}  // namespace margelo::nitro::walletmgr
