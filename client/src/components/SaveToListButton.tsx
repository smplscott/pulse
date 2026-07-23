import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Bookmark, Plus, Check, Trash2, List } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import ReviewImageUpload from "@/components/ReviewImageUpload";
import type { PlaceList } from "@shared/schema";

interface Props {
  placeId: number;
  placeName?: string;
  className?: string;
}

export default function SaveToListButton({ placeId, placeName, className }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const { data: lists, isLoading: listsLoading } = useQuery<PlaceList[]>({
    queryKey: [`/api/users/${user?.id}/place-lists`],
    enabled: !!user?.id && open,
  });

  const { data: saveStatus } = useQuery<{ saved: boolean; lists: PlaceList[] }>({
    queryKey: [`/api/users/${user?.id}/place-save-status/${placeId}`],
    enabled: !!user?.id,
  });

  const saved = saveStatus?.saved ?? false;
  const savedListIds = new Set((saveStatus?.lists ?? []).map(l => l.id));

  const addMutation = useMutation({
    mutationFn: (listId: number) =>
      apiRequest("POST", `/api/place-lists/${listId}/items`, { placeId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/place-save-status/${placeId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/place-lists`] });
      toast({ title: `Saved to list` });
    },
    onError: () => toast({ title: "Failed to save", variant: "destructive" }),
  });

  const removeMutation = useMutation({
    mutationFn: (listId: number) =>
      apiRequest("DELETE", `/api/place-lists/${listId}/items/${placeId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/place-save-status/${placeId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/place-lists`] });
      toast({ title: "Removed from list" });
    },
    onError: () => toast({ title: "Failed to remove", variant: "destructive" }),
  });

  const createListMutation = useMutation({
    mutationFn: ({ name, coverImageUrl }: { name: string; coverImageUrl?: string | null }) =>
      apiRequest("POST", `/api/users/${user?.id}/place-lists`, { name, coverImageUrl }),
    onSuccess: async (res) => {
      const newList = await res.json();
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/place-lists`] });
      setNewListName("");
      setCoverImage(null);
      setCreating(false);
      addMutation.mutate(newList.id);
    },
    onError: () => toast({ title: "Failed to create list", variant: "destructive" }),
  });

  function handleCreateList() {
    if (!newListName.trim()) return;
    createListMutation.mutate({ name: newListName.trim(), coverImageUrl: coverImage });
  }

  if (!user) return null;

  return (
    <>
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(true); }}
        className={cn(
          "flex items-center justify-center w-8 h-8 rounded-full transition-colors",
          saved
            ? "text-[#b388eb]"
            : "text-[#666] hover:text-[#b388eb]",
          className
        )}
        title={saved ? "Saved to list" : "Save to list"}
      >
        <Bookmark className={cn("h-4 w-4", saved && "fill-[#b388eb]")} />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="bg-[#1a1a1a] border-[#282828] text-white max-w-sm mx-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              <List className="h-4 w-4 text-[#b388eb]" />
              Save {placeName ? `"${placeName}"` : "place"} to a list
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-2 pt-1">
            {listsLoading ? (
              <div className="flex justify-center py-4">
                <div className="w-5 h-5 border-2 border-[#b388eb] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : lists && lists.length > 0 ? (
              lists.map(list => {
                const isSaved = savedListIds.has(list.id);
                return (
                  <button
                    key={list.id}
                    onClick={() => isSaved ? removeMutation.mutate(list.id) : addMutation.mutate(list.id)}
                    disabled={addMutation.isPending || removeMutation.isPending}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[#282828] hover:bg-[#333] transition-colors text-left"
                  >
                    <div className="relative flex-shrink-0">
                      {list.coverImageUrl ? (
                        <img
                          src={list.coverImageUrl}
                          alt={list.name}
                          className="w-7 h-7 rounded object-cover"
                        />
                      ) : (
                        <div className={cn(
                          "w-7 h-7 rounded-full flex items-center justify-center border",
                          isSaved ? "bg-[#b388eb]/20 border-[#b388eb]" : "border-[#444]"
                        )}>
                          {isSaved && <Check className="h-3 w-3 text-[#b388eb]" />}
                        </div>
                      )}
                      {list.coverImageUrl && isSaved && (
                        <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#b388eb] flex items-center justify-center">
                          <Check className="h-2 w-2 text-white" />
                        </div>
                      )}
                    </div>
                    <span className="text-sm flex-1">{list.name}</span>
                    {isSaved && (
                      <span className="text-[10px] text-[#b388eb] flex-shrink-0">Saved</span>
                    )}
                  </button>
                );
              })
            ) : (
              <p className="text-sm text-[#666] py-2 text-center">No lists yet — create one below</p>
            )}

            {creating ? (
              <div className="space-y-2 pt-1">
                <Input
                  autoFocus
                  placeholder="List name…"
                  value={newListName}
                  onChange={e => setNewListName(e.target.value)}
                  maxLength={80}
                  className="bg-[#282828] border-[#3E3E3E] text-white text-sm h-9"
                  onKeyDown={e => {
                    if (e.key === "Enter") handleCreateList();
                    if (e.key === "Escape") { setCreating(false); setNewListName(""); setCoverImage(null); }
                  }}
                />
                <ReviewImageUpload
                  value={coverImage}
                  onChange={setCoverImage}
                  label="Cover image (optional)"
                  hint="Add a photo to personalise your list"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => { setCreating(false); setNewListName(""); setCoverImage(null); }}
                    className="flex-1 h-9 rounded-lg text-sm text-[#666] hover:text-[#999] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateList}
                    disabled={!newListName.trim() || createListMutation.isPending}
                    className="flex-1 h-9 rounded-lg bg-[#b388eb]/20 text-[#b388eb] text-sm font-medium hover:bg-[#b388eb]/30 transition-colors disabled:opacity-40"
                  >
                    {createListMutation.isPending ? "…" : "Create"}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setCreating(true)}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border border-dashed border-[#333] text-[#666] hover:text-[#888] hover:border-[#444] transition-colors text-sm"
              >
                <Plus className="h-4 w-4" />
                New list
              </button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
