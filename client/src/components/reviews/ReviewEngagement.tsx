import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, MessageCircle, Repeat2 } from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

export type ReviewSubjectType = "place_review" | "show_review" | "album_thread";

export type ReviewAuthor = {
  id: number;
  username: string;
  displayName: string | null;
  profilePicture: string | null;
};

export type ReviewEngagementPayload = {
  review: Record<string, unknown> | null;
  author: ReviewAuthor | null;
  replies: Array<{
    id: number;
    body: string;
    createdAt: string;
    author: ReviewAuthor;
  }>;
  likes: number;
  repeats: number;
  liked: boolean;
  repeated: boolean;
};

export function reviewThreadHref(subjectType: ReviewSubjectType, subjectId: number, threadId?: number | null) {
  if (subjectType === "album_thread") return `/thread/${threadId ?? subjectId}`;
  return `/reviews/${subjectType === "place_review" ? "place" : "show"}/${subjectId}`;
}

export default function ReviewEngagement({
  subjectType,
  subjectId,
  threadId,
}: {
  subjectType: ReviewSubjectType;
  subjectId: number;
  threadId?: number | null;
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [replyOpen, setReplyOpen] = useState(false);
  const [body, setBody] = useState("");
  const queryKey = ["/api/reviews", subjectType, subjectId];

  const { data } = useQuery<ReviewEngagementPayload>({
    queryKey,
    queryFn: async () => {
      const res = await fetch(`/api/reviews/${subjectType}/${subjectId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load engagement");
      return res.json();
    },
  });

  const likes = data?.likes ?? 0;
  const repeats = data?.repeats ?? 0;
  const replyCount = data?.replies.length ?? 0;
  const href = reviewThreadHref(subjectType, subjectId, threadId);

  const react = useMutation({
    mutationFn: async (kind: "like" | "repeat") => {
      const res = await apiRequest("POST", `/api/reviews/${subjectType}/${subjectId}/reactions`, { kind });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ["/api/threads/featured"] });
    },
    onError: (err: Error) => toast({ title: err.message, variant: "destructive" }),
  });

  const reply = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/reviews/${subjectType}/${subjectId}/replies`, { body: body.trim() });
      return res.json();
    },
    onSuccess: () => {
      setBody("");
      setReplyOpen(false);
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (err: Error) => toast({ title: err.message, variant: "destructive" }),
  });

  return (
    <div className="mt-3 space-y-2" onClick={event => event.stopPropagation()}>
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <button
          type="button"
          disabled={!user || react.isPending}
          onClick={() => react.mutate("like")}
          className={`flex items-center gap-1 ${data?.liked ? "text-[#1DB954]" : "hover:text-white"}`}
          aria-label="Like"
        >
          <Heart className={`w-4 h-4 ${data?.liked ? "fill-current" : ""}`} />
          {likes}
        </button>
        <button
          type="button"
          disabled={!user}
          onClick={() => setReplyOpen(open => !open)}
          className="flex items-center gap-1 hover:text-white"
          aria-label="Reply"
        >
          <MessageCircle className="w-4 h-4" />
          {replyCount}
        </button>
        <button
          type="button"
          disabled={!user || react.isPending}
          onClick={() => react.mutate("repeat")}
          className={`flex items-center gap-1 ${data?.repeated ? "text-[#1DB954]" : "hover:text-white"}`}
          title="Repeat — ranks this review on the page"
          aria-label="Repeat"
        >
          <Repeat2 className="w-4 h-4" />
          {repeats}
        </button>
        {replyCount > 0 && (
          <Link href={href} className="ml-auto text-[#1DB954] hover:underline">
            Open thread
          </Link>
        )}
      </div>
      {replyOpen && user && (
        <form
          className="flex gap-2"
          onSubmit={event => {
            event.preventDefault();
            if (body.trim()) reply.mutate();
          }}
        >
          <input
            value={body}
            onChange={event => setBody(event.target.value)}
            placeholder="Write a reply…"
            maxLength={280}
            className="flex-1 rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-sm text-white"
          />
          <button
            type="submit"
            disabled={!body.trim() || reply.isPending}
            className="rounded-lg bg-[#1DB954] px-3 py-2 text-sm font-medium text-black disabled:opacity-50"
          >
            Reply
          </button>
        </form>
      )}
    </div>
  );
}
