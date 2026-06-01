import type { DerivedKey, KeyringType } from '../types';

export interface IKeyring {
  readonly id: string;
  readonly type: KeyringType;

  deriveAccount(chain: string, index: number): Promise<DerivedKey>;
  deriveAccounts(chain: string, indexes: number[]): Promise<DerivedKey[]>;
  exportPrivateKey(chain: string, index: number): Promise<string>;
  lock(): void;
}
