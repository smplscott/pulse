import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "wouter";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import { Input } from "@/components/ui/input";
import { Song, Playlist } from "@shared/schema";
import { SearchIcon, Music2, ListMusic, Heart, MessageCircle, SlidersHorizontal, List, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useMusic } from "@/hooks/useMusic";

type SongCategoryTab = {
  id: string;
  label: string;
};

export default function Songs() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("your-list");
  const [displayMode, setDisplayMode] = useState<"grid" | "list">("list");
  const { toast } = useToast();
  const { upvoteSong } = useMusic();

  const { data: songs, isLoading: isLoadingSongs } = useQuery<Song[]>({
    queryKey: ["/api/songs"],
  });

  const { data: playlists, isLoading: isLoadingPlaylists } = useQuery<Playlist[]>({
    queryKey: ["/api/playlists"],
  });

  // Filter songs based on search query
  const filteredSongs = songs?.filter(song => 
    song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    song.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (song.features && Array.isArray(song.features) && song.features.some((feature: string) => 
      feature.toLowerCase().includes(searchQuery.toLowerCase())
    )) ||
    (song.genre && song.genre.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  // For handling reactions
  const handleReaction = (e: React.MouseEvent, songId: number, title: string) => {
    e.stopPropagation(); // Prevent row click event
    // In a real app, this would call an API to add reaction
    toast({
      title: "Reaction Added",
      description: `You liked "${title}"`
    });
  };
  
  // For handling comments
  const handleComment = (e: React.MouseEvent, songId: number, title: string) => {
    e.stopPropagation(); // Prevent row click event
    // In a real app, this would open a comment modal or navigate to comments
    toast({
      title: "Comment",
      description: `Add a comment to "${title}"`
    });
  };
  
  // Toggle display mode between grid and list
  const toggleDisplayMode = () => {
    setDisplayMode(prev => prev === "grid" ? "list" : "grid");
  };

  const songCategories: SongCategoryTab[] = [
    { id: "your-list", label: "Your List" },
    { id: "new-unknowns", label: "New Unknowns" },
    { id: "new-favorites", label: "New Favorites" },
    { id: "classics", label: "Classics" },
    { id: "youtube-sets", label: "From YouTube Sets" },
    { id: "live-sets", label: "From Live Sets" },
    { id: "talk-of-town", label: "Talk of the Town" },
    { id: "trending-social", label: "Trending on Social" }
  ];

  const renderSongsList = () => {
    if (isLoadingSongs) {
      return (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      );
    }
    
    if (!filteredSongs || filteredSongs.length === 0) {
      return (
        <div className="text-center py-10">
          <Music2 className="h-12 w-12 text-[#B3B3B3] mx-auto mb-3" />
          <p className="text-[#B3B3B3]">
            {searchQuery ? "No songs found matching your search" : "No songs available in this category"}
          </p>
        </div>
      );
    }

    // For now, show all songs in all categories
    // In a real implementation, we would filter based on the active category
    if (displayMode === "list") {
      // List view (default)
      return (
        <div className="space-y-2">
          {filteredSongs.map((song) => (
            <Link key={song.id} href={`/thread/song_${song.id}`}>
              <div 
                className="bg-[#181818] hover:bg-[#282828] rounded-md p-3 flex items-center cursor-pointer transition"
                onClick={(e) => {
                  // If they click the row, navigate to song detail page
                  window.location.href = `/song/${song.id}`;
                }}
              >
                <div className="w-10 h-10 bg-[#282828] rounded overflow-hidden mr-3 flex-shrink-0">
                  {song.albumArt ? (
                    <img src={song.albumArt} alt={song.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-[#3E3E3E] flex items-center justify-center">
                      <Music2 className="h-5 w-5 text-[#B3B3B3]" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{song.title}</p>
                  <p className="text-xs text-[#B3B3B3] truncate">
                    {song.features && Array.isArray(song.features) && song.features.length > 0
                      ? `${song.artist}, ${song.features.join(", ")}`
                      : song.artist}
                  </p>
                </div>
                
                {/* Right side actions with new icon order: + icon, 😮 reaction, comment */}
                <div className="flex items-center space-x-3 ml-2">
                  {/* Add/Plus button */}
                  <button 
                    className="artist-tab-active px-3 py-1.5 rounded-lg flex items-center justify-center transition hover:opacity-80"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toast({ title: "Added", description: `Added "${song.title}" to your collection` });
                    }}
                  >
                    <Plus className="h-4 w-4 text-white" />
                  </button>
                  
                  {/* Reaction button with emoji */}
                  <button 
                    className="text-lg px-2 py-1 hover:bg-[#3E3E3E] rounded transition"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleReaction(e, song.id, song.title);
                    }}
                  >
                    😮
                  </button>
                  
                  {/* Comment button */}
                  <button 
                    className="w-8 h-8 rounded-full bg-[#282828] flex items-center justify-center hover:bg-[#3E3E3E] transition"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      window.location.href = `/thread/song_${song.id}`;
                    }}
                  >
                    <MessageCircle className="h-4 w-4 text-[#B3B3B3] hover:text-white" />
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      );
    } else {
      // Grid view
      return (
        <div className="grid grid-cols-2 gap-3">
          {filteredSongs.map((song) => (
            <Link key={song.id} href={`/thread/song_${song.id}`}>
              <div 
                className="bg-[#181818] hover:bg-[#282828] rounded-md overflow-hidden cursor-pointer transition flex flex-col"
                onClick={(e) => {
                  // If they click the card, navigate to song detail page
                  window.location.href = `/song/${song.id}`;
                }}
              >
                <div className="w-full aspect-square bg-[#282828] relative">
                  {song.albumArt ? (
                    <img src={song.albumArt} alt={song.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-[#3E3E3E] flex items-center justify-center">
                      <Music2 className="h-10 w-10 text-[#B3B3B3]" />
                    </div>
                  )}
                  
                  {/* Overlay buttons with new order: + icon, 😮 reaction, comment */}
                  <div className="absolute bottom-2 right-2 flex space-x-2">
                    <button 
                      className="w-8 h-8 rounded-full artist-tab-active backdrop-blur-sm flex items-center justify-center hover:opacity-80"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toast({ title: "Added", description: `Added "${song.title}" to your collection` });
                      }}
                    >
                      <Plus className="h-4 w-4 text-white" />
                    </button>
                    <button 
                      className="w-8 h-8 rounded-full bg-[#000000AA] backdrop-blur-sm flex items-center justify-center hover:bg-[#282828] text-sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleReaction(e, song.id, song.title);
                      }}
                    >
                      😮
                    </button>
                    <button 
                      className="w-8 h-8 rounded-full bg-[#000000AA] backdrop-blur-sm flex items-center justify-center hover:bg-[#282828]"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        window.location.href = `/thread/song_${song.id}`;
                      }}
                    >
                      <MessageCircle className="h-4 w-4 text-white" />
                    </button>
                  </div>
                </div>
                
                <div className="p-3">
                  <p className="font-medium text-sm truncate">{song.title}</p>
                  <p className="text-xs text-[#B3B3B3] truncate">
                    {song.features && Array.isArray(song.features) && song.features.length > 0
                      ? `${song.artist}, ${song.features.join(", ")}`
                      : song.artist}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen pb-32">
      <Header />
      
      {/* Song category tabs using the horizontal button style */}
      <div className="px-4 py-2 bg-[#121212]">
        <div className="flex space-x-2 overflow-x-auto scrollbar-hide">
          {songCategories.map((category) => {
            const isActive = activeCategory === category.id;
            return (
              <button
                key={category.id}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap",
                  isActive
                    ? "bg-[#282828] text-white"
                    : "bg-[#181818] border border-[#3E3E3E] text-[#B3B3B3]"
                )}
                onClick={() => setActiveCategory(category.id)}
              >
                {category.label}
              </button>
            );
          })}
        </div>
      </div>
      
      <main className="px-4 py-4">
        <div className="relative mb-4 flex items-center">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#B3B3B3]" size={18} />
            <Input
              type="text"
              placeholder="Search songs, artists, genres..."
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
        
        {/* Add Song CTA button */}
        <Link href="/add-song">
          <button className="w-full pink-gradient pink-gradient-hover text-white rounded-lg py-3 mb-4 flex items-center justify-center">
            <Music2 className="h-5 w-5 mr-2" />
            Add a Song
          </button>
        </Link>
        
        {/* Song list based on selected category */}
        {renderSongsList()}
      </main>
      
      <BottomNav />
    </div>
  );
}