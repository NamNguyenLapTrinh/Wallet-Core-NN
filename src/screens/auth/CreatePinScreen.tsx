import React, { useState } from 'react';
import { View } from 'react-native';
import { Screen, H1, Muted, Input, Button, Spacer } from '../../ui/components';
import type { AuthScreenProps } from '../../navigation/types';

export const CreatePinScreen: React.FC<AuthScreenProps<'CreatePin'>> = ({
  navigation,
  route,
}) => {
  const [pin, setPin] = useState('');
  const valid = /^\d{6}$/.test(pin);

  return (
    <Screen>
      <View style={{ flex: 1 }}>
        <H1>Create PIN</H1>
        <Spacer size={6} />
        <Muted>Choose a 6-digit PIN. You'll use it when biometrics aren't available.</Muted>
        <Spacer size={24} />
        <Input
          label="6-digit PIN"
          value={pin}
          onChangeText={(v) => setPin(v.replace(/[^0-9]/g, '').slice(0, 6))}
          keyboardType="number-pad"
          secureTextEntry
          maxLength={6}
        />
      </View>
      <View style={{ paddingBottom: 32 }}>
        <Button
          label="Continue"
          disabled={!valid}
          onPress={() =>
            navigation.navigate('ConfirmPin', { firstPin: pin, mode: route.params.mode })
          }
        />
      </View>
    </Screen>
  );
};
