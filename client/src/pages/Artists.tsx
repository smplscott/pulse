import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "wouter";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import { Input } from "@/components/ui/input";
import { Artist, Song } from "@shared/schema";
import ArtistCard from "@/components/cards/ArtistCard";
import { SearchIcon, User, MusicIcon, PenIcon, SettingsIcon, Heart, MessageCircle, SlidersHorizontal, List, Plus, Smile, Filter } from "lucide-react";
import SearchWithFilter from "@/components/ui/search-with-filter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

type CategoryTab = {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
};

export default function Artists() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("artists");
  const [displayMode, setDisplayMode] = useState<"grid" | "list">("list");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedMainGenre, setSelectedMainGenre] = useState<string | null>(null);
  const [selectedSubGenre, setSelectedSubGenre] = useState<string | null>(null);
  const { toast } = useToast();

  // Genre hierarchy from Discover page
  const genreHierarchy: { [key: string]: { subGenres: string[]; similarGenres: { [key: string]: string[] } } } = {
    "Electronic": {
      subGenres: ["House", "Techno", "Trance", "Drum & Bass", "Ambient"],
      similarGenres: {
        "House": ["Deep House", "Tech House", "Progressive House", "Tropical House"],
        "Techno": ["Minimal Techno", "Industrial Techno", "Acid Techno", "Detroit Techno"],
        "Trance": ["Progressive Trance", "Uplifting Trance", "Psytrance", "Vocal Trance"],
        "Ambient": ["Chillout", "Downtempo", "IDM", "Ambient Dub"],
        "Drum & Bass": ["Jungle", "Liquid Funk", "Neurofunk", "Jump Up"]
      }
    },
    "Urban": {
      subGenres: ["Hip Hop", "R&B", "Soul", "Funk", "Trap"],
      similarGenres: {
        "Hip Hop": ["Rap", "Boom Bap", "Conscious Hip Hop", "Alternative Hip Hop"],
        "R&B": ["Contemporary R&B", "Neo Soul", "Quiet Storm", "New Jack Swing"],
        "Soul": ["Southern Soul", "Deep Soul", "Northern Soul", "Psychedelic Soul"],
        "Funk": ["P-Funk", "Funk Rock", "Electro-Funk", "G-Funk"],
        "Trap": ["Drill", "Future Bass", "Melodic Trap", "Dark Trap"]
      }
    },
    "Rock": {
      subGenres: ["Alternative", "Indie", "Post-Rock", "Shoegaze", "Grunge"],
      similarGenres: {
        "Alternative": ["Alt Rock", "College Rock", "Britpop", "Grunge"],
        "Indie": ["Indie Pop", "Indie Folk", "Math Rock", "Art Rock"],
        "Post-Rock": ["Post-Metal", "Ambient Rock", "Instrumental Rock", "Drone"],
        "Shoegaze": ["Dream Pop", "Noise Pop", "Space Rock", "Ethereal Wave"],
        "Grunge": ["Seattle Sound", "Alternative Metal", "Post-Grunge", "Garage Rock"]
      }
    }
  };

  const { data: artists, isLoading: isLoadingArtists } = useQuery<Artist[]>({
    queryKey: ["/api/artists"],
  });

  const { data: songs } = useQuery<Song[]>({
    queryKey: ["/api/songs"],
  });

  // Filter artists based on search query and genre selection
  const filteredArtists = artists?.filter((artist) => {
    const matchesSearch = searchQuery === "" || 
      artist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (artist.realName && artist.realName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (artist.bio && artist.bio.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesGenre = selectedGenres.length === 0 || 
      selectedGenres.some(genre => 
        artist.bio?.toLowerCase().includes(genre.toLowerCase()) ||
        artist.name.toLowerCase().includes(genre.toLowerCase())
      );
    
    return matchesSearch && matchesGenre;
  });

  const handleLike = (artistId: number, artistName: string) => {
    toast({
      title: "Liked!",
      description: `You liked ${artistName}`
    });
  };

  // Filter for Talk Music CTA
  const handleTalkMusic = (artistId: number, artistName: string) => {
    // Navigate directly to the thread page
    window.location.href = `/thread/artist_${artistId}`;
  };

  const handleFiltersChange = (filters: {
    selectedMainGenre: string | null;
    selectedSubGenre: string | null;
    selectedSimilarGenres: string[];
  }) => {
    setSelectedMainGenre(filters.selectedMainGenre);
    setSelectedSubGenre(filters.selectedSubGenre);
    setSelectedGenres(filters.selectedSimilarGenres);
  };

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
          displayMode === "grid" ? (
            // Grid view
            <div className="grid grid-cols-2 gap-3">
              {filteredArtists.map((artist) => (
                <ArtistCard key={artist.id} artist={artist} />
              ))}
            </div>
          ) : (
            // List view with reaction and comment CTAs
            <div className="space-y-2">
              {filteredArtists.map((artist) => (
                <Link key={artist.id} href={`/thread/artist_${artist.id}`}>
                  <div className="flex items-center p-3 bg-[#181818] rounded-lg hover:bg-[#282828] transition-colors">
                    <img
                      src={artist.image || "/placeholder-artist.jpg"}
                      alt={artist.name}
                      className="w-12 h-12 rounded-full object-cover mr-3"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-white">{artist.name}</h3>
                      <p className="text-sm text-[#B3B3B3]">1 Tracks</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleLike(artist.id, artist.name);
                        }}
                      >
                        <Heart className="h-4 w-4 text-[#B3B3B3] hover:text-pink-500" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          window.location.href = `/thread/artist_${artist.id}`;
                        }}
                      >
                        <MessageCircle className="h-4 w-4 text-[#B3B3B3] hover:text-white" />
                      </button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )
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
      
      {/* Artist category tabs using the horizontal button style */}
      <div className="px-4 pt-4 pb-2 bg-[#121212]">
        <div className="flex space-x-2 overflow-x-auto scrollbar-hide">
          {categoryTabs.map((category) => {
            const isActive = activeCategory === category.id;
            return (
              <button
                key={category.id}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap flex items-center",
                  isActive
                    ? "bg-[#282828] text-white"
                    : "bg-[#181818] border border-[#3E3E3E] text-[#B3B3B3]"
                )}
                onClick={() => setActiveCategory(category.id)}
              >
                {category.icon}
                {category.label}
              </button>
            );
          })}
        </div>
      </div>
      
      <main className="px-4 pt-2 pb-4">
        <div className="mb-4 flex items-center">
          <SearchWithFilter
            placeholder="Search artists, genres, labels..."
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onFiltersChange={handleFiltersChange}
            genreHierarchy={genreHierarchy}
          />
          <button 
            className="ml-2 w-10 h-10 rounded-lg pink-gradient flex items-center justify-center pink-gradient-hover"
            onClick={() => toast({ title: "Create Content", description: "Create new content coming soon!" })}
          >
            <span className="text-white text-xl font-bold">+</span>
          </button>
        </div>

        {renderCategoryContent()}
      </main>
      
      <BottomNav />
    </div>
  );
}