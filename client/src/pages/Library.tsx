import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/Header";
import TabNavigator from "@/components/layout/TabNavigator";
import BottomNav from "@/components/layout/BottomNav";
import MusicPlayer from "@/components/layout/MusicPlayer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Playlist, Song } from "@shared/schema";
import { Link } from "wouter";
import { Clock, Music, CalendarDays, ListMusic, Smile } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import TrackIDCard from "@/components/cards/TrackIDCard";

export default function Library() {
  // Mock user ID - in a real app this would come from auth context
  const userId = 1;

  const tabs = [
    { label: "For You", path: "/" },
    { label: "Discover", path: "/discover" },
    { label: "What's That Song", path: "/whats-this-song" },
    { label: "Live Venues", path: "/venues" },
  ];

  const { data: playlists, isLoading: isLoadingPlaylists } = useQuery<Playlist[]>({
    queryKey: [`/api/users/${userId}/playlists`],
  });

  const { data: songs, isLoading: isLoadingSongs } = useQuery<Song[]>({
    queryKey: ["/api/songs"],
  });

  return (
    <div className="min-h-screen pb-32">
      <Header />
      <TabNavigator tabs={tabs} />
      
      <main className="px-4 py-4">
        <h1 className="text-2xl font-bold mb-4">Your Library</h1>
        
        <Tabs defaultValue="saved" className="mb-6">
          <TabsList className="w-full bg-[#181818] border border-[#3E3E3E]">
            <TabsTrigger value="saved" className="flex-1">Saved</TabsTrigger>
            <TabsTrigger value="playlists" className="flex-1">Playlists</TabsTrigger>
            <TabsTrigger value="history" className="flex-1">History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="saved" className="mt-4">
            {/* Library navigation grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <Link href="/library?section=liked">
                <div className="bg-[#181818] rounded-lg p-4 flex items-center space-x-3 cursor-pointer">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#450af5] to-[#c4efd9] flex items-center justify-center">
                    <Smile className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium">Liked Songs</p>
                    <p className="text-xs text-[#B3B3B3]">Your favorites</p>
                  </div>
                </div>
              </Link>
              
              <Link href="/library?section=recent">
                <div className="bg-[#181818] rounded-lg p-4 flex items-center space-x-3 cursor-pointer">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#5271ff] to-[#f88379] flex items-center justify-center">
                    <Clock className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium">Recently Played</p>
                    <p className="text-xs text-[#B3B3B3]">Your history</p>
                  </div>
                </div>
              </Link>
              
              <Link href="/library?section=followed">
                <div className="bg-[#181818] rounded-lg p-4 flex items-center space-x-3 cursor-pointer">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1DB954] to-[#b4ffbb] flex items-center justify-center">
                    <Music className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium">Followed Artists</p>
                    <p className="text-xs text-[#B3B3B3]">Your collection</p>
                  </div>
                </div>
              </Link>
              
              <Link href="/library?section=events">
                <div className="bg-[#181818] rounded-lg p-4 flex items-center space-x-3 cursor-pointer">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF8C00] to-[#ffdd9e] flex items-center justify-center">
                    <CalendarDays className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium">Saved Events</p>
                    <p className="text-xs text-[#B3B3B3]">Upcoming shows</p>
                  </div>
                </div>
              </Link>
            </div>
            
            <h2 className="font-semibold text-lg mb-4">Recently Added</h2>
            
            {isLoadingSongs ? (
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : songs && songs.length > 0 ? (
              <div className="space-y-2">
                {songs.slice(0, 5).map((song) => (
                  <Link key={song.id} href={`/song/${song.id}`}>
                    <div className="bg-[#181818] hover:bg-[#282828] rounded-md p-3 flex items-center cursor-pointer transition">
                      <div className="w-8 h-8 bg-[#282828] rounded overflow-hidden mr-3">
                        {song.albumArt && (
                          <img src={song.albumArt} alt={song.title} className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm line-clamp-1">{song.title}</p>
                        <p className="text-xs text-[#B3B3B3] line-clamp-1">{song.artist}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-[#181818] rounded-lg p-8 text-center">
                <ListMusic className="h-12 w-12 text-[#B3B3B3] mx-auto mb-3" />
                <p className="text-lg font-medium">No saved songs yet</p>
                <p className="text-sm text-[#B3B3B3] mt-2 mb-4">Discover and save songs to your library</p>
                <Link href="/discover">
                  <button className="bg-white text-black py-2 px-6 rounded-full font-medium text-sm">
                    Discover Music
                  </button>
                </Link>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="playlists" className="mt-4">
            {isLoadingPlaylists ? (
              <div className="grid grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-56 w-full" />
                ))}
              </div>
            ) : playlists && playlists.length > 0 ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-lg">Your Playlists</h2>
                  <button className="text-[#B3B3B3] hover:text-white text-sm font-medium">Create New</button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {playlists.map((playlist) => (
                    <TrackIDCard key={playlist.id} playlist={playlist} className="w-full" />
                  ))}
                </div>
              </>
            ) : (
              <div className="bg-[#181818] rounded-lg p-8 text-center">
                <ListMusic className="h-12 w-12 text-[#B3B3B3] mx-auto mb-3" />
                <p className="text-lg font-medium">No playlists yet</p>
                <p className="text-sm text-[#B3B3B3] mt-2 mb-4">Create your first playlist</p>
                <button className="bg-white text-black py-2 px-6 rounded-full font-medium text-sm">
                  Create Playlist
                </button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="history" className="mt-4">
            <div className="bg-[#181818] rounded-lg p-4">
              <h2 className="font-semibold text-lg mb-4">Recently Played</h2>
              
              {isLoadingSongs ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-14 w-full" />
                  ))}
                </div>
              ) : songs ? (
                <div className="space-y-2">
                  {songs.slice(0, 10).map((song) => (
                    <Link key={song.id} href={`/song/${song.id}`}>
                      <div className="bg-[#282828] hover:bg-[#3E3E3E] rounded-md p-3 flex items-center cursor-pointer transition">
                        <div className="w-8 h-8 bg-[#3E3E3E] rounded overflow-hidden mr-3">
                          {song.albumArt && (
                            <img src={song.albumArt} alt={song.title} className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm line-clamp-1">{song.title}</p>
                          <p className="text-xs text-[#B3B3B3] line-clamp-1">{song.artist}</p>
                        </div>
                        <p className="text-xs text-[#B3B3B3]">Today</p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-5">
                  <p className="text-[#B3B3B3]">No listening history available</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
      
      <MusicPlayer />
      <BottomNav />
    </div>
  );
}
