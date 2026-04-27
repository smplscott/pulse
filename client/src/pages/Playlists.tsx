import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "wouter";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import { Input } from "@/components/ui/input";
import { MusicSet } from "@shared/schema";
import { Disc3, Radio, Youtube, Music2, ListMusic, Bookmark, MessageCircle, Smile } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import SearchWithFilter from "@/components/ui/search-with-filter";

type PlaylistCategoryTab = {
  id: string;
  label: string;
};

export default function Playlists() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [displayMode, setDisplayMode] = useState<"grid" | "list">("list");
  const [selectedMainGenre, setSelectedMainGenre] = useState<string | null>(null);
  const [selectedSubGenre, setSelectedSubGenre] = useState<string | null>(null);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const { toast } = useToast();

  const { data: playlists, isLoading: isLoadingPlaylists } = useQuery<MusicSet[]>({
    queryKey: ["/api/sets"],
  });

  // Filter playlists based on search query
  const filteredPlaylists = playlists?.filter(playlist => 
    playlist.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    playlist.curator.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // For handling reactions
  const handleReaction = (e: React.MouseEvent, playlistId: number, title: string) => {
    e.stopPropagation(); // Prevent row click event
    e.preventDefault(); // Prevent navigation
    // In a real app, this would call an API to add reaction
    toast({
      title: "Playlist Liked",
      description: `You liked "${title}"`
    });
  };
  
  // For handling comments
  const handleComment = (e: React.MouseEvent, playlistId: number, title: string) => {
    e.stopPropagation(); // Prevent row click event
    e.preventDefault(); // Prevent navigation
    // Navigate directly to the thread page
    window.location.href = `/thread/playlist_${playlistId}`;
  };
  
  // Toggle display mode between grid and list
  const toggleDisplayMode = () => {
    setDisplayMode(prev => prev === "grid" ? "list" : "grid");
  };

  const setCategories = [
    { id: "all", label: "All", icon: <Disc3 className="w-4 h-4 mr-2" /> },
    { id: "live", label: "Live Performances", icon: <Radio className="w-4 h-4 mr-2" /> },
    { id: "youtube", label: "YouTube", icon: <Youtube className="w-4 h-4 mr-2" /> },
    { id: "soundcloud", label: "Soundcloud", icon: <Music2 className="w-4 h-4 mr-2" /> },
  ];

  const renderPlaylistsList = () => {
    if (isLoadingPlaylists) {
      return (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      );
    }
    
    if (!filteredPlaylists || filteredPlaylists.length === 0) {
      return (
        <div className="text-center py-10">
          <ListMusic className="h-12 w-12 text-[#B3B3B3] mx-auto mb-3" />
          <p className="text-[#B3B3B3]">
            {searchQuery ? "No playlists found matching your search" : "No playlists available in this category"}
          </p>
        </div>
      );
    }
    
    // For now, show all playlists in all categories
    // In a real implementation, we would filter based on the active category
    if (displayMode === "list") {
      // List view (default)
      return (
        <div className="space-y-2">
          {filteredPlaylists.map((playlist) => (
            <Link 
              key={playlist.id} 
              href={`/thread/playlist_${playlist.id}`}
            >
              <div className="bg-[#181818] hover:bg-[#282828] rounded-md p-3 flex items-center cursor-pointer transition">
                <div className="w-10 h-10 bg-[#282828] rounded overflow-hidden mr-3 flex-shrink-0">
                  {playlist.image ? (
                    <img src={playlist.image} alt={playlist.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-[#3E3E3E] flex items-center justify-center">
                      <ListMusic className="h-5 w-5 text-[#B3B3B3]" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{playlist.title}</p>
                  <p className="text-xs text-[#B3B3B3] truncate">
                    {Array.isArray(playlist.songs) ? playlist.songs.length : 0} tracks • {playlist.curator}
                  </p>
                </div>
                
                {/* Right side actions with soft grey formatting */}
                <div className="flex items-center space-x-0.5 ml-1">
                  {/* Add/Plus button */}
                  <button 
                    className="w-8 h-8 rounded-full bg-[#282828] flex items-center justify-center hover:bg-[#3E3E3E] transition"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toast({ title: "Added", description: `Added "${playlist.title}" to your collection` });
                    }}
                  >
                    <Bookmark className="h-4 w-4 text-[#B3B3B3] hover:text-white" />
                  </button>
                  
                  {/* Universal reaction button */}
                  <button 
                    className="w-8 h-8 rounded-full bg-[#282828] flex items-center justify-center hover:bg-[#3E3E3E] transition"
                    onClick={(e) => handleReaction(e, playlist.id, playlist.title)}
                  >
                    <Smile className="h-4 w-4 text-[#B3B3B3] hover:text-white" />
                  </button>
                  
                  {/* Comment button */}
                  <button 
                    className="w-8 h-8 rounded-full bg-[#282828] flex items-center justify-center hover:bg-[#3E3E3E] transition"
                    onClick={(e) => handleComment(e, playlist.id, playlist.title)}
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
          {filteredPlaylists.map((playlist) => (
            <Link
              key={playlist.id}
              href={`/thread/playlist_${playlist.id}`}
            >
              <div className="bg-[#181818] hover:bg-[#282828] rounded-md overflow-hidden cursor-pointer transition flex flex-col">
                <div className="w-full aspect-square bg-[#282828] relative">
                  {playlist.image ? (
                    <img src={playlist.image} alt={playlist.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-[#3E3E3E] flex items-center justify-center">
                      <ListMusic className="h-10 w-10 text-[#B3B3B3]" />
                    </div>
                  )}
                  
                  {/* Overlay buttons with soft grey formatting */}
                  <div className="absolute bottom-2 right-2 flex space-x-0.5">
                    <button 
                      className="w-8 h-8 rounded-full bg-[#000000AA] backdrop-blur-sm flex items-center justify-center hover:bg-[#282828]"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toast({ title: "Added", description: `Added "${playlist.title}" to your collection` });
                      }}
                    >
                      <Bookmark className="h-4 w-4 text-white" />
                    </button>
                    <button 
                      className="w-8 h-8 rounded-full bg-[#000000AA] backdrop-blur-sm flex items-center justify-center hover:bg-[#282828]"
                      onClick={(e) => handleReaction(e, playlist.id, playlist.title)}
                    >
                      <Smile className="h-4 w-4 text-white" />
                    </button>
                    <button 
                      className="w-8 h-8 rounded-full bg-[#000000AA] backdrop-blur-sm flex items-center justify-center hover:bg-[#282828]"
                      onClick={(e) => handleComment(e, playlist.id, playlist.title)}
                    >
                      <MessageCircle className="h-4 w-4 text-white" />
                    </button>
                  </div>
                </div>
                
                <div className="p-3">
                  <p className="font-medium text-sm truncate">{playlist.title}</p>
                  <p className="text-xs text-[#B3B3B3] truncate">
                    {Array.isArray(playlist.songs) ? playlist.songs.length : 0} tracks • {playlist.curator}
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
      
      {/* Playlist category tabs using the horizontal button style */}
      <div className="px-4 pt-4 pb-2 bg-[#121212]">
        <div className="flex space-x-2 overflow-x-auto scrollbar-hide">
          {setCategories.map((category) => {
            const isActive = activeCategory === category.id;
            return (
              <button
                key={category.id}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap flex items-center",
                  isActive
                    ? "bg-[#282828] text-white"
                    : "bg-[#181818] border border-[#3E3E3E] text-[#B3B3B3]"
                )}
                onClick={() => setActiveCategory(category.id)}
              >
                {category.icon}
                {category.label}
              </button>
            );
          })}
        </div>
      </div>
      
      <main className="px-4 pt-2 pb-4">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex-1">
            <SearchWithFilter
              placeholder="Search sets, DJs, genres..."
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onFiltersChange={(filters) => {
                setSelectedMainGenre(filters.selectedMainGenre);
                setSelectedSubGenre(filters.selectedSubGenre);
                setSelectedGenres(filters.selectedGenres);
              }}
            />
          </div>
          <button 
            className="w-10 h-10 rounded-lg pink-gradient flex items-center justify-center pink-gradient-hover flex-shrink-0"
            onClick={() => toast({ title: "Add Set", description: "Add a new set coming soon!" })}
          >
            <span className="text-white text-xl font-bold">+</span>
          </button>
        </div>
        
        {/* Playlist list based on selected category */}
        {renderPlaylistsList()}
      </main>
      
      <BottomNav />
    </div>
  );
}