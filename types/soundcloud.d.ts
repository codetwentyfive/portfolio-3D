// Global type declarations for the SoundCloud Widget API (https://w.soundcloud.com/player/api.js).
// This file is a global script (no imports/exports) so the interfaces and the
// `window.SC` augmentation are available project-wide without imports.

interface SoundCloudSound {
  id: number;
  title?: string;
  permalink_url?: string;
  permalinkUrl?: string;
}

interface SCWidgetLoadOptions {
  auto_play?: boolean;
  start_track?: number;
  buying?: boolean;
  sharing?: boolean;
  download?: boolean;
  show_artwork?: boolean;
  show_playcount?: boolean;
  show_user?: boolean;
  single_active?: boolean;
  visual?: boolean;
  callback?: () => void;
}

/** Payload passed to PLAY_PROGRESS / SEEK listeners. Other events call listeners without data. */
interface SCWidgetEventData {
  relativePosition: number;
  currentPosition: number;
  loadedProgress?: number;
  soundId?: number;
}

interface SCWidget {
  load(url: string, options?: SCWidgetLoadOptions): void;
  play(): void;
  pause(): void;
  next(): void;
  prev(): void;
  seekTo(milliseconds: number): void;
  setVolume(volume: number): void;
  bind(eventName: string, listener: (data: SCWidgetEventData) => void): void;
  getDuration(callback: (durationMs: number) => void): void;
  getSounds(callback: (sounds: SoundCloudSound[]) => void): void;
  getCurrentSound(callback: (sound: SoundCloudSound | null) => void): void;
  getCurrentSoundIndex(callback: (index: number) => void): void;
  isPaused(callback: (paused: boolean) => void): void;
}

interface SCWidgetEvents {
  READY: string;
  PLAY: string;
  PAUSE: string;
  PLAY_PROGRESS: string;
  SEEK: string;
  FINISH: string;
  ERROR: string;
}

interface SCWidgetFactory {
  (element: HTMLIFrameElement | string): SCWidget;
  Events: SCWidgetEvents;
}

interface Window {
  SC?: {
    Widget: SCWidgetFactory;
  };
}
