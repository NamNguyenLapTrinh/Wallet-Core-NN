import React, { useEffect } from 'react';
import { View } from 'react-native';
import { Screen, H1, Muted, Body, Button, Spacer } from '../../ui/components';
import { useTheme } from '../../ui/theme';
import { useWalletLock } from 'wallet-manager-module';
import type { AuthScreenProps } from '../../navigation/types';

export const UnlockScreen: React.FC<AuthScreenProps<'Unlock'>> = () => {
  const t = useTheme();
  const { busy, error, unlock } = useWalletLock();

  useEffect(() => {
    unlock();
  }, [unlock]);

  return (
    <Screen>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <H1>Locked</H1>
        <Spacer />
        <Muted>Authenticate to access your wallet.</Muted>
        <Spacer size={32} />
        {error ? (
          <Body style={{ color: t.colors.danger, marginBottom: 16 }}>{error}</Body>
        ) : null}
        <Button label={busy ? 'Authenticating…' : 'Unlock'} loading={busy} onPress={unlock} />
      </View>
    </Screen>
  );
};
