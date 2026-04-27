import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { MusicSet, Thread } from "@shared/schema";
import { ChevronLeft, Plus, CheckCircle2, XCircle, Lock, Music2, Users, ListMusic, MessageCircle, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import BottomNav from "@/components/layout/BottomNav";
import Header from "@/components/layout/Header";

interface TrackIdWithVote {
  id: number;
  setId: number;
  title: string;
  artist: string;
  submittedBy: number;
  confirmCount: number;
  disagreeCount: number;
  locked: boolean;
  removed: boolean;
  userVote: "confirm" | "disagree" | null;
  createdAt: string;
}

function TrackIdRow({ track, setId }: { track: TrackIdWithVote; setId: number }) {
  const { toast } = useToast();

  const voteMutation = useMutation({
    mutationFn: (voteType: "confirm" | "disagree") =>
      apiRequest("POST", `/api/track-ids/${track.id}/vote`, { voteType }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sets", setId.toString(), "track-ids"] });
    },
    onError: (err: any) => {
      toast({
        title: "Could not vote",
        description: err.message || "You may have already voted on this track.",
        variant: "destructive",
      });
    },
  });

  const hasVoted = !!track.userVote;

  return (
    <div className={`bg-[#1a1a1a] rounded-lg p-3 flex items-center gap-3 ${track.locked ? "border border-[#4ade80]/40" : ""}`}>
      <div className="w-8 h-8 bg-[#282828] rounded flex items-center justify-center flex-shrink-0">
        <Music2 className="h-4 w-4 text-[#B3B3B3]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{track.title}</p>
        <p className="text-xs text-[#B3B3B3] truncate">{track.artist}</p>
      </div>
      {track.locked && (
        <Badge className="bg-[#4ade80] text-black text-xs flex-shrink-0 flex items-center gap-1">
          <Lock className="h-3 w-3" /> Confirmed
        </Badge>
      )}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          disabled={hasVoted || track.locked || voteMutation.isPending}
          onClick={() => voteMutation.mutate("confirm")}
          className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition ${
            track.userVote === "confirm"
              ? "bg-[#4ade80]/20 text-[#4ade80]"
              : hasVoted || track.locked
              ? "opacity-40 cursor-not-allowed text-[#4ade80]"
              : "hover:bg-[#4ade80]/10 text-[#4ade80]"
          }`}
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>{track.confirmCount}</span>
        </button>
        <button
          disabled={hasVoted || track.locked || voteMutation.isPending}
          onClick={() => voteMutation.mutate("disagree")}
          className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition ${
            track.userVote === "disagree"
              ? "bg-red-500/20 text-red-400"
              : hasVoted || track.locked
              ? "opacity-40 cursor-not-allowed text-red-400"
              : "hover:bg-red-500/10 text-red-400"
          }`}
        >
          <XCircle className="h-3.5 w-3.5" />
          <span>{track.disagreeCount}</span>
        </button>
      </div>
    </div>
  );
}

