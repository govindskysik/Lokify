import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Song } from '../types';

const DOWNLOADS_DIR = `${FileSystem.documentDirectory}downloads/`;
const DOWNLOADS_KEY = '@downloaded_songs';

export interface DownloadedSong {
  id: string;
  localPath: string;
  downloadedAt: number;
  song: Song;
}

// Ensure downloads directory exists
export const ensureDownloadsDirExists = async (): Promise<void> => {
  const dirInfo = await FileSystem.getInfoAsync(DOWNLOADS_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(DOWNLOADS_DIR, { intermediates: true });
  }
};

// Get downloaded songs from storage
export const getDownloadedSongs = async (): Promise<DownloadedSong[]> => {
  try {
    const data = await AsyncStorage.getItem(DOWNLOADS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading downloaded songs:', error);
    return [];
  }
};

// Save downloaded songs to storage
const saveDownloadedSongs = async (songs: DownloadedSong[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(DOWNLOADS_KEY, JSON.stringify(songs));
  } catch (error) {
    console.error('Error saving downloaded songs:', error);
  }
};

// Check if a song is downloaded
export const isSongDownloaded = async (songId: string): Promise<boolean> => {
  const downloadedSongs = await getDownloadedSongs();
  const downloaded = downloadedSongs.find(ds => ds.id === songId);
  
  if (!downloaded) return false;
  
  // Verify file still exists
  const fileInfo = await FileSystem.getInfoAsync(downloaded.localPath);
  return fileInfo.exists;
};

// Get local path for a downloaded song
export const getLocalPath = async (songId: string): Promise<string | null> => {
  const downloadedSongs = await getDownloadedSongs();
  const downloaded = downloadedSongs.find(ds => ds.id === songId);
  
  if (!downloaded) return null;
  
  // Verify file exists
  const fileInfo = await FileSystem.getInfoAsync(downloaded.localPath);
  return fileInfo.exists ? downloaded.localPath : null;
};

// Download a song
export const downloadSong = async (
  song: Song,
  onProgress?: (progress: number) => void
): Promise<string> => {
  try {
    await ensureDownloadsDirExists();
    
    // Get the highest quality download URL
    const downloadUrl = song.downloadUrl?.[song.downloadUrl.length - 1]?.url;
    if (!downloadUrl) {
      throw new Error('No download URL available');
    }
    
    const fileName = `${song.id}.mp3`;
    const localPath = `${DOWNLOADS_DIR}${fileName}`;
    
    // Check if already downloaded
    const fileInfo = await FileSystem.getInfoAsync(localPath);
    if (fileInfo.exists) {
      return localPath;
    }
    
    // Download the file with progress tracking
    const downloadResumable = FileSystem.createDownloadResumable(
      downloadUrl,
      localPath,
      {},
      (downloadProgress) => {
        const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
        onProgress?.(progress);
      }
    );
    
    const result = await downloadResumable.downloadAsync();
    if (!result) {
      throw new Error('Download failed');
    }
    
    // Save to downloaded songs list
    const downloadedSongs = await getDownloadedSongs();
    const newDownload: DownloadedSong = {
      id: song.id,
      localPath: result.uri,
      downloadedAt: Date.now(),
      song: song,
    };
    
    downloadedSongs.push(newDownload);
    await saveDownloadedSongs(downloadedSongs);
    
    return result.uri;
  } catch (error) {
    console.error('Error downloading song:', error);
    throw error;
  }
};

// Delete a downloaded song
export const deleteSong = async (songId: string): Promise<void> => {
  try {
    const downloadedSongs = await getDownloadedSongs();
    const downloaded = downloadedSongs.find(ds => ds.id === songId);
    
    if (downloaded) {
      // Delete the file
      const fileInfo = await FileSystem.getInfoAsync(downloaded.localPath);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(downloaded.localPath);
      }
      
      // Remove from list
      const updatedSongs = downloadedSongs.filter(ds => ds.id !== songId);
      await saveDownloadedSongs(updatedSongs);
    }
  } catch (error) {
    console.error('Error deleting song:', error);
    throw error;
  }
};

// Get total size of downloads
export const getDownloadsSize = async (): Promise<number> => {
  try {
    const downloadedSongs = await getDownloadedSongs();
    let totalSize = 0;
    
    for (const downloaded of downloadedSongs) {
      const fileInfo = await FileSystem.getInfoAsync(downloaded.localPath);
      if (fileInfo.exists && 'size' in fileInfo) {
        totalSize += fileInfo.size || 0;
      }
    }
    
    return totalSize;
  } catch (error) {
    console.error('Error calculating downloads size:', error);
    return 0;
  }
};

// Delete all downloads
export const deleteAllDownloads = async (): Promise<void> => {
  try {
    const dirInfo = await FileSystem.getInfoAsync(DOWNLOADS_DIR);
    if (dirInfo.exists) {
      await FileSystem.deleteAsync(DOWNLOADS_DIR, { idempotent: true });
      await ensureDownloadsDirExists();
    }
    await AsyncStorage.removeItem(DOWNLOADS_KEY);
  } catch (error) {
    console.error('Error deleting all downloads:', error);
    throw error;
  }
};
