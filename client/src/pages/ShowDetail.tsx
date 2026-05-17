import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import MusicPlayer from "@/components/layout/MusicPlayer";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  ChevronLeft, Ticket, MapPin, Calendar, Star, ThumbsUp,
  MessageCircle, Send, CheckCircle, Award
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Show, ShowReview, ShowComment } from "@shared/schema";

function formatDate(dateStr: string) {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split("-");
  const d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

function StarRating({
  value, onChange, readonly = false, size = "md",
}: {
  value: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
  size?: "sm" | "md";
}) {
  const [hovered, setHovered] = useState(0);
  const sz = size === "sm" ? "h-4 w-4" : "h-6 w-6";
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          disabled={readonly}
          className={cn("focus:outline-none", readonly && "cursor-default")}
          onClick={() => !readonly && onChange?.(n)}
          onMouseEnter={() => !readonly && setHovered(n)}
          onMouseLeave={() => !readonly && setHovered(0)}
        >
          <Star
            className={cn(sz, "transition-colors", (hovered || value) >= n
              ? "fill-[#f5c518] text-[#f5c518]"
              : "text-[#333]"
            )}
          />
        </button>
      ))}
    </div>
  );
}

function AverageRating({ reviews }: { reviews: ShowReview[] }) {
  if (!reviews.length) return null;
  const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  const dist = [5, 4, 3, 2, 1].map(n => ({
    n,
    count: reviews.filter(r => r.rating === n).length,
  }));
  return (
    <div className="bg-[#181818] rounded-xl p-4 mb-4 flex gap-4 items-center">
      <div className="text-center flex-shrink-0">
        <p className="text-4xl font-bold text-white">{avg.toFixed(1)}</p>
        <StarRating value={Math.round(avg)} readonly size="sm" />
        <p className="text-xs text-[#666] mt-1">{reviews.length} review{reviews.length !== 1 ? "s" : ""}</p>
      </div>
      <div className="flex-1 space-y-1">
        {dist.map(({ n, count }) => (
          <div key={n} className="flex items-center gap-2">
            <span className="text-xs text-[#666] w-3">{n}</span>
            <div className="flex-1 h-1.5 bg-[#282828] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#f5c518] rounded-full transition-all"
                style={{ width: reviews.length ? `${(count / reviews.length) * 100}%` : "0%" }}
              />
            </div>
            <span className="text-xs text-[#555] w-4 text-right">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ShowDetail() {
  const { id } = useParams<{ id: string }>();
  const showId = parseInt(id);
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"reviews" | "discussion">("reviews");
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [commentText, setCommentText] = useState("");
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  const { data: show, isLoading: showLoading } = useQuery<Show>({
    queryKey: ["/api/shows", showId],
    queryFn: async () => {
      const res = await fetch(`/api/shows/${showId}`);
      if (!res.ok) throw new Error("Show not found");
      return res.json();
    },
  });

  const { data: reviewData, isLoading: reviewsLoading } = useQuery<{
    reviews: ShowReview[];
    userReview: ShowReview | null;
  }>({
    queryKey: ["/api/shows", showId, "reviews"],
    queryFn: async () => {
      const res = await fetch(`/api/shows/${showId}/reviews`);
      return res.json();
    },
  });

  const { data: comments, isLoading: commentsLoading } = useQuery<ShowComment[]>({
    queryKey: ["/api/shows", showId, "comments"],
    queryFn: async () => {
      const res = await fetch(`/api/shows/${showId}/comments`);
      return res.json();
    },
    enabled: activeTab === "discussion",
  });

  const reviewMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/shows/${showId}/reviews`, {
        rating,
        content: reviewText,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to submit review");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shows", showId, "reviews"] });
      setRating(0);
      setReviewText("");
      toast({
        title: "Review posted",
        description: "You've earned the 'I Was There' badge!",
      });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const commentMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/shows/${showId}/comments`, {
        content: commentText,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shows", showId, "comments"] });
      setCommentText("");
    },
    onError: () => toast({ title: "Error", description: "Could not post comment", variant: "destructive" }),
  });

  const upvoteMutation = useMutation({
    mutationFn: async (commentId: number) => {
      const res = await apiRequest("POST", `/api/shows/${showId}/comments/${commentId}/upvote`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shows", showId, "comments"] });
    },
  });

  const reviews = reviewData?.reviews ?? [];
  const userReview = reviewData?.userReview;

  if (showLoading) {
    return (
      <div className="min-h-screen pb-32">
        <Header />
        <div className="px-4 pt-4 space-y-4">
          <Skeleton className="h-6 w-32 bg-[#181818]" />
          <Skeleton className="h-32 w-full rounded-xl bg-[#181818]" />
          <Skeleton className="h-10 w-full bg-[#181818]" />
        </div>
        <BottomNav />
      </div>
    );
  }

  if (!show) {
    return (
      <div className="min-h-screen pb-32">
        <Header />
        <div className="px-4 pt-6 text-center">
          <Link href="/shows">
            <div className="flex items-center mb-6 cursor-pointer">
              <ChevronLeft className="h-5 w-5 mr-1" />
              <span className="text-sm">Shows</span>
            </div>
          </Link>
          <p className="text-[#666]">Show not found</p>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32">
      <Header />
      <div className="px-4 pt-4">
        <Link href="/shows">
          <div className="flex items-center mb-4 cursor-pointer text-[#B3B3B3] hover:text-white transition-colors">
            <ChevronLeft className="h-5 w-5 mr-1" />
            <span className="text-sm">Shows</span>
          </div>
        </Link>

        <div className="bg-[#181818] rounded-xl p-4 mb-4">
          <div className="flex items-start gap-3">
            <div className="w-14 h-14 rounded-xl bg-[#0e1a3d] border border-[#5271ff]/30 flex items-center justify-center flex-shrink-0">
              <Ticket className="h-6 w-6 text-[#5271ff]" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-white leading-tight">{show.artistName}</h1>
              <p className="text-[#B3B3B3] text-sm mt-0.5">{show.venueName}</p>
              <div className="flex flex-wrap gap-3 mt-2">
                <span className="flex items-center gap-1 text-xs text-[#666]">
                  <MapPin className="h-3 w-3" />
                  {show.city}, {show.country}
                </span>
                <span className="flex items-center gap-1 text-xs text-[#666]">
                  <Calendar className="h-3 w-3" />
                  {formatDate(show.eventDate)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-1 mb-4 bg-[#181818] rounded-xl p-1">
          {(["reviews", "discussion"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex-1 py-2 rounded-lg text-sm font-medium transition-all capitalize flex items-center justify-center gap-1.5",
                activeTab === tab
                  ? "bg-[#282828] text-white"
                  : "text-[#666] hover:text-[#B3B3B3]"
              )}
            >
              {tab === "reviews" ? <Star className="h-3.5 w-3.5" /> : <MessageCircle className="h-3.5 w-3.5" />}
              {tab}
            </button>
          ))}
        </div>

        {activeTab === "reviews" && (
          <div>
            {reviewsLoading ? (
              <div className="space-y-3">
                {[1, 2].map(i => <Skeleton key={i} className="h-24 bg-[#181818] rounded-xl" />)}
              </div>
            ) : (
              <>
                {reviews.length > 0 && <AverageRating reviews={reviews} />}

                {!userReview ? (
                  <div className="bg-[#181818] rounded-xl p-4 mb-4">
                    <p className="text-sm font-semibold text-white mb-3">Were you there?</p>
                    <div className="mb-3">
                      <StarRating value={rating} onChange={setRating} />
                    </div>
                    <Textarea
                      value={reviewText}
                      onChange={e => setReviewText(e.target.value)}
                      placeholder="Share your experience of the show..."
                      className="bg-[#282828] border-[#3E3E3E] text-white placeholder:text-[#555] resize-none min-h-[80px] text-sm mb-3"
                      maxLength={1000}
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#555]">{reviewText.length}/1000</span>
                      <button
                        onClick={() => reviewMutation.mutate()}
                        disabled={!rating || reviewText.trim().length < 10 || reviewMutation.isPending}
                        className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#5271ff] text-white text-xs font-semibold disabled:opacity-40 hover:bg-[#4060ee] transition-colors"
                      >
                        <Send className="h-3 w-3" />
                        {reviewMutation.isPending ? "Posting..." : "Post Review"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#181818] rounded-xl p-3 mb-4 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-[#c2f970] flex-shrink-0" />
                    <p className="text-xs text-[#B3B3B3]">You've reviewed this show</p>
                  </div>
                )}

                {reviews.length === 0 ? (
                  <div className="bg-[#181818] rounded-xl p-8 text-center">
                    <Star className="h-8 w-8 text-[#333] mx-auto mb-2" />
                    <p className="text-sm text-[#666]">No reviews yet. Be the first!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reviews.map(review => (
                      <div key={review.id} className="bg-[#181818] rounded-xl p-4">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-8 w-8 flex-shrink-0">
                            <AvatarFallback className="bg-[#282828] text-[#B3B3B3] text-xs">
                              U{review.userId}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <StarRating value={review.rating} readonly size="sm" />
                              <span className="text-xs text-[#555]">
                                {new Date(review.createdAt!).toLocaleDateString("en-GB", {
                                  day: "numeric", month: "short", year: "numeric"
                                })}
                              </span>
                            </div>
                            <p className="text-sm text-[#B3B3B3] leading-relaxed">{review.content}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === "discussion" && (
          <div>
            <div className="flex gap-3 mb-4">
              <Avatar className="h-8 w-8 flex-shrink-0 mt-0.5">
                <AvatarFallback className="bg-[#282828] text-[#B3B3B3] text-xs">
                  {user?.username?.slice(0, 2).toUpperCase() ?? "?"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Textarea
                  ref={commentInputRef}
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  placeholder="Share a thought about this show..."
                  className="bg-[#282828] border-[#3E3E3E] text-white placeholder:text-[#555] resize-none min-h-[72px] text-sm"
                  maxLength={280}
                  onKeyDown={e => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) commentMutation.mutate();
                  }}
                />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[10px] text-[#555]">{commentText.length}/280</span>
                  <button
                    onClick={() => commentMutation.mutate()}
                    disabled={!commentText.trim() || commentMutation.isPending}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#c2f970] text-black text-xs font-semibold disabled:opacity-40 hover:bg-[#aee05a] transition-colors"
                  >
                    <Send className="h-3 w-3" />
                    {commentMutation.isPending ? "Posting..." : "Post"}
                  </button>
                </div>
              </div>
            </div>

            {commentsLoading ? (
              <div className="space-y-3">
                {[1, 2].map(i => <Skeleton key={i} className="h-20 bg-[#181818] rounded-xl" />)}
              </div>
            ) : !comments || comments.length === 0 ? (
              <div className="bg-[#181818] rounded-xl p-8 text-center">
                <MessageCircle className="h-8 w-8 text-[#333] mx-auto mb-2" />
                <p className="text-sm text-[#666]">No comments yet. Start the discussion!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {comments.map(comment => (
                  <div key={comment.id} className="bg-[#181818] rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarFallback className="bg-[#282828] text-[#B3B3B3] text-xs">
                          U{comment.userId}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm text-[#B3B3B3] leading-relaxed mb-2">{comment.content}</p>
                        <button
                          onClick={() => upvoteMutation.mutate(comment.id)}
                          className="flex items-center gap-1 text-xs text-[#555] hover:text-[#B3B3B3] transition-colors"
                        >
                          <ThumbsUp className="h-3 w-3" />
                          {comment.upvotes || 0}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <MusicPlayer />
      <BottomNav />
    </div>
  );
}
