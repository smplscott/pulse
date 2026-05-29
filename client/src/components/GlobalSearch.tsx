import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Search, X, User, Ticket, Disc, MapPin } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

interface SpotifyArtist { spotifyId: string; name: string; imageUrl: string | null; genres: string[]; }
interface SetlistShow { setlistfmId: string; artistName: string; venueName: string; city: string; country: string; eventDate: string; }
interface SpotifyAlbum { spotifyId: string; name: string; imageUrl: string | null; releaseYear: string; artistName: string; artistSpotifyId: string; }
interface LocalPlace { id: number; name: string; city: string; country: string; category: string; }
interface SearchResults { artists: SpotifyArtist[]; shows: SetlistShow[]; albums: SpotifyAlbum[]; places: LocalPlace[]; }
type FilterType = "all" | "artists" | "shows" | "albums" | "places";

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const [, navigate] = useLocation();

  const handleQueryChange = (value: string) => {
    setQuery(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQuery(value), 300);
  };

  const { data: results, isLoading } = useQuery<SearchResults>({
    queryKey: ["/api/search", debouncedQuery, filter],
    queryFn: () =>
      fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}&type=${filter}`).then(r => r.json()),
    enabled: debouncedQuery.length >= 2,
    staleTime: 30_000,
  });

  const importShowMutation = useMutation({
    mutationFn: async (show: SetlistShow) => {
      const res = await apiRequest("POST", "/api/shows", {
        setlistfmId: show.setlistfmId,
        artistName: show.artistName,
        venueName: show.venueName,
        city: show.city,
        country: show.country,
        eventDate: show.eventDate,
        isManual: false,
      });
      return res.json();
    },
    onSuccess: (imported) => {
      queryClient.invalidateQueries({ queryKey: ["/api/shows"] });
      handleClose();
      navigate(`/shows/${imported.id}`);
    },
  });

  const handleClose = () => {
    setOpen(false);
    setQuery("");
    setDebouncedQuery("");
    setFilter("all");
  };

  const hasResults = results && (
    results.artists.length > 0 || results.shows.length > 0 ||
    results.albums.length > 0 || results.places.length > 0
  );

  const filteredArtists = filter === "all" || filter === "artists" ? (results?.artists ?? []) : [];
  const filteredShows   = filter === "all" || filter === "shows"   ? (results?.shows ?? [])   : [];
  const filteredAlbums  = filter === "all" || filter === "albums"  ? (results?.albums ?? [])  : [];
  const filteredPlaces  = filter === "all" || filter === "places"  ? (results?.places ?? [])  : [];

  const goTo = (path: string) => { handleClose(); navigate(path); };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-[#B3B3B3] hover:text-white"
        aria-label="Search"
      >
        <Search className="h-5 w-5" />
      </button>

      <Dialog open={open} onOpenChange={v => !v && handleClose()}>
        <DialogContent className="bg-[#121212] border-[#3E3E3E] text-white max-w-lg w-full p-0 gap-0 rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-[#2A2A2A]">
            <Search className="h-4 w-4 text-[#B3B3B3] shrink-0" />
            <input
              autoFocus
              value={query}
              onChange={e => handleQueryChange(e.target.value)}
              placeholder="Search artists, shows, albums, places…"
              className="flex-1 bg-transparent text-white placeholder-[#555] outline-none text-sm"
            />
            {query && (
              <button onClick={() => { setQuery(""); setDebouncedQuery(""); }} className="text-[#555] hover:text-white">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {debouncedQuery.length >= 2 && (
            <div className="flex gap-2 px-4 py-2 border-b border-[#2A2A2A] overflow-x-auto scrollbar-hide">
              {(["all", "artists", "shows", "albums", "places"] as FilterType[]).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    "shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors",
                    filter === f ? "bg-gradient-to-r from-[#b388eb] to-[#ff6fd8] text-white" : "bg-[#2A2A2A] text-[#B3B3B3] hover:text-white"
                  )}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          )}

          <div className="max-h-[60vh] overflow-y-auto">
            {isLoading && debouncedQuery.length >= 2 && (
              <div className="p-4 space-y-3">
                {[1, 2, 3, 4].map(i => (
                  <Skeleton key={i} className="h-14 w-full bg-[#2A2A2A] rounded-lg" />
                ))}
              </div>
            )}

            {!isLoading && debouncedQuery.length >= 2 && !hasResults && filter === "all" && (
              <p className="text-center text-[#555] text-sm py-10">No results for "{debouncedQuery}"</p>
            )}

            {!isLoading && debouncedQuery.length >= 2 && filter === "artists" && filteredArtists.length === 0 && (
              <SectionEmpty text="No artists found" />
            )}
            {!isLoading && debouncedQuery.length >= 2 && filter === "shows" && filteredShows.length === 0 && (
              <SectionEmpty text="No shows found" />
            )}
            {!isLoading && debouncedQuery.length >= 2 && filter === "albums" && filteredAlbums.length === 0 && (
              <SectionEmpty text="No albums found" />
            )}
            {!isLoading && debouncedQuery.length >= 2 && filter === "places" && filteredPlaces.length === 0 && (
              <SectionEmpty text="No places found" />
            )}

            {!debouncedQuery && (
              <p className="text-center text-[#555] text-sm py-10">Start typing to search</p>
            )}

            {filteredArtists.length > 0 && (
              <section>
                {filter === "all" && <SectionLabel>Artists</SectionLabel>}
                {filteredArtists.map(a => (
                  <ResultRow
                    key={a.spotifyId}
                    onClick={() => goTo(`/artist/${a.spotifyId}`)}
                    avatar={a.imageUrl ? <img src={a.imageUrl} alt={a.name} className="w-full h-full object-cover" /> : <User className="h-5 w-5 text-[#666]" />}
                    avatarClass="rounded-full"
                    title={a.name}
                    sub={a.genres.join(", ")}
                  />
                ))}
              </section>
            )}

            {filteredShows.length > 0 && (
              <section>
                {filter === "all" && <SectionLabel>Shows</SectionLabel>}
                {filteredShows.map(s => (
                  <ResultRow
                    key={s.setlistfmId}
                    onClick={() => importShowMutation.mutate(s)}
                    disabled={importShowMutation.isPending}
                    avatar={<Ticket className="h-5 w-5 text-[#666]" />}
                    avatarClass="rounded-lg"
                    title={s.artistName}
                    sub={`${s.venueName} · ${s.city}, ${s.country}`}
                    right={<span className="text-xs text-[#555] shrink-0">{s.eventDate}</span>}
                  />
                ))}
              </section>
            )}

            {filteredAlbums.length > 0 && (
              <section>
                {filter === "all" && <SectionLabel>Albums</SectionLabel>}
                {filteredAlbums.map(a => (
                  <ResultRow
                    key={a.spotifyId}
                    onClick={() => goTo(`/album/${a.spotifyId}`)}
                    avatar={a.imageUrl ? <img src={a.imageUrl} alt={a.name} className="w-full h-full object-cover" /> : <Disc className="h-5 w-5 text-[#666]" />}
                    avatarClass="rounded-md"
                    title={a.name}
                    sub={`${a.artistName}${a.releaseYear ? " · " + a.releaseYear : ""}`}
                  />
                ))}
              </section>
            )}

            {filteredPlaces.length > 0 && (
              <section className="pb-2">
                {filter === "all" && <SectionLabel>Places</SectionLabel>}
                {filteredPlaces.map(p => (
                  <ResultRow
                    key={p.id}
                    onClick={() => goTo(`/places/${p.id}`)}
                    avatar={<MapPin className="h-5 w-5 text-[#666]" />}
                    avatarClass="rounded-lg"
                    title={p.name}
                    sub={`${p.city}, ${p.country} · ${p.category.replace("_", " ")}`}
                  />
                ))}
              </section>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="px-4 pt-3 pb-1 text-xs font-semibold text-[#555] uppercase tracking-wider">{children}</p>
  );
}

function SectionEmpty({ text }: { text: string }) {
  return (
    <p className="text-center text-[#555] text-sm py-10">{text}</p>
  );
}

interface ResultRowProps {
  onClick: () => void;
  disabled?: boolean;
  avatar: React.ReactNode;
  avatarClass?: string;
  title: string;
  sub?: string;
  right?: React.ReactNode;
}
function ResultRow({ onClick, disabled, avatar, avatarClass, title, sub, right }: ResultRowProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#1A1A1A] transition-colors disabled:opacity-50 text-left"
    >
      <div className={cn("w-10 h-10 bg-[#2A2A2A] flex items-center justify-center shrink-0 overflow-hidden", avatarClass)}>
        {avatar}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{title}</p>
        {sub && <p className="text-xs text-[#B3B3B3] truncate">{sub}</p>}
      </div>
      {right}
    </button>
  );
}
