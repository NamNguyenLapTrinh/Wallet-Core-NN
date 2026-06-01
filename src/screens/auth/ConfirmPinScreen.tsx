import React, { useState } from 'react';
import { View } from 'react-native';
import { Screen, H1, Muted, Input, Button, Spacer } from '../../ui/components';
import { secureStorage } from 'wallet-manager-module';
import { walletStore } from 'wallet-manager-module';
import type { AuthScreenProps } from '../../navigation/types';

const PIN_HASH_KEY = 'wallet.pin.hash';

const hash = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return String(h);
};

export const ConfirmPinScreen: React.FC<AuthScreenProps<'ConfirmPin'>> = ({
  navigation,
  route,
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onConfirm = async () => {
    if (pin !== route.params.firstPin) {
      setError('PINs do not match');
      setPin('');
      return;
    }
    setBusy(true);
    try {
      await secureStorage.setItem(PIN_HASH_KEY, hash(pin));
      walletStore.getState().setLocked(false);
      walletStore.getState().setInitialized(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <View style={{ flex: 1 }}>
        <H1>Confirm PIN</H1>
        <Spacer size={6} />
        <Muted>Re-enter your 6-digit PIN.</Muted>
        <Spacer size={24} />
        <Input
          label="Re-enter PIN"
          value={pin}
          onChangeText={(v) => {
            setError(null);
            setPin(v.replace(/[^0-9]/g, '').slice(0, 6));
          }}
          keyboardType="number-pad"
          secureTextEntry
          maxLength={6}
          error={error ?? undefined}
        />
      </View>
      <View style={{ paddingBottom: 32 }}>
        <Button label="Confirm" disabled={pin.length !== 6} loading={busy} onPress={onConfirm} />
      </View>
    </Screen>
  );
};
