#include "SignerRegistry.hpp"

#include "BitcoinSigner.hpp"
#include "EthereumSigner.hpp"
#include "SolanaSigner.hpp"

#include "exceptions/WalletCoreException.hpp"

namespace margelo::nitro::walletmgr {

namespace {

template <typename T>
const ISigner& singleton() {
  static const T instance;
  return instance;
}

}  // namespace

const ISigner& signerFor(SupportedChain chain) {
  switch (specOf(chain).family) {
    case ChainFamily::Evm:
      return singleton<EthereumSigner>();
    case ChainFamily::Utxo:
      return singleton<BitcoinSigner>();
    case ChainFamily::Solana:
      return singleton<SolanaSigner>();
    case ChainFamily::Cosmos:
      throw UnsupportedChainError("Cosmos signer not implemented");
    case ChainFamily::Ton:
      throw UnsupportedChainError("TON signer not implemented");
  }
  // Unreachable under a well-formed enum value, but g++ requires a return path.
  throw UnsupportedChainError("unknown chain family");
}

}  // namespace margelo::nitro::walletmgr
