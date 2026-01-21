import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../theme/colors';
import { Song } from '../../types';
import { searchSongs } from '../../api/search';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../../navigation/AppNavigator';

interface Artist {
  id: string;
  name: string;
  image?: string;
  songCount: number;
}

const ArtistsScreen = () => {
  const colors = useTheme();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [filteredArtists, setFilteredArtists] = useState<Artist[]>([]);
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [filter, setFilter] = useState<'popular' | 'asc' | 'desc'>('popular');

  const queries = [
    'english', 'bollywood',
    'trending', 'hits', 'love', 'hindi',
    'punjabi', 'pop', 'rock', 'party',
    'sad', 'happy', 'romantic', 'dance', 'workout'
  ];

  useEffect(() => {
    const fetchAllArtists = async () => {
      try {
        // Check cache first
        const cached = await AsyncStorage.getItem('cached_artists');
        const cacheTimestamp = await AsyncStorage.getItem('cached_artists_timestamp');
        
        // Use cache if it's less than 24 hours old
        if (cached && cacheTimestamp) {
          const age = Date.now() - parseInt(cacheTimestamp);
          const ONE_DAY = 24 * 60 * 60 * 1000;
          
          if (age < ONE_DAY) {
            const cachedArtists = JSON.parse(cached);
            setArtists(cachedArtists);
            return;
          }
        }

        // Fetch fresh data
        const artistsMap = new Map<string, Artist>();
        const MAX_SONGS = 500;
        let totalSongsFetched = 0;
        
        for (let i = 0; i < queries.length; i++) {
          if (totalSongsFetched >= MAX_SONGS) break;

          const results = await searchSongs(queries[i], 0, 20);
          totalSongsFetched += results.length;
          
          if (results.length > 0) {
            results.forEach((song) => {
              const artistName = song.artists?.primary?.[0]?.name || 'Unknown Artist';
              const artistId = song.artists?.primary?.[0]?.id || artistName;
              const artistImages = song.artists?.primary?.[0]?.image || [];
              const artistImage = artistImages.length > 0 ? artistImages[artistImages.length - 1]?.url : undefined;
              
              if (artistsMap.has(artistId)) {
                const existing = artistsMap.get(artistId)!;
                existing.songCount += 1;
              } else {
                artistsMap.set(artistId, {
                  id: artistId,
                  name: artistName,
                  image: artistImage,
                  songCount: 1,
                });
              }
            });
            
            setArtists(Array.from(artistsMap.values()));
          }
        }
        
        const allArtists = Array.from(artistsMap.values());
        
        // Cache the results
        await AsyncStorage.setItem('cached_artists', JSON.stringify(allArtists));
        await AsyncStorage.setItem('cached_artists_timestamp', Date.now().toString());
      } catch (error) {
        console.error('Error fetching artists:', error);
      }
    };

    fetchAllArtists();
  }, []);

  useEffect(() => {
    let sorted = [...artists];
    if (filter === 'popular') {
      sorted.sort((a, b) => (b.songCount || 0) - (a.songCount || 0));
    } else if (filter === 'asc') {
      sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else if (filter === 'desc') {
      sorted.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
    }
    setFilteredArtists(sorted);
  }, [artists, filter]);

  const filterOptions = [
    { label: 'Most Popular', value: 'popular' as const },
    { label: 'A to Z', value: 'asc' as const },
    { label: 'Z to A', value: 'desc' as const },
  ];

  const handleFilterSelect = (filterValue: 'popular' | 'asc' | 'desc') => {
    setFilter(filterValue);
    setShowFilterMenu(false);
  };

  const handleMenuPress = (artist: Artist) => {
    setSelectedArtist(artist);
    setShowMenu(true);
  };

  const menuOptions = [
    { label: 'Play', icon: 'play-circle' },
    { label: 'Add to Playing Queue', icon: 'list' },
    { label: 'Add to Playlist', icon: 'heart' },
    { label: 'Go to Albums', icon: 'disc' },
    { label: 'Details', icon: 'information-circle' },
  ];

  const handleMenuOption = (option: string) => {
    if (!selectedArtist) return;
    
    switch (option) {
      case 'Play':
        console.log('Play from:', selectedArtist.name);
        break;
      case 'Add to Playing Queue':
        console.log('Add to Queue:', selectedArtist.name);
        break;
      case 'Add to Playlist':
        console.log('Add to Playlist:', selectedArtist.name);
        break;
      case 'Go to Albums':
        console.log('Go to Albums:', selectedArtist.name);
        break;
      case 'Details':
        console.log('Show Details:', selectedArtist);
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
          {/* Artist Preview Header */}
          {selectedArtist && (
            <View style={[styles.artistPreviewHeader, { borderBottomColor: colors.primary + '20' }]}>
              <Image
                source={{ uri: selectedArtist.image || 'https://via.placeholder.com/80' }}
                style={styles.previewImage}
              />
              <View style={styles.previewInfo}>
                <Text style={[styles.previewTitle, { color: colors.text }]} numberOfLines={1}>
                  {selectedArtist.name}
                </Text>
                <Text style={[styles.previewSubtitle, { color: colors.subText }]}>
                  {selectedArtist.songCount} {selectedArtist.songCount === 1 ? 'song' : 'songs'}
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

  const renderArtistItem = ({ item }: { item: Artist }) => {
    return (
      <TouchableOpacity 
        style={styles.artistItem}
        onPress={() => navigation.navigate('ArtistDetail', {
          artistId: item.id,
          artistName: item.name,
          artistImage: item.image
        })}
      >
        <Image
          source={{ uri: item.image || 'https://via.placeholder.com/80' }}
          style={styles.artistImage}
        />
        <View style={styles.artistInfo}>
          <Text style={[styles.artistName, { color: colors.text }]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={[styles.songCountInfo, { color: colors.subText }]} numberOfLines={1}>
            {item.songCount} {item.songCount === 1 ? 'song' : 'songs'}
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.menuButton}
          onPress={(e) => {
            e.stopPropagation();
            handleMenuPress(item);
          }}
        >
          <Ionicons name="ellipsis-vertical" size={20} color={colors.text} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderFilterHeader = () => (
    <View style={[styles.headerContainer, { backgroundColor: colors.background, borderBottomColor: colors.primary + '20' }]}>
      <Text style={[styles.headerTitle, { color: colors.text }]}>{filteredArtists.length} Artists</Text>
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
            <Text style={[styles.filterMenuTitle, { color: colors.text }]}>Filter Artists</Text>
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
          data={filteredArtists}
          renderItem={renderArtistItem}
          keyExtractor={(item) => item.id}
          scrollEventThrottle={400}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={
            <View style={styles.centerContent}>
              <Text style={[styles.emptyText, { color: colors.text }]}>Loading artists...</Text>
            </View>
          }
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={10}
          initialNumToRender={15}
          updateCellsBatchingPeriod={50}
          getItemLayout={(data, index) => ({
            length: 70,
            offset: 70 * index,
            index,
          })}
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
  artistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 12,
  },
  artistImage: {
    width: 80,
    height: 80,
    borderRadius: 60,
  },
  artistInfo: {
    flex: 1,
  },
  artistName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  songCountInfo: {
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
  menuOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.15)',
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
  artistPreviewHeader: {
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
    borderRadius: 40,
  },
  previewInfo: {
    flex: 1,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  previewSubtitle: {
    fontSize: 14,
    fontWeight: '500',
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

export default ArtistsScreen;
