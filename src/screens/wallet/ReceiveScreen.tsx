import React from 'react';
import { Alert, Pressable, View } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { Screen, H1, H2, Muted, Body, Card, Spacer, Button } from '../../ui/components';
import { useTheme } from '../../ui/theme';
import { walletStore } from 'wallet-manager-module';
import { CHAIN_META } from 'wallet-manager-module';
import type { WalletScreenProps } from '../../navigation/types';

export const ReceiveScreen: React.FC<WalletScreenProps<'Receive'>> = ({ route }) => {
  const t = useTheme();
  const account = walletStore((s) => s.accounts.find((a) => a.id === route.params.accountId));

  if (!account) {
    return (
      <Screen>
        <Muted>Account not found.</Muted>
      </Screen>
    );
  }

  const meta = CHAIN_META[account.chain as keyof typeof CHAIN_META];

  const onCopy = () => {
    Clipboard.setString(account.address);
    Alert.alert('Copied', 'Address copied to clipboard');
  };

  return (
    <Screen>
      <View style={{ alignItems: 'center', paddingTop: 16 }}>
        <H1>Receive {meta?.symbol}</H1>
        <Spacer size={4} />
        <Muted>Send only {meta?.name} assets to this address.</Muted>
      </View>

      <Spacer size={24} />
      <Card style={{ alignItems: 'center' }}>
        <View
          style={{
            width: 200,
            height: 200,
            borderRadius: t.radius.md,
            borderWidth: 1,
            borderStyle: 'dashed',
            borderColor: t.colors.border,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Muted>QR code</Muted>
          <Muted>(integrate react-native-qrcode-svg)</Muted>
        </View>
        <Spacer size={16} />
        <Pressable onPress={onCopy} hitSlop={12}>
          <H2 style={{ textAlign: 'center' }}>{account.address}</H2>
        </Pressable>
      </Card>

      <Spacer size={24} />
      <Button label="Copy address" onPress={onCopy} />
      <Spacer />
      <Body style={{ color: t.colors.textMuted, textAlign: 'center' }}>
        Account {account.index + 1} • {meta?.name}
      </Body>
    </Screen>
  );
};
