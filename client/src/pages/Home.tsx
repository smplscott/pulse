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
import { SearchIcon, SlidersHorizontal } from "lucide-react";
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
          
          {/* Main CTA - Start a Thread */}
          <button 
            className="w-full bg-[#E51D3E] hover:bg-[#c01733] text-white py-3 rounded-md font-medium mb-6"
            onClick={() => toast({ title: "Create Thread", description: "Thread creation coming soon!" })}
          >
            Start a Thread
          </button>
        </div>
        
        {/* Featured Discussions Section with filter buttons */}
        <div className="px-4 py-4">
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
          
          {/* Example threads in reddit-style layout */}
          <div className="space-y-2 mb-6">
            <div className="bg-[#181818] hover:bg-[#282828] rounded-md p-3 cursor-pointer transition">
              <div className="flex items-start">
                <div className="flex flex-col items-center mr-3">
                  <button className="text-[#B3B3B3] hover:text-white">▲</button>
                  <span className="text-sm text-white">24</span>
                  <button className="text-[#B3B3B3] hover:text-white">▼</button>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium">"Hypercolour" - What makes this Bicep track so special?</h3>
                  <p className="text-xs text-[#B3B3B3] mt-1">
                    Posted by @musiclover · 2h ago · 12 comments
                  </p>
                  <div className="flex items-center mt-2 space-x-3">
                    <button className="flex items-center text-xs text-[#B3B3B3] hover:text-white">
                      <MessageCircle size={14} className="mr-1" /> Comments
                    </button>
                    <button className="flex items-center text-xs text-[#B3B3B3] hover:text-white">
                      <Heart size={14} className="mr-1" /> Save
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-[#181818] hover:bg-[#282828] rounded-md p-3 cursor-pointer transition">
              <div className="flex items-start">
                <div className="flex flex-col items-center mr-3">
                  <button className="text-[#B3B3B3] hover:text-white">▲</button>
                  <span className="text-sm text-white">42</span>
                  <button className="text-[#B3B3B3] hover:text-white">▼</button>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium">Best underground techno clubs in Berlin this summer?</h3>
                  <p className="text-xs text-[#B3B3B3] mt-1">
                    Posted by @brlnrave · 8h ago · 31 comments
                  </p>
                  <div className="flex items-center mt-2 space-x-3">
                    <button className="flex items-center text-xs text-[#B3B3B3] hover:text-white">
                      <MessageCircle size={14} className="mr-1" /> Comments
                    </button>
                    <button className="flex items-center text-xs text-[#B3B3B3] hover:text-white">
                      <Heart size={14} className="mr-1" /> Save
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-[#181818] hover:bg-[#282828] rounded-md p-3 cursor-pointer transition">
              <div className="flex items-start">
                <div className="flex flex-col items-center mr-3">
                  <button className="text-[#B3B3B3] hover:text-white">▲</button>
                  <span className="text-sm text-white">17</span>
                  <button className="text-[#B3B3B3] hover:text-white">▼</button>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium">Found a rare WhoMadeWho track from 2008 - check this out!</h3>
                  <p className="text-xs text-[#B3B3B3] mt-1">
                    Posted by @deeptechhead · 1d ago · 7 comments
                  </p>
                  <div className="flex items-center mt-2 space-x-3">
                    <button className="flex items-center text-xs text-[#B3B3B3] hover:text-white">
                      <MessageCircle size={14} className="mr-1" /> Comments
                    </button>
                    <button className="flex items-center text-xs text-[#B3B3B3] hover:text-white">
                      <Heart size={14} className="mr-1" /> Save
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <WhatsThisSong />
        
        {/* Shortened to "Songs You Might Like" */}
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Songs You Might Like</h2>
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
