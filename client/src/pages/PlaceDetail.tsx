import { useRef, useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import MusicPlayer from "@/components/layout/MusicPlayer";
import { Place, PlaceComment, User } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ChevronLeft, MapPin, Star, ExternalLink, MessageCircle, Send } from "lucide-react";
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

export default function PlaceDetail() {
  const params = useParams<{ id: string }>();
  const placeId = parseInt(params.id);
  const { user } = useAuth();
  const { toast } = useToast();
  const [location, navigate] = useLocation();
  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  const [commentText, setCommentText] = useState("");

  const { data: place, isLoading: placeLoading } = useQuery<Place>({
    queryKey: [`/api/places/${placeId}`],
  });

  const { data: comments, isLoading: commentsLoading } = useQuery<PlaceComment[]>({
    queryKey: [`/api/places/${placeId}/comments`],
  });

  const commentMutation = useMutation({
    mutationFn: (content: string) =>
      apiRequest("POST", `/api/places/${placeId}/comments`, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/places/${placeId}/comments`] });
      queryClient.invalidateQueries({ queryKey: ["/api/places"] });
      setCommentText("");
    },
    onError: (err: any) => {
      toast({ title: "Failed to post", description: err.message, variant: "destructive" });
    },
  });

  const handleDropIn = () => {
    commentInputRef.current?.focus();
    commentInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const handleSubmitComment = () => {
    if (!commentText.trim()) return;
    commentMutation.mutate(commentText.trim());
  };

  const genres = place ? (place.genres ?? []) : [];

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
                    {place.rating !== null && place.rating > 0 && (
                      <span className="flex items-center gap-1 text-xs text-[#B3B3B3]">
                        <Star className="h-3 w-3 text-[#c2f970] fill-[#c2f970]" />
                        {place.rating}.0
                      </span>
                    )}
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

              <div className="flex items-center gap-3 mt-4">
                <button
                  onClick={handleDropIn}
                  className="flex-1 bg-[#c2f970] text-black font-semibold py-2.5 rounded-full text-sm hover:bg-[#aee05a] transition-colors"
                >
                  Drop In
                </button>
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

          <div className="px-4">
            <div className="flex items-center gap-2 mb-3">
              <MessageCircle className="h-4 w-4 text-[#B3B3B3]" />
              <h2 className="font-semibold text-sm">Discussion</h2>
              {comments && comments.length > 0 && (
                <span className="text-xs text-[#B3B3B3]">({comments.length})</span>
              )}
            </div>

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
                  placeholder="Share your experience..."
                  className="bg-[#282828] border-[#3E3E3E] text-white placeholder:text-[#555] resize-none min-h-[72px] text-sm"
                  maxLength={500}
                  onKeyDown={e => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmitComment();
                  }}
                />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[10px] text-[#555]">{commentText.length}/500</span>
                  <button
                    onClick={handleSubmitComment}
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
                {[1, 2].map(i => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : comments && comments.length > 0 ? (
              <div className="space-y-3 pb-4">
                {comments.map(comment => (
                  <div key={comment.id} className="flex gap-3">
                    <Avatar className="h-7 w-7 flex-shrink-0 mt-0.5">
                      <AvatarFallback className="bg-[#282828] text-[#B3B3B3] text-[10px]">
                        U{comment.userId}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 bg-[#181818] rounded-xl px-3 py-2.5">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-[#c2f970]">User</span>
                        <span className="text-[10px] text-[#555]">{timeAgo(comment.createdAt)}</span>
                      </div>
                      <p className="text-sm text-[#E0E0E0] leading-relaxed">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-[#B3B3B3] text-sm">
                No comments yet. Drop in and share your thoughts.
              </div>
            )}
          </div>
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
