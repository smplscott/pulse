import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Place, UserShowWishlistItem, UserTravelPlan } from "@shared/schema";
import {
  X, ChevronLeft, Search, Music2, Ticket, Disc3,
  MapPin, Calendar, Star, Plus, AlertCircle, Radar as RadarIcon,
  ArrowRight, Check, Plane, Sparkles, Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import ReviewImageUpload from "@/components/ReviewImageUpload";
import GoogleCityAutocomplete, { type SelectedCity } from "@/components/locations/GoogleCityAutocomplete";

// ─── Types ──────────────────────────────────────────────────────────────────

type FlowStep =
  | "root"
  | "artist"
  | "show"
  | "album"
  | "thread_form"
  | "place_search"
  | "place_form"
  | "radar_artist"
  | "radar_trip"
  | "radar_complete";

type ThreadType = "live_show_review" | "album_review" | "topic";
type CreateAction = "radar" | "place" | "show" | "album";

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

type PulsePlace = Place & {
  reviewCount?: number;
  avgRating?: number | null;
};

interface GooglePlaceSuggestion {
  placeId: string;
  text: string;
  mainText: string;
  secondaryText: string;
  types: string[];
}

interface GooglePlaceDetails {
  placeId: string;
  displayName: string;
  formattedAddress: string;
  city: string;
  country: string;
  countryCode: string;
  latitude: number | null;
  longitude: number | null;
  primaryType: string | null;
  googleMapsUri: string;
}

interface SetlistShow {
  setlistfmId?: string | null;
  showId?: number;
  artistName: string;
  venueName: string;
  city: string;
  country: string;
  eventDate: string;
  source?: "ticketmaster" | "setlistfm";
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

const RATING_LABELS = ["", "Poor", "Below average", "Average", "Good", "Excellent"];

const GENRE_OPTIONS = [
  "House", "Techno", "Drum & Bass", "Jungle", "Hip-Hop",
  "R&B", "Soul", "Jazz", "Electronic", "Disco", "Funk",
  "Rock", "Indie", "Pop", "Ambient", "Experimental",
];

function googleTypeToCategory(primaryType: string | null): PlaceFormValues["category"] {
  if (primaryType === "bar") return "bar";
  if (primaryType === "night_club") return "club";
  if (primaryType === "record_store") return "record_store";
  if (primaryType === "cafe" || primaryType === "coffee_shop") return "coffee_shop";
  return "other";
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
            (hovered || value) >= n ? "text-[#c3f872] fill-[#c3f872]" : "text-[#3E3E3E]"
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
  const [selectedAction, setSelectedAction] = useState<CreateAction | null>(null);

  // Artist-path state
  const [artistInput, setArtistInput] = useState("");
  const [artistQuery, setArtistQuery] = useState("");
  const [selectedArtist, setSelectedArtist] = useState<SpotifyArtist | null>(null);
  const [freeformArtist, setFreeformArtist] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<ThreadType | null>(null);
  const [selectedShow, setSelectedShow] = useState<SetlistShow | null>(null);
  const [selectedAlbum, setSelectedAlbum] = useState<SpotifyAlbum | null>(null);
  const [starRating, setStarRating] = useState(0);
  const [reviewImage, setReviewImage] = useState<string | null>(null);
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualShow, setManualShow] = useState({
    artistName: "", venueName: "", city: "", country: "", eventDate: "",
  });

  // Place-path state
  const [placeQuery, setPlaceQuery] = useState("");
  const [debouncedPlaceQuery, setDebouncedPlaceQuery] = useState("");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [placeRating, setPlaceRating] = useState(0);
  const [selectedGooglePlace, setSelectedGooglePlace] = useState<GooglePlaceDetails | null>(null);
  const placeSessionToken = useRef(crypto.randomUUID());

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedPlaceQuery(placeQuery.trim()), 350);
    return () => clearTimeout(timeout);
  }, [placeQuery]);

  // Radar-path state
  const [radarLocation, setRadarLocation] = useState<SelectedCity>({ city: "", country: "" });
  const [radarStart, setRadarStart] = useState("");
  const [radarEnd, setRadarEnd] = useState("");

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
      setSelectedAction(null);
      setArtistInput(""); setArtistQuery("");
      setSelectedArtist(null); setFreeformArtist(null);
      setSelectedType(null); setSelectedShow(null); setSelectedAlbum(null);
      setStarRating(0); setReviewImage(null); setShowManualForm(false);
      setManualShow({ artistName: "", venueName: "", city: "", country: "", eventDate: "" });
      setPlaceQuery(""); setSelectedGenres([]); setPlaceRating(0); setSelectedGooglePlace(null);
      setRadarLocation({ city: "", country: "" }); setRadarStart(""); setRadarEnd("");
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
    results: SetlistShow[]; sources?: ("ticketmaster" | "setlistfm")[]; error?: string;
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

  const { data: placeResults = [], isFetching: localPlacesSearching } = useQuery<PulsePlace[]>({
    queryKey: ["/api/places/search", debouncedPlaceQuery],
    queryFn: async () => {
      const response = await fetch(`/api/places/search?q=${encodeURIComponent(debouncedPlaceQuery)}`);
      return response.json();
    },
    enabled: step === "place_search" && debouncedPlaceQuery.length >= 2,
  });

  const { data: googlePlaceData, isFetching: googlePlacesSearching } = useQuery<{
    results: GooglePlaceSuggestion[];
    configured: boolean;
    message?: string;
  }>({
    queryKey: ["/api/google-places/autocomplete", "place", debouncedPlaceQuery],
    queryFn: async () => {
      const response = await fetch("/api/google-places/autocomplete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          input: debouncedPlaceQuery,
          mode: "place",
          sessionToken: placeSessionToken.current,
        }),
      });
      return response.json();
    },
    enabled: step === "place_search" && debouncedPlaceQuery.length >= 2,
  });

  const { data: radarWishlist = [] } = useQuery<UserShowWishlistItem[]>({
    queryKey: [`/api/users/${user?.id}/show-wishlist`],
    enabled: open && selectedAction === "radar" && !!user?.id,
  });

  const { data: radarTrips = [] } = useQuery<UserTravelPlan[]>({
    queryKey: [`/api/users/${user?.id}/travel-plans`],
    enabled: open && selectedAction === "radar" && !!user?.id,
  });

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
        reviewImageUrl: selectedType === "live_show_review" ? (reviewImage || null) : null,
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
      const res = await apiRequest("POST", "/api/places", {
        ...values,
        ...(selectedGooglePlace ? {
          googlePlaceId: selectedGooglePlace.placeId,
          latitude: selectedGooglePlace.latitude,
          longitude: selectedGooglePlace.longitude,
          formattedAddress: selectedGooglePlace.formattedAddress,
          googlePrimaryType: selectedGooglePlace.primaryType,
          mapsLink: selectedGooglePlace.googleMapsUri,
        } : {}),
      });
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

  const resolveGooglePlaceMutation = useMutation({
    mutationFn: async (suggestion: GooglePlaceSuggestion) => {
      const params = new URLSearchParams({
        mode: "place",
        sessionToken: placeSessionToken.current,
      });
      const detailsResponse = await fetch(
        `/api/google-places/${encodeURIComponent(suggestion.placeId)}/details?${params}`,
        { credentials: "include" },
      );
      if (!detailsResponse.ok) throw new Error("Couldn't load place details");
      const details = await detailsResponse.json() as GooglePlaceDetails;
      const resolveResponse = await apiRequest("POST", "/api/places/resolve", {
        googlePlaceId: details.placeId,
        name: details.displayName || suggestion.mainText,
        city: details.city,
        country: details.country,
      });
      const resolved = await resolveResponse.json() as { existing: PulsePlace | null };
      return { details, suggestion, existing: resolved.existing };
    },
    onSuccess: ({ details, suggestion, existing }) => {
      placeSessionToken.current = crypto.randomUUID();
      if (existing) {
        handleClose();
        navigate(`/places/${existing.id}`);
        return;
      }
      setSelectedGooglePlace(details);
      placeForm.setValue("name", details.displayName || suggestion.mainText);
      placeForm.setValue("city", details.city);
      placeForm.setValue("country", details.country);
      placeForm.setValue("mapsLink", details.googleMapsUri);
      placeForm.setValue("category", googleTypeToCategory(details.primaryType));
      setStep("place_form");
    },
    onError: (error: Error) =>
      toast({ title: "Couldn't load place", description: error.message, variant: "destructive" }),
  });

  const radarWishlistMutation = useMutation({
    mutationFn: async (artist: SpotifyArtist | { name: string; imageUrl: null }) => {
      if (!user) throw new Error("Sign in to use Radar");
      const res = await apiRequest("POST", `/api/users/${user.id}/show-wishlist`, {
        artistName: artist.name,
        ...(artist.imageUrl ? { spotifyImageUrl: artist.imageUrl } : {}),
      });
      return res.json();
    },
    onSuccess: async () => {
      if (user) {
        await queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}/show-wishlist`] });
      }
      setArtistInput("");
      setArtistQuery("");
      setSelectedArtist(null);
      setFreeformArtist(null);
      toast({ title: "Added to Radar", description: "Add another artist or continue to your trip." });
    },
    onError: (err: Error) =>
      toast({ title: "Couldn't add artist", description: err.message, variant: "destructive" }),
  });

  const radarTripMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Sign in to use Radar");
      const res = await apiRequest("POST", `/api/users/${user.id}/travel-plans`, {
        city: radarLocation.city.trim(),
        country: radarLocation.country.trim(),
        countryCode: radarLocation.countryCode,
        googlePlaceId: radarLocation.googlePlaceId,
        latitude: radarLocation.latitude,
        longitude: radarLocation.longitude,
        startDate: radarStart,
        endDate: radarEnd || radarStart,
      });
      return res.json();
    },
    onSuccess: async () => {
      if (user) {
        await queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}/travel-plans`] });
        await queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}/wishlist-matches`] });
      }
      setStep("radar_complete");
    },
    onError: (err: Error) =>
      toast({ title: "Couldn't add trip", description: err.message, variant: "destructive" }),
  });

  // ── Navigation helpers ────────────────────────────────────────────────────

  function startAction(action: CreateAction) {
    setSelectedAction(action);
    if (action === "place") {
      setStep("place_search");
      return;
    }
    if (action === "radar") {
      setStep("radar_artist");
      return;
    }
    setSelectedType(action === "show" ? "live_show_review" : "album_review");
    setStep("artist");
  }

  function handleArtistInputChange(val: string) {
    setArtistInput(val);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => setArtistQuery(val.trim()), 400);
  }

  function selectArtist(artist: SpotifyArtist) {
    setSelectedArtist(artist);
    setFreeformArtist(null);
    setStep(selectedAction === "show" ? "show" : "album");
  }

  function proceedWithFreeform() {
    if (!artistInput.trim()) return;
    setFreeformArtist(artistInput.trim());
    setSelectedArtist(null);
    setStep(selectedAction === "show" ? "show" : "album");
  }

  function selectShow(show: SetlistShow) { setSelectedShow(show); setStep("thread_form"); }
  function selectAlbum(album: SpotifyAlbum) { setSelectedAlbum(album); setStep("thread_form"); }

  function handleBack() {
    if (step === "artist" || step === "place_search" || step === "radar_artist") setStep("root");
    else if (step === "show") { setStep("artist"); setSelectedArtist(null); setFreeformArtist(null); setSelectedShow(null); setShowManualForm(false); }
    else if (step === "album") { setStep("artist"); setSelectedArtist(null); setFreeformArtist(null); setSelectedAlbum(null); }
    else if (step === "thread_form") {
      if (selectedType === "live_show_review") setStep("show");
      else if (selectedType === "album_review") setStep("album");
      else if (!selectedArtist && !freeformArtist) setStep("root");
      else setStep("artist");
    }
    else if (step === "place_form") setStep("place_search");
    else if (step === "radar_trip") setStep("radar_artist");
    else if (step === "radar_complete") setStep("root");
  }

  const artistResults = spotifyData?.results ?? [];

  const stepTitle: Record<FlowStep, string> = {
    root: "What do you want to do?",
    artist: selectedAction === "show" ? "Who did you see?" : "Choose the artist",
    show: "Which show?",
    album: "Which album?",
    thread_form: "Write your thread",
    place_search: "Find a place",
    place_form: "Add a place",
    radar_artist: "Artists on your Radar",
    radar_trip: "Where are you going?",
    radar_complete: "Radar is on",
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
            <div>
              <p className="text-sm text-[#B3B3B3] mb-4">
                Start with the action. We'll help you find the right artist, show, album, or place.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    id: "radar" as const,
                    title: "Radar",
                    eyebrow: "Find shows while you travel",
                    description: "Match wishlist artists with your next trip.",
                    Icon: RadarIcon,
                    card: "from-[#ff4d8d] via-[#e348ad] to-[#8f5cff] border-[#ff8fbd]/60",
                    glow: "bg-[#ffb3d1]/30",
                  },
                  {
                    id: "place" as const,
                    title: "Rate Places",
                    eyebrow: "Share your scene",
                    description: "Find a venue, club, bar, or record store.",
                    Icon: MapPin,
                    card: "from-[#1ba88a] via-[#168f70] to-[#397a5c] border-[#65e6bc]/50",
                    glow: "bg-[#8fffd9]/25",
                  },
                  {
                    id: "show" as const,
                    title: "Rate Shows",
                    eyebrow: "Capture the night",
                    description: "Find the artist and show you attended.",
                    Icon: Ticket,
                    card: "from-[#f2603f] via-[#d74669] to-[#8e3d79] border-[#ff9b79]/55",
                    glow: "bg-[#ffd095]/25",
                  },
                  {
                    id: "album" as const,
                    title: "Rate Albums",
                    eyebrow: "Put it on record",
                    description: "Find an artist and review a release.",
                    Icon: Disc3,
                    card: "from-[#5d59d9] via-[#6f45bd] to-[#3f2e7e] border-[#aaa7ff]/50",
                    glow: "bg-[#c9c7ff]/25",
                  },
                ].map(action => (
                  <button
                    key={action.id}
                    type="button"
                    onClick={() => startAction(action.id)}
                    className={cn(
                      "group relative min-h-[190px] overflow-hidden rounded-[22px] border bg-gradient-to-br p-4 text-left shadow-lg transition-all",
                      "hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0 active:scale-[0.98]",
                      action.card,
                    )}
                  >
                    <div className={cn("absolute -right-8 -top-8 h-28 w-28 rounded-full blur-2xl", action.glow)} />
                    <div className="absolute bottom-[-32px] right-[-22px] h-28 w-28 rounded-full border-[18px] border-white/10" />
                    <div className="relative flex h-full flex-col">
                      <div className="mb-auto flex items-center justify-between">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/20 backdrop-blur-sm">
                          <action.Icon className="h-5 w-5 text-white" />
                        </div>
                        <ArrowRight className="h-4 w-4 text-white/70 transition-transform group-hover:translate-x-1" />
                      </div>
                      <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.13em] text-white/70">{action.eyebrow}</p>
                      <h3 className="mt-1 text-xl font-black leading-tight text-white">{action.title}</h3>
                      <p className="mt-2 text-xs leading-relaxed text-white/80">{action.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── ARTIST SEARCH ── */}
          {step === "artist" && (
            <div>
              <p className="text-sm text-[#B3B3B3] mb-3">
                {selectedAction === "show"
                  ? "Search for the artist first, then we'll find the show."
                  : "Search for the artist first, then choose the album."}
              </p>

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

          {/* ── RADAR ARTIST SETUP ── */}
          {step === "radar_artist" && (
            <div>
              <div className="relative overflow-hidden rounded-2xl border border-[#ff6fae]/35 bg-gradient-to-br from-[#35152a] to-[#24183e] p-4 mb-4">
                <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#ff6fae]/20 blur-2xl" />
                <div className="relative flex gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#ff6fae]/15">
                    <RadarIcon className="h-5 w-5 text-[#ff83ba]" />
                  </div>
                  <div>
                    <p className="font-bold text-white">Who is on your Radar?</p>
                    <p className="mt-1 text-xs leading-relaxed text-[#c9b7c3]">
                      Add artists you want to see. Next, tell us where you're going.
                    </p>
                  </div>
                </div>
              </div>

              {radarWishlist.length > 0 && (
                <div className="mb-4">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[#666]">Already watching</p>
                  <div className="flex flex-wrap gap-2">
                    {radarWishlist.map(item => (
                      <span key={item.id} className="inline-flex items-center gap-1.5 rounded-full bg-[#ff6fae]/10 px-2.5 py-1 text-xs text-[#ff9bc7]">
                        <Check className="h-3 w-3" />{item.artistName}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B3B3B3] h-4 w-4" />
                <Input
                  autoFocus
                  placeholder="Search artists…"
                  className="pl-9 bg-[#282828] border-[#3E3E3E] text-white placeholder:text-[#555]"
                  value={artistInput}
                  onChange={e => handleArtistInputChange(e.target.value)}
                />
              </div>

              {!artistInput.trim() && radarWishlist.length > 0 && (
                <div className="mb-4 flex items-center gap-3 rounded-xl border border-[#c2f970]/25 bg-[#c2f970]/8 p-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#c2f970]/15">
                    <Check className="h-4 w-4 text-[#c2f970]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {radarWishlist.length} artist{radarWishlist.length === 1 ? "" : "s"} on your Radar
                    </p>
                    <p className="text-xs text-[#888]">Search to add another, or continue to your trip.</p>
                  </div>
                </div>
              )}

              {spotifySearching && (
                <div className="flex justify-center py-4">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#ff6fae] border-t-transparent" />
                </div>
              )}

              {!spotifySearching && artistResults.length > 0 && (
                <div className="mb-4 space-y-1">
                  {artistResults.map(artist => {
                    const saved = radarWishlist.some(item => item.artistName.toLowerCase() === artist.name.toLowerCase());
                    return (
                      <button
                        key={artist.spotifyId}
                        type="button"
                        disabled={saved || radarWishlistMutation.isPending}
                        onClick={() => radarWishlistMutation.mutate(artist)}
                        className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-colors hover:bg-[#282828] disabled:opacity-60"
                      >
                        {artist.imageUrl ? (
                          <img src={artist.imageUrl} alt="" className="h-10 w-10 flex-shrink-0 rounded-full object-cover" />
                        ) : (
                          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#282828]">
                            <Music2 className="h-4 w-4 text-[#888]" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-white">{artist.name}</p>
                          <p className="truncate text-xs text-[#555]">{artist.genres.slice(0, 2).join(", ")}</p>
                        </div>
                        <span className={cn("text-xs font-semibold", saved ? "text-[#c2f970]" : "text-[#ff83ba]")}>
                          {saved ? "Watching" : "Add"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {artistInput.trim().length >= 1 && !spotifySearching && (
                <button
                  type="button"
                  onClick={() => radarWishlistMutation.mutate({ name: artistInput.trim(), imageUrl: null })}
                  disabled={radarWishlistMutation.isPending || radarWishlist.some(item => item.artistName.toLowerCase() === artistInput.trim().toLowerCase())}
                  className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border border-[#3E3E3E] py-2.5 text-sm text-[#B3B3B3] hover:border-[#ff6fae]/60 disabled:opacity-40"
                >
                  <Plus className="h-4 w-4" /> Add "{artistInput.trim()}" to Radar
                </button>
              )}

              <button
                type="button"
                onClick={() => setStep("radar_trip")}
                disabled={radarWishlist.length === 0}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#ff4d8d] to-[#8f5cff] py-3 text-sm font-bold text-white disabled:opacity-35"
              >
                Continue to trip <ArrowRight className="h-4 w-4" />
              </button>
              {radarWishlist.length === 0 && <p className="mt-2 text-center text-xs text-[#555]">Add at least one artist to continue.</p>}
            </div>
          )}

          {/* ── RADAR TRIP SETUP ── */}
          {step === "radar_trip" && (
            <div>
              {radarTrips.length > 0 && (
                <div className="mb-4 rounded-xl border border-[#333] bg-[#181818] p-3">
                  <p className="text-xs font-semibold text-[#B3B3B3]">Radar is already checking {radarTrips.length} trip{radarTrips.length === 1 ? "" : "s"}.</p>
                  <p className="mt-1 text-xs text-[#666]">Add another destination below.</p>
                </div>
              )}
              <div className="mb-4 flex items-start gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#c2f970]/12">
                  <Plane className="h-5 w-5 text-[#c2f970]" />
                </div>
                <div>
                  <p className="font-bold text-white">Add your next trip</p>
                  <p className="mt-1 text-xs leading-relaxed text-[#888]">We'll look for your Radar artists in this city during your dates.</p>
                </div>
              </div>
              <GoogleCityAutocomplete value={radarLocation} onChange={setRadarLocation} className="mb-3" />
              <div className="mb-5 grid grid-cols-2 gap-2">
                <div>
                  <p className="mb-1 text-[10px] text-[#666]">Start</p>
                  <Input type="date" value={radarStart} onChange={e => setRadarStart(e.target.value)} className="bg-[#282828] border-[#3E3E3E] text-white" />
                </div>
                <div>
                  <p className="mb-1 text-[10px] text-[#666]">End</p>
                  <Input type="date" min={radarStart || undefined} value={radarEnd} onChange={e => setRadarEnd(e.target.value)} className="bg-[#282828] border-[#3E3E3E] text-white" />
                </div>
              </div>
              <button
                type="button"
                onClick={() => radarTripMutation.mutate()}
                disabled={!radarLocation.city.trim() || !radarLocation.country.trim() || !radarStart || (!!radarEnd && radarEnd < radarStart) || radarTripMutation.isPending}
                className="w-full rounded-full bg-gradient-to-r from-[#c2f970] to-[#ecffa1] py-3 text-sm font-bold text-black disabled:opacity-35"
              >
                {radarTripMutation.isPending ? "Turning on Radar…" : "Turn on Radar"}
              </button>
            </div>
          )}

          {/* ── RADAR COMPLETE ── */}
          {step === "radar_complete" && (
            <div className="py-4 text-center">
              <div className="relative mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#ff4d8d] to-[#8f5cff] shadow-[0_0_45px_rgba(255,77,141,0.25)]">
                <RadarIcon className="h-9 w-9 text-white" />
                <Sparkles className="absolute -right-1 -top-1 h-6 w-6 text-[#c2f970]" />
              </div>
              <h3 className="text-2xl font-black text-white">You're on the Radar</h3>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-[#B3B3B3]">
                We'll scan for your wishlist artists around {radarLocation.city} during your trip and notify you when we find a match.
              </p>
              <button
                type="button"
                onClick={handleClose}
                className="mt-6 w-full rounded-full bg-gradient-to-r from-[#ff4d8d] to-[#8f5cff] py-3 text-sm font-bold text-white"
              >
                Done
              </button>
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

              <p className="text-[10px] text-[#555] uppercase tracking-wider font-medium mb-2">
                {setlistData?.sources?.includes("ticketmaster") ? "Ticketmaster" : setlistData?.sources?.includes("setlistfm") ? "Setlist.fm" : "Shows"}
              </p>

              {setlistSearching && (
                <div className="flex justify-center py-3">
                  <div className="w-5 h-5 border-2 border-[#c2f970] border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {!setlistSearching && setlistData?.error?.includes("not configured") && (
                <div className="flex items-start gap-2 bg-[#1e1e1e] border border-[#333] rounded-lg p-3 mb-3">
                  <AlertCircle className="h-4 w-4 text-[#555] flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-[#666]">Show search not configured. Add manually below.</p>
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
                <p className="text-xs text-[#555] mb-3">No shows found for this artist.</p>
              )}

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
                      selectShow({ ...manualShow, artistName: artistDisplayName });
                    }}
                    disabled={!manualShow.venueName || !manualShow.city || !manualShow.country || !manualShow.eventDate}
                    className="w-full py-2 rounded-lg green-gradient text-black text-sm font-semibold disabled:opacity-40 hover:opacity-90 transition-opacity"
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
                    "bg-[#b388eb]/15 text-[#b388eb]": selectedType === "album_review",
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

              {/* Review image — only for live show reviews */}
              {selectedType === "live_show_review" && (
                <ReviewImageUpload value={reviewImage} onChange={setReviewImage} />
              )}

              <button
                onClick={threadForm.handleSubmit(vals => {
                  if (!user) return;
                  if ((selectedType === "live_show_review" || selectedType === "album_review") && !starRating) {
                    toast({ title: "Rating required", description: "Please give a star rating.", variant: "destructive" });
                    return;
                  }
                  threadMutation.mutate(vals);
                })}
                disabled={
                  threadMutation.isPending ||
                  (selectedType === "live_show_review" && !reviewImage)
                }
                className="w-full py-3 rounded-full green-gradient text-black font-bold text-sm disabled:opacity-40 hover:opacity-90 transition-opacity"
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

              {(localPlacesSearching || googlePlacesSearching) && (
                <div className="mb-3 flex items-center justify-center gap-2 py-2 text-xs text-[#777]">
                  <Loader2 className="h-4 w-4 animate-spin text-[#c2f970]" />
                  Searching Pulse and Google Maps…
                </div>
              )}

              {debouncedPlaceQuery.length >= 2 && placeResults.length > 0 && (
                <div className="mb-4">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#c2f970]">Already on Pulse</p>
                    <p className="text-[10px] text-[#666]">Rate it without adding it again</p>
                  </div>
                  <div className="space-y-2">
                  {placeResults.slice(0, 6).map(p => (
                    <button
                      key={p.id}
                      onClick={() => { handleClose(); navigate(`/places/${p.id}`); }}
                      className="w-full text-left bg-[#282828] rounded-xl p-3 hover:bg-[#333] transition-colors flex items-center gap-3"
                    >
                      <div className="w-10 h-10 rounded-lg bg-[#1a2a1a] flex items-center justify-center flex-shrink-0">
                        <MapPin className="h-4 w-4 text-[#c2f970]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-white truncate">{p.name}</p>
                        <p className="text-xs text-[#555]">{p.city}, {p.country}</p>
                      </div>
                      <div className="text-right">
                        {p.reviewCount && p.reviewCount > 0 ? (
                          <>
                            <p className="flex items-center justify-end gap-1 text-xs font-semibold text-[#c2f970]">
                              <Star className="h-3 w-3 fill-[#c2f970]" />{p.avgRating ?? p.rating ?? 0}
                            </p>
                            <p className="text-[10px] text-[#666]">{p.reviewCount} review{p.reviewCount === 1 ? "" : "s"}</p>
                          </>
                        ) : (
                          <p className="text-[10px] font-semibold text-[#b388eb]">Be first to rate</p>
                        )}
                      </div>
                    </button>
                  ))}
                  </div>
                </div>
              )}

              {(googlePlaceData?.results ?? []).length > 0 && (
                <div className="mb-4">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8ab4f8]">From Google Maps</p>
                    <p className="text-[10px] font-semibold text-[#777]">Powered by Google</p>
                  </div>
                  <div className="space-y-1">
                    {googlePlaceData!.results.slice(0, 6).map(result => (
                      <button
                        key={result.placeId}
                        type="button"
                        onClick={() => resolveGooglePlaceMutation.mutate(result)}
                        disabled={resolveGooglePlaceMutation.isPending}
                        className="flex w-full items-center gap-3 rounded-xl border border-[#2f2f2f] bg-[#1b1b1b] p-3 text-left hover:border-[#8ab4f8]/40 hover:bg-[#222] disabled:opacity-50"
                      >
                        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#8ab4f8]/10">
                          {resolveGooglePlaceMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin text-[#8ab4f8]" /> : <MapPin className="h-4 w-4 text-[#8ab4f8]" />}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-white">{result.mainText}</p>
                          <p className="truncate text-xs text-[#666]">{result.secondaryText}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {googlePlaceData?.configured === false && (
                <div className="mb-4 rounded-xl border border-amber-400/20 bg-amber-400/5 p-3">
                  <p className="text-xs text-amber-200">Google Maps search isn't configured. Pulse results and manual entry are still available.</p>
                </div>
              )}

              {placeQuery.trim().length >= 2 && (
                <div className="border-t border-[#1e1e1e] pt-3">
                  <p className="text-xs text-[#555] mb-2">Still not seeing the right place?</p>
                  <button
                    onClick={() => {
                      setSelectedGooglePlace(null);
                      placeForm.setValue("name", placeQuery.trim());
                      setStep("place_form");
                    }}
                    className="flex items-center gap-2 text-sm text-[#c2f970] font-medium hover:text-[#aee05a] transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Add "{placeQuery}" manually
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── PLACE FORM ── */}
          {step === "place_form" && (
            <div className="space-y-3">
              {selectedGooglePlace && (
                <div className="rounded-xl border border-[#8ab4f8]/25 bg-[#8ab4f8]/8 p-3">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-[#8ab4f8]" />
                    <p className="text-xs font-semibold text-white">Matched with Google Maps</p>
                  </div>
                  <p className="mt-1 pl-6 text-[11px] text-[#777]">{selectedGooglePlace.formattedAddress}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-[#B3B3B3] mb-1.5 font-medium">Venue name *</p>
                <Input
                  {...placeForm.register("name")}
                  disabled={!!selectedGooglePlace}
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
                    disabled={!!selectedGooglePlace}
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
                    disabled={!!selectedGooglePlace}
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
                          ? "bg-gradient-to-r from-[#c2f970] to-[#ecffa1] text-black border-transparent"
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
                <p className="text-xs text-[#B3B3B3] mb-2 font-medium">
                  Your rating *
                </p>
                <div className="flex items-center gap-3">
                  <StarPicker value={placeRating} onChange={setPlaceRating} />
                  {placeRating > 0 && (
                    <span className="text-xs text-[#B3B3B3]">{RATING_LABELS[placeRating]}</span>
                  )}
                </div>
                {placeRating === 0 && (
                  <p className="text-xs text-[#555] mt-1">Select a star rating to continue</p>
                )}
              </div>

              {!selectedGooglePlace && (
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
              )}

              <button
                onClick={placeForm.handleSubmit(vals => {
                  if (!user) return;
                  if (placeRating === 0) return;
                  placeMutation.mutate({ ...vals, genres: selectedGenres, rating: placeRating } as any);
                })}
                disabled={placeMutation.isPending || placeRating === 0}
                className="w-full py-3 rounded-full bg-gradient-to-r from-[#c2f970] to-[#ecffa1] text-black font-bold text-sm disabled:opacity-40 hover:opacity-90 transition-opacity"
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
