import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, FlatList, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../theme/colors';
import { Song } from '../types';
import { searchSongs } from '../api/search';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { usePlayerStore } from '../store/playerStore';
import { loadTrack, playTrack } from '../services/musicPlayerService';

const AlbumDetailScreen = () => {
  const colors = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const { albumId, albumName, albumImage } = route.params as { albumId: string; albumName: string; albumImage?: string };
  
  const [songs, setSongs] = useState<Song[]>([]);
  const [artists, setArtists] = useState<Set<string>>(new Set());
  const [totalDuration, setTotalDuration] = useState(0);
  const [showAllSongs, setShowAllSongs] = useState(false);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  
  const setQueue = usePlayerStore((state) => state.setQueue);
  const setCurrentTrackIndex = usePlayerStore((state) => state.setCurrentTrackIndex);
  const setIsPlaying = usePlayerStore((state) => state.setIsPlaying);
  const setShowMiniPlayer = usePlayerStore((state) => state.setShowMiniPlayer);
  const addToQueue = usePlayerStore((state) => state.addToQueue);
  const addToQueueNext = usePlayerStore((state) => state.addToQueueNext);

  useEffect(() => {
    const fetchAlbumSongs = async () => {
      try {
        const cacheKey = `album_${albumId}_songs`;
        const cacheTimestampKey = `album_${albumId}_songs_timestamp`;
        
        // Check cache first
        const cached = await AsyncStorage.getItem(cacheKey);
        const cacheTimestamp = await AsyncStorage.getItem(cacheTimestampKey);
        
        // Use cache if it's less than 24 hours old
        if (cached && cacheTimestamp) {
          const age = Date.now() - parseInt(cacheTimestamp);
          const ONE_DAY = 24 * 60 * 60 * 1000;
          
          if (age < ONE_DAY) {
            const cachedData = JSON.parse(cached);
            setSongs(cachedData.songs);
            setArtists(new Set(cachedData.artistNames));
            setTotalDuration(cachedData.totalDuration);
            return;
          }
        }

        // Fetch fresh data
        const results = await searchSongs(albumName, 0, 50);
        const albumSongs = results.filter(song => 
          song.album?.id === albumId || song.album?.name === albumName
        );
        
        setSongs(albumSongs);
        
        const artistSet = new Set<string>();
        let duration = 0;
        albumSongs.forEach(song => {
          const artistName = song.artists?.primary?.[0]?.name || 'Unknown Artist';
          artistSet.add(artistName);
          duration += song.duration || 0;
        });
        
        setArtists(artistSet);
        setTotalDuration(duration);
        
        // Cache the results
        const cacheData = {
          songs: albumSongs,
          artistNames: Array.from(artistSet),
          totalDuration: duration,
        };
        await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
        await AsyncStorage.setItem(cacheTimestampKey, Date.now().toString());
      } catch (error) {
        console.error('Error fetching album songs:', error);
      }
    };

    fetchAlbumSongs();
  }, [albumId, albumName]);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlaySong = async (song: Song, index: number) => {
    try {
      setQueue(songs);
      setCurrentTrackIndex(index);
      const loaded = await loadTrack(song);
      if (!loaded) {
        console.error('Failed to load track');
        return;
      }
      const playing = await playTrack();
      if (playing) {
        setIsPlaying(true);
        setShowMiniPlayer(true);
      } else {
        console.error('Failed to start playback');
      }
    } catch (error) {
      console.error('Error playing song:', error);
    }
  };

  const renderSongItem = ({ item, index }: { item: Song; index: number }) => (
    <View style={styles.songItem}>
      <Image
        source={{ uri: item.image?.[2]?.url || item.image?.[0]?.url || 'https://via.placeholder.com/60' }}
        style={styles.songThumbnail}
      />
      <View style={styles.songInfo}>
        <Text style={[styles.songName, { color: colors.text }]} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={[styles.artistName, { color: colors.subText }]} numberOfLines={1}>
          {item.artists?.primary?.[0]?.name || 'Unknown Artist'}
        </Text>
      </View>
      <TouchableOpacity 
        style={[styles.playButton, { backgroundColor: colors.primary }]}
        onPress={() => handlePlaySong(item, index)}
      >
        <Ionicons name="play" size={18} color="#fff" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.menuButton} onPress={() => handleMenuPress(item)}>
        <Ionicons name="ellipsis-vertical" size={20} color={colors.text} />
      </TouchableOpacity>
    </View>
  );

  const handleMenuPress = (song: Song) => {
    setSelectedSong(song);
    setShowMenu(true);
  };

  const handleMenuOption = (option: string) => {
    if (!selectedSong) return;

    switch (option) {
      case 'Play Next':
        addToQueueNext(selectedSong);
        Alert.alert('Added to Queue', `"${selectedSong.name}" will play next`);
        break;
      case 'Add to Playing Queue':
        addToQueue(selectedSong);
        Alert.alert('Added to Queue', `"${selectedSong.name}" added to queue`);
        break;
      case 'Add to Favorites':
        addToFavorites(selectedSong);
        Alert.alert('Added to Favorites', `"${selectedSong.name}" added to favorites`);
        break;
      case 'Remove from Favorites':
        removeFromFavorites(selectedSong.id);
        Alert.alert('Removed from Favorites', `"${selectedSong.name}" removed from favorites`);
        break;
      case 'Go to Artist':
        setShowMenu(false);
        navigation.navigate('ArtistDetail', { 
          artistId: selectedSong.artists?.primary?.[0]?.id,
          artistName: selectedSong.artists?.primary?.[0]?.name,
        });
        break;
    }

    setShowMenu(false);
  };

  const renderMenuModal = () => (
    <Modal
      visible={showMenu}
      transparent
      animationType="fade"
      onRequestClose={() => setShowMenu(false)}
    >
      <TouchableOpacity
        style={styles.menuOverlay}
        onPress={() => setShowMenu(false)}
        activeOpacity={1}
      >
        <View style={[styles.menuContent, { backgroundColor: colors.background }]}>
          {['Play Next', 'Add to Playing Queue', selectedSong && isFavorite(selectedSong.id) ? 'Remove from Favorites' : 'Add to Favorites', 'Go to Artist'].map((option) => (
            <TouchableOpacity
              key={option}
              style={styles.menuItem}
              onPress={() => handleMenuOption(option)}
            >
              <Ionicons
                name={
                  option === 'Play Next' 
                    ? 'play-skip-forward' 
                    : option === 'Add to Playing Queue'
                    ? 'list'
                    : option === 'Remove from Favorites'
                    ? 'heart'
                    : option === 'Add to Favorites'
                    ? 'heart-outline'
                    : 'person'
                }
                size={24}
                color={colors.primary}
              />
              <Text style={[styles.menuItemText, { color: colors.text }]}>
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {renderMenuModal()}
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="search" size={24} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="ellipsis-vertical" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Album Image */}
        <View style={styles.albumImageContainer}>
          <Image
            source={{ uri: albumImage || 'https://via.placeholder.com/300' }}
            style={styles.albumImage}
          />
        </View>

        {/* Album Name */}
        <Text style={[styles.albumNameTitle, { color: colors.text }]}>
          {albumName}
        </Text>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <Text style={[styles.statsText, { color: colors.subText }]}>
            {artists.size} {artists.size === 1 ? 'Artist' : 'Artists'}
          </Text>
          <Text style={[styles.statsText, { color: colors.subText }]}>|</Text>
          <Text style={[styles.statsText, { color: colors.subText }]}>
            {songs.length} {songs.length === 1 ? 'Song' : 'Songs'}
          </Text>
          <Text style={[styles.statsText, { color: colors.subText }]}>|</Text>
          <Text style={[styles.statsText, { color: colors.subText }]}>
            {formatDuration(totalDuration)} mins
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.shuffleButton, { backgroundColor: colors.primary }]}
            onPress={async () => {
              if (songs.length === 0) return;
              const shuffled = [...songs].sort(() => Math.random() - 0.5);
              setQueue(shuffled);
              setCurrentTrackIndex(0);
              const loaded = await loadTrack(shuffled[0]);
              if (!loaded) {
                console.error('Failed to load shuffled track');
                return;
              }
              const playing = await playTrack();
              if (playing) {
                setIsPlaying(true);
                setShowMiniPlayer(true);
              }
            }}
          >
            <Ionicons name="shuffle" size={20} color="#fff" />
            <Text style={styles.shuffleButtonText}>Shuffle</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.playButtonLarge, { borderColor: colors.primary }]}
            onPress={async () => {
              if (songs.length === 0) return;
              setQueue(songs);
              setCurrentTrackIndex(0);
              const loaded = await loadTrack(songs[0]);
              if (!loaded) {
                console.error('Failed to load track');
                return;
              }
              const playing = await playTrack();
              if (playing) {
                setIsPlaying(true);
                setShowMiniPlayer(true);
              }
            }}
          >
            <Ionicons name="play" size={20} color={colors.primary} />
            <Text style={[styles.playButtonText, { color: colors.primary }]}>Play</Text>
          </TouchableOpacity>
        </View>

        {/* Songs Section */}
        <View style={styles.songsSection}>
          <View style={styles.songsSectionHeader}>
            <Text style={[styles.songsTitle, { color: colors.text }]}>Songs</Text>
            <TouchableOpacity onPress={() => setShowAllSongs(!showAllSongs)}>
              <Text style={[styles.seeAllText, { color: colors.primary }]}>
                {showAllSongs ? 'Show Less' : 'See All'}
              </Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={showAllSongs ? songs : songs.slice(0, 10)}
            renderItem={renderSongItem}
            keyExtractor={(item, index) => `${item.id}-${index}`}
            scrollEnabled={false}
            ListEmptyComponent={
              <Text style={[styles.emptyText, { color: colors.subText }]}>
                No songs found
              </Text>
            }
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerButton: {
    padding: 8,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 12,
  },
  albumImageContainer: {
    width: '100%',
    aspectRatio: 1,
    overflow: 'hidden',
    marginBottom: 20,
  },
  albumImage: {
    width: '100%',
    height: '100%',
  },
  albumNameTitle: {
    fontSize: 24,
    fontWeight: '700',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  statsText: {
    fontSize: 12,
    fontWeight: '600',
    marginHorizontal: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  shuffleButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  shuffleButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  playButtonLarge: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
  },
  playButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  songsSection: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  songsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  songsTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '600',
  },
  songItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  songThumbnail: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  songInfo: {
    flex: 1,
  },
  songName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  artistName: {
    fontSize: 12,
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuButton: {
    padding: 8,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContent: {
    borderRadius: 12,
    paddingVertical: 12,
    minWidth: 200,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuItemText: {
    marginLeft: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20,
  },
});

export default AlbumDetailScreen;
