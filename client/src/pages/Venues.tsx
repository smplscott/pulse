import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/Header";
import TabNavigator from "@/components/layout/TabNavigator";
import BottomNav from "@/components/layout/BottomNav";
import MusicPlayer from "@/components/layout/MusicPlayer";
import VenueCard from "@/components/cards/VenueCard";
import { Venue } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { SearchIcon, MapPin, Star, Music, SlidersHorizontal, List } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function Venues() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeOption, setActiveOption] = useState("search");
  const [displayMode, setDisplayMode] = useState<"grid" | "list">("list");
  const [venueCategory, setVenueCategory] = useState("all");
  const { toast } = useToast();
  
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
        <h1 className="text-2xl font-bold mb-4">Places to Listen</h1>
        
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
                  className="pl-9 pr-12 bg-[#282828] border-[#3E3E3E] text-white placeholder:text-[#B3B3B3]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button 
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#B3B3B3] hover:text-white"
                  onClick={() => toast({ title: "Filters", description: "Advanced filters coming soon" })}
                >
                  <SlidersHorizontal size={18} />
                </button>
              </div>
              <button 
                className="ml-2 w-10 h-10 rounded-full bg-[#282828] border border-[#3E3E3E] flex items-center justify-center hover:bg-[#3E3E3E]"
                onClick={toggleDisplayMode}
              >
                {displayMode === "grid" ? 
                  <List size={18} className="text-[#B3B3B3]" /> : 
                  <div className="grid grid-cols-2 gap-1">
                    <div className="w-2 h-2 bg-[#B3B3B3] rounded-sm"></div>
                    <div className="w-2 h-2 bg-[#B3B3B3] rounded-sm"></div>
                    <div className="w-2 h-2 bg-[#B3B3B3] rounded-sm"></div>
                    <div className="w-2 h-2 bg-[#B3B3B3] rounded-sm"></div>
                  </div>
                }
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
                        ? "bg-[#E51D3E] text-white"
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
                className="bg-[#E51D3E] hover:bg-[#c01733] text-white px-4 py-2 rounded-full text-sm font-medium"
                onClick={() => toast({ title: "Coming Soon", description: "Review submission will be available soon!" })}
              >
                Submit Review
              </button>
            </div>
          </div>
        )}
        
        {activeOption === "search" && (
          <div className="space-y-6">
            {isLoading ? (
              <>
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-64 w-full" />
                ))}
              </>
            ) : filteredVenues && filteredVenues.length > 0 ? (
              filteredVenues.map((venue) => (
                <VenueCard key={venue.id} venue={venue} />
              ))
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