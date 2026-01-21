import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/colors';
import { usePlayerStore } from '../store/playerStore';
import { loadTrack, playTrack } from '../services/musicPlayerService';
import { Song } from '../types';

const FavoritesScreen = () => {
  const colors = useTheme();
  const { 
    favorites, 
    loadFavorites, 
    removeFromFavorites,
    setQueue,
    setCurrentTrackIndex,
    setIsPlaying,
    setShowMiniPlayer,
    setShowExpandedPlayer,
  } = usePlayerStore();

  useEffect(() => {
    loadFavorites();
  }, []);

  const handlePlaySong = async (song: Song, index: number) => {
    try {
      setQueue(favorites);
      setCurrentTrackIndex(index);
      await loadTrack(song);
      await playTrack();
      setIsPlaying(true);
      setShowMiniPlayer(true);
      setShowExpandedPlayer(true);
    } catch (error) {
      console.error('Error playing song:', error);
    }
  };

  const handleRemoveFavorite = (songId: string) => {
    removeFromFavorites(songId);
  };

  const renderSongItem = ({ item, index }: { item: Song; index: number }) => (
    <TouchableOpacity
      style={styles.songItem}
      onPress={() => handlePlaySong(item, index)}
      activeOpacity={0.7}
    >
      <Image
        source={{ uri: item.image?.[2]?.url || item.image?.[0]?.url || 'https://via.placeholder.com/60' }}
        style={styles.thumbnail}
      />
      <View style={styles.songInfo}>
        <Text style={[styles.songName, { color: colors.text }]} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={[styles.artistInfo, { color: colors.subText }]} numberOfLines={1}>
          {item.artists?.primary?.[0]?.name || 'Unknown Artist'}
        </Text>
      </View>
      <TouchableOpacity
        style={[styles.playButton, { backgroundColor: colors.primary }]}
        onPress={() => handlePlaySong(item, index)}
      >
        <Ionicons name="play" size={18} color="#fff" />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.heartButton}
        onPress={() => handleRemoveFavorite(item.id)}
      >
        <Ionicons name="heart" size={24} color={colors.primary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Favorites</Text>
        <Text style={[styles.headerSubtitle, { color: colors.subText }]}>
          {favorites.length} {favorites.length === 1 ? 'song' : 'songs'}
        </Text>
      </View>

      {favorites.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="heart-outline" size={80} color={colors.subText} />
          <Text style={[styles.emptyText, { color: colors.text }]}>No favorites yet</Text>
          <Text style={[styles.emptySubtext, { color: colors.subText }]}>
            Tap the heart icon on any song to add it to your favorites
          </Text>
        </View>
      ) : (
        <FlatList
          data={favorites}
          renderItem={renderSongItem}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  listContent: {
    paddingBottom: 100,
  },
  songItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  songInfo: {
    flex: 1,
  },
  songName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  artistInfo: {
    fontSize: 14,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  heartButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default FavoritesScreen;
