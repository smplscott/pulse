import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useState } from "react";
import Header from "@/components/layout/Header";
import TabNavigator from "@/components/layout/TabNavigator";
import BottomNav from "@/components/layout/BottomNav";
import SongIdentificationCard from "@/components/cards/SongIdentificationCard";
import { Thread } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { SearchIcon, Filter, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export default function WhatsThisSong() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showGenreFilter, setShowGenreFilter] = useState(false);
  const [selectedMainGenre, setSelectedMainGenre] = useState<string | null>(null);
  const [selectedSubGenre, setSelectedSubGenre] = useState<string | null>(null);
  const [selectedSimilarGenres, setSelectedSimilarGenres] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const tabs = [
    { label: "For You", path: "/" },
    { label: "Discover", path: "/discover" },
    { label: "What's That Song", path: "/whats-this-song" },
    { label: "Live Venues", path: "/venues" },
  ];

  // Genre filters
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

  const { data: threads, isLoading } = useQuery<Thread[]>({
    queryKey: ["/api/threads", "song_request", page],
  });

  const filteredThreads = threads?.filter(thread => {
    // Filter by search query
    if (searchQuery) {
      return thread.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        thread.content.toLowerCase().includes(searchQuery.toLowerCase());
    }

    // Filter by genre if selected
    if (selectedMainGenre) {
      // This is a simplification - in a real app we would have genre data on threads
      // For now, we'll just assume all threads match the genre filter
      return true;
    }

    return true;
  });

  const loadMore = () => {
    setPage(prevPage => prevPage + 1);
    // In a real app, we would check if there are more items to load
    // For demonstration, we'll just pretend there are no more after page 3
    if (page >= 2) {
      setHasMore(false);
    }
  };

  return (
    <div className="min-h-screen pb-32">
      <Header />
      <TabNavigator tabs={tabs} />
      
      <main className="px-4 py-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">What's This Song?</h1>
          <Link href="/whats-this-song">
            <button className="text-[#B3B3B3] hover:text-white text-sm font-medium">View All</button>
          </Link>
        </div>
        
        {/* Search bar with filter button */}
        <div className="relative mb-6 flex items-center gap-2">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#B3B3B3]" size={18} />
            <Input
              type="text"
              placeholder="Search song requests..."
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
          
          <Link href="/create-song-request">
            <button className="w-10 h-10 rounded-lg pink-gradient flex items-center justify-center pink-gradient-hover">
              <Plus size={20} className="text-white" />
            </button>
          </Link>
        </div>
        
        {/* Genre filter panel - only shown when filter button is clicked */}
        {showGenreFilter && (
          <div className="bg-[#121212] px-4 py-3 mb-6 border border-[#3E3E3E] rounded-lg shadow-lg">
            {/* Main Genre selection */}
            <div className="mb-3">
              <h3 className="text-white text-xs font-medium mb-2">Genres</h3>
              <div className="flex overflow-x-auto scrollbar-hide whitespace-nowrap pb-1">
                {genreFilters.map((filter, index) => (
                  <button
                    key={filter.id}
                    className={cn(
                      "mr-2 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0",
                      (selectedMainGenre === filter.label || (!selectedMainGenre && index === 0)) 
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
            
            {/* Sub-Genre selection */}
            {selectedMainGenre && (
              <div className="mb-3">
                <h3 className="text-white text-xs font-medium mb-2">Sub-Genres</h3>
                <div className="flex overflow-x-auto scrollbar-hide whitespace-nowrap pb-1">
                  {subGenreFilters.map((filter) => (
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
            
            {/* Similar Genres multi-select */}
            {selectedSubGenre && (
              <div className="mb-3">
                <h3 className="text-white text-xs font-medium mb-2">Similar Genres</h3>
                <div className="flex flex-wrap gap-2">
                  {similarGenres.map((genre) => {
                    const isSelected = selectedSimilarGenres.includes(genre.label);
                    return (
                      <button
                        key={genre.id}
                        className={cn(
                          "px-3 py-1 rounded-full text-xs font-medium",
                          isSelected
                            ? "pink-gradient text-white" 
                            : "bg-[#282828] text-[#B3B3B3]"
                        )}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedSimilarGenres(prev => 
                              prev.filter(item => item !== genre.label)
                            );
                          } else {
                            setSelectedSimilarGenres(prev => [...prev, genre.label]);
                          }
                        }}
                      >
                        {genre.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Song identification requests */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-40 w-full" />
            ))}
          </div>
        ) : filteredThreads && filteredThreads.length > 0 ? (
          <div className="space-y-4">
            {filteredThreads.map((thread) => (
              <SongIdentificationCard key={thread.id} thread={thread} />
            ))}
            
            {hasMore && (
              <button 
                onClick={loadMore}
                className="w-full py-3 bg-[#181818] border border-[#3E3E3E] rounded-lg text-[#B3B3B3] hover:text-white text-sm font-medium"
              >
                Load More
              </button>
            )}
          </div>
        ) : (
          <div className="bg-[#181818] rounded-lg p-8 text-center">
            <p className="text-lg font-medium">No song identification requests found</p>
            <p className="text-sm text-[#B3B3B3] mt-2 mb-4">Create a new request or adjust your filters</p>
            <Link href="/create-song-request">
              <button className="pink-gradient pink-gradient-hover text-white py-2 px-6 rounded-full font-medium text-sm">
                Create a Request
              </button>
            </Link>
          </div>
        )}
      </main>
      
      <BottomNav />
    </div>
  );
}
