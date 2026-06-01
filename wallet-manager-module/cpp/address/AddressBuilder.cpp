#include "AddressBuilder.hpp"
#include "exceptions/WalletCoreException.hpp"

#include <WalletCore/TWCoinType.h>
#include <WalletCore/TWPublicKeyType.h>

namespace margelo::nitro::walletmgr {

std::string addressForPublicKey(TWPublicKey* pub, SupportedChain chain) {
  if (!pub) {
    throw AddressDerivationError("public key is null");
  }
  const auto& spec = specOf(chain);

  // Today we route every supported chain through TWAnyAddress. The dispatch
  // is intentional — when we add a chain that needs custom encoding (e.g. a
  // Cosmos zone with a non-default bech32 prefix), it lives in this switch.
  TWAnyAddressPtr addr(TWAnyAddressCreateWithPublicKey(pub, spec.twCoinType));
  if (!addr) {
    throw AddressDerivationError("TWAnyAddress create failed");
  }
  TWStringPtr text(TWAnyAddressDescription(addr.get()));
  if (!text) {
    throw AddressDerivationError("TWAnyAddress description failed");
  }
  return twStringToStd(text.get());
}

TWPublicKeyPtr publicKeyForChain(TWPrivateKey* pk, SupportedChain chain) {
  if (!pk) {
    throw AddressDerivationError("private key handle is null");
  }
  const auto pubType = TWCoinTypePublicKeyType(specOf(chain).twCoinType);
  TWPublicKeyPtr pub(TWPrivateKeyGetPublicKeyByType(pk, pubType));
  if (!pub) {
    throw AddressDerivationError("public key derivation failed");
  }
  return pub;
}

}  // namespace margelo::nitro::walletmgr
