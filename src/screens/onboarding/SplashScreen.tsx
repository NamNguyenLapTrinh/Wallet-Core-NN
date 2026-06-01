import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Screen, H1, Muted, Spacer } from '../../ui/components';
import { useTheme } from '../../ui/theme';
import { walletStore } from 'wallet-manager-module';
import type { AuthScreenProps } from '../../navigation/types';

export const SplashScreen: React.FC<AuthScreenProps<'Splash'>> = ({ navigation }) => {
  const t = useTheme();
  const hydrated = walletStore((s) => s.hydrated);
  const wallets = walletStore((s) => s.wallets);

  useEffect(() => {
    if (!hydrated) return;
    if (wallets.length > 0) {
      navigation.reset({ index: 0, routes: [{ name: 'Unlock' }] });
    } else {
      navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
    }
  }, [hydrated, wallets.length, navigation]);

  return (
    <Screen>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <H1>TrustWalletFork</H1>
        <Spacer />
        <Muted>Initializing secure wallet…</Muted>
        <Spacer size={24} />
        <ActivityIndicator color={t.colors.primary} />
      </View>
    </Screen>
  );
};
