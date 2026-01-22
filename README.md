# Music Player App

A cross-platform music streaming and offline player built with React Native and Expo.

## Quick Start

### Prerequisites
- Node.js (v18+)
- Expo CLI: `npm install -g expo-cli`

### Installation

```bash
npm install
npm start              # Start dev server
npm run android        # Build for Android
npm run ios            # Build for iOS
```

### Build & Download

**Expo Build Link**: [Music Player App - Latest Build](https://expo.dev/accounts/aroult/projects/MusicPlayerApp/builds/5dd3ec3f-8b2f-4ea3-ab81-448e9e2b7887)

## Tech Stack

| Layer | Technology | Version |
| ----- | ---------- | ------- |
| **Framework** | React Native | 0.81.5 |
| **Build** | Expo | 54.0.31 |
| **Language** | TypeScript | 5.9.2 |
| **Navigation** | @react-navigation | 7.x |
| **Audio** | expo-av | 16.0.8 |
| **Storage** | AsyncStorage + FileSystem | - |
| **State** | Zustand | 5.0.10 |
| **Icons** | @expo/vector-icons | 15.0.3 |

---

## ✅ Features Implemented

### Core Requirements
- ✅ **Home Screen** - Song list with search, filters (Popular, Artist, Album, Year, A-Z), pagination with caching
- ✅ **Full Player** - Playback controls, seek bar, progress tracking, skip forward/back, rewind/forward (5s)
- ✅ **Mini Player** - Persistent footer bar, synced with full player, tap to expand
- ✅ **Queue Management** - Add, remove, reorder songs with visual controls (↑ ↓ ✕)
- ✅ **Background Playback** - Audio continues when app is minimized (verified in SDK)
- ✅ **Shuffle Mode** - Randomize queue, keep current track at beginning
- ✅ **Repeat Modes** - OFF → ALL → ONE cycle
- ✅ **Offline Downloads** - Download songs for offline listening, delete when done

### 🎁 Extra Features
- ✅ **Favorites System** - Add/remove favorites, persistent storage via AsyncStorage
- ✅ **Downloads Screen** - Dedicated tab to manage downloaded songs (view, play, delete)
- ✅ **Download Progress** - Shows percentage (%) during download instead of loading spinner
- ✅ **Menu Modal** - Quick-access menu for Favorite, Download, Lyrics, Share
- ✅ **Theme System** - Light/dark mode with ThemeContext (toggleable in Settings)
- ✅ **Advanced Search** - Multi-filter search (Popular, Artist, Album, Year, A-Z sorting)
- ✅ **Settings Screen** - Theme toggle and app configuration
- ✅ **Bottom Navigation** - 4 tabs: Home, Favorites, Downloads, Settings
- ✅ **Song Filtering** - Multiple filter options on home screen

---

## Architecture

### Directory Structure

```
MusicPlayerApp/
├── src/
│   ├── api/
│   │   └── search.ts              # Music API integration
│   ├── components/
│   │   ├── ExpandedPlayer.tsx     # Full-screen player with controls
│   │   ├── MiniPlayer.tsx         # Compact player footer
│   │   ├── Header.tsx             # App header component
│   │   ├── ScreenWrapper.tsx      # Screen wrapper utility
│   │   └── ThemedStatusBar.tsx    # Status bar component
│   ├── context/
│   │   └── ThemeContext.tsx       # Theme provider (light/dark)
│   ├── navigation/
│   │   ├── AppNavigator.tsx       # Main navigation setup
│   │   ├── BottomTabs.tsx         # Bottom tab navigation
│   │   └── HomeTopTabs.tsx        # Home screen tab navigation
│   ├── screens/
│   │   ├── HomeScreen.tsx         # Home landing page
│   │   ├── SearchScreen.tsx       # Search functionality
│   │   ├── FavoritesScreen.tsx    # Saved favorites
│   │   ├── DownloadsScreen.tsx    # Offline downloads
│   │   ├── SettingsScreen.tsx     # App settings
│   │   ├── PlayerScreen.tsx       # Playback controls
│   │   ├── AlbumDetailScreen.tsx  # Album details
│   │   ├── ArtistDetailScreen.tsx # Artist details
│   │   ├── PlaylistsScreen.tsx    # User playlists
│   │   └── Home/
│   │       ├── AlbumsScreen.tsx
│   │       ├── ArtistsScreen.tsx
│   │       ├── SongsScreen.tsx
│   │       └── SuggestedScreen.tsx
│   ├── services/
│   │   ├── musicPlayerService.ts  # Audio playback logic
│   │   └── downloadService.ts     # Download management
│   ├── store/
│   │   └── playerStore.ts         # Zustand state (queue, favorites, etc)
│   ├── theme/
│   │   └── colors.ts              # Theme color definitions
│   ├── types.ts                   # TypeScript interfaces
│   ├── App.tsx                    # Root component
│   └── index.ts                   # Entry point
├── android/                       # Android native code
├── ios/                          # iOS native code (via Expo)
├── assets/                       # Images and static files
├── app.json                      # Expo configuration
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript config
└── eas.json                      # Expo build configuration
```

### Data Flow

```
App.tsx (Root)
    ├── ThemeContext (Light/Dark)
    ├── Zustand Store (playerStore)
    │   ├── Queue & Playback State
    │   ├── Favorites
    │   ├── Downloads & Progress
    │   └── UI State
    └── Navigation
        ├── API Layer (search.ts)
        ├── Services
        │   ├── musicPlayerService (expo-av)
        │   └── downloadService (FileSystem)
        └── Screens
            ├── HomeScreen
            ├── FavoritesScreen
            ├── DownloadsScreen
            └── SettingsScreen
```

### State Management

**Store**: `src/store/playerStore.ts` (Zustand)

```typescript
{
  queue: Song[]
  currentTrackIndex: number | null
  isPlaying: boolean
  isShuffle: boolean
  favorites: Song[]
  downloadedSongs: DownloadedSong[]
  downloadProgress: { [songId: string]: number }
  showMiniPlayer: boolean
  showExpandedPlayer: boolean
}
```

## Trade-offs

| # | Decision | Reason | Trade-off |
| --- | ---------- | -------- | ----------- |
| 1 | **Zustand** over Redux | Simpler API, smaller bundle | Fewer middleware options |
| 2 | **expo-av** over Track Player | Simple, built-in, file support | Limited background playback |
| 3 | **AsyncStorage** over SQLite | Simple for small data | No complex queries |
| 4 | **expo-file-system/legacy** | Stable, progress callbacks | Deprecated API |
| 5 | **Icon-only buttons** | Cleaner UI, more space | Less accessible |
| 6 | **Percentage text** (no spinner) | More informative | Takes up space |
| 7 | **Bottom tabs** (4 tabs) | Clear separation | Deep nesting in Home |
| 8 | **Single queue** | Simple state | Can't multi-playlist |
| 9 | **No background audio** | Simpler code, less battery | Poor music app UX |
| 10 | **Local file priority** | Better offline UX | Can't force streaming |
| 11 | **No URL caching** | Always fresh URLs | Extra API calls |
| 12 | **Theme no persistence** | Fast switching | Theme resets on restart |

---

## Build & Deployment

### Expo CLI Commands

```bash
npm start                          # Dev server
npm run android                    # Build & run Android
npm run ios                        # Build & run iOS
eas build --platform android       # Production Android build
eas build --platform ios           # Production iOS build
```

**Version**: 1.0.0 | **Built**: React Native + Expo + TypeScript
         ┌───────────┴───────────┐
         │                       │
┌────────▼─────────┐    ┌────────▼──────────────┐
│ Theme Context    │    │  Zustand Store       │
│ (Light/Dark)     │    │ (playerStore)        │
└──────────────────┘    │ - Queue              │
                        │ - Favorites          │
                        │ - Downloads          │
                        │ - Progress           │
                        │ - Shuffle            │
                        └────────┬─────────────┘
                                 │
                  ┌──────────────┼──────────────┐
                  │              │              │
         ┌────────▼────────┐    │    ┌──────────▼─────────┐
         │  Navigation     │    │    │  API Layer         │
         │  Stack/Tabs     │    │    │  (search.ts)       │
         └─────────────────┘    │    └────────────────────┘
                                │
                  ┌─────────────┴──────────────┐
                  │                            │
         ┌────────▼────────────┐    ┌──────────▼──────────────┐
         │ Music Services      │    │ Storage Services        │
         │ (musicPlayerService)│    │ - AsyncStorage (Favs)   │
         │ - Play              │    │ - FileSystem (Downloads)│
         │ - Pause             │    │ - MMKV (Cache)          │
         │ - Seek              │    └─────────────────────────┘
         │ - Local playback    │
         └─────────────────────┘
```

## ⚠️ Trade-offs & Decisions

### 1. **Zustand vs Redux**
- **Choice**: Zustand
- **Reason**: Simpler API, smaller bundle, easier to learn
- **Trade-off**: Less middleware ecosystem, fewer dev tools compared to Redux

### 2. **expo-av vs react-native-track-player**
- **Choice**: expo-av
- **Reason**: Simple integration, built into Expo, supports file playback
- **Trade-off**: Limited background playback control, no native playlist queuing

### 3. **AsyncStorage vs SQLite/Realm**
- **Choice**: AsyncStorage for metadata + FileSystem for downloads
- **Reason**: Simple key-value storage, suitable for favorites/download metadata
- **Trade-off**: Not suitable for complex queries or large datasets; serialization overhead

### 4. **expo-file-system/legacy for downloads**
- **Choice**: Legacy API instead of new FileSystem API
- **Reason**: Stable, well-tested, supports progress callbacks
- **Trade-off**: Deprecated API (will need migration in future Expo versions)

### 5. **Icon-only Action Buttons**
- **Choice**: No text labels on shuffle/favorite/download buttons
- **Reason**: Cleaner UI, more space for progress indicators
- **Trade-off**: Less accessible without tooltips/haptic feedback

### 6. **Download Progress as Percentage Text**
- **Choice**: Show percentage instead of spinner
- **Reason**: More informative, user sees actual progress
- **Trade-off**: Takes up space, may look cluttered on small screens

### 7. **Bottom Tab Navigation**
- **Choice**: 4 main tabs (Home, Favorites, Downloads, Settings)
- **Reason**: Clear separation of concerns, easy navigation
- **Trade-off**: Home tab contains 4 sub-screens (potential deep nesting)

### 8. **Single Queue per Session**
- **Choice**: One active queue, shuffle modifies in-place
- **Reason**: Simple state management, clear playback context
- **Trade-off**: Can't maintain multiple playlists simultaneously

### 9. **No Background Playback Service**
- **Choice**: Playback pauses when app backgrounded
- **Reason**: Simpler implementation, lower battery drain
- **Trade-off**: Poor UX for music apps (users expect background audio)

### 10. **Local File Prioritization**
- **Choice**: Always play downloaded files if available
- **Reason**: Better offline experience, faster loading
- **Trade-off**: No way to force streaming, might cause stale data issues

### 11. **No Caching of Streaming URLs**
- **Choice**: Direct API calls for URLs each time
- **Reason**: Always get fresh, valid URLs
- **Trade-off**: Extra network calls, potential API rate limiting

### 12. **Theme Context instead of AsyncStorage**
- **Choice**: ThemeContext for theme state, no persistence
- **Reason**: Fast theme switching, no persistence overhead
- **Trade-off**: Theme resets on app restart

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm or yarn
- Expo CLI: `npm install -g expo-cli`
- For Android: Android SDK
- For iOS: Xcode (macOS only)

### Installation

```bash
# Clone repository
git clone <repo-url>
cd MusicPlayerApp

# Install dependencies
npm install

# Start development server
npm start

# For specific platforms
npm run android    # Android
npm run ios        # iOS
npm run web        # Web (limited support)
```

### Configuration

1. **API Endpoint**: Update `src/api/search.ts` with your music API
2. **Bundle ID**: Update in `app.json` for iOS
3. **Package Name**: Update in `app.json` for Android

---

## 📝 Build & Deployment

### Using Expo CLI

```bash
# Preview on device
expo start

# Build for Android
eas build --platform android

# Build for iOS
eas build --platform ios

# Preview build locally
expo run:android
expo run:ios
```

### Configuration Files
- `app.json` - Expo app configuration
- `eas.json` - Build & deployment settings
- `tsconfig.json` - TypeScript configuration
- `package.json` - Dependencies & scripts
