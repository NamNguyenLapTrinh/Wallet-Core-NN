import React from 'react';
import { FlatList, View } from 'react-native';
import { Screen, H1, Body, Muted, Card, Row, Spacer, Button } from '../../ui/components';
import { walletStore } from 'wallet-manager-module';
import { CHAIN_META } from 'wallet-manager-module';
import type { WalletScreenProps } from '../../navigation/types';

export const WalletDetailScreen: React.FC<WalletScreenProps<'WalletDetail'>> = ({
  route,
  navigation,
}) => {
  const wallet = walletStore((s) => s.wallets.find((w) => w.id === route.params.walletId));
  const accounts = walletStore((s) =>
    s.accounts.filter((a) => a.walletId === route.params.walletId),
  );

  if (!wallet) {
    return (
      <Screen>
        <Muted>Wallet not found.</Muted>
      </Screen>
    );
  }

  return (
    <Screen>
      <H1>{wallet.name}</H1>
      <Muted>{wallet.type.toUpperCase()} • {accounts.length} accounts</Muted>
      <Spacer size={16} />
      <Button
        label="Add account"
        onPress={() => navigation.navigate('AddAccount', { walletId: wallet.id })}
      />
      <Spacer size={16} />
      <FlatList
        data={accounts}
        keyExtractor={(a) => a.id}
        ItemSeparatorComponent={() => <Spacer size={8} />}
        renderItem={({ item }) => {
          const meta = CHAIN_META[item.chain as keyof typeof CHAIN_META];
          return (
            <Card>
              <Row style={{ justifyContent: 'space-between' }}>
                <View>
                  <Body style={{ fontWeight: '600' }}>
                    {item.name ?? `Account ${item.index + 1}`}
                  </Body>
                  <Muted>{meta?.name ?? item.chain}</Muted>
                </View>
                <Muted>{item.address.slice(0, 8)}…</Muted>
              </Row>
            </Card>
          );
        }}
      />
    </Screen>
  );
};
