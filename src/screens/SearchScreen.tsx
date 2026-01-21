import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { searchSongs, searchAlbums, searchArtists } from '../api/search';
import { useNavigation } from '@react-navigation/native';
import { usePlayerStore } from '../store/playerStore';
import { loadTrack, playTrack } from '../services/musicPlayerService';
import { Song } from '../types';

const SearchScreen = () => {
  const colors = useTheme();
  const navigation = useNavigation<any>();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{
    songs: Song[];
    albums: any[];
    artists: any[];
  }>({ songs: [], albums: [], artists: [] });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'songs' | 'albums' | 'artists'>('all');
  const [showAllSongsInAllTab, setShowAllSongsInAllTab] = useState(false);
  const [showAllAlbumsInAllTab, setShowAllAlbumsInAllTab] = useState(false);
  const [showAllArtistsInAllTab, setShowAllArtistsInAllTab] = useState(false);

  const setQueue = usePlayerStore((state) => state.setQueue);
  const setCurrentTrackIndex = usePlayerStore((state) => state.setCurrentTrackIndex);
  const setIsPlaying = usePlayerStore((state) => state.setIsPlaying);
  const setShowMiniPlayer = usePlayerStore((state) => state.setShowMiniPlayer);
  const setShowExpandedPlayer = usePlayerStore((state) => state.setShowExpandedPlayer);

  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults({ songs: [], albums: [], artists: [] });
      return;
    }

    setLoading(true);
    try {
      const [songs, albums, artists] = await Promise.all([
        searchSongs(query, 0, 20),
        searchAlbums(query, 0, 10),
        searchArtists(query, 0, 10),
      ]);

      setSearchResults({ songs, albums, artists });
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults({ songs: [], albums: [], artists: [] });
    } finally {
      setLoading(false);
    }
  }, []);

  const handlePlaySong = useCallback(
    async (song: Song) => {
      try {
        setQueue([song]);
        setCurrentTrackIndex(0);
        const loaded = await loadTrack(song);
        if (!loaded) return;
        const playing = await playTrack();
        if (playing) {
          setIsPlaying(true);
          setShowMiniPlayer(true);
          setShowExpandedPlayer(true);
        }
      } catch (error) {
        console.error('Error playing song:', error);
      }
    },
    [setQueue, setCurrentTrackIndex, setIsPlaying, setShowMiniPlayer, setShowExpandedPlayer]
  );

  const renderSongItem = ({ item }: { item: Song }) => {
    const artist = item.artists?.primary?.[0]?.name || 'Unknown Artist';
    const duration = item.duration || 0;
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    const durationText = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    return (
      <TouchableOpacity
        style={styles.songItem}
        onPress={() => handlePlaySong(item)}
        activeOpacity={0.7}
      >
        <Image
          source={{ uri: item.image?.[2]?.url || item.image?.[0]?.url || 'https://via.placeholder.com/80' }}
          style={styles.thumbnail}
        />
        <View style={styles.songInfo}>
          <Text style={[styles.songName, { color: colors.text }]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={[styles.artistInfo, { color: colors.subText }]} numberOfLines={1}>
            {artist} | {durationText}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.playButton, { backgroundColor: colors.primary }]}
          onPress={() => handlePlaySong(item)}
        >
          <Ionicons name="play" size={18} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuButton}>
          <Ionicons name="ellipsis-vertical" size={20} color={colors.subText} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderAlbumItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[styles.gridItem, { backgroundColor: colors.cardBackground }]}
      onPress={() => {
        navigation.goBack();
        setTimeout(() => {
          (navigation as any).navigate('MainTabs', {
            screen: 'HomeTab',
            params: {
              screen: 'AlbumDetail',
              params: {
                albumId: item.id,
                albumName: item.name,
                albumImage: item.image?.[2]?.url || item.image?.[1]?.url || item.image?.[0]?.url || item.image,
              },
            },
          });
        }, 100);
      }}
      activeOpacity={0.7}
    >
      <Image
        source={{ uri: item.image?.[2]?.url || item.image?.[1]?.url || item.image?.[0]?.url || item.image || 'https://via.placeholder.com/120' }}
        style={styles.gridImage}
      />
      <Text style={[styles.gridTitle, { color: colors.text }]} numberOfLines={2}>
        {item.name}
      </Text>
      <Text style={[styles.gridSubtitle, { color: colors.subText }]} numberOfLines={1}>
        Album
      </Text>
    </TouchableOpacity>
  );

  const renderArtistItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[styles.gridItem, { backgroundColor: colors.cardBackground }]}
      onPress={() => {
        navigation.goBack();
        setTimeout(() => {
          (navigation as any).navigate('MainTabs', {
            screen: 'HomeTab',
            params: {
              screen: 'ArtistDetail',
              params: {
                artistId: item.id,
                artistName: item.name,
                artistImage: item.image?.[2]?.url || item.image?.[1]?.url || item.image?.[0]?.url,
              },
            },
          });
        }, 100);
      }}
      activeOpacity={0.7}
    >
      <Image
        source={{ uri: item.image?.[2]?.url || item.image?.[1]?.url || item.image?.[0]?.url || 'https://via.placeholder.com/120' }}
        style={styles.gridImage}
      />
      <Text style={[styles.gridTitle, { color: colors.text }]} numberOfLines={2}>
        {item.name}
      </Text>
      <Text style={[styles.gridSubtitle, { color: colors.subText }]} numberOfLines={1}>
        Artist
      </Text>
    </TouchableOpacity>
  );

  const hasResults =
    searchResults.songs.length > 0 ||
    searchResults.albums.length > 0 ||
    searchResults.artists.length > 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search Bar */}
      <View style={[styles.searchBarContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.searchBar, { backgroundColor: colors.cardBackground }]}>
          <Ionicons name="search" size={20} color={colors.subText} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search songs, albums, artists..."
            placeholderTextColor={colors.subText}
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              performSearch(text);
            }}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => { setSearchQuery(''); setSearchResults({ songs: [], albums: [], artists: [] }); }}>
              <Ionicons name="close-circle" size={20} color={colors.subText} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Tabs */}
      {searchQuery.length > 0 && (
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'all' && { backgroundColor: colors.primary }]}
            onPress={() => setActiveTab('all')}
          >
            <Text style={[styles.tabLabel, { color: activeTab === 'all' ? '#fff' : colors.subText }]}>
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'songs' && { backgroundColor: colors.primary }]}
            onPress={() => setActiveTab('songs')}
          >
            <Text style={[styles.tabLabel, { color: activeTab === 'songs' ? '#fff' : colors.subText }]}>
              Songs ({searchResults.songs.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'albums' && { backgroundColor: colors.primary }]}
            onPress={() => setActiveTab('albums')}
          >
            <Text style={[styles.tabLabel, { color: activeTab === 'albums' ? '#fff' : colors.subText }]}>
              Albums ({searchResults.albums.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'artists' && { backgroundColor: colors.primary }]}
            onPress={() => setActiveTab('artists')}
          >
            <Text style={[styles.tabLabel, { color: activeTab === 'artists' ? '#fff' : colors.subText }]}>
              Artists ({searchResults.artists.length})
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Results */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : searchQuery.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="search" size={64} color={colors.subText} style={{ marginBottom: 16 }} />
          <Text style={[styles.emptyText, { color: colors.text }]}>Start searching</Text>
          <Text style={[styles.emptySubtext, { color: colors.subText }]}>
            Search for songs, albums, and artists
          </Text>
        </View>
      ) : !hasResults ? (
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle" size={64} color={colors.subText} style={{ marginBottom: 16 }} />
          <Text style={[styles.emptyText, { color: colors.text }]}>No results found</Text>
          <Text style={[styles.emptySubtext, { color: colors.subText }]}>Try a different search query</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Songs */}
          {(activeTab === 'all' || activeTab === 'songs') && searchResults.songs.length > 0 && (
            <View>
              {activeTab === 'all' && (
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Songs</Text>
              )}
              <FlatList
                data={activeTab === 'all' && !showAllSongsInAllTab ? searchResults.songs.slice(0, 5) : searchResults.songs}
                renderItem={renderSongItem}
                keyExtractor={(item) => `song-${item.id}`}
                scrollEnabled={false}
                nestedScrollEnabled={false}
              />
              {activeTab === 'all' && searchResults.songs.length > 5 && !showAllSongsInAllTab && (
                <TouchableOpacity
                  style={[styles.seeAllButton, { backgroundColor: colors.cardBackground }]}
                  onPress={() => setShowAllSongsInAllTab(true)}
                >
                  <Text style={[styles.seeAllText, { color: colors.primary }]}>See All Songs</Text>
                  <Ionicons name="chevron-forward" size={18} color={colors.primary} />
                </TouchableOpacity>
              )}
              {activeTab === 'all' && showAllSongsInAllTab && searchResults.songs.length > 5 && (
                <TouchableOpacity
                  style={[styles.seeAllButton, { backgroundColor: colors.cardBackground }]}
                  onPress={() => setShowAllSongsInAllTab(false)}
                >
                  <Text style={[styles.seeAllText, { color: colors.primary }]}>Show Less</Text>
                  <Ionicons name="chevron-up" size={18} color={colors.primary} />
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Albums */}
          {(activeTab === 'all' || activeTab === 'albums') && searchResults.albums.length > 0 && (
            <View>
              {activeTab === 'all' && (
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Albums</Text>
              )}
              <FlatList
                data={activeTab === 'all' && !showAllAlbumsInAllTab ? searchResults.albums.slice(0, 4) : searchResults.albums}
                renderItem={renderAlbumItem}
                keyExtractor={(item) => `album-${item.id}`}
                numColumns={2}
                scrollEnabled={false}
                nestedScrollEnabled={false}
                columnWrapperStyle={styles.gridWrapper}
              />
              {activeTab === 'all' && searchResults.albums.length > 4 && !showAllAlbumsInAllTab && (
                <TouchableOpacity
                  style={[styles.seeAllButton, { backgroundColor: colors.cardBackground }]}
                  onPress={() => setShowAllAlbumsInAllTab(true)}
                >
                  <Text style={[styles.seeAllText, { color: colors.primary }]}>See All Albums</Text>
                  <Ionicons name="chevron-forward" size={18} color={colors.primary} />
                </TouchableOpacity>
              )}
              {activeTab === 'all' && showAllAlbumsInAllTab && searchResults.albums.length > 4 && (
                <TouchableOpacity
                  style={[styles.seeAllButton, { backgroundColor: colors.cardBackground }]}
                  onPress={() => setShowAllAlbumsInAllTab(false)}
                >
                  <Text style={[styles.seeAllText, { color: colors.primary }]}>Show Less</Text>
                  <Ionicons name="chevron-up" size={18} color={colors.primary} />
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Artists */}
          {(activeTab === 'all' || activeTab === 'artists') && searchResults.artists.length > 0 && (
            <View>
              {activeTab === 'all' && (
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Artists</Text>
              )}
              <FlatList
                data={activeTab === 'all' && !showAllArtistsInAllTab ? searchResults.artists.slice(0, 2) : searchResults.artists}
                renderItem={renderArtistItem}
                keyExtractor={(item) => `artist-${item.id}`}
                numColumns={2}
                scrollEnabled={false}
                nestedScrollEnabled={false}
                columnWrapperStyle={styles.gridWrapper}
              />
              {activeTab === 'all' && searchResults.artists.length > 2 && !showAllArtistsInAllTab && (
                <TouchableOpacity
                  style={[styles.seeAllButton, { backgroundColor: colors.cardBackground }]}
                  onPress={() => setShowAllArtistsInAllTab(true)}
                >
                  <Text style={[styles.seeAllText, { color: colors.primary }]}>See All Artists</Text>
                  <Ionicons name="chevron-forward" size={18} color={colors.primary} />
                </TouchableOpacity>
              )}
              {activeTab === 'all' && showAllArtistsInAllTab && searchResults.artists.length > 2 && (
                <TouchableOpacity
                  style={[styles.seeAllButton, { backgroundColor: colors.cardBackground }]}
                  onPress={() => setShowAllArtistsInAllTab(false)}
                >
                  <Text style={[styles.seeAllText, { color: colors.primary }]}>Show Less</Text>
                  <Ionicons name="chevron-up" size={18} color={colors.primary} />
                </TouchableOpacity>
              )}
            </View>
          )}

          <View style={{ height: 120 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchBarContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderRadius: 28,
    height: 56,
    gap: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 20,
    marginHorizontal: 4,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginTop: 8,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  emptySubtext: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    gap: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
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
  artistName: {
    fontSize: 13,
    fontWeight: '500',
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
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  seeAllText: {
    fontSize: 15,
    fontWeight: '700',
  },
  gridWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    gap: 16,
  },
  gridItem: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    paddingBottom: 12,
    marginVertical: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
  },
  gridImage: {
    width: '100%',
    height: 160,
    resizeMode: 'cover',
  },
  gridTitle: {
    fontSize: 14,
    fontWeight: '700',
    paddingHorizontal: 12,
    paddingTop: 12,
    textAlign: 'left',
    minHeight: 40,
  },
  gridSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'left',
    paddingHorizontal: 12,
    paddingBottom: 4,
    opacity: 0.7,
  },
});

export default SearchScreen;
