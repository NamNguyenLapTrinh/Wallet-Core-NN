import type { DerivedKey } from '../types';

/**
 * Contract for the Wallet Core adapter. Implementations MUST satisfy:
 *
 *   - All secrets (mnemonic, privateKey) are passed by value and treated as
 *     short-lived. Callers wipe them after use via `wipeString`.
 *   - No method persists secrets to disk or any storage layer.
 *   - All errors are typed (see WalletError / native WalletCoreException).
 */
export interface IWalletCoreAdapter {
  generateSeedPhrase(strength?: 128 | 256): Promise<string>;
  validateMnemonic(mnemonic: string): Promise<boolean>;
  generatePrivateKey(): Promise<string>;
  validatePrivateKey(privateKey: string, chain: string): Promise<boolean>;

  derivedKey(params: {
    mnemonic: string;
    chain: string;
    index: number;
  }): Promise<DerivedKey>;

  derivedKeys(params: {
    mnemonic: string;
    chain: string;
    indexes: number[];
  }): Promise<DerivedKey[]>;

  /**
   * @deprecated UNSAFE — exposes raw private-key bytes to the JS heap.
   *
   * Prefer the native signing flow via `signTransaction` / `signMessage`,
   * which derives the key inside the native module and never returns it
   * across the JSI bridge.
   *
   * The only legitimate caller is the "export private key" UX in Settings,
   * which MUST:
   *   1. Run only after a fresh biometric prompt.
   *   2. Wipe the returned string via `wipeString(pk)` as soon as it has
   *      been displayed / copied to the clipboard.
   *   3. Never log or persist the returned value.
   */
  derivePrivateKey(params: {
    mnemonic: string;
    chain: string;
    index: number;
  }): Promise<string>;

  addressFromPrivateKey(params: {
    privateKey: string;
    chain: string;
  }): Promise<{ address: string; publicKey: string }>;

  signTransaction(params: {
    chain: string;
    input: string;
    privateKey: string;
  }): Promise<string>;

  signMessage(params: {
    chain: string;
    message: string;
    privateKey: string;
  }): Promise<string>;
}
