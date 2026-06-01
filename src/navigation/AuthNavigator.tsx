import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { walletStore } from 'wallet-manager-module';

import { SplashScreen } from '../screens/onboarding/SplashScreen';
import { WelcomeScreen } from '../screens/onboarding/WelcomeScreen';
import { CreateWalletScreen } from '../screens/onboarding/CreateWalletScreen';
import { RestoreWalletScreen } from '../screens/onboarding/RestoreWalletScreen';
import { SecureWalletScreen } from '../screens/onboarding/SecureWalletScreen';
import { UnlockScreen } from '../screens/auth/UnlockScreen';
import { CreatePinScreen } from '../screens/auth/CreatePinScreen';
import { ConfirmPinScreen } from '../screens/auth/ConfirmPinScreen';

import type { AuthStackParamList } from './types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export const AuthNavigator: React.FC = () => {
  const initialized = walletStore(s => s.initialized);
  const hydrated = walletStore(s => s.hydrated);
  const wallets = walletStore(s => s.wallets);

  console.log('AuthNavigator', {
    initialized,
    hydrated,
    walletCount: wallets.length,
  });

  const hasWallet = wallets.length > 0 || initialized;
  const initialRoute: keyof AuthStackParamList = !hydrated
    ? 'Splash'
    : hasWallet
    ? 'Unlock'
    : 'Welcome';

  return (
    <Stack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="CreateWallet" component={CreateWalletScreen} />
      <Stack.Screen name="RestoreWallet" component={RestoreWalletScreen} />
      <Stack.Screen name="SecureWallet" component={SecureWalletScreen} />
      <Stack.Screen name="CreatePin" component={CreatePinScreen} />
      <Stack.Screen name="ConfirmPin" component={ConfirmPinScreen} />
      <Stack.Screen
        name="Unlock"
        component={UnlockScreen}
        options={{ gestureEnabled: false }}
      />
    </Stack.Navigator>
  );
};
