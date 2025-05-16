import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import MusicPlayer from "@/components/layout/MusicPlayer";
import { Input } from "@/components/ui/input";
import { Song, Playlist } from "@shared/schema";
import { SearchIcon, Music2, ListMusic } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type SongCategoryTab = {
  id: string;
  label: string;
};

export default function Songs() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("your-list");

  const { data: songs, isLoading: isLoadingSongs } = useQuery<Song[]>({
    queryKey: ["/api/songs"],
  });

  const { data: playlists, isLoading: isLoadingPlaylists } = useQuery<Playlist[]>({
    queryKey: ["/api/playlists"],
  });

  // Filter songs based on search query
  const filteredSongs = songs?.filter(song => 
    song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    song.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (song.features && Array.isArray(song.features) && song.features.some((feature: string) => 
      feature.toLowerCase().includes(searchQuery.toLowerCase())
    )) ||
    (song.genre && song.genre.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const songCategories: SongCategoryTab[] = [
    { id: "your-list", label: "Your List" },
    { id: "new-unknowns", label: "New Unknowns" },
    { id: "new-favorites", label: "New Favorites" },
    { id: "classics", label: "Classics" },
    { id: "youtube-sets", label: "From YouTube Sets" },
    { id: "live-sets", label: "From Live Sets" },
    { id: "talk-of-town", label: "Talk of the Town" },
    { id: "trending-social", label: "Trending on Social" }
  ];

  const renderSongsList = () => {
    if (isLoadingSongs) {
      return (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      );
    }
    
    if (!filteredSongs || filteredSongs.length === 0) {
      return (
        <div className="text-center py-10">
          <Music2 className="h-12 w-12 text-[#B3B3B3] mx-auto mb-3" />
          <p className="text-[#B3B3B3]">
            {searchQuery ? "No songs found matching your search" : "No songs available in this category"}
          </p>
        </div>
      );
    }

    // For now, show all songs in all categories
    // In a real implementation, we would filter based on the active category
    return (
      <div className="space-y-2">
        {filteredSongs.map((song) => (
          <div 
            key={song.id} 
            className="bg-[#181818] hover:bg-[#282828] rounded-md p-3 flex items-center cursor-pointer transition"
          >
            <div className="w-10 h-10 bg-[#282828] rounded overflow-hidden mr-3 flex-shrink-0">
              {song.albumArt ? (
                <img src={song.albumArt} alt={song.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-[#3E3E3E] flex items-center justify-center">
                  <Music2 className="h-5 w-5 text-[#B3B3B3]" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{song.title}</p>
              <p className="text-xs text-[#B3B3B3] truncate">
                {song.features && Array.isArray(song.features) && song.features.length > 0
                  ? `${song.artist}, ${song.features.join(", ")}`
                  : song.artist}
              </p>
            </div>
            <div className="text-xs text-[#B3B3B3] ml-2 flex-shrink-0">
              {/* Duration is shown if available, otherwise empty string */}
              {song.releaseDate ? new Date(song.releaseDate).getFullYear() : ""}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen pb-32">
      <Header />
      
      {/* Song category tabs using the horizontal button style */}
      <div className="px-4 py-2 bg-[#121212]">
        <div className="flex space-x-2 overflow-x-auto scrollbar-hide">
          {songCategories.map((category) => {
            const isActive = activeCategory === category.id;
            return (
              <button
                key={category.id}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap",
                  isActive
                    ? "bg-[#282828] text-white"
                    : "bg-[#181818] border border-[#3E3E3E] text-[#B3B3B3]"
                )}
                onClick={() => setActiveCategory(category.id)}
              >
                {category.label}
              </button>
            );
          })}
        </div>
      </div>
      
      <main className="px-4 py-4">
        <div className="relative mb-6">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#B3B3B3]" size={18} />
          <Input
            type="text"
            placeholder="Search songs, artists, genres..."
            className="pl-9 bg-[#282828] border-[#3E3E3E] text-white placeholder:text-[#B3B3B3]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        {/* Song list based on selected category */}
        {renderSongsList()}
      </main>
      
      <MusicPlayer />
      <BottomNav />
    </div>
  );
}