import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../theme/colors';
import { searchSongs } from '../../api/search';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

interface Album {
  id: string;
  name: string;
  image?: string;
  songCount: number;
}

const AlbumsScreen = () => {
  const colors = useTheme();
  const navigation = useNavigation();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [filteredAlbums, setFilteredAlbums] = useState<Album[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
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
    const fetchAllAlbums = async () => {
      try {
        // Check cache first
        const cached = await AsyncStorage.getItem('cached_albums');
        const cacheTimestamp = await AsyncStorage.getItem('cached_albums_timestamp');
        
        // Use cache if it's less than 24 hours old
        if (cached && cacheTimestamp) {
          const age = Date.now() - parseInt(cacheTimestamp);
          const ONE_DAY = 24 * 60 * 60 * 1000;
          
          if (age < ONE_DAY) {
            const cachedAlbums = JSON.parse(cached);
            setAlbums(cachedAlbums);
            return;
          }
        }

        // Fetch fresh data
        const albumsMap = new Map<string, Album>();
        const MAX_SONGS = 500;
        let totalSongsFetched = 0;
        
        for (let i = 0; i < queries.length; i++) {
          if (totalSongsFetched >= MAX_SONGS) break;

          const results = await searchSongs(queries[i], 0, 20);
          totalSongsFetched += results.length;
          
          if (results.length > 0) {
            results.forEach((song) => {
              const albumName = song.album?.name || 'Unknown Album';
              const albumId = song.album?.id || albumName;
              const albumImages = song.image || [];
              const albumImage = albumImages.length > 0 ? albumImages[albumImages.length - 1]?.url : undefined;
              
              if (albumsMap.has(albumId)) {
                const existing = albumsMap.get(albumId)!;
                existing.songCount += 1;
              } else {
                albumsMap.set(albumId, {
                  id: albumId,
                  name: albumName,
                  image: albumImage,
                  songCount: 1,
                });
              }
            });
            
            setAlbums(Array.from(albumsMap.values()));
          }
        }
        
        const allAlbums = Array.from(albumsMap.values());
        
        // Cache the results
        await AsyncStorage.setItem('cached_albums', JSON.stringify(allAlbums));
        await AsyncStorage.setItem('cached_albums_timestamp', Date.now().toString());
      } catch (error) {
        console.error('Error fetching albums:', error);
      }
    };

    fetchAllAlbums();
  }, []);

  useEffect(() => {
    let sorted = [...albums];
    if (filter === 'popular') {
      sorted.sort((a, b) => (b.songCount || 0) - (a.songCount || 0));
    } else if (filter === 'asc') {
      sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else if (filter === 'desc') {
      sorted.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
    }
    setFilteredAlbums(sorted);
  }, [albums, filter]);

  const filterOptions = [
    { label: 'Most Popular', value: 'popular' as const },
    { label: 'A to Z', value: 'asc' as const },
    { label: 'Z to A', value: 'desc' as const },
  ];

  const handleFilterSelect = (filterValue: 'popular' | 'asc' | 'desc') => {
    setFilter(filterValue);
    setShowFilterMenu(false);
  };

  const handleMenuPress = (album: Album) => {
    setSelectedAlbum(album);
    setShowMenu(true);
  };

  const menuOptions = [
    { label: 'Play', icon: 'play-circle' },
    { label: 'Add to Playing Queue', icon: 'list' },
    { label: 'Add to Playlist', icon: 'heart' },
    { label: 'Go to Artist', icon: 'person' },
    { label: 'Details', icon: 'information-circle' },
  ];

  const handleMenuOption = (option: string) => {
    if (!selectedAlbum) return;
    
    switch (option) {
      case 'Play':
        console.log('Play from:', selectedAlbum.name);
        break;
      case 'Add to Playing Queue':
        console.log('Add to Queue:', selectedAlbum.name);
        break;
      case 'Add to Playlist':
        console.log('Add to Playlist:', selectedAlbum.name);
        break;
      case 'Go to Artist':
        console.log('Go to Artist for album:', selectedAlbum.name);
        break;
      case 'Details':
        console.log('Show Details:', selectedAlbum);
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
          {/* Album Preview Header */}
          {selectedAlbum && (
            <View style={[styles.albumPreviewHeader, { borderBottomColor: colors.primary + '20' }]}>
              <Image
                source={{ uri: selectedAlbum.image || 'https://via.placeholder.com/120' }}
                style={styles.previewImage}
              />
              <View style={styles.previewInfo}>
                <Text style={[styles.previewTitle, { color: colors.text }]} numberOfLines={1}>
                  {selectedAlbum.name}
                </Text>
                <Text style={[styles.previewSubtitle, { color: colors.subText }]}>
                  {selectedAlbum.songCount} {selectedAlbum.songCount === 1 ? 'song' : 'songs'}
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

  const renderAlbumItem = ({ item }: { item: Album }) => {
    return (
      <TouchableOpacity 
        style={styles.albumItem}
        onPress={() => navigation.navigate('AlbumDetail' as any, {
          albumId: item.id,
          albumName: item.name,
          albumImage: item.image
        })}
      >
        <View style={styles.albumCard}>
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: item.image || 'https://via.placeholder.com/160' }}
              style={styles.albumImage}
            />
            <TouchableOpacity 
              style={styles.menuButton}
              onPress={(e) => {
                e.stopPropagation();
                handleMenuPress(item);
              }}
            >
              <Ionicons name="ellipsis-vertical" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={[styles.albumName, { color: colors.text }]} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={[styles.songCountInfo, { color: colors.subText }]} numberOfLines={1}>
            {item.songCount} {item.songCount === 1 ? 'song' : 'songs'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFilterHeader = () => (
    <View style={[styles.headerContainer, { backgroundColor: colors.background, borderBottomColor: colors.primary + '20' }]}>
      <Text style={[styles.headerTitle, { color: colors.text }]}>{filteredAlbums.length} Albums</Text>
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
            <Text style={[styles.filterMenuTitle, { color: colors.text }]}>Filter Albums</Text>
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
          data={filteredAlbums}
          renderItem={renderAlbumItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          scrollEventThrottle={400}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={
            <View style={styles.centerContent}>
              <Text style={[styles.emptyText, { color: colors.text }]}>Loading albums...</Text>
            </View>
          }
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={10}
          initialNumToRender={10}
          updateCellsBatchingPeriod={50}
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
  columnWrapper: {
    gap: 12,
    paddingHorizontal: 12,
  },
  albumItem: {
    flex: 1,
  },
  albumCard: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  albumImage: {
    width: 160,
    height: 160,
    borderRadius: 12,
  },
  albumName: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
  },
  songCountInfo: {
    fontSize: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  playButton: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    bottom: 8,
    right: 8,
  },
  menuButton: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    top: 8,
    right: 8,
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
  albumPreviewHeader: {
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

export default AlbumsScreen;