export default function SetDetail() {
  const { id } = useParams<{ id: string }>();
  const setId = parseInt(id);
  const { toast } = useToast();
  const [newTitle, setNewTitle] = useState("");
  const [newArtist, setNewArtist] = useState("");
  const [showSubmitForm, setShowSubmitForm] = useState(false);

  const { data: set, isLoading: isLoadingSet } = useQuery<MusicSet>({
    queryKey: ["/api/sets", id],
  });

  const { data: trackIds, isLoading: isLoadingTrackIds } = useQuery<TrackIdWithVote[]>({
    queryKey: ["/api/sets", id, "track-ids"],
    queryFn: () => fetch(`/api/sets/${setId}/track-ids`).then(r => r.json()),
    enabled: !isNaN(setId),
  });

  const { data: threads } = useQuery<Thread[]>({
    queryKey: ["/api/threads"],
  });

  const setTitle = set?.title?.toLowerCase() || "";
  const setThreads = threads?.filter(t =>
    t.type === "set" || (setTitle.length > 3 && t.title.toLowerCase().includes(setTitle))
  ).slice(0, 3);

  const submitMutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", `/api/sets/${setId}/track-ids`, { title: newTitle, artist: newArtist }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sets", id, "track-ids"] });
      setNewTitle("");
      setNewArtist("");
      setShowSubmitForm(false);
      toast({ title: "Track submitted!", description: "Others can now confirm or disagree." });
    },
    onError: () => {
      toast({ title: "Failed to submit", description: "Please try again.", variant: "destructive" });
    },
  });

  if (isLoadingSet) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Header />
        <div className="p-4 space-y-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-20 w-full rounded-lg" />
          <Skeleton className="h-6 w-40" />
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
        </div>
      </div>
    );
  }

  if (!set) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Set not found</h1>
          <Link href="/sets">
            <Button variant="outline">Back to Sets</Button>
          </Link>
        </div>
      </div>
    );
  }

  const lockedCount = trackIds?.filter(t => t.locked).length || 0;
  const totalCount = trackIds?.length || 0;
  const contributorIds = new Set(trackIds?.map(t => t.submittedBy) || []);

  return (
    <div className="min-h-screen bg-black text-white pb-32">
      <Header />

      <header className="flex items-center justify-between px-4 py-3 border-b border-[#222]">
        <Link href="/sets">
          <button className="flex items-center gap-2 text-[#B3B3B3] hover:text-white transition">
            <ChevronLeft className="h-5 w-5" />
          </button>
        </Link>
        <h1 className="text-base font-semibold">Set Thread</h1>
        <div className="w-8" />
      </header>

      <main className="px-4 py-4 space-y-6">
        {/* Set card */}
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-[#282828]">
            {set.image ? (
              <img src={set.image} alt={set.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ListMusic className="h-8 w-8 text-[#B3B3B3]" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h1 className="text-xl font-bold">{set.title}</h1>
              <Badge className="bg-[#4ade80] text-black text-xs font-semibold px-2 py-0.5 hover:bg-[#4ade80]">SET</Badge>
              {set.verified && (
                <Badge className="bg-[#5271ff] text-white text-xs font-semibold px-2 py-0.5">VERIFIED</Badge>
              )}
            </div>
            <p className="text-sm text-[#B3B3B3]">
              by {set.curator}
              {set.city && ` · ${set.city}${set.country ? `, ${set.country}` : ""}`}
              {set.eventDate && ` · ${set.eventDate}`}
            </p>
            <div className="flex items-center gap-4 mt-2 text-xs text-[#888]">
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {contributorIds.size} contributor{contributorIds.size !== 1 ? "s" : ""}
              </span>
              <span className="flex items-center gap-1">
                <Music2 className="h-3 w-3" />
                {totalCount} track{totalCount !== 1 ? "s" : ""} · {lockedCount} confirmed
              </span>
            </div>
          </div>
        </div>

        {/* Track IDs section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Track IDs</h2>
            <button
              onClick={() => setShowSubmitForm(prev => !prev)}
              className="flex items-center gap-1 text-sm text-[#5271ff] hover:text-white transition"
            >
              <Plus className="h-4 w-4" />
              Submit a track
            </button>
          </div>

          {showSubmitForm && (
            <div className="bg-[#1a1a1a] rounded-lg p-4 mb-4 space-y-3">
              <p className="text-sm text-[#B3B3B3]">What track was played? Others will confirm or disagree.</p>
              <Input
                placeholder="Track title"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                className="bg-[#282828] border-[#3E3E3E] text-white placeholder:text-[#666]"
              />
              <Input
                placeholder="Artist name"
                value={newArtist}
                onChange={e => setNewArtist(e.target.value)}
                className="bg-[#282828] border-[#3E3E3E] text-white placeholder:text-[#666]"
              />
              <div className="flex gap-2">
                <Button
                  onClick={() => submitMutation.mutate()}
                  disabled={!newTitle.trim() || !newArtist.trim() || submitMutation.isPending}
                  className="flex-1 bg-[#5271ff] hover:bg-[#4a63e8] text-white"
                >
                  {submitMutation.isPending ? "Submitting..." : "Submit"}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setShowSubmitForm(false)}
                  className="text-[#B3B3B3] hover:text-white"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {isLoadingTrackIds ? (
              [1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full rounded-lg" />)
            ) : trackIds && trackIds.length > 0 ? (
              trackIds.map(track => (
                <TrackIdRow key={track.id} track={track} setId={setId} />
              ))
            ) : (
              <div className="text-center py-10 text-[#666]">
                <Music2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No tracks submitted yet.</p>
                <p className="text-xs mt-1">Be the first to identify a track from this set!</p>
              </div>
            )}
          </div>
        </div>

        {/* Voting guide */}
        {trackIds && trackIds.length > 0 && (
          <div className="bg-[#1a1a1a] rounded-lg p-3 text-xs text-[#666] flex gap-4">
            <span className="flex items-center gap-1 text-[#4ade80]"><CheckCircle2 className="h-3 w-3" /> 5 confirms = locked in</span>
            <span className="flex items-center gap-1 text-red-400"><XCircle className="h-3 w-3" /> 5 disagrees = removed</span>
          </div>
        )}

        {/* Discussion */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Discussion</h2>
            <Link href="/threads">
              <button className="text-xs text-[#5271ff] hover:underline">See all</button>
            </Link>
          </div>
          {setThreads && setThreads.length > 0 ? (
            <div className="space-y-2">
              {setThreads.map(t => (
                <Link key={t.id} href={`/thread/${t.id}`}>
                  <div className="bg-[#1a1a1a] hover:bg-[#222] rounded-lg p-3 cursor-pointer transition">
                    <p className="text-sm font-medium mb-1 line-clamp-2">{t.title}</p>
                    <div className="flex items-center gap-3 text-xs text-[#666]">
                      <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" />{t.commentsCount}</span>
                      <span className="flex items-center gap-1"><Bookmark className="h-3 w-3" />{t.savesCount}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-[#1a1a1a] rounded-lg p-5 text-center">
              <MessageCircle className="h-8 w-8 text-[#333] mx-auto mb-2" />
              <p className="text-sm text-[#666]">No discussions yet for this set.</p>
              <Link href="/create-thread">
                <button className="mt-2 text-xs text-[#5271ff] hover:underline">Start a thread</button>
              </Link>
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
