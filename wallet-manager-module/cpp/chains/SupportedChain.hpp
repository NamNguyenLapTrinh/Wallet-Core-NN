#pragma once

// =============================================================================
// SupportedChain.hpp
// -----------------------------------------------------------------------------
// Replaces the raw `double twCoinType` parameter that crosses the JS/C++
// boundary with a strongly-typed C++ enum plus an explicit mapping to
// TWCoinType. This prevents:
//   - silent loss-of-precision from JS Number → int casts
//   - garbage coin types reaching TWAnySigner (which would happily fail
//     with a useless error)
//   - drift between supported coins on JS side and what the native side
//     actually handles
//
// Adding a new chain requires:
//   1. Add to SupportedChain enum below.
//   2. Add the mapping row in SupportedChain.cpp.
//   3. Add an Ethereum/Bitcoin/Solana-family signer or extend an existing one.
// =============================================================================

#include <WalletCore/TWCoinType.h>

#include <cstdint>
#include <optional>
#include <string_view>

namespace margelo::nitro::walletmgr {

enum class SupportedChain : std::int32_t {
  Ethereum,
  Bitcoin,
  Solana,
  Polygon,
  Arbitrum,
  Optimism,
  Base,
  SmartChain,   // BSC
  Avalanche,
  Litecoin,
  Dogecoin,
  Cosmos,
  Ton,
};

enum class ChainFamily : std::int32_t {
  Evm,
  Utxo,
  Solana,
  Cosmos,
  Ton,
};

struct ChainSpec {
  SupportedChain   chain;
  TWCoinType       twCoinType;
  ChainFamily      family;
  std::string_view canonicalId;   // "ethereum", "bitcoin", ...
  std::string_view defaultPath;   // BIP44 template, "{index}" placeholder
};

[[nodiscard]] const ChainSpec& specOf(SupportedChain c);

[[nodiscard]] std::optional<SupportedChain> chainFromTWCoinType(TWCoinType t) noexcept;
[[nodiscard]] std::optional<SupportedChain> chainFromCanonicalId(std::string_view id) noexcept;

// JS-bridge convenience: a Nitro Number arrives as `double`. Convert + validate.
[[nodiscard]] SupportedChain chainFromJsCoinType(double twCoinType);

[[nodiscard]] inline bool isEvm(SupportedChain c) {
  return specOf(c).family == ChainFamily::Evm;
}

}  // namespace margelo::nitro::walletmgr
