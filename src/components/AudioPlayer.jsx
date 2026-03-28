import { useEffect, useRef, useState, useCallback } from 'react';
import { useAudio } from '../context/AudioContext';

const PLAYLIST = [
  { title: 'Voices', url: 'https://soundcloud.com/codetwentyfive/voices' },
  { title: 'T3v1 M', url: 'https://soundcloud.com/codetwentyfive/t3v1-m' },
  { title: 'Walk Home', url: 'https://soundcloud.com/codetwentyfive/walk-home' },
  { title: 'Маша', url: 'https://soundcloud.com/codetwentyfive/masha' },
];

const WIDGET_PARAMS = '&auto_play=false&buying=false&sharing=false&download=false&show_artwork=false&show_playcount=false&show_user=false&visual=false';
const WIDGET_LOAD_TIMEOUT_MS = 8000;
const SOUND_CLOUD_CONSENT_KEY = 'soundcloud-enabled';
const SEEK_STEP_MS = 10000;

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
  const [soundCloudEnabled, setSoundCloudEnabled] = useState(false);
  const [isWidgetLoading, setIsWidgetLoading] = useState(false);
  const [isWidgetReady, setIsWidgetReady] = useState(false);
  const [widgetError, setWidgetError] = useState(false);
  const [widgetAttempt, setWidgetAttempt] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loopMode, setLoopMode] = useState('all');
  const [progress, setProgress] = useState(0);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bounce, setBounce] = useState(false);
  const [nearFooter, setNearFooter] = useState(false);
  const hasAnimated = useRef(false);

  const widgetRef = useRef(null);
  const iframeRef = useRef(null);
  const readyRef = useRef(false);
  const pendingPlayRef = useRef(false);
  const autoplayOnLoadRef = useRef(false);
  const autoplayRetryTimeoutsRef = useRef([]);
  const playbackStateSyncRef = useRef(null);
  const loadingRef = useRef(false);
  const progressBarRef = useRef(null);
  const widgetTimeoutRef = useRef(null);
  const lastPlayPausePressRef = useRef(0);

  const currentIndexRef = useRef(0);
  const loopModeRef = useRef('all');
  const durationRef = useRef(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const savedPreference = window.localStorage.getItem(SOUND_CLOUD_CONSENT_KEY);
    if (savedPreference === 'true') {
      setSoundCloudEnabled(true);
      setWidgetAttempt(1);
    }
  }, []);

  useEffect(() => { currentIndexRef.current = currentIndex; }, [currentIndex]);
  useEffect(() => { loopModeRef.current = loopMode; }, [loopMode]);
  useEffect(() => { durationRef.current = duration; }, [duration]);

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

  const getMaxIndex = useCallback(() => {
    return PLAYLIST.length - 1;
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

  const schedulePlaybackStateSync = useCallback((remainingChecks = 12) => {
    clearPlaybackStateSync();

    if (remainingChecks <= 0 || !widgetRef.current || !readyRef.current) return;

    playbackStateSyncRef.current = window.setTimeout(() => {
      if (!widgetRef.current || !readyRef.current || typeof widgetRef.current.isPaused !== 'function') {
        playbackStateSyncRef.current = null;
        return;
      }

      widgetRef.current.isPaused((paused) => {
        setIsPlaying(!paused);
        if (!paused) {
          setIsWidgetLoading(false);
        }
        schedulePlaybackStateSync(remainingChecks - 1);
      });
    }, 250);
  }, [clearPlaybackStateSync, setIsPlaying]);

  const scheduleAutoplayRetries = useCallback(() => {
    clearAutoplayRetries();

    [700, 1800].forEach((delay) => {
      const timeoutId = window.setTimeout(() => {
        if (!pendingPlayRef.current || !widgetRef.current || !readyRef.current) return;
        widgetRef.current.play();
      }, delay);

      autoplayRetryTimeoutsRef.current.push(timeoutId);
    });
  }, [clearAutoplayRetries]);

  const loadTrack = useCallback((index, autoPlay = false) => {
    if (!widgetRef.current) return;

    pendingPlayRef.current = autoPlay;
    setIsWidgetLoading(true);
    setIsPlaying(false);
    loadingRef.current = true;
    setCurrentIndex(index);
    setProgress(0);
    setPosition(0);
    setDuration(0);
    widgetRef.current.load(PLAYLIST[index].url, {
      auto_play: autoPlay,
      buying: false,
      sharing: false,
      download: false,
      show_artwork: false,
      show_playcount: false,
      show_user: false,
    });
    if (autoPlay) {
      scheduleAutoplayRetries();
      schedulePlaybackStateSync();
    } else {
      clearAutoplayRetries();
      clearPlaybackStateSync();
    }
  }, [clearAutoplayRetries, clearPlaybackStateSync, scheduleAutoplayRetries, schedulePlaybackStateSync, setIsPlaying]);

  const syncDuration = useCallback(() => {
    if (!widgetRef.current || !readyRef.current) return;

    widgetRef.current.getDuration((nextDuration) => {
      if (nextDuration > 0) {
        setDuration(nextDuration);
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

  const handleWidgetFailure = useCallback(() => {
    readyRef.current = false;
    loadingRef.current = false;
    pendingPlayRef.current = false;
    clearAutoplayRetries();
    clearPlaybackStateSync();
    widgetRef.current = null;
    setIsPlaying(false);
    setIsWidgetLoading(false);
    setIsWidgetReady(false);
    setWidgetError(true);
  }, [clearAutoplayRetries, clearPlaybackStateSync, setIsPlaying]);

  useEffect(() => {
    if (!soundCloudEnabled) return;

    let isActive = true;

    window.clearTimeout(widgetTimeoutRef.current);
    widgetTimeoutRef.current = window.setTimeout(() => {
      if (!isActive || readyRef.current) return;
      handleWidgetFailure();
    }, WIDGET_LOAD_TIMEOUT_MS);

    const loadAPI = () =>
      new Promise((resolve, reject) => {
        if (window.SC?.Widget) { resolve(); return; }
        document.querySelector('script[src="https://w.soundcloud.com/player/api.js"]')?.remove();
        const s = document.createElement('script');
        s.src = 'https://w.soundcloud.com/player/api.js';
        s.async = true;
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
      });

    loadAPI()
      .then(() => {
        if (!isActive || !iframeRef.current || !window.SC?.Widget) {
          handleWidgetFailure();
          return;
        }

        setIsWidgetLoading(true);
        const w = window.SC.Widget(iframeRef.current);
        widgetRef.current = w;

        w.bind(window.SC.Widget.Events.READY, () => {
          if (!isActive) return;
          window.clearTimeout(widgetTimeoutRef.current);
          readyRef.current = true;
          loadingRef.current = false;
          setWidgetError(false);
          setIsWidgetReady(true);
          setIsWidgetLoading(false);
          w.setVolume(40);
          w.getDuration((d) => setDuration(d));
          if (typeof window !== 'undefined') {
            window.localStorage.setItem(SOUND_CLOUD_CONSENT_KEY, 'true');
          }
          if (pendingPlayRef.current) {
            w.play();
            scheduleAutoplayRetries();
            schedulePlaybackStateSync();
          }
        });

        w.bind(window.SC.Widget.Events.PLAY, () => {
          syncDuration();
        });

        w.bind(window.SC.Widget.Events.PAUSE, () => {
          clearPlaybackStateSync();
          loadingRef.current = false;
          setIsWidgetLoading(false);
          setIsPlaying(false);
        });

        w.bind(window.SC.Widget.Events.PLAY_PROGRESS, (data) => {
          if (!durationRef.current) {
            syncDuration();
          }
          pendingPlayRef.current = false;
          clearAutoplayRetries();
          clearPlaybackStateSync();
          loadingRef.current = false;
          setIsWidgetLoading(false);
          setIsPlaying(true);
          setProgress(data.relativePosition);
          setPosition(data.currentPosition);
        });

        w.bind(window.SC.Widget.Events.FINISH, () => {
          const idx = currentIndexRef.current;
          const loop = loopModeRef.current;

          if (loop === 'one') {
            w.seekTo(0);
            w.play();
            return;
          }

          const max = PLAYLIST.length - 1;
          const next = idx + 1;

          if (next > max) {
            if (loop === 'all') {
              loadTrack(0, true);
            } else {
              setIsPlaying(false);
            }
          } else {
            loadTrack(next, true);
          }
        });
      })
      .catch(() => {
        if (!isActive) return;
        handleWidgetFailure();
      });

    return () => {
      isActive = false;
      clearAutoplayRetries();
      clearPlaybackStateSync();
      window.clearTimeout(widgetTimeoutRef.current);
    };
  }, [clearAutoplayRetries, clearPlaybackStateSync, handleWidgetFailure, loadTrack, setIsPlaying, soundCloudEnabled, syncDuration, scheduleAutoplayRetries, schedulePlaybackStateSync, widgetAttempt]);

  const handleOpenPlayer = useCallback(() => {
    if (!isExpanded) {
      setIsExpanded(true);
    }
  }, [isExpanded]);

  const handleEnablePlayback = useCallback(() => {
    setIsExpanded(true);

    if (!soundCloudEnabled) {
      pendingPlayRef.current = true;
      autoplayOnLoadRef.current = true;
      setWidgetError(false);
      setIsWidgetReady(false);
      setSoundCloudEnabled(true);
      setIsWidgetLoading(true);
      setWidgetAttempt((prev) => prev + 1);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(SOUND_CLOUD_CONSENT_KEY, 'true');
      }
      return;
    }

    if (!widgetRef.current || !readyRef.current) return;
    pendingPlayRef.current = true;
    setIsWidgetLoading(true);
    widgetRef.current.play();
    schedulePlaybackStateSync();
  }, [schedulePlaybackStateSync, soundCloudEnabled]);

  const handleRetryWidget = useCallback(() => {
    pendingPlayRef.current = true;
    autoplayOnLoadRef.current = true;
    readyRef.current = false;
    loadingRef.current = true;
    widgetRef.current = null;
    setWidgetError(false);
    setIsWidgetReady(false);
    setIsWidgetLoading(true);
    setWidgetAttempt((prev) => prev + 1);
  }, []);

  const toggleWidgetPlayback = useCallback(() => {
    if (!widgetRef.current || !readyRef.current) return;

    const widget = widgetRef.current;

    if (typeof widget.isPaused === 'function') {
      widget.isPaused((paused) => {
        if (paused) {
          setIsWidgetLoading(true);
          pendingPlayRef.current = true;
          widget.play();
          schedulePlaybackStateSync();
        } else {
          pendingPlayRef.current = false;
          widget.pause();
          setIsPlaying(false);
        }
      });
      return;
    }

    if (isPlaying) {
      pendingPlayRef.current = false;
      widget.pause();
      setIsPlaying(false);
    } else {
      setIsWidgetLoading(true);
      pendingPlayRef.current = true;
      widget.play();
      schedulePlaybackStateSync();
    }
  }, [isPlaying, schedulePlaybackStateSync, setIsPlaying]);

  const handleNext = useCallback(() => {
    if (!widgetRef.current) return;
    const max = getMaxIndex();
    const next = currentIndexRef.current + 1;
    loadTrack(next > max ? 0 : next, true);
  }, [loadTrack, getMaxIndex]);

  const handlePrev = useCallback(() => {
    if (!widgetRef.current) return;
    const max = getMaxIndex();
    const prev = currentIndexRef.current - 1;
    loadTrack(prev < 0 ? max : prev, true);
  }, [loadTrack, getMaxIndex]);

  const playWidget = useCallback(() => {
    if (!soundCloudEnabled) {
      handleEnablePlayback();
      return;
    }

    if (!isExpanded) {
      setIsExpanded(true);
    }

    if (!widgetRef.current || !readyRef.current) {
      pendingPlayRef.current = true;
      schedulePlaybackStateSync();
      return;
    }

    setIsWidgetLoading(true);
    pendingPlayRef.current = true;
    widgetRef.current.play();
    schedulePlaybackStateSync();
  }, [handleEnablePlayback, isExpanded, schedulePlaybackStateSync, soundCloudEnabled]);

  const pauseWidget = useCallback(() => {
    if (!canControlWidget()) return;

    clearPlaybackStateSync();
    pendingPlayRef.current = false;
    widgetRef.current.pause();
    setIsPlaying(false);
  }, [canControlWidget, clearPlaybackStateSync, setIsPlaying]);

  const handlePlayPause = useCallback(() => {
    if (!soundCloudEnabled || !canControlWidget()) {
      playWidget();
      return;
    }

    if (isWidgetLoading || pendingPlayRef.current) {
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
  }, [canControlWidget, isPlaying, isWidgetLoading, pauseWidget, playWidget, soundCloudEnabled]);

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

      if (!soundCloudEnabled || widgetError || !readyRef.current) return;

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
  }, [handleNext, handlePlayPause, handlePrev, seekByMs, soundCloudEnabled, widgetError]);

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

  const handleSeek = useCallback((e) => {
    if (!widgetRef.current || !readyRef.current || !progressBarRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    const ratio = Math.max(0, Math.min(1, (x - rect.left) / rect.width));
    widgetRef.current.getDuration((d) => {
      widgetRef.current.seekTo(ratio * d);
    });
  }, []);

  const track = PLAYLIST[currentIndex];

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: 'Chingis',
      album: 'SoundCloud Picks',
      artwork: [
        { src: '/og-image.png', sizes: '1200x630', type: 'image/png' },
      ],
    });
  }, [track.title]);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;

    navigator.mediaSession.playbackState = isPlaying
      ? 'playing'
      : isWidgetLoading
        ? 'paused'
        : 'none';
  }, [isPlaying, isWidgetLoading]);

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
  const initialWidgetParams = autoplayOnLoadRef.current
    ? WIDGET_PARAMS.replace('auto_play=false', 'auto_play=true')
    : WIDGET_PARAMS;
  const initialSrc = `https://w.soundcloud.com/player/?url=${encodeURIComponent(PLAYLIST[0].url)}${initialWidgetParams}`;

  return (
      <div
        className={`fixed bottom-4 right-4 sm:right-6 z-50 origin-bottom-right transition-[width,height] duration-450 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isExpanded ? 'w-[calc(100%-2rem)] sm:w-[380px] h-[96px]' : 'w-14 h-14'
        }${nearFooter ? ' player-hidden' : hasAnimated.current ? ' player-visible' : ''}`}
      >
        {soundCloudEnabled && (
          <iframe
            key={widgetAttempt}
            ref={iframeRef}
            src={initialSrc}
            allow="autoplay"
            title="SoundCloud Player"
            aria-hidden="true"
            tabIndex={-1}
            // Keep the widget mounted in-place for mobile browsers while the custom UI stays on top.
            className="pointer-events-none absolute inset-0 h-full w-full overflow-hidden border-0 opacity-0"
          />
        )}
        <div
          className={`relative h-full w-full overflow-hidden bg-white/95 backdrop-blur-sm shadow-md transition-[border-radius] duration-450 ease-[cubic-bezier(0.22,1,0.36,1)]${
            bounce ? ' animate-player-bounce' : ''
          }`}
          style={{ borderRadius: isExpanded ? '16px' : '9999px' }}
        >
          <button
            type="button"
            onClick={handlePlayPause}
            aria-label={isPlaying ? "Pause music player" : "Play music player"}
            className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${
              isExpanded ? 'pointer-events-none opacity-0' : 'opacity-100'
            }`}
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#2193b0] shadow-md">
              <svg viewBox="0 0 24 24" fill="currentColor" className="ml-0.5 h-6 w-6">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          </button>
          <div
            className={`absolute inset-0 flex flex-col gap-1.5 px-3 py-2.5 transition-all duration-300 delay-75 sm:px-4 sm:py-3 ${
              isExpanded
                ? 'translate-y-0 opacity-100'
                : 'pointer-events-none translate-y-4 opacity-0'
            }`}
          >
          {soundCloudEnabled && isWidgetReady && !widgetError ? (
            <>
          {/* Transport + Track Info */}
          <div className="flex items-center gap-1 sm:gap-2">
            <div className="flex items-center gap-0.5">
              <button
                onClick={handlePrev}
                className="p-1.5 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors"
                aria-label="Previous track"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-gray-500">
                  <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
                </svg>
              </button>

              <button
                type="button"
                onClick={handlePlayPausePress}
                className={`relative z-10 p-2 rounded-xl transition-colors ${
                  isPlaying
                    ? 'bg-blue-50 hover:bg-blue-100 active:bg-blue-200'
                    : 'bg-gray-100 hover:bg-gray-200 active:bg-gray-300'
                }`}
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-blue-600">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-gray-700">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>

              <button
                onClick={handleNext}
                className="p-1.5 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors"
                aria-label="Next track"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-gray-500">
                  <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
                </svg>
              </button>
            </div>

            <a
              href={track.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 min-w-0 px-2 group"
            >
              <p className="text-sm font-medium text-gray-800 truncate group-hover:text-blue-600 transition-colors">
                {track.title}
              </p>
              <p className="text-[10px] text-gray-400">Chingis</p>
            </a>

            <button
              onClick={cycleLoop}
              className={`p-1.5 rounded-lg transition-colors relative ${
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
                className="w-4 h-4"
              >
                <path d="M17 2l4 4-4 4" />
                <path d="M3 11v-1a4 4 0 014-4h14" />
                <path d="M7 22l-4-4 4-4" />
                <path d="M21 13v1a4 4 0 01-4 4H3" />
              </svg>
              {loopMode === 'one' && (
                <span className="absolute -top-0.5 -right-0.5 text-[8px] font-bold leading-none text-blue-500">
                  1
                </span>
              )}
            </button>
          </div>

          {/* Progress Bar */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-400 tabular-nums w-7 text-right select-none">
              {formatTime(position)}
            </span>
            <div
              ref={progressBarRef}
              className="flex-1 h-1.5 bg-gray-100 rounded-full cursor-pointer group relative"
              onClick={handleSeek}
              onTouchEnd={handleSeek}
            >
              <div
                className="h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full relative"
                style={{ width: `${Math.min(progress * 100, 100)}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-2 border-blue-500 rounded-full shadow-sm opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
            <span className="text-[10px] text-gray-400 tabular-nums w-7 select-none">
              {formatTime(duration)}
            </span>
          </div>
            </>
          ) : soundCloudEnabled && widgetError ? (
            <div className="flex h-full items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-medium text-gray-800">SoundCloud was blocked</p>
                <p className="text-[10px] text-gray-400">
                  Allow SoundCloud or open this track directly.
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <a
                  href={track.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-blue-700"
                >
                  Open track
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
          ) : soundCloudEnabled ? (
            <div className="flex h-full items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-medium text-gray-800">Starting SoundCloud...</p>
                <p className="text-[10px] text-gray-400">
                  Loading the player after your explicit choice.
                </p>
              </div>
              <span className="shrink-0 rounded-lg bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700">
                {isWidgetLoading ? 'Loading...' : 'Waiting...'}
              </span>
            </div>
          ) : (
            <div className="flex h-full items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-medium text-gray-800">Enable SoundCloud playback</p>
                <p className="text-[10px] text-gray-400">
                  Load SoundCloud only after you choose to play.
                </p>
              </div>
              <button
                onClick={handleEnablePlayback}
                className="shrink-0 rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-blue-700"
                aria-label="Enable SoundCloud playback"
              >
                {isWidgetLoading ? 'Loading...' : 'Enable'}
              </button>
            </div>
          )}
          </div>
        </div>
      </div>
  );
};

export default AudioPlayer;
