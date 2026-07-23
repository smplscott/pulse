import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import MusicPlayer from "@/components/layout/MusicPlayer";
import { Place, PlaceReview } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronLeft, MapPin, Star, ExternalLink, PenLine, Trash2 } from "lucide-react";
import SaveToListButton from "@/components/SaveToListButton";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/context/AuthContext";

const CATEGORY_LABELS: Record<string, string> = {
  bar: "Bar",
  club: "Club",
  record_store: "Record Store",
  coffee_shop: "Coffee Shop",
  other: "Other",
};

function timeAgo(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function StarDisplay({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const sz = size === "md" ? "h-4 w-4" : "h-3 w-3";
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <Star
          key={n}
          className={cn(sz, n <= rating ? "text-yellow-400 fill-yellow-400" : "text-[#3E3E3E] fill-[#3E3E3E]")}
        />
      ))}
    </div>
  );
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1.5">
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

type ReviewWithUser = PlaceReview & { username: string };

export default function PlaceDetail() {
  const params = useParams<{ id: string }>();
  const placeId = parseInt(params.id);
  const { user } = useAuth();
  const { toast } = useToast();

  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewBody, setReviewBody] = useState("");

  const { data: place, isLoading: placeLoading } = useQuery<Place>({
    queryKey: [`/api/places/${placeId}`],
  });

  const { data: reviews, isLoading: reviewsLoading } = useQuery<ReviewWithUser[]>({
    queryKey: [`/api/places/${placeId}/reviews`],
  });

  const reviewMutation = useMutation({
    mutationFn: (data: { rating: number; body?: string }) =>
      apiRequest("POST", `/api/places/${placeId}/reviews`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/places/${placeId}/reviews`] });
      queryClient.invalidateQueries({ queryKey: [`/api/places/${placeId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/places"] });
      if (user?.username) {
        queryClient.invalidateQueries({ queryKey: [`/api/users/username/${user.username}`] });
      }
      setReviewOpen(false);
      setReviewRating(0);
      setReviewBody("");
      toast({ title: "Review posted!" });
    },
    onError: (err: any) => {
      toast({ title: "Failed to post review", description: err.message, variant: "destructive" });
    },
  });

  const deleteReviewMutation = useMutation({
    mutationFn: async (reviewId: number) =>
      apiRequest("DELETE", `/api/places/${placeId}/reviews/${reviewId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/places/${placeId}/reviews`] });
      queryClient.invalidateQueries({ queryKey: [`/api/places/${placeId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/places"] });
      if (user?.username) {
        queryClient.invalidateQueries({ queryKey: [`/api/users/username/${user.username}`] });
      }
      toast({ title: "Review deleted" });
    },
    onError: (err: any) => {
      toast({ title: "Failed to delete review", description: err.message, variant: "destructive" });
    },
  });

  const handleSubmitReview = () => {
    if (reviewRating === 0) return;
    reviewMutation.mutate({ rating: reviewRating, body: reviewBody.trim() || undefined });
  };

  const genres = place ? (place.genres ?? []) : [];
  const avgRating = place?.rating ?? 0;
  const reviewCount = reviews?.length ?? 0;

  return (
    <div className="min-h-screen pb-32">
      <Header />

      {placeLoading ? (
        <div className="px-4 pt-4 space-y-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : place ? (
        <>
          <div className="px-4 pt-4">
            <Link href="/places">
              <div className="flex items-center mb-4 cursor-pointer text-[#B3B3B3] hover:text-white transition-colors">
                <ChevronLeft className="h-5 w-5 mr-1" />
                <span className="text-sm">Places</span>
              </div>
            </Link>

            <div className="bg-[#181818] rounded-xl p-5 mb-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#282828] text-[#B3B3B3]">
                      {CATEGORY_LABELS[place.category] ?? place.category}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-[#B3B3B3]">
                      <Star className="h-3 w-3 text-[#c2f970] fill-[#c2f970]" />
                      {avgRating > 0 ? avgRating.toFixed(1) : "–"}
                      {reviewCount > 0 && <span className="text-[10px]">({reviewCount})</span>}
                    </span>
                  </div>
                  <h1 className="text-2xl font-bold">{place.name}</h1>
                  <div className="flex items-center gap-1 text-[#B3B3B3] mt-1">
                    <MapPin className="h-3.5 w-3.5" />
                    <span className="text-sm">{place.city}, {place.country}</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-[#1a2a1a] border border-[#c2f970]/20 flex items-center justify-center flex-shrink-0">
                  <MapPin className="h-6 w-6 text-[#c2f970]" />
                </div>
              </div>

              {genres.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {genres.map(g => (
                    <span key={g} className="text-xs px-2 py-0.5 rounded-full bg-[#1a2a1a] text-[#c2f970]">
                      {g}
                    </span>
                  ))}
                </div>
              )}

              <p className="text-sm text-[#B3B3B3] leading-relaxed">{place.description}</p>

              <div className="flex items-center gap-2 mt-4">
                <button
                  onClick={() => setReviewOpen(true)}
                  className="flex-1 bg-gradient-to-r from-[#c2f970] to-[#ecffa1] text-black font-semibold py-2.5 rounded-full text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  <PenLine className="h-4 w-4" />
                  Review
                </button>
                <SaveToListButton placeId={placeId} placeName={place.name} />
                {place.mapsLink && (
                  <a
                    href={place.mapsLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-[#282828] flex items-center justify-center hover:bg-[#333] transition-colors"
                  >
                    <ExternalLink className="h-4 w-4 text-white" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Reviews section */}
          <div className="px-4">
            <div className="flex items-center gap-2 mb-4">
              <Star className="h-4 w-4 text-[#B3B3B3]" />
              <h2 className="font-semibold text-sm">Reviews</h2>
              {reviewCount > 0 && (
                <span className="text-xs text-[#B3B3B3]">({reviewCount})</span>
              )}
            </div>

            {reviewsLoading ? (
              <div className="space-y-3">
                {[1, 2].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
              </div>
            ) : reviews && reviews.length > 0 ? (
              <div className="space-y-3 pb-4">
                {reviews.map(review => (
                  <div key={review.id} className="bg-[#181818] rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <Avatar className="h-7 w-7 flex-shrink-0">
                        <AvatarFallback className="bg-[#282828] text-[#B3B3B3] text-[10px]">
                          {review.username.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-medium text-[#c2f970] truncate">{review.username}</span>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-[10px] text-[#555]">{timeAgo(review.createdAt)}</span>
                            {user && review.username === user.username && (
                              <button
                                onClick={() => deleteReviewMutation.mutate(review.id)}
                                disabled={deleteReviewMutation.isPending}
                                className="text-[#555] hover:text-red-400 transition-colors disabled:opacity-40"
                                title="Delete review"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                        <StarDisplay rating={review.rating} />
                      </div>
                    </div>
                    {review.body && (
                      <p className="text-sm text-[#E0E0E0] leading-relaxed">{review.body}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-[#B3B3B3] text-sm">
                <Star className="h-8 w-8 text-[#333] mx-auto mb-3" />
                <p>No reviews yet.</p>
                <p className="text-xs text-[#555] mt-1">Be the first to review this place.</p>
              </div>
            )}
          </div>

          {/* Review dialog */}
          <Dialog open={reviewOpen} onOpenChange={open => { setReviewOpen(open); if (!open) { setReviewRating(0); setReviewBody(""); } }}>
            <DialogContent className="bg-[#1a1a1a] border-[#282828] text-white max-w-sm mx-auto">
              <DialogHeader>
                <DialogTitle className="text-base">Review {place.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-1">
                <div>
                  <p className="text-xs text-[#B3B3B3] mb-2">Your rating *</p>
                  <StarPicker value={reviewRating} onChange={setReviewRating} />
                </div>
                <div>
                  <p className="text-xs text-[#B3B3B3] mb-2">
                    Your thoughts <span className="text-[#555]">(optional)</span>
                  </p>
                  <Textarea
                    value={reviewBody}
                    onChange={e => setReviewBody(e.target.value)}
                    placeholder="What was it like?"
                    className="bg-[#282828] border-[#3E3E3E] text-white placeholder:text-[#555] resize-none text-sm"
                    rows={3}
                    maxLength={280}
                  />
                  <p className="text-[10px] text-[#555] mt-1 text-right">{reviewBody.length}/280</p>
                </div>
                <button
                  onClick={handleSubmitReview}
                  disabled={reviewRating === 0 || reviewMutation.isPending}
                  className="w-full py-2.5 rounded-full bg-gradient-to-r from-[#c2f970] to-[#ecffa1] text-black font-semibold text-sm disabled:opacity-40 hover:opacity-90 transition-opacity"
                >
                  {reviewMutation.isPending ? "Posting…" : "Post Review"}
                </button>
              </div>
            </DialogContent>
          </Dialog>
        </>
      ) : (
        <div className="px-4 pt-4">
          <Link href="/places">
            <div className="flex items-center mb-4 cursor-pointer text-[#B3B3B3]">
              <ChevronLeft className="h-5 w-5 mr-1" />
              <span className="text-sm">Places</span>
            </div>
          </Link>
          <p className="text-center text-[#B3B3B3] py-16">Place not found</p>
        </div>
      )}

      <MusicPlayer />
      <BottomNav />
    </div>
  );
}
