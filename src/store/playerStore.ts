import { create } from 'zustand';
import { Song } from '../types';

interface PlayerStore {
  // Queue
  queue: Song[];
  setQueue: (queue: Song[]) => void;
  addToQueue: (song: Song) => void;
  clearQueue: () => void;

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
}

export const usePlayerStore = create<PlayerStore>((set) => ({
  queue: [],
  setQueue: (queue) => set({ queue }),
  addToQueue: (song) =>
    set((state) => ({
      queue: [...state.queue, song],
    })),
  clearQueue: () => set({ queue: [] }),

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
}));
