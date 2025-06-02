import { useState } from "react";
import { Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface AdvancedGenreFilterProps {
  onFiltersChange: (filters: {
    selectedMainGenre: string | null;
    selectedSubGenre: string | null;
    selectedGenres: string[];
  }) => void;
}

export default function AdvancedGenreFilter({ onFiltersChange }: AdvancedGenreFilterProps) {
  const [showGenreFilter, setShowGenreFilter] = useState(false);
  const [selectedMainGenre, setSelectedMainGenre] = useState<string | null>(null);
  const [selectedSubGenre, setSelectedSubGenre] = useState<string | null>(null);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

  // Genre hierarchy from Discover page
  const genreHierarchy: { [key: string]: { subGenres: string[]; similarGenres: { [key: string]: string[] } } } = {
    "Electronic": {
      subGenres: ["House", "Techno", "Trance", "Drum & Bass", "Ambient"],
      similarGenres: {
        "House": ["Deep House", "Tech House", "Progressive House", "Tropical House"],
        "Techno": ["Minimal Techno", "Industrial Techno", "Acid Techno", "Detroit Techno"],
        "Trance": ["Progressive Trance", "Uplifting Trance", "Psytrance", "Vocal Trance"],
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

  const mainGenres = Object.keys(genreHierarchy);

  const selectMainGenre = (genre: string) => {
    setSelectedMainGenre(genre);
    setSelectedSubGenre(null);
    setSelectedGenres([]);
    onFiltersChange({
      selectedMainGenre: genre,
      selectedSubGenre: null,
      selectedGenres: []
    });
  };

  const selectSubGenre = (genre: string) => {
    setSelectedSubGenre(genre);
    setSelectedGenres([]);
    onFiltersChange({
      selectedMainGenre,
      selectedSubGenre: genre,
      selectedGenres: []
    });
  };

  const toggleSimilarGenre = (genre: string) => {
    const newSelectedGenres = selectedGenres.includes(genre)
      ? selectedGenres.filter(g => g !== genre)
      : [...selectedGenres, genre];
    
    setSelectedGenres(newSelectedGenres);
    onFiltersChange({
      selectedMainGenre,
      selectedSubGenre,
      selectedGenres: newSelectedGenres
    });
  };

  const clearFilters = () => {
    setSelectedMainGenre(null);
    setSelectedSubGenre(null);
    setSelectedGenres([]);
    onFiltersChange({
      selectedMainGenre: null,
      selectedSubGenre: null,
      selectedGenres: []
    });
  };

  const toggleGenreFilter = () => {
    setShowGenreFilter(!showGenreFilter);
  };

  return (
    <>
      <button 
        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#B3B3B3] hover:text-white"
        onClick={toggleGenreFilter}
      >
        <Filter size={18} />
      </button>

      {showGenreFilter && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[#121212] px-4 py-3 border border-[#3E3E3E] rounded z-50">
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
                className="pink-gradient px-3 py-1 rounded-full text-xs text-white"
                onClick={() => setShowGenreFilter(false)}
              >
                Apply filters
              </button>
            </div>
          )}
        </div>
      )}

      {selectedGenres.length > 0 && !showGenreFilter && (
        <div className="absolute top-full left-0 right-0 mt-2 flex flex-wrap gap-2">
          {selectedGenres.map(genre => (
            <Badge 
              key={genre} 
              className="pink-gradient flex items-center gap-1 px-2 py-1"
              onClick={() => toggleSimilarGenre(genre)}
            >
              {genre}
              <span className="cursor-pointer">×</span>
            </Badge>
          ))}
        </div>
      )}
    </>
  );
}