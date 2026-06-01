import React from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { Screen, H1, Body, Muted, Card, Row, Spacer } from '../../ui/components';
import { useTheme } from '../../ui/theme';
import {
  walletStore,
  getWalletManager,
} from 'wallet-manager-module';
import { CHAIN_META } from 'wallet-manager-module';
import type { WalletScreenProps } from '../../navigation/types';

export const AccountSelectorScreen: React.FC<WalletScreenProps<'AccountSelector'>> = ({
  navigation,
}) => {
  const t = useTheme();
  const accounts = walletStore((s) => s.accounts);
  const activeId = walletStore((s) => s.activeAccountId);

  const onSelect = async (id: string) => {
    await getWalletManager().switchAccount(id);
    navigation.goBack();
  };

  return (
    <Screen>
      <H1>Accounts</H1>
      <Spacer size={12} />
      <FlatList
        data={accounts}
        keyExtractor={(a) => a.id}
        ItemSeparatorComponent={() => <Spacer size={8} />}
        renderItem={({ item }) => {
          const meta = CHAIN_META[item.chain as keyof typeof CHAIN_META];
          const isActive = item.id === activeId;
          return (
            <Pressable onPress={() => onSelect(item.id)}>
              <Card
                style={{
                  borderColor: isActive ? t.colors.primary : t.colors.border,
                }}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <View>
                    <Body style={{ fontWeight: '600' }}>
                      {item.name ?? `Account ${item.index + 1}`}
                    </Body>
                    <Muted>{meta?.name ?? item.chain}</Muted>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Muted>{item.address.slice(0, 8)}…</Muted>
                    {isActive ? (
                      <Body style={{ color: t.colors.primary, fontWeight: '600' }}>✓</Body>
                    ) : null}
                  </View>
                </Row>
              </Card>
            </Pressable>
          );
        }}
        ListEmptyComponent={<Muted>No accounts yet.</Muted>}
      />
    </Screen>
  );
};
