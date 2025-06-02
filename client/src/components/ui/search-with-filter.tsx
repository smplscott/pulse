import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { SearchIcon, Filter } from "lucide-react";

interface SearchWithFilterProps {
  placeholder: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onFiltersChange?: (filters: {
    selectedMainGenre: string | null;
    selectedSubGenre: string | null;
    selectedGenres: string[];
  }) => void;
}

export default function SearchWithFilter({ 
  placeholder, 
  searchQuery, 
  onSearchChange, 
  onFiltersChange 
}: SearchWithFilterProps) {
  const [showGenreFilter, setShowGenreFilter] = useState(false);
  const [selectedMainGenre, setSelectedMainGenre] = useState<string | null>(null);
  const [selectedSubGenre, setSelectedSubGenre] = useState<string | null>(null);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

  const mainGenres = ["Electronic", "Urban", "Rock", "Pop", "Jazz & Blues", "World"];

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
      subGenres: ["Alternative", "Indie", "Progressive", "Punk", "Metal"],
      similarGenres: {
        "Alternative": ["Grunge", "Britpop", "Post-Rock", "Shoegaze"],
        "Indie": ["Indie Pop", "Indie Folk", "Dream Pop", "Lo-fi"],
        "Progressive": ["Prog Rock", "Art Rock", "Math Rock", "Post-Metal"],
        "Punk": ["Hardcore", "Pop Punk", "Post-Punk", "Ska Punk"],
        "Metal": ["Heavy Metal", "Death Metal", "Black Metal", "Thrash Metal"]
      }
    },
    "Pop": {
      subGenres: ["Mainstream", "Indie Pop", "Synth Pop", "Dance Pop", "Art Pop"],
      similarGenres: {
        "Mainstream": ["Top 40", "Teen Pop", "Adult Contemporary", "Power Pop"],
        "Indie Pop": ["Chamber Pop", "Twee Pop", "Jangle Pop", "Noise Pop"],
        "Synth Pop": ["New Wave", "Electropop", "Darkwave", "Chillwave"],
        "Dance Pop": ["Eurodance", "Hi-NRG", "Italo Disco", "Future Pop"],
        "Art Pop": ["Experimental Pop", "Avant-Pop", "Baroque Pop", "Psychedelic Pop"]
      }
    },
    "Jazz & Blues": {
      subGenres: ["Traditional Jazz", "Modern Jazz", "Blues", "Fusion", "Swing"],
      similarGenres: {
        "Traditional Jazz": ["Dixieland", "Ragtime", "Big Band", "Bebop"],
        "Modern Jazz": ["Cool Jazz", "Hard Bop", "Free Jazz", "Smooth Jazz"],
        "Blues": ["Chicago Blues", "Delta Blues", "Electric Blues", "Blues Rock"],
        "Fusion": ["Jazz Fusion", "Jazz Rock", "Acid Jazz", "Nu Jazz"],
        "Swing": ["Jump Blues", "Western Swing", "Gypsy Jazz", "Electro Swing"]
      }
    },
    "World": {
      subGenres: ["Latin", "African", "Asian", "Celtic", "Middle Eastern"],
      similarGenres: {
        "Latin": ["Salsa", "Reggaeton", "Bossa Nova", "Tango"],
        "African": ["Afrobeat", "Highlife", "Soukous", "Mbaqanga"],
        "Asian": ["J-Pop", "K-Pop", "Bollywood", "Gamelan"],
        "Celtic": ["Irish Traditional", "Scottish Folk", "Breton", "Welsh"],
        "Middle Eastern": ["Arabic Classical", "Persian Traditional", "Turkish Folk", "Klezmer"]
      }
    }
  };

  const selectMainGenre = (genre: string) => {
    setSelectedMainGenre(genre);
    setSelectedSubGenre(null);
    setSelectedGenres([]);
  };

  const selectSubGenre = (genre: string) => {
    setSelectedSubGenre(genre);
    setSelectedGenres([]);
  };

  const toggleSimilarGenre = (genre: string) => {
    setSelectedGenres(prev => 
      prev.includes(genre) 
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  };

  const clearFilters = () => {
    setSelectedMainGenre(null);
    setSelectedSubGenre(null);
    setSelectedGenres([]);
  };

  React.useEffect(() => {
    if (onFiltersChange) {
      onFiltersChange({
        selectedMainGenre,
        selectedSubGenre,
        selectedGenres
      });
    }
  }, [selectedMainGenre, selectedSubGenre, selectedGenres, onFiltersChange]);

  return (
    <div>
      {/* Search bar */}
      <div className="relative flex-1">
        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#B3B3B3]" size={18} />
        <Input
          type="text"
          placeholder={placeholder}
          className="pl-9 pr-12 bg-[#282828] border-[#3E3E3E] text-white placeholder:text-[#B3B3B3]"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        <button 
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#B3B3B3] hover:text-white"
          onClick={() => setShowGenreFilter(!showGenreFilter)}
        >
          <Filter size={18} />
        </button>
      </div>

      {/* Filter dropdown - matches Discover tab styling exactly */}
      {showGenreFilter && (
        <div className="bg-[#121212] px-4 py-3 mb-4 border border-[#3E3E3E] rounded-lg mt-2">
          <div className="mb-3">
            <h3 className="text-white text-xs font-medium mb-2">Genres</h3>
            <div className="flex flex-wrap gap-2">
              {mainGenres.map((genre) => (
                <button
                  key={genre}
                  onClick={() => selectMainGenre(genre)}
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
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
            <div className="mb-3">
              <h3 className="text-white text-xs font-medium mb-2">Sub-Genres</h3>
              <div className="flex flex-wrap gap-2">
                {genreHierarchy[selectedMainGenre].subGenres.map((genre) => (
                  <button
                    key={genre}
                    onClick={() => selectSubGenre(genre)}
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
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
          
          <div className="pt-3 border-t border-[#3E3E3E] flex justify-between items-center">
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
        </div>
      )}
    </div>
  );
}