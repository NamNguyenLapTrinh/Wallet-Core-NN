// =============================================================================
// EthereumSigner.cpp
// -----------------------------------------------------------------------------
// EVM-family (Ethereum + L2s + sidechains) signing via Trust Wallet Core's
// TWAnySigner + TWEthereumMessageSigner.
//
// Lifecycle:
//   1. private-key bytes arrive (caller-owned, wiped by caller).
//   2. Build TWPrivateKey handle.
//   3. Sign.
//   4. RAII destroys the TWPrivateKey handle. TW Core wipes its internal
//      buffer in its own destructor.
//   5. We do not retain any reference to the private-key bytes.
// =============================================================================

#include "EthereumSigner.hpp"

#include "exceptions/WalletCoreException.hpp"
#include "helpers/TWHelpers.hpp"

#include <WalletCore/TWAnySigner.h>
#include <WalletCore/TWCoinType.h>
#include <WalletCore/TWEthereumMessageSigner.h>
#include <WalletCore/TWPrivateKey.h>

namespace margelo::nitro::walletmgr {

std::vector<std::uint8_t> EthereumSigner::signTransaction(
    const std::vector<std::uint8_t>& input,
    const std::vector<std::uint8_t>& /*privateKey*/) const {
  // For EVM, TWAnySigner reads `privateKey` out of the protobuf SigningInput.
  // We deliberately don't read the parameter so it stays where the caller
  // (HybridWalletCore) can wipe it.
  if (input.empty()) {
    throw SignTransactionError("empty signing input");
  }
  auto twInput = makeTWData(input);
  TWDataPtr signed_(TWAnySignerSign(twInput.get(), TWCoinTypeEthereum));
  if (!signed_) {
    throw SignTransactionError("EVM TWAnySigner returned null");
  }
  return twDataToBytes(signed_.get());
}

std::string EthereumSigner::signMessage(
    const std::string& message,
    const std::vector<std::uint8_t>& privateKey) const {
  if (privateKey.empty()) {
    throw InvalidPrivateKeyError("empty private key");
  }
  auto pkData = makeTWData(privateKey);
  TWPrivateKeyPtr pk(TWPrivateKeyCreateWithData(pkData.get()));
  if (!pk) {
    throw InvalidPrivateKeyError("cannot construct TWPrivateKey");
  }
  auto msg = makeTWString(message);
  TWStringPtr sig(TWEthereumMessageSignerSignMessage(pk.get(), msg.get()));
  if (!sig) {
    throw SignMessageError("EIP-191 sign failed");
  }
  return twStringToStd(sig.get());
}

}  // namespace margelo::nitro::walletmgr
