#pragma once

#include <string>
#include <vector>

namespace margelo::nitro::walletmgr::security {

struct RootStatus {
  bool rooted = false;
};

[[nodiscard]] RootStatus detectRoot(std::vector<std::string>& reasons);

}  // namespace margelo::nitro::walletmgr::security
