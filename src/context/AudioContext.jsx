import { createContext, useContext, useState, useEffect, useRef } from 'react';

const AudioContext = createContext();

export function AudioProvider({ children }) {
  const audioRef = useRef(null);
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const [isMusicInfoVisible, setIsMusicInfoVisible] = useState(false);

  // Lazy load audio
  useEffect(() => {
    const audio = new Audio();
    audio.volume = 0.4;
    audio.loop = true;
    
    // Load audio file only when needed
    const loadAudio = () => {
      if (!audioRef.current) {
        import('../assets/dream.ogg').then((module) => {
          audio.src = module.default;
          audioRef.current = audio;
        });
      }
    };

    // Load audio on first user interaction
    const handleFirstInteraction = () => {
      loadAudio();
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
    };

    window.addEventListener('click', handleFirstInteraction);
    window.addEventListener('touchstart', handleFirstInteraction);

    return () => {
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlayingMusic) {
        audioRef.current.play().catch(() => setIsPlayingMusic(false));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlayingMusic]);

  const toggleMusicInfo = () => {
    setIsMusicInfoVisible(!isMusicInfoVisible);
  };

  const toggleMusic = () => {
    if (!audioRef.current?.src) return;
    setIsPlayingMusic(!isPlayingMusic);
    if (isPlayingMusic) {
      toggleMusicInfo();
    }
  };

  return (
    <AudioContext.Provider 
      value={{ 
        isPlayingMusic, 
        isMusicInfoVisible,
        toggleMusic,
        toggleMusicInfo 
      }}
    >
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
} 