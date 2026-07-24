import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  SearchIcon, Star, ChevronLeft, Ticket, Disc3, MessageSquare,
  MapPin, Calendar, Plus, AlertCircle, Music2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────
type ThreadType = "live_show_review" | "album_review" | "topic";
type Step = "artist" | "type" | "show" | "album" | "form";

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

const formSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(200),
  content: z.string().min(1, "Please add some details").max(2000),
});
type FormValues = z.infer<typeof formSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

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
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(n)}
        >
          <Star className={cn("h-7 w-7 transition-colors",
            (hovered || value) >= n ? "text-[#c3f872] fill-[#c3f872]" : "text-[#3E3E3E]"
          )} />
        </button>
      ))}
    </div>
  );
}

// ──────────────────────────────────────────────
// Main component
// ──────────────────────────────────────────────
export default function NewThreadDialog({ open, onOpenChange }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>("artist");
  const [artistInput, setArtistInput] = useState("");
  const [artistQuery, setArtistQuery] = useState("");
  const [selectedArtist, setSelectedArtist] = useState<SpotifyArtist | null>(null);
  const [freeformArtist, setFreeformArtist] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<ThreadType | null>(null);
  const [selectedShow, setSelectedShow] = useState<SetlistShow | null>(null);
  const [selectedAlbum, setSelectedAlbum] = useState<SpotifyAlbum | null>(null);
  const [starRating, setStarRating] = useState(0);

  // Manual show form
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualShow, setManualShow] = useState({ artistName: "", venueName: "", city: "", country: "", eventDate: "" });

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { title: "", content: "" },
  });

  // ── Spotify artist search
  const { data: spotifyData, isFetching: spotifySearching } = useQuery<{
    results: SpotifyArtist[];
    error?: string;
  }>({
    queryKey: ["/api/spotify/artists/search", artistQuery],
    queryFn: async () => {
      const res = await fetch(`/api/spotify/artists/search?q=${encodeURIComponent(artistQuery)}`);
      return res.json();
    },
    enabled: artistQuery.length >= 2,
  });

  // ── Spotify albums for selected artist
  const { data: albumsData, isLoading: albumsLoading } = useQuery<{
    results: SpotifyAlbum[];
    error?: string;
  }>({
    queryKey: ["/api/spotify/artists", selectedArtist?.spotifyId, "albums"],
    queryFn: async () => {
      const res = await fetch(`/api/spotify/artists/${selectedArtist!.spotifyId}/albums`);
      return res.json();
    },
    enabled: step === "album" && !!selectedArtist?.spotifyId,
  });

  // ── Setlist.fm shows for selected artist
  const artistDisplayName = selectedArtist?.name || freeformArtist || "";
  const { data: setlistData, isFetching: setlistSearching } = useQuery<{
    results: SetlistShow[];
    error?: string;
  }>({
    queryKey: ["/api/setlistfm/search", artistDisplayName],
    queryFn: async () => {
      const res = await fetch(`/api/setlistfm/search?artist=${encodeURIComponent(artistDisplayName)}`);
      return res.json();
    },
    enabled: step === "show" && artistDisplayName.length >= 2,
  });

  // ── Community shows for selected artist
  const { data: communityShows } = useQuery<{ id: number; artistName: string; venueName: string; city: string; country: string; eventDate: string }[]>({
    queryKey: ["/api/shows", { q: artistDisplayName }],
    queryFn: async () => {
      const res = await fetch(`/api/shows?q=${encodeURIComponent(artistDisplayName)}`);
      return res.json();
    },
    enabled: step === "show" && artistDisplayName.length >= 2,
  });

  // ── Import a Setlist.fm show → get showId
  const importShowMutation = useMutation({
    mutationFn: async (show: SetlistShow) => {
      const res = await apiRequest("POST", "/api/shows", show);
      return res.json();
    },
  });

  // ── Create thread mutation
  const createThread = useMutation({
    mutationFn: async (values: FormValues) => {
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
        starRating: selectedType === "live_show_review" ? (starRating || null) : null,
        showId: resolvedShowId,
        albumId: selectedType === "album_review" ? (selectedAlbum?.spotifyId || null) : null,
        albumName: selectedType === "album_review" ? (selectedAlbum?.name || null) : null,
        artistName: artistDisplayName || null,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to create thread");
      }
      return res.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/threads/featured"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/threads"] });
      if (user) {
        await queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}/threads/engaged`] });
        await queryClient.invalidateQueries({ queryKey: [`/api/users/username/${user.username}`] });
      }
      toast({ title: "Thread created!", description: "Your thread has been posted." });
      handleClose();
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  function handleClose() {
    setStep("artist");
    setArtistInput("");
    setArtistQuery("");
    setSelectedArtist(null);
    setFreeformArtist(null);
    setSelectedType(null);
    setSelectedShow(null);
    setSelectedAlbum(null);
    setStarRating(0);
    setShowManualForm(false);
    setManualShow({ artistName: "", venueName: "", city: "", country: "", eventDate: "" });
    form.reset();
    onOpenChange(false);
  }

  function handleArtistInputChange(val: string) {
    setArtistInput(val);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => setArtistQuery(val.trim()), 400);
  }

  function selectArtist(artist: SpotifyArtist) {
    setSelectedArtist(artist);
    setFreeformArtist(null);
    setStep("type");
  }

  function proceedWithFreeform() {
    if (!artistInput.trim()) return;
    setFreeformArtist(artistInput.trim());
    setSelectedArtist(null);
    setStep("type");
  }

  function selectType(type: ThreadType) {
    setSelectedType(type);
    if (type === "live_show_review") setStep("show");
    else if (type === "album_review") setStep("album");
    else setStep("form");
  }

  function selectShow(show: SetlistShow) {
    setSelectedShow(show);
    setStep("form");
  }

  function selectAlbum(album: SpotifyAlbum) {
    setSelectedAlbum(album);
    setStep("form");
  }

  function handleBack() {
    if (step === "type") { setStep("artist"); setSelectedArtist(null); setFreeformArtist(null); }
    else if (step === "show") { setStep("type"); setSelectedShow(null); setShowManualForm(false); }
    else if (step === "album") { setStep("type"); setSelectedAlbum(null); }
    else if (step === "form") {
      if (selectedType === "live_show_review") { setStep("show"); }
      else if (selectedType === "album_review") { setStep("album"); }
      else { setStep("type"); }
    }
  }

  function onSubmit(values: FormValues) {
    if (!user) return;
    if (selectedType === "live_show_review" && !starRating) {
      toast({ title: "Rating required", description: "Please give a star rating for the show.", variant: "destructive" });
      return;
    }
    createThread.mutate(values);
  }

  const spotifyNotConfigured = !!spotifyData?.error?.includes("not configured");
  const artistResults = spotifyData?.results ?? [];

  const stepTitles: Record<Step, string> = {
    artist: "New Thread",
    type: "What type of thread?",
    show: "Which show?",
    album: "Which album?",
    form: "Write your thread",
  };

  const typeCards = [
    { id: "live_show_review" as const, label: "Live Show Review", description: "Review a live performance or concert", icon: Ticket, color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/30 hover:border-orange-500/60" },
    { id: "album_review" as const, label: "Album Review", description: "Deep-dive on an album or project", icon: Disc3, color: "text-[#b388eb]", bg: "bg-[#b388eb]/10 border-[#b388eb]/30 hover:border-[#b388eb]/60" },
    { id: "topic" as const, label: "Topic / General", description: "Open discussion — no linked release needed", icon: MessageSquare, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/30 hover:border-purple-500/60" },
  ];

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) handleClose(); }}>
      <DialogContent className="bg-[#1a1a1a] border-[#3E3E3E] text-white max-w-md w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {step !== "artist" && (
              <button onClick={handleBack} className="p-1 hover:bg-[#282828] rounded-lg transition-colors">
                <ChevronLeft className="h-5 w-5 text-[#B3B3B3]" />
              </button>
            )}
            <DialogTitle className="text-white font-bold text-lg">{stepTitles[step]}</DialogTitle>
          </div>
        </DialogHeader>

        {/* ─── Step 1: Artist search ─────────────────── */}
        {step === "artist" && (
          <div className="pt-2">
            <p className="text-sm text-[#B3B3B3] mb-3">Search for the artist you want to discuss.</p>

            <div className="relative mb-3">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B3B3B3] h-4 w-4" />
              <Input
                autoFocus
                placeholder="Search artist…"
                className="pl-9 bg-[#282828] border-[#3E3E3E] text-white placeholder:text-[#B3B3B3]"
                value={artistInput}
                onChange={e => handleArtistInputChange(e.target.value)}
                onKeyDown={e => e.key === "Enter" && artistInput.trim() && proceedWithFreeform()}
              />
            </div>

            {spotifyNotConfigured && artistInput.length >= 2 && (
              <div className="flex items-start gap-2 bg-[#1e1e1e] border border-[#3E3E3E] rounded-lg p-3 mb-3">
                <AlertCircle className="h-4 w-4 text-[#555] flex-shrink-0 mt-0.5" />
                <p className="text-xs text-[#666]">Spotify API not configured — search is manual.</p>
              </div>
            )}

            {spotifySearching && (
              <div className="flex justify-center py-4">
                <div className="w-5 h-5 border-2 border-[#c2f970] border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {!spotifySearching && !spotifyNotConfigured && artistResults.length > 0 && (
              <div className="space-y-1 max-h-52 overflow-y-auto mb-3">
                {artistResults.map(a => (
                  <button
                    key={a.spotifyId}
                    onClick={() => selectArtist(a)}
                    className="w-full text-left flex items-center gap-3 p-2.5 rounded-lg hover:bg-[#282828] transition-colors"
                  >
                    {a.imageUrl ? (
                      <img src={a.imageUrl} alt={a.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[#3E3E3E] flex items-center justify-center flex-shrink-0">
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

            {artistInput.trim().length >= 2 && !spotifySearching && artistResults.length === 0 && !spotifyNotConfigured && (
              <p className="text-sm text-[#555] text-center py-2 mb-2">No Spotify results</p>
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

            <div className="border-t border-[#3E3E3E] pt-3">
              <p className="text-xs text-[#555] mb-2 text-center">or start a general discussion</p>
              <button
                className="w-full py-3 rounded-xl border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 transition-colors text-left px-4"
                onClick={() => { setSelectedType("topic"); setStep("form"); }}
              >
                <p className="text-sm font-semibold text-purple-400">Topic / General</p>
                <p className="text-xs text-[#B3B3B3] mt-0.5">Start a discussion — no artist needed</p>
              </button>
            </div>
          </div>
        )}

        {/* ─── Step 2: Thread type picker ───────────── */}
        {step === "type" && (
          <div className="pt-2">
            {/* Selected artist context chip */}
            <div className="flex items-center gap-2 p-3 bg-[#282828] rounded-lg mb-4">
              {selectedArtist?.imageUrl ? (
                <img src={selectedArtist.imageUrl} alt={selectedArtist.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#3E3E3E] flex items-center justify-center flex-shrink-0">
                  <Music2 className="h-4 w-4 text-[#B3B3B3]" />
                </div>
              )}
              <p className="text-sm font-medium text-white truncate flex-1">{artistDisplayName}</p>
            </div>

            <div className="space-y-2">
              {typeCards.map(t => (
                <button
                  key={t.id}
                  onClick={() => selectType(t.id)}
                  className={cn("w-full text-left p-4 rounded-xl border transition-all", t.bg)}
                >
                  <div className="flex items-center gap-2 mb-0.5">
                    <t.icon className={cn("h-4 w-4", t.color)} />
                    <p className={cn("font-semibold text-sm", t.color)}>{t.label}</p>
                  </div>
                  <p className="text-xs text-[#B3B3B3] ml-6">{t.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ─── Step 3a: Show picker ─────────────────── */}
        {step === "show" && (
          <div className="pt-2">
            <p className="text-sm text-[#B3B3B3] mb-3">
              Select the show you attended as <span className="text-white font-medium">{artistDisplayName}</span>.
            </p>

            {/* Community shows */}
            {communityShows && communityShows.length > 0 && (
              <div className="mb-4">
                <p className="text-[10px] text-[#555] uppercase tracking-wider font-medium mb-2">Community shows</p>
                <div className="space-y-2">
                  {communityShows.slice(0, 5).map(s => (
                    <button
                      key={s.id}
                      onClick={() => selectShow({ showId: s.id, artistName: s.artistName, venueName: s.venueName, city: s.city, country: s.country, eventDate: s.eventDate })}
                      className="w-full text-left bg-[#282828] rounded-lg p-3 hover:bg-[#333] transition-colors"
                    >
                      <p className="text-sm font-medium text-white">{s.venueName}</p>
                      <div className="flex gap-3 mt-1">
                        <span className="flex items-center gap-1 text-xs text-[#555]"><MapPin className="h-3 w-3" />{s.city}, {s.country}</span>
                        <span className="flex items-center gap-1 text-xs text-[#555]"><Calendar className="h-3 w-3" />{formatDate(s.eventDate)}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Setlist.fm results */}
            <p className="text-[10px] text-[#555] uppercase tracking-wider font-medium mb-2">Setlist.fm</p>
            {setlistSearching && (
              <div className="flex justify-center py-3">
                <div className="w-5 h-5 border-2 border-[#c2f970] border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {!setlistSearching && setlistData?.error?.includes("not configured") && (
              <div className="flex items-start gap-2 bg-[#1e1e1e] border border-[#3E3E3E] rounded-lg p-3 mb-3">
                <AlertCircle className="h-4 w-4 text-[#555] flex-shrink-0 mt-0.5" />
                <p className="text-xs text-[#666]">Setlist.fm not configured. Add manually below.</p>
              </div>
            )}
            {!setlistSearching && !setlistData?.error && (setlistData?.results ?? []).length > 0 && (
              <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
                {(setlistData!.results).slice(0, 8).map(s => (
                  <button
                    key={s.setlistfmId}
                    onClick={() => selectShow(s)}
                    className="w-full text-left bg-[#282828] rounded-lg p-3 hover:bg-[#333] transition-colors"
                  >
                    <p className="text-sm font-medium text-white">{s.venueName}</p>
                    <div className="flex gap-3 mt-1">
                      <span className="flex items-center gap-1 text-xs text-[#555]"><MapPin className="h-3 w-3" />{s.city}, {s.country}</span>
                      <span className="flex items-center gap-1 text-xs text-[#555]"><Calendar className="h-3 w-3" />{formatDate(s.eventDate)}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {!setlistSearching && !setlistData?.error && (setlistData?.results ?? []).length === 0 && (
              <p className="text-xs text-[#555] mb-3">No results from Setlist.fm for this artist.</p>
            )}

            {/* Can't find it / manual entry */}
            {!showManualForm ? (
              <button
                onClick={() => {
                  setShowManualForm(true);
                  setManualShow(m => ({ ...m, artistName: artistDisplayName }));
                }}
                className="flex items-center gap-2 text-sm text-[#b388eb] font-medium hover:text-[#c9a0f0] transition-colors"
              >
                <Plus className="h-4 w-4" />
                Can't find it? Add manually
              </button>
            ) : (
              <div className="bg-[#282828] rounded-lg p-3 space-y-2 border border-[#3E3E3E]">
                <p className="text-xs text-[#B3B3B3] font-medium mb-2">Add show manually</p>
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
                    selectShow({ ...manualShow, artistName: artistDisplayName });
                  }}
                  disabled={!manualShow.venueName || !manualShow.city || !manualShow.country || !manualShow.eventDate}
                  className="w-full py-1.5 rounded-lg green-gradient text-black text-xs font-semibold disabled:opacity-40 hover:opacity-90 transition-opacity"
                >
                  Use this show
                </button>
              </div>
            )}

            {/* Skip show selection */}
            <button
              onClick={() => { setSelectedShow(null); setStep("form"); }}
              className="text-xs text-[#555] hover:text-[#B3B3B3] mt-3 block transition-colors"
            >
              Skip — write without linking a show
            </button>
          </div>
        )}

        {/* ─── Step 3b: Album picker ────────────────── */}
        {step === "album" && (
          <div className="pt-2">
            <p className="text-sm text-[#B3B3B3] mb-3">
              Pick an album by <span className="text-white font-medium">{artistDisplayName}</span>.
            </p>

            {albumsLoading && (
              <div className="flex justify-center py-6">
                <div className="w-5 h-5 border-2 border-[#c2f970] border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {!albumsLoading && albumsData?.error?.includes("not configured") && (
              <div className="flex items-start gap-2 bg-[#1e1e1e] border border-[#3E3E3E] rounded-lg p-3 mb-3">
                <AlertCircle className="h-4 w-4 text-[#555] flex-shrink-0 mt-0.5" />
                <p className="text-xs text-[#666]">Spotify API not configured. Skip to write about any album.</p>
              </div>
            )}

            {!albumsLoading && (albumsData?.results ?? []).length > 0 && (
              <div className="space-y-2 max-h-64 overflow-y-auto mb-3">
                {(albumsData!.results).map(a => (
                  <button
                    key={a.spotifyId}
                    onClick={() => selectAlbum(a)}
                    className="w-full text-left flex items-center gap-3 bg-[#282828] rounded-lg p-2.5 hover:bg-[#333] transition-colors"
                  >
                    {a.imageUrl ? (
                      <img src={a.imageUrl} alt={a.name} className="w-10 h-10 rounded object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded bg-[#3E3E3E] flex items-center justify-center flex-shrink-0">
                        <Disc3 className="h-5 w-5 text-[#B3B3B3]" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white truncate">{a.name}</p>
                      <p className="text-xs text-[#555] capitalize">{a.albumType} · {a.releaseYear}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={() => { setSelectedAlbum(null); setStep("form"); }}
              className="text-xs text-[#555] hover:text-[#B3B3B3] transition-colors"
            >
              Skip — write without linking an album
            </button>
          </div>
        )}

        {/* ─── Step 4: Form ─────────────────────────── */}
        {step === "form" && (
          <div className="pt-2">
            {/* Context chips */}
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedType === "live_show_review" && (
                <span className="text-xs font-medium px-2 py-1 rounded-full border bg-orange-500/10 border-orange-500/30 text-orange-400 flex items-center gap-1">
                  <Ticket className="h-3 w-3" /> Live Show Review
                </span>
              )}
              {selectedType === "album_review" && (
                <span className="text-xs font-medium px-2 py-1 rounded-full border bg-[#b388eb]/10 border-[#b388eb]/30 text-[#b388eb] flex items-center gap-1">
                  <Disc3 className="h-3 w-3" /> Album Review
                </span>
              )}
              {(selectedType === "topic" || !selectedType) && (
                <span className="text-xs font-medium px-2 py-1 rounded-full border bg-purple-500/10 border-purple-500/30 text-purple-400 flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" /> Topic
                </span>
              )}
              {artistDisplayName && (
                <span className="text-xs bg-[#282828] text-[#B3B3B3] px-2 py-1 rounded-full">{artistDisplayName}</span>
              )}
              {selectedShow && (
                <span className="text-xs bg-[#282828] text-[#B3B3B3] px-2 py-1 rounded-full truncate max-w-[160px]">
                  {selectedShow.venueName}
                </span>
              )}
              {selectedAlbum && (
                <span className="text-xs bg-[#282828] text-[#B3B3B3] px-2 py-1 rounded-full truncate max-w-[160px]">
                  {selectedAlbum.name}
                </span>
              )}
            </div>

            {/* Star rating for live show reviews */}
            {selectedType === "live_show_review" && (
              <div className="mb-4">
                <p className="text-sm text-[#B3B3B3] mb-2">
                  Your rating <span className="text-red-400">*</span>
                </p>
                <StarPicker value={starRating} onChange={setStarRating} />
              </div>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="title" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#B3B3B3] text-sm">Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Give your thread a title…"
                        className="bg-[#282828] border-[#3E3E3E] text-white placeholder:text-[#B3B3B3]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="content" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#B3B3B3] text-sm">Details</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Share your thoughts…"
                        className="bg-[#282828] border-[#3E3E3E] text-white placeholder:text-[#B3B3B3] min-h-[100px] resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-full bg-gradient-to-r from-[#c2f970] to-[#ecffa1] text-black font-semibold text-sm disabled:opacity-40 hover:opacity-90 transition-opacity"
                  disabled={createThread.isPending}
                >
                  {createThread.isPending ? "Posting…" : "Post Thread"}
                </button>
              </form>
            </Form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
