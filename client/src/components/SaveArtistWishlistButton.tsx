import { Bookmark } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/context/AuthContext";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { UserShowWishlistItem } from "@shared/schema";

interface Props {
  artistName: string;
  className?: string;
}

export default function SaveArtistWishlistButton({ artistName, className = "" }: Props) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const wishlistKey = user ? [`/api/users/${user.id}/show-wishlist`] : null;

  const { data: wishlist } = useQuery<UserShowWishlistItem[]>({
    queryKey: wishlistKey!,
    enabled: !!user,
  });

  const savedItem = wishlist?.find(
    (w) => w.artistName.toLowerCase() === artistName.toLowerCase()
  );
  const isSaved = !!savedItem;

  const addMutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", `/api/users/${user!.id}/show-wishlist`, { artistName }),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: wishlistKey! });
      const prev = qc.getQueryData<UserShowWishlistItem[]>(wishlistKey!);
      const optimistic: UserShowWishlistItem = {
        id: -1,
        userId: user!.id,
        artistName,
        createdAt: new Date(),
      };
      qc.setQueryData<UserShowWishlistItem[]>(wishlistKey!, (old) => [
        ...(old ?? []),
        optimistic,
      ]);
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      qc.setQueryData(wishlistKey!, ctx?.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: wishlistKey! });
    },
  });

  const removeMutation = useMutation({
    mutationFn: () =>
      apiRequest("DELETE", `/api/users/${user!.id}/show-wishlist/${savedItem!.id}`),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: wishlistKey! });
      const prev = qc.getQueryData<UserShowWishlistItem[]>(wishlistKey!);
      qc.setQueryData<UserShowWishlistItem[]>(wishlistKey!, (old) =>
        old ? old.filter((w) => w.id !== savedItem!.id) : []
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      qc.setQueryData(wishlistKey!, ctx?.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: wishlistKey! });
    },
  });

  if (!user) return null;

  const isPending = addMutation.isPending || removeMutation.isPending;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (isPending) return;
            if (isSaved) {
              removeMutation.mutate();
            } else {
              addMutation.mutate();
            }
          }}
          className={`inline-flex items-center justify-center w-6 h-6 rounded-full transition-colors shrink-0 ${
            isSaved
              ? "text-[#b388eb] hover:text-[#9a6fd6]"
              : "text-[#555] hover:text-[#b388eb]"
          } ${isPending ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
        >
          <Bookmark
            className="h-4 w-4"
            fill={isSaved ? "currentColor" : "none"}
            strokeWidth={isSaved ? 0 : 2}
          />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs">
        {isSaved ? "Saved to Shows Wishlist" : "Save this artist to your future shows wishlist"}
      </TooltipContent>
    </Tooltip>
  );
}
