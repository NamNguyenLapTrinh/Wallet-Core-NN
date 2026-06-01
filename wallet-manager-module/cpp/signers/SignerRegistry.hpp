#pragma once

// =============================================================================
// SignerRegistry.hpp
// -----------------------------------------------------------------------------
// Maps SupportedChain → ISigner const&.
//
// Thread-safety: signers are stateless singletons constructed once at first
// access (Meyers' singleton). Returned reference is valid for the lifetime
// of the process. Safe to call concurrently from multiple JS threads /
// Nitro worker queues.
// =============================================================================

#include "chains/SupportedChain.hpp"
#include "ISigner.hpp"

namespace margelo::nitro::walletmgr {

[[nodiscard]] const ISigner& signerFor(SupportedChain chain);

}  // namespace margelo::nitro::walletmgr
