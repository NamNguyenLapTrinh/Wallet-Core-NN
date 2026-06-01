export type WalletType = 'hd' | 'imported' | 'watch';
export type AccountType = 'hd' | 'imported' | 'watch';

export type Wallet = {
  id: string;
  name: string;
  type: WalletType;
  createdAt: number;
  keyringId: string;
  chains: string[];
};

export type WalletAccount = {
  id: string;
  walletId: string;
  address: string;
  publicKey: string;
  index: number;
  path: string;
  chain: string;
  type: AccountType;
  name?: string;
};

export type SignTxRequest = {
  accountId: string;
  chain: string;
  input: string;
};

export type SignMessageRequest = {
  accountId: string;
  chain: string;
  message: string;
};

export type UnlockMethod = 'passcode' | 'biometric';

export * from './chains';
export * from './Chain';
export * from './Token';
export * from './WalletSettings';
export * from './keyring';
export * from './errors';
