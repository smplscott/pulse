import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Disc, MessageCircle, Music } from "lucide-react";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import MusicPlayer from "@/components/layout/MusicPlayer";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { Thread } from "@shared/schema";

interface SpotifyAlbumDetail {
  spotifyId: string;
  name: string;
  imageUrl: string | null;
  releaseYear: string;
  albumType: string;
  totalTracks: number;
  artistName: string;
  artistSpotifyId: string;
}

export default function AlbumPage() {
  const { spotifyId } = useParams<{ spotifyId: string }>();
  const [, navigate] = useLocation();

  const { data, isLoading: albumLoading } = useQuery<{ album: SpotifyAlbumDetail | null }>({
    queryKey: ["/api/spotify/albums", spotifyId],
    queryFn: () => fetch(`/api/spotify/albums/${spotifyId}`).then(r => r.json()),
    enabled: !!spotifyId,
    staleTime: 300_000,
  });

  const album = data?.album ?? null;

  const { data: threads, isLoading: threadsLoading } = useQuery<Thread[]>({
    queryKey: ["/api/threads", { albumId: spotifyId }],
    queryFn: () => fetch(`/api/threads?albumId=${encodeURIComponent(spotifyId ?? "")}`).then(r => r.json()),
    enabled: !!spotifyId,
  });

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <Header />
      <main className="pb-32 max-w-2xl mx-auto px-4 pt-4">
        <button
          onClick={() => history.back()}
          className="flex items-center gap-2 text-[#B3B3B3] hover:text-white text-sm mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        {albumLoading ? (
          <AlbumHeroSkeleton />
        ) : album ? (
          <AlbumHero album={album} onArtistClick={() => navigate(`/artist/${album.artistSpotifyId}`)} />
        ) : (
          <div className="py-16 text-center text-[#666]">Album not found.</div>
        )}

        <section className="mt-6">
          <h2 className="text-sm font-semibold text-[#666] uppercase tracking-wider mb-3 flex items-center justify-between">
            Community Threads
            {!threadsLoading && (threads ?? []).length > 0 && (
              <span className="text-xs font-normal text-[#444] normal-case tracking-normal">
                {(threads ?? []).length} {(threads ?? []).length === 1 ? "thread" : "threads"}
              </span>
            )}
          </h2>

          {threadsLoading ? (
            <div className="space-y-3">
              {[1, 2].map(i => <Skeleton key={i} className="h-20 w-full bg-[#1A1A1A] rounded-xl" />)}
            </div>
          ) : (threads ?? []).length === 0 ? (
            <div className="flex flex-col items-center py-10 text-[#444]">
              <MessageCircle className="h-7 w-7" />
              <p className="mt-2 text-sm">No threads yet for this album</p>
            </div>
          ) : (
            <div className="space-y-2">
              {(threads ?? []).map(thread => (
                <button
                  key={thread.id}
                  onClick={() => navigate(`/thread/${thread.id}`)}
                  className="w-full bg-[#111] border border-[#2A2A2A] rounded-xl p-4 text-left hover:border-[#3E3E3E] transition-colors"
                >
                  <div className="mb-1.5">
                    <ThreadTypeBadge type={thread.threadType} />
                  </div>
                  <p className="text-sm font-medium text-white line-clamp-2 leading-snug">{thread.title}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-[#555]">
                    <span>{thread.upvotes ?? 0} upvotes</span>
                    <span>{thread.commentsCount ?? 0} comments</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      </main>
      <MusicPlayer />
      <BottomNav />
    </div>
  );
}

function AlbumHero({ album, onArtistClick }: { album: SpotifyAlbumDetail; onArtistClick: () => void }) {
  return (
    <div className="flex gap-4 items-end">
      <div className="w-28 h-28 rounded-xl overflow-hidden bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center shrink-0">
        {album.imageUrl
          ? <img src={album.imageUrl} alt={album.name} className="w-full h-full object-cover" />
          : <Disc className="h-10 w-10 text-[#444]" />}
      </div>
      <div className="flex-1 min-w-0 pb-1">
        <p className="text-xs text-[#666] uppercase tracking-wider mb-1 capitalize">{album.albumType}</p>
        <h1 className="text-xl font-bold text-white leading-tight">{album.name}</h1>
        <button
          onClick={onArtistClick}
          className="text-sm text-[#B3B3B3] hover:text-[#c2f970] transition-colors mt-1"
        >
          {album.artistName}
        </button>
        <div className="flex items-center gap-3 mt-1.5 text-xs text-[#555]">
          {album.releaseYear && <span>{album.releaseYear}</span>}
          {album.totalTracks > 0 && <span>{album.totalTracks} tracks</span>}
        </div>
      </div>
    </div>
  );
}

function AlbumHeroSkeleton() {
  return (
    <div className="flex gap-4 items-end">
      <Skeleton className="w-28 h-28 rounded-xl bg-[#1A1A1A] shrink-0" />
      <div className="flex-1 space-y-2 pb-1">
        <Skeleton className="h-3 w-16 bg-[#1A1A1A]" />
        <Skeleton className="h-6 w-3/4 bg-[#1A1A1A]" />
        <Skeleton className="h-4 w-1/2 bg-[#1A1A1A]" />
        <Skeleton className="h-3 w-1/3 bg-[#1A1A1A]" />
      </div>
    </div>
  );
}

function ThreadTypeBadge({ type }: { type: string }) {
  const labels: Record<string, string> = {
    live_show_review: "Show Review", album_review: "Album Review",
    topic: "Topic", new_music: "New Music", listening_now: "Listening Now",
  };
  const colors: Record<string, string> = {
    live_show_review: "bg-[#b388eb]/20 text-[#b388eb]",
    album_review: "bg-purple-900/40 text-purple-300",
    topic: "bg-[#1A1A1A] text-[#888]",
    new_music: "bg-green-900/40 text-green-300",
    listening_now: "bg-orange-900/40 text-orange-300",
  };
  return (
    <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", colors[type] ?? "bg-[#1A1A1A] text-[#888]")}>
      {labels[type] ?? type}
    </span>
  );
}
