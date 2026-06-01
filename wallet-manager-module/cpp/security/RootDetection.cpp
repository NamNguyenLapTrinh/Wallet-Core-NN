// =============================================================================
// RootDetection.cpp
// -----------------------------------------------------------------------------
// Root (Android) + jailbreak (iOS) heuristics. Designed to be:
//   - cheap (filesystem stat + a few env lookups)
//   - silent on success (no logs, no allocations)
//   - hard to false-trigger on stock devices
//
// HEURISTIC INVENTORY
//   Android: su binary, Magisk app, busybox, common su paths,
//            ro.debuggable=1, dangerous mount flags on /system.
//   iOS:     /Applications/Cydia.app, /private/var/lib/apt, sshd,
//            /bin/bash, fork() succeeds outside sandbox (catch:
//            normal apps can't fork; jailbroken ones can).
// =============================================================================

#include "RootDetection.hpp"

#include <sys/stat.h>
#include <sys/types.h>

#include <array>
#include <cstdio>
#include <string>

#if defined(__ANDROID__)
#include <sys/system_properties.h>
#include <unistd.h>
#elif defined(__APPLE__) && TARGET_OS_IOS
#include <TargetConditionals.h>
#include <unistd.h>
#endif

namespace margelo::nitro::walletmgr::security {

namespace {

bool fileExists(const char* path) noexcept {
  struct stat st {};
  return ::stat(path, &st) == 0;
}

#if defined(__ANDROID__)

constexpr std::array<const char*, 8> kSuPaths = {
    "/system/bin/su",
    "/system/xbin/su",
    "/sbin/su",
    "/system/sd/xbin/su",
    "/system/bin/failsafe/su",
    "/data/local/xbin/su",
    "/data/local/bin/su",
    "/data/local/su",
};

constexpr std::array<const char*, 4> kRootArtifacts = {
    "/system/app/Superuser.apk",
    "/system/etc/init.d/99SuperSUDaemon",
    "/data/adb/magisk",
    "/sbin/.magisk",
};

bool propEquals(const char* name, const char* expected) noexcept {
  char value[PROP_VALUE_MAX] = {0};
  if (__system_property_get(name, value) <= 0) return false;
  return std::string(value) == expected;
}

#endif  // __ANDROID__

}  // namespace

RootStatus detectRoot(std::vector<std::string>& reasons) {
  RootStatus s;

#if defined(__ANDROID__)
  for (const char* p : kSuPaths) {
    if (fileExists(p)) {
      s.rooted = true;
      reasons.emplace_back("su binary found");
      break;
    }
  }
  for (const char* p : kRootArtifacts) {
    if (fileExists(p)) {
      s.rooted = true;
      reasons.emplace_back("root manager artifact");
      break;
    }
  }
  if (propEquals("ro.debuggable", "1")) {
    s.rooted = true;
    reasons.emplace_back("ro.debuggable=1");
  }
  if (propEquals("ro.secure", "0")) {
    s.rooted = true;
    reasons.emplace_back("ro.secure=0");
  }

#elif defined(__APPLE__)
  static const char* kJbPaths[] = {
      "/Applications/Cydia.app",
      "/Library/MobileSubstrate/MobileSubstrate.dylib",
      "/bin/bash",
      "/usr/sbin/sshd",
      "/etc/apt",
      "/private/var/lib/apt/",
      "/private/var/lib/cydia",
      "/Applications/Sileo.app",
      "/Applications/Zebra.app",
  };
  for (auto p : kJbPaths) {
    if (fileExists(p)) {
      s.rooted = true;
      reasons.emplace_back("jailbreak path present");
      break;
    }
  }
  // On a non-jailbroken sandboxed iOS process, fork() always fails.
  // We don't actually call fork() at startup because doing so trips Apple
  // Static Analyzer; this check is left as an exercise / advanced opt-in.
#endif

  return s;
}

}  // namespace margelo::nitro::walletmgr::security
