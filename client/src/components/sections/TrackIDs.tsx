import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { MusicSet } from "@shared/schema";
import TrackIDCard from "@/components/cards/TrackIDCard";

interface TrackIDsProps {
  hideTitle?: boolean;
}

export default function TrackIDs({ hideTitle = false }: TrackIDsProps) {
  const { data: sets, isLoading, error } = useQuery<MusicSet[]>({
    queryKey: ["/api/sets"],
  });

  if (isLoading) {
    return (
      <section className="px-4 mb-6">
        {!hideTitle && (
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Sets & Track IDs</h2>
            <button className="text-[#B3B3B3] hover:text-white text-sm font-medium">View All</button>
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

  if (error || !sets || sets.length === 0) {
    return (
      <section className="px-4 mb-6">
        {!hideTitle && (
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Sets & Track IDs</h2>
          </div>
        )}
        <div className="bg-[#181818] rounded-lg p-4 text-center">
          <p className="text-[#B3B3B3]">
            {error ? "Failed to load sets" : "No sets available"}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="px-4 mb-6">
      {!hideTitle && (
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Sets & Track IDs</h2>
          <Link href="/sets">
            <button className="text-[#B3B3B3] hover:text-white text-sm font-medium">View All</button>
          </Link>
        </div>
      )}
      <div className="flex overflow-x-auto space-x-3 pb-2 scrollbar-hide">
        {sets.map((set) => (
          <TrackIDCard key={set.id} set={set} />
        ))}
      </div>
    </section>
  );
}
