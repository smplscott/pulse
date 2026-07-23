import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  MessageSquare, Music2, MapPin, Edit, Mic,
  Plus, Plane, Star, Trash2, ChevronRight,
  CalendarDays, Bookmark,
} from "lucide-react";
import ThreadCard from "@/components/cards/ThreadCard";
import { useAuth } from "@/context/AuthContext";
import { Thread, Place, Show, ShowReview, UserTravelPlan, UserShowWishlistItem } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

type PublicUser = {
  id: number;
  username: string;
  displayName?: string | null;
  bio?: string | null;
  city?: string | null;
  profilePicture?: string | null;
  favoriteGenres?: string[];
  showReviewCount?: number;
  placesCount?: number;
};

type ShowReviewWithShow = ShowReview & { show: Show };

const TASTE_COLORS: Record<string, string> = {
  "Electronic": "bg-[#5271ff]/20 text-[#5271ff]",
  "Rock": "bg-rose-500/20 text-rose-400",
  "Pop": "bg-pink-500/20 text-pink-400",
  "R&B": "bg-purple-500/20 text-purple-400",
  "Hip-Hop": "bg-amber-500/20 text-amber-400",
  "House": "bg-teal-500/20 text-teal-400",
  "Techno": "bg-cyan-500/20 text-cyan-400",
  "Jazz": "bg-orange-500/20 text-orange-400",
  "Soul": "bg-violet-500/20 text-violet-400",
};

const CATEGORY_LABELS: Record<string, string> = {
  bar: "Bar",
  club: "Club",
  record_store: "Record Store",
  coffee_shop: "Café",
  other: "Other",
};

function tasteColor(genre: string): string {
  return TASTE_COLORS[genre] ?? "bg-[#282828] text-[#B3B3B3]";
}

function IWasThereTag() {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#5271ff]/15 text-[#5271ff] border border-[#5271ff]/30 uppercase tracking-wide">
      <Mic className="h-2.5 w-2.5" />
      I was there
    </span>
  );
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={`h-3 w-3 ${i <= rating ? "fill-[#c2f970] text-[#c2f970]" : "text-[#444]"}`} />
      ))}
    </div>
  );
}

