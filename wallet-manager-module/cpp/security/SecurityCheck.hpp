#pragma once

// =============================================================================
// SecurityCheck.hpp
// -----------------------------------------------------------------------------
// Lightweight, optional runtime checks against:
//   - rooted / jailbroken devices
//   - Frida / Substrate / Cydia hook frameworks
//   - attached debuggers (lldb, gdb)
//   - emulators / simulators
//
// IMPORTANT
//   - These are HEURISTICS. None of them are bypass-proof. Treat them as
//     friction against opportunistic attackers, not as a security boundary.
//     The boundary remains hardware-backed secure storage + biometric auth.
//   - Each check is OPT-IN via the SecurityPolicy struct, so apps that need
//     to support enterprise MDM, rooted dev devices, or emulator QA can
//     selectively disable individual probes.
//   - Checks are fast (<1 ms total) — safe to call on launch.
//
// USAGE
//   SecurityPolicy policy;             // defaults: detect, do not block
//   policy.failOnRooted = true;        // opt in to hard-fail
//   const auto report = runSecurityChecks(policy);
//   if (report.shouldBlock) { /* refuse to unlock wallet */ }
// =============================================================================

#include <cstdint>
#include <string>
#include <vector>

namespace margelo::nitro::walletmgr::security {

struct SecurityPolicy {
  bool detectRooted     = true;
  bool detectHooks      = true;
  bool detectDebugger   = true;
  bool detectEmulator   = true;

  // If true, the corresponding flag in `SecurityReport` causes
  // `shouldBlock = true`. Apps can choose to log-only by leaving these false.
  bool failOnRooted     = false;
  bool failOnHooks      = false;
  bool failOnDebugger   = false;
  bool failOnEmulator   = false;
};

struct SecurityReport {
  bool isRooted     = false;
  bool hasHooks     = false;
  bool hasDebugger  = false;
  bool isEmulator   = false;

  bool shouldBlock  = false;

  // Human-readable reasons for telemetry (NO secret content, ever).
  std::vector<std::string> reasons;
};

[[nodiscard]] SecurityReport runSecurityChecks(const SecurityPolicy& policy);

// Cheap, no-allocation predicate. Use when you only care about the boolean.
[[nodiscard]] bool isDeviceCompromised() noexcept;

}  // namespace margelo::nitro::walletmgr::security
