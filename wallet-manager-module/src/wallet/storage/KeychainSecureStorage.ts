import * as Keychain from 'react-native-keychain';
import { Platform } from 'react-native';
import type { ISecureStorage, SecureItemOptions } from './ISecureStorage';
import { WalletError, ERR } from '../types/errors';

// ─────────────────────────────────────────────────────────────────────────────
// KeychainSecureStorage
// ----------------------------------------------------------------------------
// Hardware-backed secret store. Wraps react-native-keychain so that secrets
// always end up in:
//   iOS:      Secure Enclave-backed Keychain, biometry-current-set ACL.
//   Android:  Android Keystore, AES-GCM, StrongBox if present, gated by
//             biometric authentication when requested.
//
// What we DELIBERATELY do NOT do:
//   - Cache decrypted secrets in JS state.
//   - Use the global Keychain (no per-account isolation).
//   - Persist anything other than secrets here. (See mmkv.ts for metadata.)
// ─────────────────────────────────────────────────────────────────────────────

const SERVICE_PREFIX = 'wallet.secure.';
const INDEX_KEY = `${SERVICE_PREFIX}__index__`;

const BASE_OPTIONS: Keychain.SetOptions = {
  accessible: Keychain.ACCESSIBLE.WHEN_PASSCODE_SET_THIS_DEVICE_ONLY,
  securityLevel: Keychain.SECURITY_LEVEL.SECURE_HARDWARE,
};

const PLATFORM_STORAGE: Partial<Keychain.SetOptions> =
  Platform.OS === 'ios'
    ? { storage: Keychain.STORAGE_TYPE.AES_GCM_NO_AUTH }
    : { storage: Keychain.STORAGE_TYPE.AES_GCM };

export class KeychainSecureStorage implements ISecureStorage {
  async setItem(
    key: string,
    value: string,
    opts: SecureItemOptions = {},
  ): Promise<void> {
    const service = SERVICE_PREFIX + key;
    try {
      const setOpts: Keychain.SetOptions = {
        ...BASE_OPTIONS,
        ...PLATFORM_STORAGE,
        // Biometry-protected entries require user presence on every read.
        accessControl: opts.requireBiometric
          ? Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET
          : undefined,
      };
      await Keychain.setInternetCredentials(service, key, value, setOpts);
      await this.addToIndex(key);
    } catch (e) {
      // Sanitized error — no key contents leak. `key` is a non-secret slot id.
      throw new WalletError(ERR.STORAGE_FAILURE, `set "${key}" failed`);
    }
  }

  async getItem(
    key: string,
    opts: SecureItemOptions = {},
  ): Promise<string | null> {
    const service = SERVICE_PREFIX + key;
    try {
      const res = await Keychain.getInternetCredentials(service, {
        authenticationPrompt: opts.promptMessage
          ? { title: opts.promptMessage }
          : undefined,
      });

      console.debug(
        `Keychain getItem "${key}":`,
        res ? 'HIT' : 'MISS',
        res.password,
      );
      return res ? res.password : null;
    } catch (e: any) {
      console.error(`Error getting keychain item "${key}"`, e);
      const code = e?.code;
      if (
        code === 'UserCancel' ||
        code === 'AuthenticationFailed' ||
        code === 'BiometryNotAvailable' ||
        code === 'BiometryNotEnrolled' ||
        code === 'BiometryLockout'
      ) {
        throw new WalletError(ERR.AUTH_FAILED, 'biometric auth failed');
      }
      // Item not found is a normal "null" return, anything else is a real error
      // that must surface — swallowing it causes initialize() to treat existing
      // wallets as if they don't exist.
      if (
        code === 'ItemNotFound' ||
        e?.message?.includes('The specified item could not be found')
      ) {
        return null;
      }
      throw new WalletError(
        ERR.STORAGE_FAILURE,
        `get "${key}" failed: ${code ?? e?.message}`,
      );
    }
  }

  async removeItem(key: string): Promise<void> {
    const service = SERVICE_PREFIX + key;
    await Keychain.resetInternetCredentials({ server: service });
    await this.removeFromIndex(key);
  }

  async has(key: string): Promise<boolean> {
    const service = SERVICE_PREFIX + key;
    const creds = await Keychain.hasInternetCredentials(service);
    return !!creds;
  }

  async wipeAll(): Promise<void> {
    const idx = await this.readIndex();
    await Promise.all(idx.map(k => this.removeItem(k)));
    await Keychain.resetInternetCredentials({ server: INDEX_KEY });
  }

  // ── index management ─────────────────────────────────────────────────────
  // The index itself contains no secrets — just slot names. Stored without
  // biometric ACL so the manager can hydrate at app launch without prompting.

  private async readIndex(): Promise<string[]> {
    const res = await Keychain.getInternetCredentials(INDEX_KEY);
    if (!res) return [];
    try {
      return JSON.parse(res.password);
    } catch {
      return [];
    }
  }

  private async writeIndex(keys: string[]) {
    await Keychain.setInternetCredentials(
      INDEX_KEY,
      'index',
      JSON.stringify(keys),
      {
        accessible: Keychain.ACCESSIBLE.WHEN_PASSCODE_SET_THIS_DEVICE_ONLY,
      },
    );
  }

  private async addToIndex(key: string) {
    const idx = await this.readIndex();
    if (!idx.includes(key)) await this.writeIndex([...idx, key]);
  }

  private async removeFromIndex(key: string) {
    const idx = await this.readIndex();
    await this.writeIndex(idx.filter(k => k !== key));
  }
}
