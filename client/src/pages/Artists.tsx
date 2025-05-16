import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import MusicPlayer from "@/components/layout/MusicPlayer";
import { Input } from "@/components/ui/input";
import { Artist, Song } from "@shared/schema";
import ArtistCard from "@/components/cards/ArtistCard";
import { SearchIcon, User, MusicIcon, PenIcon, SettingsIcon, Heart, MessageCircle, Filter, SlidersHorizontal, List } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type CategoryTab = {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
};

export default function Artists() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("artists");
  const [displayMode, setDisplayMode] = useState<"grid" | "list">("grid");
  const { toast } = useToast();

  const { data: artists, isLoading: isLoadingArtists } = useQuery<Artist[]>({
    queryKey: ["/api/artists"],
  });

  // Get songs to count songs by artist
  const { data: songs } = useQuery<Song[]>({
    queryKey: ["/api/songs"],
  });

  // Count songs by artist
  const getSongCountByArtist = (artistName: string): number => {
    if (!songs) return 0;
    return songs.filter(song => 
      song.artist.toLowerCase() === artistName.toLowerCase() ||
      (song.features && Array.isArray(song.features) && 
       song.features.some(feature => feature.toLowerCase() === artistName.toLowerCase()))
    ).length;
  };

  // Filter artists based on search query
  const filteredArtists = artists?.filter(artist => 
    artist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (artist.genres && Array.isArray(artist.genres) && artist.genres.some((genre: string) => 
      genre.toLowerCase().includes(searchQuery.toLowerCase())
    ))
  );
  
  // For handling reactions
  const handleReaction = (e: React.MouseEvent, artistId: number, artistName: string) => {
    e.stopPropagation(); // Prevent row click event
    toast({
      title: "Reaction Added",
      description: `You liked ${artistName}`
    });
  };
  
  // For handling comments
  const handleComment = (e: React.MouseEvent, artistId: number, artistName: string) => {
    e.stopPropagation(); // Prevent row click event
    toast({
      title: "Comment",
      description: `Add a comment about ${artistName}`
    });
  };
  
  // Toggle display mode between grid and list
  const toggleDisplayMode = () => {
    setDisplayMode(prev => prev === "grid" ? "list" : "grid");
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

  // Artist content type tabs
  const [artistContentTab, setArtistContentTab] = useState("all");
  
  const artistContentTabs = [
    { id: "all", label: "All" },
    { id: "live", label: "Live Performances" },
    { id: "records", label: "Records" },
    { id: "albums", label: "Albums" },
    { id: "features", label: "Features" }
  ];
  
  const renderCategoryContent = () => {
    if (activeCategory === "artists") {
      if (isLoadingArtists) {
        return (
          <>
            {/* Artist content type tabs */}
            <div className="mb-4 flex space-x-2 overflow-x-auto scrollbar-hide">
              {artistContentTabs.map((tab) => (
                <button
                  key={tab.id}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap",
                    artistContentTab === tab.id
                      ? "bg-[#E51D3E] text-white"
                      : "bg-[#181818] text-[#B3B3B3]"
                  )}
                  onClick={() => setArtistContentTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-56 w-full" />
              ))}
            </div>
          </>
        );
      } else if (filteredArtists && filteredArtists.length > 0) {
        // Filter artists based on content type
        // For now, we'll just show all artists regardless of tab
        // In a real implementation, we would filter based on the tab
        
        return (
          <>
            {/* Artist content type tabs */}
            <div className="mb-4 flex space-x-2 overflow-x-auto scrollbar-hide">
              {artistContentTabs.map((tab) => (
                <button
                  key={tab.id}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap",
                    artistContentTab === tab.id
                      ? "bg-[#E51D3E] text-white"
                      : "bg-[#181818] text-[#B3B3B3]"
                  )}
                  onClick={() => setArtistContentTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            
            {artistContentTab === "all" ? (
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
                    <div 
                      key={artist.id}
                      className="bg-[#181818] hover:bg-[#282828] rounded-md p-3 flex items-center cursor-pointer transition"
                      onClick={() => toast({ title: "Artist Details", description: `View details for ${artist.name}` })}
                    >
                      <div className="w-10 h-10 bg-[#282828] rounded-full overflow-hidden mr-3 flex-shrink-0">
                        {artist.profilePicture ? (
                          <img src={artist.profilePicture} alt={artist.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-[#3E3E3E] flex items-center justify-center">
                            <User className="h-5 w-5 text-[#B3B3B3]" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{artist.name}</p>
                        <p className="text-xs text-[#B3B3B3] truncate">
                          {getSongCountByArtist(artist.name)} Tracks
                        </p>
                      </div>
                      
                      {/* Right side actions: genre badge, reactions, comments */}
                      <div className="flex items-center space-x-3 ml-2">
                        <span className="text-xs px-2 py-1 bg-[#282828] rounded-full text-[#B3B3B3]">
                          {artist.name.includes('DJ') ? 'DJ' : 'Artist'}
                        </span>
                        
                        {/* Reaction button */}
                        <button 
                          className="w-8 h-8 rounded-full bg-[#282828] flex items-center justify-center hover:bg-[#3E3E3E] transition"
                          onClick={(e) => handleReaction(e, artist.id, artist.name)}
                        >
                          <Heart className="h-4 w-4 text-[#B3B3B3] hover:text-[#E51D3E]" />
                        </button>
                        
                        {/* Comment button */}
                        <button 
                          className="w-8 h-8 rounded-full bg-[#282828] flex items-center justify-center hover:bg-[#3E3E3E] transition"
                          onClick={(e) => handleComment(e, artist.id, artist.name)}
                        >
                          <MessageCircle className="h-4 w-4 text-[#B3B3B3] hover:text-white" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              <div className="text-center py-10">
                <p className="text-[#B3B3B3]">
                  No content available in the {artistContentTab} category yet.
                </p>
                <p className="text-xs text-[#B3B3B3] mt-2">
                  {artistContentTab === "live" && "Artist live performances and concerts"}
                  {artistContentTab === "records" && "Studio recorded singles and EPs"}
                  {artistContentTab === "albums" && "Full-length album releases"}
                  {artistContentTab === "features" && "Collaborations and featured appearances"}
                </p>
              </div>
            )}
          </>
        );
      } else {
        return (
          <>
            {/* Artist content type tabs */}
            <div className="mb-4 flex space-x-2 overflow-x-auto scrollbar-hide">
              {artistContentTabs.map((tab) => (
                <button
                  key={tab.id}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap",
                    artistContentTab === tab.id
                      ? "bg-[#E51D3E] text-white"
                      : "bg-[#181818] text-[#B3B3B3]"
                  )}
                  onClick={() => setArtistContentTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            
            <div className="text-center py-10">
              <p className="text-[#B3B3B3]">
                {searchQuery ? "No artists found matching your search" : "No artists available"}
              </p>
            </div>
          </>
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
      
      {/* Category tabs using the horizontal button style */}
      <div className="px-4 py-2 bg-[#121212]">
        <div className="flex space-x-2 overflow-x-auto scrollbar-hide">
          {categoryTabs.map((tab) => {
            const isActive = activeCategory === tab.id;
            return (
              <button
                key={tab.id}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap flex items-center",
                  isActive
                    ? "bg-[#282828] text-white"
                    : "bg-[#181818] border border-[#3E3E3E] text-[#B3B3B3]"
                )}
                onClick={() => setActiveCategory(tab.id)}
              >
                {tab.icon}
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
      
      <main className="px-4 py-4">
        <div className="relative mb-6 flex items-center">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#B3B3B3]" size={18} />
            <Input
              type="text"
              placeholder="Search music professionals..."
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
        
        {/* Dynamic content based on selected category */}
        {renderCategoryContent()}
      </main>
      
      <MusicPlayer />
      <BottomNav />
    </div>
  );
}