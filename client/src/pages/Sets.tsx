import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { useState } from "react";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import { MusicSet } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { SearchIcon, Plus, Heart, Music2, ListMusic } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

const GENRES = ["All", "Electronic", "House", "Techno", "Trance", "Drum & Bass", "R&B", "Hip Hop", "Pop", "Rock", "Jazz"];

const createSetSchema = z.object({
  title: z.string().min(2, "Name must be at least 2 characters"),
  city: z.string().optional(),
  country: z.string().optional(),
  eventDate: z.string().optional(),
  streamingLink: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  genres: z.array(z.string()).default([]),
});
type CreateSetValues = z.infer<typeof createSetSchema>;

export default function Sets() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [showCreate, setShowCreate] = useState(false);
  const { toast } = useToast();

  const { data: sets, isLoading } = useQuery<MusicSet[]>({
    queryKey: ["/api/sets"],
  });

  const form = useForm<CreateSetValues>({
    resolver: zodResolver(createSetSchema),
    defaultValues: { title: "", city: "", country: "", eventDate: "", streamingLink: "", genres: [] },
  });

  const createMutation = useMutation({
    mutationFn: (values: CreateSetValues) =>
      apiRequest("POST", "/api/sets", {
        ...values,
        streamingLink: values.streamingLink || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sets"] });
      setShowCreate(false);
      form.reset();
      toast({ title: "Set created!", description: "Your set is now live." });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Please try again.";
      toast({ title: "Failed to create set", description: message, variant: "destructive" });
    },
  });

  const filteredSets = sets?.filter(set => {
    const matchesSearch =
      set.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      set.curator.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGenre =
      selectedGenre === "All" ||
      (Array.isArray(set.genres) && (set.genres as string[]).some(g =>
        g.toLowerCase().includes(selectedGenre.toLowerCase())
      ));
    return matchesSearch && matchesGenre;
  }) || [];

  return (
    <div className="min-h-screen bg-black text-white pb-32">
      <Header />

      <main className="px-4 pb-20">
        <div className="py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">Sets</h1>
            <button
              onClick={() => setShowCreate(true)}
              className="w-9 h-9 rounded-full green-gradient flex items-center justify-center hover:opacity-90 transition"
            >
              <Plus className="h-5 w-5 text-white" />
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search sets or curators..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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

          {/* Sets list */}
          <div className="space-y-3">
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-[#1a1a1a] rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <Skeleton className="h-16 w-16 rounded-lg" />
                      <div className="flex-1">
                        <Skeleton className="h-5 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-1/2 mb-2" />
                        <Skeleton className="h-4 w-1/4" />
                      </div>
                    </div>
                  </div>
                ))
              : filteredSets.map(set => (
                  <Link key={set.id} href={`/sets/${set.id}`}>
                    <div className="bg-[#1a1a1a] rounded-lg p-4 cursor-pointer hover:bg-[#222] transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="h-16 w-16 rounded-lg overflow-hidden flex-shrink-0 bg-[#282828]">
                          {set.image ? (
                            <img src={set.image} alt={set.title} className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <ListMusic className="h-8 w-8 text-[#B3B3B3]" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <div className="min-w-0">
                              <h3 className="font-semibold text-white truncate">{set.title}</h3>
                              <p className="text-xs text-gray-400 mt-0.5">
                                by {set.curator}
                                {set.city && ` · ${set.city}${set.country ? `, ${set.country}` : ""}`}
                              </p>
                            </div>
                            <Badge variant="secondary" className="bg-[#b388eb]/20 text-[#b388eb] text-xs px-2 py-0.5 flex-shrink-0">
                              SET
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-400 mt-2">
                            <span className="flex items-center gap-1">
                              <Heart className="h-3 w-3" />
                              {(set.saves || 0).toLocaleString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <Music2 className="h-3 w-3" />
                              {Array.isArray(set.songs) ? set.songs.length : 0} tracks
                            </span>
                            {set.eventDate && <span>· {set.eventDate}</span>}
                          </div>
                          {Array.isArray(set.genres) && (set.genres as string[]).length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {(set.genres as string[]).slice(0, 3).map((g, i) => (
                                <span key={i} className="text-xs bg-[#282828] px-2 py-0.5 rounded-full text-[#B3B3B3]">
                                  {g}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
          </div>

          {!isLoading && filteredSets.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <Plus className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg">No sets found</p>
              <p className="text-sm mt-1">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      </main>

      {/* Create Set Dialog */}
      <Dialog open={showCreate} onOpenChange={(open) => { if (!open) { setShowCreate(false); form.reset(); } }}>
        <DialogContent className="bg-[#1a1a1a] border-[#3E3E3E] text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Create a Set</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(v => createMutation.mutate(v))} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#B3B3B3]">Set Name *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g. Watergate Berlin May 2025" className="bg-[#282828] border-[#3E3E3E] text-white" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#B3B3B3]">City</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Berlin" className="bg-[#282828] border-[#3E3E3E] text-white" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#B3B3B3]">Country</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Germany" className="bg-[#282828] border-[#3E3E3E] text-white" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="eventDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#B3B3B3]">Date</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" className="bg-[#282828] border-[#3E3E3E] text-white" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="streamingLink"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#B3B3B3]">Link (optional)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="https://soundcloud.com/..." className="bg-[#282828] border-[#3E3E3E] text-white" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                disabled={createMutation.isPending}
                className="w-full green-gradient text-black"
              >
                {createMutation.isPending ? "Creating..." : "Create Set"}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}
