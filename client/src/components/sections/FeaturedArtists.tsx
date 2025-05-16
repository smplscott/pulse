import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import ArtistCard from "@/components/cards/ArtistCard";
import { Artist } from "@shared/schema";

export default function FeaturedArtists() {
  const { data: artists, isLoading, error } = useQuery<Artist[]>({
    queryKey: ["/api/artists/featured"],
  });

  if (isLoading) {
    return (
      <section className="px-4 pt-4 pb-6">
        <h2 className="font-bold text-xl mb-4">Featured Artists</h2>
        <div className="grid grid-cols-2 gap-3">
          {[1, 2].map((i) => (
            <div key={i} className="bg-[#181818] rounded-lg overflow-hidden">
              <Skeleton className="h-36 w-full" />
              <div className="p-3">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (error || !artists || artists.length === 0) {
    return (
      <section className="px-4 pt-4 pb-6">
        <h2 className="font-bold text-xl mb-4">Featured Artists</h2>
        <div className="bg-[#181818] rounded-lg p-4 text-center">
          <p className="text-[#B3B3B3]">
            {error ? "Failed to load featured artists" : "No featured artists available"}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="px-4 pt-4 pb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-bold text-xl">Featured Artists</h2>
        <Link href="/discover">
          <button className="text-[#E51D3E] text-sm font-medium">View All</button>
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {artists.slice(0, 4).map((artist) => (
          <ArtistCard key={artist.id} artist={artist} />
        ))}
      </div>
    </section>
  );
}
