// ── Types ──────────────────────────────────────────────────────────────────
export * from './types';

// ── Service (singleton) ────────────────────────────────────────────────────
export {
  initWalletService,
  getWalletManager,
  resetWalletService,
} from './services/WalletService';

// ── State ──────────────────────────────────────────────────────────────────
export {
  walletStore,
  selectActiveAccount,
  selectActiveWallet,
  selectAccountsByWallet,
  selectAccountsByChain,
} from './state/walletStore';

// ── Hooks ──────────────────────────────────────────────────────────────────
export * from './hooks';

// ── Adapters ───────────────────────────────────────────────────────────────
export type { IWalletCoreAdapter } from './adapters/IWalletCoreAdapter';
export { WalletCoreAdapter } from './adapters/WalletCoreAdapter';

// ── Storage ────────────────────────────────────────────────────────────────
export type { ISecureStorage, SecureItemOptions } from './storage/ISecureStorage';
export { KeychainSecureStorage } from './storage/KeychainSecureStorage';
export { SecureStorage, secureStorage } from './storage/SecureStorage';

// ── Keyring ────────────────────────────────────────────────────────────────
export type { IKeyring } from './keyring/IKeyring';
export { BaseKeyring } from './keyring/BaseKeyring';
export { HDKeyring } from './keyring/HDKeyring';
export { ImportedKeyring } from './keyring/ImportedKeyring';
export { WatchOnlyKeyring } from './keyring/WatchOnlyKeyring';
export { KeyringFactory } from './keyring/KeyringFactory';

// ── Manager ────────────────────────────────────────────────────────────────
export { WalletManager } from './manager/WalletManager';

// ── Security ───────────────────────────────────────────────────────────────
export {
  runSecurityChecks,
  assertDeviceTrustworthy,
} from './security/securityCheck';
export type { SecurityPolicy, SecurityReport } from './security/securityCheck';

// ── Logging ────────────────────────────────────────────────────────────────
export { secureLogger, configureSecureLogger } from './utils/secureLogger';
export { wipeString } from './utils/memory';
