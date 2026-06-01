import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Splash: undefined;
  Welcome: undefined;
  CreateWallet: undefined;
  RestoreWallet: undefined;
  SecureWallet: { mnemonic: string };
  CreatePin: { mode: 'create' | 'change' };
  ConfirmPin: { firstPin: string; mode: 'create' | 'change' };
  Unlock: undefined;
};

export type WalletStackParamList = {
  Home: undefined;
  WalletDetail: { walletId: string };
  AccountSelector: undefined;
  AddAccount: { walletId: string };
  Receive: { accountId: string };
  Send: { accountId: string };
  TokenDetail: { tokenId: string; accountId: string };
  Settings: undefined;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Wallet: NavigatorScreenParams<WalletStackParamList>;
};

export type AuthScreenProps<T extends keyof AuthStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<AuthStackParamList, T>,
    NativeStackScreenProps<RootStackParamList>
  >;

export type WalletScreenProps<T extends keyof WalletStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<WalletStackParamList, T>,
    NativeStackScreenProps<RootStackParamList>
  >;

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
