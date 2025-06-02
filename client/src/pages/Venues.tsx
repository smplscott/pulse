import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/Header";
import TabNavigator from "@/components/layout/TabNavigator";
import BottomNav from "@/components/layout/BottomNav";
import MusicPlayer from "@/components/layout/MusicPlayer";
import VenueCard from "@/components/cards/VenueCard";
import { Venue } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { SearchIcon, MapPin, Star, Music, SlidersHorizontal, List, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function Venues() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeOption, setActiveOption] = useState("search");
  const [displayMode, setDisplayMode] = useState<"grid" | "list">("list");
  const [venueCategory, setVenueCategory] = useState("all");
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
        "Trap": ["Drill", "Trap Soul", "Latin Trap", "UK Drill"]
      }
    },
    "Rock": {
      subGenres: ["Alternative", "Metal", "Indie", "Punk", "Classic Rock"],
      similarGenres: {
        "Alternative": ["Grunge", "Post-Rock", "Shoegaze", "Math Rock"],
        "Metal": ["Heavy Metal", "Thrash Metal", "Death Metal", "Black Metal"],
        "Indie": ["Indie Pop", "Indie Folk", "Dream Pop", "Post-Punk Revival"],
        "Punk": ["Hardcore", "Pop Punk", "Post-Punk", "Emo"],
        "Classic Rock": ["Progressive Rock", "Blues Rock", "Psychedelic Rock", "Hard Rock"]
      }
    },
    "Pop": {
      subGenres: ["Mainstream Pop", "Synth Pop", "Art Pop", "K-Pop", "Indie Pop"],
      similarGenres: {
        "Mainstream Pop": ["Dance Pop", "Electropop", "Teen Pop", "Bubblegum Pop"],
        "Synth Pop": ["New Wave", "Synthwave", "Future Pop", "Electro Pop"],
        "Art Pop": ["Chamber Pop", "Baroque Pop", "Avant-Pop", "Experimental Pop"],
        "K-Pop": ["J-Pop", "Mandopop", "C-Pop", "T-Pop"],
        "Indie Pop": ["Bedroom Pop", "Dream Pop", "Twee Pop", "Synthpop"]
      }
    },
    "Jazz & Blues": {
      subGenres: ["Jazz", "Blues", "Fusion", "Big Band", "Swing"],
      similarGenres: {
        "Jazz": ["Bebop", "Cool Jazz", "Modal Jazz", "Free Jazz"],
        "Blues": ["Delta Blues", "Chicago Blues", "Jump Blues", "Electric Blues"],
        "Fusion": ["Jazz Fusion", "Soul Jazz", "Jazz-Funk", "Nu Jazz"],
        "Big Band": ["Orchestral Jazz", "Swing", "Dixieland", "Hot Jazz"],
        "Swing": ["Gypsy Jazz", "Western Swing", "Jump Blues", "Boogie-Woogie"]
      }
    },
    "World": {
      subGenres: ["Latin", "African", "Asian", "Middle Eastern", "Celtic"],
      similarGenres: {
        "Latin": ["Salsa", "Reggaeton", "Cumbia", "Bachata"],
        "African": ["Afrobeat", "Highlife", "Soukous", "Amapiano"],
        "Asian": ["Bollywood", "K-Pop", "J-Pop", "Traditional Asian"],
        "Middle Eastern": ["Arabic Pop", "Turkish Pop", "Persian Traditional", "Raï"],
        "Celtic": ["Irish Folk", "Scottish Folk", "Breton Music", "Welsh Folk"]
      }
    }
  };
  
  // Flat list of all main genres
  const mainGenres = Object.keys(genreHierarchy);
  
  const tabs = [
    { label: "For You", path: "/" },
    { label: "Discover", path: "/discover" },
    { label: "What's That Song", path: "/whats-this-song" },
    { label: "Live Venues", path: "/venues" },
  ];
  
  // Options for the Places page
  const placeOptions = [
    { id: "search", label: "Search", icon: <SearchIcon className="h-4 w-4 mr-2" /> },
    { id: "maps", label: "Maps", icon: <MapPin className="h-4 w-4 mr-2" /> },
    { id: "review", label: "Review a Live Performance", icon: <Star className="h-4 w-4 mr-2" /> },
  ];
  
  // Venue type categories
  const venueCategories = [
    { id: "all", label: "All" },
    { id: "bars", label: "Bars" },
    { id: "live", label: "Live Performances" },
    { id: "records", label: "Record Stores" },
    { id: "coffee", label: "Coffee Shops" },
    { id: "listening", label: "Listening Parties" },
    { id: "popups", label: "Pop-Ups" },
    { id: "restaurants", label: "Restaurants" },
  ];
  
  // Toggle display mode between grid and list
  const toggleDisplayMode = () => {
    setDisplayMode(prev => prev === "grid" ? "list" : "grid");
  };

  const { data: venues, isLoading } = useQuery<Venue[]>({
    queryKey: ["/api/venues"],
  });

  // Filter venues based on search query and selected category
  const filteredVenues = venues?.filter(
    (venue) => {
      // Match based on search query
      const matchesSearch = searchQuery === "" ||
        venue.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        venue.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (venue.description && venue.description.toLowerCase().includes(searchQuery.toLowerCase()));
      
      // For now we're just returning all venues regardless of category
      // In a real implementation, we would filter based on venueCategory
      // This is just a UI demonstration
      
      return matchesSearch;
    }
  );

  return (
    <div className="min-h-screen pb-32">
      <Header />
      {/* Removed TabNavigator as requested */}
      
      <main className="px-4 py-4">
        
        {/* Options for Places page */}
        <div className="mb-4 flex space-x-2 overflow-x-auto scrollbar-hide">
          {placeOptions.map((option) => (
            <button
              key={option.id}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap flex items-center",
                activeOption === option.id
                  ? "bg-[#282828] text-white"
                  : "bg-[#181818] border border-[#3E3E3E] text-[#B3B3B3]"
              )}
              onClick={() => setActiveOption(option.id)}
            >
              {option.icon}
              {option.label}
            </button>
          ))}
        </div>
        
        {activeOption === "search" && (
          <>
            <div className="relative mb-4 flex items-center">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#B3B3B3]" size={18} />
                <Input
                  type="text"
                  placeholder="Search venues, locations, genres..."
                  className="pl-9 pr-20 bg-[#282828] border-[#3E3E3E] text-white placeholder:text-[#B3B3B3]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {/* Dynamic Genre Filter */}
                <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
                  <Select value={selectedMainGenre || ""} onValueChange={(value) => {
                    setSelectedMainGenre(value || null);
                    setSelectedSubGenre(null);
                    setSelectedGenres([]);
                  }}>
                    <SelectTrigger className="w-8 h-8 border-0 bg-transparent p-0 focus:ring-0">
                      <Filter size={18} className="text-[#B3B3B3] hover:text-white" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#282828] border-[#3E3E3E]">
                      <SelectItem value="all">All Genres</SelectItem>
                      {mainGenres.map((genre) => (
                        <SelectItem key={genre} value={genre}>{genre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <button 
                className="ml-2 w-10 h-10 rounded-lg pink-gradient flex items-center justify-center pink-gradient-hover"
                onClick={() => toast({ title: "Add Place", description: "Add a new place with great music coming soon!" })}
              >
                <span className="text-white text-xl font-bold">+</span>
              </button>
            </div>
            
            {/* Venue category filter buttons (artist sub-filter style) */}
            <div className="mb-4 overflow-x-auto scrollbar-hide">
              <div className="flex space-x-2 pb-2">
                {venueCategories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setVenueCategory(category.id)}
                    className={cn(
                      "px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap",
                      venueCategory === category.id
                        ? "pink-gradient text-white"
                        : "bg-[#181818] text-[#B3B3B3]"
                    )}
                  >
                    {category.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
        
        {activeOption === "maps" && (
          <div className="mb-6 bg-[#181818] rounded-lg p-4">
            <div className="relative mb-4 flex items-center">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#B3B3B3]" size={18} />
                <Input
                  type="text"
                  placeholder="Enter a location..."
                  className="pl-9 bg-[#282828] border-[#3E3E3E] text-white placeholder:text-[#B3B3B3]"
                />
              </div>
            </div>
            <div className="aspect-w-16 aspect-h-9 bg-[#282828] rounded-md flex items-center justify-center h-64">
              <p className="text-[#B3B3B3]">Map view coming soon</p>
            </div>
          </div>
        )}
        
        {activeOption === "review" && (
          <div className="mb-6 bg-[#181818] rounded-lg p-4 space-y-4">
            <h3 className="font-semibold">Review a Live Performance</h3>
            <Input
              type="text" 
              placeholder="Venue name"
              className="bg-[#282828] border-[#3E3E3E] text-white placeholder:text-[#B3B3B3]"
            />
            <Input
              type="text" 
              placeholder="Artist/DJ name"
              className="bg-[#282828] border-[#3E3E3E] text-white placeholder:text-[#B3B3B3]"
            />
            <Input
              type="date"
              className="bg-[#282828] border-[#3E3E3E] text-white placeholder:text-[#B3B3B3]"
            />
            <textarea 
              placeholder="Share your experience..."
              className="w-full bg-[#282828] border border-[#3E3E3E] text-white placeholder:text-[#B3B3B3] rounded-md p-3 min-h-[100px]"
            />
            <div className="flex justify-end">
              <button 
                className="pink-gradient pink-gradient-hover text-white px-4 py-2 rounded-full text-sm font-medium"
                onClick={() => toast({ title: "Coming Soon", description: "Review submission will be available soon!" })}
              >
                Submit Review
              </button>
            </div>
          </div>
        )}
        
        {activeOption === "search" && (
          <div>
            {isLoading ? (
              <div className="grid gap-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-64 w-full" />
                ))}
              </div>
            ) : filteredVenues && filteredVenues.length > 0 ? (
              <div className="grid gap-4">
                {filteredVenues.map((venue) => (
                  <VenueCard key={venue.id} venue={venue} />
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-[#B3B3B3]">
                  {searchQuery ? "No venues found matching your search" : "No venues available"}
                </p>
              </div>
            )}
          </div>
        )}
      </main>
      
      <MusicPlayer />
      <BottomNav />
    </div>
  );
}