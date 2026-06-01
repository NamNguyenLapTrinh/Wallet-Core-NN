import React from 'react';
import { View } from 'react-native';
import { Screen, H1, Muted, Button, Spacer } from '../../ui/components';
import type { AuthScreenProps } from '../../navigation/types';

export const WelcomeScreen: React.FC<AuthScreenProps<'Welcome'>> = ({ navigation }) => (
  <Screen>
    <View style={{ flex: 1, justifyContent: 'center' }}>
      <H1>Welcome</H1>
      <Spacer size={8} />
      <Muted>Multi-chain self-custody wallet — Ethereum, Bitcoin, Solana, TON.</Muted>
    </View>
    <View style={{ paddingBottom: 32 }}>
      <Button
        label="Create new wallet"
        onPress={() => navigation.navigate('CreateWallet')}
      />
      <Spacer />
      <Button
        label="I already have a wallet"
        variant="secondary"
        onPress={() => navigation.navigate('RestoreWallet')}
      />
    </View>
  </Screen>
);
