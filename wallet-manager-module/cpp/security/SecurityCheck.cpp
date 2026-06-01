// =============================================================================
// SecurityCheck.cpp
// -----------------------------------------------------------------------------
// Aggregates RootDetection / FridaDetection / DebugDetection into a single
// report. Cheap enough to run on every wallet-unlock; cache the result inside
// the JS wallet manager if you call it more frequently.
// =============================================================================

#include "SecurityCheck.hpp"

#include "DebugDetection.hpp"
#include "FridaDetection.hpp"
#include "RootDetection.hpp"

namespace margelo::nitro::walletmgr::security {

SecurityReport runSecurityChecks(const SecurityPolicy& policy) {
  SecurityReport r;

  if (policy.detectRooted) {
    auto rs = detectRoot(r.reasons);
    r.isRooted = rs.rooted;
  }
  if (policy.detectHooks) {
    auto hs = detectHooks(r.reasons);
    r.hasHooks = hs.detected;
  }
  if (policy.detectDebugger) {
    auto ds = detectDebugger(r.reasons);
    r.hasDebugger = ds.debuggerAttached;
  }
  if (policy.detectEmulator) {
    auto es = detectEmulator(r.reasons);
    r.isEmulator = es.isEmulator;
  }

  r.shouldBlock =
      (policy.failOnRooted   && r.isRooted)    ||
      (policy.failOnHooks    && r.hasHooks)    ||
      (policy.failOnDebugger && r.hasDebugger) ||
      (policy.failOnEmulator && r.isEmulator);

  return r;
}

bool isDeviceCompromised() noexcept {
  std::vector<std::string> _;
  if (detectRoot(_).rooted) return true;
  if (detectHooks(_).detected) return true;
  if (detectDebugger(_).debuggerAttached) return true;
  return false;
}

}  // namespace margelo::nitro::walletmgr::security
