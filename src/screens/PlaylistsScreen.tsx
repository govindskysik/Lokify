import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import ScreenWrapper from '../components/ScreenWrapper';

const PlaylistsScreen = () => {
  return (
    <ScreenWrapper>
      <View style={styles.content}>
        <Text style={styles.text}>Playlists Screen</Text>
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 18,
    fontWeight: '600',
  },
});

export default PlaylistsScreen;
