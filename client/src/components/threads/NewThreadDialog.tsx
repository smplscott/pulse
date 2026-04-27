import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Song, Artist } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { SearchIcon, Music2Icon, MicVocalIcon, X, Star, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

type ThreadType = "new_music" | "listening_now" | "live_show_review" | "topic";

interface ThreadTypeOption {
  id: ThreadType;
  label: string;
  description: string;
  requiresSearch: boolean;
  color: string;
  bgColor: string;
}

const THREAD_TYPES: ThreadTypeOption[] = [
  { id: "new_music", label: "New Music / Discoveries", description: "Share new finds & music you've discovered", requiresSearch: true, color: "text-[#c2f970]", bgColor: "bg-[#c2f970]/10 border-[#c2f970]/30" },
  { id: "listening_now", label: "Listening Right Now", description: "What are you listening to at this moment?", requiresSearch: true, color: "text-blue-400", bgColor: "bg-blue-500/10 border-blue-500/30" },
  { id: "live_show_review", label: "Live Show Review", description: "Review a live performance or set", requiresSearch: false, color: "text-orange-400", bgColor: "bg-orange-500/10 border-orange-500/30" },
  { id: "topic", label: "Topic", description: "Start a general music discussion", requiresSearch: false, color: "text-purple-400", bgColor: "bg-purple-500/10 border-purple-500/30" },
];

const formSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(200),
  content: z.string().min(1, "Please add some details").max(2000),
  starRating: z.number().int().min(1).max(5).optional().nullable(),
});

type FormValues = z.infer<typeof formSchema>;

