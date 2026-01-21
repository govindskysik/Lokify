import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/colors';
import { usePlayerStore } from '../store/playerStore';
import { loadTrack, playTrack } from '../services/musicPlayerService';
import { Song } from '../types';
import { deleteSong } from '../services/downloadService';

const DownloadsScreen = () => {
  const colors = useTheme();
  const { 
    downloadedSongs,
    loadDownloadedSongs,
    removeDownloadedSong,
    setQueue,
    setCurrentTrackIndex,
    setIsPlaying,
    setShowMiniPlayer,
    setShowExpandedPlayer,
  } = usePlayerStore();

  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadDownloadedSongs();
  }, []);

  const handlePlaySong = async (song: Song, index: number) => {
    try {
      // Create queue from downloaded songs
      const songsQueue = downloadedSongs.map(ds => ds.song);
      setQueue(songsQueue);
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

  const handleDeleteDownload = async (songId: string, songName: string) => {
    Alert.alert(
      'Remove Download',
      `Remove "${songName}" from downloads?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleting(songId);
              await deleteSong(songId);
              removeDownloadedSong(songId);
              setDeleting(null);
            } catch (error) {
              console.error('Error deleting download:', error);
              Alert.alert('Error', 'Failed to remove download');
              setDeleting(null);
            }
          },
        },
      ]
    );
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 MB';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0 || diffDays === 1) {
      return 'Today';
    } else if (diffDays === 2) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const renderSongItem = ({ item, index }: { item: any; index: number }) => (
    <TouchableOpacity
      style={styles.songItem}
      onPress={() => handlePlaySong(item.song, index)}
      activeOpacity={0.7}
    >
      <Image
        source={{ 
          uri: item.song.image?.[2]?.url || item.song.image?.[0]?.url || 'https://via.placeholder.com/60' 
        }}
        style={styles.thumbnail}
      />
      <View style={styles.songInfo}>
        <Text style={[styles.songName, { color: colors.text }]} numberOfLines={1}>
          {item.song.name}
        </Text>
        <Text style={[styles.artistInfo, { color: colors.subText }]} numberOfLines={1}>
          {item.song.artists?.primary?.[0]?.name || 'Unknown Artist'}
        </Text>
        <View style={styles.metaInfo}>
          <Ionicons name="checkmark-circle" size={12} color={colors.primary} />
          <Text style={[styles.downloadDate, { color: colors.subText }]}>
            {formatDate(item.downloadedAt)}
          </Text>
        </View>
      </View>
      <TouchableOpacity
        style={[styles.playButton, { backgroundColor: colors.primary }]}
        onPress={() => handlePlaySong(item.song, index)}
      >
        <Ionicons name="play" size={18} color="#fff" />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteDownload(item.id, item.song.name)}
        disabled={deleting === item.id}
      >
        {deleting === item.id ? (
          <Ionicons name="hourglass" size={24} color={colors.subText} />
        ) : (
          <Ionicons name="trash-outline" size={24} color={colors.error || '#FF6B6B'} />
        )}
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Downloads</Text>
        <Text style={[styles.headerSubtitle, { color: colors.subText }]}>
          {downloadedSongs.length} {downloadedSongs.length === 1 ? 'song' : 'songs'}
        </Text>
      </View>

      {downloadedSongs.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="download-outline" size={80} color={colors.subText} />
          <Text style={[styles.emptyText, { color: colors.text }]}>No downloads yet</Text>
          <Text style={[styles.emptySubtext, { color: colors.subText }]}>
            Download songs to listen offline
          </Text>
        </View>
      ) : (
        <FlatList
          data={downloadedSongs}
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
    marginBottom: 4,
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  downloadDate: {
    fontSize: 12,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  deleteButton: {
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

export default DownloadsScreen;
