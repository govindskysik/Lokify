import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, FlatList, Modal, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../theme/colors';
import { Song } from '../types';
import { searchSongs } from '../api/search';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { usePlayerStore } from '../store/playerStore';
import { loadTrack, playTrack } from '../services/musicPlayerService';

const ArtistDetailScreen = () => {
  const colors = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const { artistId, artistName, artistImage } = route.params as { artistId: string; artistName: string; artistImage?: string };
  
  const [songs, setSongs] = useState<Song[]>([]);
  const [albums, setAlbums] = useState<Set<string>>(new Set());
  const [totalDuration, setTotalDuration] = useState(0);
  const [showAllSongs, setShowAllSongs] = useState(false);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  
  const setQueue = usePlayerStore((state) => state.setQueue);
  const setCurrentTrackIndex = usePlayerStore((state) => state.setCurrentTrackIndex);
  const setIsPlaying = usePlayerStore((state) => state.setIsPlaying);
  const addToQueue = usePlayerStore((state) => state.addToQueue);
  const addToQueueNext = usePlayerStore((state) => state.addToQueueNext);
  const setShowMiniPlayer = usePlayerStore((state) => state.setShowMiniPlayer);
  const setShowExpandedPlayer = usePlayerStore((state) => state.setShowExpandedPlayer);

  useEffect(() => {
    const fetchArtistSongs = async () => {
      try {
        const cacheKey = `artist_${artistId}_songs`;
        const cacheTimestampKey = `artist_${artistId}_songs_timestamp`;
        
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
            setAlbums(new Set(cachedData.albumIds));
            setTotalDuration(cachedData.totalDuration);
            return;
          }
        }

        // Fetch fresh data
        const results = await searchSongs(artistName, 0, 50);
        const artistSongs = results.filter(song => 
          song.artists?.primary?.some(artist => artist.id === artistId || artist.name === artistName)
        );
        
        setSongs(artistSongs);
        
        const albumSet = new Set<string>();
        let duration = 0;
        artistSongs.forEach(song => {
          if (song.album?.id) albumSet.add(song.album.id);
          duration += song.duration || 0;
        });
        
        setAlbums(albumSet);
        setTotalDuration(duration);
        
        // Cache the results
        const cacheData = {
          songs: artistSongs,
          albumIds: Array.from(albumSet),
          totalDuration: duration,
        };
        await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
        await AsyncStorage.setItem(cacheTimestampKey, Date.now().toString());
      } catch (error) {
        console.error('Error fetching artist songs:', error);
      }
    };

    fetchArtistSongs();
  }, [artistId, artistName]);

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
          {artistName}
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
      case 'Go to Album':
        setShowMenu(false);
        navigation.navigate('AlbumDetail', { 
          albumId: selectedSong.album?.id,
          albumName: selectedSong.album?.name,
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
          {['Play Next', 'Add to Playing Queue', selectedSong && isFavorite(selectedSong.id) ? 'Remove from Favorites' : 'Add to Favorites', 'Go to Album'].map((option) => (
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
                    : 'disc'
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
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
        {/* Artist Image */}
        <View style={styles.artistImageContainer}>
          <Image
            source={{ uri: artistImage || 'https://via.placeholder.com/300' }}
            style={styles.artistImage}
          />
        </View>

        {/* Artist Name */}
        <Text style={[styles.artistNameTitle, { color: colors.text }]}>
          {artistName}
        </Text>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <Text style={[styles.statsText, { color: colors.subText }]}>
            {albums.size} {albums.size === 1 ? 'Album' : 'Albums'}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 50,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  artistImageContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  artistImage: {
    width: 250,
    height: 250,
    borderRadius: 40,
  },
  artistNameTitle: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  statsText: {
    fontSize: 13,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 12,
    marginBottom: 32,
  },
  shuffleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 28,
    gap: 8,
  },
  shuffleButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  playButtonLarge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 28,
    borderWidth: 2,
    gap: 8,
  },
  playButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  songsSection: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  songsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  songsTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  songItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  songThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 12,
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
  artistName: {
    fontSize: 13,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  menuButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
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
    textAlign: 'center',
    fontSize: 14,
    marginTop: 20,
  },
});

export default ArtistDetailScreen;
