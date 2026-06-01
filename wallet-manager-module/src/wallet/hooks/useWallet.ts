import { walletStore, selectActiveWallet } from '../state/walletStore';

export const useWallet = () => walletStore(selectActiveWallet);
export const useWallets = () => walletStore((s) => s.wallets);
export const useWalletLocked = () => walletStore((s) => s.locked);
export const useWalletInitialized = () => walletStore((s) => s.initialized);
