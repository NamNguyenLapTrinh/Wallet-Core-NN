import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AuthNavigator } from './AuthNavigator';
import { WalletNavigator } from './WalletNavigator';
import {
  walletStore,
  useAutoLockOnBackground,
  initWalletService,
} from 'wallet-manager-module';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const locked = walletStore(s => s.locked);
  const hydrated = walletStore(s => s.hydrated);
  const wallets = walletStore(s => s.wallets);

  console.log('RootNavigator', {
    locked,
    hydrated,
    walletCount: wallets,
  });

  useEffect(() => {
    const manager = initWalletService();
    manager
      .initialize()
      .catch(e => {
        console.error('Failed to initialize wallet service', e);
        walletStore.getState().setHydrated(true);
      })
      .finally(() => {
        console.log('Wallet service initialized');
      });
  }, []);

  useAutoLockOnBackground();

  const showAuth = !hydrated || locked || wallets.length === 0;

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{ headerShown: false, animation: 'fade' }}
      >
        {showAuth ? (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : (
          <Stack.Screen name="Wallet" component={WalletNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
