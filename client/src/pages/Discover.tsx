import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import Header from "@/components/layout/Header";
import TabNavigator from "@/components/layout/TabNavigator";
import BottomNav from "@/components/layout/BottomNav";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Artist, Song, Playlist } from "@shared/schema";
import ArtistCard from "@/components/cards/ArtistCard";
import TrackIDCard from "@/components/cards/TrackIDCard";
import SongCard from "@/components/cards/SongCard";
import { SearchIcon, SlidersHorizontal, Filter } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

export default function Discover() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("artists");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const { toast } = useToast();

  const tabs = [
    { label: "For You", path: "/" },
    { label: "Discover", path: "/discover" },
    { label: "What's That Song", path: "/whats-this-song" },
    { label: "Live Venues", path: "/venues" },
  ];
  
  // List of music genres for filtering
  const genres = [
    "Techno", "House", "Deep House", "Ambient", "Trance", "EDM", 
    "Progressive House", "Tech House", "Minimal", "Acid", "Electronica", 
    "Dubstep", "Drum & Bass", "Breakbeat", "Jungle", "UK Garage",
    "Disco", "Funk", "Soul", "R&B", "Hip Hop", "Jazz", "Alternative",
    "Rock", "Metal", "Pop", "Indie", "Folk", "Classical"
  ];

  const { data: artists, isLoading: isLoadingArtists } = useQuery<Artist[]>({
    queryKey: ["/api/artists"],
  });

  const { data: playlists, isLoading: isLoadingPlaylists } = useQuery<Playlist[]>({
    queryKey: ["/api/playlists"],
  });

  // Add songs query
  const { data: songs, isLoading: isLoadingSongs } = useQuery<Song[]>({
    queryKey: ["/api/songs"],
  });
  
  // Helper function to filter by genres
  const filterByGenres = (item: any) => {
    if (!selectedGenres.length) return true;
    if (!item.genres) return false;
    return selectedGenres.some(genre => 
      item.genres.some((g: string) => g.toLowerCase() === genre.toLowerCase())
    );
  };
  
  // Toggle genre selection
  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev => 
      prev.includes(genre)
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  };

  // Filter artists based on search query and genres
  const filteredArtists = artists?.filter(
    (artist) => (
      (artist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      artist.genres?.some(genre => 
        genre.toLowerCase().includes(searchQuery.toLowerCase())
      )) && filterByGenres(artist)
    )
  );

  // Filter songs based on search query and genres
  const filteredSongs = songs?.filter(
    (song) => (
      (song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      song.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
      song.genres?.some(genre => 
        genre.toLowerCase().includes(searchQuery.toLowerCase())
      )) && filterByGenres(song)
    )
  );

  // Filter playlists based on search query
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
        <div className="flex items-center mb-6">
          <div className="flex-1 relative flex">
            <div className="flex-1 relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#B3B3B3]" size={18} />
              <Input
                type="text"
                placeholder="Search artists, songs, genres..."
                className="pl-9 pr-12 bg-[#282828] border-[#3E3E3E] text-white placeholder:text-[#B3B3B3]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button 
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#B3B3B3] hover:text-white"
                  >
                    <Filter size={18} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-[#282828] border-[#3E3E3E] p-2">
                  <div className="mb-2 px-2">
                    <p className="text-white text-sm font-medium">Filter by genre</p>
                  </div>
                  <div className="max-h-48 overflow-y-auto scrollbar-hide">
                    {genres.map((genre) => (
                      <DropdownMenuItem 
                        key={genre} 
                        className="flex items-center justify-between px-2 py-1 cursor-pointer hover:bg-[#3E3E3E] rounded"
                        onClick={() => toggleGenre(genre)}
                      >
                        <span className="text-[#B3B3B3]">{genre}</span>
                        {selectedGenres.includes(genre) && (
                          <span className="ml-2 h-2 w-2 rounded-full green-gradient"></span>
                        )}
                      </DropdownMenuItem>
                    ))}
                  </div>
                  {selectedGenres.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-[#3E3E3E] px-2">
                      <button 
                        className="text-xs text-[#B3B3B3] hover:text-white"
                        onClick={() => setSelectedGenres([])}
                      >
                        Clear filters
                      </button>
                    </div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <button 
            className="ml-2 w-10 h-10 rounded-lg pink-gradient flex items-center justify-center pink-gradient-hover"
            onClick={() => toast({ title: "Create Content", description: "Create new content feature coming soon!" })}
          >
            <span className="text-white text-xl font-bold">+</span>
          </button>
        </div>
        
        {selectedGenres.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {selectedGenres.map(genre => (
              <Badge 
                key={genre} 
                className="green-gradient flex items-center gap-1 px-2 py-1"
                onClick={() => toggleGenre(genre)}
              >
                {genre}
                <span className="cursor-pointer">×</span>
              </Badge>
            ))}
          </div>
        )}
        
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
      
      <BottomNav />
    </div>
  );
}
