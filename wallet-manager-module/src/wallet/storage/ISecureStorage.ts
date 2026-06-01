export type SecureItemOptions = {
  requireBiometric?: boolean;
  promptMessage?: string;
};

export interface ISecureStorage {
  setItem(key: string, value: string, opts?: SecureItemOptions): Promise<void>;
  getItem(key: string, opts?: SecureItemOptions): Promise<string | null>;
  removeItem(key: string): Promise<void>;
  has(key: string): Promise<boolean>;
  wipeAll(): Promise<void>;
}
