import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import TrackIDCard from "@/components/cards/TrackIDCard";
import { Playlist } from "@shared/schema";

interface TrackIDsProps {
  hideTitle?: boolean;
}

export default function TrackIDs({ hideTitle = false }: TrackIDsProps) {
  const { data: playlists, isLoading, error } = useQuery<Playlist[]>({
    queryKey: ["/api/playlists"],
  });

  if (isLoading) {
    return (
      <section className="px-4 mb-6">
        {!hideTitle && (
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-lg">Popular Track IDs</h2>
            <button className="text-[#E51D3E] text-sm font-medium">View All</button>
          </div>
        )}
        <div className="flex overflow-x-auto space-x-3 pb-2 scrollbar-hide">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex-shrink-0 w-40">
              <Skeleton className="h-40 w-40 mb-2" />
              <Skeleton className="h-4 w-32 mb-1" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (error || !playlists || playlists.length === 0) {
    return (
      <section className="px-4 mb-6">
        {!hideTitle && (
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-lg">Popular Track IDs</h2>
            <button className="text-[#E51D3E] text-sm font-medium">View All</button>
          </div>
        )}
        <div className="bg-[#181818] rounded-lg p-4 text-center">
          <p className="text-[#B3B3B3]">
            {error ? "Failed to load track IDs" : "No track IDs available"}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="px-4 mb-6">
      {!hideTitle && (
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-lg">Popular Track IDs</h2>
          <Link href="/discover">
            <button className="text-[#E51D3E] text-sm font-medium">View All</button>
          </Link>
        </div>
      )}
      
      <div className="flex overflow-x-auto space-x-3 pb-2 scrollbar-hide">
        {playlists.map((playlist) => (
          <TrackIDCard key={playlist.id} playlist={playlist} />
        ))}
      </div>
    </section>
  );
}
