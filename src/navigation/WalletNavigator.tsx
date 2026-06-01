import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { HomeScreen } from '../screens/wallet/HomeScreen';
import { WalletDetailScreen } from '../screens/wallet/WalletDetailScreen';
import { AccountSelectorScreen } from '../screens/wallet/AccountSelectorScreen';
import { AddAccountScreen } from '../screens/wallet/AddAccountScreen';
import { ReceiveScreen } from '../screens/wallet/ReceiveScreen';
import { SendScreen } from '../screens/wallet/SendScreen';
import { TokenDetailScreen } from '../screens/wallet/TokenDetailScreen';
import { SettingsScreen } from '../screens/wallet/SettingsScreen';

import type { WalletStackParamList } from './types';

const Stack = createNativeStackNavigator<WalletStackParamList>();

export const WalletNavigator: React.FC = () => (
  <Stack.Navigator
    initialRouteName="Home"
    screenOptions={{
      headerShown: true,
      headerBackTitle: '',
      animation: 'slide_from_right',
    }}>
    <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
    <Stack.Screen name="WalletDetail" component={WalletDetailScreen} options={{ title: 'Wallet' }} />
    <Stack.Screen
      name="AccountSelector"
      component={AccountSelectorScreen}
      options={{ title: 'Accounts', presentation: 'modal' }}
    />
    <Stack.Screen name="AddAccount" component={AddAccountScreen} options={{ title: 'Add Account' }} />
    <Stack.Screen name="Receive" component={ReceiveScreen} options={{ title: 'Receive' }} />
    <Stack.Screen name="Send" component={SendScreen} options={{ title: 'Send' }} />
    <Stack.Screen name="TokenDetail" component={TokenDetailScreen} options={{ title: 'Token' }} />
    <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
  </Stack.Navigator>
);
