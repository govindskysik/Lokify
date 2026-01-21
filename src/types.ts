// API Response Types for Saavn Music API

export interface Image {
  quality: string;
  url: string;
}

export interface DownloadUrl {
  quality: string;
  url: string;
}

export interface Album {
  id: string;
  name: string;
  url: string;
}

export interface Artist {
  id: string;
  name: string;
  role: string;
  image: Image[];
  type: string;
  url: string;
}

export interface Song {
  id: string;
  name: string;
  type: string;
  year: string;
  releaseDate: string | null;
  duration: number;
  label: string;
  explicitContent: boolean;
  playCount: number;
  language: string;
  hasLyrics: boolean;
  lyricsId: string | null;
  url: string;
  copyright: string;
  image: Image[];
  downloadUrl: DownloadUrl[];
  album: Album;
  artists: {
    primary: Artist[];
    featured: Artist[];
    all: Artist[];
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: {
    total: number;
    start: number;
    results: T[];
  };
}
