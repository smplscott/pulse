import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import MusicPlayer from "@/components/layout/MusicPlayer";
import { Place } from "@shared/schema";
import { useLocation } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { SearchIcon, MapPin, Star, Plus, Music2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

const GENRE_OPTIONS = [
  "House", "Techno", "Drum & Bass", "Jungle", "Hip-Hop",
  "R&B", "Soul", "Jazz", "Electronic", "Disco", "Funk",
  "Rock", "Indie", "Pop", "Ambient", "Experimental", "All Genres",
];

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "bar", label: "Bars" },
  { id: "club", label: "Clubs" },
  { id: "record_store", label: "Record Stores" },
  { id: "coffee_shop", label: "Coffee Shops" },
  { id: "other", label: "Other" },
];

const addPlaceSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  city: z.string().min(1, "City is required"),
  country: z.string().min(1, "Country is required"),
  category: z.enum(["bar", "club", "record_store", "coffee_shop", "other"]),
  description: z.string().min(10, "Description must be at least 10 characters").max(280, "Max 280 characters"),
  mapsLink: z.string().optional(),
});

type AddPlaceForm = z.infer<typeof addPlaceSchema>;

function categoryLabel(cat: string) {
  return CATEGORIES.find(c => c.id === cat)?.label ?? cat;
}

