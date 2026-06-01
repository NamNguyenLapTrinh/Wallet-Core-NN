import { useEffect } from 'react';
import { AppState } from 'react-native';
import { getWalletManager } from '../services/WalletService';

// Only lock when the app actually backgrounds. 'inactive' fires for transient
// system overlays — Face ID / Touch ID prompts, Control Center, incoming calls,
// permission dialogs — which would otherwise lock the wallet mid-sign and force
// the user to re-authenticate on return.
export function useAutoLockOnBackground(): void {
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'background') {
        try {
          getWalletManager().lock();
        } catch {}
      }
    });
    return () => sub.remove();
  }, []);
}
