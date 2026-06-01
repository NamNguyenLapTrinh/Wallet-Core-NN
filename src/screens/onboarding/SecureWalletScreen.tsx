import React, { useMemo, useState } from 'react';
import { ScrollView, View, Pressable } from 'react-native';
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
import { wipeString } from 'wallet-manager-module';
import type { AuthScreenProps } from '../../navigation/types';

const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export const SecureWalletScreen: React.FC<AuthScreenProps<'SecureWallet'>> = ({
  navigation,
  route,
}) => {
  const t = useTheme();
  const original = useMemo(() => route.params.mnemonic.split(' '), [route.params.mnemonic]);
  const choices = useMemo(() => shuffle(original), [original]);
  const [picked, setPicked] = useState<string[]>([]);

  const correct = picked.length === original.length && picked.every((w, i) => w === original[i]);

  const onWord = (word: string) => {
    if (picked.includes(word)) {
      setPicked(picked.filter((w) => w !== word));
    } else if (picked.length < original.length) {
      setPicked([...picked, word]);
    }
  };

  const onContinue = () => {
    wipeString(route.params.mnemonic);
    navigation.reset({
      index: 0,
      routes: [{ name: 'CreatePin', params: { mode: 'create' } }],
    });
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <H1>Confirm phrase</H1>
        <Spacer size={6} />
        <Muted>Tap the words in the order they were shown.</Muted>
        <Spacer size={16} />

        <Card>
          {picked.length === 0 ? (
            <Muted>No words selected</Muted>
          ) : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {picked.map((w, i) => (
                <View
                  key={`${i}-${w}`}
                  style={{
                    width: '50%',
                    paddingVertical: 4,
                    flexDirection: 'row',
                  }}>
                  <Muted style={{ width: 28 }}>{i + 1}.</Muted>
                  <Body
                    style={{
                      color: original[i] === w ? t.colors.text : t.colors.danger,
                    }}>
                    {w}
                  </Body>
                </View>
              ))}
            </View>
          )}
        </Card>

        <Spacer size={20} />
        <H2>Choose</H2>
        <Spacer size={8} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {choices.map((w, i) => {
            const used = picked.includes(w);
            return (
              <Pressable
                key={`${i}-${w}`}
                onPress={() => onWord(w)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: t.radius.pill,
                  borderWidth: 1,
                  borderColor: t.colors.border,
                  backgroundColor: used ? t.colors.surfaceAlt : t.colors.surface,
                  opacity: used ? 0.5 : 1,
                }}>
                <Body>{w}</Body>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View style={{ paddingBottom: 32 }}>
        <Button label="Continue" disabled={!correct} onPress={onContinue} />
      </View>
    </Screen>
  );
};
