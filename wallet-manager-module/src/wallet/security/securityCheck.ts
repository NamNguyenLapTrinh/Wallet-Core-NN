/**
 * securityCheck.ts
 *
 * Thin TS wrapper around the native SecurityCheck façade.
 *
 * The native side (cpp/security/SecurityCheck.{hpp,cpp}) is currently
 * compiled into the wallet-manager-module .so but not yet registered as a
 * Nitro method. To register it, add to HybridWalletCore (or a sibling
 * HybridSecurity object):
 *
 *   prototype.registerHybridMethod("runSecurityChecks",
 *                                  &HybridWalletCore::runSecurityChecks);
 *
 * Until then, this wrapper returns a safe default ("nothing detected") so
 * the wallet doesn't false-positive in development. Wire it up before
 * shipping to production.
 */

import { secureLogger } from '../utils/secureLogger';

export type SecurityPolicy = {
  detectRooted?: boolean;
  detectHooks?: boolean;
  detectDebugger?: boolean;
  detectEmulator?: boolean;
  failOnRooted?: boolean;
  failOnHooks?: boolean;
  failOnDebugger?: boolean;
  failOnEmulator?: boolean;
};

export type SecurityReport = {
  isRooted: boolean;
  hasHooks: boolean;
  hasDebugger: boolean;
  isEmulator: boolean;
  shouldBlock: boolean;
  reasons: string[];
};

const DEFAULT_POLICY: Required<SecurityPolicy> = {
  detectRooted: true,
  detectHooks: true,
  detectDebugger: true,
  detectEmulator: true,
  failOnRooted: false,
  failOnHooks: false,
  failOnDebugger: false,
  failOnEmulator: false,
};

type NativeSecurityModule = {
  runSecurityChecks?: (policy: Required<SecurityPolicy>) => Promise<SecurityReport>;
};

const tryNative = (): NativeSecurityModule | null => {
  try {
    // Resolved lazily so missing native registration doesn't break the import.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const m = require('../../native/NativeWalletCore') as {
      NativeWalletCore: NativeSecurityModule;
    };
    return m.NativeWalletCore ?? null;
  } catch {
    return null;
  }
};

export async function runSecurityChecks(
  policy: SecurityPolicy = {},
): Promise<SecurityReport> {
  const effective: Required<SecurityPolicy> = { ...DEFAULT_POLICY, ...policy };
  const native = tryNative();

  if (!native?.runSecurityChecks) {
    secureLogger.warn(
      'security: native runSecurityChecks not registered — returning passthrough report',
    );
    return {
      isRooted: false,
      hasHooks: false,
      hasDebugger: false,
      isEmulator: false,
      shouldBlock: false,
      reasons: ['native check not registered'],
    };
  }

  const report = await native.runSecurityChecks(effective);
  if (report.shouldBlock) {
    secureLogger.warn('security: device compromised', { reasons: report.reasons });
  }
  return report;
}

/**
 * Convenience: throw if the device is compromised under the given policy.
 * Call this from your wallet-unlock flow:
 *
 *   await assertDeviceTrustworthy({ failOnRooted: true, failOnHooks: true });
 */
export async function assertDeviceTrustworthy(policy: SecurityPolicy = {}): Promise<void> {
  const r = await runSecurityChecks(policy);
  if (r.shouldBlock) {
    throw new Error(`device compromised: ${r.reasons.join('; ')}`);
  }
}
