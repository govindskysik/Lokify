import { useColorScheme } from 'react-native';
import { useThemeContext } from '../context/ThemeContext';

export interface ColorScheme {
  primary: string;
  background: string;
  text: string;
  subText: string;
  tabBarBackground: string;
  cardBackground: string;
  border: string;
  error: string;
}

const LIGHT_COLORS: ColorScheme = {
  primary: '#FF5722',
  background: '#FFFFFF',
  text: '#000000',
  subText: '#666666',
  tabBarBackground: '#FFFFFF',
  cardBackground: '#F5F5F5',
  border: '#E0E0E0',
  error: '#FF3B30',
};

const DARK_COLORS: ColorScheme = {
  primary: '#FF6B47',
  background: '#0A0A0A',
  text: '#FFFFFF',
  subText: '#B3B3B3',
  tabBarBackground: '#1A1A1A',
  cardBackground: '#1E1E1E',
  border: '#2A2A2A',
  error: '#FF6B6B',
};

export const useTheme = (): ColorScheme => {
  try {
    const { isDarkMode } = useThemeContext();
    return isDarkMode ? DARK_COLORS : LIGHT_COLORS;
  } catch {
    // Fallback to system theme if context is not available
    const colorScheme = useColorScheme();
    return colorScheme === 'dark' ? DARK_COLORS : LIGHT_COLORS;
  }
};

export const Colors = {
  light: LIGHT_COLORS,
  dark: DARK_COLORS,
};
