#pragma once

// =============================================================================
// AddressBuilder.hpp
// -----------------------------------------------------------------------------
// Chain-aware address derivation.
//
// TWAnyAddressCreateWithPublicKey accepts a public key + TWCoinType. That's
// fine for EVM and many non-EVM chains, but some chains (Cosmos derivatives,
// Bitcoin SegWit variants, Solana with different curves) need extra knobs.
// This builder centralizes "given a public key and a chain, produce the
// canonical text address" so the dispatch lives in one place.
//
// Today every chain we support is satisfied by TWAnyAddress; the abstraction
// is the seam we'll extend when adding e.g. a custom Cosmos bech32 prefix.
// =============================================================================

#include "chains/SupportedChain.hpp"
#include "helpers/TWHelpers.hpp"

#include <string>

namespace margelo::nitro::walletmgr {

[[nodiscard]] std::string addressForPublicKey(TWPublicKey* pub, SupportedChain chain);

[[nodiscard]] TWPublicKeyPtr publicKeyForChain(TWPrivateKey* pk, SupportedChain chain);

}  // namespace margelo::nitro::walletmgr
