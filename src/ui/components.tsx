import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  PressableProps,
  StyleSheet,
  Text,
  TextProps,
  View,
  ViewProps,
  TextInput,
  TextInputProps,
  SafeAreaView,
} from 'react-native';
import { useTheme, Theme } from './theme';

export const Screen: React.FC<ViewProps> = ({ children, style, ...rest }) => {
  const t = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.background }}>
      <View style={[{ flex: 1, paddingHorizontal: t.spacing(5) }, style]} {...rest}>
        {children}
      </View>
    </SafeAreaView>
  );
};

export const H1: React.FC<TextProps> = ({ style, ...rest }) => {
  const t = useTheme();
  return (
    <Text
      style={[
        { color: t.colors.text, fontSize: t.fontSize.xxl, fontWeight: t.fontWeight.bold },
        style,
      ]}
      {...rest}
    />
  );
};

export const H2: React.FC<TextProps> = ({ style, ...rest }) => {
  const t = useTheme();
  return (
    <Text
      style={[
        { color: t.colors.text, fontSize: t.fontSize.xl, fontWeight: t.fontWeight.semibold },
        style,
      ]}
      {...rest}
    />
  );
};

export const Body: React.FC<TextProps> = ({ style, ...rest }) => {
  const t = useTheme();
  return (
    <Text style={[{ color: t.colors.text, fontSize: t.fontSize.md }, style]} {...rest} />
  );
};

export const Muted: React.FC<TextProps> = ({ style, ...rest }) => {
  const t = useTheme();
  return (
    <Text
      style={[{ color: t.colors.textMuted, fontSize: t.fontSize.sm }, style]}
      {...rest}
    />
  );
};

export type ButtonProps = Omit<PressableProps, 'children'> & {
  label: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  loading?: boolean;
  fullWidth?: boolean;
};

export const Button: React.FC<ButtonProps> = ({
  label,
  variant = 'primary',
  loading = false,
  fullWidth = true,
  disabled,
  style,
  ...rest
}) => {
  const t = useTheme();
  const s = styles(t);
  const variantStyle = (() => {
    switch (variant) {
      case 'primary':
        return { bg: t.colors.primary, fg: t.colors.primaryText, border: t.colors.primary };
      case 'secondary':
        return { bg: t.colors.surface, fg: t.colors.text, border: t.colors.border };
      case 'ghost':
        return { bg: 'transparent', fg: t.colors.primary, border: 'transparent' };
      case 'danger':
        return { bg: t.colors.danger, fg: '#FFFFFF', border: t.colors.danger };
    }
  })();
  const isDisabled = disabled || loading;
  return (
    <Pressable
      style={({ pressed }) => [
        s.button,
        {
          backgroundColor: variantStyle.bg,
          borderColor: variantStyle.border,
          opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
        },
        style as any,
      ]}
      disabled={isDisabled}
      {...rest}>
      {loading ? (
        <ActivityIndicator color={variantStyle.fg} />
      ) : (
        <Text style={[s.buttonLabel, { color: variantStyle.fg }]}>{label}</Text>
      )}
    </Pressable>
  );
};

export type InputProps = TextInputProps & {
  label?: string;
  error?: string;
};

export const Input: React.FC<InputProps> = ({ label, error, style, ...rest }) => {
  const t = useTheme();
  const s = styles(t);
  return (
    <View style={{ marginBottom: t.spacing(3) }}>
      {label ? <Muted style={{ marginBottom: t.spacing(1) }}>{label}</Muted> : null}
      <TextInput
        placeholderTextColor={t.colors.textMuted}
        style={[
          s.input,
          {
            color: t.colors.text,
            backgroundColor: t.colors.surface,
            borderColor: error ? t.colors.danger : t.colors.border,
          },
          style,
        ]}
        {...rest}
      />
      {error ? (
        <Text style={{ color: t.colors.danger, fontSize: t.fontSize.xs, marginTop: 4 }}>
          {error}
        </Text>
      ) : null}
    </View>
  );
};

export const Card: React.FC<ViewProps> = ({ children, style, ...rest }) => {
  const t = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: t.colors.surface,
          borderRadius: t.radius.md,
          padding: t.spacing(4),
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: t.colors.border,
        },
        style,
      ]}
      {...rest}>
      {children}
    </View>
  );
};

export const Row: React.FC<ViewProps & { gap?: number }> = ({
  children,
  style,
  gap = 8,
  ...rest
}) => (
  <View
    style={[{ flexDirection: 'row', alignItems: 'center', gap }, style]}
    {...rest}>
    {children}
  </View>
);

export const Spacer: React.FC<{ size?: number }> = ({ size = 12 }) => (
  <View style={{ height: size }} />
);

const styles = (t: Theme) =>
  StyleSheet.create({
    button: {
      height: 52,
      borderRadius: t.radius.pill,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: t.spacing(6),
    },
    buttonLabel: {
      fontSize: t.fontSize.md,
      fontWeight: t.fontWeight.semibold,
    },
    input: {
      height: 52,
      borderRadius: t.radius.md,
      borderWidth: 1,
      paddingHorizontal: t.spacing(4),
      fontSize: t.fontSize.md,
    },
  });
