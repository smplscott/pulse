import { useState } from "react";
import { Link } from "wouter";
import Header from "@/components/layout/Header";
import TabNavigator from "@/components/layout/TabNavigator";
import BottomNav from "@/components/layout/BottomNav";
import MusicPlayer from "@/components/layout/MusicPlayer";
import FeaturedArtists from "@/components/sections/FeaturedArtists";
import WhatsThisSong from "@/components/sections/WhatsThisSong";
import TrackIDs from "@/components/sections/TrackIDs";
import Threads from "@/components/sections/Threads";
import Venues from "@/components/sections/Venues";
import DiscussionItem from "@/components/discussion/DiscussionItem";
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
                <DiscussionItem 
                  id={1}
                  title="Most Innovative Electronic Artists of 2025"
                  comments={243}
                  timeAgo="4h ago"
                />
                
                <DiscussionItem 
                  id={2}
                  title="Techno DJs That Define Berlin's Sound"
                  comments={192}
                  timeAgo="8h ago"
                />
                
                <DiscussionItem 
                  id={3}
                  title="Artists Who Master Both Production & Vocals"
                  comments={122}
                  timeAgo="12h ago"
                />
              </>
            )}
            
            {activeDiscussionFilter === "songs" && (
              <>
                <DiscussionItem 
                  id={4}
                  title="Tracks That Define The Berlin Underground"
                  comments={318}
                  timeAgo="2h ago"
                />
                
                <DiscussionItem 
                  id={5}
                  title="Songs With The Most Innovative Sound Design"
                  comments={205}
                  timeAgo="6h ago"
                />
                
                <DiscussionItem 
                  id={6}
                  title="Most Sampled Breaks In Electronic Music"
                  comments={173}
                  timeAgo="9h ago"
                />
              </>
            )}
            
            {activeDiscussionFilter === "playlists" && (
              <>
                <DiscussionItem 
                  id={7}
                  title="Watergate Closing Sets That Made History"
                  comments={198}
                  timeAgo="5h ago"
                />
                
                <DiscussionItem 
                  id={8}
                  title="Essential Berghain Sound Playlists"
                  comments={241}
                  timeAgo="7h ago"
                />
                
                <DiscussionItem 
                  id={9}
                  title="Track IDs From Top Festival Sets of 2025"
                  comments={152}
                  timeAgo="11h ago"
                />
              </>
            )}
            
            {activeDiscussionFilter === "new" && (
              <>
                <DiscussionItem 
                  id={10}
                  title="Just Released: Best Electronic Albums of May"
                  comments={287}
                  timeAgo="3h ago"
                />
                
                <DiscussionItem 
                  id={11}
                  title="Emerging Artists With Groundbreaking Sound"
                  comments={168}
                  timeAgo="6h ago"
                />
                
                <DiscussionItem 
                  id={12}
                  title="Fresh Releases From Berlin Underground"
                  comments={132}
                  timeAgo="10h ago"
                />
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
