import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import ThreadCard from "@/components/cards/ThreadCard";
import { cn } from "@/lib/utils";
import { MapPin, MessageCircle, Ticket, Disc3, Star, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import FollowArtistButton from "@/components/FollowArtistButton";
import SaveArtistWishlistButton from "@/components/SaveArtistWishlistButton";
import type { Place, Thread } from "@shared/schema";

type PrimaryTab = "following" | "discover";
type PillTab = "artists" | "albums" | "shows" | "places";

const PILL_TABS: { id: PillTab; label: string }[] = [
  { id: "artists", label: "Artists" },
  { id: "albums", label: "Albums" },
  { id: "shows", label: "Shows" },
  { id: "places", label: "Places" },
];

const SECTION_LABELS: Record<PrimaryTab, Record<PillTab, string>> = {
  following: {
    artists: "TRENDING ACROSS ARTISTS YOU FOLLOW",
    albums: "ALBUM REVIEWS FROM ARTISTS YOU FOLLOW",
    shows: "SHOW REVIEWS FROM ARTISTS YOU FOLLOW",
    places: "THREADS FROM PLACES YOU FOLLOW",
  },
  discover: {
    artists: "TRENDING ARTISTS ON PULSE",
    albums: "TRENDING ALBUM REVIEWS",
    shows: "TRENDING SHOW REVIEWS",
    places: "TRENDING PLACE THREADS",
  },
};

function CardSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-[#181818] rounded-xl h-24 animate-pulse" />
      ))}
    </div>
  );
}

function EmptyState({ icon: Icon, message }: { icon: typeof MessageCircle; message: string }) {
  return (
    <div className="text-center py-12 text-[#B3B3B3]">
      <Icon className="h-10 w-10 mx-auto mb-3 opacity-20" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

function StarRow({ rating, size = "sm" }: { rating: number; size?: "sm" }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <Star key={n} className={cn("h-2.5 w-2.5", n <= Math.round(rating) ? "fill-yellow-400 text-yellow-400" : "text-[#3E3E3E]")} />
      ))}
    </div>
  );
}

function FirstReviewerChip({ username }: { username: string | null }) {
  if (!username) return null;
  return (
    <span className="text-[10px] text-[#555]">
      First reviewed by <span className="text-[#c2f970]">@{username}</span>
    </span>
  );
}

// ─── Shows Feed ──────────────────────────────────────────────────────────────

interface ShowFeedItem {
  id: number;
  artistName: string;
  venueName: string;
  city: string;
  country: string;
  eventDate: string;
  avgRating: number | null;
  reviewCount: number;
  firstReviewerUsername: string | null;
}

