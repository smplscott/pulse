import { useContext } from "react";
import { PlayIcon, PauseIcon, SkipBackIcon, SkipForwardIcon } from "lucide-react";
import { MusicPlayerContext } from "@/context/MusicPlayerContext";
import { truncateText } from "@/lib/utils";

export default function MusicPlayer() {
  const { currentSong, isPlaying, togglePlay, nextSong, previousSong } = useContext(MusicPlayerContext);

  if (!currentSong) return null;

  return (
    <div className="fixed bottom-16 left-0 right-0 bg-[#282828] border-t border-[#3E3E3E] p-2 flex items-center">
      <div className="w-10 h-10 rounded bg-[#181818] overflow-hidden mr-3 flex-shrink-0">
        {currentSong.albumArt && (
          <img
            src={currentSong.albumArt}
            alt={`${currentSong.title} album artwork`}
            className="w-full h-full object-cover"
          />
        )}
      </div>
      <div className="flex-1 mr-3">
        <p className="font-medium text-sm truncate">{truncateText(currentSong.title, 30)}</p>
        <p className="text-xs text-[#B3B3B3] truncate">
          {truncateText(
            currentSong.features?.length
              ? `${currentSong.artist}, ${currentSong.features.join(", ")}`
              : currentSong.artist,
            40
          )}
        </p>
      </div>
      <div className="flex space-x-4 items-center">
        <button className="text-white" onClick={previousSong}>
          <SkipBackIcon className="h-4 w-4" />
        </button>
        <button
          className="w-8 h-8 rounded-full bg-[#1DB954] flex items-center justify-center"
          onClick={togglePlay}
        >
          {isPlaying ? (
            <PauseIcon className="h-4 w-4 text-white" />
          ) : (
            <PlayIcon className="h-4 w-4 text-white" />
          )}
        </button>
        <button className="text-white" onClick={nextSong}>
          <SkipForwardIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
