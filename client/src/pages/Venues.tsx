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
  
  // Toggle display mode between grid and list
  const toggleDisplayMode = () => {
    setDisplayMode(prev => prev === "grid" ? "list" : "grid");
  };

  const { data: venues, isLoading } = useQuery<Venue[]>({
    queryKey: ["/api/venues"],
  });

  // Filter venues based on search query
  const filteredVenues = venues?.filter(
    (venue) => 
      venue.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      venue.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (venue.description && venue.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (venue.genres && Array.isArray(venue.genres) && venue.genres.some((genre: string) => 
        genre.toLowerCase().includes(searchQuery.toLowerCase())
      ))
  );

  return (
    <div className="min-h-screen pb-32">
      <Header />
      <TabNavigator tabs={tabs} />
      
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
          <div className="relative mb-6 flex items-center">
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
        )}
        
        {activeOption === "maps" && (
          <div className="mb-6 bg-[#181818] rounded-lg p-4">
            <div className="relative mb-4 flex items-center">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#B3B3B3]" size={18} />
                <Input
                  type="text"
                  placeholder="Search for venues on map..."
                  className="pl-9 pr-12 bg-[#282828] border-[#3E3E3E] text-white placeholder:text-[#B3B3B3]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="w-full h-64 bg-[#282828] rounded-lg flex items-center justify-center">
              <div className="text-center">
                <MapPin className="h-10 w-10 text-[#B3B3B3] mx-auto mb-2" />
                <p className="text-[#B3B3B3] text-sm">Map integration coming soon</p>
                <p className="text-[#B3B3B3] text-xs mt-1">Find venues near you or search by location</p>
              </div>
            </div>
          </div>
        )}
        
        {activeOption === "review" && (
          <div className="mb-6 bg-[#181818] rounded-lg p-4">
            <h2 className="text-lg font-medium mb-4">Review a Live Performance</h2>
            <p className="text-[#B3B3B3] text-sm mb-4">Share your experience at a venue or live performance</p>
            <div className="space-y-4">
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
          </div>
        )}
        
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
      </main>
      
      <MusicPlayer />
      <BottomNav />
    </div>
  );
}
