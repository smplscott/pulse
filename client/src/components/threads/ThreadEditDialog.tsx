import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Star } from "lucide-react";
import type { Thread } from "@shared/schema";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import ReviewImageUpload from "@/components/ReviewImageUpload";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

interface Props {
  thread: Thread | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}

export default function ThreadEditDialog({ thread, open, onOpenChange, onDeleted }: Props) {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [starRating, setStarRating] = useState(0);
  const [reviewImage, setReviewImage] = useState<string | null>(null);

  const isLiveShow = thread?.threadType === "live_show_review";
  const isRated = isLiveShow || thread?.threadType === "album_review";

  useEffect(() => {
    if (!thread || !open) return;
    setTitle(thread.title);
    setContent(thread.content);
    setStarRating(thread.starRating ?? 0);
    setReviewImage(thread.reviewImageUrl ?? null);
  }, [thread, open]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!thread) return;
      const res = await apiRequest("PATCH", `/api/threads/${thread.id}`, {
        title: title.trim(),
        content: content.trim(),
        starRating: isRated ? (starRating || null) : undefined,
        reviewImageUrl: isLiveShow ? reviewImage : undefined,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/threads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/threads/featured"] });
      if (thread) {
        queryClient.invalidateQueries({ queryKey: [`/api/threads/${thread.id}`] });
        queryClient.invalidateQueries({ queryKey: [`/api/users/${thread.userId}/threads`] });
        if (thread.albumId) {
          queryClient.invalidateQueries({ queryKey: ["/api/albums", thread.albumId] });
        }
      }
      toast({ title: "Thread updated" });
      onOpenChange(false);
    },
    onError: (err: Error) => {
      toast({ title: "Couldn't update thread", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!thread) return;
      await apiRequest("DELETE", `/api/threads/${thread.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/threads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/threads/featured"] });
      if (thread) {
        queryClient.invalidateQueries({ queryKey: [`/api/threads/${thread.id}`] });
        queryClient.invalidateQueries({ queryKey: [`/api/users/${thread.userId}/threads`] });
        if (thread.albumId) {
          queryClient.invalidateQueries({ queryKey: ["/api/albums", thread.albumId] });
        }
      }
      toast({ title: "Thread deleted" });
      onOpenChange(false);
      onDeleted?.();
    },
    onError: (err: Error) => {
      toast({ title: "Couldn't delete thread", description: err.message, variant: "destructive" });
    },
  });

  const canSave =
    title.trim().length >= 3 &&
    content.trim().length >= 1 &&
    (!isRated || starRating > 0) &&
    (!isLiveShow || !!reviewImage) &&
    !updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1a1a1a] border-[#3E3E3E] text-white max-w-md w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white font-bold text-lg">Edit thread</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {isRated && (
            <div>
              <p className="text-sm text-[#B3B3B3] mb-2">
                Your rating <span className="text-red-400">*</span>
              </p>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n} type="button" onClick={() => setStarRating(n)}>
                    <Star className={cn(
                      "h-7 w-7 transition-colors",
                      starRating >= n ? "text-[#c3f872] fill-[#c3f872]" : "text-[#3E3E3E]",
                    )} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {isLiveShow && (
            <ReviewImageUpload value={reviewImage} onChange={setReviewImage} />
          )}

          <div>
            <p className="text-sm text-[#B3B3B3] mb-1.5">Title</p>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="bg-[#282828] border-[#3E3E3E] text-white"
            />
          </div>
          <div>
            <p className="text-sm text-[#B3B3B3] mb-1.5">Details</p>
            <Textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              className="bg-[#282828] border-[#3E3E3E] text-white min-h-[100px] resize-none"
            />
          </div>

          <button
            type="button"
            disabled={!canSave}
            onClick={() => updateMutation.mutate()}
            className="w-full py-2.5 rounded-full bg-gradient-to-r from-[#c2f970] to-[#ecffa1] text-black font-semibold text-sm disabled:opacity-40 hover:opacity-90 transition-opacity"
          >
            {updateMutation.isPending ? "Saving…" : "Save changes"}
          </button>
          <button
            type="button"
            disabled={deleteMutation.isPending}
            onClick={() => {
              if (window.confirm("Delete this thread? This can't be undone.")) {
                deleteMutation.mutate();
              }
            }}
            className="w-full py-2 text-sm font-medium text-red-400 hover:text-red-300 disabled:opacity-40"
          >
            {deleteMutation.isPending ? "Deleting…" : "Delete thread"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
