import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Disc3, ChevronLeft, Crown, Star, MessageCircle, Bookmark } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import FollowArtistButton from "@/components/FollowArtistButton";
import SaveArtistWishlistButton from "@/components/SaveArtistWishlistButton";
import { useState } from "react";
import type { Thread, User } from "@shared/schema";
import { useQuery as useUserQuery } from "@tanstack/react-query";
import { formatRelativeTime } from "@/lib/utils";

interface AlbumStats {
  albumId: string;
  albumName: string | null;
  artistName: string | null;
  reviewCount: number;
  avgRating: number | null;
  firstReviewerUsername: string | null;
}

function StarDisplay({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const sz = size === "md" ? "h-5 w-5" : "h-3.5 w-3.5";
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <Star key={n} className={cn(sz, n <= Math.round(rating) ? "fill-yellow-400 text-yellow-400" : "text-[#333]")} />
      ))}
    </div>
  );
}

function RatingDistribution({ reviews }: { reviews: Thread[] }) {
  if (!reviews.length) return null;
  const withRatings = reviews.filter(r => r.starRating);
  if (!withRatings.length) return null;
  const avg = withRatings.reduce((s, r) => s + (r.starRating ?? 0), 0) / withRatings.length;
  const dist = [5, 4, 3, 2, 1].map(n => ({
    n,
    count: withRatings.filter(r => r.starRating === n).length,
  }));
  return (
    <div className="bg-[#181818] rounded-xl p-4 mb-4 flex gap-4 items-center">
      <div className="text-center flex-shrink-0">
        <p className="text-4xl font-bold text-white">{avg.toFixed(1)}</p>
        <StarDisplay rating={avg} size="md" />
        <p className="text-xs text-[#555] mt-1">{withRatings.length} review{withRatings.length !== 1 ? "s" : ""}</p>
      </div>
      <div className="flex-1 space-y-1">
        {dist.map(({ n, count }) => (
          <div key={n} className="flex items-center gap-2">
            <span className="text-xs text-[#555] w-3">{n}</span>
            <div className="flex-1 h-1.5 bg-[#282828] rounded-full overflow-hidden">
              <div
                className="h-full bg-yellow-400 rounded-full"
                style={{ width: withRatings.length ? `${(count / withRatings.length) * 100}%` : "0%" }}
              />
            </div>
            <span className="text-xs text-[#555] w-4 text-right">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReviewCard({ thread }: { thread: Thread }) {
  const { data: user } = useUserQuery<User>({
    queryKey: [`/api/users/${thread.userId}`],
  });

  const createdAt = new Date(thread.createdAt || Date.now());

  return (
    <Link href={`/thread/${thread.id}`}>
      <div className="bg-[#181818] rounded-xl p-4 cursor-pointer hover:bg-[#1e1e1e] transition-colors">
        <div className="flex items-start gap-3">
          <Avatar className="w-8 h-8 rounded-full flex-shrink-0">
            {user?.profilePicture
              ? <img src={user.profilePicture} alt={user.username} className="w-full h-full object-cover rounded-full" />
              : <AvatarFallback className="bg-[#3E3E3E] text-xs">
                  {user?.username?.substring(0, 2).toUpperCase() ?? "U"}
                </AvatarFallback>
            }
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
              <span className="text-xs font-medium text-white">@{user?.username ?? "user"}</span>
              <span className="text-[10px] text-[#555]">· {formatRelativeTime(createdAt)}</span>
            </div>
            {thread.starRating && (
              <div className="mb-1.5">
                <StarDisplay rating={thread.starRating} />
              </div>
            )}
            <p className="text-sm font-semibold text-white leading-snug mb-1">{thread.title}</p>
            <p className="text-xs text-[#B3B3B3] line-clamp-2">{thread.content}</p>
            <div className="flex items-center gap-3 mt-2">
              <span className="flex items-center gap-1 text-xs text-[#555]">
                <MessageCircle className="h-3 w-3" />{thread.commentsCount ?? 0}
              </span>
              <span className="flex items-center gap-1 text-xs text-[#555]">
                <Bookmark className="h-3 w-3" />{thread.savesCount ?? 0}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function AlbumDetail() {
  const { albumId } = useParams<{ albumId: string }>();
  const [activeTab, setActiveTab] = useState<"reviews" | "discussion">("reviews");

  const { data: album, isLoading: albumLoading } = useQuery<AlbumStats>({
    queryKey: ["/api/albums", albumId],
    queryFn: async () => {
      const res = await fetch(`/api/albums/${albumId}`);
      if (!res.ok) throw new Error("Album not found");
      return res.json();
    },
    enabled: !!albumId,
  });

  const { data: reviews, isLoading: reviewsLoading } = useQuery<Thread[]>({
    queryKey: ["/api/threads", { albumId, type: "album_review" }],
    queryFn: async () => {
      const res = await fetch(`/api/threads?albumId=${albumId}&type=album_review`);
      return res.json();
    },
    enabled: !!albumId,
  });

  if (albumLoading) {
    return (
      <div className="min-h-screen pb-32">
        <Header />
        <div className="px-4 pt-4 space-y-4">
          <Skeleton className="h-6 w-32 bg-[#181818]" />
          <Skeleton className="h-28 w-full rounded-xl bg-[#181818]" />
          <Skeleton className="h-10 w-full rounded-xl bg-[#181818]" />
        </div>
        <BottomNav />
      </div>
    );
  }

  if (!album) {
    return (
      <div className="min-h-screen pb-32">
        <Header />
        <div className="px-4 pt-6 text-center">
          <Link href="/">
            <div className="flex items-center mb-6 cursor-pointer text-[#B3B3B3]">
              <ChevronLeft className="h-5 w-5 mr-1" />
              <span className="text-sm">Home</span>
            </div>
          </Link>
          <p className="text-[#666]">Album not found</p>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32">
      <Header />
      <div className="px-4 pt-4 max-w-lg mx-auto">
        <Link href="/">
          <div className="flex items-center mb-4 cursor-pointer text-[#B3B3B3] hover:text-white transition-colors">
            <ChevronLeft className="h-5 w-5 mr-1" />
            <span className="text-sm">Home</span>
          </div>
        </Link>

        <div className="bg-[#181818] rounded-xl p-4 mb-4">
          <div className="flex items-start gap-3">
            <div className="w-14 h-14 rounded-xl bg-[#1a0d2e] border border-[#b388eb]/30 flex items-center justify-center flex-shrink-0">
              <Disc3 className="h-6 w-6 text-[#b388eb]" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-white leading-tight mb-0.5">
                {album.albumName ?? "Unknown Album"}
              </h1>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-sm text-[#B3B3B3]">{album.artistName ?? "Unknown Artist"}</span>
                {album.artistName && (
                  <>
                    <FollowArtistButton artistName={album.artistName} />
                    <SaveArtistWishlistButton artistName={album.artistName} />
                  </>
                )}
              </div>
              {album.avgRating !== null && (
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <StarDisplay rating={album.avgRating} />
                  <span className="text-xs text-yellow-400">{album.avgRating.toFixed(1)}</span>
                  <span className="text-xs text-[#555]">({album.reviewCount} review{album.reviewCount !== 1 ? "s" : ""})</span>
                </div>
              )}
              {album.firstReviewerUsername && (
                <p className="text-[10px] text-[#555] mt-1.5 flex items-center gap-1">
                  <Crown className="h-2.5 w-2.5 text-[#c2f970]" />
                  First reviewed by <span className="text-[#c2f970]">@{album.firstReviewerUsername}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-1 mb-4 bg-[#181818] rounded-xl p-1">
          {(["reviews", "discussion"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex-1 py-2 text-sm font-medium rounded-lg capitalize transition-colors",
                activeTab === tab ? "bg-[#282828] text-white" : "text-[#666] hover:text-[#B3B3B3]"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === "reviews" && (
          <div>
            {reviewsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-28 w-full rounded-xl bg-[#181818]" />
                ))}
              </div>
            ) : reviews && reviews.length > 0 ? (
              <>
                <RatingDistribution reviews={reviews} />
                <div className="space-y-3">
                  {reviews.map(r => <ReviewCard key={r.id} thread={r} />)}
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-[#555]">
                <Disc3 className="h-10 w-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm">No reviews yet. Be the first to review this album.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "discussion" && (
          <div>
            {reviewsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-xl bg-[#181818]" />
                ))}
              </div>
            ) : reviews && reviews.length > 0 ? (
              <div className="space-y-3">
                {reviews.map(r => (
                  <Link key={r.id} href={`/thread/${r.id}`}>
                    <div className="bg-[#181818] rounded-xl p-4 cursor-pointer hover:bg-[#1e1e1e] transition-colors">
                      <p className="text-sm font-semibold text-white leading-snug">{r.title}</p>
                      <p className="text-xs text-[#555] mt-1">{r.commentsCount ?? 0} comments · {r.savesCount ?? 0} saves</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-[#555]">
                <MessageCircle className="h-10 w-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm">No discussion threads yet.</p>
              </div>
            )}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
