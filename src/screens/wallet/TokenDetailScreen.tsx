import React from 'react';
import { View } from 'react-native';
import {
  Screen,
  H1,
  H2,
  Muted,
  Body,
  Card,
  Row,
  Spacer,
  Button,
} from '../../ui/components';
import {
  walletStore,
} from 'wallet-manager-module';
import { CHAIN_META, NATIVE_TOKENS } from 'wallet-manager-module';
import type { WalletScreenProps } from '../../navigation/types';

export const TokenDetailScreen: React.FC<WalletScreenProps<'TokenDetail'>> = ({
  route,
  navigation,
}) => {
  const account = walletStore((s) => s.accounts.find((a) => a.id === route.params.accountId));
  const token =
    Object.values(NATIVE_TOKENS).find((tk) => tk.id === route.params.tokenId) ?? null;

  if (!account || !token) {
    return (
      <Screen>
        <Muted>Token or account not found.</Muted>
      </Screen>
    );
  }

  const meta = CHAIN_META[token.chain as keyof typeof CHAIN_META];

  return (
    <Screen>
      <View style={{ alignItems: 'center', paddingTop: 16 }}>
        <Muted>{meta?.name}</Muted>
        <H1>{token.symbol}</H1>
        <Spacer size={4} />
        <H2>0 {token.symbol}</H2>
        <Muted>$0.00</Muted>
      </View>

      <Spacer size={24} />
      <Row gap={12} style={{ justifyContent: 'center' }}>
        <Button
          fullWidth={false}
          label="Send"
          onPress={() => navigation.navigate('Send', { accountId: account.id })}
        />
        <Button
          fullWidth={false}
          variant="secondary"
          label="Receive"
          onPress={() => navigation.navigate('Receive', { accountId: account.id })}
        />
      </Row>

      <Spacer size={24} />
      <H2>Activity</H2>
      <Spacer />
      <Card>
        <Body>No recent transactions.</Body>
        <Muted>Activity history requires an indexer integration.</Muted>
      </Card>
    </Screen>
  );
};
