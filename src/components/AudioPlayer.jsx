import { useAudio } from '../context/AudioContext';
import { soundoff, soundon } from "../assets/icons";

const AudioPlayer = () => {
  const { isPlayingMusic, isMusicInfoVisible, toggleMusic } = useAudio();

  return (
    <div className="flex flex-row gap-6 justify-center items-center fixed h-15 md:bottom-2 md:left-2 bottom-16 left-8 z-50">
      <img
        src={!isPlayingMusic ? soundoff : soundon}
        alt="musicplayer"
        className="w-10 h-10 cursor-pointer object-contain"
        onClick={toggleMusic}
      />
      <div
        className={`music-info ${
          isPlayingMusic ? "visible" : ""
        } py-1 px-2 rounded-lg`}
      >
        <p>
          Title: <span className="font-semibold text-yellow-200">dream.ogg</span> <br />
          Artist: Chingis
        </p>
      </div>
    </div>
  );
};

export default AudioPlayer; 