import { create } from 'zustand';
import { Song } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DownloadedSong } from '../services/downloadService';

interface PlayerStore {
  // Queue
  queue: Song[];
  setQueue: (queue: Song[]) => void;
  addToQueue: (song: Song) => void;
  addToQueueNext: (song: Song) => void;
  removeFromQueue: (index: number) => void;
  reorderQueue: (fromIndex: number, toIndex: number) => void;
  clearQueue: () => void;

  // Shuffle
  isShuffle: boolean;
  setIsShuffle: (shuffle: boolean) => void;
  shuffleQueue: () => void;

  // Playback state
  isPlaying: boolean;
  setIsPlaying: (isPlaying: boolean) => void;

  // Current track
  currentTrackIndex: number | null;
  setCurrentTrackIndex: (index: number | null) => void;

  // Playback info
  duration: number;
  setDuration: (duration: number) => void;

  // Show mini player
  showMiniPlayer: boolean;
  setShowMiniPlayer: (show: boolean) => void;

  // Show expanded player
  showExpandedPlayer: boolean;
  setShowExpandedPlayer: (show: boolean) => void;

  // Favorites
  favorites: Song[];
  addToFavorites: (song: Song) => void;
  removeFromFavorites: (songId: string) => void;
  isFavorite: (songId: string) => boolean;
  loadFavorites: () => Promise<void>;

  // Downloads
  downloadedSongs: DownloadedSong[];
  downloadProgress: { [key: string]: number };
  setDownloadProgress: (songId: string, progress: number) => void;
  addDownloadedSong: (downloadedSong: DownloadedSong) => void;
  removeDownloadedSong: (songId: string) => void;
  isDownloaded: (songId: string) => boolean;
  loadDownloadedSongs: () => Promise<void>;
}

