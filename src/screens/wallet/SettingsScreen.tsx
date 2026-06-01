import React from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import {
  Screen,
  H1,
  H2,
  Body,
  Muted,
  Card,
  Row,
  Spacer,
  Button,
} from '../../ui/components';
import { useTheme } from '../../ui/theme';
import {
  walletStore,
  getWalletManager,
} from 'wallet-manager-module';
import type { WalletScreenProps } from '../../navigation/types';

export const SettingsScreen: React.FC<WalletScreenProps<'Settings'>> = ({ navigation }) => {
  const t = useTheme();
  const settings = walletStore((s) => s.settings);
  const wallets = walletStore((s) => s.wallets);

  const setSetting = walletStore((s) => s.setSettings);

  const onLock = () => {
    getWalletManager().lock();
  };

  const onWipe = () => {
    Alert.alert(
      'Wipe wallet?',
      'This will delete all wallet data on this device. Make sure you have your recovery phrase.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Wipe',
          style: 'destructive',
          onPress: async () => {
            for (const w of wallets) {
              await getWalletManager().removeWallet(w.id);
            }
            walletStore.getState().reset();
          },
        },
      ],
    );
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingVertical: 16 }}>
        <H1>Settings</H1>
        <Spacer size={16} />

        <H2>Security</H2>
        <Spacer size={8} />
        <Card>
          <Row style={{ justifyContent: 'space-between' }}>
            <Body>Auto-lock</Body>
            <Muted>{Math.round(settings.autoLockMs / 60000)} min</Muted>
          </Row>
          <Spacer size={8} />
          <Row style={{ justifyContent: 'space-between' }}>
            <Body>Unlock method</Body>
            <Muted>{settings.unlockMethod}</Muted>
          </Row>
        </Card>

        <Spacer size={16} />
        <H2>Appearance</H2>
        <Spacer size={8} />
        <Card>
          <Row gap={8}>
            {(['system', 'light', 'dark'] as const).map((a) => {
              const active = settings.appearance === a;
              return (
                <Pressable
                  key={a}
                  onPress={() => setSetting({ appearance: a })}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    borderRadius: t.radius.md,
                    borderWidth: 1,
                    borderColor: active ? t.colors.primary : t.colors.border,
                    alignItems: 'center',
                  }}>
                  <Body>{a}</Body>
                </Pressable>
              );
            })}
          </Row>
        </Card>

        <Spacer size={16} />
        <H2>Wallets</H2>
        <Spacer size={8} />
        {wallets.map((w) => (
          <View key={w.id} style={{ marginBottom: 8 }}>
            <Pressable onPress={() => navigation.navigate('WalletDetail', { walletId: w.id })}>
              <Card>
                <Body style={{ fontWeight: '600' }}>{w.name}</Body>
                <Muted>{w.type.toUpperCase()} • {w.chains.length} chains</Muted>
              </Card>
            </Pressable>
          </View>
        ))}

        <Spacer size={24} />
        <Button label="Lock now" variant="secondary" onPress={onLock} />
        <Spacer />
        <Button label="Wipe wallet" variant="danger" onPress={onWipe} />
      </ScrollView>
    </Screen>
  );
};
