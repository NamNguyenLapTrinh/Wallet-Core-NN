// =============================================================================
// BitcoinSigner.cpp
// -----------------------------------------------------------------------------
// UTXO-family signing (Bitcoin, Litecoin, Dogecoin). Trust Wallet Core's
// TWAnySigner handles the full BIP141 / BIP143 dance internally — the caller
// must construct the protobuf SigningInput with UTXO list, scripts, fees,
// HD-keys for each UTXO, etc.
//
// This signer does NOT support arbitrary message signing today. Bitcoin
// has a message-signing scheme (BIP137), but it requires per-coin formatting
// (P2PKH vs SegWit) — we defer until a concrete use case arrives.
// =============================================================================

#include "BitcoinSigner.hpp"

#include "exceptions/WalletCoreException.hpp"
#include "helpers/TWHelpers.hpp"

#include <WalletCore/TWAnySigner.h>
#include <WalletCore/TWCoinType.h>

namespace margelo::nitro::walletmgr {

std::vector<std::uint8_t> BitcoinSigner::signTransaction(
    const std::vector<std::uint8_t>& input,
    const std::vector<std::uint8_t>& /*privateKey*/) const {
  if (input.empty()) {
    throw SignTransactionError("empty signing input");
  }
  auto twInput = makeTWData(input);
  TWDataPtr signed_(TWAnySignerSign(twInput.get(), TWCoinTypeBitcoin));
  if (!signed_) {
    throw SignTransactionError("UTXO TWAnySigner returned null");
  }
  return twDataToBytes(signed_.get());
}

std::string BitcoinSigner::signMessage(
    const std::string& /*message*/,
    const std::vector<std::uint8_t>& /*privateKey*/) const {
  throw SignMessageError("Bitcoin message signing not supported");
}

}  // namespace margelo::nitro::walletmgr
