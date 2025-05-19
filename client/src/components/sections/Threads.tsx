import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import ThreadCard from "@/components/cards/ThreadCard";
import { Thread } from "@shared/schema";

export default function Threads() {
  const { data: threads, isLoading, error } = useQuery<Thread[]>({
    queryKey: ["/api/threads", "discussion"],
  });

  if (isLoading) {
    return (
      <section className="px-4 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Hot Threads</h2>
          <button className="text-[#B3B3B3] hover:text-white text-sm font-medium">View All</button>
        </div>
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      </section>
    );
  }

  if (error || !threads || threads.length === 0) {
    return (
      <section className="px-4 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Hot Threads</h2>
          <Link href="/discover">
            <button className="text-[#B3B3B3] hover:text-white text-sm font-medium">View All</button>
          </Link>
        </div>
        <div className="bg-[#181818] rounded-lg p-4 text-center">
          <p className="text-[#B3B3B3]">
            {error ? "Failed to load threads" : "No threads available"}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="px-4 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Hot Threads</h2>
        <Link href="/discover">
          <button className="text-[#B3B3B3] hover:text-white text-sm font-medium">View All</button>
        </Link>
      </div>
      
      {threads.slice(0, 2).map((thread) => (
        <ThreadCard key={thread.id} thread={thread} className="mb-4" />
      ))}
      
      <Link href="/create-thread">
        <button className="w-full py-3 rounded-lg border border-[#3E3E3E] text-[#B3B3B3] text-sm font-medium">
          <span className="mr-2">+</span> Start a New Thread
        </button>
      </Link>
    </section>
  );
}
