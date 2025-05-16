import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import MusicPlayer from "@/components/layout/MusicPlayer";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Artist } from "@shared/schema";
import ArtistCard from "@/components/cards/ArtistCard";
import { SearchIcon, User, MusicIcon, PenIcon, SettingsIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Artists() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("artists");

  const { data: artists, isLoading: isLoadingArtists } = useQuery<Artist[]>({
    queryKey: ["/api/artists"],
  });

  // Filter artists based on search query
  const filteredArtists = artists?.filter(artist => 
    artist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (artist.genres && Array.isArray(artist.genres) && artist.genres.some((genre: string) => 
      genre.toLowerCase().includes(searchQuery.toLowerCase())
    ))
  );

  // This would be extended to handle other professional types in a real app
  const isEmpty = {
    producers: true,
    writers: true,
    engineers: true
  };

  return (
    <div className="min-h-screen pb-32">
      <Header />
      
      <main className="px-4 py-4">
        <div className="relative mb-6">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#B3B3B3]" size={18} />
          <Input
            type="text"
            placeholder="Search music professionals..."
            className="pl-9 bg-[#282828] border-[#3E3E3E] text-white placeholder:text-[#B3B3B3]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <Tabs defaultValue="artists" className="mb-6" onValueChange={setActiveTab}>
          <TabsList className="w-full bg-[#181818] border border-[#3E3E3E]">
            <TabsTrigger value="artists" className="flex-1">
              <User className="h-4 w-4 mr-2" />
              Artists
            </TabsTrigger>
            <TabsTrigger value="producers" className="flex-1">
              <MusicIcon className="h-4 w-4 mr-2" />
              Producers
            </TabsTrigger>
            <TabsTrigger value="writers" className="flex-1">
              <PenIcon className="h-4 w-4 mr-2" />
              Writers
            </TabsTrigger>
            <TabsTrigger value="engineers" className="flex-1">
              <SettingsIcon className="h-4 w-4 mr-2" />
              Engineers
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="artists" className="mt-4">
            {isLoadingArtists ? (
              <div className="grid grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-56 w-full" />
                ))}
              </div>
            ) : filteredArtists && filteredArtists.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {filteredArtists.map((artist) => (
                  <ArtistCard key={artist.id} artist={artist} />
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-[#B3B3B3]">
                  {searchQuery ? "No artists found matching your search" : "No artists available"}
                </p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="producers" className="mt-4">
            <div className="text-center py-10">
              <p className="text-[#B3B3B3]">
                Coming soon! We're working on adding producers to our platform.
              </p>
              <p className="text-sm text-[#B3B3B3] mt-2">
                Producers create the beat and sonic landscape, often shaping the feel of the track.
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="writers" className="mt-4">
            <div className="text-center py-10">
              <p className="text-[#B3B3B3]">
                Coming soon! We're working on adding writers to our platform.
              </p>
              <p className="text-sm text-[#B3B3B3] mt-2">
                Writers are the lyricists or composers behind the words and melodies (can overlap with artists).
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="engineers" className="mt-4">
            <div className="text-center py-10">
              <p className="text-[#B3B3B3]">
                Coming soon! We're working on adding engineers to our platform.
              </p>
              <p className="text-sm text-[#B3B3B3] mt-2">
                Engineers handle mixing and mastering, less public but core to the final sound.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </main>
      
      <MusicPlayer />
      <BottomNav />
    </div>
  );
}