function PlaceCard({ place }: { place: Place }) {
  const genres = place.genres ?? [];
  const [, navigate] = useLocation();
  return (
    <div className="bg-[#181818] rounded-xl p-4 flex gap-3">
      <div className="w-12 h-12 rounded-lg bg-[#282828] flex items-center justify-center flex-shrink-0 mt-0.5">
        <MapPin className="h-5 w-5 text-[#c2f970]" />
      </div>
      <div className="flex-1 min-w-0">
        <Link href={`/places/${place.id}`}>
          <div className="cursor-pointer">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-semibold text-sm truncate hover:text-[#c2f970] transition-colors">{place.name}</h3>
                <p className="text-xs text-[#B3B3B3] mt-0.5">{place.city}, {place.country}</p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Star className="h-3 w-3 text-[#c2f970] fill-[#c2f970]" />
                <span className="text-xs text-[#B3B3B3]">{place.rating ?? 0}.0</span>
              </div>
            </div>
            <p className="text-xs text-[#B3B3B3] mt-1 line-clamp-2 leading-relaxed">{place.description}</p>
          </div>
        </Link>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#282828] text-[#B3B3B3]">
              {categoryLabel(place.category)}
            </span>
            {genres.slice(0, 2).map(g => (
              <span key={g} className="text-[10px] px-2 py-0.5 rounded-full bg-[#1a2a1a] text-[#c2f970]">
                {g}
              </span>
            ))}
            {genres.length > 2 && (
              <span className="text-[10px] text-[#666]">+{genres.length - 2}</span>
            )}
          </div>
          <button
            onClick={() => navigate(`/places/${place.id}?dropIn=1`)}
            className="text-xs px-3 py-1 rounded-full bg-[#c2f970] text-black font-semibold hover:bg-[#aee05a] transition-colors flex-shrink-0 ml-2"
          >
            Drop In
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Places() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const { toast } = useToast();

  const form = useForm<AddPlaceForm>({
    resolver: zodResolver(addPlaceSchema),
    defaultValues: {
      name: "",
      city: "",
      country: "",
      category: "club",
      description: "",
      mapsLink: "",
    },
  });

  const { data: places, isLoading } = useQuery<Place[]>({
    queryKey: ["/api/places"],
  });

  const addMutation = useMutation({
    mutationFn: (data: AddPlaceForm & { genres: string[] }) =>
      apiRequest("POST", "/api/places", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/places"] });
      toast({ title: "Place added!", description: "Thanks for contributing to the community." });
      setDialogOpen(false);
      form.reset();
      setSelectedGenres([]);
    },
    onError: (err: any) => {
      toast({ title: "Failed to add place", description: err.message, variant: "destructive" });
    },
  });

  const onSubmit = (data: AddPlaceForm) => {
    addMutation.mutate({ ...data, genres: selectedGenres });
  };

  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev =>
      prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]
    );
  };

  const filteredPlaces = places?.filter(p => {
    const matchesSearch = !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.genres as string[])?.some(g => g.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = activeCategory === "all" || p.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen pb-32">
      <Header />

      <main className="px-4 pt-4 pb-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#B3B3B3]" />
            <Input
              placeholder="Search by venue, city, genre..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 bg-[#282828] border-[#3E3E3E] text-white placeholder:text-[#B3B3B3] h-10 text-sm"
            />
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <button className="w-10 h-10 rounded-lg bg-[#c2f970] flex items-center justify-center flex-shrink-0 hover:bg-[#aee05a] transition-colors">
                <Plus className="h-5 w-5 text-black" />
              </button>
            </DialogTrigger>
            <DialogContent className="bg-[#121212] border-[#3E3E3E] text-white max-w-md mx-auto max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold">Add a Place</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-[#B3B3B3]">Venue Name *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g. Fabric, Berghain" className="bg-[#282828] border-[#3E3E3E] text-white placeholder:text-[#555]" />
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
                          <FormLabel className="text-xs text-[#B3B3B3]">City *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="London" className="bg-[#282828] border-[#3E3E3E] text-white placeholder:text-[#555]" />
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
                          <FormLabel className="text-xs text-[#B3B3B3]">Country *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="UK" className="bg-[#282828] border-[#3E3E3E] text-white placeholder:text-[#555]" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-[#B3B3B3]">Category *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-[#282828] border-[#3E3E3E] text-white">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-[#282828] border-[#3E3E3E]">
                            <SelectItem value="bar">Bar</SelectItem>
                            <SelectItem value="club">Club</SelectItem>
                            <SelectItem value="record_store">Record Store</SelectItem>
                            <SelectItem value="coffee_shop">Coffee Shop</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div>
                    <p className="text-xs text-[#B3B3B3] mb-2">Genres (optional)</p>
                    <div className="flex flex-wrap gap-1.5">
                      {GENRE_OPTIONS.map(g => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => toggleGenre(g)}
                          className={cn(
                            "px-2.5 py-1 rounded-full text-xs transition-colors",
                            selectedGenres.includes(g)
                              ? "bg-[#c2f970] text-black font-medium"
                              : "bg-[#282828] text-[#B3B3B3] hover:bg-[#333]"
                          )}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-[#B3B3B3]">Description * <span className="text-[#666]">(10–280 chars)</span></FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="What makes this place worth visiting?"
                            className="bg-[#282828] border-[#3E3E3E] text-white placeholder:text-[#555] min-h-[80px] resize-none"
                            maxLength={280}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="mapsLink"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-[#B3B3B3]">Google Maps Link (optional)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="https://maps.google.com/..." className="bg-[#282828] border-[#3E3E3E] text-white placeholder:text-[#555]" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <button
                    type="submit"
                    disabled={addMutation.isPending}
                    className="w-full bg-[#c2f970] text-black font-semibold py-2.5 rounded-full text-sm hover:bg-[#aee05a] transition-colors disabled:opacity-50"
                  >
                    {addMutation.isPending ? "Adding..." : "Add Place"}
                  </button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 mb-4">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
                activeCategory === cat.id
                  ? "bg-[#c2f970] text-black"
                  : "bg-[#181818] text-[#B3B3B3] border border-[#3E3E3E]"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        ) : filteredPlaces && filteredPlaces.length > 0 ? (
          <div className="space-y-3">
            {filteredPlaces.map(place => (
              <PlaceCard key={place.id} place={place} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-14 h-14 rounded-full bg-[#181818] flex items-center justify-center mx-auto mb-3">
              <MapPin className="h-6 w-6 text-[#555]" />
            </div>
            <p className="text-[#B3B3B3] text-sm">
              {searchQuery || activeCategory !== "all" ? "No places found" : "No places yet — be the first to add one"}
            </p>
          </div>
        )}
      </main>

      <MusicPlayer />
      <BottomNav />
    </div>
  );
}
