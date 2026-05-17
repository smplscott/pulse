import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import ThreadCard from "@/components/cards/ThreadCard";
import { useAuth } from "@/context/AuthContext";
import { Thread } from "@shared/schema";
import { Flame, MessageCircle } from "lucide-react";

export default function Home() {
  const { user } = useAuth();

  const { data: featuredThreads, isLoading: loadingFeatured } = useQuery<Thread[]>({
    queryKey: ["/api/threads/featured"],
  });

  const { data: engagedThreads, isLoading: loadingEngaged } = useQuery<Thread[]>({
    queryKey: [`/api/users/${user?.id}/threads/engaged`],
    enabled: !!user?.id,
  });

  return (
    <div className="min-h-screen bg-[#121212] pb-24">
      <Header />

      <main className="px-4 pt-4">
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-400" />
              <h2 className="text-lg font-bold text-white">Popular Discussions</h2>
            </div>
          </div>

          {loadingFeatured ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-[#181818] rounded-xl h-28 animate-pulse" />
              ))}
            </div>
          ) : featuredThreads && featuredThreads.length > 0 ? (
            <div className="space-y-3">
              {featuredThreads.map((thread) => (
                <ThreadCard key={thread.id} thread={thread} />
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-[#B3B3B3]">
              <MessageCircle className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No discussions yet — start the first one!</p>
            </div>
          )}
        </section>

        {user && (
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <MessageCircle className="h-5 w-5 text-[#c2f970]" />
              <h2 className="text-lg font-bold text-white">Continue Your Threads</h2>
            </div>

            {loadingEngaged ? (
              <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="bg-[#181818] rounded-xl h-24 animate-pulse" />
                ))}
              </div>
            ) : engagedThreads && engagedThreads.length > 0 ? (
              <div className="space-y-3">
                {engagedThreads.map((thread) => (
                  <ThreadCard key={thread.id} thread={thread} />
                ))}
              </div>
            ) : (
              <div className="bg-[#181818] rounded-xl p-6 text-center">
                <p className="text-sm text-[#B3B3B3]">Threads you create or comment on will appear here.</p>
              </div>
            )}
          </section>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
