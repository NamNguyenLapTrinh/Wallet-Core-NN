#include "SupportedChain.hpp"
#include "exceptions/WalletCoreException.hpp"

#include <array>
#include <cmath>

namespace margelo::nitro::walletmgr {

namespace {

constexpr std::array<ChainSpec, 13> kSpecs = {{
    {SupportedChain::Ethereum,   TWCoinTypeEthereum,   ChainFamily::Evm,    "ethereum",   "m/44'/60'/0'/0/{index}"},
    {SupportedChain::Bitcoin,    TWCoinTypeBitcoin,    ChainFamily::Utxo,   "bitcoin",    "m/84'/0'/0'/0/{index}"},
    {SupportedChain::Solana,     TWCoinTypeSolana,     ChainFamily::Solana, "solana",     "m/44'/501'/{index}'/0'"},
    {SupportedChain::Polygon,    TWCoinTypePolygon,    ChainFamily::Evm,    "polygon",    "m/44'/60'/0'/0/{index}"},
    {SupportedChain::Arbitrum,   TWCoinTypeArbitrum,   ChainFamily::Evm,    "arbitrum",   "m/44'/60'/0'/0/{index}"},
    {SupportedChain::Optimism,   TWCoinTypeOptimism,   ChainFamily::Evm,    "optimism",   "m/44'/60'/0'/0/{index}"},
    {SupportedChain::Base,       TWCoinTypeBase,       ChainFamily::Evm,    "base",       "m/44'/60'/0'/0/{index}"},
    {SupportedChain::SmartChain, TWCoinTypeSmartChain, ChainFamily::Evm,    "bsc",        "m/44'/60'/0'/0/{index}"},
    {SupportedChain::Avalanche,  TWCoinTypeAvalancheCChain, ChainFamily::Evm, "avalanche", "m/44'/60'/0'/0/{index}"},
    {SupportedChain::Litecoin,   TWCoinTypeLitecoin,   ChainFamily::Utxo,   "litecoin",   "m/84'/2'/0'/0/{index}"},
    {SupportedChain::Dogecoin,   TWCoinTypeDogecoin,   ChainFamily::Utxo,   "dogecoin",   "m/44'/3'/0'/0/{index}"},
    {SupportedChain::Cosmos,     TWCoinTypeCosmos,     ChainFamily::Cosmos, "cosmos",     "m/44'/118'/0'/0/{index}"},
    {SupportedChain::Ton,        TWCoinTypeTON,        ChainFamily::Ton,    "ton",        "m/44'/607'/{index}'"},
}};

}  // namespace

const ChainSpec& specOf(SupportedChain c) {
  for (const auto& s : kSpecs) {
    if (s.chain == c) return s;
  }
  // Enum has a single source of truth here; reaching this is a programmer bug.
  throw InternalWalletCoreError("missing ChainSpec entry");
}

std::optional<SupportedChain> chainFromTWCoinType(TWCoinType t) noexcept {
  for (const auto& s : kSpecs) {
    if (s.twCoinType == t) return s.chain;
  }
  return std::nullopt;
}

std::optional<SupportedChain> chainFromCanonicalId(std::string_view id) noexcept {
  for (const auto& s : kSpecs) {
    if (s.canonicalId == id) return s.chain;
  }
  return std::nullopt;
}

SupportedChain chainFromJsCoinType(double twCoinType) {
  if (!std::isfinite(twCoinType)) {
    throw UnsupportedChainError("coin type is not finite");
  }
  const auto rounded = static_cast<long long>(std::llround(twCoinType));
  if (rounded < 0 || rounded > 2'147'483'647LL) {
    throw UnsupportedChainError("coin type out of range");
  }
  const auto tw = static_cast<TWCoinType>(static_cast<int>(rounded));
  auto opt = chainFromTWCoinType(tw);
  if (!opt) {
    throw UnsupportedChainError("coin type not in SupportedChain set");
  }
  return *opt;
}

}  // namespace margelo::nitro::walletmgr
