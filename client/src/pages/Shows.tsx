import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import MusicPlayer from "@/components/layout/MusicPlayer";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Search, Ticket, MapPin, Calendar, Plus, AlertCircle, Music2, Star, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Show } from "@shared/schema";

interface ShowWithStats extends Show {
  avgRating: number | null;
  reviewCount: number;
  commentCount: number;
}

interface SetlistFmResult {
  setlistfmId: string;
  artistName: string;
  venueName: string;
  city: string;
  country: string;
  eventDate: string;
}

function formatDate(dateStr: string) {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split("-");
  const d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function ShowCard({
  show, onClick,
}: {
  show: ShowWithStats | SetlistFmResult;
  onClick: () => void;
}) {
  const isLocal = "id" in show;
  const local = isLocal ? (show as ShowWithStats) : null;

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-[#181818] rounded-xl p-4 hover:bg-[#1e1e1e] transition-colors"
    >
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-lg bg-[#0e1a3d] border border-[#5271ff]/20 flex items-center justify-center flex-shrink-0">
          <Ticket className="h-5 w-5 text-[#5271ff]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold text-white truncate">{show.artistName}</p>
            {!isLocal && (
              <span className="text-[10px] bg-[#1a1a3a] text-[#5271ff] px-2 py-0.5 rounded-full flex-shrink-0">
                Setlist.fm
              </span>
            )}
          </div>
          <p className="text-sm text-[#B3B3B3] truncate">{show.venueName}</p>
          <div className="flex items-center flex-wrap gap-3 mt-1.5">
            <span className="flex items-center gap-1 text-xs text-[#666]">
              <MapPin className="h-3 w-3" />
              {show.city}, {show.country}
            </span>
            <span className="flex items-center gap-1 text-xs text-[#666]">
              <Calendar className="h-3 w-3" />
              {formatDate(show.eventDate)}
            </span>
          </div>
          {local && (local.avgRating !== null || local.reviewCount > 0 || local.commentCount > 0) && (
            <div className="flex items-center gap-3 mt-2">
              {local.avgRating !== null && (
                <span className="flex items-center gap-1 text-xs text-[#f5c518]">
                  <Star className="h-3 w-3 fill-[#f5c518]" />
                  {local.avgRating.toFixed(1)}
                  <span className="text-[#555]">({local.reviewCount})</span>
                </span>
              )}
              {local.commentCount > 0 && (
                <span className="flex items-center gap-1 text-xs text-[#555]">
                  <MessageCircle className="h-3 w-3" />
                  {local.commentCount}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

type FilterMode = "all" | "city" | "genre";

export default function Shows() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [prefillArtist, setPrefillArtist] = useState("");
  const [manualForm, setManualForm] = useState({
    artistName: "", venueName: "", city: "", country: "", eventDate: "", notes: "",
  });
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: shows, isLoading: showsLoading } = useQuery<ShowWithStats[]>({
    queryKey: ["/api/shows"],
  });

  const { data: searchData, isFetching: searchLoading } = useQuery<{
    results: SetlistFmResult[];
    error?: string;
  }>({
    queryKey: ["/api/setlistfm/search", searchQuery],
    enabled: searchQuery.length >= 2,
    queryFn: async () => {
      const res = await fetch(`/api/setlistfm/search?artist=${encodeURIComponent(searchQuery)}`);
      return res.json();
    },
  });

  const importShowMutation = useMutation({
    mutationFn: async (data: SetlistFmResult) => {
      const res = await apiRequest("POST", "/api/shows", data);
      return res.json();
    },
    onSuccess: (show: Show) => {
      queryClient.invalidateQueries({ queryKey: ["/api/shows"] });
      navigate(`/shows/${show.id}`);
    },
    onError: () => toast({ title: "Error", description: "Could not load this show", variant: "destructive" }),
  });

  const addShowMutation = useMutation({
    mutationFn: async (data: typeof manualForm) => {
      const { notes, ...rest } = data;
      const res = await apiRequest("POST", "/api/shows", { ...rest, notes: notes || undefined, isManual: true });
      return res.json();
    },
    onSuccess: (show: Show) => {
      queryClient.invalidateQueries({ queryKey: ["/api/shows"] });
      setShowAddDialog(false);
      setManualForm({ artistName: "", venueName: "", city: "", country: "", eventDate: "", notes: "" });
      navigate(`/shows/${show.id}`);
    },
    onError: () => toast({ title: "Error", description: "Could not add show", variant: "destructive" }),
  });

  const handleSearchChange = (val: string) => {
    setSearchInput(val);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => setSearchQuery(val.trim()), 500);
  };

  const openAddDialog = (artist = "") => {
    setPrefillArtist(artist);
    setManualForm(f => ({ ...f, artistName: artist }));
    setShowAddDialog(true);
  };

  const noApiKey = searchData?.error?.includes("not configured");
  const setlistResults = searchData?.results ?? [];
  const isSearching = searchQuery.length >= 2;

  // Derived filter values from local shows
  const allCities = Array.from(new Set((shows ?? []).map(s => s.city))).sort();
  const allGenres = Array.from(
    new Set((shows ?? []).flatMap(s => s.genres ?? []))
  ).sort();

  // Filter local shows
  const filteredShows = (shows ?? []).filter(s => {
    if (isSearching && searchQuery) {
      const q = searchQuery.toLowerCase();
      if (
        !s.artistName.toLowerCase().includes(q) &&
        !s.venueName.toLowerCase().includes(q) &&
        !s.city.toLowerCase().includes(q)
      ) return false;
    }
    if (filterMode === "city" && selectedCity && s.city !== selectedCity) return false;
    if (filterMode === "genre" && selectedGenre && !(s.genres ?? []).includes(selectedGenre)) return false;
    return true;
  });

  const filterChips: { mode: FilterMode; label: string }[] = [
    { mode: "all", label: "All" },
    { mode: "city", label: "By City" },
    { mode: "genre", label: "By Genre" },
  ];

  return (
    <div className="min-h-screen pb-32">
      <Header />
      <main className="px-4 pt-4 max-w-lg mx-auto">
        <div className="flex items-center gap-2 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#555]" />
            <Input
              value={searchInput}
              onChange={e => handleSearchChange(e.target.value)}
              placeholder="Search artist to find shows..."
              className="pl-9 bg-[#181818] border-[#282828] text-white placeholder:text-[#555] focus:border-[#5271ff]"
            />
          </div>
          <button
            onClick={() => openAddDialog()}
            className="w-10 h-10 rounded-lg bg-[#5271ff] flex items-center justify-center flex-shrink-0 hover:bg-[#4060ee] transition-colors"
          >
            <Plus className="h-5 w-5 text-white" />
          </button>
        </div>

        <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide pb-0.5">
          {filterChips.map(({ mode, label }) => (
            <button
              key={mode}
              onClick={() => {
                setFilterMode(mode);
                setSelectedCity(null);
                setSelectedGenre(null);
              }}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                filterMode === mode
                  ? "bg-[#5271ff] text-white"
                  : "bg-[#181818] text-[#B3B3B3] hover:bg-[#282828]"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {filterMode === "city" && allCities.length > 0 && (
          <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide pb-0.5">
            {allCities.map(city => (
              <button
                key={city}
                onClick={() => setSelectedCity(selectedCity === city ? null : city)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
                  selectedCity === city
                    ? "bg-[#c2f970] text-black"
                    : "bg-[#282828] text-[#B3B3B3] hover:bg-[#333]"
                )}
              >
                {city}
              </button>
            ))}
          </div>
        )}

        {filterMode === "genre" && allGenres.length > 0 && (
          <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide pb-0.5">
            {allGenres.map(genre => (
              <button
                key={genre}
                onClick={() => setSelectedGenre(selectedGenre === genre ? null : genre)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
                  selectedGenre === genre
                    ? "bg-[#c2f970] text-black"
                    : "bg-[#282828] text-[#B3B3B3] hover:bg-[#333]"
                )}
              >
                {genre}
              </button>
            ))}
          </div>
        )}

        {isSearching && (
          <div className="mb-6">
            <p className="text-xs text-[#555] uppercase tracking-wider mb-2 font-medium">Setlist.fm results</p>
            {noApiKey ? (
              <div className="bg-[#181818] rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="h-4 w-4 text-[#555] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-[#B3B3B3]">Setlist.fm API key not configured.</p>
                  <p className="text-xs text-[#555] mt-0.5">
                    Add <code className="bg-[#282828] px-1 rounded text-[#B3B3B3]">SETLISTFM_API_KEY</code> as a secret to enable live search.
                  </p>
                </div>
              </div>
            ) : searchLoading ? (
              <div className="space-y-3">
                {[1, 2].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl bg-[#181818]" />)}
              </div>
            ) : setlistResults.length > 0 ? (
              <div className="space-y-2">
                {setlistResults.slice(0, 10).map(r => (
                  <ShowCard
                    key={r.setlistfmId}
                    show={r}
                    onClick={() => importShowMutation.mutate(r)}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-[#181818] rounded-xl p-4">
                <p className="text-sm text-[#666] mb-3">No setlists found for "{searchQuery}".</p>
                <button
                  onClick={() => openAddDialog(searchQuery)}
                  className="flex items-center gap-2 text-sm text-[#5271ff] font-medium hover:text-[#7090ff] transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Can't find it? Add manually
                </button>
              </div>
            )}
          </div>
        )}

        <div>
          <p className="text-xs text-[#555] uppercase tracking-wider mb-2 font-medium">
            {isSearching ? "Community shows" : "Recent shows"}
          </p>
          {showsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl bg-[#181818]" />)}
            </div>
          ) : filteredShows.length > 0 ? (
            <div className="space-y-2">
              {filteredShows.map(show => (
                <ShowCard key={show.id} show={show} onClick={() => navigate(`/shows/${show.id}`)} />
              ))}
            </div>
          ) : (
            <div className="bg-[#181818] rounded-xl p-8 text-center">
              <Music2 className="h-8 w-8 text-[#333] mx-auto mb-3" />
              <p className="text-sm text-[#666] mb-3">No shows found</p>
              <button
                onClick={() => openAddDialog(searchQuery)}
                className="flex items-center gap-2 text-sm text-[#5271ff] font-medium mx-auto hover:text-[#7090ff] transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add manually
              </button>
            </div>
          )}
        </div>
      </main>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-[#181818] border-[#282828] text-white max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle>Add a show manually</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div>
              <Label className="text-xs text-[#B3B3B3] mb-1.5 block">Artist *</Label>
              <Input
                value={manualForm.artistName}
                onChange={e => setManualForm(f => ({ ...f, artistName: e.target.value }))}
                placeholder="e.g. Bicep"
                className="bg-[#282828] border-[#3E3E3E] text-white"
              />
            </div>
            <div>
              <Label className="text-xs text-[#B3B3B3] mb-1.5 block">Venue *</Label>
              <Input
                value={manualForm.venueName}
                onChange={e => setManualForm(f => ({ ...f, venueName: e.target.value }))}
                placeholder="e.g. Fabric"
                className="bg-[#282828] border-[#3E3E3E] text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-[#B3B3B3] mb-1.5 block">City *</Label>
                <Input
                  value={manualForm.city}
                  onChange={e => setManualForm(f => ({ ...f, city: e.target.value }))}
                  placeholder="London"
                  className="bg-[#282828] border-[#3E3E3E] text-white"
                />
              </div>
              <div>
                <Label className="text-xs text-[#B3B3B3] mb-1.5 block">Country *</Label>
                <Input
                  value={manualForm.country}
                  onChange={e => setManualForm(f => ({ ...f, country: e.target.value }))}
                  placeholder="UK"
                  className="bg-[#282828] border-[#3E3E3E] text-white"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs text-[#B3B3B3] mb-1.5 block">Date *</Label>
              <Input
                type="date"
                value={manualForm.eventDate}
                onChange={e => setManualForm(f => ({ ...f, eventDate: e.target.value }))}
                className="bg-[#282828] border-[#3E3E3E] text-white"
              />
            </div>
            <div>
              <Label className="text-xs text-[#B3B3B3] mb-1.5 block">Notes (optional)</Label>
              <Input
                value={manualForm.notes}
                onChange={e => setManualForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="e.g. support acts, special guests..."
                className="bg-[#282828] border-[#3E3E3E] text-white"
              />
            </div>
            <button
              onClick={() => addShowMutation.mutate(manualForm)}
              disabled={
                !manualForm.artistName.trim() ||
                !manualForm.venueName.trim() ||
                !manualForm.city.trim() ||
                !manualForm.country.trim() ||
                !manualForm.eventDate ||
                addShowMutation.isPending
              }
              className="w-full py-2.5 rounded-full bg-[#5271ff] text-white font-semibold text-sm disabled:opacity-40 hover:bg-[#4060ee] transition-colors"
            >
              {addShowMutation.isPending ? "Adding..." : "Add Show"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <MusicPlayer />
      <BottomNav />
    </div>
  );
}
