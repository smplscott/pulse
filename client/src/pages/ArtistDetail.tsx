import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import { Artist, Song, Thread } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, Music2, ExternalLink, CheckCircle, MessageCircle, Bookmark, Smile } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const COUNTRY_EMOJIS: Record<string, string> = {
  US: "🇺🇸", GB: "🇬🇧", DE: "🇩🇪", FR: "🇫🇷", CA: "🇨🇦", AU: "🇦🇺",
  JP: "🇯🇵", KR: "🇰🇷", BR: "🇧🇷", NG: "🇳🇬", SE: "🇸🇪", NL: "🇳🇱",
  IT: "🇮🇹", ES: "🇪🇸", ZA: "🇿🇦", MX: "🇲🇽", AR: "🇦🇷",
};

type SimilarArtist = { name: string; genre: string; country: string; verified?: boolean };
type DiscographyItem = { title: string; year: string; type: string; albumArt?: string | null };
type AlbumItem = { title: string; year: string; tracks: number };
type FeaturedItem = { title: string; label: string; year: string };

const MOCK_SIMILAR_ARTISTS: SimilarArtist[] = [
  { name: "Aphex Twin", genre: "Electronic", country: "GB", verified: true },
  { name: "Four Tet", genre: "Electronic", country: "GB", verified: true },
  { name: "Floating Points", genre: "Electronic", country: "GB", verified: false },
];

const MOCK_SINGLES: DiscographyItem[] = [
  { title: "Self Portrait", year: "2024", type: "Single" },
  { title: "Glue", year: "2023", type: "Single" },
  { title: "Meli", year: "2022", type: "EP" },
];

const MOCK_ALBUMS: AlbumItem[] = [
  { title: "Isles", year: "2021", tracks: 10 },
  { title: "Bicep", year: "2017", tracks: 11 },
];

const MOCK_FEATURED: FeaturedItem[] = [
  { title: "Fabric Presents: Bicep", label: "Fabric", year: "2018" },
  { title: "Resident Advisor Podcast 478", label: "RA", year: "2016" },
];

