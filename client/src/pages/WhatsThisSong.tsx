import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import Header from "@/components/layout/Header";
import TabNavigator from "@/components/layout/TabNavigator";
import BottomNav from "@/components/layout/BottomNav";
import MusicPlayer from "@/components/layout/MusicPlayer";
import SongIdentificationCard from "@/components/cards/SongIdentificationCard";
import { Thread } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function WhatsThisSong() {
  const tabs = [
    { label: "For You", path: "/" },
    { label: "Discover", path: "/discover" },
    { label: "What's That Song", path: "/whats-this-song" },
    { label: "Live Venues", path: "/venues" },
  ];

  const { data: activeThreads, isLoading: isLoadingActive } = useQuery<Thread[]>({
    queryKey: ["/api/threads", "song_request", "active"],
  });

  const { data: solvedThreads, isLoading: isLoadingSolved } = useQuery<Thread[]>({
    queryKey: ["/api/threads", "song_request", "solved"],
  });

  return (
    <div className="min-h-screen pb-32">
      <Header />
      <TabNavigator tabs={tabs} />
      
      <main className="px-4 py-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">What's This Song?</h1>
          <Link href="/create-song-request">
            <button className="bg-[#5271ff] text-white py-2 px-4 rounded-lg text-sm font-medium">
              New Request
            </button>
          </Link>
        </div>
        
        <Tabs defaultValue="active" className="mb-6">
          <TabsList className="w-full bg-[#181818] border border-[#3E3E3E]">
            <TabsTrigger value="active" className="flex-1">Active Requests</TabsTrigger>
            <TabsTrigger value="solved" className="flex-1">Solved</TabsTrigger>
          </TabsList>
          
          <TabsContent value="active" className="mt-4 space-y-4">
            {isLoadingActive ? (
              <>
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-40 w-full" />
                ))}
              </>
            ) : activeThreads && activeThreads.length > 0 ? (
              activeThreads
                .filter(thread => thread.status !== "solved")
                .map((thread) => (
                  <SongIdentificationCard key={thread.id} thread={thread} />
                ))
            ) : (
              <div className="text-center py-10">
                <p className="text-[#B3B3B3]">No active song identification requests</p>
                <Link href="/create-song-request">
                  <button className="mt-4 bg-[#282828] text-white py-2 px-4 rounded-lg text-sm font-medium">
                    Create a Request
                  </button>
                </Link>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="solved" className="mt-4 space-y-4">
            {isLoadingSolved ? (
              <>
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-40 w-full" />
                ))}
              </>
            ) : solvedThreads && solvedThreads.length > 0 ? (
              solvedThreads
                .filter(thread => thread.status === "solved")
                .map((thread) => (
                  <SongIdentificationCard key={thread.id} thread={thread} />
                ))
            ) : (
              <div className="text-center py-10">
                <p className="text-[#B3B3B3]">No solved song identification requests yet</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
      
      <MusicPlayer />
      <BottomNav />
    </div>
  );
}
