import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import ThreadCard from "@/components/cards/ThreadCard";
import { Thread } from "@shared/schema";
import { cn } from "@/lib/utils";
import { MapPin, MessageCircle } from "lucide-react";

type PrimaryTab = "following" | "discover";
type PillTab = "artists" | "albums" | "shows" | "places";

const PILL_TABS: { id: PillTab; label: string }[] = [
  { id: "artists", label: "Artists" },
  { id: "albums", label: "Albums" },
  { id: "shows", label: "Shows" },
  { id: "places", label: "Places" },
];

const THREAD_TYPE_MAP: Record<PillTab, string> = {
  artists: "artist",
  albums: "album_review",
  shows: "live_show_review",
  places: "places",
};

const SECTION_LABELS: Record<PrimaryTab, Record<PillTab, string>> = {
  following: {
    artists: "TRENDING ACROSS ARTISTS YOU FOLLOW",
    albums: "ALBUM REVIEWS FROM ARTISTS YOU FOLLOW",
    shows: "SHOW REVIEWS FROM ARTISTS YOU FOLLOW",
    places: "THREADS FROM PLACES YOU FOLLOW",
  },
  discover: {
    artists: "TRENDING ARTISTS ON PULSE",
    albums: "TRENDING ALBUM REVIEWS",
    shows: "TRENDING SHOW REVIEWS",
    places: "TRENDING PLACE THREADS",
  },
};

function ThreadSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="bg-[#181818] rounded-xl h-28 animate-pulse" />
      ))}
    </div>
  );
}

function ThreadFeed({ threadType }: { threadType: string }) {
  const { data: threads, isLoading } = useQuery<Thread[]>({
    queryKey: ["/api/threads/featured", { threadType }],
    queryFn: async () => {
      const res = await fetch(`/api/threads/featured?threadType=${threadType}&limit=20`);
      return res.json();
    },
  });

  if (isLoading) return <ThreadSkeleton />;

  if (!threads || threads.length === 0) {
    return (
      <div className="text-center py-12 text-[#B3B3B3]">
        <MessageCircle className="h-10 w-10 mx-auto mb-3 opacity-20" />
        <p className="text-sm">No threads here yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {threads.map(thread => (
        <ThreadCard key={thread.id} thread={thread} />
      ))}
    </div>
  );
}

function PlacesEmptyState() {
  return (
    <div className="text-center py-12 text-[#B3B3B3]">
      <MapPin className="h-10 w-10 mx-auto mb-3 opacity-20" />
      <p className="text-sm font-medium text-white mb-1">Coming soon</p>
      <p className="text-xs">Follow places to see threads from your favourite venues here.</p>
    </div>
  );
}

export default function Home() {
  const [primary, setPrimary] = useState<PrimaryTab>("following");
  const [pill, setPill] = useState<PillTab>("artists");

  const threadType = THREAD_TYPE_MAP[pill];
  const sectionLabel = SECTION_LABELS[primary][pill];

  return (
    <div className="min-h-screen bg-[#121212] pb-24">
      <Header />

      {/* ── Primary tabs ── */}
      <div className="flex border-b border-[#2A2A2A]">
        {(["following", "discover"] as PrimaryTab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setPrimary(tab)}
            className={cn(
              "flex-1 py-3.5 text-sm font-semibold capitalize transition-colors",
              primary === tab
                ? "text-[#c2f970] border-b-2 border-[#c2f970] -mb-px"
                : "text-[#666] hover:text-[#B3B3B3]"
            )}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* ── Pill tabs ── */}
      <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide">
        {PILL_TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setPill(id)}
            className={cn(
              "flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border transition-colors",
              pill === id
                ? "bg-gradient-to-r from-[#b388eb] to-[#ff6fd8] text-white border-transparent"
                : "bg-transparent text-[#B3B3B3] border-[#3E3E3E] hover:border-[#666]"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Section label ── */}
      <div className="px-4 pb-3">
        <p className="text-[10px] font-semibold tracking-widest text-[#555] uppercase">
          {sectionLabel}
        </p>
      </div>

      {/* ── Content ── */}
      <main className="px-4">
        {pill === "places" ? (
          <PlacesEmptyState />
        ) : (
          <ThreadFeed key={`${primary}-${pill}`} threadType={threadType} />
        )}
      </main>

      <BottomNav />
    </div>
  );
}
