import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import {
  Screen,
  H1,
  Muted,
  Body,
  Input,
  Button,
  Card,
  Row,
  Spacer,
} from '../../ui/components';
import { useTheme } from '../../ui/theme';
import {
  walletStore,
  getWalletManager,
} from 'wallet-manager-module';
import { CHAIN_META } from 'wallet-manager-module';
import type { WalletScreenProps } from '../../navigation/types';

const ADDRESS_RULES: Record<string, RegExp> = {
  ethereum: /^0x[a-fA-F0-9]{40}$/,
  bitcoin: /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,62}$/,
  solana: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
  ton: /^(EQ|UQ|kQ|0Q)[A-Za-z0-9_-]{46}$/,
};

const validateAddress = (chain: string, address: string) => {
  const r = ADDRESS_RULES[chain];
  if (!r) return true;
  return r.test(address.trim());
};

const validateAmount = (amount: string) => {
  if (!amount) return false;
  const n = Number(amount);
  return Number.isFinite(n) && n > 0;
};

export const SendScreen: React.FC<WalletScreenProps<'Send'>> = ({ route, navigation }) => {
  const t = useTheme();
  const account = walletStore((s) => s.accounts.find((a) => a.id === route.params.accountId));
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const meta = useMemo(
    () => (account ? CHAIN_META[account.chain as keyof typeof CHAIN_META] : undefined),
    [account],
  );

  if (!account || !meta) {
    return (
      <Screen>
        <Muted>Account not found.</Muted>
      </Screen>
    );
  }

  const addressOk = validateAddress(account.chain, to);
  const amountOk = validateAmount(amount);
  const canSubmit = addressOk && amountOk;

  const onSend = async () => {
    setBusy(true);
    setError(null);
    try {
      const draft = {
        chain: account.chain,
        to,
        amount,
        from: account.address,
      };
      const inputB64 = Buffer.from(JSON.stringify(draft), 'utf-8').toString('base64');
      const signed = await getWalletManager().signTransaction(account.id, inputB64);
      Alert.alert(
        'Signed',
        `Signed payload ready to broadcast.\n\n${signed.slice(0, 40)}…`,
        [{ text: 'OK', onPress: () => navigation.goBack() }],
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <H1>Send {meta.symbol}</H1>
        <Spacer size={6} />
        <Muted>From {account.name ?? `Account ${account.index + 1}`}</Muted>
        <Spacer size={20} />

        <Input
          label="Recipient address"
          value={to}
          onChangeText={(v) => {
            setError(null);
            setTo(v);
          }}
          placeholder={`${meta.name} address`}
          autoCapitalize="none"
          autoCorrect={false}
          error={to && !addressOk ? `Invalid ${meta.name} address` : undefined}
        />

        <Input
          label={`Amount (${meta.symbol})`}
          value={amount}
          onChangeText={(v) => setAmount(v.replace(/[^0-9.]/g, ''))}
          placeholder="0.0"
          keyboardType="decimal-pad"
        />

        <Card>
          <Row style={{ justifyContent: 'space-between' }}>
            <Muted>Network fee</Muted>
            <Body>~ estimating…</Body>
          </Row>
          <Spacer size={6} />
          <Row style={{ justifyContent: 'space-between' }}>
            <Muted>Total</Muted>
            <Body>{amountOk ? `${amount} ${meta.symbol}` : '—'}</Body>
          </Row>
        </Card>

        {error ? (
          <>
            <Spacer />
            <Body style={{ color: t.colors.danger }}>{error}</Body>
          </>
        ) : null}
      </ScrollView>

      <View style={{ paddingBottom: 32 }}>
        <Button label="Sign & send" loading={busy} disabled={!canSubmit} onPress={onSend} />
      </View>
    </Screen>
  );
};
