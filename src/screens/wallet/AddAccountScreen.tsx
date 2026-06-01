import React, { useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { Screen, H1, Body, Muted, Card, Spacer, Button } from '../../ui/components';
import { useTheme } from '../../ui/theme';
import { getWalletManager } from 'wallet-manager-module';
import { ALL_CHAINS, CHAIN_META } from 'wallet-manager-module';
import type { WalletScreenProps } from '../../navigation/types';

export const AddAccountScreen: React.FC<WalletScreenProps<'AddAccount'>> = ({
  navigation,
  route,
}) => {
  const t = useTheme();
  const [selected, setSelected] = useState<string>('ethereum');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onAdd = async () => {
    setBusy(true);
    setError(null);
    try {
      await getWalletManager().addAccount({
        walletId: route.params.walletId,
        chain: selected,
      });
      navigation.goBack();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <H1>Add account</H1>
      <Muted>Pick the chain for the new account.</Muted>
      <Spacer size={16} />
      <FlatList
        data={ALL_CHAINS}
        keyExtractor={(c) => c}
        ItemSeparatorComponent={() => <Spacer size={8} />}
        renderItem={({ item }) => {
          const meta = CHAIN_META[item];
          const isActive = item === selected;
          return (
            <Pressable onPress={() => setSelected(item)}>
              <Card
                style={{
                  borderColor: isActive ? t.colors.primary : t.colors.border,
                }}>
                <View>
                  <Body style={{ fontWeight: '600' }}>{meta.name}</Body>
                  <Muted>{meta.symbol}</Muted>
                </View>
              </Card>
            </Pressable>
          );
        }}
      />
      <Spacer size={16} />
      {error ? (
        <Body style={{ color: t.colors.danger, marginBottom: 8 }}>{error}</Body>
      ) : null}
      <Button label="Add" loading={busy} onPress={onAdd} />
    </Screen>
  );
};
