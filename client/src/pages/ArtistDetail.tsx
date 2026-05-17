import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeft, Users, Music, Ticket, MessageCircle, Disc, Calendar, MapPin } from "lucide-react";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import MusicPlayer from "@/components/layout/MusicPlayer";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import type { Thread } from "@shared/schema";

interface SpotifyArtist { spotifyId: string; name: string; imageUrl: string | null; genres: string[]; followers: number; }
interface SpotifyAlbum { spotifyId: string; name: string; imageUrl: string | null; releaseYear: string; albumType: string; }
interface SetlistShow { setlistfmId: string; artistName: string; venueName: string; city: string; country: string; eventDate: string; }

export default function ArtistDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const isSpotifyId = !!id && !/^\d+$/.test(id);

  const { data: spotifyData, isLoading: spotifyLoading } = useQuery<{ artist: SpotifyArtist | null }>({
    queryKey: ["/api/spotify/artists", id],
    queryFn: () => fetch(`/api/spotify/artists/${id}`).then(r => r.json()),
    enabled: !!id && isSpotifyId,
    staleTime: 300_000,
  });

  const { data: localArtist, isLoading: localLoading } = useQuery<{ name: string; genres: unknown; profilePicture?: string | null }>({
    queryKey: ["/api/artists", id],
    queryFn: () => fetch(`/api/artists/${id}`).then(r => r.json()),
    enabled: !!id && !isSpotifyId,
  });

  const artist = isSpotifyId
    ? spotifyData?.artist
      ? { name: spotifyData.artist.name, imageUrl: spotifyData.artist.imageUrl, genres: spotifyData.artist.genres, followers: spotifyData.artist.followers }
      : null
    : localArtist
      ? { name: localArtist.name, imageUrl: localArtist.profilePicture ?? null, genres: (localArtist.genres as string[]) ?? [], followers: undefined as number | undefined }
      : null;

  const artistName = artist?.name ?? "";
  const isLoading = isSpotifyId ? spotifyLoading : localLoading;

  const { data: albumsData, isLoading: albumsLoading } = useQuery<{ results: SpotifyAlbum[] }>({
    queryKey: ["/api/spotify/artists", id, "albums"],
    queryFn: () => fetch(`/api/spotify/artists/${id}/albums`).then(r => r.json()),
    enabled: !!id && isSpotifyId,
    staleTime: 300_000,
  });

  const { data: showsData, isLoading: showsLoading } = useQuery<{ results: SetlistShow[] }>({
    queryKey: ["/api/setlistfm/search", artistName],
    queryFn: () => fetch(`/api/setlistfm/search?artist=${encodeURIComponent(artistName)}`).then(r => r.json()),
    enabled: artistName.length > 0,
    staleTime: 120_000,
  });

  const { data: threads, isLoading: threadsLoading } = useQuery<Thread[]>({
    queryKey: ["/api/threads", { artistName }],
    queryFn: () => fetch(`/api/threads?artistName=${encodeURIComponent(artistName)}`).then(r => r.json()),
    enabled: artistName.length > 0,
  });

  const importShowMutation = useMutation({
    mutationFn: async (show: SetlistShow) => {
      const res = await apiRequest("POST", "/api/shows", {
        setlistfmId: show.setlistfmId,
        artistName: show.artistName,
        venueName: show.venueName,
        city: show.city,
        country: show.country,
        eventDate: show.eventDate,
        isManual: false,
      });
      return res.json();
    },
    onSuccess: (imported) => {
      queryClient.invalidateQueries({ queryKey: ["/api/shows"] });
      navigate(`/shows/${imported.id}`);
    },
  });

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <Header />
      <main className="pb-32 max-w-2xl mx-auto">
        <div className="px-4 pt-4">
          <button
            onClick={() => history.back()}
            className="flex items-center gap-2 text-[#B3B3B3] hover:text-white text-sm mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        </div>

        {isLoading ? (
          <ArtistHeaderSkeleton />
        ) : artist ? (
          <ArtistHero artist={artist} />
        ) : (
          <div className="px-4 py-16 text-center text-[#666]">Artist not found.</div>
        )}

        {artist && (
          <Tabs defaultValue="shows" className="mt-2">
            <TabsList className="w-full bg-transparent border-b border-[#2A2A2A] rounded-none h-auto p-0 justify-start gap-0">
              {[
                { value: "shows", label: "Shows", Icon: Ticket },
                { value: "albums", label: "Albums", Icon: Disc },
                { value: "threads", label: "Threads", Icon: MessageCircle },
              ].map(({ value, label, Icon }) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className="flex-1 rounded-none py-3 text-sm gap-1.5 data-[state=active]:border-b-2 data-[state=active]:border-[#c2f970] data-[state=active]:text-white data-[state=inactive]:text-[#555] data-[state=active]:bg-transparent data-[state=inactive]:bg-transparent"
                >
                  <Icon className="h-4 w-4" />{label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="shows" className="mt-0 px-4 pt-4">
              {showsLoading ? (
                <SkeletonList count={3} height="h-16" />
              ) : (showsData?.results ?? []).length === 0 ? (
                <EmptyState icon={<Ticket className="h-8 w-8" />} text="No shows found" />
              ) : (
                <div className="space-y-2">
                  {(showsData?.results ?? []).map(show => (
                    <button
                      key={show.setlistfmId}
                      onClick={() => importShowMutation.mutate(show)}
                      disabled={importShowMutation.isPending}
                      className="w-full bg-[#111] border border-[#2A2A2A] rounded-xl p-3 flex items-center gap-3 hover:border-[#3E3E3E] transition-colors text-left disabled:opacity-50"
                    >
                      <div className="w-10 h-10 bg-[#1A1A1A] rounded-lg flex items-center justify-center shrink-0">
                        <Ticket className="h-5 w-5 text-[#555]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{show.venueName}</p>
                        <div className="flex items-center gap-1 text-xs text-[#B3B3B3] mt-0.5">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span className="truncate">{show.city}, {show.country}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-[#555] shrink-0">
                        <Calendar className="h-3 w-3" />{show.eventDate}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="albums" className="mt-0 px-4 pt-4">
              {albumsLoading ? (
                <div className="grid grid-cols-2 gap-3">
                  {[1, 2, 3, 4].map(i => <Skeleton key={i} className="aspect-square bg-[#1A1A1A] rounded-xl" />)}
                </div>
              ) : !isSpotifyId ? (
                <EmptyState icon={<Disc className="h-8 w-8" />} text="Albums require a Spotify-linked artist" />
              ) : (albumsData?.results ?? []).length === 0 ? (
                <EmptyState icon={<Disc className="h-8 w-8" />} text="No albums found" />
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {(albumsData?.results ?? []).map(album => (
                    <button
                      key={album.spotifyId}
                      onClick={() => navigate(`/album/${album.spotifyId}`)}
                      className="group text-left"
                    >
                      <div className="aspect-square rounded-xl overflow-hidden bg-[#1A1A1A] mb-2 border border-[#2A2A2A]">
                        {album.imageUrl
                          ? <img src={album.imageUrl} alt={album.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                          : <div className="w-full h-full flex items-center justify-center"><Disc className="h-8 w-8 text-[#444]" /></div>}
                      </div>
                      <p className="text-sm font-medium text-white truncate leading-tight">{album.name}</p>
                      <p className="text-xs text-[#666] mt-0.5">
                        {album.releaseYear}{album.releaseYear && " · "}<span className="capitalize">{album.albumType}</span>
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="threads" className="mt-0 px-4 pt-4">
              {threadsLoading ? (
                <SkeletonList count={3} height="h-20" />
              ) : (threads ?? []).length === 0 ? (
                <EmptyState icon={<MessageCircle className="h-8 w-8" />} text="No threads yet for this artist" />
              ) : (
                <div className="space-y-2">
                  {(threads ?? []).map(thread => (
                    <button
                      key={thread.id}
                      onClick={() => navigate(`/thread/${thread.id}`)}
                      className="w-full bg-[#111] border border-[#2A2A2A] rounded-xl p-4 text-left hover:border-[#3E3E3E] transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-1.5">
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
            </TabsContent>
          </Tabs>
        )}
      </main>
      <MusicPlayer />
      <BottomNav />
    </div>
  );
}

function ArtistHero({ artist }: { artist: { name: string; imageUrl?: string | null; genres: string[]; followers?: number } }) {
  return (
    <div className="px-4 pb-2">
      <div className="flex items-end gap-4">
        <div className="w-24 h-24 rounded-2xl overflow-hidden bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center shrink-0">
          {artist.imageUrl
            ? <img src={artist.imageUrl} alt={artist.name} className="w-full h-full object-cover" />
            : <Music className="h-10 w-10 text-[#444]" />}
        </div>
        <div className="flex-1 min-w-0 pb-1">
          <h1 className="text-2xl font-bold text-white leading-tight truncate">{artist.name}</h1>
          {artist.followers != null && (
            <div className="flex items-center gap-1.5 text-xs text-[#B3B3B3] mt-1">
              <Users className="h-3.5 w-3.5" />
              {artist.followers.toLocaleString()} followers
            </div>
          )}
          {artist.genres.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {artist.genres.slice(0, 4).map(g => (
                <span key={g} className="text-xs bg-[#1A1A1A] border border-[#3E3E3E] text-[#B3B3B3] rounded-full px-2 py-0.5">{g}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ArtistHeaderSkeleton() {
  return (
    <div className="px-4 pb-2 flex items-end gap-4">
      <Skeleton className="w-24 h-24 rounded-2xl bg-[#1A1A1A] shrink-0" />
      <div className="flex-1 space-y-2 pb-1">
        <Skeleton className="h-7 w-3/4 bg-[#1A1A1A]" />
        <Skeleton className="h-4 w-1/3 bg-[#1A1A1A]" />
        <div className="flex gap-1">
          <Skeleton className="h-5 w-16 bg-[#1A1A1A] rounded-full" />
          <Skeleton className="h-5 w-20 bg-[#1A1A1A] rounded-full" />
        </div>
      </div>
    </div>
  );
}

function SkeletonList({ count, height }: { count: number; height: string }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className={cn(height, "w-full bg-[#1A1A1A] rounded-xl")} />
      ))}
    </div>
  );
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-[#444]">
      {icon}
      <p className="mt-3 text-sm">{text}</p>
    </div>
  );
}

function ThreadTypeBadge({ type }: { type: string }) {
  const labels: Record<string, string> = {
    live_show_review: "Show Review", album_review: "Album Review",
    topic: "Topic", new_music: "New Music", listening_now: "Listening Now",
  };
  const colors: Record<string, string> = {
    live_show_review: "bg-blue-900/40 text-blue-300",
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
