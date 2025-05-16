import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import MusicPlayer from "@/components/layout/MusicPlayer";
import { Input } from "@/components/ui/input";
import { Artist } from "@shared/schema";
import ArtistCard from "@/components/cards/ArtistCard";
import { SearchIcon, User, MusicIcon, PenIcon, SettingsIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type CategoryTab = {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
};

export default function Artists() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("artists");

  const { data: artists, isLoading: isLoadingArtists } = useQuery<Artist[]>({
    queryKey: ["/api/artists"],
  });

  // Filter artists based on search query
  const filteredArtists = artists?.filter(artist => 
    artist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (artist.genres && Array.isArray(artist.genres) && artist.genres.some((genre: string) => 
      genre.toLowerCase().includes(searchQuery.toLowerCase())
    ))
  );

  const categoryTabs: CategoryTab[] = [
    {
      id: "artists",
      label: "Artists",
      icon: <User className="h-4 w-4 mr-2" />,
      description: "Singers, rappers, bands, or the face of the music. The public-facing creative."
    },
    {
      id: "producers",
      label: "Producers",
      icon: <MusicIcon className="h-4 w-4 mr-2" />,
      description: "Create the beat, sonic landscape, often shaping the feel of the track."
    },
    {
      id: "writers",
      label: "Writers",
      icon: <PenIcon className="h-4 w-4 mr-2" />,
      description: "Lyricists or composers behind the words and melodies (can overlap with artists)."
    },
    {
      id: "engineers",
      label: "Engineers",
      icon: <SettingsIcon className="h-4 w-4 mr-2" />,
      description: "Mix/mastering folks, less public but core to the final sound."
    }
  ];

  const renderCategoryContent = () => {
    if (activeCategory === "artists") {
      if (isLoadingArtists) {
        return (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-56 w-full" />
            ))}
          </div>
        );
      } else if (filteredArtists && filteredArtists.length > 0) {
        return (
          <div className="grid grid-cols-2 gap-3">
            {filteredArtists.map((artist) => (
              <ArtistCard key={artist.id} artist={artist} />
            ))}
          </div>
        );
      } else {
        return (
          <div className="text-center py-10">
            <p className="text-[#B3B3B3]">
              {searchQuery ? "No artists found matching your search" : "No artists available"}
            </p>
          </div>
        );
      }
    } else {
      // Content for other categories (coming soon for now)
      const tab = categoryTabs.find(tab => tab.id === activeCategory);
      return (
        <div className="text-center py-10">
          <p className="text-[#B3B3B3]">
            Coming soon! We're working on adding {activeCategory} to our platform.
          </p>
          <p className="text-sm text-[#B3B3B3] mt-2">
            {tab?.description}
          </p>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen pb-32">
      <Header />
      
      {/* Category tabs using the horizontal button style */}
      <div className="px-4 py-2 bg-[#121212]">
        <div className="flex space-x-2 overflow-x-auto scrollbar-hide">
          {categoryTabs.map((tab) => {
            const isActive = activeCategory === tab.id;
            return (
              <button
                key={tab.id}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap flex items-center",
                  isActive
                    ? "bg-[#282828] text-white"
                    : "bg-[#181818] border border-[#3E3E3E] text-[#B3B3B3]"
                )}
                onClick={() => setActiveCategory(tab.id)}
              >
                {tab.icon}
                {tab.label}
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
            placeholder="Search music professionals..."
            className="pl-9 bg-[#282828] border-[#3E3E3E] text-white placeholder:text-[#B3B3B3]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        {/* Dynamic content based on selected category */}
        {renderCategoryContent()}
      </main>
      
      <MusicPlayer />
      <BottomNav />
    </div>
  );
}