function ShowCard({ show }: { show: ShowFeedItem }) {
  return (
    <Link href={`/shows/${show.id}`}>
      <div className="bg-[#181818] rounded-xl p-4 cursor-pointer hover:bg-[#1e1e1e] transition-colors">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Ticket className="h-4 w-4 text-orange-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
              <span className="text-xs font-semibold text-white truncate">{show.artistName}</span>
              <div className="flex items-center gap-1 flex-shrink-0">
                <FollowArtistButton artistName={show.artistName} />
                <SaveArtistWishlistButton artistName={show.artistName} />
              </div>
            </div>
            <p className="text-xs text-[#B3B3B3] mb-1 truncate">
              {show.venueName} · {show.city}, {show.country}
            </p>
            <div className="flex items-center gap-1 text-[10px] text-[#555] mb-1.5">
              <Calendar className="h-2.5 w-2.5" />
              <span>{show.eventDate}</span>
            </div>
            <div className="flex items-center gap-2">
              {show.avgRating !== null && (
                <div className="flex items-center gap-1">
                  <StarRow rating={show.avgRating} />
                  <span className="text-[10px] text-[#B3B3B3]">{show.avgRating.toFixed(1)} ({show.reviewCount})</span>
                </div>
              )}
              {show.reviewCount === 0 && (
                <span className="text-[10px] text-[#555]">No reviews yet</span>
              )}
              <FirstReviewerChip username={show.firstReviewerUsername} />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

function ShowsFeed() {
  const { data: shows, isLoading } = useQuery<ShowFeedItem[]>({
    queryKey: ["/api/shows"],
  });

  if (isLoading) return <CardSkeleton />;
  if (!shows || shows.length === 0) return <EmptyState icon={Ticket} message="No shows reviewed yet." />;

  const sorted = [...shows].sort((a, b) => b.reviewCount - a.reviewCount || b.eventDate.localeCompare(a.eventDate));
  return (
    <div className="space-y-3">
      {sorted.map(show => <ShowCard key={show.id} show={show} />)}
    </div>
  );
}

// ─── Albums Feed ─────────────────────────────────────────────────────────────

interface AlbumFeedItem {
  albumId: string;
  albumName: string | null;
  artistName: string | null;
  reviewCount: number;
  avgRating: number | null;
  firstReviewerUsername: string | null;
  latestThreadId: number | null;
}

function AlbumCard({ album }: { album: AlbumFeedItem }) {
  return (
    <Link href={`/album/${album.albumId}`}>
      <div className="bg-[#181818] rounded-xl p-4 cursor-pointer hover:bg-[#1e1e1e] transition-colors">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-[#b388eb]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Disc3 className="h-4 w-4 text-[#b388eb]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white leading-snug mb-0.5 truncate">{album.albumName ?? "Unknown Album"}</p>
            <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
              <span className="text-xs text-[#B3B3B3] truncate">{album.artistName ?? "Unknown Artist"}</span>
              {album.artistName && (
                <div className="flex items-center gap-1 flex-shrink-0">
                  <FollowArtistButton artistName={album.artistName} />
                  <SaveArtistWishlistButton artistName={album.artistName} />
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {album.avgRating !== null && (
                <div className="flex items-center gap-1">
                  <StarRow rating={album.avgRating} />
                  <span className="text-[10px] text-[#B3B3B3]">{album.avgRating.toFixed(1)} ({album.reviewCount} {album.reviewCount === 1 ? "review" : "reviews"})</span>
                </div>
              )}
              <FirstReviewerChip username={album.firstReviewerUsername} />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

function AlbumsFeed() {
  const { data: albums, isLoading } = useQuery<AlbumFeedItem[]>({
    queryKey: ["/api/feed/albums"],
  });

  if (isLoading) return <CardSkeleton />;
  if (!albums || albums.length === 0) return <EmptyState icon={Disc3} message="No album reviews yet." />;

  return (
    <div className="space-y-3">
      {albums.map(album => <AlbumCard key={album.albumId} album={album} />)}
    </div>
  );
}

// ─── Places Feed ─────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  bar: "Bar",
  club: "Club",
  record_store: "Record Store",
  coffee_shop: "Coffee Shop",
  other: "Other",
};

type PlaceWithStats = Place & { firstReviewerUsername: string | null };

function PlaceCard({ place }: { place: PlaceWithStats }) {
  return (
    <Link href={`/places/${place.id}`}>
      <div className="bg-[#181818] rounded-xl p-4 cursor-pointer hover:bg-[#1e1e1e] transition-colors">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-[#1a2a1a] flex items-center justify-center flex-shrink-0 mt-0.5">
            <MapPin className="h-4 w-4 text-[#c2f970]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
              <p className="text-sm font-semibold text-white truncate">{place.name}</p>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#282828] text-[#B3B3B3] flex-shrink-0">
                {CATEGORY_LABELS[place.category] ?? place.category}
              </span>
            </div>
            <p className="text-xs text-[#B3B3B3] mb-1.5">{place.city}, {place.country}</p>
            <div className="flex items-center gap-2">
              {(place.rating ?? 0) > 0 && (
                <div className="flex items-center gap-1">
                  <StarRow rating={place.rating ?? 0} />
                  <span className="text-[10px] text-[#B3B3B3]">{(place.rating ?? 0).toFixed(1)} ({place.reviewsCount ?? 0})</span>
                </div>
              )}
              <FirstReviewerChip username={place.firstReviewerUsername} />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

function PlacesFeed() {
  const { data: places, isLoading } = useQuery<PlaceWithStats[]>({
    queryKey: ["/api/places"],
  });

  if (isLoading) return <CardSkeleton />;
  if (!places || places.length === 0) return <EmptyState icon={MapPin} message="No places added yet." />;

  return (
    <div className="space-y-3">
      {places.map(place => <PlaceCard key={place.id} place={place} />)}
    </div>
  );
}

// ─── Artists Feed (threads) ──────────────────────────────────────────────────

function ThreadSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="bg-[#181818] rounded-xl h-28 animate-pulse" />
      ))}
    </div>
  );
}

function ArtistsFeed() {
  const { data: threads, isLoading } = useQuery<Thread[]>({
    queryKey: ["/api/threads/featured", { threadType: "artist" }],
    queryFn: async () => {
      const res = await fetch(`/api/threads/featured?threadType=artist&limit=20`);
      return res.json();
    },
  });

  if (isLoading) return <ThreadSkeleton />;
  if (!threads || threads.length === 0) {
    return <EmptyState icon={MessageCircle} message="No threads here yet." />;
  }

  return (
    <div className="space-y-3">
      {threads.map(thread => (
        <ThreadCard key={thread.id} thread={thread} />
      ))}
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function Home() {
  const [primary, setPrimary] = useState<PrimaryTab>("following");
  const [pill, setPill] = useState<PillTab>("artists");

  const sectionLabel = SECTION_LABELS[primary][pill];

  return (
    <div className="min-h-screen bg-[#121212] pb-24">
      <Header />

      <div className="flex border-b border-[#2A2A2A]">
        {(["following", "discover"] as PrimaryTab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setPrimary(tab)}
            className={cn(
              "flex-1 py-3.5 text-sm font-semibold capitalize transition-colors",
              primary === tab
                ? "text-[#c2f970] border-b-2 border-[#c2f970] -mb-px"
                : "text-[#666] hover:text-[#B3B3B3]"
            )}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide">
        {PILL_TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setPill(id)}
            className={cn(
              "flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border transition-colors",
              pill === id
                ? "bg-gradient-to-r from-[#b388eb] to-[#ff6fd8] text-white border-transparent"
                : "bg-transparent text-[#B3B3B3] border-[#3E3E3E] hover:border-[#666]"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="px-4 pb-3">
        <p className="text-[10px] font-semibold tracking-widest text-[#555] uppercase">
          {sectionLabel}
        </p>
      </div>

      <main className="px-4">
        {pill === "shows" && <ShowsFeed />}
        {pill === "albums" && <AlbumsFeed />}
        {pill === "places" && <PlacesFeed />}
        {pill === "artists" && <ArtistsFeed />}
      </main>

      <BottomNav />
    </div>
  );
}
