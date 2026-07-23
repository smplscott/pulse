import { UserPlus, UserCheck } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/context/AuthContext";
import type { Artist } from "@shared/schema";

interface Props {
  artistName: string;
  className?: string;
}

export default function FollowArtistButton({ artistName, className = "" }: Props) {
  const { user } = useAuth();

  const { data: artist } = useQuery<Artist>({
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
    queryKey: ["/api/users/me/followed-artists"],
    enabled: !!user,
  });

  const isFollowing = !!artist && (followed ?? []).some((a) => a.id === artist.id);

  const followMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/users/me/followed-artists/${artist!.id}`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/users/me/followed-artists"] }),
  });

  const unfollowMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/users/me/followed-artists/${artist!.id}`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/users/me/followed-artists"] }),
  });

  if (!user || !artist) return null;

  const isPending = followMutation.isPending || unfollowMutation.isPending;

  return (
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
      title={isFollowing ? `Unfollow ${artistName}` : `Follow ${artistName}`}
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
  );
}
