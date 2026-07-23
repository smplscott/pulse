import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import MusicPlayer from "@/components/layout/MusicPlayer";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, Music2, UserCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import type { Artist } from "@shared/schema";
import FollowArtistButton from "@/components/FollowArtistButton";

export default function FollowedArtistsPage() {
  const { user } = useAuth();

  const { data: artists, isLoading } = useQuery<Artist[]>({
    queryKey: [`/api/users/${user?.id}/followed-artists`],
    enabled: !!user?.id,
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
                  {artist.genres && artist.genres.length > 0 && (
                    <p className="text-xs text-[#666] truncate mt-0.5">
                      {(artist.genres as string[]).slice(0, 2).join(", ")}
                    </p>
                  )}
                </div>
                <FollowArtistButton artistName={artist.name} className="flex-shrink-0" />
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
