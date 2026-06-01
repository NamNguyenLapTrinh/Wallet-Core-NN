#pragma once

#include <string>
#include <vector>

namespace margelo::nitro::walletmgr::security {

struct HookStatus {
  bool detected = false;
};

[[nodiscard]] HookStatus detectHooks(std::vector<std::string>& reasons);

}  // namespace margelo::nitro::walletmgr::security
