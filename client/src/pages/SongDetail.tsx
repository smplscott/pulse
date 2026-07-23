import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import { Song, Thread } from "@shared/schema";
import FollowArtistButton from "@/components/FollowArtistButton";
import SaveArtistWishlistButton from "@/components/SaveArtistWishlistButton";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, Music2, MessageCircle, Bookmark, Smile, ExternalLink, CreditCard, Play } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const MOCK_CREDITS = [
  { role: "Written By", name: "The Artist" },
  { role: "Produced By", name: "The Producer" },
  { role: "Mixed By", name: "Mix Engineer" },
  { role: "Mastered By", name: "Mastering Engineer" },
  { role: "Label", name: "Self-released" },
];

const MOCK_SIMILAR = [
  { title: "Light My Fire", artist: "The Doors", genre: "Rock" },
  { title: "People Are Strange", artist: "The Doors", genre: "Rock" },
  { title: "Break on Through", artist: "The Doors", genre: "Rock" },
];

export default function SongDetail() {
  const { id } = useParams<{ id: string }>();
  const songId = parseInt(id);
  const [showCredits, setShowCredits] = useState(false);

  const { data: song, isLoading } = useQuery<Song>({
    queryKey: [`/api/songs/${songId}`],
    enabled: !isNaN(songId),
  });

  const { data: threads } = useQuery<Thread[]>({
    queryKey: ["/api/threads"],
  });

  const songThreads = threads?.filter(t => t.songId === songId).slice(0, 3);

  const streamingLinks = song?.streamingLinks
    ? Object.entries(song.streamingLinks).map(([platform, url]) => ({ platform, url }))
    : [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white pb-32">
        <Header />
        <div className="px-4 pt-4 space-y-4">
          <Skeleton className="h-6 w-32" />
          <div className="flex gap-4">
            <Skeleton className="w-16 h-16 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
          <div className="flex gap-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-10 flex-1 rounded-lg" />)}
          </div>
          <Skeleton className="h-px w-full" />
          {[1, 2].map(i => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
        </div>
      </div>
    );
  }

  if (!song) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#B3B3B3] mb-4">Song not found</p>
          <Link href="/songs"><button className="text-[#b388eb] hover:underline">← Back to Songs</button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pb-32">
      <Header />

      <div className="sticky top-0 z-30 bg-black/90 backdrop-blur px-4 py-3 flex items-center gap-3 border-b border-[#222]">
        <Link href="/songs">
          <button className="text-[#B3B3B3] hover:text-white transition">
            <ChevronLeft className="h-6 w-6" />
          </button>
        </Link>
        <span className="font-semibold truncate">{song.title}</span>
      </div>

      <div className="px-4 py-5 space-y-6">
        {/* Song card */}
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-[#282828]">
            {song.albumArt ? (
              <img src={song.albumArt} alt={song.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Music2 className="h-8 w-8 text-[#B3B3B3]" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold truncate">{song.title}</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <p className="text-sm text-[#B3B3B3] truncate">{song.artist}</p>
              <FollowArtistButton artistName={song.artist} />
              <SaveArtistWishlistButton artistName={song.artist} />
            </div>
            <p className="text-xs text-[#B3B3B3] truncate mt-0.5">
              {song.albumName ? song.albumName : "Single"}
            </p>
            <div className="flex flex-wrap gap-1 mt-2">
              {song.genre && (
                <span className="text-xs bg-[#282828] text-[#B3B3B3] px-2 py-0.5 rounded-full">{song.genre}</span>
              )}
              <span className="text-xs bg-[#b388eb]/20 text-[#b388eb] px-2 py-0.5 rounded-full font-medium">Song</span>
            </div>
          </div>
        </div>

        {/* Streaming links */}
        {streamingLinks.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {streamingLinks.map((link, i) => (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs bg-[#282828] hover:bg-[#3E3E3E] text-[#B3B3B3] hover:text-white px-3 py-1.5 rounded-full transition"
              >
                <Play className="h-3 w-3" />
                {link.platform}
                <ExternalLink className="h-2.5 w-2.5" />
              </a>
            ))}
          </div>
        )}

        {/* Engagement stats bar — derived from song thread data */}
        {(() => {
          const allThreads = threads?.filter(t => t.songId === songId) ?? [];
          const totalComments = allThreads.reduce((sum, t) => sum + (t.commentsCount ?? 0), 0);
          const totalSaves = allThreads.reduce((sum, t) => sum + (t.savesCount ?? 0), 0);
          const totalReactions = allThreads.reduce((sum, t) => sum + (t.upvotes ?? 0), 0);
          return (
            <div className="flex items-center gap-0 bg-[#1a1a1a] rounded-xl overflow-hidden divide-x divide-[#282828]">
              <div className="flex-1 flex flex-col items-center py-3 gap-1">
                <MessageCircle className="h-4 w-4 text-[#B3B3B3]" />
                <span className="text-sm font-semibold">{totalComments}</span>
                <span className="text-xs text-[#666]">Comments</span>
              </div>
              <div className="flex-1 flex flex-col items-center py-3 gap-1">
                <Bookmark className="h-4 w-4 text-[#B3B3B3]" />
                <span className="text-sm font-semibold">{totalSaves}</span>
                <span className="text-xs text-[#666]">Saves</span>
              </div>
              <div className="flex-1 flex flex-col items-center py-3 gap-1">
                <Smile className="h-4 w-4 text-[#B3B3B3]" />
                <span className="text-sm font-semibold">{totalReactions}</span>
                <span className="text-xs text-[#666]">Reactions</span>
              </div>
            </div>
          );
        })()}

        {/* Credits button */}
        <button
          onClick={() => setShowCredits(true)}
          className="w-full flex items-center justify-center gap-2 bg-[#1a1a1a] hover:bg-[#282828] rounded-xl py-3 text-sm font-medium text-[#B3B3B3] hover:text-white transition"
        >
          <CreditCard className="h-4 w-4" />
          View Credits
        </button>

        {/* About / story */}
        {song.story && (
          <div>
            <h2 className="text-base font-semibold mb-2">About this Song</h2>
            <p className="text-sm text-[#B3B3B3] leading-relaxed">{song.story}</p>
          </div>
        )}

        {/* Discussion threads */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold">Discussion</h2>
            <Link href="/threads">
              <button className="text-xs text-[#b388eb] hover:underline">See all</button>
            </Link>
          </div>
          {songThreads && songThreads.length > 0 ? (
            <div className="space-y-2">
              {songThreads.map(t => (
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
            <div className="bg-[#1a1a1a] rounded-lg p-4 text-center">
              <MessageCircle className="h-8 w-8 text-[#333] mx-auto mb-2" />
              <p className="text-sm text-[#666]">No discussions yet for this song.</p>
              <Link href="/create-thread">
                <button className="mt-2 text-xs text-[#b388eb] hover:underline">Start a thread</button>
              </Link>
            </div>
          )}
        </div>

        {/* Similar Songs */}
        <div>
          <h2 className="text-base font-semibold mb-3">Similar Songs</h2>
          <div className="space-y-2">
            {MOCK_SIMILAR.map((s, i) => (
              <div key={i} className="flex items-center gap-3 bg-[#1a1a1a] rounded-lg p-3">
                <div className="w-10 h-10 rounded bg-[#282828] flex items-center justify-center flex-shrink-0">
                  <Music2 className="h-5 w-5 text-[#B3B3B3]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{s.title}</p>
                  <p className="text-xs text-[#666] truncate">{s.artist}</p>
                </div>
                <span className="text-xs text-[#666]">{s.genre}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Credits dialog */}
      <Dialog open={showCredits} onOpenChange={(open) => { if (!open) setShowCredits(false); }}>
        <DialogContent className="bg-[#1a1a1a] border-[#3E3E3E] text-white max-w-sm">
          <DialogHeader>
            <DialogTitle>Credits — {song.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            {MOCK_CREDITS.map((c, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-[#B3B3B3]">{c.role}</span>
                <span className="font-medium text-right">{c.name}</span>
              </div>
            ))}
            {Array.isArray(song.features) && song.features.length > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-[#B3B3B3]">Featuring</span>
                <span className="font-medium text-right">{song.features.join(", ")}</span>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}
