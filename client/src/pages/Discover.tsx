import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import Header from "@/components/layout/Header";
import TabNavigator from "@/components/layout/TabNavigator";
import BottomNav from "@/components/layout/BottomNav";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Artist, Song } from "@shared/schema";
import ArtistCard from "@/components/cards/ArtistCard";
import { SearchIcon, Filter } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

export default function Discover() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("artists");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedMainGenre, setSelectedMainGenre] = useState<string | null>(null);
  const [selectedSubGenre, setSelectedSubGenre] = useState<string | null>(null);
  const [showGenreFilter, setShowGenreFilter] = useState(false);
  const { toast } = useToast();

  const tabs = [
    { label: "For You", path: "/" },
    { label: "Discover", path: "/discover" },
    { label: "Threads", path: "/threads" },
    { label: "What's That Song", path: "/whats-this-song" },
    { label: "Live Venues", path: "/venues" },
  ];
  
  // Define the type structure for our genre hierarchy
  type GenreHierarchy = {
    [mainGenre: string]: {
      subGenres: string[];
      similarGenres: {
        [subGenre: string]: string[];
      };
    };
  };
  
  // Hierarchical genre structure
  const genreHierarchy: GenreHierarchy = {
    "Electronic": {
      subGenres: ["Techno", "House", "Trance", "Ambient", "Drum & Bass"],
      similarGenres: {
        "Techno": ["Industrial", "Minimal Techno", "Hard Techno", "Acid"],
        "House": ["Deep House", "Tech House", "Progressive House", "Disco House"],
        "Trance": ["Progressive Trance", "Psytrance", "Uplifting Trance", "Vocal Trance"],
        "Ambient": ["Chillout", "Downtempo", "IDM", "Ambient Dub"],
        "Drum & Bass": ["Jungle", "Liquid Funk", "Neurofunk", "Jump Up"]
      }
    },
    "Urban": {
      subGenres: ["Hip Hop", "R&B", "Soul", "Funk", "Trap"],
      similarGenres: {
        "Hip Hop": ["Rap", "Boom Bap", "Conscious Hip Hop", "Alternative Hip Hop"],
        "R&B": ["Contemporary R&B", "Neo Soul", "Quiet Storm", "New Jack Swing"],
        "Soul": ["Southern Soul", "Deep Soul", "Northern Soul", "Psychedelic Soul"],
        "Funk": ["P-Funk", "Funk Rock", "Electro-Funk", "G-Funk"],
        "Trap": ["Drill", "Trap Soul", "Latin Trap", "UK Drill"]
      }
    },
    "Rock": {
      subGenres: ["Alternative", "Metal", "Indie", "Punk", "Classic Rock"],
      similarGenres: {
        "Alternative": ["Grunge", "Post-Rock", "Shoegaze", "Math Rock"],
        "Metal": ["Heavy Metal", "Thrash Metal", "Death Metal", "Black Metal"],
        "Indie": ["Indie Pop", "Indie Folk", "Dream Pop", "Post-Punk Revival"],
        "Punk": ["Hardcore", "Pop Punk", "Post-Punk", "Emo"],
        "Classic Rock": ["Progressive Rock", "Blues Rock", "Psychedelic Rock", "Hard Rock"]
      }
    },
    "Pop": {
      subGenres: ["Mainstream Pop", "Synth Pop", "Art Pop", "K-Pop", "Indie Pop"],
      similarGenres: {
        "Mainstream Pop": ["Dance Pop", "Electropop", "Teen Pop", "Bubblegum Pop"],
        "Synth Pop": ["New Wave", "Synthwave", "Future Pop", "Electro Pop"],
        "Art Pop": ["Chamber Pop", "Baroque Pop", "Avant-Pop", "Experimental Pop"],
        "K-Pop": ["J-Pop", "Mandopop", "C-Pop", "T-Pop"],
        "Indie Pop": ["Bedroom Pop", "Dream Pop", "Twee Pop", "Synthpop"]
      }
    },
    "Jazz & Blues": {
      subGenres: ["Jazz", "Blues", "Fusion", "Big Band", "Swing"],
      similarGenres: {
        "Jazz": ["Bebop", "Cool Jazz", "Modal Jazz", "Free Jazz"],
        "Blues": ["Delta Blues", "Chicago Blues", "Jump Blues", "Electric Blues"],
        "Fusion": ["Jazz Fusion", "Soul Jazz", "Jazz-Funk", "Nu Jazz"],
        "Big Band": ["Orchestral Jazz", "Swing", "Dixieland", "Hot Jazz"],
        "Swing": ["Gypsy Jazz", "Western Swing", "Jump Blues", "Boogie-Woogie"]
      }
    },
    "World": {
      subGenres: ["Latin", "African", "Asian", "Middle Eastern", "Celtic"],
      similarGenres: {
        "Latin": ["Salsa", "Reggaeton", "Cumbia", "Bachata"],
        "African": ["Afrobeat", "Highlife", "Soukous", "Amapiano"],
        "Asian": ["Bollywood", "K-Pop", "J-Pop", "Traditional Asian"],
        "Middle Eastern": ["Arabic Pop", "Turkish Pop", "Persian Traditional", "Raï"],
        "Celtic": ["Irish Folk", "Scottish Folk", "Breton Music", "Welsh Folk"]
      }
    }
  };
  
  // Flat list of all main genres
  const mainGenres = Object.keys(genreHierarchy);

  const { data: artists, isLoading: isLoadingArtists } = useQuery<Artist[]>({
    queryKey: ["/api/artists"],
  });

  const { data: songs, isLoading: isLoadingSongs } = useQuery<Song[]>({
    queryKey: ["/api/songs"],
  });
  
  // Helper function for genre filtering
  const filterByGenres = (item: any) => {
    // If no genres are selected, show all items
    if (!selectedGenres.length && !selectedSubGenre && !selectedMainGenre) return true;
    
    // Create an array of all relevant genres to filter by
    const filterGenres = [...selectedGenres];
    
    // If a subgenre is selected, add it to the filter list
    if (selectedSubGenre && !filterGenres.includes(selectedSubGenre)) {
      filterGenres.push(selectedSubGenre);
    }
    
    // If main genre is selected but no subgenre or similar genres,
    // show everything from that main category
    if (selectedMainGenre && !selectedSubGenre && !selectedGenres.length) {
      // Get the subgenres for the selected main genre
      const mainGenreEntry = genreHierarchy[selectedMainGenre];
      if (mainGenreEntry) {
        // Check if the item has any genre from the selected main genre's subgenres
        return mainGenreEntry.subGenres.some(subGenre => {
          // Handle different data structures for genres
          if (item.genre && typeof item.genre === 'string') {
            return item.genre.toLowerCase().includes(subGenre.toLowerCase());
          } else if (item.genres && Array.isArray(item.genres)) {
            return item.genres.some((g: string) => 
              g && typeof g === 'string' && g.toLowerCase().includes(subGenre.toLowerCase())
            );
          }
          return false;
        });
      }
    }
    
    // If no genres to filter by after all checks, show all items
    if (filterGenres.length === 0) return true;
    
    // Check if the item matches any of the selected genres
    if (item.genre && typeof item.genre === 'string') {
      return filterGenres.some(genre => 
        item.genre.toLowerCase().includes(genre.toLowerCase())
      );
    } else if (item.genres && Array.isArray(item.genres)) {
      return filterGenres.some(genre => 
        item.genres.some((g: string) => 
          g && typeof g === 'string' && g.toLowerCase().includes(genre.toLowerCase())
        )
      );
    }
    
    return false;
  };
  
  // Genre selection handlers
  const selectMainGenre = (genre: string) => {
    setSelectedMainGenre(genre);
    setSelectedSubGenre(null);
  };
  
  const selectSubGenre = (genre: string) => {
    setSelectedSubGenre(genre);
  };
  
  const toggleSimilarGenre = (genre: string) => {
    setSelectedGenres(prev => 
      prev.includes(genre)
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  };
  
  const clearFilters = () => {
    setSelectedGenres([]);
    setSelectedMainGenre(null);
    setSelectedSubGenre(null);
  };
  
  // Toggle genre filter visibility
  const toggleGenreFilter = () => {
    setShowGenreFilter(prev => !prev);
  };

  // Filter artists based on search query and genres
  const filteredArtists = artists?.filter(
    (artist) => {
      const matchesSearch = searchQuery === "" || 
        artist.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesSearch && filterByGenres(artist);
    }
  );

  // Filter songs based on search query and genres
  const filteredSongs = songs?.filter(
    (song) => {
      const matchesSearch = searchQuery === "" || 
        song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        song.artist.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesSearch && filterByGenres(song);
    }
  );

  return (
    <div className="min-h-screen pb-32">
      <Header />
      <TabNavigator tabs={tabs} />
      
      <main className="px-4 py-4">
        <div className="flex items-center mb-6">
          <div className="flex-1 relative flex">
            <div className="flex-1 relative">
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
                onClick={toggleGenreFilter}
              >
                <Filter size={18} />
              </button>
            </div>
          </div>
          <button 
            className="ml-2 w-10 h-10 rounded-lg pink-gradient flex items-center justify-center pink-gradient-hover"
            onClick={() => toast({ title: "Create Content", description: "Create new content feature coming soon!" })}
          >
            <span className="text-white text-xl font-bold">+</span>
          </button>
        </div>
        
        {showGenreFilter && (
          <div className="bg-[#121212] px-4 py-3 mb-4 border border-[#3E3E3E] rounded">
            <div className="mb-4">
              <h3 className="text-white text-sm font-medium mb-2">Genres</h3>
              <div className="overflow-x-auto scrollbar-hide whitespace-nowrap pb-2">
                {mainGenres.map((genre) => (
                  <button
                    key={genre}
                    onClick={() => selectMainGenre(genre)}
                    className={`mr-3 px-4 py-1.5 rounded-full text-sm font-medium inline-block ${
                      selectedMainGenre === genre 
                        ? "pink-gradient text-white" 
                        : "bg-[#282828] text-[#B3B3B3]"
                    }`}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </div>
            
            {selectedMainGenre && genreHierarchy[selectedMainGenre] && (
              <div className="mb-4">
                <h3 className="text-white text-sm font-medium mb-2">Sub-Genres</h3>
                <div className="overflow-x-auto scrollbar-hide whitespace-nowrap pb-2">
                  {genreHierarchy[selectedMainGenre].subGenres.map((genre) => (
                    <button
                      key={genre}
                      onClick={() => selectSubGenre(genre)}
                      className={`mr-3 px-4 py-1.5 rounded-full text-sm font-medium inline-block ${
                        selectedSubGenre === genre 
                          ? "pink-gradient text-white" 
                          : "bg-[#282828] text-[#B3B3B3]"
                      }`}
                    >
                      {genre}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {selectedSubGenre && selectedMainGenre && 
             genreHierarchy[selectedMainGenre] && 
             genreHierarchy[selectedMainGenre].similarGenres[selectedSubGenre] && (
              <div className="mb-2">
                <h3 className="text-white text-sm font-medium mb-2">Similar Genres</h3>
                <div className="flex flex-wrap gap-2">
                  {genreHierarchy[selectedMainGenre].similarGenres[selectedSubGenre].map((genre) => (
                    <Badge 
                      key={genre} 
                      className={`flex items-center gap-1 px-3 py-1.5 cursor-pointer ${
                        selectedGenres.includes(genre) 
                          ? "pink-gradient text-white" 
                          : "bg-[#282828] text-[#B3B3B3]"
                      }`}
                      onClick={() => toggleSimilarGenre(genre)}
                    >
                      {genre}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {(selectedMainGenre || selectedSubGenre || selectedGenres.length > 0) && (
              <div className="mt-3 pt-3 border-t border-[#3E3E3E] flex justify-between items-center">
                <button 
                  className="text-xs text-[#B3B3B3] hover:text-white"
                  onClick={clearFilters}
                >
                  Clear all filters
                </button>
                
                <button 
                  className="border border-white px-3 py-1 rounded-full text-xs text-white hover:bg-white hover:text-black transition-colors"
                  onClick={() => setShowGenreFilter(false)}
                >
                  Apply filters
                </button>
              </div>
            )}
          </div>
        )}
        
        {selectedGenres.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {selectedGenres.map(genre => (
              <Badge 
                key={genre} 
                className="green-gradient flex items-center gap-1 px-2 py-1"
                onClick={() => toggleSimilarGenre(genre)}
              >
                {genre}
                <span className="cursor-pointer">×</span>
              </Badge>
            ))}
          </div>
        )}
        
        <Tabs defaultValue="artists" className="mb-6" onValueChange={setActiveTab}>
          <TabsList className="w-full bg-[#181818] border border-[#3E3E3E]">
            <TabsTrigger value="artists" className="flex-1">Artists</TabsTrigger>
            <TabsTrigger value="songs" className="flex-1">Songs</TabsTrigger>
          </TabsList>
          
          <TabsContent value="artists" className="mt-4">
            {isLoadingArtists ? (
              <div className="grid grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-56 w-full" />
                ))}
              </div>
            ) : filteredArtists && filteredArtists.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {filteredArtists.map((artist) => (
                  <ArtistCard key={artist.id} artist={artist} />
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-[#B3B3B3]">
                  {searchQuery ? "No artists found matching your search" : "No artists available"}
                </p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="songs" className="mt-4">
            {isLoadingSongs ? (
              <div className="grid grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-56 w-full" />
                ))}
              </div>
            ) : filteredSongs && filteredSongs.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {filteredSongs.map((song) => (
                  <div key={song.id} className="bg-[#181818] rounded-lg p-3 cursor-pointer transition-all hover:bg-[#282828]">
                    <div className="relative aspect-square mb-3 bg-[#282828] rounded overflow-hidden">
                      {song.albumArt ? (
                        <img 
                          src={song.albumArt}
                          alt={song.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#B3B3B3]">
                          <SearchIcon className="w-10 h-10" />
                        </div>
                      )}
                    </div>
                    <h3 className="font-semibold text-white truncate">{song.title}</h3>
                    <p className="text-sm text-[#B3B3B3] truncate">{song.artist}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-[#B3B3B3]">
                  {searchQuery ? "No songs found matching your search" : "No songs available"}
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
      
      <BottomNav />
    </div>
  );
}