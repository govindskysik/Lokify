import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { useThemeContext } from '../context/ThemeContext';

const ThemedStatusBar = () => {
  const { isDarkMode } = useThemeContext();
  
  return <StatusBar style={isDarkMode ? 'light' : 'dark'} />;
};

export default ThemedStatusBar;
