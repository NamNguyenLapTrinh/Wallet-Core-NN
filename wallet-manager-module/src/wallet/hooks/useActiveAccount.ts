import { walletStore, selectActiveAccount } from '../state/walletStore';

export const useActiveAccount = () => walletStore(selectActiveAccount);

export const useAccountsForWallet = (walletId?: string) =>
  walletStore((s) => (walletId ? s.accounts.filter((a) => a.walletId === walletId) : []));
