import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import Header from "@/components/layout/Header";
import TabNavigator from "@/components/layout/TabNavigator";
import BottomNav from "@/components/layout/BottomNav";
import MusicPlayer from "@/components/layout/MusicPlayer";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Artist, Song, Playlist } from "@shared/schema";
import ArtistCard from "@/components/cards/ArtistCard";
import TrackIDCard from "@/components/cards/TrackIDCard";
import { SearchIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Discover() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("artists");

  const tabs = [
    { label: "For You", path: "/" },
    { label: "Discover", path: "/discover" },
    { label: "What's That Song", path: "/whats-this-song" },
    { label: "Live Venues", path: "/venues" },
  ];

  const { data: artists, isLoading: isLoadingArtists } = useQuery<Artist[]>({
    queryKey: ["/api/artists"],
  });

  const { data: playlists, isLoading: isLoadingPlaylists } = useQuery<Playlist[]>({
    queryKey: ["/api/playlists"],
  });

  // Filter data based on search query
  const filteredArtists = artists?.filter(
    (artist) => 
      artist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      artist.genres?.some(genre => 
        genre.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  const filteredPlaylists = playlists?.filter(
    (playlist) => 
      playlist.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      playlist.curator.toLowerCase().includes(searchQuery.toLowerCase()) ||
      playlist.genres?.some(genre => 
        genre.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  return (
    <div className="min-h-screen pb-32">
      <Header />
      <TabNavigator tabs={tabs} />
      
      <main className="px-4 py-4">
        <div className="relative mb-6">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#B3B3B3]" size={18} />
          <Input
            type="text"
            placeholder="Search artists, playlists, genres..."
            className="pl-9 bg-[#282828] border-[#3E3E3E] text-white placeholder:text-[#B3B3B3]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <Tabs defaultValue="artists" className="mb-6" onValueChange={setActiveTab}>
          <TabsList className="w-full bg-[#181818] border border-[#3E3E3E]">
            <TabsTrigger value="artists" className="flex-1">Artists</TabsTrigger>
            <TabsTrigger value="playlists" className="flex-1">Track IDs</TabsTrigger>
          </TabsList>
          
          <TabsContent value="artists" className="mt-4">
            {isLoadingArtists ? (
              <div className="grid grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-56 w-full" />
                ))}
              </div>
            ) : filteredArtists && filteredArtists.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {filteredArtists.map((artist) => (
                  <ArtistCard key={artist.id} artist={artist} />
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-[#B3B3B3]">
                  {searchQuery ? "No artists found matching your search" : "No artists available"}
                </p>
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
            ) : filteredPlaylists && filteredPlaylists.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {filteredPlaylists.map((playlist) => (
                  <TrackIDCard key={playlist.id} playlist={playlist} className="w-full" />
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-[#B3B3B3]">
                  {searchQuery ? "No playlists found matching your search" : "No playlists available"}
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
      
      <MusicPlayer />
      <BottomNav />
    </div>
  );
}
