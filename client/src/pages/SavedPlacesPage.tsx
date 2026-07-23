import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import MusicPlayer from "@/components/layout/MusicPlayer";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { ChevronLeft, MapPin, List, Plus, Trash2, ChevronRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { PlaceList, Place, PlaceListItem } from "@shared/schema";

type PlaceListItemWithPlace = PlaceListItem & { place: Place };

const CATEGORY_LABELS: Record<string, string> = {
  bar: "Bar",
  club: "Club",
  record_store: "Record Store",
  coffee_shop: "Café",
  other: "Other",
};

function ListDetail({ list, userId, onBack }: { list: PlaceList; userId: number; onBack: () => void }) {
  const { toast } = useToast();

  const { data: items, isLoading } = useQuery<PlaceListItemWithPlace[]>({
    queryKey: [`/api/place-lists/${list.id}/items`],
  });

  const removeMutation = useMutation({
    mutationFn: (placeId: number) =>
      apiRequest("DELETE", `/api/place-lists/${list.id}/items/${placeId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/place-lists/${list.id}/items`] });
    },
    onError: () => toast({ title: "Failed to remove", variant: "destructive" }),
  });

  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center mb-5 text-[#B3B3B3] hover:text-white transition-colors"
      >
        <ChevronLeft className="h-5 w-5 mr-1" />
        <span className="text-sm">My Lists</span>
      </button>

      <div className="flex items-center gap-2 mb-5">
        <List className="h-5 w-5 text-[#b388eb]" />
        <h2 className="text-xl font-bold">{list.name}</h2>
        <span className="text-xs text-[#555] mt-0.5">
          {items ? `${items.length} place${items.length !== 1 ? "s" : ""}` : ""}
        </span>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
        </div>
      ) : items && items.length > 0 ? (
        <div className="space-y-2">
          {items.map(item => (
            <div key={item.id} className="bg-[#181818] rounded-xl">
              <Link href={`/places/${item.place.id}`}>
                <div className="flex items-center gap-3 px-4 py-3 hover:bg-[#1e1e1e] transition-colors rounded-xl cursor-pointer">
                  <div className="w-10 h-10 rounded-lg bg-[#1a2a1a] border border-[#c2f970]/20 flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-5 w-5 text-[#c2f970]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{item.place.name}</p>
                    <p className="text-xs text-[#888] mt-0.5">{item.place.city}, {item.place.country}</p>
                  </div>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#252525] text-[#888] flex-shrink-0">
                    {CATEGORY_LABELS[item.place.category] ?? item.place.category}
                  </span>
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeMutation.mutate(item.place.id); }}
                    disabled={removeMutation.isPending}
                    className="text-[#555] hover:text-rose-400 transition-colors p-1 flex-shrink-0"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-[#181818] rounded-xl p-10 text-center">
          <MapPin className="h-10 w-10 text-[#333] mx-auto mb-3" />
          <p className="text-sm text-[#B3B3B3]">No places in this list yet</p>
          <Link href="/places">
            <button className="mt-3 text-xs text-[#b388eb] hover:underline">Browse places</button>
          </Link>
        </div>
      )}
    </div>
  );
}

export default function SavedPlacesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedList, setSelectedList] = useState<PlaceList | null>(null);
  const [newListName, setNewListName] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const { data: lists, isLoading } = useQuery<PlaceList[]>({
    queryKey: [`/api/users/${user?.id}/place-lists`],
    enabled: !!user?.id,
  });

  const createMutation = useMutation({
    mutationFn: (name: string) =>
      apiRequest("POST", `/api/users/${user?.id}/place-lists`, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/place-lists`] });
      setNewListName("");
      setShowCreate(false);
      toast({ title: "List created" });
    },
    onError: () => toast({ title: "Failed to create list", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (listId: number) =>
      apiRequest("DELETE", `/api/users/${user?.id}/place-lists/${listId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/place-lists`] });
      toast({ title: "List deleted" });
    },
    onError: () => toast({ title: "Failed to delete list", variant: "destructive" }),
  });

  if (selectedList) {
    return (
      <div className="min-h-screen pb-32">
        <Header />
        <div className="px-4 pt-4 max-w-lg mx-auto">
          <ListDetail
            list={selectedList}
            userId={user?.id ?? 0}
            onBack={() => setSelectedList(null)}
          />
        </div>
        <MusicPlayer />
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32">
      <Header />
      <div className="px-4 pt-4 max-w-lg mx-auto">
        <Link href="/profile">
          <div className="flex items-center mb-5 cursor-pointer text-[#B3B3B3] hover:text-white transition-colors">
            <ChevronLeft className="h-5 w-5 mr-1" />
            <span className="text-sm">Profile</span>
          </div>
        </Link>

        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <List className="h-5 w-5 text-[#b388eb]" />
            <h1 className="text-xl font-bold">My Place Lists</h1>
          </div>
          <button
            onClick={() => setShowCreate(v => !v)}
            className="flex items-center gap-1.5 text-xs text-[#b388eb] hover:text-white transition-colors"
          >
            <Plus className="h-4 w-4" />
            New list
          </button>
        </div>

        {showCreate && (
          <div className="flex gap-2 mb-4">
            <Input
              autoFocus
              placeholder="List name…"
              value={newListName}
              onChange={e => setNewListName(e.target.value)}
              maxLength={80}
              className="bg-[#282828] border-[#3E3E3E] text-white text-sm h-9 flex-1"
              onKeyDown={e => {
                if (e.key === "Enter" && newListName.trim()) createMutation.mutate(newListName.trim());
                if (e.key === "Escape") { setShowCreate(false); setNewListName(""); }
              }}
            />
            <button
              onClick={() => newListName.trim() && createMutation.mutate(newListName.trim())}
              disabled={!newListName.trim() || createMutation.isPending}
              className="px-3 h-9 rounded-lg bg-[#b388eb]/20 text-[#b388eb] text-sm font-medium hover:bg-[#b388eb]/30 transition-colors disabled:opacity-40 flex-shrink-0"
            >
              {createMutation.isPending ? "…" : "Create"}
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
          </div>
        ) : lists && lists.length > 0 ? (
          <div className="space-y-2">
            {lists.map(list => (
              <div
                key={list.id}
                className="bg-[#181818] rounded-xl px-4 py-3 flex items-center gap-3 hover:bg-[#1e1e1e] transition-colors cursor-pointer"
                onClick={() => setSelectedList(list)}
              >
                <div className="w-10 h-10 rounded-lg bg-[#1a0d2e] border border-[#b388eb]/20 flex items-center justify-center flex-shrink-0">
                  <List className="h-5 w-5 text-[#b388eb]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{list.name}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-[#444] flex-shrink-0" />
                <button
                  onClick={e => { e.stopPropagation(); deleteMutation.mutate(list.id); }}
                  disabled={deleteMutation.isPending}
                  className="text-[#555] hover:text-rose-400 transition-colors p-1 flex-shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-[#181818] rounded-xl p-10 text-center">
            <List className="h-10 w-10 text-[#333] mx-auto mb-3" />
            <p className="text-sm text-[#B3B3B3]">No lists yet</p>
            <p className="text-xs text-[#555] mt-1">Create a list and save places you love</p>
            <button
              onClick={() => setShowCreate(true)}
              className="mt-3 text-xs text-[#b388eb] hover:underline"
            >
              Create your first list
            </button>
          </div>
        )}
      </div>

      <MusicPlayer />
      <BottomNav />
    </div>
  );
}