export const usePlayerStore = create<PlayerStore>((set) => ({
  queue: [],
  setQueue: (queue) => set({ queue }),
  addToQueue: (song) =>
    set((state) => {
      // Check if song already exists in queue
      const exists = state.queue.some((s) => s.id === song.id);
      if (exists) {
        console.log('Song already in queue:', song.name);
        return state; // Don't modify if already exists
      }
      console.log('Adding to queue:', song.name);
      return { queue: [...state.queue, song] };
    }),
  addToQueueNext: (song) =>
    set((state) => {
      // Check if song already exists in queue
      const existingIndex = state.queue.findIndex((s) => s.id === song.id);
      if (existingIndex !== -1) {
        console.log('Song already in queue:', song.name);
        return state; // Don't modify if already exists
      }
      const insertAt = state.currentTrackIndex !== null ? state.currentTrackIndex + 1 : 0;
      const nextQueue = [...state.queue];
      nextQueue.splice(insertAt, 0, song);
      console.log('Adding to play next:', song.name, 'at position', insertAt);
      return { queue: nextQueue };
    }),
  clearQueue: () => set({ queue: [] }),

  removeFromQueue: (index) =>
    set((state) => {
      const newQueue = [...state.queue];
      const removedSong = newQueue[index];
      newQueue.splice(index, 1);

      // Adjust current track index if necessary
      let newIndex = state.currentTrackIndex;
      if (newIndex === index) {
        // If removing current track, move to next
        if (index < newQueue.length) {
          newIndex = index;
        } else if (index > 0) {
          newIndex = index - 1;
        } else {
          newIndex = null;
        }
      } else if (newIndex !== null && index < newIndex) {
        // If removing before current track, decrement index
        newIndex = newIndex - 1;
      }

      console.log('Removed from queue:', removedSong.name, 'at index', index);
      return { queue: newQueue, currentTrackIndex: newIndex };
    }),

  reorderQueue: (fromIndex, toIndex) =>
    set((state) => {
      if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= state.queue.length || toIndex >= state.queue.length) {
        return state;
      }

      const newQueue = [...state.queue];
      const [movedSong] = newQueue.splice(fromIndex, 1);
      newQueue.splice(toIndex, 0, movedSong);

      // Update current track index based on moves
      let newIndex = state.currentTrackIndex;
      if (state.currentTrackIndex === fromIndex) {
        newIndex = toIndex;
      } else if (fromIndex < state.currentTrackIndex && toIndex >= state.currentTrackIndex && state.currentTrackIndex !== null) {
        newIndex = state.currentTrackIndex - 1;
      } else if (fromIndex > state.currentTrackIndex && toIndex <= state.currentTrackIndex && state.currentTrackIndex !== null) {
        newIndex = state.currentTrackIndex + 1;
      }

      console.log('Reordered queue: moved from', fromIndex, 'to', toIndex);
      return { queue: newQueue, currentTrackIndex: newIndex };
    }),
  setIsShuffle: (shuffle) => set({ isShuffle: shuffle }),
  shuffleQueue: () =>
    set((state) => {
      if (state.queue.length <= 1) return state;
      
      // Keep current track at the beginning
      const currentTrack = state.currentTrackIndex !== null ? state.queue[state.currentTrackIndex] : null;
      let newQueue = [...state.queue];
      
      if (currentTrack) {
        // Remove current track from queue
        newQueue = newQueue.filter((_, index) => index !== state.currentTrackIndex);
        // Shuffle remaining tracks
        for (let i = newQueue.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [newQueue[i], newQueue[j]] = [newQueue[j], newQueue[i]];
        }
        // Add current track back at the beginning
        newQueue.unshift(currentTrack);
      } else {
        // Shuffle all tracks
        for (let i = newQueue.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [newQueue[i], newQueue[j]] = [newQueue[j], newQueue[i]];
        }
      }
      
      return { queue: newQueue, currentTrackIndex: currentTrack ? 0 : null };
    }),

  isPlaying: false,
  setIsPlaying: (isPlaying) => set({ isPlaying }),

  currentTrackIndex: null,
  setCurrentTrackIndex: (index) => set({ currentTrackIndex: index }),

  duration: 0,
  setDuration: (duration) => set({ duration }),

  showMiniPlayer: false,
  setShowMiniPlayer: (show) => set({ showMiniPlayer: show }),

  showExpandedPlayer: false,
  setShowExpandedPlayer: (show) => set({ showExpandedPlayer: show }),

  // Favorites
  favorites: [],
  addToFavorites: (song) =>
    set((state) => {
      const newFavorites = [...state.favorites, song];
      AsyncStorage.setItem('favorites', JSON.stringify(newFavorites));
      console.log('Added to favorites:', song.name);
      return { favorites: newFavorites };
    }),
  removeFromFavorites: (songId) =>
    set((state) => {
      const newFavorites = state.favorites.filter((s) => s.id !== songId);
      AsyncStorage.setItem('favorites', JSON.stringify(newFavorites));
      console.log('Removed from favorites:', songId);
      return { favorites: newFavorites };
    }),
  isFavorite: (songId) => {
    const state = usePlayerStore.getState();
    return state.favorites.some((s) => s.id === songId);
  },
  loadFavorites: async () => {
    try {
      const stored = await AsyncStorage.getItem('favorites');
      if (stored) {
        const favorites = JSON.parse(stored);
        set({ favorites });
        console.log('Loaded favorites:', favorites.length);
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  },

  // Downloads
  downloadedSongs: [],
  downloadProgress: {},
  setDownloadProgress: (songId, progress) =>
    set((state) => ({
      downloadProgress: { ...state.downloadProgress, [songId]: progress },
    })),
  addDownloadedSong: (downloadedSong) =>
    set((state) => {
      const newDownloadedSongs = [...state.downloadedSongs, downloadedSong];
      console.log('Added downloaded song:', downloadedSong.song.name);
      return { downloadedSongs: newDownloadedSongs };
    }),
  removeDownloadedSong: (songId) =>
    set((state) => {
      const newDownloadedSongs = state.downloadedSongs.filter((ds) => ds.id !== songId);
      console.log('Removed downloaded song:', songId);
      return { downloadedSongs: newDownloadedSongs };
    }),
  isDownloaded: (songId) => {
    const state = usePlayerStore.getState();
    return state.downloadedSongs.some((ds) => ds.id === songId);
  },
  loadDownloadedSongs: async () => {
    try {
      const { getDownloadedSongs } = await import('../services/downloadService');
      const downloadedSongs = await getDownloadedSongs();
      set({ downloadedSongs });
      console.log('Loaded downloaded songs:', downloadedSongs.length);
    } catch (error) {
      console.error('Error loading downloaded songs:', error);
    }
  },
}));

// Optimized selectors to prevent unnecessary re-renders
export const useCurrentTrack = () =>
  usePlayerStore((state) => {
    const track = state.currentTrackIndex !== null ? state.queue[state.currentTrackIndex] : null;
    return track;
  });

export const useIsPlaying = () => usePlayerStore((state) => state.isPlaying);
export const useQueue = () => usePlayerStore((state) => state.queue);
export const useCurrentTrackIndex = () => usePlayerStore((state) => state.currentTrackIndex);
