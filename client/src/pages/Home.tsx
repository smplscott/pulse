import { useState } from "react";
import Header from "@/components/layout/Header";
import TabNavigator from "@/components/layout/TabNavigator";
import BottomNav from "@/components/layout/BottomNav";
import MusicPlayer from "@/components/layout/MusicPlayer";
import FeaturedArtists from "@/components/sections/FeaturedArtists";
import WhatsThisSong from "@/components/sections/WhatsThisSong";
import TrackIDs from "@/components/sections/TrackIDs";
import Threads from "@/components/sections/Threads";
import Venues from "@/components/sections/Venues";
import { Input } from "@/components/ui/input";
import { SearchIcon, SlidersHorizontal, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeDiscussionFilter, setActiveDiscussionFilter] = useState("artists");
  const { toast } = useToast();
  
  const tabs = [
    { label: "For You", path: "/" },
    { label: "Discover", path: "/discover" },
    { label: "What's That Song", path: "/whats-this-song" },
    { label: "Live Venues", path: "/venues" },
  ];
  
  // Discussion filter options
  const discussionFilters = [
    { id: "artists", label: "Artists" },
    { id: "songs", label: "Songs" },
    { id: "playlists", label: "Playlists" },
    { id: "new", label: "New Music" },
  ];

  return (
    <div className="min-h-screen pb-32">
      <Header />
      <TabNavigator tabs={tabs} />
      
      <main>
        {/* Search bar similar to other pages */}
        <div className="px-4 py-4">
          <div className="relative mb-6 flex items-center">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#B3B3B3]" size={18} />
              <Input
                type="text"
                placeholder="Search artists, songs, threads..."
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
          </div>
        </div>
        
        <FeaturedArtists />
        
        {/* Featured Discussions Section with filter buttons */}
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Featured Discussions</h2>
          </div>
          
          {/* Filter buttons */}
          <div className="mb-4 flex space-x-2 overflow-x-auto scrollbar-hide">
            {discussionFilters.map((filter) => (
              <button
                key={filter.id}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap",
                  activeDiscussionFilter === filter.id
                    ? "bg-[#E51D3E] text-white"
                    : "bg-[#181818] text-[#B3B3B3]"
                )}
                onClick={() => setActiveDiscussionFilter(filter.id)}
              >
                {filter.label}
              </button>
            ))}
          </div>
          
          <div className="bg-[#181818] rounded-lg p-4 mb-6">
            <p className="text-sm text-[#B3B3B3] mb-2">
              Join conversations about your favorite {activeDiscussionFilter}
            </p>
            <button
              className="text-sm text-white bg-[#282828] hover:bg-[#3E3E3E] rounded-md px-3 py-1"
              onClick={() => toast({ title: "Coming Soon", description: `${activeDiscussionFilter.charAt(0).toUpperCase() + activeDiscussionFilter.slice(1)} discussions will be available soon!` })}
            >
              See All
            </button>
          </div>
        </div>
        
        <WhatsThisSong />
        
        {/* Renamed from "Popular Track IDs" to "Talked About Songs in Genres You Love" */}
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Talked About Songs in Genres You Love</h2>
            <a href="/songs" className="text-sm text-[#B3B3B3] hover:text-white">See All</a>
          </div>
          
          <TrackIDs />
        </div>
        
        <Threads />
        <Venues />
      </main>
      
      <MusicPlayer />
      <BottomNav />
    </div>
  );
}
