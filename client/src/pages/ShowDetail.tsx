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
  ChevronLeft, Ticket, MapPin, Calendar, Star, Crown,
  ThumbsUp, MessageCircle, Send, CheckCircle, LogIn, Trash2, Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Show, ShowReview, ShowComment } from "@shared/schema";
import FollowArtistButton from "@/components/FollowArtistButton";
import SaveArtistWishlistButton from "@/components/SaveArtistWishlistButton";
import ReviewImageUpload from "@/components/ReviewImageUpload";

interface ShowWithStats extends Show {
  avgRating: number | null;
  reviewCount: number;
  commentCount: number;
  firstReviewerUsername: string | null;
}

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
              ? "fill-[#c3f872] text-[#c3f872]"
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
        <p className="text-xs text-[#555] mt-1">{reviews.length} review{reviews.length !== 1 ? "s" : ""}</p>
      </div>
      <div className="flex-1 space-y-1">
        {dist.map(({ n, count }) => (
          <div key={n} className="flex items-center gap-2">
            <span className="text-xs text-[#555] w-3">{n}</span>
            <div className="flex-1 h-1.5 bg-[#282828] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#c3f872] rounded-full transition-all"
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
  const [reviewImage, setReviewImage] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  const [editing, setEditing] = useState(false);
  const [editRating, setEditRating] = useState(0);
  const [editText, setEditText] = useState("");
  const [editImage, setEditImage] = useState<string | null>(null);

  const { data: show, isLoading: showLoading } = useQuery<ShowWithStats>({
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
        imageUrl: reviewImage,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to submit review");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shows", showId, "reviews"] });
      queryClient.invalidateQueries({ queryKey: ["/api/shows", showId] });
      queryClient.invalidateQueries({ queryKey: ["/api/shows"] });
      if (user?.username) {
        queryClient.invalidateQueries({ queryKey: [`/api/users/username/${user.username}`] });
      }
      setRating(0);
      setReviewText("");
      setReviewImage(null);
      toast({
        title: "Review posted",
        description: "You earned the \"I Was There\" badge!",
      });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteReviewMutation = useMutation({
    mutationFn: async (reviewId: number) => {
      const res = await apiRequest("DELETE", `/api/shows/${showId}/reviews/${reviewId}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to delete review");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shows", showId, "reviews"] });
      queryClient.invalidateQueries({ queryKey: ["/api/shows", showId] });
      queryClient.invalidateQueries({ queryKey: ["/api/shows"] });
      if (user?.username) {
        queryClient.invalidateQueries({ queryKey: [`/api/users/username/${user.username}`] });
      }
      toast({ title: "Review deleted" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const editReviewMutation = useMutation({
    mutationFn: async ({ reviewId, rating, content, imageUrl }: { reviewId: number; rating: number; content: string; imageUrl: string | null }) => {
      const res = await apiRequest("PATCH", `/api/shows/${showId}/reviews/${reviewId}`, {
        rating,
        content,
        imageUrl,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to update review");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shows", showId, "reviews"] });
      queryClient.invalidateQueries({ queryKey: ["/api/shows", showId] });
      queryClient.invalidateQueries({ queryKey: ["/api/shows"] });
      if (user?.username) {
        queryClient.invalidateQueries({ queryKey: [`/api/users/username/${user.username}`] });
      }
      setEditing(false);
      toast({ title: "Review updated" });
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
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shows", showId, "comments"] });
      setCommentText("");
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
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
          <Skeleton className="h-28 w-full rounded-xl bg-[#181818]" />
          <Skeleton className="h-10 w-full rounded-xl bg-[#181818]" />
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
            <div className="flex items-center mb-6 cursor-pointer text-[#B3B3B3]">
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
      <div className="px-4 pt-4 max-w-lg mx-auto">
        <Link href="/shows">
          <div className="flex items-center mb-4 cursor-pointer text-[#B3B3B3] hover:text-white transition-colors">
            <ChevronLeft className="h-5 w-5 mr-1" />
            <span className="text-sm">Shows</span>
          </div>
        </Link>

        <div className="bg-[#181818] rounded-xl p-4 mb-4">
          <div className="flex items-start gap-3">
            <div className="w-14 h-14 rounded-xl bg-[#1a0d2e] border border-[#b388eb]/30 flex items-center justify-center flex-shrink-0">
              <Ticket className="h-6 w-6 text-[#b388eb]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-white leading-tight">{show.artistName}</h1>
                <div className="flex items-center gap-1.5 self-center flex-shrink-0">
                  <FollowArtistButton artistName={show.artistName} />
                  <SaveArtistWishlistButton artistName={show.artistName} />
                </div>
                {show.isManual && (
                  <span className="text-[10px] bg-[#1a3a1a] text-[#c2f970] px-2 py-0.5 rounded-full self-center flex-shrink-0">
                    Community added
                  </span>
                )}
              </div>
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
              {show.avgRating !== null && (
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <StarRating value={Math.round(show.avgRating)} readonly size="sm" />
                  <span className="text-xs text-[#c3f872]">{show.avgRating.toFixed(1)}</span>
                  <span className="text-xs text-[#555]">({show.reviewCount} review{show.reviewCount !== 1 ? "s" : ""})</span>
                </div>
              )}
              {show.firstReviewerUsername && (
                <p className="text-[10px] text-[#555] mt-1 flex items-center gap-1">
                  <Crown className="h-2.5 w-2.5 text-[#c2f970] flex-shrink-0" />
                  First reviewed by <span className="text-[#c2f970]">@{show.firstReviewerUsername}</span>
                </p>
              )}
            </div>
          </div>
          {show.notes && (
            <p className="text-xs text-[#666] mt-3 pt-3 border-t border-[#282828]">{show.notes}</p>
          )}
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
                  : "text-[#555] hover:text-[#B3B3B3]"
              )}
            >
              {tab === "reviews" ? <Star className="h-3.5 w-3.5 text-[#c3f872]" /> : <MessageCircle className="h-3.5 w-3.5" />}
              {tab}
              {tab === "reviews" && reviews.length > 0 && (
                <span className="text-xs text-[#555] ml-0.5">({reviews.length})</span>
              )}
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

                {!user ? (
                  <div className="bg-[#181818] rounded-xl p-4 mb-4 flex items-center gap-3">
                    <LogIn className="h-4 w-4 text-[#b388eb] flex-shrink-0" />
                    <p className="text-sm text-[#B3B3B3]">
                      <Link href="/login" className="text-[#b388eb] hover:underline font-medium">Log in</Link>{" "}
                      to leave a review
                    </p>
                  </div>
                ) : !userReview ? (
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
                    <ReviewImageUpload value={reviewImage} onChange={setReviewImage} />
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#555]">{reviewText.length}/1000</span>
                      <button
                        onClick={() => reviewMutation.mutate()}
                        disabled={!rating || reviewText.trim().length < 10 || !reviewImage || reviewMutation.isPending}
                        className="flex items-center gap-1.5 px-4 py-1.5 rounded-full green-gradient text-black text-xs font-semibold disabled:opacity-40 hover:opacity-90 transition-opacity"
                      >
                        <Send className="h-3 w-3" />
                        {reviewMutation.isPending ? "Posting..." : "Post Review"}
                      </button>
                    </div>
                    {!reviewImage && (
                      <p className="text-xs text-[#555] mt-2 text-right">
                        Add a photo to enable posting
                      </p>
                    )}
                  </div>
                ) : editing ? (
                  <div className="bg-[#181818] rounded-xl p-4 mb-4">
                    <p className="text-sm font-semibold text-white mb-3">Edit your review</p>
                    <div className="mb-3">
                      <StarRating value={editRating} onChange={setEditRating} />
                    </div>
                    <Textarea
                      value={editText}
                      onChange={e => setEditText(e.target.value)}
                      placeholder="Share your experience of the show..."
                      className="bg-[#282828] border-[#3E3E3E] text-white placeholder:text-[#555] resize-none min-h-[80px] text-sm mb-3"
                      maxLength={1000}
                    />
                    <ReviewImageUpload value={editImage} onChange={setEditImage} />
                    <div className="flex items-center justify-between mt-2">
                      <button
                        onClick={() => setEditing(false)}
                        className="text-xs text-[#555] hover:text-[#B3B3B3] transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => editReviewMutation.mutate({
                          reviewId: userReview!.id,
                          rating: editRating,
                          content: editText,
                          imageUrl: editImage,
                        })}
                        disabled={!editRating || editText.trim().length < 10 || !editImage || editReviewMutation.isPending}
                        className="flex items-center gap-1.5 px-4 py-1.5 rounded-full green-gradient text-black text-xs font-semibold disabled:opacity-40 hover:opacity-90 transition-opacity"
                      >
                        <Send className="h-3 w-3" />
                        {editReviewMutation.isPending ? "Saving..." : "Save Changes"}
                      </button>
                    </div>
                    {!editImage && (
                      <p className="text-xs text-[#555] mt-2 text-right">
                        Add a photo to enable saving
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="bg-[#181818] rounded-xl p-4 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-[#c2f970] flex-shrink-0" />
                        <span className="text-xs text-[#B3B3B3]">Your review</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditRating(userReview.rating);
                            setEditText(userReview.content ?? "");
                            setEditImage(userReview.imageUrl ?? null);
                            setEditing(true);
                          }}
                          className="text-[#555] hover:text-[#B3B3B3] transition-colors"
                          title="Edit review"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteReviewMutation.mutate(userReview.id)}
                          disabled={deleteReviewMutation.isPending}
                          className="text-[#555] hover:text-red-400 transition-colors disabled:opacity-40"
                          title="Delete review"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <StarRating value={userReview.rating} readonly size="sm" />
                    {userReview.content && (
                      <p className="text-sm text-[#B3B3B3] mt-2 leading-relaxed">{userReview.content}</p>
                    )}
                    {userReview.imageUrl && (
                      <img
                        src={userReview.imageUrl}
                        alt="Your review artwork"
                        className="w-16 h-16 rounded-lg object-cover mt-2 border border-[#282828]"
                      />
                    )}
                  </div>
                )}

                {reviews.length === 0 ? (
                  <div className="bg-[#181818] rounded-xl p-8 text-center">
                    <Star className="h-8 w-8 text-[#c3f872] mx-auto mb-2" />
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
                            <div className="flex items-start gap-3">
                              {review.imageUrl && (
                                <img
                                  src={review.imageUrl}
                                  alt="Review artwork"
                                  className="w-16 h-16 rounded-lg object-cover flex-shrink-0 border border-[#282828]"
                                />
                              )}
                              <p className="text-sm text-[#B3B3B3] leading-relaxed">{review.content}</p>
                            </div>
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
            {!user ? (
              <div className="bg-[#181818] rounded-xl p-4 mb-4 flex items-center gap-3">
                <LogIn className="h-4 w-4 text-[#b388eb] flex-shrink-0" />
                <p className="text-sm text-[#B3B3B3]">
                  <Link href="/login" className="text-[#b388eb] hover:underline font-medium">Log in</Link>{" "}
                  to join the discussion
                </p>
              </div>
            ) : (
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
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-[#c2f970] to-[#ecffa1] text-black text-xs font-semibold disabled:opacity-40 hover:opacity-90 transition-opacity"
                    >
                      <Send className="h-3 w-3" />
                      {commentMutation.isPending ? "Posting..." : "Post"}
                    </button>
                  </div>
                </div>
              </div>
            )}

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
                          onClick={() => user && upvoteMutation.mutate(comment.id)}
                          disabled={!user}
                          className={cn(
                            "flex items-center gap-1 text-xs transition-colors",
                            user ? "text-[#555] hover:text-[#B3B3B3] cursor-pointer" : "text-[#444] cursor-default"
                          )}
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
