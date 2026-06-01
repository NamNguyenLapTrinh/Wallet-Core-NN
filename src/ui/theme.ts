import { useColorScheme } from 'react-native';

export type ThemeName = 'light' | 'dark';

export type Theme = {
  name: ThemeName;
  colors: {
    background: string;
    surface: string;
    surfaceAlt: string;
    border: string;
    text: string;
    textSecondary: string;
    textMuted: string;
    primary: string;
    primaryText: string;
    danger: string;
    success: string;
    overlay: string;
  };
  spacing: (n: number) => number;
  radius: { sm: number; md: number; lg: number; pill: number };
  fontSize: { xs: number; sm: number; md: number; lg: number; xl: number; xxl: number };
  fontWeight: { regular: '400'; medium: '500'; semibold: '600'; bold: '700' };
};

const base = {
  spacing: (n: number) => n * 4,
  radius: { sm: 8, md: 12, lg: 20, pill: 999 },
  fontSize: { xs: 11, sm: 13, md: 15, lg: 18, xl: 22, xxl: 30 },
  fontWeight: { regular: '400', medium: '500', semibold: '600', bold: '700' } as const,
};

export const lightTheme: Theme = {
  ...base,
  name: 'light',
  colors: {
    background: '#FFFFFF',
    surface: '#F6F7F9',
    surfaceAlt: '#EEF0F4',
    border: '#E2E5EB',
    text: '#0B0E12',
    textSecondary: '#4B5563',
    textMuted: '#8A8F98',
    primary: '#1A73E8',
    primaryText: '#FFFFFF',
    danger: '#E5484D',
    success: '#16A34A',
    overlay: 'rgba(0,0,0,0.4)',
  },
};

export const darkTheme: Theme = {
  ...base,
  name: 'dark',
  colors: {
    background: '#0B0E12',
    surface: '#15191F',
    surfaceAlt: '#1D232B',
    border: '#262B33',
    text: '#FFFFFF',
    textSecondary: '#B6BCC6',
    textMuted: '#7C828C',
    primary: '#3B82F6',
    primaryText: '#FFFFFF',
    danger: '#F87171',
    success: '#34D399',
    overlay: 'rgba(0,0,0,0.6)',
  },
};

export const useTheme = (): Theme => {
  const scheme = useColorScheme();
  return scheme === 'dark' ? darkTheme : lightTheme;
};
