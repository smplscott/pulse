import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  CalendarDays,
  Check,
  Clock,
  ExternalLink,
  MapPin,
  Music2,
  Pencil,
  Plane,
  Plus,
  Radar as RadarIcon,
  Search,
  Sparkles,
  Ticket,
  Trash2,
  X,
  RefreshCw,
} from "lucide-react";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import GoogleCityAutocomplete, { type SelectedCity } from "@/components/locations/GoogleCityAutocomplete";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import type {
  UserShowWishlistItem,
  UserTravelPlan,
  WishlistEventMatch,
} from "@shared/schema";

interface SpotifyArtist {
  spotifyId: string;
  name: string;
  imageUrl: string | null;
  genres: string[];
}

function formatDate(value: string | Date | null | undefined) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function tripDates(trip: UserTravelPlan) {
  if (!trip.startDate || !trip.endDate) return trip.targetDate;
  if (trip.startDate === trip.endDate) return formatDate(`${trip.startDate}T12:00:00`);
  return `${formatDate(`${trip.startDate}T12:00:00`)} – ${formatDate(`${trip.endDate}T12:00:00`)}`;
}

export default function Radar() {
  const { user } = useAuth();
  const { toast } = useToast();
  const userId = user?.id;

  const [showArtistForm, setShowArtistForm] = useState(false);
  const [artistInput, setArtistInput] = useState("");
  const [artistQuery, setArtistQuery] = useState("");
  const [artistImage, setArtistImage] = useState<string | null>(null);
  const [showArtistResults, setShowArtistResults] = useState(false);
  const [replacingArtistId, setReplacingArtistId] = useState<number | null>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [showTripForm, setShowTripForm] = useState(false);
  const [editingTripId, setEditingTripId] = useState<number | null>(null);
  const [tripLocation, setTripLocation] = useState<SelectedCity>({ city: "", country: "" });
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { data: artists = [], isLoading: artistsLoading } = useQuery<UserShowWishlistItem[]>({
    queryKey: [`/api/users/${userId}/show-wishlist`],
    enabled: !!userId,
  });

  const { data: trips = [], isLoading: tripsLoading } = useQuery<UserTravelPlan[]>({
    queryKey: [`/api/users/${userId}/travel-plans`],
    enabled: !!userId,
  });

  const { data: matches = [], isLoading: matchesLoading } = useQuery<WishlistEventMatch[]>({
    queryKey: [`/api/users/${userId}/wishlist-matches`],
    enabled: !!userId,
  });

  const { data: spotifyData, isFetching: artistSearching } = useQuery<{
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

  const sortedMatches = useMemo(
    () =>
      [...matches].sort((a, b) => {
        const aTime = a.eventStartAt ? new Date(a.eventStartAt).getTime() : Number.MAX_SAFE_INTEGER;
        const bTime = b.eventStartAt ? new Date(b.eventStartAt).getTime() : Number.MAX_SAFE_INTEGER;
        return aTime - bTime;
      }),
    [matches],
  );

  const featuredMatch = sortedMatches[0];
  const featuredTrip = featuredMatch
    ? trips.find(trip => trip.id === featuredMatch.travelPlanId)
    : undefined;
  const additionalMatches = sortedMatches.slice(1);

  const matchesByTrip = useMemo(() => {
    const grouped = new Map<number, WishlistEventMatch[]>();
    for (const match of additionalMatches) {
      const current = grouped.get(match.travelPlanId) ?? [];
      current.push(match);
      grouped.set(match.travelPlanId, current);
    }
    return grouped;
  }, [additionalMatches]);

  function updateArtistInput(value: string) {
    setArtistInput(value);
    setArtistImage(null);
    setShowArtistResults(true);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => setArtistQuery(value.trim()), 350);
  }

  function chooseArtist(artist: SpotifyArtist) {
    setArtistInput(artist.name);
    setArtistImage(artist.imageUrl);
    setShowArtistResults(false);
    setArtistQuery("");
  }

  function resetArtistForm() {
    setArtistInput("");
    setArtistImage(null);
    setArtistQuery("");
    setShowArtistResults(false);
    setReplacingArtistId(null);
    setShowArtistForm(false);
  }

  function replaceArtist(artist: UserShowWishlistItem) {
    setReplacingArtistId(artist.id);
    setArtistInput("");
    setArtistImage(null);
    setArtistQuery("");
    setShowArtistResults(false);
    setShowArtistForm(true);
  }

  function resetTripForm() {
    setTripLocation({ city: "", country: "" });
    setStartDate("");
    setEndDate("");
    setEditingTripId(null);
    setShowTripForm(false);
  }

  function editTrip(trip: UserTravelPlan) {
    setEditingTripId(trip.id);
    setTripLocation({
      city: trip.city,
      country: trip.country,
      countryCode: trip.countryCode ?? undefined,
      googlePlaceId: trip.googlePlaceId ?? undefined,
      latitude: trip.latitude ?? undefined,
      longitude: trip.longitude ?? undefined,
    });
    setStartDate(trip.startDate ?? "");
    setEndDate(trip.endDate ?? trip.startDate ?? "");
    setShowTripForm(true);
  }

  const addArtist = useMutation({
    mutationFn: async () => {
      const previous = artists.find(artist => artist.id === replacingArtistId);
      const result = await apiRequest("POST", `/api/users/${userId}/show-wishlist`, {
        artistName: artistInput.trim(),
        ...(artistImage ? { spotifyImageUrl: artistImage } : {}),
      });
      if (previous && previous.artistName.toLowerCase() !== artistInput.trim().toLowerCase()) {
        await apiRequest("DELETE", `/api/users/${userId}/show-wishlist/${previous.id}`);
      }
      return result;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/show-wishlist`] });
      await queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/wishlist-matches`] });
      const wasReplacing = replacingArtistId !== null;
      resetArtistForm();
      toast({ title: wasReplacing ? "Radar artist updated" : "Artist added to Radar" });
    },
    onError: () => toast({ title: "Couldn't add artist", variant: "destructive" }),
  });

  const removeArtist = useMutation({
    mutationFn: (itemId: number) =>
      apiRequest("DELETE", `/api/users/${userId}/show-wishlist/${itemId}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/show-wishlist`] });
      await queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/wishlist-matches`] });
      toast({ title: "Artist removed from Radar" });
    },
    onError: () => toast({ title: "Couldn't remove artist", variant: "destructive" }),
  });

  const saveTrip = useMutation({
    mutationFn: () => {
      const payload = {
        city: tripLocation.city.trim(),
        country: tripLocation.country.trim(),
        countryCode: tripLocation.countryCode,
        googlePlaceId: tripLocation.googlePlaceId,
        latitude: tripLocation.latitude,
        longitude: tripLocation.longitude,
        startDate,
        endDate: endDate || startDate,
      };
      return editingTripId
        ? apiRequest("PATCH", `/api/users/${userId}/travel-plans/${editingTripId}`, payload)
        : apiRequest("POST", `/api/users/${userId}/travel-plans`, payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/travel-plans`] });
      await queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/wishlist-matches`] });
      toast({
        title: editingTripId ? "Radar trip updated" : "Trip added to Radar",
        description: "Tap Scan now to look for shows immediately.",
      });
      resetTripForm();
    },
    onError: () => toast({ title: "Couldn't save trip", variant: "destructive" }),
  });

  const removeTrip = useMutation({
    mutationFn: (tripId: number) =>
      apiRequest("DELETE", `/api/users/${userId}/travel-plans/${tripId}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/travel-plans`] });
      await queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/wishlist-matches`] });
      toast({ title: "Trip removed from Radar" });
    },
    onError: () => toast({ title: "Couldn't remove trip", variant: "destructive" }),
  });

  const scanNow = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/users/${userId}/scan-wishlist`);
      return res.json() as Promise<{
        usersScanned: number;
        queries: number;
        matchesCreated: number;
        notificationsCreated: number;
        errors: string[];
      }>;
    },
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/wishlist-matches`] });
      await queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      const extra = result.errors.length ? ` (${result.errors.length} warning${result.errors.length === 1 ? "" : "s"})` : "";
      toast({
        title: result.matchesCreated > 0
          ? `Found ${result.matchesCreated} new show${result.matchesCreated === 1 ? "" : "s"}`
          : "No new matches",
        description: result.errors[0] || `Checked ${result.queries} artist × trip search${result.queries === 1 ? "" : "es"}${extra}`,
      });
    },
    onError: (err: Error) => toast({ title: "Scan failed", description: err.message, variant: "destructive" }),
  });

  const isLoading = artistsLoading || tripsLoading || matchesLoading;
  const isEmpty = artists.length === 0 && trips.length === 0;
  const tripFormValid =
    tripLocation.city.trim() &&
    tripLocation.country.trim() &&
    startDate &&
    (!endDate || endDate >= startDate);

  return (
    <div className="min-h-screen bg-[#121212] pb-32">
      <Header />
      <main className="mx-auto max-w-2xl px-4 pb-8 pt-5">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <RadarIcon className="h-5 w-5 text-[#ff6fae]" />
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#ff8fbd]">Control board</p>
            </div>
            <h1 className="text-3xl font-black text-white">Radar</h1>
            <p className="mt-1 text-sm text-[#888]">Your artists, trips, and shows—tuned to the same frequency.</p>
          </div>
          {!isLoading && (
            <div className="flex flex-col items-end gap-2">
              <div className="rounded-full border border-[#333] bg-[#181818] px-3 py-1.5 text-xs font-semibold text-[#c2f970]">
                {matches.length} match{matches.length === 1 ? "" : "es"}
              </div>
              <button
                type="button"
                onClick={() => scanNow.mutate()}
                disabled={scanNow.isPending || artists.length === 0 || trips.length === 0}
                className="flex items-center gap-1.5 rounded-full border border-[#c2f970]/30 bg-[#c2f970]/10 px-3 py-1.5 text-xs font-semibold text-[#c2f970] hover:bg-[#c2f970]/20 disabled:opacity-40"
              >
                <RefreshCw className={cn("h-3.5 w-3.5", scanNow.isPending && "animate-spin")} />
                {scanNow.isPending ? "Scanning…" : "Scan now"}
              </button>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-64 w-full rounded-[24px]" />
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-32 rounded-2xl" />
              <Skeleton className="h-32 rounded-2xl" />
            </div>
          </div>
        ) : featuredMatch ? (
          <section className="relative mb-6 min-h-[280px] overflow-hidden rounded-[26px] border border-white/15 bg-[#28122f] shadow-2xl">
            {featuredMatch.imageUrl ? (
              <img src={featuredMatch.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-[#ff4d8d] via-[#8f5cff] to-[#252069]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/65 to-black/10" />
            <div className="relative flex min-h-[280px] flex-col justify-end p-5">
              <div className="mb-auto flex items-center justify-between">
                <span className="rounded-full border border-white/20 bg-black/35 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-white backdrop-blur-md">
                  Next on your Radar
                </span>
                <span className="rounded-full bg-[#c2f970] px-2.5 py-1 text-[10px] font-bold text-black">Ticketmaster</span>
              </div>
              <p className="text-sm font-semibold text-[#ff9bc7]">{featuredMatch.artistName}</p>
              <h2 className="mt-1 text-2xl font-black leading-tight text-white">{featuredMatch.eventName}</h2>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/75">
                {featuredMatch.venueName && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{featuredMatch.venueName}</span>}
                {featuredMatch.eventStartAt && <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{formatDate(featuredMatch.eventStartAt)}</span>}
                {featuredTrip && <span className="flex items-center gap-1"><Plane className="h-3.5 w-3.5" />{featuredTrip.city}</span>}
              </div>
              {featuredMatch.ticketUrl && (
                <a
                  href={featuredMatch.ticketUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-white py-3 text-sm font-bold text-black transition hover:bg-[#c2f970]"
                >
                  Tickets & info <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>
          </section>
        ) : (
          <section className="relative mb-6 overflow-hidden rounded-[26px] border border-[#ff6fae]/25 bg-gradient-to-br from-[#35152a] via-[#24183e] to-[#17243d] p-5">
            <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-[#ff4d8d]/20 blur-3xl" />
            <div className="relative">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#ff6fae]/15">
                {isEmpty ? <Sparkles className="h-6 w-6 text-[#ff83ba]" /> : <RadarIcon className="h-6 w-6 text-[#c2f970]" />}
              </div>
              <h2 className="text-2xl font-black text-white">
                {isEmpty ? "Build your Radar" : "Radar is scanning"}
              </h2>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-[#b9aeb7]">
                {isEmpty
                  ? "Add artists you want to see and the places you're headed. We'll connect the dots."
                  : artists.length === 0
                    ? "Your trips are set. Add artists to start looking for shows."
                    : trips.length === 0
                      ? "Your artists are tuned in. Add a trip to start matching shows."
                      : "Your artists and trips are set. Tap Scan now to look for shows across every trip city."}
              </p>
              <div className="mt-5 grid grid-cols-2 gap-2">
                <button onClick={() => setShowArtistForm(true)} className="rounded-xl bg-white/10 px-3 py-3 text-left text-sm font-semibold text-white hover:bg-white/15">
                  <Music2 className="mb-2 h-4 w-4 text-[#ff83ba]" />Add artists
                </button>
                <button onClick={() => setShowTripForm(true)} className="rounded-xl bg-white/10 px-3 py-3 text-left text-sm font-semibold text-white hover:bg-white/15">
                  <Plane className="mb-2 h-4 w-4 text-[#c2f970]" />Add a trip
                </button>
              </div>
            </div>
          </section>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <section className="rounded-2xl border border-[#292929] bg-[#181818] p-4">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#ff83ba]">Watching</p>
                <h2 className="mt-1 text-lg font-bold text-white">Artists on Radar</h2>
              </div>
              <button onClick={() => setShowArtistForm(value => !value)} className="flex h-9 w-9 items-center justify-center rounded-full bg-[#ff6fae]/12 text-[#ff83ba]">
                {showArtistForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              </button>
            </div>

            {showArtistForm && (
              <div className="mb-4 rounded-xl border border-[#333] bg-[#111] p-3">
                {replacingArtistId && (
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs text-[#aaa]">
                      Replace <span className="font-semibold text-white">{artists.find(artist => artist.id === replacingArtistId)?.artistName}</span>
                    </p>
                    <button onClick={resetArtistForm} className="text-[10px] font-semibold text-[#ff83ba]">Cancel</button>
                  </div>
                )}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#666]" />
                  <Input
                    autoFocus
                    value={artistInput}
                    onChange={event => updateArtistInput(event.target.value)}
                    onFocus={() => artistInput.length >= 2 && setShowArtistResults(true)}
                    placeholder="Search artist…"
                    className="bg-[#202020] pl-9 text-white"
                  />
                  {showArtistResults && artistInput.trim().length >= 2 && (
                    <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-52 overflow-y-auto rounded-xl border border-[#333] bg-[#222] shadow-xl">
                      {artistSearching ? (
                        <p className="p-3 text-center text-xs text-[#888]">Searching…</p>
                      ) : (spotifyData?.results ?? []).length > 0 ? (
                        spotifyData!.results.map(artist => (
                          <button key={artist.spotifyId} onClick={() => chooseArtist(artist)} className="flex w-full items-center gap-2.5 p-2.5 text-left hover:bg-[#303030]">
                            {artist.imageUrl ? <img src={artist.imageUrl} alt="" className="h-8 w-8 rounded-full object-cover" /> : <div className="h-8 w-8 rounded-full bg-[#333]" />}
                            <span className="min-w-0 flex-1 truncate text-sm text-white">{artist.name}</span>
                            <Check className="h-3.5 w-3.5 text-[#ff83ba]" />
                          </button>
                        ))
                      ) : (
                        <p className="p-3 text-xs text-[#777]">No results. You can add the name as typed.</p>
                      )}
                    </div>
                  )}
                </div>
                <Button
                  onClick={() => addArtist.mutate()}
                  disabled={!artistInput.trim() || addArtist.isPending}
                  className="mt-2 w-full bg-gradient-to-r from-[#ff4d8d] to-[#8f5cff] font-bold text-white"
                >
                  {addArtist.isPending ? "Saving…" : replacingArtistId ? "Replace artist" : "Add to Radar"}
                </Button>
              </div>
            )}

            {artists.length === 0 ? (
              <button onClick={() => setShowArtistForm(true)} className="w-full rounded-xl border border-dashed border-[#3a3a3a] p-6 text-center">
                <Music2 className="mx-auto mb-2 h-7 w-7 text-[#555]" />
                <p className="text-sm text-[#aaa]">No artists yet</p>
                <p className="mt-1 text-xs text-[#666]">Add someone you want to see live</p>
              </button>
            ) : (
              <div className="space-y-2">
                {artists.map(artist => (
                  <div key={artist.id} className="flex items-center gap-3 rounded-xl bg-[#222] p-2.5">
                    {artist.spotifyImageUrl ? (
                      <img src={artist.spotifyImageUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#333]"><Music2 className="h-4 w-4 text-[#777]" /></div>
                    )}
                    <p className="min-w-0 flex-1 truncate text-sm font-semibold text-white">{artist.artistName}</p>
                    <button
                      onClick={() => replaceArtist(artist)}
                      className="rounded-lg p-2 text-[#666] hover:bg-white/5 hover:text-white"
                      aria-label={`Replace ${artist.artistName} on Radar`}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => removeArtist.mutate(artist.id)}
                      disabled={removeArtist.isPending}
                      className="rounded-lg p-2 text-[#666] hover:bg-rose-500/10 hover:text-rose-400"
                      aria-label={`Remove ${artist.artistName} from Radar`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-[#292929] bg-[#181818] p-4">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#c2f970]">Travel windows</p>
                <h2 className="mt-1 text-lg font-bold text-white">Radar trips</h2>
              </div>
              <button
                onClick={() => showTripForm ? resetTripForm() : setShowTripForm(true)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[#c2f970]/12 text-[#c2f970]"
              >
                {showTripForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              </button>
            </div>

            {showTripForm && (
              <div className="mb-4 space-y-2 rounded-xl border border-[#333] bg-[#111] p-3">
                <GoogleCityAutocomplete value={tripLocation} onChange={setTripLocation} />
                <div className="grid grid-cols-2 gap-2">
                  <div><p className="mb-1 text-[10px] text-[#666]">Start</p><Input type="date" value={startDate} onChange={event => setStartDate(event.target.value)} className="bg-[#202020] text-white" /></div>
                  <div><p className="mb-1 text-[10px] text-[#666]">End</p><Input type="date" min={startDate || undefined} value={endDate} onChange={event => setEndDate(event.target.value)} className="bg-[#202020] text-white" /></div>
                </div>
                <Button
                  onClick={() => saveTrip.mutate()}
                  disabled={!tripFormValid || saveTrip.isPending}
                  className="w-full bg-gradient-to-r from-[#c2f970] to-[#ecffa1] font-bold text-black"
                >
                  {saveTrip.isPending ? "Saving…" : editingTripId ? "Update trip" : "Add trip"}
                </Button>
                <p className="text-center text-[10px] text-[#555]">Match results refresh on the next scheduled scan.</p>
              </div>
            )}

            {trips.length === 0 ? (
              <button onClick={() => setShowTripForm(true)} className="w-full rounded-xl border border-dashed border-[#3a3a3a] p-6 text-center">
                <Plane className="mx-auto mb-2 h-7 w-7 text-[#555]" />
                <p className="text-sm text-[#aaa]">No trips yet</p>
                <p className="mt-1 text-xs text-[#666]">Add a destination and date window</p>
              </button>
            ) : (
              <div className="space-y-2">
                {trips.map(trip => (
                  <div key={trip.id} className="rounded-xl bg-[#222] p-3">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#c2f970]/10">
                        <Plane className="h-4 w-4 text-[#c2f970]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-white">{trip.city}, {trip.country}</p>
                        <p className="mt-0.5 text-xs text-[#777]">{tripDates(trip)}</p>
                      </div>
                      <button onClick={() => editTrip(trip)} className="rounded-lg p-1.5 text-[#777] hover:bg-white/5 hover:text-white" aria-label={`Edit trip to ${trip.city}`}>
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => removeTrip.mutate(trip.id)} disabled={removeTrip.isPending} className="rounded-lg p-1.5 text-[#666] hover:bg-rose-500/10 hover:text-rose-400" aria-label={`Remove trip to ${trip.city}`}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {additionalMatches.length > 0 && (
          <section className="mt-6">
            <div className="mb-3 flex items-end justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#b388eb]">More signals</p>
                <h2 className="mt-1 text-lg font-bold text-white">More shows found</h2>
              </div>
              <p className="text-xs text-[#666]">{additionalMatches.length} upcoming</p>
            </div>
            <div className="space-y-4">
              {trips.map(trip => {
                const tripMatches = matchesByTrip.get(trip.id) ?? [];
                if (tripMatches.length === 0) return null;
                return (
                  <div key={trip.id}>
                    <p className="mb-2 text-xs font-semibold text-[#888]">{trip.city} · {trip.targetDate}</p>
                    <div className="space-y-2">
                      {tripMatches.map(match => (
                        <div key={match.id} className="flex gap-3 rounded-xl border border-[#292929] bg-[#181818] p-3">
                          {match.imageUrl ? <img src={match.imageUrl} alt="" className="h-14 w-14 flex-shrink-0 rounded-lg object-cover" /> : <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-lg bg-[#282828]"><Ticket className="h-5 w-5 text-[#666]" /></div>}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold text-white">{match.artistName}</p>
                            <p className="truncate text-xs text-[#aaa]">{match.eventName}</p>
                            <p className="mt-1 flex items-center gap-1 text-[11px] text-[#666]"><Clock className="h-3 w-3" />{formatDate(match.eventStartAt)}</p>
                          </div>
                          {match.ticketUrl && (
                            <a href={match.ticketUrl} target="_blank" rel="noreferrer" className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#c2f970]/12 text-[#c2f970]" aria-label={`Tickets for ${match.eventName}`}>
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
