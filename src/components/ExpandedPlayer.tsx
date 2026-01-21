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
import { downloadSong, deleteSong } from '../services/downloadService';

const { height: screenHeight } = Dimensions.get('window');

interface ExpandedPlayerProps {
  isExpanded: boolean;
  onCollapse: () => void;
}

const ExpandedPlayer = ({ isExpanded, onCollapse }: ExpandedPlayerProps) => {
  const colors = useTheme();
  const {
    queue,
    currentTrackIndex,
    isPlaying,
    setIsPlaying,
    setCurrentTrackIndex,
    setShowMiniPlayer,
    favorites,
    addToFavorites,
    removeFromFavorites,
    isFavorite,
    isShuffle,
    setIsShuffle,
    shuffleQueue,
    downloadedSongs,
    downloadProgress,
    setDownloadProgress,
    addDownloadedSong,
    removeDownloadedSong,
    isDownloaded,
  } = usePlayerStore();
  const [currentTrack, setCurrentTrack] = useState<any>(null);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [progressBarWidth, setProgressBarWidth] = useState(0);
  const [showLyrics, setShowLyrics] = useState(false);
  const [lyrics, setLyrics] = useState<string | null>(null);
  const [loadingLyrics, setLoadingLyrics] = useState(false);
  const [showQueueModal, setShowQueueModal] = useState(false);
  const [showMenuModal, setShowMenuModal] = useState(false);
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

  const handleToggleFavorite = () => {
    if (!currentTrack) return;
    
    if (isFavorite(currentTrack.id)) {
      removeFromFavorites(currentTrack.id);
    } else {
      addToFavorites(currentTrack);
    }
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

  const handleDownload = async () => {
    if (!currentTrack) return;
    
    try {
      const downloaded = isDownloaded(currentTrack.id);
      
      if (downloaded) {
        // Delete the song
        await deleteSong(currentTrack.id);
        removeDownloadedSong(currentTrack.id);
        console.log('Deleted song:', currentTrack.name);
      } else {
        // Download the song
        console.log('Starting download:', currentTrack.name);
        const localPath = await downloadSong(currentTrack, (progress) => {
          setDownloadProgress(currentTrack.id, progress);
        });
        
        addDownloadedSong({
          id: currentTrack.id,
          localPath,
          downloadedAt: Date.now(),
          song: currentTrack,
        });
        
        console.log('Downloaded song:', currentTrack.name);
        setDownloadProgress(currentTrack.id, 1);
      }
    } catch (error) {
      console.error('Error handling download:', error);
      setDownloadProgress(currentTrack.id, 0);
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

  const handleSelectQueueItem = async (index: number) => {
    try {
      if (index < 0 || index >= queue.length) return;
      setCurrentTrackIndex(index);
      const loaded = await loadTrack(queue[index]);
      if (loaded) {
        const playing = await playTrack();
        if (playing) setIsPlaying(true);
      }
    } catch (error) {
      console.error('Error selecting queue item:', error);
    }
  };

  const handleOpenQueue = () => {
    setShowMiniPlayer(true);
    setShowQueueModal(true);
  };

  const handleLoadLyrics = async () => {
    if (!currentTrack) return;
    setLoadingLyrics(true);
    try {
      const lyricsData = await getSongLyrics(currentTrack.id);
      setLyrics(lyricsData || 'Lyrics not found');
    } catch (error) {
      console.error('Error loading lyrics:', error);
      setLyrics('Failed to load lyrics');
    } finally {
      setLoadingLyrics(false);
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
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onCollapse}>
            <Ionicons name="arrow-back" size={28} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowMenuModal(true)}>
            <Ionicons name="ellipsis-horizontal-circle" size={28} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
          contentContainerStyle={{ paddingBottom: 140 }}
        >
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

          {/* Shuffle, Favorite, and Download Actions */}
          <View style={styles.topActions}>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: isShuffle ? colors.primary + '30' : colors.cardBackground }]}
              onPress={() => {
                setIsShuffle(!isShuffle);
                if (!isShuffle) {
                  shuffleQueue();
                }
              }}
              activeOpacity={0.7}
            >
              <Ionicons 
                name="shuffle" 
                size={24} 
                color={isShuffle ? colors.primary : colors.text} 
              />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: colors.cardBackground }]}
              onPress={handleToggleFavorite}
              activeOpacity={0.7}
            >
              <Ionicons 
                name={currentTrack && isFavorite(currentTrack.id) ? "heart" : "heart-outline"} 
                size={24} 
                color={currentTrack && isFavorite(currentTrack.id) ? colors.primary : colors.text} 
              />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: colors.cardBackground }]}
              onPress={handleDownload}
              activeOpacity={0.7}
            >
              {currentTrack && downloadProgress[currentTrack.id] > 0 && downloadProgress[currentTrack.id] < 1 ? (
                <View style={styles.progressContainer}>
                  <Text style={[styles.progressText, { color: colors.primary }]}>
                    {Math.round(downloadProgress[currentTrack.id] * 100)}%
                  </Text>
                </View>
              ) : (
                <Ionicons 
                  name={currentTrack && isDownloaded(currentTrack.id) ? "checkmark-circle" : "download-outline"} 
                  size={24} 
                  color={currentTrack && isDownloaded(currentTrack.id) ? colors.primary : colors.text} 
                />
              )}
            </TouchableOpacity>
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

          {/* Queue Button */}
          <TouchableOpacity 
            style={styles.queueButton}
            onPress={handleOpenQueue}
            activeOpacity={0.7}
          >
            <Ionicons name="list" size={32} color={colors.primary} />
            <Text style={[styles.queueButtonText, { color: colors.primary }]}>Queue</Text>
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

        {/* Queue Modal */}
        <Modal
          visible={showQueueModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowQueueModal(false)}
        >
          <TouchableOpacity 
            style={styles.queueModalBackdrop}
            activeOpacity={1}
            onPress={() => setShowQueueModal(false)}
          >
            <TouchableOpacity 
              activeOpacity={1} 
              style={[styles.queueModal, { backgroundColor: colors.background }]}
              onPress={(e) => e.stopPropagation()}
            > 
              <View style={[styles.queueModalHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.queueModalTitle, { color: colors.text }]}>Playing Queue</Text>
                <TouchableOpacity 
                  onPress={() => setShowQueueModal(false)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close-circle" size={28} color={colors.text} />
                </TouchableOpacity>
              </View>
              <ScrollView
                style={styles.queueScrollView}
                nestedScrollEnabled
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.queueScrollContent}
              >
                {(queue && queue.length ? queue : currentTrack ? [currentTrack] : []).map((song, index) => (
                  <TouchableOpacity
                    key={song.id + index}
                    style={[
                      styles.queueItem,
                      {
                        backgroundColor: index === currentTrackIndex ? colors.primary + '15' : 'transparent',
                        borderLeftWidth: index === currentTrackIndex ? 4 : 0,
                        borderLeftColor: colors.primary,
                      },
                    ]}
                    activeOpacity={0.7}
                    onPress={() => {
                      handleSelectQueueItem(index);
                      setShowQueueModal(false);
                    }}
                  >
                    <Image
                      source={{ uri: song.image?.[1]?.url || song.image?.[0]?.url || 'https://via.placeholder.com/60' }}
                      style={styles.queueItemImage}
                    />
                    <View style={styles.queueItemInfo}>
                      <Text style={[styles.queueItemTitle, { color: colors.text }]} numberOfLines={1}>
                        {song.name}
                      </Text>
                      <Text style={[styles.queueItemArtist, { color: colors.subText }]} numberOfLines={1}>
                        {song.artists?.primary?.[0]?.name || 'Unknown Artist'}
                      </Text>
                    </View>
                    {index === currentTrackIndex && (
                      <Ionicons name="volume-high" size={20} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}

                {(queue.length === 0 && !currentTrack) && (
                  <View style={styles.emptyQueueContainer}>
                    <Ionicons name="musical-notes-outline" size={48} color={colors.subText} />
                    <Text style={[styles.emptyQueueText, { color: colors.subText }]}>No songs in queue</Text>
                  </View>
                )}
              </ScrollView>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>

        {/* Menu Modal */}
        <Modal
          visible={showMenuModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowMenuModal(false)}
        >
          <TouchableOpacity
            style={styles.menuOverlay}
            onPress={() => setShowMenuModal(false)}
            activeOpacity={1}
          >
            <View style={[styles.menuContent, { backgroundColor: colors.background }]}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  handleToggleFavorite();
                  setShowMenuModal(false);
                }}
              >
                <Ionicons
                  name={currentTrack && isFavorite(currentTrack.id) ? 'heart' : 'heart-outline'}
                  size={24}
                  color={colors.primary}
                />
                <Text style={[styles.menuItemText, { color: colors.text }]}>
                  {currentTrack && isFavorite(currentTrack.id) ? 'Remove from Favorites' : 'Add to Favorites'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  handleDownload();
                  setShowMenuModal(false);
                }}
              >
                {currentTrack && downloadProgress[currentTrack.id] > 0 && downloadProgress[currentTrack.id] < 1 ? (
                  <>
                    <View style={[styles.menuProgressContainer, { borderColor: colors.primary }]}>
                      <Text style={[styles.menuProgressText, { color: colors.primary }]}>
                        {Math.round(downloadProgress[currentTrack.id] * 100)}%
                      </Text>
                    </View>
                    <Text style={[styles.menuItemText, { color: colors.text }]}>
                      Downloading...
                    </Text>
                  </>
                ) : (
                  <>
                    <Ionicons
                      name={currentTrack && isDownloaded(currentTrack.id) ? 'checkmark-circle' : 'download-outline'}
                      size={24}
                      color={colors.primary}
                    />
                    <Text style={[styles.menuItemText, { color: colors.text }]}>
                      {currentTrack && isDownloaded(currentTrack.id) ? 'Downloaded' : 'Download'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setShowMenuModal(false);
                  setShowLyrics(true);
                  handleLoadLyrics();
                }}
              >
                <Ionicons name="document-text" size={24} color={colors.primary} />
                <Text style={[styles.menuItemText, { color: colors.text }]}>Lyrics</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => setShowMenuModal(false)}
              >
                <Ionicons name="share-social" size={24} color={colors.primary} />
                <Text style={[styles.menuItemText, { color: colors.text }]}>Share Song</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
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
  topActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginBottom: 30,
    paddingHorizontal: 16,
  },
  actionButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  progressContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 14,
    fontWeight: '700',
  },
  menuProgressContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuProgressText: {
    fontSize: 12,
    fontWeight: '700',
  },
  queueButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 10,
    marginTop: 5,
    marginBottom: 80,
  },
  queueButtonText: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  queueModalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  queueModal: {
    height: screenHeight * 0.85,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  queueModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  queueModalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  queueScrollView: {
    flex: 1,
  },
  queueScrollContent: {
    paddingBottom: 20,
  },
  queueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    paddingLeft: 16,
  },
  queueItemImage: {
    width: 56,
    height: 56,
    borderRadius: 8,
    marginRight: 12,
  },
  queueItemInfo: {
    flex: 1,
    marginRight: 8,
  },
  queueItemTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  queueItemArtist: {
    fontSize: 13,
  },
  emptyQueueContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyQueueText: {
    textAlign: 'center',
    marginTop: 12,
    fontSize: 15,
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
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  menuContent: {
    paddingBottom: 20,
    paddingTop: 12,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 16,
  },
});

export default ExpandedPlayer;
