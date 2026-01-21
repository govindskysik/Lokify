import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Animated,
  Dimensions,
  ActivityIndicator,
  PanResponder,
  GestureResponderEvent,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/colors';
import { usePlayerStore } from '../store/playerStore';
import { pauseTrack, resumeTrack, getCurrentPosition, getDuration, getIsPlaying, loadTrack, playTrack, seekTo, setOnTrackFinish } from '../services/musicPlayerService';
import { getSongLyrics } from '../api/search';

const { height: screenHeight } = Dimensions.get('window');

interface ExpandedPlayerProps {
  isExpanded: boolean;
  onCollapse: () => void;
}

const ExpandedPlayer = ({ isExpanded, onCollapse }: ExpandedPlayerProps) => {
  const colors = useTheme();
  const { queue, currentTrackIndex, isPlaying, setIsPlaying, setCurrentTrackIndex } = usePlayerStore();
  const [currentTrack, setCurrentTrack] = useState<any>(null);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [progressBarWidth, setProgressBarWidth] = useState(0);
  const [showLyrics, setShowLyrics] = useState(false);
  const [lyrics, setLyrics] = useState<string | null>(null);
  const [loadingLyrics, setLoadingLyrics] = useState(false);
  const updateInterval = useRef<NodeJS.Timeout | null>(null);
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (evt: GestureResponderEvent, gestureState) => {
        if (gestureState.dy > 0) {
          slideAnim.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (evt: GestureResponderEvent, gestureState) => {
        // If swiped down more than 100 points, collapse
        if (gestureState.dy > 100) {
          onCollapse();
        } else {
          // Snap back to top with smooth animation
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 250,
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  const progressPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const locationX = evt.nativeEvent.locationX;
        handleProgressSeek(locationX);
      },
      onPanResponderMove: (evt) => {
        const locationX = evt.nativeEvent.locationX;
        handleProgressSeek(locationX);
      },
    })
  ).current;

  const handleProgressSeek = (locationX: number) => {
    if (progressBarWidth === 0 || duration === 0) return;
    const percentage = Math.max(0, Math.min(1, locationX / progressBarWidth));
    const newPosition = duration * percentage;
    seekTo(newPosition);
    setPosition(newPosition);
  };

  useEffect(() => {
    if (currentTrackIndex !== null && queue[currentTrackIndex]) {
      setCurrentTrack(queue[currentTrackIndex]);
    }
  }, [currentTrackIndex, queue]);

  useEffect(() => {
    // Set up auto-play next track when current track finishes
    setOnTrackFinish(() => {
      if (currentTrackIndex !== null && currentTrackIndex < queue.length - 1) {
        handleSkipNext();
      }
    });
  }, [currentTrackIndex, queue]);

  useEffect(() => {
    if (isExpanded) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: false,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: screenHeight,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  }, [isExpanded, slideAnim]);

  useEffect(() => {
    if (isExpanded && isPlaying) {
      updateInterval.current = setInterval(() => {
        setPosition(getCurrentPosition());
        setDuration(getDuration());
      }, 1000);
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
  }, [isExpanded, isPlaying]);

  const handleFetchLyrics = async () => {
    if (!currentTrack || !currentTrack.hasLyrics) {
      setLyrics('No lyrics available for this song');
      setShowLyrics(true);
      return;
    }

    setShowLyrics(true);
    setLoadingLyrics(true);
    
    const fetchedLyrics = await getSongLyrics(currentTrack.id);
    setLyrics(fetchedLyrics || 'Lyrics not found');
    setLoadingLyrics(false);
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

  const handleRewind = () => {
    const newPosition = Math.max(0, position - 5); // 5 seconds back
    seekTo(newPosition);
    setPosition(newPosition);
  };

  const handleForward = () => {
    const newPosition = Math.min(duration, position + 5); // 5 seconds forward
    seekTo(newPosition);
    setPosition(newPosition);
  };

  const handleSkipNext = async () => {
    try {
      // Prevent multiple concurrent loads
      if (isLoading) return;
      
      if (currentTrackIndex !== null && currentTrackIndex < queue.length - 1) {
        const nextIndex = currentTrackIndex + 1;
        const nextTrack = queue[nextIndex];
        
        // Update index immediately for instant UI feedback
        setCurrentTrackIndex(nextIndex);
        setCurrentTrack(nextTrack);
        setIsLoading(true);
        
        // Load and play in background
        const loaded = await loadTrack(nextTrack);
        if (loaded) {
          await playTrack();
          setIsPlaying(true);
        }
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error skipping to next track:', error);
      setIsLoading(false);
      setIsPlaying(false);
    }
  };

  const handleSkipPrevious = async () => {
    try {
      // Prevent multiple concurrent loads
      if (isLoading) return;
      
      if (currentTrackIndex !== null) {
        if (currentTrackIndex > 0) {
          // If there's a previous song, go to it
          const prevIndex = currentTrackIndex - 1;
          const prevTrack = queue[prevIndex];
          
          // Update index immediately for instant UI feedback
          setCurrentTrackIndex(prevIndex);
          setCurrentTrack(prevTrack);
          setIsLoading(true);
          
          // Load and play in background
          const loaded = await loadTrack(prevTrack);
          if (loaded) {
            await playTrack();
            setIsPlaying(true);
          }
          setIsLoading(false);
        } else {
          // If no previous song, reset current song to beginning
          seekTo(0);
          setPosition(0);
        }
      }
    } catch (error) {
      console.error('Error skipping to previous track:', error);
      setIsLoading(false);
      setIsPlaying(false);
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
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: colors.background, transform: [{ translateY: slideAnim }] },
      ]}
      {...panResponder.panHandlers}
    >
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onCollapse}>
            <Ionicons name="arrow-back" size={28} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity>
            <Ionicons name="ellipsis-horizontal-circle" size={28} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
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
              {currentTrack.artists?.primary?.map((a: any) => a.name).join(', ') || 'Unknown Artist'}
            </Text>
          </View>

          {/* Progress */}
          <View style={styles.progressSection}>
            <View 
              style={[styles.progressBar, { backgroundColor: colors.border }]}
              onLayout={(e) => setProgressBarWidth(e.nativeEvent.layout.width)}
              {...progressPanResponder.panHandlers}
            >
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

          {/* Main Controls Row */}
          <View style={styles.mainControls}>
            <TouchableOpacity onPress={handleSkipPrevious} style={styles.skipButton}>
              <Ionicons name="play-skip-back" size={28} color={colors.text} />
            </TouchableOpacity>

            <TouchableOpacity onPress={handleRewind} style={styles.smallControlButton}>
              <Ionicons name="play-back" size={24} color={colors.text} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handlePlayPause}
              style={[styles.playButton, { backgroundColor: colors.primary }]}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="large" color="#fff" />
              ) : (
                <Ionicons
                  name={isPlaying ? 'pause' : 'play'}
                  size={40}
                  color="#fff"
                />
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={handleForward} style={styles.smallControlButton}>
              <Ionicons name="play-forward" size={24} color={colors.text} />
            </TouchableOpacity>

            <TouchableOpacity onPress={handleSkipNext} style={styles.skipButton}>
              <Ionicons name="play-skip-forward" size={28} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Secondary Controls Row */}
          <View style={styles.secondaryControls}>
            <TouchableOpacity style={styles.secondaryButton}>
              <Ionicons name="heart-outline" size={28} color={colors.text} />
              <Text style={[styles.secondaryButtonText, { color: colors.subText }]}>Favorite</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton}>
              <Ionicons name="list" size={28} color={colors.text} />
              <Text style={[styles.secondaryButtonText, { color: colors.subText }]}>Playlist</Text>
            </TouchableOpacity>
          </View>

          {/* Lyrics Section */}
          <TouchableOpacity style={styles.lyricsSection} onPress={handleFetchLyrics}>
            <Ionicons name="musical-notes" size={20} color={colors.primary} />
            <Text style={[styles.lyricsText, { color: colors.text }]}>
              {currentTrack?.hasLyrics ? 'View Lyrics' : 'No Lyrics Available'}
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Lyrics Modal */}
        <Modal
          visible={showLyrics}
          animationType="slide"
          transparent={false}
          onRequestClose={() => setShowLyrics(false)}
        >
          <SafeAreaView style={[styles.lyricsModal, { backgroundColor: colors.background }]}>
            <View style={styles.lyricsHeader}>
              <TouchableOpacity onPress={() => setShowLyrics(false)} style={styles.closeButton}>
                <Ionicons name="chevron-down" size={28} color={colors.text} />
              </TouchableOpacity>
              <Text style={[styles.lyricsTitle, { color: colors.text }]}>Lyrics</Text>
              <View style={{ width: 28 }} />
            </View>
            
            <ScrollView style={styles.lyricsContent} contentContainerStyle={styles.lyricsContentContainer}>
              {loadingLyrics ? (
                <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
              ) : (
                <Text style={[styles.lyricsBody, { color: colors.text }]}>{lyrics}</Text>
              )}
            </ScrollView>
          </SafeAreaView>
        </Modal>
      </SafeAreaView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 200,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  albumArtContainer: {
    alignItems: 'center',
    marginVertical: 30,
  },
  albumArt: {
    width: 240,
    height: 240,
    borderRadius: 24,
  },
  songInfoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  songTitle: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  artistName: {
    fontSize: 15,
  },
  albumName: {
    fontSize: 13,
  },
  progressSection: {
    marginBottom: 32,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  mainControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 32,
  },
  skipButton: {
    padding: 8,
  },
  smallControlButton: {
    padding: 8,
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryControls: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    marginBottom: 32,
    paddingHorizontal: 40,
  },
  secondaryButton: {
    padding: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 12,
    marginTop: 4,
  },
  lyricsSection: {
    alignItems: 'center',
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  lyricsText: {
    fontSize: 14,
    fontWeight: '600',
  },
  lyricsModal: {
    flex: 1,
  },
  lyricsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  closeButton: {
    padding: 4,
  },
  lyricsTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  lyricsContent: {
    flex: 1,
  },
  lyricsContentContainer: {
    padding: 24,
  },
  lyricsBody: {
    fontSize: 16,
    lineHeight: 28,
    textAlign: 'center',
  },
});

export default ExpandedPlayer;