type SearchResult = { type: "song"; item: Song } | { type: "artist"; item: Artist };

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function NewThreadDialog({ open, onOpenChange }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState<"type" | "search" | "form">("type");
  const [selectedType, setSelectedType] = useState<ThreadTypeOption | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [starRating, setStarRating] = useState(0);

  const { data: searchResults, isLoading: isSearching } = useQuery<{ artists: Artist[]; songs: Song[] }>({
    queryKey: ["/api/search", searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return { artists: [], songs: [] };
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      return res.json();
    },
    enabled: searchQuery.trim().length > 1,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { title: "", content: "", starRating: null },
  });

  const createThread = useMutation({
    mutationFn: (data: FormValues) => {
      const payload = {
        title: data.title,
        content: data.content,
        threadType: selectedType!.id,
        type: "discussion",
        starRating: selectedType?.id === "live_show_review" ? starRating || null : null,
        songId: selectedResult?.type === "song" ? (selectedResult.item as Song).id : null,
        artistId: selectedResult?.type === "artist" ? (selectedResult.item as Artist).id : null,
      };
      return apiRequest("POST", "/api/threads", payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/threads/featured"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/threads"] });
      if (user) {
        await queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}/threads/engaged`] });
      }
      toast({ title: "Thread created!", description: "Your thread has been posted." });
      handleClose();
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Failed to create thread";
      toast({ title: "Error", description: msg, variant: "destructive" });
    },
  });

  function handleClose() {
    setStep("type");
    setSelectedType(null);
    setSearchQuery("");
    setSelectedResult(null);
    setStarRating(0);
    form.reset();
    onOpenChange(false);
  }

  function handleTypeSelect(type: ThreadTypeOption) {
    setSelectedType(type);
    if (type.requiresSearch) {
      setStep("search");
    } else {
      setStep("form");
    }
  }

  function handleSelectResult(result: SearchResult) {
    setSelectedResult(result);
    setStep("form");
  }

  function handleSkipSearch() {
    setSelectedResult(null);
    setStep("form");
  }

  function onSubmit(values: FormValues) {
    if (!user) return;
    createThread.mutate(values);
  }

  const allResults: SearchResult[] = [
    ...((searchResults?.songs || []).map(s => ({ type: "song" as const, item: s }))),
    ...((searchResults?.artists || []).map(a => ({ type: "artist" as const, item: a }))),
  ];

  const stepTitle = step === "type" ? "New Thread" : step === "search" ? "Link a Song or Artist" : "Create Thread";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-[#1a1a1a] border-[#3E3E3E] text-white max-w-md w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {step !== "type" && (
              <button
                onClick={() => setStep(step === "form" && selectedType?.requiresSearch ? "search" : "type")}
                className="p-1 hover:bg-[#282828] rounded-lg transition-colors"
              >
                <ChevronLeft className="h-5 w-5 text-[#B3B3B3]" />
              </button>
            )}
            <DialogTitle className="text-white font-bold text-lg">{stepTitle}</DialogTitle>
          </div>
        </DialogHeader>

        {step === "type" && (
          <div className="space-y-2 pt-2">
            <p className="text-sm text-[#B3B3B3] mb-4">What kind of thread do you want to start?</p>
            {THREAD_TYPES.map((type) => (
              <button
                key={type.id}
                className={cn(
                  "w-full text-left p-4 rounded-xl border transition-all hover:border-opacity-60",
                  type.bgColor
                )}
                onClick={() => handleTypeSelect(type)}
              >
                <p className={cn("font-semibold text-sm", type.color)}>{type.label}</p>
                <p className="text-xs text-[#B3B3B3] mt-0.5">{type.description}</p>
              </button>
            ))}
          </div>
        )}

        {step === "search" && (
          <div className="pt-2">
            <p className="text-sm text-[#B3B3B3] mb-3">Search for the song or artist you want to discuss.</p>

            <div className="relative mb-4">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B3B3B3] h-4 w-4" />
              <Input
                autoFocus
                placeholder="Search songs & artists..."
                className="pl-9 bg-[#282828] border-[#3E3E3E] text-white placeholder:text-[#B3B3B3]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {isSearching && (
              <div className="text-center py-4">
                <div className="w-5 h-5 border-2 border-[#c2f970] border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            )}

            {!isSearching && allResults.length > 0 && (
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {allResults.map((result, i) => (
                  <button
                    key={i}
                    className="w-full text-left flex items-center gap-3 p-3 rounded-lg hover:bg-[#282828] transition-colors"
                    onClick={() => handleSelectResult(result)}
                  >
                    <div className="w-9 h-9 rounded-lg bg-[#3E3E3E] flex items-center justify-center flex-shrink-0">
                      {result.type === "song"
                        ? <Music2Icon className="h-4 w-4 text-[#B3B3B3]" />
                        : <MicVocalIcon className="h-4 w-4 text-[#B3B3B3]" />
                      }
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {result.type === "song" ? (result.item as Song).title : (result.item as Artist).name}
                      </p>
                      <p className="text-xs text-[#B3B3B3] truncate">
                        {result.type === "song" ? (result.item as Song).artist : "Artist"}
                      </p>
                    </div>
                    <span className="ml-auto text-xs text-[#B3B3B3] flex-shrink-0">
                      {result.type === "song" ? "Song" : "Artist"}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {!isSearching && searchQuery.length > 1 && allResults.length === 0 && (
              <p className="text-sm text-[#B3B3B3] text-center py-4">No results found</p>
            )}

            <button
              className="w-full mt-4 py-2 text-sm text-[#B3B3B3] hover:text-white transition-colors underline underline-offset-2"
              onClick={handleSkipSearch}
            >
              Skip — continue without linking
            </button>
          </div>
        )}

        {step === "form" && (
          <div className="pt-2">
            {selectedType && (
              <div className="flex items-center gap-2 mb-4">
                <span className={cn("text-xs font-medium px-2 py-1 rounded-full border", selectedType.bgColor, selectedType.color)}>
                  {selectedType.label}
                </span>
                {selectedResult && (
                  <div className="flex items-center gap-1.5 bg-[#282828] rounded-full px-2 py-1">
                    {selectedResult.type === "song"
                      ? <Music2Icon className="h-3 w-3 text-[#B3B3B3]" />
                      : <MicVocalIcon className="h-3 w-3 text-[#B3B3B3]" />
                    }
                    <span className="text-xs text-white truncate max-w-[140px]">
                      {selectedResult.type === "song"
                        ? (selectedResult.item as Song).title
                        : (selectedResult.item as Artist).name
                      }
                    </span>
                    <button onClick={() => setSelectedResult(null)}>
                      <X className="h-3 w-3 text-[#B3B3B3] hover:text-white" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {selectedType?.id === "live_show_review" && (
              <div className="mb-4">
                <p className="text-sm text-[#B3B3B3] mb-2">Your rating</p>
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <button
                      key={i}
                      onMouseEnter={() => setHoveredStar(i + 1)}
                      onMouseLeave={() => setHoveredStar(0)}
                      onClick={() => setStarRating(i + 1)}
                    >
                      <Star
                        className={cn(
                          "h-7 w-7 transition-colors",
                          (hoveredStar || starRating) > i
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-[#3E3E3E]"
                        )}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#B3B3B3] text-sm">Title</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Give your thread a title..."
                          className="bg-[#282828] border-[#3E3E3E] text-white placeholder:text-[#B3B3B3]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#B3B3B3] text-sm">Details</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="What's on your mind? Share your thoughts..."
                          className="bg-[#282828] border-[#3E3E3E] text-white placeholder:text-[#B3B3B3] min-h-[100px] resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full bg-[#c2f970] text-black font-semibold hover:bg-[#aee05a] transition-colors"
                  disabled={createThread.isPending}
                >
                  {createThread.isPending ? "Posting..." : "Post Thread"}
                </Button>
              </form>
            </Form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
