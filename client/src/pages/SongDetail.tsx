import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Song, Artist } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, Link as LinkIcon, Share2, Heart, PlusCircle, Music2, Send } from "lucide-react";
import { useMusic } from "@/hooks/useMusic";

export default function SongDetail() {
  const params = useParams<{ id: string }>();
  const songId = parseInt(params.id);
  const { toast } = useToast();
  const { upvoteSong } = useMusic();

  const { data: song, isLoading: isLoadingSong } = useQuery<Song>({
    queryKey: [`/api/songs/${songId}`],
  });

  const { data: artist, isLoading: isLoadingArtist } = useQuery<Artist>({
    queryKey: [`/api/artists/name/${song?.artist}`],
    enabled: !!song?.artist,
  });

  // Handler for upvoting the song
  const handleUpvoteSong = async () => {
    if (song) {
      const success = await upvoteSong(song.id);
      if (success) {
        toast({
          title: "Upvoted!",
          description: `You upvoted ${song.title} by ${song.artist}`,
        });
      }
    }
  };

  // Handler for adding song to favorites
  const handleAddToFavorites = () => {
    toast({
      title: "Added to Favorites",
      description: `${song?.title} has been added to your favorites`,
    });
  };

  // Handler for adding song to playlist
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
          <div className="flex space-x-4 mb-6">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
        </div>
      ) : song ? (
        <>
          <div className="pt-4 px-4">
            <Link href="/">
              <div className="flex items-center mb-4 cursor-pointer">
                <ChevronLeft className="h-6 w-6 mr-2" />
                <span className="text-lg font-medium">Song</span>
              </div>
            </Link>
            
            <div className="relative aspect-square max-w-xs mx-auto rounded-lg overflow-hidden mb-6 shadow-xl">
              {song.albumArt ? (
                <img
                  src={song.albumArt}
                  alt={song.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-[#282828] flex items-center justify-center">
                  <Music2 className="h-16 w-16 text-[#B3B3B3]" />
                </div>
              )}
            </div>
            
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold mb-1">{song.title}</h1>
              <Link href={`/artist/${artist?.id || 'unknown'}`}>
                <p className="text-[#B3B3B3] hover:underline cursor-pointer">
                  {song.artist}
                  {song.features && song.features.length > 0 && (
                    <span> feat. {song.features.join(", ")}</span>
                  )}
                </p>
              </Link>
              <div className="flex justify-center mt-2 space-x-2">
                {song.genre && (
                  <Badge variant="genre" className="text-xs">
                    {song.genre}
                  </Badge>
                )}
                {song.subGenres && song.subGenres.map((subGenre, index) => (
                  <Badge key={index} variant="genre" className="text-xs">
                    {subGenre}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div className="flex items-center mb-8 space-x-4 justify-center">
              <button 
                className="pink-gradient pink-gradient-hover text-white py-2 px-6 rounded-full text-sm font-medium flex items-center justify-center"
                onClick={handleUpvoteSong}
              >
                <Heart className="h-4 w-4 mr-2" />
                Upvote
              </button>
              <button 
                className="w-10 h-10 rounded-full bg-[#282828] flex items-center justify-center"
                onClick={handleAddToFavorites}
              >
                <Heart className="h-5 w-5 text-white" />
              </button>
              <button 
                className="w-10 h-10 rounded-full bg-[#282828] flex items-center justify-center"
                onClick={handleAddToPlaylist}
              >
                <PlusCircle className="h-5 w-5 text-white" />
              </button>
              <button 
                className="w-10 h-10 rounded-full bg-[#282828] flex items-center justify-center"
                onClick={handleShare}
              >
                <Share2 className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>
          
          {song.story && (
            <div className="px-4 mb-6">
              <h2 className="text-lg font-semibold mb-2">About This Track</h2>
              <p className="text-sm text-[#B3B3B3]">{song.story}</p>
            </div>
          )}
          
          {song.sample && (
            <div className="px-4 mb-6">
              <h2 className="text-lg font-semibold mb-2">Samples</h2>
              <div className="bg-[#181818] p-3 rounded-lg">
                <p className="text-sm">{song.sample}</p>
              </div>
            </div>
          )}
          
          {song.streamingLinks && song.streamingLinks.length > 0 && (
            <div className="px-4 mt-6">
              <h2 className="text-lg font-semibold mb-2">Listen On</h2>
              <div className="flex flex-wrap gap-3">
                {song.streamingLinks.map((link, index) => (
                  <a 
                    key={index} 
                    href={link.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="bg-[#282828] p-3 rounded-lg flex items-center justify-center hover:bg-[#3E3E3E] transition"
                  >
                    <span className="text-sm">{link.platform}</span>
                    <LinkIcon className="h-4 w-4 ml-2" />
                  </a>
                ))}
              </div>
            </div>
          )}
          
          <div className="px-4 mt-8 mb-4">
            <h2 className="text-lg font-semibold mb-4">Similar Tracks</h2>
            <div className="text-center py-4 bg-[#181818] rounded-lg">
              <p className="text-[#B3B3B3]">Coming soon...</p>
            </div>
          </div>
        </>
      ) : (
        <div className="pt-4 px-4 text-center">
          <Link href="/">
            <div className="flex items-center mb-4 cursor-pointer">
              <ChevronLeft className="h-6 w-6 mr-2" />
              <span className="text-lg font-medium">Back</span>
            </div>
          </Link>
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
