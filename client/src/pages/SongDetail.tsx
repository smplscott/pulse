import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import MusicPlayer from "@/components/layout/MusicPlayer";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Song, Artist } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Smile, ChevronLeft } from "lucide-react";
import { useMusic } from "@/hooks/useMusic";

export default function SongDetail() {
  const params = useParams<{ id: string }>();
  const songId = parseInt(params.id);
  const { toast } = useToast();
  const { upvoteSong, addToFavorites, addToPlaylist } = useMusic();

  const { data: song, isLoading: isLoadingSong } = useQuery<Song>({
    queryKey: [`/api/songs/${songId}`],
  });

  const { data: artist } = useQuery<Artist>({
    queryKey: [`/api/artists/name/${song?.artist}`],
    enabled: !!song?.artist,
  });

  // Handler for upvoting song
  const handleUpvoteSong = async () => {
    if (!song) return;
    
    const success = await upvoteSong(song.id);
    if (success) {
      toast({
        title: "Song Upvoted",
        description: `You upvoted "${song.title}"`,
      });
    }
  };

  // Handler for adding to favorites
  const handleAddToFavorites = async () => {
    if (!song) return;
    
    const success = await addToFavorites(1, song.id); // Using user ID 1 for demo
    if (success) {
      toast({
        title: "Added to Favorites",
        description: `"${song.title}" added to your favorites`,
      });
    }
  };

  // Handler for adding to playlist
  const handleAddToPlaylist = () => {
    toast({
      title: "Add to Playlist",
      description: "Choose a playlist to add this song to",
    });
  };

  // Handler for sharing song
  const handleShare = () => {
    // In a real app, this would use the Web Share API or similar
    toast({
      title: "Share Link",
      description: "Song link copied to clipboard",
    });
  };

  return (
    <div className="min-h-screen pb-32">
      <Header />
      
      {isLoadingSong ? (
        <div className="pt-4 px-4">
          <div className="flex items-center mb-4">
            <ChevronLeft className="h-6 w-6 mr-2" />
            <Skeleton className="h-6 w-40" />
          </div>
          <Skeleton className="h-64 w-full mb-4" />
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-32 mb-4" />
        </div>
      ) : song ? (
        <>
          {/* Header with back button */}
          <div className="pt-4 px-4 pb-2">
            <Link href="/">
              <div className="flex items-center mb-4 cursor-pointer">
                <ChevronLeft className="h-6 w-6 mr-2" />
                <span className="text-lg font-medium">Song Thread</span>
                <div className="ml-2 text-xs text-[#666]">•••</div>
              </div>
            </Link>
          </div>

          {/* Song info header */}
          <div className="px-4 pb-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                {song.albumArt ? (
                  <img
                    src={song.albumArt}
                    alt={song.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-[#282828] flex items-center justify-center">
                    <Music2 className="h-8 w-8 text-[#B3B3B3]" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold truncate">{song.title}</h1>
                <p className="text-[#B3B3B3] text-sm truncate">{song.artist}</p>
                <div className="flex items-center space-x-2 mt-1">
                  {song.genre && (
                    <span className="text-xs px-2 py-0.5 bg-[#1a1a1a] rounded text-[#B3B3B3]">
                      {song.genre}
                    </span>
                  )}
                  <span className="pink-gradient text-white px-2 py-0.5 rounded text-xs font-medium">
                    Song
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Discussion section header */}
          <div className="px-4 pb-3 border-b border-[#222222]">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Discussion</h2>
              <div className="flex items-center space-x-4 text-sm text-[#B3B3B3]">
                <span>5 comments</span>
                <span>Sort by votes</span>
              </div>
            </div>
          </div>

          {/* Discussion content */}
          <main className="px-4 py-4 space-y-4 mb-20">
            {/* Sample discussion comments - matching Artist Thread style */}
            <div className="space-y-4">
              {/* Comment 1 */}
              <div className="flex space-x-3">
                <div className="w-10 h-10 bg-[#333] rounded-full flex items-center justify-center text-sm font-medium">
                  U
                </div>
                <div className="flex-1">
                  <div className="bg-[#1a1a1a] rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-sm">music_lover</span>
                      <span className="text-xs text-[#666]">2m ago</span>
                    </div>
                    <p className="text-sm text-[#e0e0e0]">
                      This track is absolutely incredible! The production quality is insane 🔥
                    </p>
                  </div>
                  <div className="flex items-center space-x-4 mt-2 text-xs text-[#888]">
                    <button className="pink-gradient-text font-bold hover:underline">reply</button>
                    <span>•••</span>
                    <span>General</span>
                    <div className="flex items-center space-x-1">
                      <span>↑</span>
                      <span className="pink-gradient-text font-bold">12</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Comment 2 */}
              <div className="flex space-x-3">
                <div className="w-10 h-10 bg-[#333] rounded-full flex items-center justify-center text-sm font-medium">
                  U
                </div>
                <div className="flex-1">
                  <div className="bg-[#1a1a1a] rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-sm">beat_collector</span>
                      <span className="text-xs text-[#666]">15m ago</span>
                    </div>
                    <p className="text-sm text-[#e0e0e0]">
                      Heard this at Watergate last month. Absolutely incredible set, the crowd was going wild!
                    </p>
                  </div>
                  <div className="flex items-center space-x-4 mt-2 text-xs text-[#888]">
                    <button className="pink-gradient-text font-bold hover:underline">reply</button>
                    <span>•••</span>
                    <span>General</span>
                    <div className="flex items-center space-x-1">
                      <span>↑</span>
                      <span className="pink-gradient-text font-bold">8</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </>
      ) : (
        <div className="pt-4 px-4 text-center">
          <p className="text-[#B3B3B3]">Song not found</p>
        </div>
      )}
      
      {/* Chat input fixed at bottom */}
      <div className="fixed bottom-[72px] left-0 right-0 border-t border-[#222222] bg-black px-3 py-2 z-40">
        <form className="flex items-center space-x-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Message the group..."
              className="w-full bg-[#121212] border border-[#333333] rounded-full py-2 pl-3 pr-8 outline-none text-white placeholder:text-[#707070] text-sm"
            />
          </div>
          <button 
            type="submit"
            className="w-8 h-8 flex items-center justify-center pink-gradient rounded-full"
          >
            <Send className="h-4 w-4 text-white" />
          </button>
        </form>
      </div>
      
      <BottomNav />
    </div>
  );
}