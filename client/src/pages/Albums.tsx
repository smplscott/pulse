import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import MusicPlayer from "@/components/layout/MusicPlayer";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { SearchIcon, Disc3, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface AlbumFeedItem {
  albumId: string;
  albumName: string | null;
  albumArt: string | null;
  artistName: string | null;
  reviewCount: number;
  avgRating: number | null;
  firstReviewerUsername: string | null;
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <Star
          key={n}
          className={cn(
            "h-2.5 w-2.5",
            n <= Math.round(rating) ? "fill-[#c3f872] text-[#c3f872]" : "text-[#3E3E3E]",
          )}
        />
      ))}
    </div>
  );
}

function AlbumCard({ album }: { album: AlbumFeedItem }) {
  return (
    <Link href={`/albums/${album.albumId}`}>
      <div className="bg-[#181818] rounded-xl p-4 flex gap-3 cursor-pointer hover:bg-[#1e1e1e] transition-colors">
        <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 mt-0.5 bg-[#b388eb]/20">
          {album.albumArt
            ? <img src={album.albumArt} alt={album.albumName ?? "Album"} className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center"><Disc3 className="h-5 w-5 text-[#b388eb]" /></div>
          }
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm truncate hover:text-[#c3f872] transition-colors">
            {album.albumName ?? "Unknown Album"}
          </h3>
          <p className="text-xs text-[#B3B3B3] mt-0.5 truncate">{album.artistName ?? "Unknown Artist"}</p>
          <div className="flex items-center gap-2 mt-2">
            {album.avgRating !== null && (
              <div className="flex items-center gap-1">
                <StarRow rating={album.avgRating} />
                <span className="text-xs text-[#B3B3B3]">
                  {album.avgRating.toFixed(1)} ({album.reviewCount})
                </span>
              </div>
            )}
            {album.firstReviewerUsername && (
              <span className="text-[10px] text-[#555]">
                First reviewed by <span className="text-[#c2f970]">@{album.firstReviewerUsername}</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function Albums() {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: albums, isLoading } = useQuery<AlbumFeedItem[]>({
    queryKey: ["/api/albums"],
  });

  const filtered = albums?.filter(album => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      album.albumName?.toLowerCase().includes(q) ||
      album.artistName?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen pb-32">
      <Header />
      <main className="px-4 pt-4 pb-4">
        <div className="relative mb-4">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#B3B3B3]" />
          <Input
            placeholder="Search by album or artist..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9 bg-[#282828] border-[#3E3E3E] text-white placeholder:text-[#B3B3B3] h-10 text-sm"
          />
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        ) : filtered && filtered.length > 0 ? (
          <div className="space-y-3">
            {filtered.map(album => (
              <AlbumCard key={album.albumId} album={album} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-14 h-14 rounded-full bg-[#181818] flex items-center justify-center mx-auto mb-3">
              <Disc3 className="h-6 w-6 text-[#555]" />
            </div>
            <p className="text-[#B3B3B3] text-sm mb-1">
              {searchQuery ? "No albums found" : "No album reviews yet — be the first"}
            </p>
            {!searchQuery && (
              <p className="text-xs text-[#555]">Tap the + button to review an album.</p>
            )}
          </div>
        )}
      </main>
      <MusicPlayer />
      <BottomNav />
    </div>
  );
}
