import { create } from 'zustand';
import type { Wallet, WalletAccount } from '../types';
import { DEFAULT_SETTINGS, type WalletSettings } from '../types/WalletSettings';

export type WalletState = {
  initialized: boolean;
  locked: boolean;
  hydrated: boolean;

  wallets: Wallet[];
  accounts: WalletAccount[];
  activeWalletId?: string;
  activeAccountId?: string;
  settings: WalletSettings;

  setInitialized: (v: boolean) => void;
  setLocked: (v: boolean) => void;
  setHydrated: (v: boolean) => void;
  setActiveAccount: (accountId: string) => void;
  setActiveWallet: (walletId: string) => void;
  setSelectedChain: (chain: string) => void;
  setSettings: (s: Partial<WalletSettings>) => void;
  hydrate: (partial: Partial<WalletState>) => void;
  reset: () => void;
};

const initial = {
  initialized: false,
  locked: true,
  hydrated: false,
  wallets: [] as Wallet[],
  accounts: [] as WalletAccount[],
  activeWalletId: undefined as string | undefined,
  activeAccountId: undefined as string | undefined,
  settings: DEFAULT_SETTINGS,
};

export const walletStore = create<WalletState>((set) => ({
  ...initial,
  setInitialized: (v) => set({ initialized: v }),
  setLocked: (v) => set({ locked: v }),
  setHydrated: (v) => set({ hydrated: v }),
  setActiveAccount: (accountId) =>
    set((s) => {
      const acc = s.accounts.find((a) => a.id === accountId);
      return acc
        ? { activeAccountId: accountId, activeWalletId: acc.walletId }
        : { activeAccountId: accountId };
    }),
  setActiveWallet: (walletId) => set({ activeWalletId: walletId }),
  setSelectedChain: (chain) =>
    set((s) => ({ settings: { ...s.settings, selectedChain: chain } })),
  setSettings: (p) => set((s) => ({ settings: { ...s.settings, ...p } })),
  hydrate: (p) => set((s) => ({ ...s, ...p })),
  reset: () => set({ ...initial }),
}));

export const selectActiveAccount = (s: WalletState) =>
  s.accounts.find((a) => a.id === s.activeAccountId);

export const selectAccountsByWallet = (walletId: string) => (s: WalletState) =>
  s.accounts.filter((a) => a.walletId === walletId);

export const selectActiveWallet = (s: WalletState) =>
  s.wallets.find((w) => w.id === s.activeWalletId);

export const selectAccountsByChain = (chain: string) => (s: WalletState) =>
  s.accounts.filter((a) => a.chain === chain);
