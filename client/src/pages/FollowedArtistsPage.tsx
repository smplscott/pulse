import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { useEffect, useRef } from "react";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import MusicPlayer from "@/components/layout/MusicPlayer";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, Music2, UserCheck, UserMinus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { apiRequest } from "@/lib/queryClient";
import type { Artist } from "@shared/schema";
import SaveArtistWishlistButton from "@/components/SaveArtistWishlistButton";

const FOLLOWED_KEY = ["/api/users/me/followed-artists"];

export default function FollowedArtistsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const enrichedIds = useRef<Set<number>>(new Set());

  const { data: artists, isLoading } = useQuery<Artist[]>({
    queryKey: FOLLOWED_KEY,
    enabled: !!user,
  });

  const STALE_DAYS = 7;

  useEffect(() => {
    if (!artists) return;
    const now = Date.now();
    const staleMs = STALE_DAYS * 24 * 60 * 60 * 1000;
    const needsEnrich = artists.filter((a) => {
      if (enrichedIds.current.has(a.id)) return false;
      if (!a.profilePicture) return true;
      const enrichedAt = a.lastEnrichedAt ? new Date(a.lastEnrichedAt).getTime() : 0;
      return now - enrichedAt > staleMs;
    });
    if (needsEnrich.length === 0) return;

    needsEnrich.forEach((artist) => {
      enrichedIds.current.add(artist.id);
      fetch(`/api/spotify/artists/search?q=${encodeURIComponent(artist.name)}`)
        .then((r) => r.json())
        .then((data) => {
          const results: { spotifyId: string; name: string; imageUrl: string | null }[] =
            data.results ?? [];
          const match = results.find(
            (r) => r.name.toLowerCase() === artist.name.toLowerCase() && r.imageUrl
          ) ?? results.find((r) => r.imageUrl);
          if (!match?.imageUrl) return;
          return apiRequest("PATCH", `/api/artists/${artist.id}`, {
            profilePicture: match.imageUrl,
            spotifyId: match.spotifyId.startsWith("local-") ? undefined : match.spotifyId,
            lastEnrichedAt: new Date().toISOString(),
          });
        })
        .then((updated) => {
          if (!updated) return;
          return updated.json().then((updatedArtist: Artist) => {
            qc.setQueryData<Artist[]>(FOLLOWED_KEY, (old) =>
              old
                ? old.map((a) => (a.id === updatedArtist.id ? updatedArtist : a))
                : old
            );
          });
        })
        .catch(() => {});
    });
  }, [artists, qc]);

  const unfollowMutation = useMutation({
    mutationFn: (artistId: number) =>
      apiRequest("DELETE", `/api/users/me/followed-artists/${artistId}`, {}),
    onMutate: async (artistId: number) => {
      await qc.cancelQueries({ queryKey: FOLLOWED_KEY });
      const prev = qc.getQueryData<Artist[]>(FOLLOWED_KEY);
      qc.setQueryData<Artist[]>(FOLLOWED_KEY, (old) =>
        old ? old.filter((a) => a.id !== artistId) : []
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

        <div className="flex items-center gap-2 mb-5">
          <UserCheck className="h-5 w-5 text-[#c2f970]" />
          <h1 className="text-xl font-bold">Artists I Follow</h1>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex items-center gap-3 bg-[#181818] rounded-xl p-3">
                <Skeleton className="w-12 h-12 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : artists && artists.length > 0 ? (
          <div className="space-y-2">
            {artists.map(artist => (
              <div key={artist.id} className="flex items-center gap-3 bg-[#181818] rounded-xl p-3 hover:bg-[#1e1e1e] transition-colors">
                <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-[#282828]">
                  {artist.profilePicture ? (
                    <img src={artist.profilePicture} alt={artist.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Music2 className="h-5 w-5 text-[#555]" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{artist.name}</p>
                  {artist.genres && (artist.genres as string[]).length > 0 && (
                    <p className="text-xs text-[#666] truncate mt-0.5">
                      {(artist.genres as string[]).slice(0, 2).join(", ")}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <SaveArtistWishlistButton artistName={artist.name} spotifyImageUrl={artist.profilePicture ?? undefined} />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => unfollowMutation.mutate(artist.id)}
                        disabled={unfollowMutation.isPending}
                        className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[#555] hover:text-red-400 transition-colors disabled:opacity-50"
                      >
                        <UserMinus className="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      Unfollow
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-[#181818] rounded-xl p-10 text-center">
            <UserCheck className="h-10 w-10 text-[#333] mx-auto mb-3" />
            <p className="text-sm text-[#B3B3B3]">You're not following any artists yet</p>
            <Link href="/artists">
              <button className="mt-3 text-xs text-[#c2f970] hover:underline">Browse artists</button>
            </Link>
          </div>
        )}
      </div>

      <MusicPlayer />
      <BottomNav />
    </div>
  );
}
