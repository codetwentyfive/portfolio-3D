import { useEffect, useRef, useState, useCallback } from 'react';
import { useAudio } from '../context/AudioContext';

const PLAYLIST = [
  { title: 'Voices', url: 'https://soundcloud.com/codetwentyfive/voices' },
  { title: 'T3v1 M', url: 'https://soundcloud.com/codetwentyfive/t3v1-m' },
  { title: 'Walk Home', url: 'https://soundcloud.com/codetwentyfive/walk-home' },
  { title: 'Маша', url: 'https://soundcloud.com/codetwentyfive/masha' },
  { title: 'Destroyed Butthole', url: 'https://soundcloud.com/codetwentyfive/destroyed-butthole' },
];

const REGULAR_COUNT = 4;

const WIDGET_PARAMS = '&auto_play=false&buying=false&sharing=false&download=false&show_artwork=false&show_playcount=false&show_user=false&visual=false';

const formatTime = (ms) => {
  if (!ms || ms <= 0) return '0:00';
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
};

const AudioPlayer = () => {
  const { isPlaying, setIsPlaying } = useAudio();
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loopMode, setLoopMode] = useState('all');
  const [progress, setProgress] = useState(0);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [secretUnlocked, setSecretUnlocked] = useState(false);
  const [bounce, setBounce] = useState(false);
  const [nearFooter, setNearFooter] = useState(false);
  const hasAnimated = useRef(false);

  const widgetRef = useRef(null);
  const iframeRef = useRef(null);
  const readyRef = useRef(false);
  const pendingPlayRef = useRef(false);
  const loadingRef = useRef(false);
  const completedRef = useRef(new Set());
  const progressBarRef = useRef(null);

  const currentIndexRef = useRef(0);
  const loopModeRef = useRef('all');
  const secretRef = useRef(false);

  useEffect(() => { currentIndexRef.current = currentIndex; }, [currentIndex]);
  useEffect(() => { loopModeRef.current = loopMode; }, [loopMode]);
  useEffect(() => { secretRef.current = secretUnlocked; }, [secretUnlocked]);

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
    return secretRef.current ? PLAYLIST.length - 1 : REGULAR_COUNT - 1;
  }, []);

  const loadTrack = useCallback((index, autoPlay = false) => {
    if (!widgetRef.current) return;
    loadingRef.current = true;
    readyRef.current = false;
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
  }, []);

  useEffect(() => {
    const loadAPI = () =>
      new Promise((resolve) => {
        if (window.SC?.Widget) { resolve(); return; }
        const s = document.createElement('script');
        s.src = 'https://w.soundcloud.com/player/api.js';
        s.onload = resolve;
        document.head.appendChild(s);
      });

    loadAPI().then(() => {
      if (!iframeRef.current || !window.SC?.Widget) return;
      const w = window.SC.Widget(iframeRef.current);
      widgetRef.current = w;

      w.bind(window.SC.Widget.Events.READY, () => {
        readyRef.current = true;
        loadingRef.current = false;
        w.setVolume(40);
        w.getDuration((d) => setDuration(d));
        if (pendingPlayRef.current) {
          pendingPlayRef.current = false;
          w.play();
        }
      });

      w.bind(window.SC.Widget.Events.PLAY, () => setIsPlaying(true));

      w.bind(window.SC.Widget.Events.PAUSE, () => {
        if (!loadingRef.current) setIsPlaying(false);
      });

      w.bind(window.SC.Widget.Events.PLAY_PROGRESS, (data) => {
        setProgress(data.relativePosition);
        setPosition(data.currentPosition);
      });

      w.bind(window.SC.Widget.Events.FINISH, () => {
        const idx = currentIndexRef.current;
        const loop = loopModeRef.current;

        completedRef.current.add(idx);

        if (!secretRef.current) {
          const allDone = Array.from({ length: REGULAR_COUNT }, (_, i) => i)
            .every((i) => completedRef.current.has(i));
          if (allDone) {
            secretRef.current = true;
            setSecretUnlocked(true);
          }
        }

        if (loop === 'one') {
          w.seekTo(0);
          w.play();
          return;
        }

        const max = secretRef.current ? PLAYLIST.length - 1 : REGULAR_COUNT - 1;
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
    });
  }, [setIsPlaying, loadTrack]);

  const handlePlayPause = useCallback(() => {
    if (!isExpanded) {
      setIsExpanded(true);
      if (!widgetRef.current || !readyRef.current) {
        pendingPlayRef.current = true;
        return;
      }
      widgetRef.current.play();
      return;
    }

    if (!widgetRef.current || !readyRef.current) return;
    widgetRef.current.toggle();
  }, [isExpanded]);

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
  const initialSrc = `https://w.soundcloud.com/player/?url=${encodeURIComponent(PLAYLIST[0].url)}${WIDGET_PARAMS}`;

  return (
      <div
        className={`fixed bottom-4 right-4 sm:right-6 z-50 origin-bottom-right transition-[width,height] duration-450 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isExpanded ? 'w-[calc(100%-2rem)] sm:w-[380px] h-[84px]' : 'w-14 h-14'
        }${nearFooter ? ' player-hidden' : hasAnimated.current ? ' player-visible' : ''}`}
      >
        <iframe
          ref={iframeRef}
          src={initialSrc}
          allow="autoplay"
          title="SoundCloud Player"
          className="absolute w-0 h-0 border-0 overflow-hidden"
        />
        <div
          className={`relative h-full w-full overflow-hidden bg-white/95 backdrop-blur-sm shadow-md transition-[border-radius] duration-450 ease-[cubic-bezier(0.22,1,0.36,1)]${
            bounce ? ' animate-player-bounce' : ''
          }`}
          style={{ borderRadius: isExpanded ? '16px' : '9999px' }}
        >
          <button
            onClick={handlePlayPause}
            aria-label="Open music player"
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
                onClick={handlePlayPause}
                className={`p-2 rounded-xl transition-colors ${
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
          </div>
        </div>
      </div>
  );
};

export default AudioPlayer;
