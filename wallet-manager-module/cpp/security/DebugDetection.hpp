#pragma once

#include <string>
#include <vector>

namespace margelo::nitro::walletmgr::security {

struct DebugStatus {
  bool debuggerAttached = false;
  bool isEmulator       = false;
};

[[nodiscard]] DebugStatus detectDebugger(std::vector<std::string>& reasons);
[[nodiscard]] DebugStatus detectEmulator(std::vector<std::string>& reasons);

}  // namespace margelo::nitro::walletmgr::security
