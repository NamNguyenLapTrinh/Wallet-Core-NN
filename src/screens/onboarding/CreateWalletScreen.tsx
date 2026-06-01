import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import {
  Screen,
  H1,
  H2,
  Muted,
  Body,
  Button,
  Card,
  Spacer,
} from '../../ui/components';
import { useTheme } from '../../ui/theme';
import type { AuthScreenProps } from '../../navigation/types';
import { getWalletManager } from 'wallet-manager-module';
import { wipeString } from 'wallet-manager-module';

export const CreateWalletScreen: React.FC<AuthScreenProps<'CreateWallet'>> = ({
  navigation,
}) => {
  const t = useTheme();
  const [mnemonic, setMnemonic] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [generating, setGenerating] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const m = await getWalletManager().createWallet({ chain: 'ethereum' });
        if (!mounted) {
          wipeString(m.mnemonic);
          return;
        }
        setMnemonic(m.mnemonic);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        if (mounted) setGenerating(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const onContinue = () => {
    if (!mnemonic) return;
    navigation.navigate('SecureWallet', { mnemonic });
    setMnemonic(null);
  };

  const onCancel = () => {
    Alert.alert(
      'Discard wallet?',
      'Discarding now will delete the generated wallet.',
      [
        { text: 'Keep', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: async () => {
            if (mnemonic) wipeString(mnemonic);
            navigation.goBack();
          },
        },
      ],
    );
  };

  const words = mnemonic?.split(' ') ?? [];

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <H1>Recovery phrase</H1>
        <Spacer size={6} />
        <Muted>
          Write these 12 words in order and keep them somewhere safe. Anyone
          with this phrase controls your wallet.
        </Muted>
        <Spacer size={20} />

        {generating ? (
          <Card>
            <Body>Generating secure phrase…</Body>
          </Card>
        ) : error ? (
          <Card>
            <Body style={{ color: t.colors.danger }}>{error}</Body>
          </Card>
        ) : (
          <Card>
            {!revealed ? (
              <View style={{ alignItems: 'center', paddingVertical: 12 }}>
                <H2>Tap to reveal</H2>
                <Spacer />
                <Muted>Make sure no one is looking.</Muted>
                <Spacer />
                <Button
                  label="Reveal"
                  variant="secondary"
                  fullWidth={false}
                  onPress={() => setRevealed(true)}
                />
              </View>
            ) : (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {words.map((w, i) => (
                  <View
                    key={`${i}-${w}`}
                    style={{
                      width: '50%',
                      paddingVertical: 6,
                      flexDirection: 'row',
                    }}
                  >
                    <Muted style={{ width: 28 }}>{i + 1}.</Muted>
                    <Body>{w}</Body>
                  </View>
                ))}
              </View>
            )}
          </Card>
        )}
      </ScrollView>

      <View style={{ paddingBottom: 32 }}>
        <Button
          label="I've saved it"
          disabled={!revealed || generating || !mnemonic}
          onPress={onContinue}
        />
        <Spacer />
        <Button label="Cancel" variant="ghost" onPress={onCancel} />
      </View>
    </Screen>
  );
};
