import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Screen, H1, Muted, Button, Input, Spacer } from '../../ui/components';
import { getWalletManager } from 'wallet-manager-module';
import { wipeString } from 'wallet-manager-module';
import type { AuthScreenProps } from '../../navigation/types';

const normalizePhrase = (raw: string) =>
  raw.trim().replace(/\s+/g, ' ').toLowerCase();

const isPlausible = (phrase: string) => {
  const n = phrase.split(' ').length;
  return n === 12 || n === 15 || n === 18 || n === 21 || n === 24;
};

export const RestoreWalletScreen: React.FC<AuthScreenProps<'RestoreWallet'>> = ({
  navigation,
}) => {
  const [phrase, setPhrase] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onRestore = async () => {
    const normalized = normalizePhrase(phrase);
    if (!isPlausible(normalized)) {
      setError('Phrase must be 12, 15, 18, 21, or 24 words');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await getWalletManager().restoreWallet({
        mnemonic: normalized,
        chain: 'ethereum',
      });
      wipeString(normalized);
      setPhrase('');
      navigation.reset({ index: 0, routes: [{ name: 'CreatePin', params: { mode: 'create' } }] });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <H1>Restore wallet</H1>
        <Spacer size={6} />
        <Muted>Enter your 12 or 24-word recovery phrase, separated by spaces.</Muted>
        <Spacer size={20} />
        <Input
          label="Recovery phrase"
          value={phrase}
          onChangeText={setPhrase}
          placeholder="word word word…"
          autoCapitalize="none"
          autoCorrect={false}
          multiline
          numberOfLines={4}
          style={{ height: 140, textAlignVertical: 'top', paddingTop: 12 }}
          error={error ?? undefined}
        />
      </ScrollView>
      <View style={{ paddingBottom: 32 }}>
        <Button
          label="Restore"
          loading={busy}
          disabled={!phrase.trim()}
          onPress={onRestore}
        />
      </View>
    </Screen>
  );
};
