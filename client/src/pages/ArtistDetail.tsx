import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import MusicPlayer from "@/components/layout/MusicPlayer";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Artist, Song } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, PlayCircle, Link as LinkIcon, Share2, ArrowUpCircle, Music2, ListMusic, Calendar, PlayIcon } from "lucide-react";
import { useMusic } from "@/hooks/useMusic";

export default function ArtistDetail() {
  const params = useParams<{ id: string }>();
  const artistId = parseInt(params.id);
  const { toast } = useToast();
  const { playSong } = useMusic();

  const { data: artist, isLoading: isLoadingArtist } = useQuery<Artist>({
    queryKey: [`/api/artists/${artistId}`],
  });

  const { data: songs, isLoading: isLoadingSongs } = useQuery<Song[]>({
    queryKey: [`/api/songs/artist/${artist?.name}`],
    enabled: !!artist?.name,
  });

  // Handler for playing all songs
  const handlePlayAll = () => {
    if (songs && songs.length > 0) {
      playSong(songs[0]);
      toast({
        title: "Now Playing",
        description: `${songs[0].title} by ${songs[0].artist}`,
      });
    }
  };

  // Handler for following/unfollowing the artist
  const handleFollowToggle = () => {
    toast({
      title: "Following Artist",
      description: `You're now following ${artist?.name}`,
    });
  };

  // Handler for sharing artist profile
  const handleShare = () => {
    // In a real app, this would use the Web Share API or similar
    toast({
      title: "Share Link",
      description: "Artist profile link copied to clipboard",
    });
  };

  return (
    <div className="min-h-screen pb-32">
      <Header />
      
      {isLoadingArtist ? (
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
      ) : artist ? (
        <>
          <div className="pt-4 px-4">
            <Link href="/">
              <div className="flex items-center mb-4 cursor-pointer">
                <ChevronLeft className="h-6 w-6 mr-2" />
                <span className="text-lg font-medium">Artist</span>
              </div>
            </Link>
            
            <div className="relative h-64 rounded-xl overflow-hidden mb-4">
              {artist.profilePicture ? (
                <img
                  src={artist.profilePicture}
                  alt={artist.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-[#282828] flex items-center justify-center">
                  <Music2 className="h-16 w-16 text-[#B3B3B3]" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
              <div className="absolute bottom-4 left-4 right-4">
                {artist.verified && (
                  <Badge variant="status" className="bg-[#c1ff72] text-black text-xs mb-2">
                    Verified Artist
                  </Badge>
                )}
                <h1 className="text-3xl font-bold">{artist.name}</h1>
                <p className="text-sm text-[#B3B3B3]">
                  {artist.genres && artist.genres.length > 0
                    ? artist.genres.join(" • ")
                    : "Artist"}
                </p>
              </div>
            </div>
            
            <div className="flex items-center mb-6 space-x-4">
              <button 
                className="flex-1 bg-[#E51D3E] text-white py-2 px-4 rounded-full text-sm font-medium flex items-center justify-center"
                onClick={handlePlayAll}
              >
                <PlayCircle className="h-4 w-4 mr-2" />
                Play Popular Tracks
              </button>
              <button 
                className="w-10 h-10 rounded-full bg-[#282828] flex items-center justify-center"
                onClick={handleFollowToggle}
              >
                <ArrowUpCircle className="h-5 w-5 text-white" />
              </button>
              <button 
                className="w-10 h-10 rounded-full bg-[#282828] flex items-center justify-center"
                onClick={handleShare}
              >
                <Share2 className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>
          
          {artist.story && (
            <div className="px-4 mb-6">
              <h2 className="text-lg font-semibold mb-2">About</h2>
              <p className="text-sm text-[#B3B3B3]">{artist.story}</p>
            </div>
          )}
          
          <Tabs defaultValue="tracks" className="px-4">
            <TabsList className="w-full bg-[#181818] border border-[#3E3E3E]">
              <TabsTrigger value="tracks" className="flex-1">
                <Music2 className="h-4 w-4 mr-2" />
                Tracks
              </TabsTrigger>
              <TabsTrigger value="releases" className="flex-1">
                <ListMusic className="h-4 w-4 mr-2" />
                Releases
              </TabsTrigger>
              <TabsTrigger value="events" className="flex-1">
                <Calendar className="h-4 w-4 mr-2" />
                Events
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="tracks" className="mt-4 space-y-2">
              {isLoadingSongs ? (
                <>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-14 w-full" />
                  ))}
                </>
              ) : songs && songs.length > 0 ? (
                songs.map((song, index) => (
                  <div 
                    key={song.id} 
                    className="bg-[#181818] hover:bg-[#282828] rounded-md p-3 flex items-center cursor-pointer transition"
                    onClick={() => playSong(song)}
                  >
                    <div className="w-6 h-6 flex items-center justify-center mr-3 text-[#B3B3B3]">
                      {index + 1}
                    </div>
                    <div className="w-8 h-8 bg-[#282828] rounded overflow-hidden mr-3">
                      {song.albumArt ? (
                        <img src={song.albumArt} alt={song.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-[#3E3E3E] flex items-center justify-center">
                          <Music2 className="h-4 w-4 text-[#B3B3B3]" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm line-clamp-1">{song.title}</p>
                      <p className="text-xs text-[#B3B3B3] line-clamp-1">
                        {song.features && song.features.length > 0
                          ? `feat. ${song.features.join(", ")}`
                          : song.genre || "Single"}
                      </p>
                    </div>
                    <PlayIcon className="h-5 w-5 text-[#B3B3B3] hover:text-white" />
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Music2 className="h-12 w-12 text-[#B3B3B3] mx-auto mb-3" />
                  <p className="text-[#B3B3B3]">No tracks available</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="releases" className="mt-4">
              <div className="text-center py-8">
                <ListMusic className="h-12 w-12 text-[#B3B3B3] mx-auto mb-3" />
                <p className="text-[#B3B3B3]">No albums or EPs available</p>
              </div>
            </TabsContent>
            
            <TabsContent value="events" className="mt-4">
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-[#B3B3B3] mx-auto mb-3" />
                <p className="text-[#B3B3B3]">No upcoming events</p>
              </div>
            </TabsContent>
          </Tabs>
          
          {artist.streamingLinks && artist.streamingLinks.length > 0 && (
            <div className="px-4 mt-6">
              <h2 className="text-lg font-semibold mb-2">Listen On</h2>
              <div className="flex space-x-3">
                {artist.streamingLinks.map((link, index) => (
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
        </>
      ) : (
        <div className="pt-4 px-4 text-center">
          <Link href="/">
            <div className="flex items-center mb-4 cursor-pointer">
              <ChevronLeft className="h-6 w-6 mr-2" />
              <span className="text-lg font-medium">Back</span>
            </div>
          </Link>
          <p className="text-[#B3B3B3]">Artist not found</p>
        </div>
      )}
      
      <MusicPlayer />
      <BottomNav />
    </div>
  );
}
