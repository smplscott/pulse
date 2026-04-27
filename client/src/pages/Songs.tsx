import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "wouter";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import { Song } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { SearchIcon, Plus, Music2, Bookmark, Smile, MessageCircle } from "lucide-react";
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
  const { toast } = useToast();

  const { data: songs, isLoading } = useQuery<Song[]>({
    queryKey: ["/api/songs"],
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
    onError: (err: any) => {
      toast({ title: "Failed to add song", description: err.message, variant: "destructive" });
    },
  });

  const filteredSongs = songs?.filter(song => {
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
            className="w-9 h-9 rounded-full bg-[#5271ff] flex items-center justify-center hover:bg-[#4a63e8] transition"
          >
            <Plus className="h-5 w-5 text-white" />
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
                  ? "bg-[#5271ff] text-white"
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
            ? filteredSongs.map(song => (
                <Link key={song.id} href={`/song/${song.id}`}>
                  <div className="flex items-center gap-3 p-3 bg-[#1a1a1a] rounded-lg hover:bg-[#282828] transition-colors cursor-pointer">
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
                        {Array.isArray(song.features) && (song.features as string[]).length > 0
                          ? `${song.artist}, ${(song.features as string[]).join(", ")}`
                          : song.artist}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={e => { e.preventDefault(); e.stopPropagation(); toast({ title: "Saved", description: `Saved "${song.title}"` }); }}
                        className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#3E3E3E] transition"
                      >
                        <Bookmark className="h-4 w-4 text-[#B3B3B3]" />
                      </button>
                      <button
                        onClick={e => { e.preventDefault(); e.stopPropagation(); toast({ title: "Reacted!", description: `Reacted to "${song.title}"` }); }}
                        className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#3E3E3E] transition"
                      >
                        <Smile className="h-4 w-4 text-[#B3B3B3]" />
                      </button>
                    </div>
                  </div>
                </Link>
              ))
            : (
              <div className="text-center py-12 text-[#666]">
                <Music2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">{searchQuery ? "No songs match your search" : "No songs yet"}</p>
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
