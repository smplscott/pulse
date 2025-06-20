import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useState } from "react";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import { Set } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { SearchIcon, Filter, Plus, MessageCircle, Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function Sets() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: sets, isLoading } = useQuery<Set[]>({
    queryKey: ["/api/sets"],
  });

  const { data: featuredSets, isLoading: isLoadingFeatured } = useQuery<Set[]>({
    queryKey: ["/api/sets/featured"],
  });

  const filteredSets = sets?.filter(set =>
    set.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    set.curator.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      
      <main className="px-4 pb-20">
        <div className="py-4">
          <h1 className="text-2xl font-bold mb-4">Sets</h1>
          
          {/* Search Bar */}
          <div className="relative mb-6">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search sets or curators..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-[#1a1a1a] border-[#333] text-white placeholder-gray-400"
            />
            <Button size="sm" variant="ghost" className="absolute right-2 top-1/2 transform -translate-y-1/2">
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          {/* Featured Sets Section - Enhanced with track counts and stories */}
          {featuredSets && featuredSets.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Featured Track IDs</h2>
              <div className="flex space-x-4 overflow-x-auto pb-4">
                {isLoadingFeatured ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex-shrink-0">
                      <Skeleton className="h-24 w-24 rounded-full mb-2" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  ))
                ) : (
                  featuredSets.map((set) => (
                    <Link key={set.id} href={`/sets/${set.id}`}>
                      <div className="flex-shrink-0 text-center cursor-pointer group">
                        <div className="relative">
                          <img
                            src={set.image || "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300"}
                            alt={set.title}
                            className="h-24 w-24 rounded-full object-cover border-2 border-[#5271ff] group-hover:border-[#4a63e8] transition-colors"
                          />
                          <div className="absolute -bottom-1 -right-1 bg-[#5271ff] rounded-full p-1">
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          </div>
                          {/* Track count badge */}
                          <div className="absolute -top-1 -left-1 bg-black/80 rounded-full px-2 py-1">
                            <span className="text-xs text-white font-semibold">{Array.isArray(set.songs) ? set.songs.length : 0}</span>
                          </div>
                        </div>
                        <p className="text-xs text-center mt-2 max-w-[80px] truncate font-medium">{set.curator}</p>
                        <p className="text-xs text-gray-400 text-center max-w-[80px] truncate">
                          {(set.saves || 0).toLocaleString()} saves
                        </p>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Main Sets Grid */}
          <div className="space-y-4">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
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
            ) : (
              filteredSets.map((set) => (
                <Link key={set.id} href={`/sets/${set.id}`}>
                  <div className="bg-[#1a1a1a] rounded-lg p-4 cursor-pointer hover:bg-[#222222] transition-colors">
                    <div className="flex items-start space-x-3">
                      <img
                        src={set.image || "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300"}
                        alt={set.title}
                        className="h-16 w-16 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-white mb-1">{set.title}</h3>
                            <p className="text-sm text-gray-400 mb-2">{set.description}</p>
                            <p className="text-xs text-gray-500">Curated by {set.curator}</p>
                          </div>
                          <Badge
                            variant="secondary"
                            className="bg-[#5271ff]/20 text-[#5271ff] text-xs px-2 py-1"
                          >
                            SET
                          </Badge>
                        </div>
                        
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center space-x-4 text-xs text-gray-400">
                            <span className="flex items-center">
                              <Heart className="h-3 w-3 mr-1" />
                              {(set.saves || 0).toLocaleString()} saves
                            </span>
                            <span>{Array.isArray(set.songs) ? set.songs.length : 0} tracks</span>
                          </div>
                          
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-[#5271ff] hover:bg-[#5271ff]/10 px-3 py-1 h-auto text-xs"
                            onClick={(e) => {
                              e.preventDefault();
                              window.location.href = `/thread/set_${set.id}`;
                            }}
                          >
                            <MessageCircle className="h-3 w-3 mr-1" />
                            Discuss
                          </Button>
                        </div>

                        {/* Tags */}
                        {set.tags && Array.isArray(set.tags) && set.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {(set.tags as string[]).slice(0, 3).map((tag, index) => (
                              <span
                                key={index}
                                className="text-xs bg-[#333] px-2 py-1 rounded-full text-gray-300"
                              >
                                #{tag}
                              </span>
                            ))}
                            {(set.tags as string[]).length > 3 && (
                              <span className="text-xs text-gray-500">+{(set.tags as string[]).length - 3} more</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>

          {/* Empty State */}
          {!isLoading && filteredSets.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Plus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg">No sets found</p>
                <p className="text-sm">Try adjusting your search or explore featured sets</p>
              </div>
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}