// =============================================================================
// DebugDetection.cpp
// -----------------------------------------------------------------------------
// Detects attached debuggers and emulator environments.
//
// Android debugger:
//   - /proc/self/status TracerPid != 0
//   - prctl(PR_GET_DUMPABLE) == 0 means we've already dropped privileges
//
// Android emulator:
//   - ro.product.model = "sdk" / "generic" / "Emulator"
//   - ro.kernel.qemu = "1"
//   - ro.hardware = "ranchu" / "goldfish"
//   - the "Genymotion" property family
//
// iOS:
//   - sysctl(KERN_PROC, P_TRACED) flag — set when lldb attaches.
// =============================================================================

#include "DebugDetection.hpp"

#include <cstdio>
#include <cstring>
#include <string>

#if defined(__ANDROID__)
#include <sys/prctl.h>
#include <sys/system_properties.h>
#include <unistd.h>
#endif

#if defined(__APPLE__)
#include <sys/sysctl.h>
#include <sys/types.h>
#include <unistd.h>
#endif

namespace margelo::nitro::walletmgr::security {

namespace {

#if defined(__ANDROID__)
int tracerPid() noexcept {
  std::FILE* f = std::fopen("/proc/self/status", "r");
  if (!f) return 0;
  char line[256];
  int tpid = 0;
  while (std::fgets(line, sizeof(line), f)) {
    if (std::strncmp(line, "TracerPid:", 10) == 0) {
      tpid = std::atoi(line + 10);
      break;
    }
  }
  std::fclose(f);
  return tpid;
}

std::string getProp(const char* name) {
  char value[PROP_VALUE_MAX] = {0};
  __system_property_get(name, value);
  return std::string(value);
}
#endif

}  // namespace

DebugStatus detectDebugger(std::vector<std::string>& reasons) {
  DebugStatus d;
#if defined(__ANDROID__)
  if (tracerPid() != 0) {
    d.debuggerAttached = true;
    reasons.emplace_back("TracerPid != 0");
  }
#elif defined(__APPLE__)
  int mib[4] = {CTL_KERN, KERN_PROC, KERN_PROC_PID, ::getpid()};
  struct kinfo_proc info {};
  size_t size = sizeof(info);
  if (::sysctl(mib, 4, &info, &size, nullptr, 0) == 0) {
    if ((info.kp_proc.p_flag & P_TRACED) != 0) {
      d.debuggerAttached = true;
      reasons.emplace_back("P_TRACED flag set");
    }
  }
#endif
  return d;
}

DebugStatus detectEmulator(std::vector<std::string>& reasons) {
  DebugStatus d;
#if defined(__ANDROID__)
  const auto model    = getProp("ro.product.model");
  const auto hw       = getProp("ro.hardware");
  const auto qemu     = getProp("ro.kernel.qemu");
  const auto brand    = getProp("ro.product.brand");
  const auto fp       = getProp("ro.build.fingerprint");

  auto contains = [](const std::string& s, const char* sub) {
    return s.find(sub) != std::string::npos;
  };

  if (qemu == "1") {
    d.isEmulator = true;
    reasons.emplace_back("ro.kernel.qemu=1");
  } else if (hw == "ranchu" || hw == "goldfish") {
    d.isEmulator = true;
    reasons.emplace_back("emulator hardware");
  } else if (contains(model, "sdk") || contains(model, "Emulator") ||
             contains(model, "Genymotion") || contains(brand, "generic") ||
             contains(fp, "generic")) {
    d.isEmulator = true;
    reasons.emplace_back("emulator fingerprint");
  }
#elif defined(__APPLE__)
  // iOS simulator detection: TARGET_OS_SIMULATOR macro is compile-time.
#if TARGET_OS_SIMULATOR
  d.isEmulator = true;
  reasons.emplace_back("compiled for iOS simulator");
#endif
#endif
  return d;
}

}  // namespace margelo::nitro::walletmgr::security
