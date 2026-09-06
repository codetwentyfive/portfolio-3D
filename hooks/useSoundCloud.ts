"use client";

import { useEffect, useRef, useState } from "react";
import { useAudio } from "@/context/AudioContext";
import {
  createSoundCloudController,
  initialPlayback,
  type PlaybackState,
} from "@/lib/audio/soundcloud-controller";
import { loadSoundCloudApi } from "@/lib/audio/soundcloud-api";

export function useSoundCloud() {
  const [connected, setConnected] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<PlaybackState>(initialPlayback);
  const iframe = useRef<HTMLIFrameElement>(null);
  const controller = useRef<ReturnType<
    typeof createSoundCloudController
  > | null>(null);
  const { setIsPlaying } = useAudio();

  useEffect(() => {
    if (!connected) return;
    let active = true;
    let instance: ReturnType<typeof createSoundCloudController> | null = null;
    loadSoundCloudApi()
      .then((factory) => {
        if (!active || !iframe.current) return;
        instance = createSoundCloudController(
          factory(iframe.current),
          factory.Events,
          setState,
        );
        controller.current = instance;
      })
      .catch(() => {
        if (active) setState((value) => ({ ...value, status: "error" }));
      });
    return () => {
      active = false;
      instance?.dispose();
      if (controller.current === instance) controller.current = null;
    };
  }, [connected, attempt]);

  useEffect(() => {
    setIsPlaying(state.status === "playing");
  }, [state.status, setIsPlaying]);
  useEffect(() => () => setIsPlaying(false), [setIsPlaying]);

  // Hardware playback controls are opt-in; never intercept page Space/arrow keys.
  useEffect(() => {
    if (!connected || !("mediaSession" in navigator)) return;
    const session = navigator.mediaSession;
    const handlers: Partial<
      Record<MediaSessionAction, MediaSessionActionHandler>
    > = {
      play: () => controller.current?.play(),
      pause: () => controller.current?.pause(),
      stop: () => controller.current?.pause(),
      previoustrack: () => controller.current?.navigate(-1),
      nexttrack: () => controller.current?.navigate(1),
      seekto: (details) => {
        if (details.seekTime !== undefined)
          controller.current?.seek(details.seekTime * 1000);
      },
    };
    for (const [action, handler] of Object.entries(handlers)) {
      try {
        session.setActionHandler(action as MediaSessionAction, handler);
      } catch {
        /* Unsupported hardware action. */
      }
    }
    return () => {
      for (const action of Object.keys(handlers)) {
        try {
          session.setActionHandler(action as MediaSessionAction, null);
        } catch {
          /* Unsupported hardware action. */
        }
      }
      session.metadata = null;
      session.playbackState = "none";
    };
  }, [connected]);
  useEffect(() => {
    if (!connected || !("mediaSession" in navigator)) return;
    navigator.mediaSession.playbackState =
      state.status === "playing" ? "playing" : "paused";
    if (typeof MediaMetadata !== "undefined")
      navigator.mediaSession.metadata = new MediaMetadata({
        title: state.title || "Portfolio playlist",
        artist: "Chingis",
      });
  }, [connected, state.status, state.title]);

  return {
    state,
    connected,
    attempt,
    iframe,
    controller,
    connect() {
      controller.current?.dispose();
      controller.current = null;
      setState({ ...initialPlayback, status: "loading" });
      setConnected(true);
      setAttempt((value) => value + 1);
    },
    disconnect() {
      controller.current?.dispose();
      controller.current = null;
      setConnected(false);
      setState(initialPlayback);
    },
  };
}
