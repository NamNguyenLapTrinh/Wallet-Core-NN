export type KeyringType = 'hd' | 'imported' | 'watch';

export type DerivedKey = {
  address: string;
  publicKey: string;
  index: number;
  path: string;
  chain: string;
};

export type KeyringMeta = {
  id: string;
  type: KeyringType;
  storageKey: string;
};