export default function ArtistDetail() {
  const { id } = useParams<{ id: string }>();
  const artistId = parseInt(id);
  const { toast } = useToast();

  const { data: artist, isLoading } = useQuery<Artist>({
    queryKey: [`/api/artists/${artistId}`],
    enabled: !isNaN(artistId),
  });

  const { data: songs } = useQuery<Song[]>({
    queryKey: [`/api/songs/artist/${artist?.name}`],
    enabled: !!artist?.name,
  });

  const { data: threads } = useQuery<Thread[]>({
    queryKey: ["/api/threads"],
  });

  const artistThreads = threads?.filter(t => t.artistId === artistId).slice(0, 3);

  const countryEmoji = artist?.firstDiscoveredIn
    ? COUNTRY_EMOJIS[artist.firstDiscoveredIn] || "🌍"
    : null;

  const streamingLinks = Array.isArray(artist?.streamingLinks)
    ? (artist!.streamingLinks as { platform: string; url: string }[])
    : [];

  const singlesEPs: DiscographyItem[] = songs && songs.length > 0
    ? songs.map(s => ({
        title: s.title,
        year: s.releaseDate ? new Date(s.releaseDate).getFullYear().toString() : "—",
        type: "Single",
        albumArt: s.albumArt,
      }))
    : MOCK_SINGLES;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white pb-32">
        <Header />
        <div className="px-4 pt-4 space-y-4">
          <Skeleton className="h-6 w-32" />
          <div className="flex gap-4">
            <Skeleton className="w-20 h-20 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-7 w-40" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-24 rounded-full" />
            </div>
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
        </div>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#B3B3B3] mb-4">Artist not found</p>
          <Link href="/artists"><button className="text-[#5271ff] hover:underline">← Back to Artists</button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pb-32">
      <Header />

      <div className="sticky top-0 z-30 bg-black/90 backdrop-blur px-4 py-3 flex items-center gap-3 border-b border-[#222]">
        <Link href="/artists">
          <button className="text-[#B3B3B3] hover:text-white transition">
            <ChevronLeft className="h-6 w-6" />
          </button>
        </Link>
        <span className="font-semibold truncate">{artist.name}</span>
      </div>

      <div className="px-4 py-5 space-y-7">
        {/* Artist card */}
        <div className="flex items-start gap-4">
          <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-[#282828]">
            {artist.profilePicture ? (
              <img src={artist.profilePicture} alt={artist.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Music2 className="h-10 w-10 text-[#B3B3B3]" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h1 className="text-2xl font-bold">{artist.name}</h1>
              {artist.verified && (
                <CheckCircle className="h-5 w-5 text-[#5271ff] flex-shrink-0" />
              )}
            </div>
            {countryEmoji && artist.firstDiscoveredIn && (
              <p className="text-sm text-[#B3B3B3] mb-2">
                {countryEmoji} {artist.firstDiscoveredIn}
              </p>
            )}
            <div className="flex flex-wrap gap-1 mb-3">
              {(artist.genres as string[] || []).map((g, i) => (
                <span key={i} className="text-xs bg-[#282828] text-[#B3B3B3] px-2 py-0.5 rounded-full">{g}</span>
              ))}
            </div>
            {streamingLinks.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {streamingLinks.map((link, i) => (
                  <a
                    key={i}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs bg-[#282828] hover:bg-[#3E3E3E] text-[#B3B3B3] hover:text-white px-2 py-1 rounded transition"
                  >
                    {link.platform}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bio */}
        {artist.story && (
          <div>
            <h2 className="text-base font-semibold mb-2">About</h2>
            <p className="text-sm text-[#B3B3B3] leading-relaxed">{artist.story}</p>
          </div>
        )}

        {/* Threads */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold">Threads</h2>
            <Link href="/threads">
              <button className="text-xs text-[#5271ff] hover:underline">See all</button>
            </Link>
          </div>
          {artistThreads && artistThreads.length > 0 ? (
            <div className="space-y-2">
              {artistThreads.map(t => (
                <Link key={t.id} href={`/thread/${t.id}`}>
                  <div className="bg-[#1a1a1a] hover:bg-[#222] rounded-lg p-3 cursor-pointer transition">
                    <p className="text-sm font-medium mb-1 line-clamp-1">{t.title}</p>
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
              <p className="text-sm text-[#666]">No threads yet for this artist.</p>
            </div>
          )}
        </div>

        {/* Similar Artists */}
        <div>
          <h2 className="text-base font-semibold mb-3">Similar Artists</h2>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {MOCK_SIMILAR_ARTISTS.filter(a => a.verified).map((a, i) => (
              <div key={i} className="flex-shrink-0 w-28 bg-[#1a1a1a] rounded-lg p-3 text-center">
                <div className="w-14 h-14 rounded-full bg-[#282828] mx-auto mb-2 flex items-center justify-center">
                  <Music2 className="h-7 w-7 text-[#B3B3B3]" />
                </div>
                <div className="flex items-center justify-center gap-1 mb-0.5">
                  <p className="text-xs font-medium truncate">{a.name}</p>
                  {a.verified && <CheckCircle className="h-3 w-3 text-[#5271ff] flex-shrink-0" />}
                </div>
                <p className="text-xs text-[#666] mb-2">{COUNTRY_EMOJIS[a.country] || ""} {a.genre}</p>
                <div className="flex items-center justify-center gap-1">
                  <button
                    onClick={() => toast({ title: "Saved", description: `${a.name} added to your artists` })}
                    className="w-6 h-6 flex items-center justify-center rounded-full bg-[#282828] hover:bg-[#3E3E3E] transition"
                  >
                    <Bookmark className="h-3 w-3 text-[#B3B3B3]" />
                  </button>
                  <button
                    onClick={() => toast({ title: "Comments", description: `Open thread for ${a.name}` })}
                    className="w-6 h-6 flex items-center justify-center rounded-full bg-[#282828] hover:bg-[#3E3E3E] transition"
                  >
                    <MessageCircle className="h-3 w-3 text-[#B3B3B3]" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Singles & EPs */}
        <div>
          <h2 className="text-base font-semibold mb-3">Singles & EPs</h2>
          <div className="space-y-2">
            {singlesEPs.map((s, i) => (
              <div key={i} className="flex items-center gap-3 bg-[#1a1a1a] rounded-lg p-3">
                <div className="w-10 h-10 rounded bg-[#282828] flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {s.albumArt ? (
                    <img src={s.albumArt} alt={s.title} className="w-full h-full object-cover" />
                  ) : (
                    <Music2 className="h-5 w-5 text-[#B3B3B3]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{s.title}</p>
                  <p className="text-xs text-[#666]">{s.year} · {s.type}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => toast({ title: "Saved", description: `"${s.title}" added to library` })}
                    className="w-7 h-7 flex items-center justify-center rounded-full bg-[#282828] hover:bg-[#3E3E3E] transition"
                  >
                    <Bookmark className="h-3.5 w-3.5 text-[#B3B3B3]" />
                  </button>
                  <button
                    onClick={() => toast({ title: "React", description: `Reacted to "${s.title}"` })}
                    className="w-7 h-7 flex items-center justify-center rounded-full bg-[#282828] hover:bg-[#3E3E3E] transition"
                  >
                    <Smile className="h-3.5 w-3.5 text-[#B3B3B3]" />
                  </button>
                  <button
                    onClick={() => toast({ title: "Comment", description: `Open thread for "${s.title}"` })}
                    className="w-7 h-7 flex items-center justify-center rounded-full bg-[#282828] hover:bg-[#3E3E3E] transition"
                  >
                    <MessageCircle className="h-3.5 w-3.5 text-[#B3B3B3]" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Albums */}
        <div>
          <h2 className="text-base font-semibold mb-3">Albums</h2>
          <div className="space-y-2">
            {MOCK_ALBUMS.map((a, i) => (
              <div key={i} className="flex items-center gap-3 bg-[#1a1a1a] rounded-lg p-3">
                <div className="w-10 h-10 rounded bg-[#282828] flex items-center justify-center flex-shrink-0">
                  <Music2 className="h-5 w-5 text-[#B3B3B3]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{a.title}</p>
                  <p className="text-xs text-[#666]">{a.year} · {a.tracks} tracks</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => toast({ title: "Saved", description: `"${a.title}" added to library` })}
                    className="w-7 h-7 flex items-center justify-center rounded-full bg-[#282828] hover:bg-[#3E3E3E] transition"
                  >
                    <Bookmark className="h-3.5 w-3.5 text-[#B3B3B3]" />
                  </button>
                  <button
                    onClick={() => toast({ title: "Comment", description: `Open thread for "${a.title}"` })}
                    className="w-7 h-7 flex items-center justify-center rounded-full bg-[#282828] hover:bg-[#3E3E3E] transition"
                  >
                    <MessageCircle className="h-3.5 w-3.5 text-[#B3B3B3]" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Featured On */}
        <div>
          <h2 className="text-base font-semibold mb-3">Featured On</h2>
          <div className="space-y-2">
            {MOCK_FEATURED.map((f, i) => (
              <div key={i} className="flex items-center gap-3 bg-[#1a1a1a] rounded-lg p-3">
                <div className="w-10 h-10 rounded bg-[#282828] flex items-center justify-center flex-shrink-0">
                  <Music2 className="h-5 w-5 text-[#B3B3B3]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{f.title}</p>
                  <p className="text-xs text-[#666]">{f.label} · {f.year}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => toast({ title: "Saved", description: `"${f.title}" saved` })}
                    className="w-7 h-7 flex items-center justify-center rounded-full bg-[#282828] hover:bg-[#3E3E3E] transition"
                  >
                    <Bookmark className="h-3.5 w-3.5 text-[#B3B3B3]" />
                  </button>
                  <button
                    onClick={() => toast({ title: "Comment", description: `Open thread for "${f.title}"` })}
                    className="w-7 h-7 flex items-center justify-center rounded-full bg-[#282828] hover:bg-[#3E3E3E] transition"
                  >
                    <MessageCircle className="h-3.5 w-3.5 text-[#B3B3B3]" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
