import React, { useMemo, useState } from 'react';
import { FlatList, View, Pressable } from 'react-native';
import {
  Screen,
  H1,
  H2,
  Muted,
  Body,
  Button,
  Card,
  Row,
  Spacer,
} from '../../ui/components';
import { useTheme } from '../../ui/theme';
import {
  useActiveAccount,
  walletStore,
  getWalletManager,
} from 'wallet-manager-module';
import { CHAIN_META, NATIVE_TOKENS } from 'wallet-manager-module';
import type { WalletScreenProps } from '../../navigation/types';

const TEST_MESSAGE = 'Hello from TrustWalletFork';

const truncate = (addr: string) =>
  addr.length > 12 ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : addr;

export const HomeScreen: React.FC<WalletScreenProps<'Home'>> = ({
  navigation,
}) => {
  const t = useTheme();
  const active = useActiveAccount();
  const accounts = walletStore(s => s.accounts);

  const [signing, setSigning] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  const [signError, setSignError] = useState<string | null>(null);

  const onSignTest = async () => {
    if (!active) return;
    setSigning(true);
    setSignError(null);
    try {
      const sig = await getWalletManager().signMessage(active.id, TEST_MESSAGE);
      setSignature(sig);
      console.log('Signature', sig);
    } catch (e) {
      console.error('Error signing message', e);
      setSignError(e instanceof Error ? e.message : String(e));
    } finally {
      setSigning(false);
    }
  };

  const tokens = useMemo(() => {
    if (!active) return [];
    const native = NATIVE_TOKENS[active.chain];
    return native ? [native] : [];
  }, [active]);

  if (!active) {
    return (
      <Screen>
        <View
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        >
          <H2>No account</H2>
          <Spacer />
          <Muted>Create or restore a wallet to get started.</Muted>
        </View>
      </Screen>
    );
  }

  console.log('Active account', signature);
  const chainMeta = CHAIN_META[active.chain as keyof typeof CHAIN_META];

  return (
    <Screen>
      <View style={{ paddingTop: 8 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Pressable onPress={() => navigation.navigate('AccountSelector')}>
            <Row gap={6}>
              <H2>{active.name ?? `Account ${active.index + 1}`}</H2>
              <Body style={{ color: t.colors.textMuted }}>▾</Body>
            </Row>
            <Muted>{truncate(active.address)}</Muted>
          </Pressable>
          <Pressable onPress={() => navigation.navigate('Settings')}>
            <Body style={{ fontSize: 22 }}>⚙︎</Body>
          </Pressable>
        </Row>

        <Spacer size={24} />
        <View style={{ alignItems: 'center' }}>
          <Muted>Total balance</Muted>
          <Spacer size={4} />
          <H1>$0.00</H1>
          <Muted>0 {chainMeta?.symbol ?? ''}</Muted>
        </View>

        <Spacer size={24} />
        <Row gap={12} style={{ justifyContent: 'center' }}>
          <Button
            fullWidth={false}
            label="Send"
            onPress={() =>
              navigation.navigate('Send', { accountId: active.id })
            }
          />
          <Button
            fullWidth={false}
            label="Receive"
            variant="secondary"
            onPress={() =>
              navigation.navigate('Receive', { accountId: active.id })
            }
          />
          <Button
            fullWidth={false}
            label="+ Add"
            variant="secondary"
            onPress={() =>
              navigation.navigate('AddAccount', { walletId: active.walletId })
            }
          />
        </Row>
      </View>

      <Spacer size={24} />
      <Card>
        <Body style={{ fontWeight: '600' }}>Message</Body>
        <Spacer size={4} />
        <Muted>Message: "{TEST_MESSAGE}"</Muted>
        <Spacer size={8} />
        <Button
          label={signing ? 'Signing…' : 'Sign'}
          onPress={onSignTest}
          disabled={signing}
        />
        <>
          <Spacer size={8} />
          <Muted>Signature</Muted>
          <Body selectable style={{ fontFamily: 'Courier' }}>
            {signature}
          </Body>
        </>
        {signError && (
          <>
            <Spacer size={8} />
            <Body style={{ color: t.colors.danger }}>{signError}</Body>
          </>
        )}
      </Card>

      <Spacer size={24} />
      <H2>Tokens</H2>
      <Spacer />
      <FlatList
        data={tokens}
        keyExtractor={item => item.id}
        ItemSeparatorComponent={() => <Spacer size={8} />}
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              navigation.navigate('TokenDetail', {
                tokenId: item.id,
                accountId: active.id,
              })
            }
          >
            <Card>
              <Row style={{ justifyContent: 'space-between' }}>
                <View>
                  <Body style={{ fontWeight: '600' }}>{item.symbol}</Body>
                  <Muted>{item.name}</Muted>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Body>0</Body>
                  <Muted>$0.00</Muted>
                </View>
              </Row>
            </Card>
          </Pressable>
        )}
        ListEmptyComponent={
          <Card>
            <Body>No tokens on this account yet.</Body>
            <Muted>{accounts.length} accounts total.</Muted>
          </Card>
        }
      />
    </Screen>
  );
};
