#pragma once

// =============================================================================
// ISigner.hpp
// -----------------------------------------------------------------------------
// Chain-family signer interface. Each chain family (EVM / UTXO / Solana / TON
// / Cosmos) provides one concrete implementation. The Hybrid module dispatches
// to the right one via SignerRegistry.
//
// Threading: signers MUST be stateless (no mutable members). They are looked
// up on each call and may be shared across threads. All secrets are passed by
// value into the call and wiped by the caller.
// =============================================================================

#include "chains/SupportedChain.hpp"

#include <cstdint>
#include <string>
#include <vector>

namespace margelo::nitro::walletmgr {

class ISigner {
 public:
  virtual ~ISigner() = default;

  // signTransaction: input is the chain-specific SigningInput protobuf bytes
  // (raw, NOT base64). privateKey is raw 32-byte (or chain-appropriate) seed.
  // Returns the chain-specific signed output bytes (raw).
  //
  // Caller wipes `privateKey` after this returns. The signer must NOT cache
  // it anywhere.
  [[nodiscard]] virtual std::vector<std::uint8_t> signTransaction(
      const std::vector<std::uint8_t>& input,
      const std::vector<std::uint8_t>& privateKey) const = 0;

  // signMessage: chain-specific text message signing (e.g. EIP-191 for EVM).
  // Returns the textual signature exactly as the chain expects it.
  [[nodiscard]] virtual std::string signMessage(
      const std::string& message,
      const std::vector<std::uint8_t>& privateKey) const = 0;

  [[nodiscard]] virtual ChainFamily family() const noexcept = 0;
};

}  // namespace margelo::nitro::walletmgr
