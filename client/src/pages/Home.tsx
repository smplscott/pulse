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
import { SearchIcon, SlidersHorizontal, MessageCircle, Trophy, Music, Heart, Filter, Clock, Bookmark } from "lucide-react";
import AdvancedGenreFilter from "@/components/ui/advanced-genre-filter";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("for-you");
  const [activeDiscussionFilter, setActiveDiscussionFilter] = useState("artists");
  const [activeThreadsFilter, setActiveThreadsFilter] = useState("all");
  const [showGenreFilter, setShowGenreFilter] = useState(false);
  const [selectedMainGenre, setSelectedMainGenre] = useState<string | null>(null);
  const [selectedSubGenre, setSelectedSubGenre] = useState<string | null>(null);
  const [selectedSimilarGenres, setSelectedSimilarGenres] = useState<string[]>([]);
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
    { id: "experimental", label: "Experimental" },
    { id: "dnb", label: "D&B" },
  ];
  
  const mainGenreFilters = [
    { id: "electronic", label: "Electronic", subGenres: ["Techno", "House", "Ambient", "Experimental"] },
    { id: "rock", label: "Rock", subGenres: ["Alternative", "Indie", "Progressive", "Post-Rock"] },
    { id: "pop", label: "Pop", subGenres: ["Synth-Pop", "Dream Pop", "Electro-Pop", "Indie Pop"] },
    { id: "hip-hop", label: "Hip-Hop", subGenres: ["Trap", "Lo-Fi", "Boom Bap", "Alternative"] },
  ];
  
  const subGenreFilters = [
    { id: "melodic-techno", label: "Melodic Techno" },
    { id: "progressive-house", label: "Progressive House" },
    { id: "minimal-techno", label: "Minimal Techno" },
    { id: "deep-house", label: "Deep House" },
    { id: "acid-techno", label: "Acid Techno" },
    { id: "tech-house", label: "Tech House" },
  ];
  
  const similarGenres = [
    { id: "organic-house", label: "Organic House" },
    { id: "downtempo", label: "Downtempo" },
    { id: "tribal-house", label: "Tribal House" },
    { id: "psytrance", label: "Psytrance" },
    { id: "future-garage", label: "Future Garage" },
    { id: "breakbeat", label: "Breakbeat" },
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
        {/* Search bar and Talk Music CTA - Hide completely when on Discover tab and What's That Song tab */}
        {activeTab !== "discover" && activeTab !== "whats-this-song" && (
          <div className="px-4 pt-2 pb-2">
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
            

          </div>
        )}
        
        {/* For You tab content */}
        {activeTab === "for-you" && (
          <>
            {/* 1. Saved Threads Section */}
            <div className="px-4 pt-2 pb-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Saved Threads</h2>
                <button className="text-sm text-[#B3B3B3] hover:text-white">See All</button>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center p-3 bg-[#181818] rounded-lg">
                  <div className="w-2 h-2 bg-pink-500 rounded-full mr-3"></div>
                  <div className="flex-1">
                    <h3 className="font-medium text-white text-sm">Best Techno Albums of 2023 So Far</h3>
                    <p className="text-xs text-[#B3B3B3]">Saved 2 days ago</p>
                  </div>
                </div>
                <div className="flex items-center p-3 bg-[#181818] rounded-lg">
                  <div className="w-2 h-2 bg-pink-500 rounded-full mr-3"></div>
                  <div className="flex-1">
                    <h3 className="font-medium text-white text-sm">Underground Venues Worth Visiting</h3>
                    <p className="text-xs text-[#B3B3B3]">Saved 1 week ago</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Most Commented On Section */}
            <div className="px-4 pt-2 pb-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Most Commented On</h2>
                <button 
                  className="text-sm text-[#B3B3B3] hover:text-white"
                  onClick={() => {
                    toast({ title: "Filters", description: "Advanced filters coming soon" });
                  }}
                >
                  Filters
                </button>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center p-3 bg-[#181818] rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-medium text-white text-sm">Most Innovative Electronic Artists of 2025</h3>
                    <p className="text-xs text-[#B3B3B3]">243 comments • 4h ago</p>
                  </div>
                </div>
                <div className="flex items-center p-3 bg-[#181818] rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-medium text-white text-sm">Techno DJs That Define Berlin's Sound</h3>
                    <p className="text-xs text-[#B3B3B3]">192 comments • 8h ago</p>
                  </div>
                </div>
                <div className="flex items-center p-3 bg-[#181818] rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-medium text-white text-sm">Artists Who Master Both Production & Vocals</h3>
                    <p className="text-xs text-[#B3B3B3]">122 comments • 12h ago</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Featured Discussions Section */}
            <div className="px-4 pt-2 pb-4">
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
              
              <div className="space-y-2">
                <DiscussionItem 
                  id={4}
                  title="Most Underrated Tracks of This Year"
                  comments={156}
                  timeAgo="6h ago"
                  rank={1}
                />
                <DiscussionItem 
                  id={5}
                  title="Perfect Songs for Late Night Sets"
                  comments={89}
                  timeAgo="1d ago"
                  rank={2}
                />
                <DiscussionItem 
                  id={6}
                  title="Best Sets from Berlin's Underground Scene"
                  comments={76}
                  timeAgo="2d ago"
                  rank={3}
                />
              </div>
            </div>

            {/* 4. What's This Song Section */}
            <div className="mb-3">
              <WhatsThisSong />
            </div>

            {/* 5. Trending Artists on Pulse Section */}
            <div className="px-4 pt-4 pb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Trending Artists on Pulse</h2>
                <button className="text-sm text-[#B3B3B3] hover:text-white">See All</button>
              </div>
              
              <div className="flex overflow-x-auto scrollbar-hide space-x-4 pb-2">
                <div className="bg-[#181818] rounded-lg p-4 flex-shrink-0 w-64">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#1E3A8A] to-[#7C2D12] rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-lg">T</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-white">Tripolism</h3>
                      <p className="text-sm text-[#B3B3B3]">1.2M plays this week</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <button className="p-1 hover:bg-[#282828] rounded">
                        <Heart size={16} className="text-[#B3B3B3] hover:text-pink-500" />
                      </button>
                      <button className="p-1 hover:bg-[#282828] rounded">
                        <Bookmark size={16} className="text-[#B3B3B3] hover:text-white" />
                      </button>
                    </div>
                    <button 
                      className="px-3 py-1 bg-[#282828] rounded-full text-white text-xs border border-[#3E3E3E] hover:bg-[#3E3E3E]"
                      onClick={() => toast({
                        title: "Discussion",
                        description: "Opening Tripolism discussion"
                      })}
                    >
                      Discuss
                    </button>
                  </div>
                </div>
                
                <div className="bg-[#181818] rounded-lg p-4 flex-shrink-0 w-64">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#7E22CE] to-[#BE185D] rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-lg">D</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-white">DESIREE</h3>
                      <p className="text-sm text-[#B3B3B3]">850K plays this week</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <button className="p-1 hover:bg-[#282828] rounded">
                        <Heart size={16} className="text-[#B3B3B3] hover:text-pink-500" />
                      </button>
                      <button className="p-1 hover:bg-[#282828] rounded">
                        <Bookmark size={16} className="text-[#B3B3B3] hover:text-white" />
                      </button>
                    </div>
                    <button 
                      className="px-3 py-1 bg-[#282828] rounded-full text-white text-xs border border-[#3E3E3E] hover:bg-[#3E3E3E]"
                      onClick={() => toast({
                        title: "Discussion",
                        description: "Opening DESIREE discussion"
                      })}
                    >
                      Discuss
                    </button>
                  </div>
                </div>

                <div className="bg-[#181818] rounded-lg p-4 flex-shrink-0 w-64">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#059669] to-[#DC2626] rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-lg">&</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-white">&ME</h3>
                      <p className="text-sm text-[#B3B3B3]">720K plays this week</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <button className="p-1 hover:bg-[#282828] rounded">
                        <Heart size={16} className="text-[#B3B3B3] hover:text-pink-500" />
                      </button>
                      <button className="p-1 hover:bg-[#282828] rounded">
                        <Bookmark size={16} className="text-[#B3B3B3] hover:text-white" />
                      </button>
                    </div>
                    <button 
                      className="px-3 py-1 bg-[#282828] rounded-full text-white text-xs border border-[#3E3E3E] hover:bg-[#3E3E3E]"
                      onClick={() => toast({
                        title: "Discussion",
                        description: "Opening &ME discussion"
                      })}
                    >
                      Discuss
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 6. Trending Songs on Pulse Section */}
            <div className="px-4 pt-2 pb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Trending Songs on Pulse</h2>
                <button className="text-sm text-[#B3B3B3] hover:text-white">See All</button>
              </div>
              
              <div className="flex overflow-x-auto scrollbar-hide space-x-4 pb-2">
                <div className="bg-[#181818] rounded-lg p-4 flex-shrink-0 w-64">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-12 h-12 bg-[#282828] rounded-lg overflow-hidden">
                      <div className="w-full h-full bg-gradient-to-br from-[#FF6B35] to-[#F7931E]"></div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-white text-sm">Flying Away With You</h3>
                      <p className="text-xs text-[#B3B3B3]">WhoMadeWho, Tripolism</p>
                      <p className="text-xs text-[#B3B3B3]">2.1M plays this week</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <button className="p-1 hover:bg-[#282828] rounded">
                        <Heart size={16} className="text-[#B3B3B3] hover:text-pink-500" />
                      </button>
                      <button className="p-1 hover:bg-[#282828] rounded">
                        <Bookmark size={16} className="text-[#B3B3B3] hover:text-white" />
                      </button>
                    </div>
                    <button 
                      className="px-3 py-1 bg-[#282828] rounded-full text-white text-xs border border-[#3E3E3E] hover:bg-[#3E3E3E]"
                      onClick={() => toast({
                        title: "Discussion",
                        description: "Opening track discussion"
                      })}
                    >
                      Discuss
                    </button>
                  </div>
                </div>
                
                <div className="bg-[#181818] rounded-lg p-4 flex-shrink-0 w-64">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-12 h-12 bg-[#282828] rounded-lg overflow-hidden">
                      <div className="w-full h-full bg-gradient-to-br from-[#8B5CF6] to-[#EC4899]"></div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-white text-sm">King Steps (DESIREE Remix)</h3>
                      <p className="text-xs text-[#B3B3B3]">Disclosure, Pa Salieu, DESIREE</p>
                      <p className="text-xs text-[#B3B3B3]">1.8M plays this week</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <button className="p-1 hover:bg-[#282828] rounded">
                        <Heart size={16} className="text-[#B3B3B3] hover:text-pink-500" />
                      </button>
                      <button className="p-1 hover:bg-[#282828] rounded">
                        <Bookmark size={16} className="text-[#B3B3B3] hover:text-white" />
                      </button>
                    </div>
                    <button 
                      className="px-3 py-1 bg-[#282828] rounded-full text-white text-xs border border-[#3E3E3E] hover:bg-[#3E3E3E]"
                      onClick={() => toast({
                        title: "Discussion",
                        description: "Opening track discussion"
                      })}
                    >
                      Discuss
                    </button>
                  </div>
                </div>

                <div className="bg-[#181818] rounded-lg p-4 flex-shrink-0 w-64">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-12 h-12 bg-[#282828] rounded-lg overflow-hidden">
                      <div className="w-full h-full bg-gradient-to-br from-[#10B981] to-[#3B82F6]"></div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-white text-sm">Reflections</h3>
                      <p className="text-xs text-[#B3B3B3]">&ME, Rampa</p>
                      <p className="text-xs text-[#B3B3B3]">1.5M plays this week</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <button className="p-1 hover:bg-[#282828] rounded">
                        <Heart size={16} className="text-[#B3B3B3] hover:text-pink-500" />
                      </button>
                      <button className="p-1 hover:bg-[#282828] rounded">
                        <Bookmark size={16} className="text-[#B3B3B3] hover:text-white" />
                      </button>
                    </div>
                    <button 
                      className="px-3 py-1 bg-[#282828] rounded-full text-white text-xs border border-[#3E3E3E] hover:bg-[#3E3E3E]"
                      onClick={() => toast({
                        title: "Discussion",
                        description: "Opening track discussion"
                      })}
                    >
                      Discuss
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 7. Places You Might Like Section */}
            <div className="px-4 pt-2 pb-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Places You Might Like</h2>
                <Link href="/venues" className="text-sm text-[#B3B3B3] hover:text-white">
                  Search More
                </Link>
              </div>
              <Venues />
            </div>
          </>
        )}
        
        {/* Discover tab content */}
        {activeTab === "discover" && (
          <div className="px-4 pt-4 pb-2">            
            {/* Search bar with filter button */}
            <div className="relative mb-6 flex items-center gap-2">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#B3B3B3]" size={18} />
                <Input
                  type="text"
                  placeholder="Search artists, songs, genres..."
                  className="pl-9 pr-12 bg-[#282828] border-[#3E3E3E] text-white placeholder:text-[#B3B3B3]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button 
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#B3B3B3] hover:text-white"
                  onClick={() => setShowGenreFilter(!showGenreFilter)}
                >
                  <Filter size={18} />
                </button>
              </div>
              
              <button 
                className="w-10 h-10 rounded-lg pink-gradient flex items-center justify-center pink-gradient-hover"
                onClick={() => toast({ title: "Create Content", description: "Create new content feature coming soon!" })}
              >
                <span className="text-white text-xl font-bold">+</span>
              </button>
            </div>
            
            {/* Logical progression filter - only shown when filter button is clicked */}
            {showGenreFilter && (
              <div className="bg-[#121212] px-4 py-3 mb-6 border border-[#3E3E3E] rounded-lg shadow-lg">
                <h3 className="text-white text-sm font-medium mb-3">Filter by Genre</h3>
                
                {/* Main Genre selection */}
                <div className="mb-3">
                  <h3 className="text-white text-xs font-medium mb-2">Main Genre</h3>
                  <div className="flex overflow-x-auto scrollbar-hide whitespace-nowrap pb-1">
                    {mainGenreFilters.map((filter, index) => (
                      <button
                        key={filter.id}
                        className={cn(
                          "mr-2 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0",
                          selectedMainGenre === filter.label
                            ? "pink-gradient text-white" 
                            : "bg-[#282828] text-[#B3B3B3]"
                        )}
                        onClick={() => {
                          setSelectedMainGenre(filter.label);
                          setSelectedSubGenre(null); 
                          setSelectedSimilarGenres([]);
                        }}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Sub-Genre selection - only visible after main genre is selected */}
                {selectedMainGenre && (
                  <div className="mb-3">
                    <h3 className="text-white text-xs font-medium mb-2">Sub-Genres</h3>
                    <div className="flex overflow-x-auto scrollbar-hide whitespace-nowrap pb-1">
                      {subGenreFilters.map((filter, index) => (
                        <button
                          key={filter.id}
                          className={cn(
                            "mr-2 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0",
                            selectedSubGenre === filter.label
                              ? "pink-gradient text-white" 
                              : "bg-[#282828] text-[#B3B3B3]"
                          )}
                          onClick={() => setSelectedSubGenre(filter.label)}
                        >
                          {filter.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Similar Genres selection - multi-select, only visible after sub-genre is selected */}
                {selectedSubGenre && (
                  <div className="mb-3">
                    <h3 className="text-white text-xs font-medium mb-2">Similar Genres</h3>
                    <div className="flex flex-wrap gap-2">
                      {similarGenres.map((genre) => {
                        const isSelected = selectedSimilarGenres.includes(genre.label);
                        return (
                          <Badge 
                            key={genre.id}
                            className={cn(
                              "px-3 py-1 cursor-pointer text-xs",
                              isSelected ? "pink-gradient text-white" : "bg-[#282828] text-[#B3B3B3]"
                            )}
                            onClick={() => {
                              if (isSelected) {
                                setSelectedSimilarGenres(prev => 
                                  prev.filter(g => g !== genre.label)
                                );
                              } else {
                                setSelectedSimilarGenres(prev => [...prev, genre.label]);
                              }
                            }}
                          >
                            {genre.label}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {/* Filter actions */}
                <div className="mt-3 pt-3 border-t border-[#3E3E3E] flex justify-between items-center">
                  <button 
                    className="text-xs text-[#B3B3B3] hover:text-white"
                    onClick={() => {
                      setSelectedMainGenre(null);
                      setSelectedSubGenre(null);
                      setSelectedSimilarGenres([]);
                    }}
                  >
                    Clear all filters
                  </button>
                  
                  <button 
                    className="px-3 py-1 rounded-full text-xs pink-gradient text-white"
                    onClick={() => setShowGenreFilter(false)}
                  >
                    Apply filters
                  </button>
                </div>
              </div>
            )}
            
            {/* Selected filters badges - only shown if filters are applied */}
            {(selectedMainGenre || selectedSubGenre || selectedSimilarGenres.length > 0) && (
              <div className="flex flex-wrap gap-2 mb-6">
                {selectedMainGenre && (
                  <Badge 
                    className="pink-gradient text-white flex items-center gap-1 px-2 py-1 text-xs"
                    onClick={() => {
                      setSelectedMainGenre(null);
                      setSelectedSubGenre(null);
                      setSelectedSimilarGenres([]);
                    }}
                  >
                    {selectedMainGenre}
                    <span className="cursor-pointer">×</span>
                  </Badge>
                )}
                
                {selectedSubGenre && (
                  <Badge 
                    className="pink-gradient text-white flex items-center gap-1 px-2 py-1 text-xs"
                    onClick={() => {
                      setSelectedSubGenre(null);
                      setSelectedSimilarGenres([]);
                    }}
                  >
                    {selectedSubGenre}
                    <span className="cursor-pointer">×</span>
                  </Badge>
                )}
                
                {selectedSimilarGenres.map((genre) => (
                  <Badge 
                    key={genre}
                    className="pink-gradient text-white flex items-center gap-1 px-2 py-1 text-xs"
                    onClick={() => {
                      setSelectedSimilarGenres(prev => prev.filter(g => g !== genre));
                    }}
                  >
                    {genre}
                    <span className="cursor-pointer">×</span>
                  </Badge>
                ))}
              </div>
            )}
            
            {/* Filter results tabs */}
            <div className="mt-6">
              <div className="flex border-b border-[#3E3E3E] mb-4">
                <button className="px-4 py-2 border-b-2 border-white text-white">Artists</button>
                <button className="px-4 py-2 text-[#B3B3B3]">Songs</button>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-[#181818] rounded-lg p-3 overflow-hidden">
                    <div className="aspect-square rounded-lg bg-[#282828] mb-2 overflow-hidden">
                      <div className="w-full h-full bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a]"></div>
                    </div>
                    <h3 className="text-sm font-medium truncate">Artist Name #{i+1}</h3>
                    <p className="text-xs text-[#B3B3B3]">Electronic • Techno</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* Threads tab content */}
        {activeTab === "threads" && (
          <main className="px-4 pt-4 pb-4">
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
          </main>
        )}
        
        {/* What's That Song tab content */}
        {activeTab === "whats-this-song" && (
          <div className="px-4 pt-4 pb-2">
            <h2 className="text-xl font-bold mb-4">What's That Song?</h2>
            
            {/* Create New Request Form */}
            <div className="bg-[#181818] border border-[#3E3E3E] rounded-lg p-4 mb-6">
              <h3 className="font-medium text-lg mb-3">Create New Request</h3>
              <p className="text-[#B3B3B3] text-sm mb-4">
                Heard a track but don't know the name? Fill in as many details as you can to help the community identify it.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-[#B3B3B3] mb-1 block">Possible Artist (if known)</label>
                  <Input 
                    placeholder="Artist name if you have a guess" 
                    className="bg-[#282828] border-[#3E3E3E]"
                  />
                </div>
                
                <div>
                  <label className="text-sm text-[#B3B3B3] mb-1 block">Where did you hear it?</label>
                  <Input 
                    placeholder="Festival, club, radio, etc." 
                    className="bg-[#282828] border-[#3E3E3E]"
                  />
                </div>
                
                <div>
                  <label className="text-sm text-[#B3B3B3] mb-1 block">Description</label>
                  <textarea 
                    placeholder="Describe the sound, tempo, instruments, mood, etc." 
                    className="w-full h-20 bg-[#282828] border border-[#3E3E3E] rounded-md p-2 text-white placeholder:text-[#B3B3B3]"
                  ></textarea>
                </div>
                
                <div>
                  <label className="text-sm text-[#B3B3B3] mb-1 block">Any lyrics you remember?</label>
                  <textarea 
                    placeholder="Type any lyrics you remember hearing" 
                    className="w-full h-20 bg-[#282828] border border-[#3E3E3E] rounded-md p-2 text-white placeholder:text-[#B3B3B3]"
                  ></textarea>
                </div>
                
                <button 
                  className="w-full py-3 pink-gradient rounded-lg text-white font-medium"
                  onClick={() => toast({ title: "Request Posted", description: "Your song request has been posted to the community" })}
                >
                  Post Request
                </button>
              </div>
            </div>
            
            {/* Recent Requests */}
            <div>
              <h3 className="font-medium text-lg mb-4">Recent Requests</h3>
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="bg-[#181818] border border-[#3E3E3E] rounded-lg p-4">
                    <h4 className="font-medium text-white mb-2">
                      Looking for track from Berghain last weekend
                    </h4>
                    <p className="text-sm text-[#B3B3B3] mb-3">
                      Deep techno track, around 130 BPM, had a really distinctive synth melody...
                    </p>
                    <div className="flex items-center justify-between text-xs text-[#B3B3B3]">
                      <span>Posted by @user{i+1} • {i+1}h ago</span>
                      <span>{Math.floor(Math.random() * 10) + 1} responses</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
      
      <BottomNav />
    </div>
  );
}