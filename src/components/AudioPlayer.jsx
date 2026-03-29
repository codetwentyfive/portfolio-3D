import { useEffect, useRef, useState, useCallback } from 'react';
import { useAudio } from '../context/AudioContext';

const SOUNDCLOUD_PLAYLIST = {
  title: 'Portfolio playlist',
  url: 'https://soundcloud.com/codetwentyfive/sets/portfolio',
};

const WIDGET_PARAMS = '&auto_play=false&buying=false&sharing=false&download=false&show_artwork=false&show_playcount=false&show_user=false&single_active=false&visual=false';
const SEEK_STEP_MS = 10000;
const PAUSE_GUARD_MS = 1200;

const formatTime = (ms) => {
  if (!ms || ms <= 0) return '0:00';
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
};

const isEditableTarget = (target) => {
  if (!(target instanceof HTMLElement)) return false;

  return (
    target.isContentEditable ||
    ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(target.tagName)
  );
};

const AudioPlayer = () => {
  const { isPlaying, setIsPlaying } = useAudio();
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasStartedSoundCloud, setHasStartedSoundCloud] = useState(false);
  const [isWidgetLoading, setIsWidgetLoading] = useState(false);
  const [isWidgetReady, setIsWidgetReady] = useState(false);
  const [widgetError, setWidgetError] = useState(false);
  const [widgetAttempt, setWidgetAttempt] = useState(0);
  const [loopMode, setLoopMode] = useState('all');
  const [progress, setProgress] = useState(0);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTrack, setCurrentTrack] = useState(SOUNDCLOUD_PLAYLIST);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [trackCount, setTrackCount] = useState(0);
  const [hasObservedPlayback, setHasObservedPlayback] = useState(false);
  const [bounce, setBounce] = useState(false);
  const [nearFooter, setNearFooter] = useState(false);
  const hasAnimated = useRef(false);

  const widgetRef = useRef(null);
  const iframeRef = useRef(null);
  const playlistSoundsRef = useRef([]);
  const readyRef = useRef(false);
  const playRequestPendingRef = useRef(false);
  const autoplayRetryTimeoutsRef = useRef([]);
  const playbackStateSyncRef = useRef(null);
  const progressBarRef = useRef(null);
  const lastPlayPausePressRef = useRef(0);
  const pauseRequestedAtRef = useRef(0);
  const currentTrackIndexRef = useRef(0);
  const loopModeRef = useRef('all');
  const durationRef = useRef(0);
  const trackCountRef = useRef(0);
  const hasObservedPlaybackRef = useRef(false);

  useEffect(() => { currentTrackIndexRef.current = currentTrackIndex; }, [currentTrackIndex]);
  useEffect(() => { loopModeRef.current = loopMode; }, [loopMode]);
  useEffect(() => { durationRef.current = duration; }, [duration]);
  useEffect(() => { trackCountRef.current = trackCount; }, [trackCount]);
  useEffect(() => { hasObservedPlaybackRef.current = hasObservedPlayback; }, [hasObservedPlayback]);

  const prevPlayingRef = useRef(false);
  useEffect(() => {
    if (isPlaying && !prevPlayingRef.current) {
      setBounce(true);
      const timer = setTimeout(() => setBounce(false), 500);
      prevPlayingRef.current = isPlaying;
      return () => clearTimeout(timer);
    }

    prevPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    const updatePlayerVisibility = () => {
      const footer = document.querySelector('footer');
      if (!footer) {
        setNearFooter(false);
        return;
      }

      const footerRect = footer.getBoundingClientRect();
      const hasStartedScrolling = window.scrollY > 12;
      const shouldHidePlayer =
        hasStartedScrolling && footerRect.top < window.innerHeight - 12;

      setNearFooter((prev) => {
        if (shouldHidePlayer && !prev) {
          hasAnimated.current = true;
        }
        return shouldHidePlayer;
      });
    };

    updatePlayerVisibility();
    window.addEventListener('scroll', updatePlayerVisibility, { passive: true });
    window.addEventListener('resize', updatePlayerVisibility, { passive: true });

    return () => {
      window.removeEventListener('scroll', updatePlayerVisibility);
      window.removeEventListener('resize', updatePlayerVisibility);
    };
  }, []);

  const resetTimeline = useCallback(() => {
    setProgress(0);
    setPosition(0);
    setDuration(0);
  }, []);

  const canControlWidget = useCallback(() => {
    return Boolean(widgetRef.current && readyRef.current);
  }, []);

  const clearAutoplayRetries = useCallback(() => {
    autoplayRetryTimeoutsRef.current.forEach((timeoutId) => {
      window.clearTimeout(timeoutId);
    });
    autoplayRetryTimeoutsRef.current = [];
  }, []);

  const clearPlaybackStateSync = useCallback(() => {
    if (playbackStateSyncRef.current) {
      window.clearTimeout(playbackStateSyncRef.current);
      playbackStateSyncRef.current = null;
    }
  }, []);

  const markPlaybackStarted = useCallback(() => {
    playRequestPendingRef.current = false;
    clearAutoplayRetries();
    clearPlaybackStateSync();
    pauseRequestedAtRef.current = 0;
    setHasObservedPlayback(true);
    setIsWidgetLoading(false);
    setIsPlaying(true);
  }, [clearAutoplayRetries, clearPlaybackStateSync, setIsPlaying]);

  const schedulePlaybackStateSync = useCallback((remainingChecks = 12, preservePendingRequest = false) => {
    clearPlaybackStateSync();

    if (remainingChecks <= 0 || !widgetRef.current || !readyRef.current) return;

    playbackStateSyncRef.current = window.setTimeout(() => {
      if (!widgetRef.current || !readyRef.current || typeof widgetRef.current.isPaused !== 'function') {
        playbackStateSyncRef.current = null;
        return;
      }

      widgetRef.current.isPaused((paused) => {
        if (paused) {
          if (!preservePendingRequest) {
            playRequestPendingRef.current = false;
          }
          setIsPlaying(false);
        } else {
          markPlaybackStarted();
        }
        setIsWidgetLoading(false);
        schedulePlaybackStateSync(remainingChecks - 1, preservePendingRequest && paused);
      });
    }, 250);
  }, [clearPlaybackStateSync, markPlaybackStarted, setIsPlaying]);

  const schedulePauseStateSync = useCallback((remainingChecks = 8) => {
    clearPlaybackStateSync();

    if (remainingChecks <= 0 || !widgetRef.current || !readyRef.current) {
      return;
    }

    playbackStateSyncRef.current = window.setTimeout(() => {
      if (!widgetRef.current || !readyRef.current || typeof widgetRef.current.isPaused !== 'function') {
        playbackStateSyncRef.current = null;
        return;
      }

      widgetRef.current.isPaused((paused) => {
        if (paused) {
          playRequestPendingRef.current = false;
          setIsWidgetLoading(false);
          setIsPlaying(false);
          playbackStateSyncRef.current = null;
          return;
        }

        if (remainingChecks <= 1) {
          setIsWidgetLoading(false);
          setIsPlaying(true);
          playbackStateSyncRef.current = null;
          return;
        }

        schedulePauseStateSync(remainingChecks - 1);
      });
    }, 180);
  }, [clearPlaybackStateSync, setIsPlaying]);

  const scheduleAutoplayRetries = useCallback(() => {
    clearAutoplayRetries();

    [700, 1800, 4000].forEach((delay) => {
      const timeoutId = window.setTimeout(() => {
        if (!playRequestPendingRef.current || !widgetRef.current || !readyRef.current) return;
        widgetRef.current.play();
      }, delay);

      autoplayRetryTimeoutsRef.current.push(timeoutId);
    });
  }, [clearAutoplayRetries]);

  const syncDuration = useCallback(() => {
    if (!widgetRef.current || !readyRef.current) return;

    widgetRef.current.getDuration((nextDuration) => {
      if (nextDuration > 0) {
        setDuration(nextDuration);
      }
    });
  }, []);

  const refreshPlaylistSounds = useCallback(() => {
    if (!widgetRef.current || !readyRef.current || typeof widgetRef.current.getSounds !== 'function') return;

    widgetRef.current.getSounds((sounds) => {
      if (!Array.isArray(sounds) || sounds.length === 0) return;
      playlistSoundsRef.current = sounds;
      setTrackCount(sounds.length);
    });
  }, []);

  const syncCurrentTrack = useCallback(() => {
    if (!widgetRef.current || !readyRef.current || typeof widgetRef.current.getCurrentSound !== 'function') return;

    widgetRef.current.getCurrentSound((sound) => {
      if (!sound) return;

      setCurrentTrack({
        title: sound.title || SOUNDCLOUD_PLAYLIST.title,
        url: sound.permalink_url || sound.permalinkUrl || SOUNDCLOUD_PLAYLIST.url,
      });

      if (typeof widgetRef.current?.getCurrentSoundIndex === 'function') {
        widgetRef.current.getCurrentSoundIndex((nextIndex) => {
          if (typeof nextIndex === 'number' && nextIndex >= 0) {
            setCurrentTrackIndex(nextIndex);
          }
        });
        return;
      }

      const nextIndex = playlistSoundsRef.current.findIndex((item) => item.id === sound.id);
      if (nextIndex >= 0) {
        setCurrentTrackIndex(nextIndex);
      }
    });
  }, []);

  const seekToMs = useCallback((nextPositionMs) => {
    if (!widgetRef.current || !readyRef.current) return;

    widgetRef.current.getDuration((currentDuration) => {
      if (!currentDuration || currentDuration <= 0) return;

      const clampedPosition = Math.max(0, Math.min(nextPositionMs, currentDuration));
      widgetRef.current.seekTo(clampedPosition);
      setPosition(clampedPosition);
      setDuration(currentDuration);
      setProgress(clampedPosition / currentDuration);
    });
  }, []);

  const seekByMs = useCallback((offsetMs) => {
    seekToMs(position + offsetMs);
  }, [position, seekToMs]);

  const loadPlaylist = useCallback((startIndex = 0, autoPlay = false) => {
    if (!widgetRef.current) return;

    playRequestPendingRef.current = autoPlay;
    pauseRequestedAtRef.current = 0;
    setIsWidgetLoading(true);
    setIsPlaying(false);
    setCurrentTrackIndex(startIndex);
    resetTimeline();
    widgetRef.current.load(SOUNDCLOUD_PLAYLIST.url, {
      auto_play: autoPlay,
      start_track: startIndex,
      buying: false,
      sharing: false,
      download: false,
      show_artwork: false,
      show_playcount: false,
      show_user: false,
    });

    if (autoPlay) {
      scheduleAutoplayRetries();
      schedulePlaybackStateSync(12, !hasObservedPlaybackRef.current);
    } else {
      clearAutoplayRetries();
      clearPlaybackStateSync();
    }
  }, [clearAutoplayRetries, clearPlaybackStateSync, resetTimeline, scheduleAutoplayRetries, schedulePlaybackStateSync, setIsPlaying]);

  const handleWidgetFailure = useCallback(() => {
    readyRef.current = false;
    playRequestPendingRef.current = false;
    clearAutoplayRetries();
    clearPlaybackStateSync();
    widgetRef.current = null;
    setIsPlaying(false);
    setIsWidgetLoading(false);
    setIsWidgetReady(false);
    setWidgetError(true);
  }, [clearAutoplayRetries, clearPlaybackStateSync, setIsPlaying]);

  useEffect(() => {
    if (!hasStartedSoundCloud) return;

    let isActive = true;

    const loadAPI = () =>
      new Promise((resolve, reject) => {
        if (window.SC?.Widget) {
          resolve();
          return;
        }

        const existingScript = document.querySelector('script[src="https://w.soundcloud.com/player/api.js"]');
        if (existingScript) {
          existingScript.addEventListener('load', resolve, { once: true });
          existingScript.addEventListener('error', reject, { once: true });
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://w.soundcloud.com/player/api.js';
        script.async = true;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });

    loadAPI()
      .then(() => {
        if (!isActive || !iframeRef.current || !window.SC?.Widget) {
          handleWidgetFailure();
          return;
        }

        setIsWidgetLoading(true);
        const widget = window.SC.Widget(iframeRef.current);
        widgetRef.current = widget;

        widget.bind(window.SC.Widget.Events.READY, () => {
          if (!isActive) return;

          readyRef.current = true;
          setWidgetError(false);
          setIsWidgetReady(true);
          setIsWidgetLoading(false);
          widget.setVolume(40);
          syncDuration();
          refreshPlaylistSounds();
          syncCurrentTrack();

          if (playRequestPendingRef.current) {
            widget.play();
            scheduleAutoplayRetries();
            schedulePlaybackStateSync(12, !hasObservedPlaybackRef.current);
          }
        });

        widget.bind(window.SC.Widget.Events.PLAY, () => {
          if (pauseRequestedAtRef.current && Date.now() - pauseRequestedAtRef.current < PAUSE_GUARD_MS) {
            return;
          }

          markPlaybackStarted();
          syncDuration();
          refreshPlaylistSounds();
          syncCurrentTrack();
        });

        widget.bind(window.SC.Widget.Events.PAUSE, () => {
          playRequestPendingRef.current = false;
          clearAutoplayRetries();
          clearPlaybackStateSync();
          setIsWidgetLoading(false);
          setIsPlaying(false);
        });

        widget.bind(window.SC.Widget.Events.PLAY_PROGRESS, (data) => {
          if (pauseRequestedAtRef.current && Date.now() - pauseRequestedAtRef.current < PAUSE_GUARD_MS) {
            return;
          }

          if (!durationRef.current) {
            syncDuration();
          }

          markPlaybackStarted();
          setProgress(data.relativePosition);
          setPosition(data.currentPosition);
        });

        widget.bind(window.SC.Widget.Events.SEEK, (data) => {
          if (!isActive) return;

          if (typeof data?.relativePosition === 'number') {
            setProgress(data.relativePosition);
          }

          if (typeof data?.currentPosition === 'number') {
            setPosition(data.currentPosition);
          }
        });

        widget.bind(window.SC.Widget.Events.FINISH, () => {
          const loop = loopModeRef.current;
          const lastIndex = Math.max(trackCountRef.current - 1, 0);
          const isLastTrack = currentTrackIndexRef.current >= lastIndex;

          if (loop === 'one') {
            widget.seekTo(0);
            widget.play();
            return;
          }

          if (!isLastTrack) {
            playRequestPendingRef.current = true;
            pauseRequestedAtRef.current = 0;
            setIsWidgetLoading(true);
            widget.next();
            schedulePlaybackStateSync(12, !hasObservedPlaybackRef.current);
            window.setTimeout(() => {
              refreshPlaylistSounds();
              syncCurrentTrack();
              syncDuration();
            }, 150);
            return;
          }

          if (loop === 'all') {
            loadPlaylist(0, true);
            return;
          }

          playRequestPendingRef.current = false;
          setIsPlaying(false);
          setIsWidgetLoading(false);
        });

        if (window.SC.Widget.Events.ERROR) {
          widget.bind(window.SC.Widget.Events.ERROR, () => {
            if (!isActive) return;
            handleWidgetFailure();
          });
        }
      })
      .catch(() => {
        if (!isActive) return;
        handleWidgetFailure();
      });

    return () => {
      isActive = false;
      clearAutoplayRetries();
      clearPlaybackStateSync();
    };
  }, [
    clearAutoplayRetries,
    clearPlaybackStateSync,
    handleWidgetFailure,
    hasStartedSoundCloud,
    loadPlaylist,
    markPlaybackStarted,
    refreshPlaylistSounds,
    scheduleAutoplayRetries,
    schedulePlaybackStateSync,
    setIsPlaying,
    syncCurrentTrack,
    syncDuration,
    widgetAttempt,
  ]);

  const startSoundCloud = useCallback(() => {
    setIsExpanded(true);

    if (hasStartedSoundCloud) return;

    playRequestPendingRef.current = true;
    pauseRequestedAtRef.current = 0;
    readyRef.current = false;
    widgetRef.current = null;
    playlistSoundsRef.current = [];
    resetTimeline();
    setTrackCount(0);
    setCurrentTrack(SOUNDCLOUD_PLAYLIST);
    setCurrentTrackIndex(0);
    setHasObservedPlayback(false);
    setWidgetError(false);
    setIsWidgetReady(false);
    setIsWidgetLoading(true);
    setHasStartedSoundCloud(true);
    setWidgetAttempt((prev) => prev + 1);
  }, [hasStartedSoundCloud, resetTimeline]);

  const handleRetryWidget = useCallback(() => {
    playRequestPendingRef.current = true;
    pauseRequestedAtRef.current = 0;
    readyRef.current = false;
    widgetRef.current = null;
    playlistSoundsRef.current = [];
    resetTimeline();
    setTrackCount(0);
    setCurrentTrack(SOUNDCLOUD_PLAYLIST);
    setCurrentTrackIndex(0);
    setHasObservedPlayback(false);
    setWidgetError(false);
    setIsWidgetReady(false);
    setIsWidgetLoading(true);
    setWidgetAttempt((prev) => prev + 1);
  }, [resetTimeline]);

  const playWidget = useCallback(() => {
    if (!hasStartedSoundCloud) {
      startSoundCloud();
      return;
    }

    if (!isExpanded) {
      setIsExpanded(true);
    }

    if (!widgetRef.current || !readyRef.current) {
      playRequestPendingRef.current = true;
      return;
    }

    setIsWidgetLoading(true);
    playRequestPendingRef.current = true;
    pauseRequestedAtRef.current = 0;
    widgetRef.current.play();
    schedulePlaybackStateSync(12, !hasObservedPlaybackRef.current);
  }, [hasStartedSoundCloud, isExpanded, schedulePlaybackStateSync, startSoundCloud]);

  const pauseWidget = useCallback(() => {
    if (!canControlWidget()) return;

    clearAutoplayRetries();
    clearPlaybackStateSync();
    playRequestPendingRef.current = false;
    pauseRequestedAtRef.current = Date.now();
    setIsWidgetLoading(false);
    widgetRef.current.pause();
    setIsPlaying(false);
    schedulePauseStateSync();
  }, [canControlWidget, clearAutoplayRetries, clearPlaybackStateSync, schedulePauseStateSync, setIsPlaying]);

  const syncPlaylistAfterNavigation = useCallback(() => {
    window.setTimeout(() => {
      refreshPlaylistSounds();
      syncCurrentTrack();
      syncDuration();
    }, 150);
  }, [refreshPlaylistSounds, syncCurrentTrack, syncDuration]);

  const handleNext = useCallback(() => {
    if (!canControlWidget()) return;

    const lastIndex = Math.max(trackCountRef.current - 1, 0);
    const nextIndex = currentTrackIndexRef.current + 1;

    if (nextIndex > lastIndex) {
      if (loopModeRef.current === 'all') {
        loadPlaylist(0, true);
      }
      return;
    }

    setIsWidgetLoading(true);
    playRequestPendingRef.current = true;
    pauseRequestedAtRef.current = 0;
    widgetRef.current.next();
    schedulePlaybackStateSync(12, !hasObservedPlaybackRef.current);
    syncPlaylistAfterNavigation();
  }, [canControlWidget, loadPlaylist, schedulePlaybackStateSync, syncPlaylistAfterNavigation]);

  const handlePrev = useCallback(() => {
    if (!canControlWidget()) return;

    if (position > 3000) {
      seekToMs(0);
      return;
    }

    const prevIndex = currentTrackIndexRef.current - 1;
    if (prevIndex < 0) {
      if (loopModeRef.current === 'all' && trackCountRef.current > 0) {
        loadPlaylist(trackCountRef.current - 1, true);
      } else {
        seekToMs(0);
      }
      return;
    }

    setIsWidgetLoading(true);
    playRequestPendingRef.current = true;
    pauseRequestedAtRef.current = 0;
    widgetRef.current.prev();
    schedulePlaybackStateSync(12, !hasObservedPlaybackRef.current);
    syncPlaylistAfterNavigation();
  }, [canControlWidget, loadPlaylist, position, schedulePlaybackStateSync, seekToMs, syncPlaylistAfterNavigation]);

  const handlePlayPause = useCallback(() => {
    if (!hasStartedSoundCloud || !canControlWidget()) {
      playWidget();
      return;
    }

    if (isWidgetLoading || playRequestPendingRef.current) {
      playWidget();
      return;
    }

    if (typeof widgetRef.current?.isPaused === 'function') {
      widgetRef.current.isPaused((paused) => {
        if (paused) {
          playWidget();
        } else {
          pauseWidget();
        }
      });
      return;
    }

    if (isPlaying) {
      pauseWidget();
      return;
    }

    playWidget();
  }, [canControlWidget, hasStartedSoundCloud, isPlaying, isWidgetLoading, pauseWidget, playWidget]);

  useEffect(() => {
    const handleGlobalKeyDown = (event) => {
      if (event.repeat) return;
      if (isEditableTarget(event.target)) return;

      const shouldHandlePlaybackKey =
        event.code === 'Space' ||
        event.code === 'KeyK' ||
        event.code === 'MediaPlayPause' ||
        event.key === 'MediaPlayPause';
      const shouldHandleNextKey =
        event.code === 'MediaTrackNext' ||
        event.key === 'MediaTrackNext' ||
        (event.shiftKey && event.code === 'KeyN');
      const shouldHandlePrevKey =
        event.code === 'MediaTrackPrevious' ||
        event.key === 'MediaTrackPrevious' ||
        (event.shiftKey && event.code === 'KeyP');
      const shouldSeekBackward = event.code === 'ArrowLeft' || event.code === 'KeyJ';
      const shouldSeekForward = event.code === 'ArrowRight' || event.code === 'KeyL';

      if (shouldHandlePlaybackKey) {
        event.preventDefault();
        handlePlayPause();
        return;
      }

      if (!hasStartedSoundCloud || widgetError || !readyRef.current) return;

      if (shouldHandleNextKey) {
        event.preventDefault();
        handleNext();
        return;
      }

      if (shouldHandlePrevKey) {
        event.preventDefault();
        handlePrev();
        return;
      }

      if (shouldSeekBackward) {
        event.preventDefault();
        seekByMs(-SEEK_STEP_MS);
        return;
      }

      if (shouldSeekForward) {
        event.preventDefault();
        seekByMs(SEEK_STEP_MS);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);

    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [handleNext, handlePlayPause, handlePrev, hasStartedSoundCloud, seekByMs, widgetError]);

  const handlePlayPausePress = useCallback((event) => {
    event.stopPropagation();

    const now = Date.now();
    if (now - lastPlayPausePressRef.current < 250) return;

    lastPlayPausePressRef.current = now;
    handlePlayPause();
  }, [handlePlayPause]);

  const cycleLoop = useCallback(() => {
    setLoopMode((prev) => {
      const modes = ['all', 'one', 'off'];
      return modes[(modes.indexOf(prev) + 1) % modes.length];
    });
  }, []);

  const handleSeek = useCallback((event) => {
    if (!widgetRef.current || !readyRef.current || !progressBarRef.current) return;

    const rect = progressBarRef.current.getBoundingClientRect();
    const x = event.touches ? event.touches[0].clientX : event.clientX;
    const ratio = Math.max(0, Math.min(1, (x - rect.left) / rect.width));
    widgetRef.current.getDuration((nextDuration) => {
      if (!nextDuration) return;
      const nextPosition = ratio * nextDuration;
      widgetRef.current.seekTo(nextPosition);
      setPosition(nextPosition);
      setDuration(nextDuration);
      setProgress(ratio);
    });
  }, []);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTrack.title,
      artist: 'Chingis',
      album: 'Portfolio playlist',
      artwork: [
        { src: '/og-image.png', sizes: '1200x630', type: 'image/png' },
      ],
    });
  }, [currentTrack.title]);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;

    navigator.mediaSession.playbackState = hasStartedSoundCloud
      ? isPlaying
        ? 'playing'
        : 'paused'
      : 'none';
  }, [hasStartedSoundCloud, isPlaying]);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
    if (!canControlWidget() || duration <= 0) return;

    try {
      navigator.mediaSession.setPositionState({
        duration: duration / 1000,
        playbackRate: 1,
        position: Math.min(position / 1000, duration / 1000),
      });
    } catch {
      // Older browsers can expose mediaSession without position state support.
    }
  }, [canControlWidget, duration, position]);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;

    const setHandler = (action, handler) => {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch {
        // Browsers expose different subsets of Media Session actions.
      }
    };

    setHandler('play', () => {
      playWidget();
    });
    setHandler('pause', () => {
      pauseWidget();
    });
    setHandler('previoustrack', () => {
      if (canControlWidget()) {
        handlePrev();
      }
    });
    setHandler('nexttrack', () => {
      if (canControlWidget()) {
        handleNext();
      }
    });
    setHandler('seekbackward', (details) => {
      if (canControlWidget()) {
        seekByMs(-(details?.seekOffset ?? SEEK_STEP_MS));
      }
    });
    setHandler('seekforward', (details) => {
      if (canControlWidget()) {
        seekByMs(details?.seekOffset ?? SEEK_STEP_MS);
      }
    });
    setHandler('seekto', (details) => {
      if (canControlWidget() && typeof details?.seekTime === 'number') {
        seekToMs(details.seekTime * 1000);
      }
    });
    setHandler('stop', () => {
      pauseWidget();
    });

    return () => {
      [
        'play',
        'pause',
        'previoustrack',
        'nexttrack',
        'seekbackward',
        'seekforward',
        'seekto',
        'stop',
      ].forEach((action) => setHandler(action, null));
    };
  }, [
    canControlWidget,
    handleNext,
    handlePrev,
    pauseWidget,
    playWidget,
    seekByMs,
    seekToMs,
  ]);

  const showConsentEmbed = hasStartedSoundCloud && !hasObservedPlayback && !widgetError;
  const initialSrc = `https://w.soundcloud.com/player/?url=${encodeURIComponent(SOUNDCLOUD_PLAYLIST.url)}${WIDGET_PARAMS}`;

  return (
    <div
      className={`fixed bottom-4 right-4 sm:right-6 z-50 origin-bottom-right transition-[width,height] duration-450 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        isExpanded
          ? `w-[calc(100%-2rem)] sm:w-[380px] ${showConsentEmbed ? 'h-[360px]' : 'h-[96px]'}`
          : 'w-14 h-14'
      }${nearFooter ? ' player-hidden' : hasAnimated.current ? ' player-visible' : ''}`}
    >
      <div
        className={`relative h-full w-full overflow-hidden bg-white/95 backdrop-blur-sm shadow-md transition-[border-radius] duration-450 ease-[cubic-bezier(0.22,1,0.36,1)]${
          bounce ? ' animate-player-bounce' : ''
        }`}
        style={{ borderRadius: isExpanded ? '16px' : '9999px' }}
      >
        {hasStartedSoundCloud && (
          <iframe
            key={widgetAttempt}
            ref={iframeRef}
            src={initialSrc}
            allow="autoplay"
            title="SoundCloud Player"
            aria-hidden={!showConsentEmbed}
            tabIndex={showConsentEmbed ? 0 : -1}
            className={
              showConsentEmbed
                ? 'absolute inset-x-0 bottom-0 top-[88px] z-10 w-full border-0 bg-white'
                : 'pointer-events-none absolute inset-0 h-full w-full overflow-hidden border-0 opacity-0'
            }
          />
        )}

        <button
          type="button"
          onClick={handlePlayPause}
          aria-label={isPlaying ? 'Pause music player' : 'Play music player'}
          className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${
            isExpanded ? 'pointer-events-none opacity-0' : 'opacity-100'
          }`}
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#2193b0] shadow-md">
            {isPlaying ? (
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="currentColor" className="ml-0.5 h-6 w-6">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </span>
        </button>

        {showConsentEmbed ? (
          <div className="absolute inset-x-0 top-0 z-20 border-b border-gray-100 bg-white/95 px-4 py-3 backdrop-blur-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-800">Enable SoundCloud playback</p>
                <p className="text-[11px] text-gray-400">
                  {isWidgetReady
                    ? 'Accept SoundCloud cookies or press play inside the player below. The compact controls will take over as soon as playback starts.'
                    : 'Loading the real SoundCloud player below so you can accept cookies inside the embed itself.'}
                </p>
                <a
                  href={SOUNDCLOUD_PLAYLIST.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex text-[11px] font-medium text-blue-600 transition-colors hover:text-blue-700"
                >
                  Open the playlist on SoundCloud
                </a>
              </div>
              <span className="shrink-0 rounded-lg bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-blue-700">
                {!isWidgetReady ? 'Loading...' : isWidgetLoading ? 'Starting...' : 'Interactive'}
              </span>
            </div>
          </div>
        ) : (
          <div
            className={`absolute inset-0 flex flex-col gap-1.5 px-3 py-2.5 transition-all duration-300 delay-75 sm:px-4 sm:py-3 ${
              isExpanded
                ? 'translate-y-0 opacity-100'
                : 'pointer-events-none translate-y-4 opacity-0'
            }`}
          >
            {hasStartedSoundCloud && isWidgetReady && !widgetError ? (
              <>
                <div className="flex items-center gap-1 sm:gap-2">
                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={handlePrev}
                      className="rounded-lg p-1.5 transition-colors hover:bg-gray-100 active:bg-gray-200"
                      aria-label="Previous track"
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-gray-500">
                        <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
                      </svg>
                    </button>

                    <button
                      type="button"
                      onClick={handlePlayPausePress}
                      className={`relative z-10 rounded-xl p-2 transition-colors ${
                        isPlaying
                          ? 'bg-blue-50 hover:bg-blue-100 active:bg-blue-200'
                          : 'bg-gray-100 hover:bg-gray-200 active:bg-gray-300'
                      }`}
                      aria-label={isPlaying ? 'Pause' : 'Play'}
                    >
                      {isPlaying ? (
                        <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-blue-600">
                          <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-gray-700">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      )}
                    </button>

                    <button
                      onClick={handleNext}
                      className="rounded-lg p-1.5 transition-colors hover:bg-gray-100 active:bg-gray-200"
                      aria-label="Next track"
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-gray-500">
                        <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
                      </svg>
                    </button>
                  </div>

                  <a
                    href={currentTrack.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-w-0 flex-1 px-2 group"
                  >
                    <p className="truncate text-sm font-medium text-gray-800 transition-colors group-hover:text-blue-600">
                      {currentTrack.title}
                    </p>
                    <p className="text-[0px] leading-none text-transparent before:text-[10px] before:leading-none before:text-gray-400 before:content-['Chingis']">
                      Chingis{trackCount > 0 ? ` • ${currentTrackIndex + 1}/${trackCount}` : ''}
                    </p>
                  </a>

                  <button
                    onClick={cycleLoop}
                    className={`relative rounded-lg p-1.5 transition-colors ${
                      loopMode === 'off'
                        ? 'text-gray-300 hover:bg-gray-100'
                        : 'text-blue-500 hover:bg-blue-50'
                    }`}
                    aria-label={`Loop: ${loopMode}`}
                    title={`Loop: ${loopMode}`}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4"
                    >
                      <path d="M17 2l4 4-4 4" />
                      <path d="M3 11v-1a4 4 0 014-4h14" />
                      <path d="M7 22l-4-4 4-4" />
                      <path d="M21 13v1a4 4 0 01-4 4H3" />
                    </svg>
                    {loopMode === 'one' && (
                      <span className="absolute -right-0.5 -top-0.5 text-[8px] font-bold leading-none text-blue-500">
                        1
                      </span>
                    )}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="w-7 select-none text-right text-[10px] tabular-nums text-gray-400">
                    {formatTime(position)}
                  </span>
                  <div
                    ref={progressBarRef}
                    className="group relative h-1.5 flex-1 cursor-pointer rounded-full bg-gray-100"
                    onClick={handleSeek}
                    onTouchEnd={handleSeek}
                  >
                    <div
                      className="relative h-full rounded-full bg-gradient-to-r from-blue-400 to-blue-500"
                      style={{ width: `${Math.min(progress * 100, 100)}%` }}
                    >
                      <div className="absolute right-0 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-blue-500 bg-white shadow-sm transition-opacity sm:opacity-0 sm:group-hover:opacity-100" />
                    </div>
                  </div>
                  <span className="w-7 select-none text-[10px] tabular-nums text-gray-400">
                    {formatTime(duration)}
                  </span>
                </div>
              </>
            ) : hasStartedSoundCloud && widgetError ? (
              <div className="flex h-full items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-800">SoundCloud was blocked</p>
                  <p className="text-[10px] text-gray-400">
                    Retry the embed here or open the playlist directly.
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <a
                    href={currentTrack.url || SOUNDCLOUD_PLAYLIST.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-blue-700"
                  >
                    Open playlist
                  </a>
                  <button
                    onClick={handleRetryWidget}
                    className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-100"
                    aria-label="Retry SoundCloud playback"
                  >
                    Retry
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex h-full items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-800">Enable SoundCloud playback</p>
                  <p className="text-[10px] text-gray-400">
                    Open the embedded player here to accept SoundCloud cookies and start the playlist.
                  </p>
                </div>
                <button
                  onClick={startSoundCloud}
                  className="shrink-0 rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-blue-700"
                  aria-label="Enable SoundCloud playback"
                >
                  Enable
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AudioPlayer;
