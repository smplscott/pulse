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
import { SearchIcon, SlidersHorizontal, MessageCircle, Trophy, Music, Heart } from "lucide-react";
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
          <div className="relative mb-4 flex items-center">
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
          
          {/* Talk Music CTA button */}
          <button 
            className="w-full bg-[#E51D3E] hover:bg-[#c01733] text-white py-3 rounded-md font-medium mb-6 flex items-center justify-center"
            onClick={() => {
              toast({
                title: "Let's Talk Music",
                description: "What do you want to talk about?"
              });
            }}
          >
            <Music className="mr-2 h-5 w-5" />
            Talk Music
          </button>
        </div>
        
        {/* Featured Discussions Section with filter buttons - Now at the top */}
        <div className="px-4 py-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Featured Discussions</h2>
            <a href="/discover" className="text-sm text-[#B3B3B3] hover:text-white">See All</a>
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
          
          {/* Sample discussions with trophy icons */}
          <div className="space-y-2 mb-6">
            {/* Sample discussion rows with trophies */}
            {activeDiscussionFilter === "artists" && (
              <>
                <div className="bg-[#181818] hover:bg-[#282828] rounded-md p-3 flex items-center cursor-pointer transition">
                  <div className="mr-3 text-[#FFD700]">
                    <Trophy size={16} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Most Innovative Electronic Artists of 2025</p>
                    <p className="text-xs text-[#B3B3B3]">243 comments • 4h ago</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="w-7 h-7 rounded-full bg-[#282828] flex items-center justify-center hover:bg-[#3E3E3E]">
                      <Heart size={14} className="text-[#B3B3B3]" />
                    </button>
                    <button className="w-7 h-7 rounded-full bg-[#282828] flex items-center justify-center hover:bg-[#3E3E3E]">
                      <MessageCircle size={14} className="text-[#B3B3B3]" />
                    </button>
                  </div>
                </div>
                
                <div className="bg-[#181818] hover:bg-[#282828] rounded-md p-3 flex items-center cursor-pointer transition">
                  <div className="mr-3 text-[#FFD700]">
                    <Trophy size={16} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Techno DJs That Define Berlin's Sound</p>
                    <p className="text-xs text-[#B3B3B3]">192 comments • 8h ago</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="w-7 h-7 rounded-full bg-[#282828] flex items-center justify-center hover:bg-[#3E3E3E]">
                      <Heart size={14} className="text-[#B3B3B3]" />
                    </button>
                    <button className="w-7 h-7 rounded-full bg-[#282828] flex items-center justify-center hover:bg-[#3E3E3E]">
                      <MessageCircle size={14} className="text-[#B3B3B3]" />
                    </button>
                  </div>
                </div>
                
                <div className="bg-[#181818] hover:bg-[#282828] rounded-md p-3 flex items-center cursor-pointer transition">
                  <div className="mr-3 text-[#FFD700]">
                    <Trophy size={16} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Artists Who Master Both Production & Vocals</p>
                    <p className="text-xs text-[#B3B3B3]">122 comments • 12h ago</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="w-7 h-7 rounded-full bg-[#282828] flex items-center justify-center hover:bg-[#3E3E3E]">
                      <Heart size={14} className="text-[#B3B3B3]" />
                    </button>
                    <button className="w-7 h-7 rounded-full bg-[#282828] flex items-center justify-center hover:bg-[#3E3E3E]">
                      <MessageCircle size={14} className="text-[#B3B3B3]" />
                    </button>
                  </div>
                </div>
              </>
            )}
            
            {activeDiscussionFilter === "songs" && (
              <>
                <div className="bg-[#181818] hover:bg-[#282828] rounded-md p-3 flex items-center cursor-pointer transition">
                  <div className="mr-3 text-[#FFD700]">
                    <Trophy size={16} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Tracks That Define The Berlin Underground</p>
                    <p className="text-xs text-[#B3B3B3]">318 comments • 2h ago</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="w-7 h-7 rounded-full bg-[#282828] flex items-center justify-center hover:bg-[#3E3E3E]">
                      <Heart size={14} className="text-[#B3B3B3]" />
                    </button>
                    <button className="w-7 h-7 rounded-full bg-[#282828] flex items-center justify-center hover:bg-[#3E3E3E]">
                      <MessageCircle size={14} className="text-[#B3B3B3]" />
                    </button>
                  </div>
                </div>
                
                <div className="bg-[#181818] hover:bg-[#282828] rounded-md p-3 flex items-center cursor-pointer transition">
                  <div className="mr-3 text-[#FFD700]">
                    <Trophy size={16} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Songs With The Most Innovative Sound Design</p>
                    <p className="text-xs text-[#B3B3B3]">205 comments • 6h ago</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="w-7 h-7 rounded-full bg-[#282828] flex items-center justify-center hover:bg-[#3E3E3E]">
                      <Heart size={14} className="text-[#B3B3B3]" />
                    </button>
                    <button className="w-7 h-7 rounded-full bg-[#282828] flex items-center justify-center hover:bg-[#3E3E3E]">
                      <MessageCircle size={14} className="text-[#B3B3B3]" />
                    </button>
                  </div>
                </div>
                
                <div className="bg-[#181818] hover:bg-[#282828] rounded-md p-3 flex items-center cursor-pointer transition">
                  <div className="mr-3 text-[#FFD700]">
                    <Trophy size={16} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Most Sampled Breaks In Electronic Music</p>
                    <p className="text-xs text-[#B3B3B3]">173 comments • 9h ago</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="w-7 h-7 rounded-full bg-[#282828] flex items-center justify-center hover:bg-[#3E3E3E]">
                      <Heart size={14} className="text-[#B3B3B3]" />
                    </button>
                    <button className="w-7 h-7 rounded-full bg-[#282828] flex items-center justify-center hover:bg-[#3E3E3E]">
                      <MessageCircle size={14} className="text-[#B3B3B3]" />
                    </button>
                  </div>
                </div>
              </>
            )}
            
            {activeDiscussionFilter === "playlists" && (
              <>
                <div className="bg-[#181818] hover:bg-[#282828] rounded-md p-3 flex items-center cursor-pointer transition">
                  <div className="mr-3 text-[#FFD700]">
                    <Trophy size={16} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Watergate Closing Sets That Made History</p>
                    <p className="text-xs text-[#B3B3B3]">198 comments • 5h ago</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="w-7 h-7 rounded-full bg-[#282828] flex items-center justify-center hover:bg-[#3E3E3E]">
                      <Heart size={14} className="text-[#B3B3B3]" />
                    </button>
                    <button className="w-7 h-7 rounded-full bg-[#282828] flex items-center justify-center hover:bg-[#3E3E3E]">
                      <MessageCircle size={14} className="text-[#B3B3B3]" />
                    </button>
                  </div>
                </div>
                
                <div className="bg-[#181818] hover:bg-[#282828] rounded-md p-3 flex items-center cursor-pointer transition">
                  <div className="mr-3 text-[#FFD700]">
                    <Trophy size={16} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Essential Berghain Sound Playlists</p>
                    <p className="text-xs text-[#B3B3B3]">241 comments • 7h ago</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="w-7 h-7 rounded-full bg-[#282828] flex items-center justify-center hover:bg-[#3E3E3E]">
                      <Heart size={14} className="text-[#B3B3B3]" />
                    </button>
                    <button className="w-7 h-7 rounded-full bg-[#282828] flex items-center justify-center hover:bg-[#3E3E3E]">
                      <MessageCircle size={14} className="text-[#B3B3B3]" />
                    </button>
                  </div>
                </div>
                
                <div className="bg-[#181818] hover:bg-[#282828] rounded-md p-3 flex items-center cursor-pointer transition">
                  <div className="mr-3 text-[#FFD700]">
                    <Trophy size={16} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Track IDs From Top Festival Sets of 2025</p>
                    <p className="text-xs text-[#B3B3B3]">152 comments • 11h ago</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="w-7 h-7 rounded-full bg-[#282828] flex items-center justify-center hover:bg-[#3E3E3E]">
                      <Heart size={14} className="text-[#B3B3B3]" />
                    </button>
                    <button className="w-7 h-7 rounded-full bg-[#282828] flex items-center justify-center hover:bg-[#3E3E3E]">
                      <MessageCircle size={14} className="text-[#B3B3B3]" />
                    </button>
                  </div>
                </div>
              </>
            )}
            
            {activeDiscussionFilter === "new" && (
              <>
                <div className="bg-[#181818] hover:bg-[#282828] rounded-md p-3 flex items-center cursor-pointer transition">
                  <div className="mr-3 text-[#FFD700]">
                    <Trophy size={16} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Just Released: Best Electronic Albums of May</p>
                    <p className="text-xs text-[#B3B3B3]">287 comments • 3h ago</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="w-7 h-7 rounded-full bg-[#282828] flex items-center justify-center hover:bg-[#3E3E3E]">
                      <Heart size={14} className="text-[#B3B3B3]" />
                    </button>
                    <button className="w-7 h-7 rounded-full bg-[#282828] flex items-center justify-center hover:bg-[#3E3E3E]">
                      <MessageCircle size={14} className="text-[#B3B3B3]" />
                    </button>
                  </div>
                </div>
                
                <div className="bg-[#181818] hover:bg-[#282828] rounded-md p-3 flex items-center cursor-pointer transition">
                  <div className="mr-3 text-[#FFD700]">
                    <Trophy size={16} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Emerging Artists With Groundbreaking Sound</p>
                    <p className="text-xs text-[#B3B3B3]">168 comments • 6h ago</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="w-7 h-7 rounded-full bg-[#282828] flex items-center justify-center hover:bg-[#3E3E3E]">
                      <Heart size={14} className="text-[#B3B3B3]" />
                    </button>
                    <button className="w-7 h-7 rounded-full bg-[#282828] flex items-center justify-center hover:bg-[#3E3E3E]">
                      <MessageCircle size={14} className="text-[#B3B3B3]" />
                    </button>
                  </div>
                </div>
                
                <div className="bg-[#181818] hover:bg-[#282828] rounded-md p-3 flex items-center cursor-pointer transition">
                  <div className="mr-3 text-[#FFD700]">
                    <Trophy size={16} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Fresh Releases From Berlin Underground</p>
                    <p className="text-xs text-[#B3B3B3]">132 comments • 10h ago</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="w-7 h-7 rounded-full bg-[#282828] flex items-center justify-center hover:bg-[#3E3E3E]">
                      <Heart size={14} className="text-[#B3B3B3]" />
                    </button>
                    <button className="w-7 h-7 rounded-full bg-[#282828] flex items-center justify-center hover:bg-[#3E3E3E]">
                      <MessageCircle size={14} className="text-[#B3B3B3]" />
                    </button>
                  </div>
                </div>
              </>
            )}
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
