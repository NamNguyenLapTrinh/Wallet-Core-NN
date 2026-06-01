import type { IKeyring } from './IKeyring';
import type { DerivedKey, KeyringType } from '../types';

export abstract class BaseKeyring implements IKeyring {
  abstract readonly id: string;
  abstract readonly type: KeyringType;

  abstract deriveAccount(chain: string, index: number): Promise<DerivedKey>;
  abstract deriveAccounts(chain: string, indexes: number[]): Promise<DerivedKey[]>;
  abstract exportPrivateKey(chain: string, index: number): Promise<string>;
  abstract lock(): void;
}