function EditProfileDialog({ user, onUpdated }: { user: PublicUser; onUpdated: () => void }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [displayName, setDisplayName] = useState(user.displayName ?? "");
  const [bio, setBio] = useState(user.bio ?? "");
  const [city, setCity] = useState(user.city ?? "");

  const mutation = useMutation({
    mutationFn: (body: { displayName?: string; bio?: string; city?: string | null }) =>
      apiRequest("PATCH", `/api/users/${user.id}`, body),
    onSuccess: async () => {
      await onUpdated();
      setOpen(false);
      toast({ title: "Profile updated" });
    },
    onError: () => toast({ title: "Failed to update profile", variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="text-[#B3B3B3] hover:text-white flex-shrink-0">
          <Edit className="h-4 w-4" />
        </button>
      </DialogTrigger>
      <DialogContent className="bg-[#111] border-[#333] text-white max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-xs text-[#B3B3B3] font-medium">Display name</label>
            <Input value={displayName} onChange={e => setDisplayName(e.target.value)} maxLength={50} className="bg-[#1a1a1a] border-[#333] text-white" placeholder="Your name" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-[#B3B3B3] font-medium">City / scene</label>
            <Input value={city} onChange={e => setCity(e.target.value)} maxLength={100} className="bg-[#1a1a1a] border-[#333] text-white" placeholder="e.g. East London, Berlin, Detroit" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-[#B3B3B3] font-medium">Bio</label>
            <Textarea value={bio} onChange={e => setBio(e.target.value)} maxLength={300} rows={3} className="bg-[#1a1a1a] border-[#333] text-white resize-none" placeholder="Tell the community about your taste…" />
            <p className="text-right text-[10px] text-[#555]">{bio.length}/300</p>
          </div>
          <div className="flex gap-2 pt-1">
            <Button variant="outline" className="flex-1 border-[#333] text-[#B3B3B3] hover:bg-[#222]" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              className="flex-1 bg-[#5271ff] hover:bg-[#3f5be0] text-white"
              onClick={() => mutation.mutate({ displayName: displayName || undefined, bio: bio || undefined, city: city || null })}
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Profile() {
  const { username } = useParams<{ username?: string }>();
  const { user: authUser } = useAuth();
  const { toast } = useToast();

  const isOwnProfile = !username || username === authUser?.username;
  const resolvedUsername = username || authUser?.username;

  const [activeSection, setActiveSection] = useState<"threads" | "places" | "shows">("threads");
  const [threadTab, setThreadTab] = useState<"started" | "joined">("started");
  const [placesTab, setPlacesTab] = useState<"been" | "going">("been");
  const [showsTab, setShowsTab] = useState<"attended" | "wishlist">("attended");

  const [tpCity, setTpCity] = useState("");
  const [tpCountry, setTpCountry] = useState("");
  const [tpDate, setTpDate] = useState("");
  const [wlArtist, setWlArtist] = useState("");

  const { data: profileUser, isLoading: isLoadingUser } = useQuery<PublicUser>({
    queryKey: [`/api/users/username/${resolvedUsername}`],
    enabled: !!resolvedUsername,
  });

  const userId = profileUser?.id;

  const { data: startedThreads, isLoading: isLoadingStarted } = useQuery<Thread[]>({
    queryKey: [`/api/users/${userId}/threads`],
    enabled: !!userId,
  });

  const { data: engagedThreads, isLoading: isLoadingEngaged } = useQuery<Thread[]>({
    queryKey: [`/api/users/${userId}/threads/engaged`],
    enabled: !!userId,
  });

  const { data: userPlaces, isLoading: isLoadingPlaces } = useQuery<Place[]>({
    queryKey: ["/api/users", userId, "places"],
    enabled: activeSection === "places" && !!userId,
  });

  const { data: travelPlans, isLoading: isLoadingPlans } = useQuery<UserTravelPlan[]>({
    queryKey: ["/api/users", userId, "travel-plans"],
    enabled: activeSection === "places" && !!userId,
  });

  const { data: showReviews, isLoading: isLoadingShowReviews } = useQuery<ShowReviewWithShow[]>({
    queryKey: ["/api/users", userId, "show-reviews"],
    enabled: activeSection === "shows" && !!userId,
  });

  const { data: showWishlist, isLoading: isLoadingWishlist } = useQuery<UserShowWishlistItem[]>({
    queryKey: ["/api/users", userId, "show-wishlist"],
    enabled: activeSection === "shows" && !!userId,
  });

  const genres = (profileUser?.favoriteGenres as string[] | undefined) ?? [];
  const activeThreadsCount = (startedThreads?.length ?? 0) + (engagedThreads?.length ?? 0);

  const handleProfileUpdated = async () => {
    await queryClient.invalidateQueries({ queryKey: [`/api/users/username/${resolvedUsername}`] });
  };

  const addTravelPlan = useMutation({
    mutationFn: () => apiRequest("POST", `/api/users/${userId}/travel-plans`, { city: tpCity, country: tpCountry, targetDate: tpDate }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", userId, "travel-plans"] });
      setTpCity(""); setTpCountry(""); setTpDate("");
    },
    onError: () => toast({ title: "Failed to add plan", variant: "destructive" }),
  });

  const deleteTravelPlan = useMutation({
    mutationFn: (planId: number) => apiRequest("DELETE", `/api/users/${userId}/travel-plans/${planId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/users", userId, "travel-plans"] }),
    onError: () => toast({ title: "Failed to remove plan", variant: "destructive" }),
  });

  const addWishlist = useMutation({
    mutationFn: () => apiRequest("POST", `/api/users/${userId}/show-wishlist`, { artistName: wlArtist }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", userId, "show-wishlist"] });
      setWlArtist("");
    },
    onError: () => toast({ title: "Failed to add to wishlist", variant: "destructive" }),
  });

  const removeWishlist = useMutation({
    mutationFn: (itemId: number) => apiRequest("DELETE", `/api/users/${userId}/show-wishlist/${itemId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/users", userId, "show-wishlist"] }),
    onError: () => toast({ title: "Failed to remove from wishlist", variant: "destructive" }),
  });

  const placesByYear = (() => {
    if (!userPlaces) return {} as Record<string, Place[]>;
    const map: Record<string, Place[]> = {};
    for (const p of userPlaces) {
      const year = p.createdAt ? new Date(p.createdAt).getFullYear().toString() : "Unknown";
      if (!map[year]) map[year] = [];
      map[year].push(p);
    }
    return map;
  })();
  const sortedYears = Object.keys(placesByYear).sort((a, b) => parseInt(b) - parseInt(a));

  const tileClass = (section: "threads" | "places" | "shows") =>
    `bg-[#181818] rounded-lg p-3 text-center cursor-pointer transition-all border-b-2 ${
      activeSection === section
        ? "border-[#c2f970] bg-[#1c2a10]/60"
        : "border-transparent hover:bg-[#1e1e1e]"
    }`;

  const subTabClass = (active: boolean) =>
    `px-3 py-1.5 text-xs font-medium rounded-full transition-all ${
      active ? "pink-gradient text-white" : "text-[#888] hover:text-white"
    }`;

  return (
    <div className="min-h-screen pb-32">
      <Header />
      <main>
        {isLoadingUser ? (
          <div className="pt-6 px-4 space-y-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-20 w-20 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
          </div>
        ) : profileUser ? (
          <div className="px-4 pt-5">
            {/* Avatar + name row */}
            <div className="flex items-start gap-4 mb-4">
              <div className="w-20 h-20 rounded-full bg-[#282828] overflow-hidden flex-shrink-0 border-2 border-[#5271ff]">
                {profileUser.profilePicture ? (
                  <img src={profileUser.profilePicture} alt={profileUser.username} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#3E3E3E]">
                    <span className="text-2xl font-bold text-white">
                      {(profileUser.displayName || profileUser.username).charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0 pt-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold truncate">
                    {profileUser.displayName || profileUser.username}
                  </h1>
                  {isOwnProfile && profileUser && (
                    <EditProfileDialog user={profileUser} onUpdated={handleProfileUpdated} />
                  )}
                </div>
                <p className="text-sm text-[#B3B3B3]">@{profileUser.username}</p>
                {profileUser.city && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3 w-3 text-[#666]" />
                    <span className="text-xs text-[#888]">{profileUser.city}</span>
                  </div>
                )}
                {profileUser.bio && (
                  <p className="text-sm text-white mt-1.5 leading-relaxed">{profileUser.bio}</p>
                )}
              </div>
            </div>

            {/* Music taste tags */}
            {genres.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <Music2 className="h-3.5 w-3.5 text-[#666]" />
                  <span className="text-xs text-[#666] font-medium">Music taste</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {genres.slice(0, 8).map(g => (
                    <span key={g} className={`text-xs px-2.5 py-1 rounded-full font-medium ${tasteColor(g)}`}>{g}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Stat tiles — clickable section switchers */}
            <div className="grid grid-cols-3 gap-2 mb-5">
              <button className={tileClass("threads")} onClick={() => setActiveSection("threads")}>
                <p className="text-lg font-bold">{activeThreadsCount || "—"}</p>
                <p className="text-xs text-[#B3B3B3]">Active threads</p>
              </button>
              <button className={tileClass("places")} onClick={() => setActiveSection("places")}>
                <p className="text-lg font-bold">{profileUser.placesCount ?? "—"}</p>
                <p className="text-xs text-[#B3B3B3]">Places added</p>
              </button>
              <button className={tileClass("shows")} onClick={() => setActiveSection("shows")}>
                <p className="text-lg font-bold">{profileUser.showReviewCount ?? "—"}</p>
                <p className="text-xs text-[#B3B3B3]">Shows attended</p>
              </button>
            </div>
          </div>
        ) : (
          <div className="pt-12 px-4 text-center">
            <p className="text-[#B3B3B3]">User not found</p>
          </div>
        )}

        {/* Dynamic section content */}
        {profileUser && (
          <div className="px-4">

            {/* ── THREADS SECTION ── */}
            {activeSection === "threads" && (
              <div>
                <div className="flex gap-2 mb-4">
                  <button className={subTabClass(threadTab === "started")} onClick={() => setThreadTab("started")}>
                    <span className="flex items-center gap-1.5">
                      <Plus className="h-3 w-3" />
                      Started
                    </span>
                  </button>
                  <button className={subTabClass(threadTab === "joined")} onClick={() => setThreadTab("joined")}>
                    <span className="flex items-center gap-1.5">
                      <MessageSquare className="h-3 w-3" />
                      Joined
                    </span>
                  </button>
                </div>

                {threadTab === "started" && (
                  <div className="space-y-4 pb-4">
                    {isLoadingStarted ? (
                      [1, 2, 3].map(i => <Skeleton key={i} className="h-36 w-full" />)
                    ) : startedThreads && startedThreads.length > 0 ? (
                      startedThreads.map(t => (
                        <div key={t.id}>
                          {t.threadType === "live_show_review" && (
                            <div className="mb-1.5"><IWasThereTag /></div>
                          )}
                          <ThreadCard thread={t} />
                        </div>
                      ))
                    ) : (
                      <div className="bg-[#181818] rounded-lg p-8 text-center">
                        <MessageSquare className="h-10 w-10 text-[#3E3E3E] mx-auto mb-3" />
                        <p className="text-sm text-[#B3B3B3]">No threads started yet</p>
                        {isOwnProfile && (
                          <Link href="/create-thread">
                            <button className="mt-3 text-xs text-[#5271ff] hover:underline">Create your first thread</button>
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {threadTab === "joined" && (
                  <div className="space-y-4 pb-4">
                    {isLoadingEngaged ? (
                      [1, 2, 3].map(i => <Skeleton key={i} className="h-36 w-full" />)
                    ) : engagedThreads && engagedThreads.length > 0 ? (
                      engagedThreads.map(t => <ThreadCard key={t.id} thread={t} />)
                    ) : (
                      <div className="bg-[#181818] rounded-lg p-8 text-center">
                        <MessageSquare className="h-10 w-10 text-[#3E3E3E] mx-auto mb-3" />
                        <p className="text-sm text-[#B3B3B3]">No thread activity yet</p>
                        {isOwnProfile && (
                          <Link href="/threads">
                            <button className="mt-3 text-xs text-[#5271ff] hover:underline">Browse threads</button>
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── PLACES SECTION ── */}
            {activeSection === "places" && (
              <div>
                <div className="flex gap-2 mb-4">
                  <button className={subTabClass(placesTab === "been")} onClick={() => setPlacesTab("been")}>
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-3 w-3" />
                      Where I've Been
                    </span>
                  </button>
                  <button className={subTabClass(placesTab === "going")} onClick={() => setPlacesTab("going")}>
                    <span className="flex items-center gap-1.5">
                      <Plane className="h-3 w-3" />
                      Where I'm Going
                    </span>
                  </button>
                </div>

                {placesTab === "been" && (
                  <div className="pb-4">
                    {isLoadingPlaces ? (
                      [1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full mb-3" />)
                    ) : sortedYears.length > 0 ? (
                      sortedYears.map(year => (
                        <div key={year} className="mb-5">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-bold text-[#555] uppercase tracking-widest">{year}</span>
                            <div className="flex-1 h-px bg-[#222]" />
                          </div>
                          <div className="space-y-2">
                            {placesByYear[year].map(p => (
                              <Link key={p.id} href={`/places/${p.id}`}>
                                <div className="bg-[#181818] rounded-lg px-4 py-3 flex items-center gap-3 hover:bg-[#1e1e1e] transition-colors cursor-pointer">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold truncate">{p.name}</p>
                                    <p className="text-xs text-[#888] mt-0.5">{p.city}, {p.country}</p>
                                  </div>
                                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#252525] text-[#888] flex-shrink-0">
                                    {CATEGORY_LABELS[p.category] ?? p.category}
                                  </span>
                                  <ChevronRight className="h-4 w-4 text-[#444] flex-shrink-0" />
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="bg-[#181818] rounded-lg p-8 text-center">
                        <MapPin className="h-10 w-10 text-[#3E3E3E] mx-auto mb-3" />
                        <p className="text-sm text-[#B3B3B3]">No places added yet</p>
                        {isOwnProfile && (
                          <Link href="/places">
                            <button className="mt-3 text-xs text-[#5271ff] hover:underline">Add a place</button>
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {placesTab === "going" && (
                  <div className="pb-4">
                    {isOwnProfile && (
                      <div className="bg-[#181818] rounded-lg p-4 mb-4">
                        <p className="text-xs text-[#888] font-medium mb-3">Add upcoming trip</p>
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <Input placeholder="City" value={tpCity} onChange={e => setTpCity(e.target.value)} className="bg-[#111] border-[#333] text-white text-sm h-9" />
                          <Input placeholder="Country" value={tpCountry} onChange={e => setTpCountry(e.target.value)} className="bg-[#111] border-[#333] text-white text-sm h-9" />
                        </div>
                        <div className="flex gap-2">
                          <Input placeholder="When (e.g. Aug 2026)" value={tpDate} onChange={e => setTpDate(e.target.value)} className="bg-[#111] border-[#333] text-white text-sm h-9 flex-1" />
                          <Button
                            size="sm"
                            className="green-gradient text-black font-semibold h-9 px-4 flex-shrink-0"
                            onClick={() => addTravelPlan.mutate()}
                            disabled={!tpCity.trim() || !tpCountry.trim() || !tpDate.trim() || addTravelPlan.isPending}
                          >
                            Add
                          </Button>
                        </div>
                      </div>
                    )}
                    {isLoadingPlans ? (
                      [1, 2].map(i => <Skeleton key={i} className="h-14 w-full mb-2" />)
                    ) : travelPlans && travelPlans.length > 0 ? (
                      <div className="space-y-2">
                        {travelPlans.map(plan => (
                          <div key={plan.id} className="bg-[#181818] rounded-lg px-4 py-3 flex items-center gap-3">
                            <CalendarDays className="h-4 w-4 text-[#555] flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold">{plan.city}, {plan.country}</p>
                              <p className="text-xs text-[#888] mt-0.5">{plan.targetDate}</p>
                            </div>
                            {isOwnProfile && (
                              <button
                                onClick={() => deleteTravelPlan.mutate(plan.id)}
                                disabled={deleteTravelPlan.isPending}
                                className="text-[#555] hover:text-rose-400 transition-colors p-1"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-[#181818] rounded-lg p-8 text-center">
                        <Plane className="h-10 w-10 text-[#3E3E3E] mx-auto mb-3" />
                        <p className="text-sm text-[#B3B3B3]">
                          {isOwnProfile ? "Add cities you're heading to for shows" : "No upcoming trips added"}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── SHOWS SECTION ── */}
            {activeSection === "shows" && (
              <div>
                <div className="flex gap-2 mb-4">
                  <button className={subTabClass(showsTab === "attended")} onClick={() => setShowsTab("attended")}>
                    <span className="flex items-center gap-1.5">
                      <Mic className="h-3 w-3" />
                      Attended
                    </span>
                  </button>
                  <button className={subTabClass(showsTab === "wishlist")} onClick={() => setShowsTab("wishlist")}>
                    <span className="flex items-center gap-1.5">
                      <Bookmark className="h-3 w-3" />
                      Future Wishlist
                    </span>
                  </button>
                </div>

                {showsTab === "attended" && (
                  <div className="pb-4">
                    {isLoadingShowReviews ? (
                      [1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full mb-2" />)
                    ) : showReviews && showReviews.length > 0 ? (
                      <div className="space-y-2">
                        {showReviews.map(r => (
                          <Link key={r.id} href={`/shows/${r.showId}`}>
                            <div className="bg-[#181818] rounded-lg px-4 py-3 flex items-center gap-3 hover:bg-[#1e1e1e] transition-colors cursor-pointer">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold truncate">{r.show.artistName}</p>
                                <p className="text-xs text-[#888] mt-0.5 truncate">
                                  {r.show.venueName} · {r.show.city} · {r.show.eventDate}
                                </p>
                                <div className="mt-1">
                                  <StarRow rating={r.rating} />
                                </div>
                              </div>
                              <ChevronRight className="h-4 w-4 text-[#444] flex-shrink-0" />
                            </div>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-[#181818] rounded-lg p-8 text-center">
                        <Mic className="h-10 w-10 text-[#3E3E3E] mx-auto mb-3" />
                        <p className="text-sm text-[#B3B3B3]">No shows reviewed yet</p>
                        {isOwnProfile && (
                          <Link href="/shows">
                            <button className="mt-3 text-xs text-[#5271ff] hover:underline">Browse shows</button>
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {showsTab === "wishlist" && (
                  <div className="pb-4">
                    {isOwnProfile && (
                      <div className="bg-[#181818] rounded-lg p-4 mb-4">
                        <p className="text-xs text-[#888] font-medium mb-3">Artists you want to see live</p>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Artist name"
                            value={wlArtist}
                            onChange={e => setWlArtist(e.target.value)}
                            onKeyDown={e => { if (e.key === "Enter" && wlArtist.trim()) addWishlist.mutate(); }}
                            className="bg-[#111] border-[#333] text-white text-sm h-9 flex-1"
                          />
                          <Button
                            size="sm"
                            className="green-gradient text-black font-semibold h-9 px-4 flex-shrink-0"
                            onClick={() => addWishlist.mutate()}
                            disabled={!wlArtist.trim() || addWishlist.isPending}
                          >
                            Add
                          </Button>
                        </div>
                      </div>
                    )}
                    {isLoadingWishlist ? (
                      [1, 2].map(i => <Skeleton key={i} className="h-12 w-full mb-2" />)
                    ) : showWishlist && showWishlist.length > 0 ? (
                      <div className="space-y-2">
                        {showWishlist.map(w => (
                          <div key={w.id} className="bg-[#181818] rounded-lg px-4 py-3 flex items-center gap-3">
                            <Star className="h-4 w-4 text-[#555] flex-shrink-0" />
                            <p className="flex-1 text-sm font-semibold">{w.artistName}</p>
                            {isOwnProfile && (
                              <button
                                onClick={() => removeWishlist.mutate(w.id)}
                                disabled={removeWishlist.isPending}
                                className="text-[#555] hover:text-rose-400 transition-colors p-1"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-[#181818] rounded-lg p-8 text-center">
                        <Star className="h-10 w-10 text-[#3E3E3E] mx-auto mb-3" />
                        <p className="text-sm text-[#B3B3B3]">
                          {isOwnProfile ? "Add artists you want to see live" : "No wishlist yet"}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
