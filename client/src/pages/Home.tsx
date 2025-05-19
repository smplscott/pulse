import { useState } from "react";
import { Link } from "wouter";
import Header from "@/components/layout/Header";
import TabNavigator from "@/components/layout/TabNavigator";
import BottomNav from "@/components/layout/BottomNav";
import FeaturedArtists from "@/components/sections/FeaturedArtists";
import WhatsThisSong from "@/components/sections/WhatsThisSong";
import TrackIDs from "@/components/sections/TrackIDs";
import Threads from "@/components/sections/Threads";
import Venues from "@/components/sections/Venues";
import DiscussionItem from "@/components/discussion/DiscussionItem";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SearchIcon, SlidersHorizontal, MessageCircle, Trophy, Music, Heart, Filter, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("for-you");
  const [activeDiscussionFilter, setActiveDiscussionFilter] = useState("artists");
  const [activeThreadsFilter, setActiveThreadsFilter] = useState("all");
  const { toast } = useToast();
  
  const tabs = [
    { id: "for-you", label: "For You" },
    { id: "discover", label: "Discover" },
    { id: "threads", label: "Threads" },
    { id: "whats-this-song", label: "What's That Song" },
  ];
  
  // Discussion filter options
  const discussionFilters = [
    { id: "artists", label: "Artists" },
    { id: "songs", label: "Songs" },
    { id: "playlists", label: "Playlists" },
    { id: "new", label: "New Music" },
  ];
  
  // Thread filter options
  const threadFilters = [
    { id: "all", label: "All" },
    { id: "music", label: "Music" },
    { id: "community", label: "Community" },
    { id: "events", label: "Events" },
  ];
  
  // Genre filters for Discover tab
  const genreFilters = [
    { id: "techno", label: "Techno" },
    { id: "house", label: "House" },
    { id: "ambient", label: "Ambient" },
    { id: "breakbeat", label: "Breakbeat" },
    { id: "dnb", label: "Drum & Bass" },
    { id: "experimental", label: "Experimental" },
  ];
  
  // Subgenre filters based on selected genre (example for Techno)
  const subGenreFilters = [
    { id: "hard-techno", label: "Hard Techno" },
    { id: "melodic-techno", label: "Melodic Techno" },
    { id: "acid-techno", label: "Acid Techno" },
    { id: "dub-techno", label: "Dub Techno" },
    { id: "minimal-techno", label: "Minimal Techno" },
  ];
  
  // Similar genres for selected subgenre (example)
  const similarGenres = [
    { id: "industrial", label: "Industrial" },
    { id: "ebm", label: "EBM" },
    { id: "breakcore", label: "Breakcore" },
    { id: "trance", label: "Trance" },
  ];

  return (
    <div className="min-h-screen pb-32">
      <Header />
      <TabNavigator 
        tabs={tabs} 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
      />
      
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
            <button 
              className="ml-2 w-10 h-10 rounded-lg pink-gradient flex items-center justify-center pink-gradient-hover"
              onClick={() => toast({ title: "Create Content", description: "Create new content coming soon!" })}
            >
              <span className="text-white text-xl font-bold">+</span>
            </button>
          </div>
          
          {/* Talk Music CTA button */}
          <button 
            className="w-full pink-gradient pink-gradient-hover text-white py-3 rounded-md font-medium mb-2 flex items-center justify-center"
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
        
        {/* For You tab content */}
        {activeTab === "for-you" && (
          <>
            {/* Featured Discussions Section with filter buttons */}
            <div className="px-4 py-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Featured Discussions</h2>
                <button 
                  onClick={() => setActiveTab("threads")} 
                  className="text-sm text-[#B3B3B3] hover:text-white"
                >
                  See All
                </button>
              </div>
              
              {/* Filter buttons */}
              <div className="mb-4 flex space-x-2 overflow-x-auto scrollbar-hide">
                {discussionFilters.map((filter) => (
                  <button
                    key={filter.id}
                    className={cn(
                      "px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap",
                      activeDiscussionFilter === filter.id
                        ? "pink-gradient text-white"
                        : "bg-[#181818] text-[#B3B3B3]"
                    )}
                    onClick={() => setActiveDiscussionFilter(filter.id)}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
              
              {/* Sample discussions with trophy icons */}
              <div className="space-y-2 mb-3">
                {/* Sample discussion rows with trophies */}
                {activeDiscussionFilter === "artists" && (
                  <>
                    <DiscussionItem 
                      id={1}
                      title="Most Innovative Electronic Artists of 2025"
                      comments={243}
                      timeAgo="4h ago"
                      rank={1}
                    />
                    
                    <DiscussionItem 
                      id={2}
                      title="Techno DJs That Define Berlin's Sound"
                      comments={192}
                      timeAgo="8h ago"
                      rank={2}
                    />
                    
                    <DiscussionItem 
                      id={3}
                      title="Artists Who Master Both Production & Vocals"
                      comments={122}
                      timeAgo="12h ago"
                      rank={3}
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
                      rank={1}
                    />
                    
                    <DiscussionItem 
                      id={5}
                      title="Songs With The Most Innovative Sound Design"
                      comments={205}
                      timeAgo="6h ago"
                      rank={2}
                    />
                    
                    <DiscussionItem 
                      id={6}
                      title="Most Sampled Breaks In Electronic Music"
                      comments={173}
                      timeAgo="9h ago"
                      rank={3}
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
                      rank={1}
                    />
                    
                    <DiscussionItem 
                      id={8}
                      title="Essential Berghain Sound Playlists"
                      comments={241}
                      timeAgo="7h ago"
                      rank={2}
                    />
                    
                    <DiscussionItem 
                      id={9}
                      title="Track IDs From Top Festival Sets of 2025"
                      comments={152}
                      timeAgo="11h ago"
                      rank={3}
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
            
            {/* What's This Song section */}
            <div className="mb-3">
              <WhatsThisSong />
            </div>
            
            {/* Trending Songs section */}
            <div className="mb-3">
              <div className="px-4 py-2">
                <h2 className="text-xl font-bold">Trending Songs on Pulse</h2>
              </div>
              
              <TrackIDs hideTitle={true} />
            </div>
            
            {/* Hot Threads section */}
            <div className="mb-6">
              <Threads />
            </div>
            
            {/* Places to Listen section */}
            <div>
              <Venues />
            </div>
          </>
        )}
        
        {/* Discover tab content */}
        {activeTab === "discover" && (
          <div className="px-4 py-2">
            <h2 className="text-xl font-bold mb-4">Discover New Music</h2>
            
            {/* Genre filter */}
            <div className="mb-4">
              <h3 className="text-sm font-medium text-[#B3B3B3] mb-2">Genre</h3>
              <div className="flex space-x-2 overflow-x-auto scrollbar-hide mb-4">
                {genreFilters.map((filter) => (
                  <button
                    key={filter.id}
                    className="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap bg-[#282828] text-white"
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Sub-Genre filter */}
            <div className="mb-4">
              <h3 className="text-sm font-medium text-[#B3B3B3] mb-2">Sub-Genre</h3>
              <div className="flex space-x-2 overflow-x-auto scrollbar-hide mb-4">
                {subGenreFilters.map((filter) => (
                  <button
                    key={filter.id}
                    className="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap bg-[#282828] text-white"
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Similar Genres filter (multi-select) */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-[#B3B3B3] mb-2">Similar Genres</h3>
              <div className="flex flex-wrap gap-2 mb-4">
                {similarGenres.map((genre) => (
                  <button
                    key={genre.id}
                    className="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap pink-gradient text-white"
                  >
                    {genre.label}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Apply Filters button */}
            <button 
              className="w-full py-3 rounded-md font-medium mb-4 border border-white bg-white text-black hover:bg-[#f0f0f0]"
            >
              Apply Filters
            </button>
            
            {/* Filter results */}
            <div className="mt-8">
              <h2 className="text-xl font-bold mb-4">Filter Results</h2>
              <div className="space-y-4">
                <p className="text-[#B3B3B3]">Filter results will appear here</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Threads tab content */}
        {activeTab === "threads" && (
          <div className="px-4 py-2">
            {/* Thread filter tabs */}
            <div className="mb-4 flex space-x-2 overflow-x-auto scrollbar-hide">
              {threadFilters.map((filter) => (
                <button
                  key={filter.id}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap",
                    activeThreadsFilter === filter.id
                      ? "pink-gradient text-white"
                      : "bg-[#181818] text-[#B3B3B3]"
                  )}
                  onClick={() => setActiveThreadsFilter(filter.id)}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            
            {/* Featured Discussions section */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Featured Discussions</h2>
                <span className="text-sm text-[#B3B3B3] hover:text-white">See All</span>
              </div>
              
              {/* Filter buttons matching the provided screenshot */}
              <div className="mb-4 flex space-x-2 overflow-x-auto scrollbar-hide">
                {discussionFilters.map((filter) => (
                  <button
                    key={filter.id}
                    className={cn(
                      "px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap",
                      activeDiscussionFilter === filter.id
                        ? "pink-gradient text-white"
                        : "bg-[#181818] text-[#B3B3B3]"
                    )}
                    onClick={() => setActiveDiscussionFilter(filter.id)}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
              
              {/* Featured discussion items matching the screenshot */}
              <div className="space-y-5 pt-2">
                <div className="flex items-start">
                  <div className="mr-3 pt-1">
                    <Trophy className="h-6 w-6 text-yellow-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-white">Most Innovative Electronic Artists of 2025</h3>
                    <p className="text-[#B3B3B3] text-sm">243 comments • 4h ago</p>
                  </div>
                  <div className="flex space-x-2">
                    <button className="p-2 rounded-full bg-[#1A1A1A]">
                      <Heart className="h-5 w-5 text-[#B3B3B3]" />
                    </button>
                    <button className="p-2 rounded-full bg-[#1A1A1A]">
                      <MessageCircle className="h-5 w-5 text-[#B3B3B3]" />
                    </button>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="mr-3 pt-1">
                    <Trophy className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-white">Techno DJs That Define Berlin's Sound</h3>
                    <p className="text-[#B3B3B3] text-sm">192 comments • 8h ago</p>
                  </div>
                  <div className="flex space-x-2">
                    <button className="p-2 rounded-full bg-[#1A1A1A]">
                      <Heart className="h-5 w-5 text-[#B3B3B3]" />
                    </button>
                    <button className="p-2 rounded-full bg-[#1A1A1A]">
                      <MessageCircle className="h-5 w-5 text-[#B3B3B3]" />
                    </button>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="mr-3 pt-1">
                    <Trophy className="h-6 w-6 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-white">Artists Who Master Both Production & Vocals</h3>
                    <p className="text-[#B3B3B3] text-sm">122 comments • 12h ago</p>
                  </div>
                  <div className="flex space-x-2">
                    <button className="p-2 rounded-full bg-[#1A1A1A]">
                      <Heart className="h-5 w-5 text-[#B3B3B3]" />
                    </button>
                    <button className="p-2 rounded-full bg-[#1A1A1A]">
                      <MessageCircle className="h-5 w-5 text-[#B3B3B3]" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Discussion Threads section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Discussion Threads</h2>
                <button className="text-sm text-[#B3B3B3]">
                  <Filter size={16} className="inline mr-1" />
                  Sort
                </button>
              </div>
              
              {/* Mini filter buttons like in featured discussions */}
              <div className="mb-4 flex space-x-2 overflow-x-auto scrollbar-hide">
                {discussionFilters.map((filter) => (
                  <button
                    key={filter.id}
                    className={cn(
                      "px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap",
                      activeDiscussionFilter === filter.id
                        ? "pink-gradient text-white"
                        : "bg-[#181818] text-[#B3B3B3]"
                    )}
                    onClick={() => setActiveDiscussionFilter(filter.id)}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
              
              {/* Thread list */}
              <div className="space-y-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={`thread-${i}`} className="flex items-start border-b border-[#3E3E3E] pb-3">
                    <div className="flex-1">
                      <h3 className="font-medium mb-1">Thread Title #{i+1}</h3>
                      <p className="text-xs text-[#B3B3B3] mb-2">
                        Started by @User{i+1} • {Math.floor(Math.random() * 24) + 1}h ago
                      </p>
                      <div className="flex items-center gap-3 text-xs">
                        <div className="flex items-center">
                          <MessageCircle size={14} className="text-[#B3B3B3] mr-1" />
                          <span>{Math.floor(Math.random() * 200) + 10}</span>
                        </div>
                      </div>
                    </div>
                    <Badge className={`${
                      i % 3 === 0 ? "green-gradient text-[#5b5b5b]" : 
                      i % 3 === 1 ? "pink-gradient text-white" : 
                      "bg-gradient-to-r from-[#5271ff] to-[#7a9dff] text-white"
                    }`}>
                      {i % 3 === 0 ? "Music" : i % 3 === 1 ? "Community" : "Event"}
                    </Badge>
                  </div>
                ))}
              </div>
              
              {/* Load more button */}
              <button className="w-full text-center py-3 mt-4 text-[#B3B3B3] hover:text-white">
                Load More
              </button>
            </div>
          </div>
        )}
        
        {/* What's That Song tab content */}
        {activeTab === "whats-this-song" && (
          <div className="px-4 py-2">
            <h2 className="text-xl font-bold mb-4">What's That Song?</h2>
            <div className="mb-6">
              <p className="text-[#B3B3B3] mb-4">
                Heard a track but don't know the name? Describe it here and let the community help identify it.
              </p>
              
              <button 
                className="w-full pink-gradient pink-gradient-hover text-white py-3 rounded-md font-medium mb-4"
                onClick={() => {
                  toast({
                    title: "Create Request",
                    description: "New song identification request coming soon!"
                  });
                }}
              >
                Create New Request
              </button>
            </div>
            
            {/* Popular requests */}
            <h3 className="font-bold mb-3 text-lg">Popular Requests</h3>
            <div className="space-y-4 mb-6">
              <WhatsThisSong hideTitle={true} expanded={true} />
            </div>
            
            {/* Recent requests */}
            <h3 className="font-bold mb-3 text-lg">Recent Requests</h3>
            <div className="space-y-4">
              <WhatsThisSong hideTitle={true} expanded={true} />
            </div>
          </div>
        )}
      </main>
      
      <BottomNav />
    </div>
  );
}
