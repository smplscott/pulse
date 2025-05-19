import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import SongIdentificationCard from "@/components/cards/SongIdentificationCard";
import { Thread } from "@shared/schema";

export default function WhatsThisSong() {
  const { data: threads, isLoading, error } = useQuery<Thread[]>({
    queryKey: ["/api/threads", "song_request"],
  });

  if (isLoading) {
    return (
      <section className="bg-[#181818] px-4 py-5 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">What's This Song?</h2>
          <button className="text-[#5271ff] text-sm font-medium">View All</button>
        </div>
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </section>
    );
  }

  if (error || !threads || threads.length === 0) {
    return (
      <section className="bg-[#181818] px-4 py-5 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">What's This Song?</h2>
          <Link href="/whats-this-song">
            <button className="text-[#5271ff] text-sm font-medium">View All</button>
          </Link>
        </div>
        <div className="bg-[#282828] rounded-lg p-4 text-center">
          <p className="text-[#B3B3B3]">
            {error ? "Failed to load song requests" : "No song requests available"}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-[#181818] px-4 py-5 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">What's This Song?</h2>
        <Link href="/whats-this-song">
          <button className="text-[#5271ff] text-sm font-medium">View All</button>
        </Link>
      </div>
      
      {threads.slice(0, 2).map((thread) => (
        <SongIdentificationCard key={thread.id} thread={thread} className="mb-4" />
      ))}
      
      <Link href="/create-song-request">
        <button className="w-full py-3 rounded-lg border border-[#3E3E3E] text-[#B3B3B3] text-sm font-medium">
          <span className="mr-2">+</span> Post a "What's This Song" Request
        </button>
      </Link>
    </section>
  );
}
