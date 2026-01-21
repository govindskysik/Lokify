import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  AppState,
  AppStateStatus,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/colors';
import { usePlayerStore } from '../store/playerStore';
import { pauseTrack, resumeTrack, seekTo, getCurrentPosition, getDuration, getIsPlaying, loadTrack, playTrack } from '../services/musicPlayerService';

const MiniPlayer = ({ onPress }: { onPress: () => void }) => {
  const colors = useTheme();
  const { queue, currentTrackIndex, showMiniPlayer, setCurrentTrackIndex, isPlaying, setIsPlaying } = usePlayerStore();
  const [currentTrack, setCurrentTrack] = useState<any>(null);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const appState = useRef(AppState.currentState);
  const updateInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (currentTrackIndex !== null && queue[currentTrackIndex]) {
      setCurrentTrack(queue[currentTrackIndex]);
    }
  }, [currentTrackIndex, queue]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (showMiniPlayer) {
      updateInterval.current = setInterval(async () => {
        const pos = getCurrentPosition();
        const dur = getDuration();
        setPosition(pos);
        setDuration(dur);
        const playing = await getIsPlaying();
        setIsPlaying(playing);
      }, 500);
    }
    return () => {
      if (updateInterval.current) {
        clearInterval(updateInterval.current);
      }
    };
  }, [showMiniPlayer, setIsPlaying]);

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    appState.current = nextAppState;
  };

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
        const nextIndex = currentTrackIndex + 1;
        const nextTrack = queue[nextIndex];
        
        // Update index immediately for instant UI feedback
        setCurrentTrackIndex(nextIndex);
        setCurrentTrack(nextTrack);
        setIsLoading(true);
        
        // Load and play in background
        await loadTrack(nextTrack);
        await playTrack();
        setIsPlaying(true);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error skipping to next track:', error);
      setIsLoading(false);
    }
  };

  if (!showMiniPlayer || !currentTrack) {
    return null;
  }

  const progressPercent = duration > 0 ? (position / duration) * 100 : 0;

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.cardBackground, borderTopColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.95}
    >
      <View style={styles.content}>
        {/* Album art */}
        <Image
          source={{
            uri: currentTrack.image?.[2]?.url || currentTrack.image?.[0]?.url || 'https://via.placeholder.com/50',
          }}
          style={styles.albumArt}
        />

        {/* Song info */}
        <View style={styles.songInfo}>
          <Text style={[styles.songName, { color: colors.text }]} numberOfLines={1}>
            {currentTrack.name}
          </Text>
          <Text style={[styles.artistName, { color: colors.subText }]} numberOfLines={1}>
            {currentTrack.artists?.primary?.[0]?.name || 'Unknown Artist'}
          </Text>
        </View>

        {/* Controls */}
        <TouchableOpacity onPress={handlePlayPause} style={styles.playButton} disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={24}
              color={colors.primary}
            />
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={handleSkipNext} style={styles.nextButton} disabled={isLoading}>
          <Ionicons name="play-skip-forward" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Progress bar as bottom border */}
      <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
        <View
          style={[
            styles.progressFill,
            { backgroundColor: colors.primary, width: `${progressPercent}%` },
          ]}
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 12,
    marginBottom: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  progressBar: {
    height: 3,
    width: '100%',
    marginTop: 8,
    borderRadius: 0,
  },
  progressFill: {
    height: '100%',
    borderRadius: 0,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  albumArt: {
    width: 50,
    height: 50,
    borderRadius: 6,
  },
  songInfo: {
    flex: 1,
  },
  songName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  artistName: {
    fontSize: 12,
  },
  playButton: {
    padding: 8,
  },
  nextButton: {
    padding: 8,
  },
});

export default MiniPlayer;
