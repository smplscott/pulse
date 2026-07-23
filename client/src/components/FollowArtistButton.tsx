import { UserPlus, UserCheck } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/context/AuthContext";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { Artist } from "@shared/schema";

interface Props {
  artistName: string;
  className?: string;
}

const FOLLOWED_KEY = ["/api/users/me/followed-artists"];

export default function FollowArtistButton({ artistName, className = "" }: Props) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: artist } = useQuery<Artist | null>({
    queryKey: ["/api/artists/name", artistName],
    queryFn: () =>
      fetch(`/api/artists/name/${encodeURIComponent(artistName)}`).then((r) => {
        if (!r.ok) return null;
        return r.json();
      }),
    enabled: !!artistName && !!user,
    staleTime: 60_000,
    retry: false,
  });

  const { data: followed } = useQuery<Artist[]>({
    queryKey: FOLLOWED_KEY,
    enabled: !!user,
  });

  const isFollowing = !!artist && (followed ?? []).some((a) => a.id === artist.id);

  const followMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/users/me/followed-artists/${artist!.id}`, {}),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: FOLLOWED_KEY });
      const prev = qc.getQueryData<Artist[]>(FOLLOWED_KEY);
      qc.setQueryData<Artist[]>(FOLLOWED_KEY, (old) =>
        artist ? [...(old ?? []), artist] : (old ?? [])
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      qc.setQueryData(FOLLOWED_KEY, ctx?.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: FOLLOWED_KEY });
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/users/me/followed-artists/${artist!.id}`, {}),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: FOLLOWED_KEY });
      const prev = qc.getQueryData<Artist[]>(FOLLOWED_KEY);
      qc.setQueryData<Artist[]>(FOLLOWED_KEY, (old) =>
        old ? old.filter((a) => a.id !== artist!.id) : []
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      qc.setQueryData(FOLLOWED_KEY, ctx?.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: FOLLOWED_KEY });
    },
  });

  if (!user || !artist) return null;

  const isPending = followMutation.isPending || unfollowMutation.isPending;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (isPending) return;
            if (isFollowing) {
              unfollowMutation.mutate();
            } else {
              followMutation.mutate();
            }
          }}
          className={`inline-flex items-center justify-center w-6 h-6 rounded-full transition-colors shrink-0 ${
            isFollowing
              ? "text-[#c2f970] hover:text-[#aad855]"
              : "text-[#555] hover:text-[#c2f970]"
          } ${isPending ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
        >
          {isFollowing ? (
            <UserCheck className="h-4 w-4" />
          ) : (
            <UserPlus className="h-4 w-4" />
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs">
        {isFollowing
          ? "Unfollow this artist"
          : "Follow this artist for their threads and opinions"}
      </TooltipContent>
    </Tooltip>
  );
}
