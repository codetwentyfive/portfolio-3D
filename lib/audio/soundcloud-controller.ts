export const PLAYLIST_URL =
  "https://soundcloud.com/codetwentyfive/sets/portfolio";

export type PlaybackStatus =
  | "idle"
  | "loading"
  | "ready"
  | "starting"
  | "playing"
  | "pausing"
  | "paused"
  | "blocked"
  | "error";
export interface PlaybackState {
  status: PlaybackStatus;
  title: string;
  url: string;
  index: number;
  count: number;
  position: number;
  duration: number;
  volume: number;
  repeat: boolean;
}

export const initialPlayback: PlaybackState = {
  status: "idle",
  title: "",
  url: PLAYLIST_URL,
  index: 0,
  count: 0,
  position: 0,
  duration: 0,
  volume: 40,
  repeat: true,
};

export function formatAudioTime(ms: number) {
  const seconds = Math.floor(Math.max(0, Number.isFinite(ms) ? ms : 0) / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

type Schedule = (callback: () => void, delay: number) => () => void;
const scheduleTimeout: Schedule = (callback, delay) => {
  const timer = setTimeout(callback, delay);
  return () => clearTimeout(timer);
};

// Owns one widget lifetime. No polling loops or delayed autoplay retries.
export function createSoundCloudController(
  widget: SCWidget,
  events: SCWidgetEvents,
  onChange: (state: PlaybackState) => void,
  schedule: Schedule = scheduleTimeout,
) {
  let state = { ...initialPlayback, status: "loading" as PlaybackStatus };
  let active = true;
  let ready = false;
  let intent: "play" | "pause" | null = null;
  let command = 0;
  let metadataVersion = 0;
  let cancelPending = () => {};
  const bound: string[] = [];
  const update = (patch: Partial<PlaybackState>) => {
    if (!active) return;
    state = { ...state, ...patch };
    onChange(state);
  };
  const fail = () => {
    if (!active || state.status === "error") return;
    intent = "pause";
    cancelPending();
    ready = false;
    update({ status: "error" });
    widget.pause();
  };
  const bind = (name: string, callback: (data: SCWidgetEventData) => void) => {
    if (!name) return;
    bound.push(name);
    widget.bind(name, (data) => {
      if (active) callback(data);
    });
  };
  const syncTrack = () => {
    const version = ++metadataVersion;
    const current = () => active && version === metadataVersion;
    widget.getCurrentSoundIndex((index) => {
      if (!current() || !Number.isInteger(index) || index < 0) return;
      if (index !== state.index) update({ index, position: 0, duration: 0 });
      widget.getCurrentSound((sound) => {
        if (current() && sound)
          update({
            title: sound.title || "",
            url: sound.permalink_url || sound.permalinkUrl || PLAYLIST_URL,
          });
      });
      widget.getDuration((duration) => {
        if (current() && Number.isFinite(duration) && duration > 0)
          update({ duration });
      });
    });
  };
  const play = () => {
    if (!active || !ready) return;
    cancelPending();
    const request = ++command;
    intent = "play";
    update({ status: "starting" });
    cancelPending = schedule(() => {
      if (!active || request !== command || state.status !== "starting") return;
      intent = "pause";
      widget.pause();
      update({ status: "blocked" });
    }, 5000);
    widget.play();
  };
  const pause = () => {
    if (!active || !ready) return;
    cancelPending();
    const request = ++command;
    intent = "pause";
    update({ status: "pausing" });
    cancelPending = schedule(() => {
      if (!active || request !== command) return;
      cancelPending = schedule(fail, 1500);
      widget.isPaused((paused) => {
        if (!active || request !== command) return;
        if (paused) {
          cancelPending();
          update({ status: "paused" });
        } else fail();
      });
    }, 1500);
    widget.pause();
  };

  cancelPending = schedule(fail, 15000);
  bind(events.READY, () => {
    cancelPending();
    ready = true;
    widget.setVolume(state.volume);
    update({ status: "ready" });
    widget.getSounds((sounds) => {
      if (active) update({ count: sounds.length });
    });
    syncTrack();
  });
  bind(events.PLAY, () => {
    if (!ready) return;
    if (intent === "pause") {
      widget.pause();
      return;
    }
    cancelPending();
    update({ status: "playing" });
    syncTrack();
  });
  bind(events.PAUSE, () => {
    if (!ready || (intent === "play" && state.status === "starting")) return;
    cancelPending();
    if (state.status !== "blocked") update({ status: "paused" });
  });
  const progress = (data: SCWidgetEventData) => {
    // Position is not proof of playback: queued progress can arrive after Pause.
    if (!Number.isFinite(data?.currentPosition)) return;
    const position = Math.max(
      0,
      Math.min(data.currentPosition, state.duration || Infinity),
    );
    if (Math.floor(position / 1000) !== Math.floor(state.position / 1000))
      update({ position });
  };
  bind(events.PLAY_PROGRESS, progress);
  bind(events.SEEK, progress);
  bind(events.FINISH, () => {
    if (intent === "pause") return;
    update({ status: "paused", position: state.duration });
    // SoundCloud advances within playlists itself; only wrap the final track.
    if (state.repeat && state.count > 0 && state.index === state.count - 1) {
      widget.skip(0);
      play();
    }
  });
  bind(events.ERROR, fail);
  onChange(state);

  return {
    play,
    pause,
    toggle() {
      if (state.status === "playing" || state.status === "starting") pause();
      else play();
    },
    navigate(direction: -1 | 1) {
      if (!ready || !active || state.count < 2) return;
      if (direction === -1 && state.position > 3000) {
        widget.seekTo(0);
        update({ position: 0 });
        return;
      }
      const playing = state.status === "playing" || state.status === "starting";
      const index = (state.index + direction + state.count) % state.count;
      ++command;
      cancelPending();
      intent = playing ? "play" : "pause";
      update({ index, title: "", position: 0, duration: 0 });
      widget.skip(index);
      if (playing) play();
      else {
        widget.pause();
        update({ status: "paused" });
      }
      syncTrack();
    },
    seek(position: number) {
      if (
        !ready ||
        !active ||
        !Number.isFinite(position) ||
        state.duration <= 0
      )
        return;
      const clamped = Math.max(0, Math.min(position, state.duration));
      widget.seekTo(clamped);
      update({ position: clamped });
    },
    volume(volume: number) {
      if (!ready || !active || !Number.isFinite(volume)) return;
      const clamped = Math.max(0, Math.min(100, Math.round(volume)));
      widget.setVolume(clamped);
      update({ volume: clamped });
    },
    repeat() {
      update({ repeat: !state.repeat });
    },
    allowNativeControls() {
      intent = null;
    },
    dispose() {
      if (!active) return;
      active = false;
      ready = false;
      ++command;
      ++metadataVersion;
      cancelPending();
      // Route/locale unmount can remove the iframe before passive cleanup runs.
      // The SDK posts messages even when unbinding; a detached frame has no peer.
      bound.forEach((name) => {
        try { widget.unbind(name); } catch { /* Frame already removed. */ }
      });
      try { widget.pause(); } catch { /* Removing the iframe already stops audio. */ }
    },
  };
}
