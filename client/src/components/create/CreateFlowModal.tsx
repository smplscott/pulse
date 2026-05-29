import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Place } from "@shared/schema";
import {
  X, ChevronLeft, Search, Music2, Ticket, Disc3,
  MapPin, Calendar, Star, Plus, AlertCircle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

// ─── Types ──────────────────────────────────────────────────────────────────

type FlowStep =
  | "root"
  | "artist"
  | "type"
  | "show"
  | "album"
  | "thread_form"
  | "place_search"
  | "place_form";

type ThreadType = "live_show_review" | "album_review" | "topic";

interface SpotifyArtist {
  spotifyId: string;
  name: string;
  imageUrl: string | null;
  genres: string[];
}

interface SpotifyAlbum {
  spotifyId: string;
  name: string;
  imageUrl: string | null;
  releaseYear: string;
  albumType: string;
}

interface SetlistShow {
  setlistfmId?: string | null;
  showId?: number;
  artistName: string;
  venueName: string;
  city: string;
  country: string;
  eventDate: string;
}

const threadFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(200),
  content: z.string().min(1, "Please add some details").max(2000),
});

const placeFormSchema = z.object({
  name: z.string().min(2, "Name required"),
  city: z.string().min(1, "City required"),
  country: z.string().min(1, "Country required"),
  category: z.enum(["bar", "club", "record_store", "coffee_shop", "other"]),
  description: z.string().min(10, "Min 10 characters").max(280, "Max 280 characters"),
  mapsLink: z.string().optional(),
});
type PlaceFormValues = z.infer<typeof placeFormSchema>;

const GENRE_OPTIONS = [
  "House", "Techno", "Drum & Bass", "Jungle", "Hip-Hop",
  "R&B", "Soul", "Jazz", "Electronic", "Disco", "Funk",
  "Rock", "Indie", "Pop", "Ambient", "Experimental",
];

