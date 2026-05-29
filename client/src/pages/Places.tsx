import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import MusicPlayer from "@/components/layout/MusicPlayer";
import { Place } from "@shared/schema";
import { useLocation } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { SearchIcon, MapPin, Star } from "lucide-react";
import { cn } from "@/lib/utils";

const GENRE_OPTIONS = [
  "House", "Techno", "Drum & Bass", "Jungle", "Hip-Hop",
  "R&B", "Soul", "Jazz", "Electronic", "Disco", "Funk",
  "Rock", "Indie", "Pop", "Ambient", "Experimental", "All Genres",
];

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "bar", label: "Bars" },
  { id: "club", label: "Clubs" },
  { id: "record_store", label: "Record Stores" },
  { id: "coffee_shop", label: "Coffee Shops" },
  { id: "other", label: "Other" },
];

function categoryLabel(cat: string) {
  return CATEGORIES.find(c => c.id === cat)?.label ?? cat;
}

function PlaceCard({ place }: { place: Place }) {
  const genres = place.genres ?? [];
  const [, navigate] = useLocation();
  return (
    <div className="bg-[#181818] rounded-xl p-4 flex gap-3">
      <div className="w-12 h-12 rounded-lg bg-[#282828] flex items-center justify-center flex-shrink-0 mt-0.5">
        <MapPin className="h-5 w-5 text-[#c2f970]" />
      </div>
      <div className="flex-1 min-w-0">
        <Link href={`/places/${place.id}`}>
          <div className="cursor-pointer">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-semibold text-sm truncate hover:text-[#c2f970] transition-colors">{place.name}</h3>
                <p className="text-xs text-[#B3B3B3] mt-0.5">{place.city}, {place.country}</p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Star className="h-3 w-3 text-[#c2f970] fill-[#c2f970]" />
                <span className="text-xs text-[#B3B3B3]">{place.rating ?? 0}.0</span>
              </div>
            </div>
            <p className="text-xs text-[#B3B3B3] mt-1 line-clamp-2 leading-relaxed">{place.description}</p>
          </div>
        </Link>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#282828] text-[#B3B3B3]">
              {categoryLabel(place.category)}
            </span>
            {genres.slice(0, 2).map(g => (
              <span key={g} className="text-[10px] px-2 py-0.5 rounded-full bg-[#1a2a1a] text-[#c2f970]">
                {g}
              </span>
            ))}
            {genres.length > 2 && (
              <span className="text-[10px] text-[#666]">+{genres.length - 2}</span>
            )}
          </div>
          <button
            onClick={() => navigate(`/places/${place.id}?dropIn=1`)}
            className="text-xs px-3 py-1 rounded-full bg-gradient-to-r from-[#c2f970] to-[#ecffa1] text-black font-semibold hover:opacity-90 transition-opacity flex-shrink-0 ml-2"
          >
            Drop In
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Places() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  const { data: places, isLoading } = useQuery<Place[]>({
    queryKey: ["/api/places"],
  });

  const filteredPlaces = places?.filter(p => {
    const matchesSearch = !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.genres as string[])?.some(g => g.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = activeCategory === "all" || p.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen pb-32">
      <Header />

      <main className="px-4 pt-4 pb-4">
        <div className="relative mb-4">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#B3B3B3]" />
          <Input
            placeholder="Search by venue, city, genre..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9 bg-[#282828] border-[#3E3E3E] text-white placeholder:text-[#B3B3B3] h-10 text-sm"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 mb-4">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
                activeCategory === cat.id
                  ? "bg-gradient-to-r from-[#b388eb] to-[#ff6fd8] text-white border-transparent"
                  : "bg-[#181818] text-[#B3B3B3] border border-[#3E3E3E]"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        ) : filteredPlaces && filteredPlaces.length > 0 ? (
          <div className="space-y-3">
            {filteredPlaces.map(place => (
              <PlaceCard key={place.id} place={place} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-14 h-14 rounded-full bg-[#181818] flex items-center justify-center mx-auto mb-3">
              <MapPin className="h-6 w-6 text-[#555]" />
            </div>
            <p className="text-[#B3B3B3] text-sm mb-1">
              {searchQuery || activeCategory !== "all" ? "No places found" : "No places yet — be the first to add one"}
            </p>
            {!searchQuery && activeCategory === "all" && (
              <p className="text-xs text-[#555]">Tap the + button to add a place.</p>
            )}
          </div>
        )}
      </main>

      <MusicPlayer />
      <BottomNav />
    </div>
  );
}
