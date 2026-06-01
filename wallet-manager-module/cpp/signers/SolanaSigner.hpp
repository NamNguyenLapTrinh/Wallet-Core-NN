#pragma once

#include "ISigner.hpp"

namespace margelo::nitro::walletmgr {

class SolanaSigner final : public ISigner {
 public:
  std::vector<std::uint8_t> signTransaction(
      const std::vector<std::uint8_t>& input,
      const std::vector<std::uint8_t>& privateKey) const override;

  std::string signMessage(
      const std::string& message,
      const std::vector<std::uint8_t>& privateKey) const override;

  ChainFamily family() const noexcept override { return ChainFamily::Solana; }
};

}  // namespace margelo::nitro::walletmgr