function formatDate(dateStr: string) {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  }
  return dateStr;
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(n)}
        >
          <Star className={cn("h-8 w-8 transition-colors",
            (hovered || value) >= n ? "text-yellow-400 fill-yellow-400" : "text-[#3E3E3E]"
          )} />
        </button>
      ))}
    </div>
  );
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function CreateFlowModal({ open, onOpenChange }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // Step state
  const [step, setStep] = useState<FlowStep>("root");

  // Artist-path state
  const [artistInput, setArtistInput] = useState("");
  const [artistQuery, setArtistQuery] = useState("");
  const [selectedArtist, setSelectedArtist] = useState<SpotifyArtist | null>(null);
  const [freeformArtist, setFreeformArtist] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<ThreadType | null>(null);
  const [selectedShow, setSelectedShow] = useState<SetlistShow | null>(null);
  const [selectedAlbum, setSelectedAlbum] = useState<SpotifyAlbum | null>(null);
  const [starRating, setStarRating] = useState(0);
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualShow, setManualShow] = useState({
    artistName: "", venueName: "", city: "", country: "", eventDate: "",
  });

  // Place-path state
  const [placeQuery, setPlaceQuery] = useState("");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Forms
  const threadForm = useForm({
    resolver: zodResolver(threadFormSchema),
    defaultValues: { title: "", content: "" },
  });

  const placeForm = useForm<PlaceFormValues>({
    resolver: zodResolver(placeFormSchema),
    defaultValues: {
      name: "", city: "", country: "", category: "club", description: "", mapsLink: "",
    },
  });

  // ── Reset & close ─────────────────────────────────────────────────────────

  function handleClose() {
    onOpenChange(false);
    setTimeout(() => {
      setStep("root");
      setArtistInput(""); setArtistQuery("");
      setSelectedArtist(null); setFreeformArtist(null);
      setSelectedType(null); setSelectedShow(null); setSelectedAlbum(null);
      setStarRating(0); setShowManualForm(false);
      setManualShow({ artistName: "", venueName: "", city: "", country: "", eventDate: "" });
      setPlaceQuery(""); setSelectedGenres([]);
      threadForm.reset(); placeForm.reset();
    }, 300);
  }

  // ── Queries ───────────────────────────────────────────────────────────────

  const { data: spotifyData, isFetching: spotifySearching } = useQuery<{
    results: SpotifyArtist[]; error?: string;
  }>({
    queryKey: ["/api/spotify/artists/search", artistQuery],
    queryFn: async () => {
      const res = await fetch(`/api/spotify/artists/search?q=${encodeURIComponent(artistQuery)}`);
      return res.json();
    },
    enabled: artistQuery.length >= 2,
  });

  const artistDisplayName = selectedArtist?.name || freeformArtist || "";

  const { data: albumsData, isLoading: albumsLoading } = useQuery<{
    results: SpotifyAlbum[]; error?: string;
  }>({
    queryKey: ["/api/spotify/artists", selectedArtist?.spotifyId, "albums"],
    queryFn: async () => {
      const res = await fetch(`/api/spotify/artists/${selectedArtist!.spotifyId}/albums`);
      return res.json();
    },
    enabled: step === "album" && !!selectedArtist?.spotifyId,
  });

  const { data: setlistData, isFetching: setlistSearching } = useQuery<{
    results: SetlistShow[]; error?: string;
  }>({
    queryKey: ["/api/setlistfm/search", artistDisplayName],
    queryFn: async () => {
      const res = await fetch(`/api/setlistfm/search?artist=${encodeURIComponent(artistDisplayName)}`);
      return res.json();
    },
    enabled: step === "show" && artistDisplayName.length >= 2,
  });

  const { data: communityShows } = useQuery<{
    id: number; artistName: string; venueName: string; city: string; country: string; eventDate: string;
  }[]>({
    queryKey: ["/api/shows", { q: artistDisplayName }],
    queryFn: async () => {
      const res = await fetch(`/api/shows?q=${encodeURIComponent(artistDisplayName)}`);
      return res.json();
    },
    enabled: step === "show" && artistDisplayName.length >= 2,
  });

  const { data: allPlaces } = useQuery<Place[]>({
    queryKey: ["/api/places"],
    enabled: step === "place_search",
  });

  const placeResults = placeQuery.trim().length >= 1
    ? (allPlaces ?? []).filter(p =>
        p.name.toLowerCase().includes(placeQuery.toLowerCase()) ||
        p.city.toLowerCase().includes(placeQuery.toLowerCase())
      )
    : [];

  // ── Mutations ─────────────────────────────────────────────────────────────

  const importShowMutation = useMutation({
    mutationFn: async (show: SetlistShow) => {
      const res = await apiRequest("POST", "/api/shows", show);
      return res.json();
    },
  });

  const threadMutation = useMutation({
    mutationFn: async (values: { title: string; content: string }) => {
      let resolvedShowId: number | null = null;
      if (selectedType === "live_show_review" && selectedShow) {
        if (selectedShow.showId) {
          resolvedShowId = selectedShow.showId;
        } else {
          try {
            const imported = await importShowMutation.mutateAsync(selectedShow);
            resolvedShowId = imported.id;
          } catch { /* proceed without showId */ }
        }
      }
      const res = await apiRequest("POST", "/api/threads", {
        title: values.title,
        content: values.content,
        type: "discussion",
        threadType: selectedType || "topic",
        starRating: (selectedType === "live_show_review" || selectedType === "album_review")
          ? (starRating || null) : null,
        showId: resolvedShowId,
        albumId: selectedType === "album_review" ? (selectedAlbum?.spotifyId || null) : null,
        albumName: selectedType === "album_review" ? (selectedAlbum?.name || null) : null,
        artistName: artistDisplayName || null,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to post thread");
      }
      return res.json();
    },
    onSuccess: async (thread) => {
      await queryClient.invalidateQueries({ queryKey: ["/api/threads/featured"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/threads"] });
      if (user) {
        await queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}/threads/engaged`] });
        await queryClient.invalidateQueries({ queryKey: [`/api/users/username/${user.username}`] });
      }
      toast({ title: "Thread posted!" });
      handleClose();
      navigate(`/thread/${thread.id}`);
    },
    onError: (err: Error) =>
      toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const placeMutation = useMutation({
    mutationFn: async (values: PlaceFormValues & { genres: string[] }) => {
      const res = await apiRequest("POST", "/api/places", values);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to add place");
      }
      return res.json();
    },
    onSuccess: async (place: Place) => {
      await queryClient.invalidateQueries({ queryKey: ["/api/places"] });
      if (user?.username) {
        await queryClient.invalidateQueries({ queryKey: [`/api/users/username/${user.username}`] });
      }
      toast({ title: "Place added!", description: "You're the first to post here." });
      handleClose();
      navigate(`/places/${place.id}`);
    },
    onError: (err: Error) =>
      toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  // ── Navigation helpers ────────────────────────────────────────────────────

  function handleArtistInputChange(val: string) {
    setArtistInput(val);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => setArtistQuery(val.trim()), 400);
  }

  function selectArtist(artist: SpotifyArtist) {
    setSelectedArtist(artist); setFreeformArtist(null); setStep("type");
  }

  function proceedWithFreeform() {
    if (!artistInput.trim()) return;
    setFreeformArtist(artistInput.trim()); setSelectedArtist(null); setStep("type");
  }

  function selectType(type: ThreadType) {
    setSelectedType(type);
    if (type === "live_show_review") setStep("show");
    else if (type === "album_review") setStep("album");
    else setStep("thread_form");
  }

  function selectShow(show: SetlistShow) { setSelectedShow(show); setStep("thread_form"); }
  function selectAlbum(album: SpotifyAlbum) { setSelectedAlbum(album); setStep("thread_form"); }

  function handleBack() {
    if (step === "artist" || step === "place_search") setStep("root");
    else if (step === "type") { setStep("artist"); setSelectedArtist(null); setFreeformArtist(null); }
    else if (step === "show") { setStep("type"); setSelectedShow(null); setShowManualForm(false); }
    else if (step === "album") { setStep("type"); setSelectedAlbum(null); }
    else if (step === "thread_form") {
      if (selectedType === "live_show_review") setStep("show");
      else if (selectedType === "album_review") setStep("album");
      else if (!selectedArtist && !freeformArtist) setStep("root");
      else setStep("type");
    }
    else if (step === "place_form") setStep("place_search");
  }

  const artistResults = spotifyData?.results ?? [];

  const stepTitle: Record<FlowStep, string> = {
    root: "What are you adding?",
    artist: "Find the artist",
    type: "What type of thread?",
    show: "Which show?",
    album: "Which album?",
    thread_form: "Write your thread",
    place_search: "Find a place",
    place_form: "Add a place",
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 z-50"
        onClick={handleClose}
      />

      {/* Bottom sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#111] rounded-t-2xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-[#3E3E3E]" />
        </div>

        {/* Header */}
        <div className="flex items-center gap-2 px-4 pt-1 pb-3 flex-shrink-0 border-b border-[#1e1e1e]">
          {step !== "root" && (
            <button
              onClick={handleBack}
              className="p-1.5 hover:bg-[#282828] rounded-lg transition-colors flex-shrink-0"
            >
              <ChevronLeft className="h-5 w-5 text-[#B3B3B3]" />
            </button>
          )}
          <h2 className="font-bold text-white text-base flex-1">{stepTitle[step]}</h2>
          <button
            onClick={handleClose}
            className="p-1.5 hover:bg-[#282828] rounded-lg transition-colors flex-shrink-0"
          >
            <X className="h-5 w-5 text-[#B3B3B3]" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-4 pt-4 pb-10">

          {/* ── ROOT ── */}
          {step === "root" && (
            <div className="space-y-3">
              <button
                onClick={() => setStep("artist")}
                className="w-full text-left p-5 rounded-2xl border border-[#5271ff]/40 bg-[#0d1630] hover:bg-[#142048] transition-colors"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-xl bg-[#5271ff]/20 flex items-center justify-center">
                    <Music2 className="h-5 w-5 text-[#5271ff]" />
                  </div>
                  <p className="font-bold text-white text-base">Artist</p>
                </div>
                <p className="text-sm text-[#B3B3B3] leading-relaxed pl-12">
                  Discuss an artist — review a show, album, or start a thread.
                </p>
              </button>

              <button
                onClick={() => setStep("place_search")}
                className="w-full text-left p-5 rounded-2xl border border-[#c2f970]/25 bg-[#0d1a0d] hover:bg-[#122012] transition-colors"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-xl bg-[#c2f970]/15 flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-[#c2f970]" />
                  </div>
                  <p className="font-bold text-white text-base">Place</p>
                </div>
                <p className="text-sm text-[#B3B3B3] leading-relaxed pl-12">
                  Find or add a music venue, bar, record store, or club.
                </p>
              </button>
            </div>
          )}

          {/* ── ARTIST SEARCH ── */}
          {step === "artist" && (
            <div>
              <p className="text-sm text-[#B3B3B3] mb-3">Search for the artist you want to discuss.</p>

              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B3B3B3] h-4 w-4" />
                <Input
                  autoFocus
                  placeholder="Search artist…"
                  className="pl-9 bg-[#282828] border-[#3E3E3E] text-white placeholder:text-[#555]"
                  value={artistInput}
                  onChange={e => handleArtistInputChange(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && artistInput.trim() && proceedWithFreeform()}
                />
              </div>


              {spotifySearching && (
                <div className="flex justify-center py-4">
                  <div className="w-5 h-5 border-2 border-[#c2f970] border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {!spotifySearching && artistResults.length > 0 && (
                <div className="space-y-1 mb-3">
                  {artistResults.map(a => (
                    <button
                      key={a.spotifyId}
                      onClick={() => selectArtist(a)}
                      className="w-full text-left flex items-center gap-3 p-2.5 rounded-lg hover:bg-[#282828] transition-colors"
                    >
                      {a.imageUrl ? (
                        <img src={a.imageUrl} alt={a.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[#282828] flex items-center justify-center flex-shrink-0">
                          <Music2 className="h-4 w-4 text-[#B3B3B3]" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-white truncate">{a.name}</p>
                        {a.genres.length > 0 && (
                          <p className="text-xs text-[#555] truncate">{a.genres.join(", ")}</p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {artistInput.trim().length >= 1 && (
                <button
                  onClick={proceedWithFreeform}
                  className="w-full py-2.5 rounded-xl border border-[#3E3E3E] hover:border-[#555] transition-colors text-sm text-[#B3B3B3] flex items-center justify-center gap-2 mb-3"
                >
                  <Plus className="h-4 w-4" />
                  Continue with "{artistInput.trim()}"
                </button>
              )}

            </div>
          )}

          {/* ── TYPE PICKER ── */}
          {step === "type" && (
            <div>
              <div className="flex items-center gap-2 p-3 bg-[#282828] rounded-lg mb-4">
                {selectedArtist?.imageUrl ? (
                  <img
                    src={selectedArtist.imageUrl}
                    alt={selectedArtist.name}
                    className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#3E3E3E] flex items-center justify-center flex-shrink-0">
                    <Music2 className="h-4 w-4 text-[#B3B3B3]" />
                  </div>
                )}
                <p className="text-sm font-medium text-white truncate">{artistDisplayName}</p>
              </div>

              <div className="space-y-2">
                {[
                  {
                    id: "live_show_review" as const,
                    label: "Live Show Review",
                    desc: "Review a live performance or concert",
                    Icon: Ticket,
                    color: "text-orange-400",
                    bg: "bg-orange-500/10 border-orange-500/30 hover:border-orange-500/60",
                  },
                  {
                    id: "album_review" as const,
                    label: "Album Review",
                    desc: "Deep-dive on an album or project",
                    Icon: Disc3,
                    color: "text-blue-400",
                    bg: "bg-blue-500/10 border-blue-500/30 hover:border-blue-500/60",
                  },
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => selectType(t.id)}
                    className={cn("w-full text-left p-4 rounded-xl border transition-all", t.bg)}
                  >
                    <div className="flex items-center gap-2 mb-0.5">
                      <t.Icon className={cn("h-4 w-4", t.color)} />
                      <p className={cn("font-semibold text-sm", t.color)}>{t.label}</p>
                    </div>
                    <p className="text-xs text-[#B3B3B3] ml-6">{t.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── SHOW PICKER ── */}
          {step === "show" && (
            <div>
              <p className="text-sm text-[#B3B3B3] mb-3">
                Select the show you attended as <span className="text-white font-medium">{artistDisplayName}</span>.
              </p>

              {communityShows && communityShows.length > 0 && (
                <div className="mb-4">
                  <p className="text-[10px] text-[#555] uppercase tracking-wider font-medium mb-2">On Pulse</p>
                  <div className="space-y-2">
                    {communityShows.slice(0, 5).map(s => (
                      <button
                        key={s.id}
                        onClick={() => selectShow({ showId: s.id, artistName: s.artistName, venueName: s.venueName, city: s.city, country: s.country, eventDate: s.eventDate })}
                        className="w-full text-left bg-[#282828] rounded-lg p-3 hover:bg-[#333] transition-colors"
                      >
                        <p className="text-sm font-medium text-white">{s.venueName}</p>
                        <div className="flex gap-3 mt-1">
                          <span className="flex items-center gap-1 text-xs text-[#555]">
                            <MapPin className="h-3 w-3" />{s.city}, {s.country}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-[#555]">
                            <Calendar className="h-3 w-3" />{formatDate(s.eventDate)}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-[10px] text-[#555] uppercase tracking-wider font-medium mb-2">Setlist.fm</p>

              {setlistSearching && (
                <div className="flex justify-center py-3">
                  <div className="w-5 h-5 border-2 border-[#c2f970] border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {!setlistSearching && setlistData?.error?.includes("not configured") && (
                <div className="flex items-start gap-2 bg-[#1e1e1e] border border-[#333] rounded-lg p-3 mb-3">
                  <AlertCircle className="h-4 w-4 text-[#555] flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-[#666]">Setlist.fm not configured. Add manually below.</p>
                </div>
              )}

              {!setlistSearching && (setlistData?.results ?? []).length > 0 && (
                <div className="space-y-2 mb-3">
                  {(setlistData!.results).slice(0, 8).map(s => (
                    <button
                      key={s.setlistfmId}
                      onClick={() => selectShow(s)}
                      className="w-full text-left bg-[#282828] rounded-lg p-3 hover:bg-[#333] transition-colors"
                    >
                      <p className="text-sm font-medium text-white">{s.venueName}</p>
                      <div className="flex gap-3 mt-1">
                        <span className="flex items-center gap-1 text-xs text-[#555]">
                          <MapPin className="h-3 w-3" />{s.city}, {s.country}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-[#555]">
                          <Calendar className="h-3 w-3" />{formatDate(s.eventDate)}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {!setlistSearching && !setlistData?.error && (setlistData?.results ?? []).length === 0 && (
                <p className="text-xs text-[#555] mb-3">No results from Setlist.fm.</p>
              )}

              {!showManualForm ? (
                <button
                  onClick={() => {
                    setShowManualForm(true);
                    setManualShow(m => ({ ...m, artistName: artistDisplayName }));
                  }}
                  className="flex items-center gap-2 text-sm text-[#5271ff] font-medium hover:text-[#7090ff] transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Can't find it? Add manually
                </button>
              ) : (
                <div className="bg-[#282828] rounded-lg p-3 space-y-2 border border-[#3E3E3E]">
                  <p className="text-xs text-[#B3B3B3] font-medium mb-1">Add show manually</p>
                  <Input
                    value={manualShow.venueName}
                    onChange={e => setManualShow(m => ({ ...m, venueName: e.target.value }))}
                    placeholder="Venue name *"
                    className="bg-[#1a1a1a] border-[#444] text-white text-sm h-8 placeholder:text-[#555]"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={manualShow.city}
                      onChange={e => setManualShow(m => ({ ...m, city: e.target.value }))}
                      placeholder="City *"
                      className="bg-[#1a1a1a] border-[#444] text-white text-sm h-8 placeholder:text-[#555]"
                    />
                    <Input
                      value={manualShow.country}
                      onChange={e => setManualShow(m => ({ ...m, country: e.target.value }))}
                      placeholder="Country *"
                      className="bg-[#1a1a1a] border-[#444] text-white text-sm h-8 placeholder:text-[#555]"
                    />
                  </div>
                  <Input
                    type="date"
                    value={manualShow.eventDate}
                    onChange={e => setManualShow(m => ({ ...m, eventDate: e.target.value }))}
                    className="bg-[#1a1a1a] border-[#444] text-white text-sm h-8"
                  />
                  <button
                    onClick={() => {
                      if (!manualShow.venueName || !manualShow.city || !manualShow.country || !manualShow.eventDate) return;
                      selectShow({ artistName: artistDisplayName, ...manualShow });
                    }}
                    disabled={!manualShow.venueName || !manualShow.city || !manualShow.country || !manualShow.eventDate}
                    className="w-full py-2 rounded-lg bg-[#5271ff] text-white text-sm font-semibold disabled:opacity-40 hover:bg-[#4060ee] transition-colors"
                  >
                    Use this show
                  </button>
                </div>
              )}

              <button
                onClick={() => { setSelectedShow(null); setStep("thread_form"); }}
                className="text-xs text-[#555] hover:text-[#B3B3B3] mt-3 block transition-colors"
              >
                Skip — write without linking a show
              </button>
            </div>
          )}

          {/* ── ALBUM PICKER ── */}
          {step === "album" && (
            <div>
              <p className="text-sm text-[#B3B3B3] mb-3">
                Pick an album by <span className="text-white font-medium">{artistDisplayName}</span>.
              </p>

              {albumsLoading && (
                <div className="flex justify-center py-6">
                  <div className="w-5 h-5 border-2 border-[#c2f970] border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {!albumsLoading && albumsData?.error?.includes("not configured") && (
                <div className="flex items-start gap-2 bg-[#1e1e1e] border border-[#333] rounded-lg p-3 mb-3">
                  <AlertCircle className="h-4 w-4 text-[#555] flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-[#666]">Spotify not configured. Skip to write about any album.</p>
                </div>
              )}

              {!albumsLoading && (albumsData?.results ?? []).length > 0 && (
                <div className="space-y-2 mb-3">
                  {(albumsData!.results).map(a => (
                    <button
                      key={a.spotifyId}
                      onClick={() => selectAlbum(a)}
                      className="w-full text-left flex items-center gap-3 bg-[#282828] rounded-lg p-2.5 hover:bg-[#333] transition-colors"
                    >
                      {a.imageUrl ? (
                        <img src={a.imageUrl} alt={a.name} className="w-11 h-11 rounded object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-11 h-11 rounded bg-[#3E3E3E] flex items-center justify-center flex-shrink-0">
                          <Disc3 className="h-5 w-5 text-[#B3B3B3]" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-white truncate">{a.name}</p>
                        <p className="text-xs text-[#555]">{a.releaseYear}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <button
                onClick={() => { setSelectedAlbum(null); setStep("thread_form"); }}
                className="text-xs text-[#555] hover:text-[#B3B3B3] transition-colors"
              >
                Skip — write without linking an album
              </button>
            </div>
          )}

          {/* ── THREAD FORM ── */}
          {step === "thread_form" && (
            <div>
              {/* Context chips */}
              <div className="flex flex-wrap items-center gap-1.5 mb-4">
                {selectedType && (
                  <span className={cn("text-xs px-2.5 py-1 rounded-full font-medium", {
                    "bg-orange-500/15 text-orange-400": selectedType === "live_show_review",
                    "bg-blue-500/15 text-blue-400": selectedType === "album_review",
                    "bg-purple-500/15 text-purple-400": selectedType === "topic",
                  })}>
                    {selectedType === "live_show_review" ? "Live Show Review"
                      : selectedType === "album_review" ? "Album Review"
                      : "Topic"}
                  </span>
                )}
                {artistDisplayName && (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-[#282828] text-[#B3B3B3]">
                    {artistDisplayName}
                  </span>
                )}
                {selectedShow && (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-[#282828] text-[#B3B3B3] truncate max-w-[180px]">
                    {selectedShow.venueName}
                  </span>
                )}
                {selectedAlbum && (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-[#282828] text-[#B3B3B3] truncate max-w-[180px]">
                    {selectedAlbum.name}
                  </span>
                )}
              </div>

              {/* Star rating */}
              {(selectedType === "live_show_review" || selectedType === "album_review") && (
                <div className="mb-4">
                  <p className="text-xs text-[#B3B3B3] mb-2 font-medium">
                    {selectedType === "live_show_review" ? "Show rating *" : "Album rating *"}
                  </p>
                  <StarPicker value={starRating} onChange={setStarRating} />
                </div>
              )}

              {/* Title */}
              <div className="mb-3">
                <p className="text-xs text-[#B3B3B3] mb-1.5 font-medium">Title *</p>
                <Input
                  {...threadForm.register("title")}
                  placeholder="Give your thread a title…"
                  className="bg-[#282828] border-[#3E3E3E] text-white placeholder:text-[#555]"
                />
                {threadForm.formState.errors.title && (
                  <p className="text-xs text-red-400 mt-1">{threadForm.formState.errors.title.message}</p>
                )}
              </div>

              {/* Body */}
              <div className="mb-4">
                <p className="text-xs text-[#B3B3B3] mb-1.5 font-medium">Your thoughts *</p>
                <Textarea
                  {...threadForm.register("content")}
                  placeholder="Share what you think…"
                  rows={5}
                  className="bg-[#282828] border-[#3E3E3E] text-white placeholder:text-[#555] resize-none"
                />
                {threadForm.formState.errors.content && (
                  <p className="text-xs text-red-400 mt-1">{threadForm.formState.errors.content.message}</p>
                )}
              </div>

              <button
                onClick={threadForm.handleSubmit(vals => {
                  if (!user) return;
                  if ((selectedType === "live_show_review" || selectedType === "album_review") && !starRating) {
                    toast({ title: "Rating required", description: "Please give a star rating.", variant: "destructive" });
                    return;
                  }
                  threadMutation.mutate(vals);
                })}
                disabled={threadMutation.isPending}
                className="w-full py-3 rounded-full bg-[#5271ff] text-white font-bold text-sm disabled:opacity-40 hover:bg-[#4060ee] transition-colors"
              >
                {threadMutation.isPending ? "Posting…" : "Post Thread"}
              </button>
            </div>
          )}

          {/* ── PLACE SEARCH ── */}
          {step === "place_search" && (
            <div>
              <p className="text-sm text-[#B3B3B3] mb-3">
                Search first — we'll check if it's already on Pulse.
              </p>

              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B3B3B3] h-4 w-4" />
                <Input
                  autoFocus
                  placeholder="Search venue name or city…"
                  className="pl-9 bg-[#282828] border-[#3E3E3E] text-white placeholder:text-[#555]"
                  value={placeQuery}
                  onChange={e => setPlaceQuery(e.target.value)}
                />
              </div>

              {placeQuery.trim().length >= 1 && placeResults.length > 0 && (
                <div className="space-y-2 mb-4">
                  {placeResults.slice(0, 6).map(p => (
                    <button
                      key={p.id}
                      onClick={() => { handleClose(); navigate(`/places/${p.id}`); }}
                      className="w-full text-left bg-[#282828] rounded-xl p-3 hover:bg-[#333] transition-colors flex items-center gap-3"
                    >
                      <div className="w-10 h-10 rounded-lg bg-[#1a2a1a] flex items-center justify-center flex-shrink-0">
                        <MapPin className="h-4 w-4 text-[#c2f970]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{p.name}</p>
                        <p className="text-xs text-[#555]">{p.city}, {p.country}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {placeQuery.trim().length >= 2 && placeResults.length === 0 && (
                <div className="bg-[#181818] rounded-xl p-4 border border-[#222]">
                  <p className="text-sm text-[#B3B3B3] mb-3">
                    "<span className="text-white">{placeQuery}</span>" isn't on Pulse yet.
                  </p>
                  <button
                    onClick={() => {
                      placeForm.setValue("name", placeQuery.trim());
                      setStep("place_form");
                    }}
                    className="w-full py-2.5 rounded-xl bg-[#c2f970] text-black font-bold text-sm hover:bg-[#aee05a] transition-colors"
                  >
                    Add it →
                  </button>
                </div>
              )}

              {placeQuery.trim().length >= 2 && placeResults.length > 0 && (
                <div className="border-t border-[#1e1e1e] pt-3">
                  <p className="text-xs text-[#555] mb-2">Not seeing the right place?</p>
                  <button
                    onClick={() => {
                      placeForm.setValue("name", placeQuery.trim());
                      setStep("place_form");
                    }}
                    className="flex items-center gap-2 text-sm text-[#c2f970] font-medium hover:text-[#aee05a] transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Add "{placeQuery}" as a new place
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── PLACE FORM ── */}
          {step === "place_form" && (
            <div className="space-y-3">
              <div>
                <p className="text-xs text-[#B3B3B3] mb-1.5 font-medium">Venue name *</p>
                <Input
                  {...placeForm.register("name")}
                  className="bg-[#282828] border-[#3E3E3E] text-white placeholder:text-[#555]"
                  placeholder="e.g. Fabric, Berghain"
                />
                {placeForm.formState.errors.name && (
                  <p className="text-xs text-red-400 mt-1">{placeForm.formState.errors.name.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs text-[#B3B3B3] mb-1.5 font-medium">City *</p>
                  <Input
                    {...placeForm.register("city")}
                    className="bg-[#282828] border-[#3E3E3E] text-white placeholder:text-[#555]"
                    placeholder="London"
                  />
                  {placeForm.formState.errors.city && (
                    <p className="text-xs text-red-400 mt-1">{placeForm.formState.errors.city.message}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-[#B3B3B3] mb-1.5 font-medium">Country *</p>
                  <Input
                    {...placeForm.register("country")}
                    className="bg-[#282828] border-[#3E3E3E] text-white placeholder:text-[#555]"
                    placeholder="UK"
                  />
                  {placeForm.formState.errors.country && (
                    <p className="text-xs text-red-400 mt-1">{placeForm.formState.errors.country.message}</p>
                  )}
                </div>
              </div>

              <div>
                <p className="text-xs text-[#B3B3B3] mb-1.5 font-medium">Category *</p>
                <Select
                  value={placeForm.watch("category")}
                  onValueChange={v => placeForm.setValue("category", v as PlaceFormValues["category"])}
                >
                  <SelectTrigger className="bg-[#282828] border-[#3E3E3E] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#282828] border-[#3E3E3E]">
                    <SelectItem value="bar">Bar</SelectItem>
                    <SelectItem value="club">Club</SelectItem>
                    <SelectItem value="record_store">Record Store</SelectItem>
                    <SelectItem value="coffee_shop">Coffee Shop</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <p className="text-xs text-[#B3B3B3] mb-1.5 font-medium">Genres <span className="text-[#555]">(optional)</span></p>
                <div className="flex flex-wrap gap-1.5">
                  {GENRE_OPTIONS.map(g => (
                    <button
                      key={g}
                      type="button"
                      onClick={() =>
                        setSelectedGenres(prev =>
                          prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]
                        )
                      }
                      className={cn(
                        "text-xs px-2.5 py-1 rounded-full border transition-colors",
                        selectedGenres.includes(g)
                          ? "bg-[#c2f970] text-black border-[#c2f970]"
                          : "bg-[#282828] text-[#B3B3B3] border-[#3E3E3E] hover:border-[#555]"
                      )}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs text-[#B3B3B3] mb-1.5 font-medium">
                  Description * <span className="text-[#555]">(10–280 chars)</span>
                </p>
                <Textarea
                  {...placeForm.register("description")}
                  rows={3}
                  className="bg-[#282828] border-[#3E3E3E] text-white placeholder:text-[#555] resize-none"
                  placeholder="What makes this place special?"
                  maxLength={280}
                />
                {placeForm.formState.errors.description && (
                  <p className="text-xs text-red-400 mt-1">{placeForm.formState.errors.description.message}</p>
                )}
              </div>

              <div>
                <p className="text-xs text-[#B3B3B3] mb-1.5 font-medium">
                  Google Maps link <span className="text-[#555]">(optional)</span>
                </p>
                <Input
                  {...placeForm.register("mapsLink")}
                  className="bg-[#282828] border-[#3E3E3E] text-white placeholder:text-[#555]"
                  placeholder="https://maps.google.com/…"
                />
              </div>

              <button
                onClick={placeForm.handleSubmit(vals => {
                  if (!user) return;
                  placeMutation.mutate({ ...vals, genres: selectedGenres });
                })}
                disabled={placeMutation.isPending}
                className="w-full py-3 rounded-full bg-[#c2f970] text-black font-bold text-sm disabled:opacity-40 hover:bg-[#aee05a] transition-colors"
              >
                {placeMutation.isPending ? "Adding…" : "Add Place"}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
