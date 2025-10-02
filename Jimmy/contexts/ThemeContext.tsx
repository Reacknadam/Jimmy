import createContextHook from '@nkzw/create-context-hook';
import { useColorScheme } from 'react-native';

export type Theme = {
  background: string;
  card: string;
  text: string;
  textSecondary: string;
  primary: string;
  border: string;
  error: string;
  success: string;
  isDark: boolean;
};

const lightTheme: Theme = {
  background: '#FFFFFF',
  card: '#F5F5F5',
  text: '#000000',
  textSecondary: '#666666',
  primary: '#7C3AED',
  border: '#E0E0E0',
  error: '#EF4444',
  success: '#10B981',
  isDark: false,
};

const darkTheme: Theme = {
  background: '#0F0F0F',
  card: '#1A1A1A',
  text: '#FFFFFF',
  textSecondary: '#A0A0A0',
  primary: '#9333EA',
  border: '#2A2A2A',
  error: '#F87171',
  success: '#34D399',
  isDark: true,
};

export const [ThemeProvider, useTheme] = createContextHook(() => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;

  return { theme };
});
