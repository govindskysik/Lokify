import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/colors';
import { useNavigation } from '@react-navigation/native';
import { usePlayerStore, useCurrentTrack, useIsPlaying } from '../store/playerStore';
import { pauseTrack, resumeTrack, getCurrentPosition, getDuration, loadTrack, playTrack, seekForward, seekBackward } from '../services/musicPlayerService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Calculate once at module level
const ALBUM_ART_SIZE = SCREEN_WIDTH;
const HALF_SCREEN_HEIGHT = SCREEN_HEIGHT * 0.5;
const PLAY_BUTTON_SIZE = Math.min(SCREEN_WIDTH * 0.18, 70);
const CONTROL_BUTTON_SIZE = Math.min(SCREEN_WIDTH * 0.14, 56);
const ACTION_BUTTON_SIZE = 70;
const ICON_SIZES = {
  heart: 32,
  skip: CONTROL_BUTTON_SIZE * 0.57,
  play: PLAY_BUTTON_SIZE * 0.51,
  repeat: CONTROL_BUTTON_SIZE * 0.5,
};

const PlayerScreen = () => {
  const colors = useTheme();
  const navigation = useNavigation();
  
  // Get store values using consistent selectors
  const queue = usePlayerStore((state) => state.queue);
  const currentTrackIndex = usePlayerStore((state) => state.currentTrackIndex);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const setCurrentTrackIndex = usePlayerStore((state) => state.setCurrentTrackIndex);
  const setIsPlaying = usePlayerStore((state) => state.setIsPlaying);
  
  console.log('[PlayerScreen] RENDER - current values:', {
    currentTrackIndex,
    queueLength: queue?.length,
    isPlaying,
  });
  
  const currentTrack = useMemo(() => {
    return currentTrackIndex !== null ? queue[currentTrackIndex] : null;
  }, [currentTrackIndex, queue]);

  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>('off');
  const updateInterval = useRef<NodeJS.Timeout | null>(null);

  // Update position only when playing
  useEffect(() => {
    if (isPlaying) {
      updateInterval.current = setInterval(() => {
        setPosition(getCurrentPosition());
        setDuration(getDuration());
      }, 1000); // Changed from 500ms to 1000ms
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

  const handlePlayPause = useCallback(async () => {
    try {
      console.log('[PlayerScreen] Play/Pause clicked, current isPlaying:', isPlaying);
      if (isPlaying) {
        console.log('[PlayerScreen] Pausing track');
        await pauseTrack();
        setIsPlaying(false);
      } else {
        console.log('[PlayerScreen] Resuming track');
        await resumeTrack();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('[PlayerScreen] Error toggling play/pause:', error);
    }
  }, [isPlaying, setIsPlaying]);

  const handleSkipNext = useCallback(async () => {
    console.log('[SKIP NEXT] Button pressed! Index:', currentTrackIndex, 'Queue:', queue.length);
    
    try {
      if (!queue || queue.length === 0) {
        console.log('[SKIP NEXT] Queue empty');
        return;
      }

      if (currentTrackIndex === null || currentTrackIndex === undefined) {
        console.log('[SKIP NEXT] No track, starting first');
        setCurrentTrackIndex(0);
        await loadTrack(queue[0]);
        await playTrack();
        setIsPlaying(true);
        return;
      }

      if (currentTrackIndex < queue.length - 1) {
        console.log('[SKIP NEXT] Going to next:', currentTrackIndex + 1);
        const next = currentTrackIndex + 1;
        setCurrentTrackIndex(next);
        await loadTrack(queue[next]);
        await playTrack();
        setIsPlaying(true);
      } else {
        console.log('[SKIP NEXT] At end, repeat:', repeatMode);
        if (repeatMode === 'all') {
          setCurrentTrackIndex(0);
          await loadTrack(queue[0]);
          await playTrack();
          setIsPlaying(true);
        }
      }
    } catch (err) {
      console.error('[SKIP NEXT] Error:', err);
    }
  }, [currentTrackIndex, queue, setCurrentTrackIndex, setIsPlaying, repeatMode]);

  const handleSkipPrevious = useCallback(async () => {
    try {
      console.log('[PlayerScreen] Skip previous clicked, currentTrackIndex:', currentTrackIndex);
      if (currentTrackIndex === null || queue.length === 0) {
        console.log('[PlayerScreen] No current track or empty queue');
        return;
      }
      
      if (currentTrackIndex > 0) {
        const prevIndex = currentTrackIndex - 1;
        const prevTrack = queue[prevIndex];
        console.log('[PlayerScreen] Loading previous track at index', prevIndex, ':', prevTrack.name);
        const loaded = await loadTrack(prevTrack);
        if (loaded) {
          setCurrentTrackIndex(prevIndex);
          const playing = await playTrack();
          if (playing) {
            setIsPlaying(true);
            console.log('[PlayerScreen] Previous track started:', prevTrack.name);
          } else {
            console.error('[PlayerScreen] Failed to play previous track');
          }
        } else {
          console.error('[PlayerScreen] Failed to load previous track');
        }
      } else if (position > 2) {
        // If at start of first track and already played 2+ seconds, restart current track
        console.log('[PlayerScreen] Restarting current track');
        const currentTrack = queue[0];
        const loaded = await loadTrack(currentTrack);
        if (loaded) {
          const playing = await playTrack();
          if (playing) {
            setIsPlaying(true);
            console.log('[PlayerScreen] Current track restarted');
          } else {
            console.error('[PlayerScreen] Failed to restart current track');
          }
        } else {
          console.error('[PlayerScreen] Failed to load current track');
        }
      }
    } catch (error) {
      console.error('[PlayerScreen] Error skipping previous:', error);
    }
  }, [currentTrackIndex, queue, setCurrentTrackIndex, setIsPlaying, position]);

  const handleSeekBackward = useCallback(async () => {
    try {
      console.log('Seek backward pressed');
      await seekBackward(10);
      setPosition(getCurrentPosition());
    } catch (error) {
      console.error('Error seeking backward:', error);
    }
  }, []);

  const handleSeekForward = useCallback(async () => {
    try {
      console.log('Seek forward pressed');
      await seekForward(10);
      setPosition(getCurrentPosition());
    } catch (error) {
      console.error('Error seeking forward:', error);
    }
  }, []);

  const handleRepeatToggle = useCallback(() => {
    setRepeatMode((prev) => {
      if (prev === 'off') {
        console.log('Repeat mode: ALL');
        return 'all';
      } else if (prev === 'all') {
        console.log('Repeat mode: ONE');
        return 'one';
      } else {
        console.log('Repeat mode: OFF');
        return 'off';
      }
    });
  }, []);

  const formatTime = (seconds: number) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? (position / duration) * 100 : 0;

  if (!currentTrack) {
    console.log('[PlayerScreen] No current track - Queue length:', queue.length, 'Index:', currentTrackIndex);
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="chevron-down" size={32} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Now Playing</Text>
          <View style={{ width: 32 }} />
        </View>
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={[styles.emptyText, { color: colors.subText }]}>No song playing</Text>
          <Text style={[styles.emptyText, { color: colors.subText, fontSize: 12, marginTop: 8 }]}>Select a song to start</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="chevron-down" size={32} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Now Playing</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        scrollEnabled={false}
        pointerEvents="box-none"
      >
        {/* Album Art Container - Full Width Half Screen */}
        <View style={[styles.albumArtContainer, { height: HALF_SCREEN_HEIGHT }]}>
          <Image
            source={{
              uri: currentTrack.image?.[2]?.url || currentTrack.image?.[0]?.url || 'https://via.placeholder.com/300',
            }}
            style={styles.albumArt}
            resizeMode="cover"
          />
          
          {/* Song Info Overlay */}
          <View style={[styles.infoOverlay, { backgroundColor: colors.background + 'E6' }]}>
            <Text style={[styles.overlayTitle, { color: colors.text }]} numberOfLines={2}>
              {currentTrack.name}
            </Text>
            <Text style={[styles.overlayArtist, { color: colors.subText }]} numberOfLines={1}>
              {currentTrack.artists?.primary?.[0]?.name || 'Unknown Artist'}
            </Text>
          </View>
        </View>

        {/* Progress */}
        <View style={[styles.progressSection, { backgroundColor: colors.background }]}>
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

        {/* Favorite and Playlist Buttons - Large */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.largeActionButton, { borderColor: colors.primary }]}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            activeOpacity={0.6}
          >
            <Ionicons name="heart-outline" size={ICON_SIZES.heart} color={colors.primary} />
            <Text style={[styles.actionButtonText, { color: colors.text }]}>Favorite</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.largeActionButton, { borderColor: colors.primary }]}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            activeOpacity={0.6}
          >
            <Ionicons name="list" size={ICON_SIZES.heart} color={colors.primary} />
            <Text style={[styles.actionButtonText, { color: colors.text }]}>Playlist</Text>
          </TouchableOpacity>
        </View>

        {/* Controls - Main Playback */}
        <View style={styles.mainControls}>
          <TouchableOpacity
            onPress={handlePlayPause}
            style={[styles.largePlayButton, { backgroundColor: colors.primary }]}
            activeOpacity={0.7}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          >
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={50}
              color="#fff"
            />
          </TouchableOpacity>
        </View>

        {/* Skip Controls */}
        <View style={styles.skipControls} pointerEvents="auto">
          <TouchableOpacity 
            onPress={handleSkipPrevious} 
            style={[styles.skipButton, { borderColor: colors.primary }]}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
            activeOpacity={0.6}
          >
            <Ionicons name="play-skip-back" size={32} color={colors.text} />
            <Text style={[styles.skipLabel, { color: colors.subText }]}>Previous</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={async () => {
              try {
                if (!queue || queue.length === 0) return;
                
                if (currentTrackIndex === null || currentTrackIndex === undefined) {
                  setCurrentTrackIndex(0);
                  await loadTrack(queue[0]);
                  await playTrack();
                  setIsPlaying(true);
                } else if (currentTrackIndex < queue.length - 1) {
                  const next = currentTrackIndex + 1;
                  setCurrentTrackIndex(next);
                  await loadTrack(queue[next]);
                  await playTrack();
                  setIsPlaying(true);
                } else if (repeatMode === 'all') {
                  setCurrentTrackIndex(0);
                  await loadTrack(queue[0]);
                  await playTrack();
                  setIsPlaying(true);
                }
              } catch (err) {
                alert('Error: ' + err);
              }
            }}
            style={[styles.skipButton, { borderColor: colors.primary }]}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
            activeOpacity={0.6}
          >
            <Ionicons name="play-skip-forward" size={32} color={colors.text} />
            <Text style={[styles.skipLabel, { color: colors.subText }]}>Next</Text>
          </TouchableOpacity>
        </View>

        {/* Seek Controls */}
        <View style={styles.seekControls}>
          <TouchableOpacity 
            onPress={handleSeekBackward}
            style={[styles.seekButton, { backgroundColor: colors.primary + '20' }]}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
            activeOpacity={0.6}
          >
            <Ionicons name="chevron-back" size={24} color={colors.primary} />
            <Text style={[styles.seekLabel, { color: colors.text }]}>-10s</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.controlButton, { width: CONTROL_BUTTON_SIZE, height: CONTROL_BUTTON_SIZE }]}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
            onPress={handleRepeatToggle}
            activeOpacity={0.6}
          >
            <Ionicons 
              name={repeatMode === 'one' ? 'repeat-one' : 'repeat'} 
              size={ICON_SIZES.repeat} 
              color={repeatMode === 'off' ? colors.primary : colors.primary}
              style={{ opacity: repeatMode === 'off' ? 0.5 : 1 }}
            />
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => {
              console.log('[SEEK FORWARD] Seek forward button pressed!');
              handleSeekForward();
            }}
            style={[styles.seekButton, { backgroundColor: colors.primary + '20' }]}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
            activeOpacity={0.6}
          >
            <Ionicons name="chevron-forward" size={24} color={colors.primary} />
            <Text style={[styles.seekLabel, { color: colors.text }]}>+10s</Text>
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
              removeClippedSubviews={true}
            >
              {queue.slice((currentTrackIndex || 0) + 1, (currentTrackIndex || 0) + 4).map((song) => (
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
    paddingHorizontal: 0,
  },
  albumArtContainer: {
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  albumArt: {
    width: '100%',
    height: '100%',
  },
  infoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  overlayTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  overlayArtist: {
    fontSize: 14,
  },
  progressSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    marginBottom: 8,
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
    fontSize: 11,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  largeActionButton: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 12,
    paddingVertical: 16,
    gap: 8,
  },
  mainControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  largePlayButton: {
    width: PLAY_BUTTON_SIZE,
    height: PLAY_BUTTON_SIZE,
    borderRadius: PLAY_BUTTON_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  skipControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    gap: 15,
  },
  skipButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
  skipLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  seekControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    gap: 15,
  },
  seekButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',
    gap: 4,
  },
  seekLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  controlButton: {
    borderRadius: CONTROL_BUTTON_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  queuePreview: {
    paddingVertical: 12,
  },
  queueTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  queueList: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  queueItem: {
    width: Math.min(SCREEN_WIDTH * 0.3, 120),
    marginRight: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  queueItemArt: {
    width: '100%',
    height: Math.min(SCREEN_WIDTH * 0.25, 100),
  },
  queueItemTitle: {
    fontSize: 11,
    fontWeight: '600',
    padding: 6,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PlayerScreen;
