import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { ThemeProvider } from './src/context/ThemeContext';
import { setupPlayer } from './src/services/musicPlayerService';
import { usePlayerStore } from './src/store/playerStore';

export default function App() {
  const { loadFavorites, loadDownloadedSongs } = usePlayerStore();

  useEffect(() => {
    setupPlayer();
    loadFavorites();
    loadDownloadedSongs();
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <NavigationContainer>
          <AppNavigator />
          <StatusBar style="auto" />
        </NavigationContainer>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
