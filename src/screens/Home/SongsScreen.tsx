import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/colors';
import { Song } from '../../types';
import { searchSongs } from '../../api/search';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const SongsScreen = () => {
  const colors = useTheme();
  const navigation = useNavigation();
  const [songs, setSongs] = useState<Song[]>([]);
  const [filteredSongs, setFilteredSongs] = useState<Song[]>([]);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [filter, setFilter] = useState<'popular' | 'artist' | 'album' | 'year' | 'asc' | 'desc'>('popular');
  
  const queries = [
    'english', 'bollywood',
    'trending', 'hits', 'love', 'hindi',
    'punjabi', 'pop', 'rock', 'party',
    'sad', 'happy', 'romantic', 'dance', 'workout'
  ];

  useEffect(() => {
    const fetchAllSongs = async () => {
      let allSongs: Song[] = [];
      const MAX_SONGS = 500;

      for (let i = 0; i < queries.length; i++) {
        if (allSongs.length >= MAX_SONGS) break;

        const results = await searchSongs(queries[i], 0, 20);
        console.log(`Fetched from ${queries[i]}: ${results.length} songs`);

        if (results.length > 0) {
          const existingIds = new Set(allSongs.map(s => s.id));
          const newSongs = results.filter(song => !existingIds.has(song.id));
          allSongs = [...allSongs, ...newSongs].slice(0, MAX_SONGS);

          setSongs(allSongs);
        }
      }

      console.log('Total unique songs loaded:', allSongs.length);
    };

    fetchAllSongs();
  }, []);

  useEffect(() => {
    let sorted = [...songs];
    
    // Sort
    if (filter === 'popular') {
      sorted.sort((a, b) => (b.playCount || 0) - (a.playCount || 0));
    } else if (filter === 'artist') {
      sorted.sort((a, b) => (a.artists?.primary?.[0]?.name || '').localeCompare(b.artists?.primary?.[0]?.name || ''));
    } else if (filter === 'album') {
      sorted.sort((a, b) => (a.album?.name || '').localeCompare(b.album?.name || ''));
    } else if (filter === 'year') {
      sorted.sort((a, b) => (b.year || '').localeCompare(a.year || ''));
    } else if (filter === 'asc') {
      sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else if (filter === 'desc') {
      sorted.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
    }
    
    setFilteredSongs(sorted);
  }, [songs, filter]);

  const filterOptions = [
    { label: 'Most Popular', value: 'popular' as const },
    { label: 'By Artist', value: 'artist' as const },
    { label: 'By Album', value: 'album' as const },
    { label: 'By Year', value: 'year' as const },
    { label: 'A to Z', value: 'asc' as const },
    { label: 'Z to A', value: 'desc' as const },
  ];

  const handleFilterSelect = (filterValue: 'popular' | 'artist' | 'album' | 'year' | 'asc' | 'desc') => {
    setFilter(filterValue);
    setShowFilterMenu(false);
  };

  const handleMenuPress = (song: Song) => {
    setSelectedSong(song);
    setShowMenu(true);
  };

  const menuOptions = [
    { label: 'Play Next', icon: 'play-skip-forward' },
    { label: 'Add to Playing Queue', icon: 'list' },
    { label: 'Add to Playlist', icon: 'heart' },
    { label: 'Go to Album', icon: 'disc' },
    { label: 'Go to Artist', icon: 'person' },
    { label: 'Details', icon: 'information-circle' },
  ];

  const handleMenuOption = (option: string) => {
    if (!selectedSong) return;

    switch (option) {
      case 'Play Next':
        console.log('Play Next:', selectedSong.name);
        break;
      case 'Add to Playing Queue':
        console.log('Add to Queue:', selectedSong.name);
        break;
      case 'Add to Playlist':
        console.log('Add to Playlist:', selectedSong.name);
        break;
      case 'Go to Album':
        console.log('Go to Album:', selectedSong.album?.name);
        break;
      case 'Go to Artist':
        console.log('Go to Artist:', selectedSong.artists?.primary?.[0]?.name);
        break;
      case 'Details':
        console.log('Show Details:', selectedSong);
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
          {/* Song Preview Header */}
          {selectedSong && (
            <View style={[styles.songPreviewHeader, { borderBottomColor: colors.primary + '20' }]}>
              <Image
                source={{ uri: selectedSong.image?.[2]?.url || selectedSong.image?.[0]?.url || 'https://via.placeholder.com/80' }}
                style={styles.previewImage}
              />
              <View style={styles.previewInfo}>
                <Text style={[styles.previewTitle, { color: colors.text }]} numberOfLines={1}>
                  {selectedSong.name}
                </Text>
                <Text style={[styles.previewArtist, { color: colors.subText }]} numberOfLines={1}>
                  {selectedSong.artists?.primary?.[0]?.name || 'Unknown Artist'}
                </Text>
                <Text style={[styles.previewDuration, { color: colors.subText }]}>
                  {Math.floor(selectedSong.duration / 60)}:{(selectedSong.duration % 60).toString().padStart(2, '0')} mins
                </Text>
              </View>
              <TouchableOpacity
                style={styles.likeButton}
                onPress={() => setIsFavorite(!isFavorite)}
              >
                <Ionicons
                  name={isFavorite ? "heart" : "heart-outline"}
                  size={28}
                  color={colors.primary}
                />
              </TouchableOpacity>
            </View>
          )}

          {/* Menu Options */}
          {menuOptions.map((option) => (
            <TouchableOpacity
              key={option.label}
              style={styles.menuItem}
              onPress={() => handleMenuOption(option.label)}
            >
              <Ionicons name={option.icon as any} size={24} color="#000" />
              <Text style={[styles.menuItemText, { color: colors.text }]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const renderSongItem = ({ item }: { item: Song }) => {
    return (
      <View style={styles.songItem}>
        <Image
          source={{ uri: item.image?.[2]?.url || item.image?.[0]?.url || 'https://via.placeholder.com/60' }}
          style={styles.thumbnail}
        />
        <View style={styles.songInfo}>
          <Text style={[styles.songName, { color: colors.text }]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={[styles.artistInfo, { color: colors.subText }]} numberOfLines={1}>
            {item.artists?.primary?.[0]?.name || 'Unknown Artist'} | {Math.floor(item.duration / 60)}:{(item.duration % 60).toString().padStart(2, '0')}
          </Text>
        </View>
        <TouchableOpacity style={[styles.playButton, { backgroundColor: colors.primary }]}>
          <Ionicons name="play" size={18} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => handleMenuPress(item)}
        >
          <Ionicons name="ellipsis-vertical" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>
    );
  };

  const renderFilterHeader = () => (
    <View style={[styles.headerContainer, { backgroundColor: colors.background, borderBottomColor: colors.primary + '20' }]}>
      <Text style={[styles.headerTitle, { color: colors.text }]}>{filteredSongs.length} Songs</Text>
      <TouchableOpacity
        style={styles.filterIconButton}
        onPress={() => setShowFilterMenu(true)}
      >
        <Ionicons name="funnel" size={24} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );

  const renderFilterModal = () => (
    <Modal
      visible={showFilterMenu}
      transparent
      animationType="fade"
      onRequestClose={() => setShowFilterMenu(false)}
    >
      <TouchableOpacity 
        style={styles.menuOverlay}
        onPress={() => setShowFilterMenu(false)}
        activeOpacity={1}
      >
        <View style={[styles.filterMenuContent, { backgroundColor: colors.background }]}>
          <View style={styles.filterMenuHeader}>
            <Text style={[styles.filterMenuTitle, { color: colors.text }]}>Filter Songs</Text>
          </View>
          
          {filterOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.filterMenuItem,
                filter === option.value && { backgroundColor: colors.primary + '10' }
              ]}
              onPress={() => handleFilterSelect(option.value)}
            >
              <Text style={[styles.filterMenuItemText, { color: colors.text }]}>
                {option.label}
              </Text>
              {filter === option.value && (
                <Ionicons name="checkmark" size={20} color={colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const renderFooter = () => {
    return null;
  };

  return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {renderFilterHeader()}
        <FlatList
          data={filteredSongs}
          renderItem={renderSongItem}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          scrollEventThrottle={400}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={
            <View style={styles.centerContent}>
              <Text style={[styles.emptyText, { color: colors.text }]}>Loading songs...</Text>
            </View>
          }
        />
        {renderMenuModal()}
        {renderFilterModal()}
      </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  filterIconButton: {
    padding: 8,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  songItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 24,
    marginRight: 12,
  },
  songInfo: {
    flex: 1,
  },
  songName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  artistInfo: {
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
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
  },
  footer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  menuOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.60)',
  },
  menuContent: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingVertical: 8,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 5,
  },
  songPreviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  previewImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  previewInfo: {
    flex: 1,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  previewArtist: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  previewDuration: {
    fontSize: 13,
    fontWeight: '400',
  },
  likeButton: {
    padding: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 16,
  },
  menuItemText: {
    fontSize: 17,
    fontWeight: '500',
  },
  filterMenuContent: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingVertical: 8,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 5,
  },
  filterMenuHeader: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterMenuTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  filterMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  filterMenuItemText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default SongsScreen;
