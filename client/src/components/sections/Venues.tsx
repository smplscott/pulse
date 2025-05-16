import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import VenueCard from "@/components/cards/VenueCard";
import { Venue } from "@shared/schema";

export default function Venues() {
  const { data: venues, isLoading, error } = useQuery<Venue[]>({
    queryKey: ["/api/venues"],
  });

  if (isLoading) {
    return (
      <section className="px-4 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-lg">Places to Listen</h2>
          <button className="text-[#5271ff] text-sm font-medium">View All</button>
        </div>
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-56 w-full" />
          ))}
        </div>
      </section>
    );
  }

  if (error || !venues || venues.length === 0) {
    return (
      <section className="px-4 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-lg">Places to Listen</h2>
          <Link href="/venues">
            <button className="text-[#5271ff] text-sm font-medium">View All</button>
          </Link>
        </div>
        <div className="bg-[#181818] rounded-lg p-4 text-center">
          <p className="text-[#B3B3B3]">
            {error ? "Failed to load venues" : "No venues available"}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="px-4 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold text-lg">Places to Listen</h2>
        <Link href="/venues">
          <button className="text-[#5271ff] text-sm font-medium">View All</button>
        </Link>
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        {venues.slice(0, 2).map((venue) => (
          <VenueCard key={venue.id} venue={venue} />
        ))}
      </div>
    </section>
  );
}
