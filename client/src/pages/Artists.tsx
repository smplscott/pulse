import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "wouter";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import { Artist } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { SearchIcon, Plus, CheckCircle, Music2, UserCheck, Compass, UserPlus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

const GENRES = ["All", "Electronic", "House", "Techno", "Rock", "Pop", "R&B", "Hip Hop", "Jazz"];

const addArtistSchema = z.object({
  spotifyUrl: z.string().url("Must be a valid Spotify URL").refine(v => v.includes("spotify.com"), "Must be a Spotify link"),
});
type AddArtistValues = z.infer<typeof addArtistSchema>;

const COUNTRY_EMOJIS: Record<string, string> = {
  US: "🇺🇸", GB: "🇬🇧", DE: "🇩🇪", FR: "🇫🇷", CA: "🇨🇦", AU: "🇦🇺",
  JP: "🇯🇵", KR: "🇰🇷", BR: "🇧🇷", NG: "🇳🇬", SE: "🇸🇪", NL: "🇳🇱",
};

export default function Artists() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [showAdd, setShowAdd] = useState(false);
  const [tab, setTab] = useState<"following" | "discover">("following");
  const { toast } = useToast();

  const { data: followedArtists, isLoading: isLoadingFollowed } = useQuery<Artist[]>({
    queryKey: ["/api/users/me/followed-artists"],
  });

  const { data: allArtists, isLoading: isLoadingAll } = useQuery<Artist[]>({
    queryKey: ["/api/artists"],
    enabled: tab === "discover",
  });

  const followMutation = useMutation({
    mutationFn: (artistId: number) => apiRequest("POST", `/api/users/me/followed-artists/${artistId}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/me/followed-artists"] });
      toast({ title: "Following!", description: "Artist added to your following list." });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Please try again.";
      toast({ title: "Error", description: message, variant: "destructive" });
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: (artistId: number) => apiRequest("DELETE", `/api/users/me/followed-artists/${artistId}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/me/followed-artists"] });
      toast({ title: "Unfollowed", description: "Artist removed from your following list." });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Please try again.";
      toast({ title: "Error", description: message, variant: "destructive" });
    },
  });

  const form = useForm<AddArtistValues>({
    resolver: zodResolver(addArtistSchema),
    defaultValues: { spotifyUrl: "" },
  });

  const addMutation = useMutation({
    mutationFn: (values: AddArtistValues) => {
      const nameFromUrl = values.spotifyUrl.split("/").pop()?.split("?")[0] || "Unknown Artist";
      return apiRequest("POST", "/api/artists", {
        name: decodeURIComponent(nameFromUrl.replace(/-/g, " ")),
        streamingLinks: [{ platform: "Spotify", url: values.spotifyUrl }],
        genres: [],
        verified: false,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/artists"] });
      setShowAdd(false);
      form.reset();
      toast({ title: "Artist added!", description: "The artist stub has been created." });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Please try again.";
      toast({ title: "Failed to add artist", description: message, variant: "destructive" });
    },
  });

  const followedIds = new Set((followedArtists ?? []).map(a => a.id));
  const sourceList = tab === "following" ? followedArtists : allArtists;
  const isLoading = tab === "following" ? isLoadingFollowed : isLoadingAll;

  const filteredArtists = sourceList?.filter(artist => {
    const matchesSearch =
      searchQuery === "" ||
      artist.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGenre =
      selectedGenre === "All" ||
      (Array.isArray(artist.genres) && (artist.genres as string[]).some(g =>
        g.toLowerCase().includes(selectedGenre.toLowerCase())
      ));
    return matchesSearch && matchesGenre;
  });

  return (
    <div className="min-h-screen bg-black text-white pb-32">
      <Header />

      <main className="px-4 pt-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Artists</h1>
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
            Following
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
            placeholder="Search artists..."
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

        {/* Artists list */}
        <div className="space-y-2 pb-4">
          {isLoading
            ? [1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 w-full rounded-lg" />)
            : filteredArtists && filteredArtists.length > 0
            ? filteredArtists.map(artist => {
                const isFollowing = followedIds.has(artist.id);
                return (
                  <div key={artist.id} className="flex items-center gap-3 p-3 bg-[#1a1a1a] rounded-lg hover:bg-[#282828] transition-colors">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-[#282828]">
                        {artist.profilePicture ? (
                          <img src={artist.profilePicture} alt={artist.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Music2 className="h-6 w-6 text-[#B3B3B3]" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-semibold text-white truncate">{artist.name}</h3>
                          {artist.verified && <CheckCircle className="h-3.5 w-3.5 text-[#b388eb] flex-shrink-0" />}
                        </div>
                        <p className="text-xs text-[#B3B3B3] truncate">
                          {artist.firstDiscoveredIn ? `${COUNTRY_EMOJIS[artist.firstDiscoveredIn] || "🌍"} ${artist.firstDiscoveredIn} · ` : ""}
                          {(artist.genres as string[] || []).slice(0, 2).join(", ") || "Artist"}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => isFollowing ? unfollowMutation.mutate(artist.id) : followMutation.mutate(artist.id)}
                      className={cn(
                        "flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition",
                        isFollowing
                          ? "bg-[#2a2a2a] border border-[#444] text-[#B3B3B3] hover:border-red-500 hover:text-red-400"
                          : "green-gradient text-black hover:opacity-90"
                      )}
                    >
                      {isFollowing ? "Following" : <span className="flex items-center gap-1"><UserPlus className="h-3 w-3" />Follow</span>}
                    </button>
                  </div>
                );
              })
            : (
              <div className="text-center py-12 text-[#666]">
                <Music2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">
                  {searchQuery
                    ? "No artists match your search"
                    : tab === "following"
                    ? "You're not following any artists yet — try Discover"
                    : "No artists yet"}
                </p>
                {tab === "following" && !searchQuery && (
                  <button onClick={() => setTab("discover")} className="mt-3 text-[#b388eb] text-sm hover:underline">
                    Browse all artists
                  </button>
                )}
              </div>
            )}
        </div>
      </main>

      {/* Add Artist via Spotify Dialog */}
      <Dialog open={showAdd} onOpenChange={(open) => { if (!open) { setShowAdd(false); form.reset(); } }}>
        <DialogContent className="bg-[#1a1a1a] border-[#3E3E3E] text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Add Artist via Spotify</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[#B3B3B3]">Paste an artist's Spotify link to create a stub profile.</p>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(v => addMutation.mutate(v))} className="space-y-4">
              <FormField
                control={form.control}
                name="spotifyUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#B3B3B3]">Spotify Artist URL</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="https://open.spotify.com/artist/..." className="bg-[#282828] border-[#3E3E3E] text-white" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={addMutation.isPending} className="w-full bg-[#1DB954] hover:bg-[#1aa34a] text-black font-semibold">
                {addMutation.isPending ? "Adding..." : "Add Artist"}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}
