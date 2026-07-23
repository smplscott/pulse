import { createContext, useState, ReactNode, useEffect } from "react";
import { Song } from "@shared/schema";

interface MusicPlayerContextType {
  currentSong: Song | null;
  isPlaying: boolean;
  queue: Song[];
  playSong: (song: Song) => void;
  pauseSong: () => void;
  togglePlay: () => void;
  nextSong: () => void;
  previousSong: () => void;
  addToQueue: (song: Song) => void;
  removeFromQueue: (songId: number) => void;
  clearQueue: () => void;
}

export const MusicPlayerContext = createContext<MusicPlayerContextType>({
  currentSong: null,
  isPlaying: false,
  queue: [],
  playSong: () => {},
  pauseSong: () => {},
  togglePlay: () => {},
  nextSong: () => {},
  previousSong: () => {},
  addToQueue: () => {},
  removeFromQueue: () => {},
  clearQueue: () => {}
});

interface MusicPlayerProviderProps {
  children: ReactNode;
}

export const MusicPlayerProvider = ({ children }: MusicPlayerProviderProps) => {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [queue, setQueue] = useState<Song[]>([]);
  const [currentSongIndex, setCurrentSongIndex] = useState<number>(-1);

  // Create an audio element for playing music
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialize audio element
    const audio = new Audio();
    setAudioElement(audio);

    // Clean up on unmount
    return () => {
      if (audio) {
        audio.pause();
        audio.src = "";
      }
    };
  }, []);

  const playSong = (song: Song) => {
    if (!song) return;

    setCurrentSong(song);
    setIsPlaying(true);

    // Check if the song is already in the queue
    const songIndex = queue.findIndex(queuedSong => queuedSong.id === song.id);
    
    if (songIndex >= 0) {
      // Song is in queue, set current index
      setCurrentSongIndex(songIndex);
    } else {
      // Song not in queue, add it and set as current
      setQueue([...queue, song]);
      setCurrentSongIndex(queue.length);
    }

    // If we have an audio element and song has streaming links, simulate playback
    if (audioElement && Array.isArray(song.streamingLinks) && (song.streamingLinks as unknown[]).length > 0) {
      // In a real app, we would set the audio source to the actual streaming URL
      // For now, we'll simulate playback behavior
      audioElement.pause();
      
      // Reset the audio element
      audioElement.currentTime = 0;
      
      // Pretend to set the source from streaming links
      // audioElement.src = song.streamingLinks[0].url;
      
      // Start playing
      const playPromise = audioElement.play();
      if (playPromise) {
        playPromise.catch(error => {
          console.error("Playback failed:", error);
          setIsPlaying(false);
        });
      }
    }
  };

  const pauseSong = () => {
    setIsPlaying(false);
    if (audioElement) {
      audioElement.pause();
    }
  };

  const togglePlay = () => {
    if (isPlaying) {
      pauseSong();
    } else if (currentSong) {
      setIsPlaying(true);
      if (audioElement) {
        const playPromise = audioElement.play();
        if (playPromise) {
          playPromise.catch(error => {
            console.error("Playback failed:", error);
            setIsPlaying(false);
          });
        }
      }
    }
  };

  const nextSong = () => {
    if (queue.length === 0 || currentSongIndex === -1) return;
    
    const nextIndex = (currentSongIndex + 1) % queue.length;
    setCurrentSongIndex(nextIndex);
    setCurrentSong(queue[nextIndex]);
    
    if (isPlaying && audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
      const playPromise = audioElement.play();
      if (playPromise) {
        playPromise.catch(error => {
          console.error("Playback failed:", error);
          setIsPlaying(false);
        });
      }
    }
  };

  const previousSong = () => {
    if (queue.length === 0 || currentSongIndex === -1) return;
    
    const prevIndex = (currentSongIndex - 1 + queue.length) % queue.length;
    setCurrentSongIndex(prevIndex);
    setCurrentSong(queue[prevIndex]);
    
    if (isPlaying && audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
      const playPromise = audioElement.play();
      if (playPromise) {
        playPromise.catch(error => {
          console.error("Playback failed:", error);
          setIsPlaying(false);
        });
      }
    }
  };

  const addToQueue = (song: Song) => {
    // Add song to queue if it's not already there
    if (!queue.some(queuedSong => queuedSong.id === song.id)) {
      setQueue([...queue, song]);
    }
  };

  const removeFromQueue = (songId: number) => {
    const newQueue = queue.filter(song => song.id !== songId);
    setQueue(newQueue);
    
    // Adjust current song index if needed
    if (currentSong && currentSong.id === songId) {
      if (newQueue.length > 0) {
        // Play next available song
        const newIndex = Math.min(currentSongIndex, newQueue.length - 1);
        setCurrentSongIndex(newIndex);
        setCurrentSong(newQueue[newIndex]);
      } else {
        // No more songs in queue
        setCurrentSongIndex(-1);
        setCurrentSong(null);
        setIsPlaying(false);
      }
    } else if (currentSongIndex > -1) {
      // Adjust index if removed song was before current song
      const newIndex = newQueue.findIndex(song => currentSong && song.id === currentSong.id);
      setCurrentSongIndex(newIndex);
    }
  };

  const clearQueue = () => {
    setQueue([]);
    setCurrentSongIndex(-1);
    setIsPlaying(false);
    setCurrentSong(null);
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
    }
  };

  const contextValue: MusicPlayerContextType = {
    currentSong,
    isPlaying,
    queue,
    playSong,
    pauseSong,
    togglePlay,
    nextSong,
    previousSong,
    addToQueue,
    removeFromQueue,
    clearQueue
  };

  return (
    <MusicPlayerContext.Provider value={contextValue}>
      {children}
    </MusicPlayerContext.Provider>
  );
};
