import { Audio } from 'expo-av';
import { Song } from '../types';
import { getLocalPath } from './downloadService';

let sound: Audio.Sound | null = null;
let soundPosition = 0;
let soundDuration = 0;
let onTrackFinishCallback: (() => void) | null = null;
let hasFinished = false;

export const setOnTrackFinish = (callback: () => void) => {
  onTrackFinishCallback = callback;
};

export const setupPlayer = async () => {
  try {
    await Audio.setAudioModeAsync({
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
      interruptionModeIOS: 1, // INTERRUPTION_MODE_IOS_DO_NOT_MIX
      interruptionModeAndroid: 1, // INTERRUPTION_MODE_ANDROID_DO_NOT_MIX
    });
    console.log('Audio mode set for background playback');
  } catch (error) {
    console.error('Error setting up audio mode:', error);
  }
};

export const loadTrack = async (song: Song) => {
  try {
    // First check if song is downloaded locally
    const localPath = await getLocalPath(song.id);
    let url: string;
    
    if (localPath) {
      console.log('Playing from local file:', localPath);
      url = localPath;
    } else {
      // Get the best quality download URL for streaming
      url = song.downloadUrl?.[song.downloadUrl.length - 1]?.url || '';
      if (!url) {
        console.error('No download URL available for song:', song.name);
        return false;
      }
      console.log('Streaming from URL:', url);
    }

    // Stop and unload previous sound if exists
    if (sound) {
      try {
        const status = await sound.getStatusAsync();
        if (status.isLoaded) {
          if (status.isPlaying) {
            await sound.stopAsync();
          }
          await sound.unloadAsync();
        }
      } catch (error) {
        console.error('Error unloading previous sound:', error);
      }
    }
    
    // Reset state
    sound = null;
    soundPosition = 0;
    soundDuration = 0;
    hasFinished = false;

    // Load new sound
    const { sound: newSound, status } = await Audio.Sound.createAsync(
      { uri: url },
      { shouldPlay: false, progressUpdateIntervalMillis: 500 },
      onPlaybackStatusUpdate
    );

    sound = newSound;
    if (status.isLoaded && status.durationMillis) {
      soundDuration = status.durationMillis / 1000; // Convert to seconds
    }
    return true;
  } catch (error) {
    console.error('Error loading track:', error);
    sound = null;
    return false;
  }
};

export const playTrack = async () => {
  try {
    if (!sound) return false;
    const status = await sound.getStatusAsync();
    if (status.isLoaded) {
      await sound.playAsync();
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error playing track:', error);
    return false;
  }
};

export const pauseTrack = async () => {
  try {
    if (!sound) return false;
    const status = await sound.getStatusAsync();
    if (status.isLoaded && status.isPlaying) {
      await sound.pauseAsync();
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error pausing track:', error);
    return false;
  }
};

export const resumeTrack = async () => {
  try {
    if (!sound) return false;
    const status = await sound.getStatusAsync();
    if (status.isLoaded) {
      await sound.playAsync();
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error resuming track:', error);
    return false;
  }
};

export const seekTo = async (position: number) => {
  try {
    if (!sound) return;
    await sound.setPositionAsync(position * 1000); // Convert to milliseconds
    soundPosition = position;
  } catch (error) {
    console.error('Error seeking:', error);
  }
};

export const seekForward = async (seconds: number = 10) => {
  try {
    if (!sound) return;
    const newPosition = Math.min(soundPosition + seconds, soundDuration);
    await sound.setPositionAsync(newPosition * 1000);
    soundPosition = newPosition;
  } catch (error) {
    console.error('Error seeking forward:', error);
  }
};

export const seekBackward = async (seconds: number = 10) => {
  try {
    if (!sound) return;
    const newPosition = Math.max(soundPosition - seconds, 0);
    await sound.setPositionAsync(newPosition * 1000);
    soundPosition = newPosition;
  } catch (error) {
    console.error('Error seeking backward:', error);
  }
};

export const stopTrack = async () => {
  try {
    if (!sound) return false;
    const status = await sound.getStatusAsync();
    if (status.isLoaded) {
      await sound.stopAsync();
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error stopping track:', error);
    return false;
  }
};

export const unloadTrack = async () => {
  try {
    if (sound) {
      await sound.unloadAsync();
      sound = null;
    }
  } catch (error) {
    console.error('Error unloading track:', error);
  }
};

export const getCurrentPosition = () => soundPosition;
export const getDuration = () => soundDuration;

// Callback for playback status updates
const onPlaybackStatusUpdate = (status: any) => {
  if (status.isLoaded) {
    soundPosition = (status.positionMillis || 0) / 1000; // Convert to seconds
    if (status.durationMillis && soundDuration === 0) {
      soundDuration = status.durationMillis / 1000;
    }
    
    // Check if song finished (only trigger once)
    if (status.didJustFinish && !hasFinished) {
      hasFinished = true;
      if (onTrackFinishCallback) {
        onTrackFinishCallback();
      }
    }
  }
};

export const getIsPlaying = async (): Promise<boolean> => {
  try {
    if (!sound) return false;
    const status = await sound.getStatusAsync();
    return status.isLoaded && status.isPlaying;
  } catch (error) {
    console.error('Error getting playback status:', error);
    return false;
  }
};
