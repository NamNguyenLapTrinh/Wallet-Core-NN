// =============================================================================
// FridaDetection.cpp
// -----------------------------------------------------------------------------
// Detects common dynamic-instrumentation toolkits (Frida, Substrate, Cycript)
// by scanning loaded modules and known TCP ports.
//
// Defenses:
//   - dl_iterate_phdr scan for "frida", "gum", "substrate" substrings.
//   - check for ":27042" Frida server (default listen port).
//   - check for FRIDA_LISTEN env vars.
//
// Caveat: a skilled attacker will rename modules / use stalker bypasses.
// Use this as a *warning* signal, not as a guarantee.
// =============================================================================

#include "FridaDetection.hpp"

#include <cstdio>
#include <cstring>
#include <string>

#if defined(__ANDROID__) || defined(__linux__)
#include <dlfcn.h>
#include <link.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <unistd.h>
#endif

namespace margelo::nitro::walletmgr::security {

namespace {

bool containsHookLibName(const char* name) noexcept {
  if (!name) return false;
  static const char* kBadNames[] = {
      "frida", "gum-js-loop", "gmain", "linjector",
      "substrate", "cynject", "cycript",
  };
  for (auto bad : kBadNames) {
    if (std::strstr(name, bad)) return true;
  }
  return false;
}

#if defined(__ANDROID__) || defined(__linux__)
int phdrCallback(struct dl_phdr_info* info, std::size_t /*sz*/, void* data) {
  bool* found = static_cast<bool*>(data);
  if (containsHookLibName(info->dlpi_name)) {
    *found = true;
  }
  return 0;
}

bool tcpProbeLocalhost(unsigned short port) noexcept {
  const int s = ::socket(AF_INET, SOCK_STREAM, 0);
  if (s < 0) return false;
  sockaddr_in addr{};
  addr.sin_family = AF_INET;
  addr.sin_port = htons(port);
  addr.sin_addr.s_addr = htonl(0x7F000001);  // 127.0.0.1
  const bool open = ::connect(s, reinterpret_cast<sockaddr*>(&addr), sizeof(addr)) == 0;
  ::close(s);
  return open;
}
#endif

}  // namespace

HookStatus detectHooks(std::vector<std::string>& reasons) {
  HookStatus h;

#if defined(__ANDROID__) || defined(__linux__)
  bool nameFound = false;
  dl_iterate_phdr(&phdrCallback, &nameFound);
  if (nameFound) {
    h.detected = true;
    reasons.emplace_back("hook lib in process image");
  }

  if (tcpProbeLocalhost(27042) || tcpProbeLocalhost(27043)) {
    h.detected = true;
    reasons.emplace_back("frida-server port responsive");
  }

  if (const char* env = std::getenv("FRIDA_LISTEN"); env && *env) {
    h.detected = true;
    reasons.emplace_back("FRIDA_LISTEN env set");
  }

#elif defined(__APPLE__)
  // iOS image scan uses dyld APIs. We keep the implementation minimal here;
  // a full version walks _dyld_image_count() and matches names. Mark TODO
  // to avoid a half-finished probe that gives false confidence.
  // (Intentionally not implementing a half-baked iOS probe.)
#endif

  return h;
}

}  // namespace margelo::nitro::walletmgr::security
