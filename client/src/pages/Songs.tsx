import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "wouter";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import { Song } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { SearchIcon, Plus, Music2, Bookmark, Smile, Compass, UserCheck, BookmarkCheck } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

const GENRES = ["All", "Electronic", "House", "Techno", "Rock", "Pop", "R&B", "Hip Hop", "Jazz", "World"];

const addSongSchema = z.object({
  spotifyUrl: z.string().url("Must be a valid Spotify URL").refine(v => v.includes("spotify.com"), "Must be a Spotify link"),
});
type AddSongValues = z.infer<typeof addSongSchema>;

export default function Songs() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [showAdd, setShowAdd] = useState(false);
  const [tab, setTab] = useState<"following" | "discover">("following");
  const { toast } = useToast();

  const { data: followedSongs, isLoading: isLoadingFollowed } = useQuery<Song[]>({
    queryKey: ["/api/users/me/followed-songs"],
  });

  const { data: allSongs, isLoading: isLoadingAll } = useQuery<Song[]>({
    queryKey: ["/api/songs"],
    enabled: tab === "discover",
  });

  const saveMutation = useMutation({
    mutationFn: (songId: number) => apiRequest("POST", `/api/users/me/followed-songs/${songId}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/me/followed-songs"] });
      toast({ title: "Saved!", description: "Song added to your library." });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Please try again.";
      toast({ title: "Error", description: message, variant: "destructive" });
    },
  });

  const unsaveMutation = useMutation({
    mutationFn: (songId: number) => apiRequest("DELETE", `/api/users/me/followed-songs/${songId}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/me/followed-songs"] });
      toast({ title: "Removed", description: "Song removed from your library." });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Please try again.";
      toast({ title: "Error", description: message, variant: "destructive" });
    },
  });

  const form = useForm<AddSongValues>({
    resolver: zodResolver(addSongSchema),
    defaultValues: { spotifyUrl: "" },
  });

  const addMutation = useMutation({
    mutationFn: (values: AddSongValues) => {
      const trackId = values.spotifyUrl.split("/track/")[1]?.split("?")[0] || "";
      return apiRequest("POST", "/api/songs", {
        title: `Track ${trackId.slice(0, 6)}`,
        artist: "Unknown Artist",
        streamingLinks: { spotify: values.spotifyUrl },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/songs"] });
      setShowAdd(false);
      form.reset();
      toast({ title: "Song added!", description: "The song stub has been created." });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Please try again.";
      toast({ title: "Failed to add song", description: message, variant: "destructive" });
    },
  });

  const savedIds = new Set((followedSongs ?? []).map(s => s.id));
  const sourceList = tab === "following" ? followedSongs : allSongs;
  const isLoading = tab === "following" ? isLoadingFollowed : isLoadingAll;

  const filteredSongs = sourceList?.filter(song => {
    const matchesSearch =
      searchQuery === "" ||
      song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      song.artist.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGenre =
      selectedGenre === "All" ||
      (song.genre && song.genre.toLowerCase().includes(selectedGenre.toLowerCase()));
    return matchesSearch && matchesGenre;
  });

  return (
    <div className="min-h-screen bg-black text-white pb-32">
      <Header />

      <main className="px-4 pt-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Songs</h1>
          <button
            onClick={() => setShowAdd(true)}
            className="w-9 h-9 rounded-full green-gradient flex items-center justify-center hover:opacity-90 transition"
          >
            <Plus className="h-5 w-5 text-black" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 bg-[#1a1a1a] rounded-lg p-1">
          <button
            onClick={() => setTab("following")}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-medium transition",
              tab === "following" ? "pink-gradient text-white" : "text-[#B3B3B3] hover:text-white"
            )}
          >
            <UserCheck className="h-3.5 w-3.5" />
            My Library
          </button>
          <button
            onClick={() => setTab("discover")}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-medium transition",
              tab === "discover" ? "pink-gradient text-white" : "text-[#B3B3B3] hover:text-white"
            )}
          >
            <Compass className="h-3.5 w-3.5" />
            Discover
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Search songs or artists..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10 bg-[#1a1a1a] border-[#333] text-white placeholder-gray-400"
          />
        </div>

        {/* Genre filter */}
        <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide mb-4">
          {GENRES.map(g => (
            <button
              key={g}
              onClick={() => setSelectedGenre(g)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition",
                selectedGenre === g
                  ? "pink-gradient text-white"
                  : "bg-[#1a1a1a] border border-[#333] text-[#B3B3B3] hover:text-white"
              )}
            >
              {g}
            </button>
          ))}
        </div>

        {/* Songs list */}
        <div className="space-y-2 pb-4">
          {isLoading
            ? [1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 w-full rounded-lg" />)
            : filteredSongs && filteredSongs.length > 0
            ? filteredSongs.map(song => {
                const isSaved = savedIds.has(song.id);
                return (
                  <div key={song.id} className="flex items-center gap-3 p-3 bg-[#1a1a1a] rounded-lg hover:bg-[#282828] transition-colors">
                    <Link href={`/song/${song.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-[#282828]">
                        {song.albumArt ? (
                          <img src={song.albumArt} alt={song.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Music2 className="h-6 w-6 text-[#B3B3B3]" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{song.title}</p>
                        <p className="text-xs text-[#B3B3B3] truncate">
                          {Array.isArray(song.features) && song.features.length > 0
                            ? `${song.artist}, ${song.features.join(", ")}`
                            : song.artist}
                        </p>
                      </div>
                    </Link>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={e => {
                          e.preventDefault();
                          e.stopPropagation();
                          isSaved ? unsaveMutation.mutate(song.id) : saveMutation.mutate(song.id);
                        }}
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#3E3E3E] transition",
                          isSaved ? "text-[#b388eb]" : "text-[#B3B3B3]"
                        )}
                        title={isSaved ? "Remove from library" : "Save to library"}
                      >
                        {isSaved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={e => { e.preventDefault(); e.stopPropagation(); toast({ title: "Reacted!", description: `Reacted to "${song.title}"` }); }}
                        className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#3E3E3E] transition text-[#B3B3B3]"
                      >
                        <Smile className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            : (
              <div className="text-center py-12 text-[#666]">
                <Music2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">
                  {searchQuery
                    ? "No songs match your search"
                    : tab === "following"
                    ? "Your library is empty — try Discover"
                    : "No songs yet"}
                </p>
                {tab === "following" && !searchQuery && (
                  <button onClick={() => setTab("discover")} className="mt-3 text-[#b388eb] text-sm hover:underline">
                    Browse all songs
                  </button>
                )}
              </div>
            )}
        </div>
      </main>

      {/* Add Song via Spotify Dialog */}
      <Dialog open={showAdd} onOpenChange={(open) => { if (!open) { setShowAdd(false); form.reset(); } }}>
        <DialogContent className="bg-[#1a1a1a] border-[#3E3E3E] text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Add Song via Spotify</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[#B3B3B3]">Paste a Spotify track link to add the song to the platform.</p>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(v => addMutation.mutate(v))} className="space-y-4">
              <FormField
                control={form.control}
                name="spotifyUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#B3B3B3]">Spotify Track URL</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="https://open.spotify.com/track/..." className="bg-[#282828] border-[#3E3E3E] text-white" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={addMutation.isPending} className="w-full bg-[#1DB954] hover:bg-[#1aa34a] text-black font-semibold">
                {addMutation.isPending ? "Adding..." : "Add Song"}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}
