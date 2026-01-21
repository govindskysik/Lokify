import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  AppState,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/colors';
import { useNavigation } from '@react-navigation/native';
import { usePlayerStore } from '../store/playerStore';
import { pauseTrack, resumeTrack, seekTo, getCurrentPosition, getDuration, getIsPlaying, loadTrack, playTrack } from '../services/musicPlayerService';

const PlayerScreen = () => {
  const colors = useTheme();
  const navigation = useNavigation();
  const { queue, currentTrackIndex, setShowMiniPlayer, isPlaying, setIsPlaying } = usePlayerStore();
  const [currentTrack, setCurrentTrack] = useState<any>(null);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const updateInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (currentTrackIndex !== null && queue[currentTrackIndex]) {
      setCurrentTrack(queue[currentTrackIndex]);
    }
  }, [currentTrackIndex, queue]);

  // Update position every 500ms when playing
  useEffect(() => {
    if (isPlaying) {
      updateInterval.current = setInterval(() => {
        setPosition(getCurrentPosition());
        setDuration(getDuration());
      }, 500);
    } else {
      if (updateInterval.current) {
        clearInterval(updateInterval.current);
      }
    }

    return () => {
      if (updateInterval.current) {
        clearInterval(updateInterval.current);
      }
    };
  }, [isPlaying]);

  const handlePlayPause = async () => {
    try {
      if (isPlaying) {
        await pauseTrack();
        setIsPlaying(false);
      } else {
        await resumeTrack();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Error toggling play/pause:', error);
    }
  };

  const handleSkipNext = async () => {
    try {
      if (currentTrackIndex !== null && currentTrackIndex < queue.length - 1) {
        const nextTrack = queue[currentTrackIndex + 1];
        await loadTrack(nextTrack);
        await playTrack();
        setIsPlaying(true);
        setCurrentTrack(nextTrack);
      }
    } catch (error) {
      console.error('Error skipping next:', error);
    }
  };

  const handleSkipPrevious = async () => {
    try {
      if (currentTrackIndex !== null && currentTrackIndex > 0) {
        const prevTrack = queue[currentTrackIndex - 1];
        await loadTrack(prevTrack);
        await playTrack();
        setIsPlaying(true);
        setCurrentTrack(prevTrack);
      }
    } catch (error) {
      console.error('Error skipping previous:', error);
    }
  };

  const formatTime = (seconds: number) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? (position / duration) * 100 : 0;

  if (!currentTrack) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={[styles.emptyText, { color: colors.subText }]}>No song playing</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-down" size={32} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Now Playing</Text>
        <TouchableOpacity>
          <Ionicons name="ellipsis-vertical" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Album Art */}
        <View style={styles.albumArtContainer}>
          <Image
            source={{
              uri: currentTrack.image?.[2]?.url || currentTrack.image?.[0]?.url || 'https://via.placeholder.com/300',
            }}
            style={styles.albumArt}
          />
        </View>

        {/* Song Info */}
        <View style={styles.songInfoContainer}>
          <Text style={[styles.songTitle, { color: colors.text }]}>{currentTrack.name}</Text>
          <Text style={[styles.artistName, { color: colors.subText }]}>
            {currentTrack.artists?.primary?.[0]?.name || 'Unknown Artist'}
          </Text>
          {currentTrack.album?.name && (
            <Text style={[styles.albumName, { color: colors.subText }]}>
              {currentTrack.album.name}
            </Text>
          )}
        </View>

        {/* Progress */}
        <View style={styles.progressSection}>
          <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.progressFill,
                { backgroundColor: colors.primary, width: `${progressPercent}%` },
              ]}
            />
          </View>
          <View style={styles.timeContainer}>
            <Text style={[styles.timeText, { color: colors.subText }]}>
              {formatTime(position)}
            </Text>
            <Text style={[styles.timeText, { color: colors.subText }]}>
              {formatTime(duration)}
            </Text>
          </View>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity style={styles.controlButton}>
            <Ionicons name="heart-outline" size={28} color={colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity onPress={handleSkipPrevious} style={styles.controlButton}>
            <Ionicons name="play-skip-back" size={32} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handlePlayPause}
            style={[styles.playButton, { backgroundColor: colors.primary }]}
          >
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={36}
              color="#fff"
            />
          </TouchableOpacity>

          <TouchableOpacity onPress={handleSkipNext} style={styles.controlButton}>
            <Ionicons name="play-skip-forward" size={32} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlButton}>
            <Ionicons name="repeat" size={28} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Queue Preview */}
        {queue.length > 1 && (
          <View style={styles.queuePreview}>
            <Text style={[styles.queueTitle, { color: colors.text }]}>
              Up Next ({queue.length - (currentTrackIndex || 0) - 1})
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.queueList}
            >
              {queue.slice((currentTrackIndex || 0) + 1, (currentTrackIndex || 0) + 4).map((song, index) => (
                <View
                  key={song.id}
                  style={[styles.queueItem, { backgroundColor: colors.cardBackground }]}
                >
                  <Image
                    source={{
                      uri: song.image?.[1]?.url || song.image?.[0]?.url || 'https://via.placeholder.com/80',
                    }}
                    style={styles.queueItemArt}
                  />
                  <Text style={[styles.queueItemTitle, { color: colors.text }]} numberOfLines={2}>
                    {song.name}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  albumArtContainer: {
    alignItems: 'center',
    marginVertical: 24,
  },
  albumArt: {
    width: 280,
    height: 280,
    borderRadius: 20,
  },
  songInfoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  songTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  artistName: {
    fontSize: 16,
    marginBottom: 4,
    textAlign: 'center',
  },
  albumName: {
    fontSize: 14,
    textAlign: 'center',
  },
  progressSection: {
    marginBottom: 32,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    fontSize: 12,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 48,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  queuePreview: {
    marginBottom: 32,
  },
  queueTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  queueList: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  queueItem: {
    width: 120,
    marginRight: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  queueItemArt: {
    width: '100%',
    height: 100,
  },
  queueItemTitle: {
    fontSize: 12,
    fontWeight: '600',
    padding: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PlayerScreen;
