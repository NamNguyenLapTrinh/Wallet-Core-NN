import { useCallback, useState } from 'react';
import { walletStore } from '../state/walletStore';
import { getWalletManager } from '../services/WalletService';

export type UseWalletLock = {
  locked: boolean;
  initialized: boolean;
  busy: boolean;
  error: string | null;
  unlock: () => Promise<boolean>;
  lock: () => void;
};

export const useWalletLock = (): UseWalletLock => {
  const locked = walletStore(s => s.locked);
  const initialized = walletStore(s => s.initialized);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const unlock = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      await getWalletManager().unlock();

      return true;
    } catch (e) {
      console.error('Error unlocking wallet', e);
      setError((e as Error).message ?? 'Unlock failed');
      return false;
    } finally {
      setBusy(false);
    }
  }, []);

  const lock = useCallback(() => {
    try {
      getWalletManager().lock();
    } catch {
      // manager not initialized — nothing to lock
    }
  }, []);

  return { locked, initialized, busy, error, unlock, lock };
};
