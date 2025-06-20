import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { useState } from "react";
import { ChevronLeft, MoreHorizontal, MessageCircle, Play, Heart, Share, User } from "lucide-react";
import { Set, User as UserType, Thread, Comment } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SetDetail() {
  const [, params] = useRoute("/sets/:id");
  const setId = parseInt(params?.id || "0");
  const [newComment, setNewComment] = useState("");

  const { data: set, isLoading: isLoadingSet } = useQuery<Set>({
    queryKey: [`/api/sets/${setId}`],
  });

  const { data: user, isLoading: isLoadingUser } = useQuery<UserType>({
    queryKey: [`/api/users/${set?.userId}`],
    enabled: !!set?.userId,
  });

  const { data: comments, isLoading: isLoadingComments } = useQuery<Comment[]>({
    queryKey: [`/api/threads/set_${setId}/comments`],
  });

  if (isLoadingSet) {
    return (
      <div className="min-h-screen bg-black text-white">
        <header className="flex items-center justify-between p-4 border-b border-[#222222]">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-6 w-6" />
            <Skeleton className="h-6 w-32" />
          </div>
          <Skeleton className="h-6 w-6" />
        </header>
        <div className="p-4">
          <Skeleton className="h-48 w-full rounded-lg mb-4" />
          <Skeleton className="h-8 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    );
  }

  if (!set) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Set not found</h1>
          <Link href="/sets">
            <Button variant="outline">Back to Sets</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="flex items-center justify-between p-4 border-b border-[#222222]">
        <div className="flex items-center space-x-4">
          <Link href="/sets">
            <button className="text-white">
              <ChevronLeft className="h-6 w-6" />
            </button>
          </Link>
          <h1 className="text-lg font-semibold">Set Thread</h1>
        </div>
        <button className="text-[#5271ff]">
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </header>

      <main className="pb-20">
        {/* Featured Creator Avatars */}
        <div className="flex justify-center py-4 space-x-4 overflow-x-auto px-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex-shrink-0">
              <div className="relative">
                <img
                  src={set.image || `https://images.unsplash.com/photo-${1516450360452 + i}?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300`}
                  alt={`Avatar ${i + 1}`}
                  className="h-16 w-16 rounded-full object-cover border-2 border-purple-500"
                />
                {i === 5 && (
                  <div className="absolute inset-0 bg-purple-500/20 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Set Header */}
        <div className="px-4 py-4 border-b border-[#222222]">
          <div className="flex items-start space-x-4">
            <img
              src={set.image || "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300"}
              alt={set.title}
              className="h-20 w-20 rounded-lg object-cover"
            />
            
            <div className="flex-1">
              <h2 className="font-bold text-xl">{set.title}</h2>
              <div className="text-sm text-[#B3B3B3] flex items-center mb-2">
                <span>{set.description}</span>
              </div>
              <div className="text-xs text-[#888] mb-3">
                Curated by {set.curator}
              </div>
              
              <Badge
                variant="default"
                className="bg-[#5271ff] text-white text-xs px-2 py-0.5 rounded-sm mb-3"
              >
                SET
              </Badge>
            </div>
          </div>
        </div>

        {/* Track Cards */}
        <div className="px-4 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Featured Track 1 */}
            <div className="relative rounded-lg overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300"
                alt="Track 1"
                className="w-full h-32 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{set.title}</p>
                    <p className="text-xs text-gray-300">@{user?.username || 'user'}</p>
                    <p className="text-xs text-gray-400">0 saves</p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-[#5271ff] hover:bg-[#5271ff]/10 px-2 py-1 h-auto text-xs"
                  >
                    <MessageCircle className="h-3 w-3 mr-1" />
                    Discuss
                  </Button>
                </div>
              </div>
              <div className="absolute top-2 left-2">
                <Badge className="bg-purple-500 text-white text-xs px-2 py-1">
                  track ID
                </Badge>
              </div>
            </div>

            {/* Featured Track 2 */}
            <div className="relative rounded-lg overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300"
                alt="Track 2"
                className="w-full h-32 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">&ME's track IDs</p>
                    <p className="text-xs text-gray-300">@{user?.username || 'user'}</p>
                    <p className="text-xs text-gray-400">0 saves</p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-[#5271ff] hover:bg-[#5271ff]/10 px-2 py-1 h-auto text-xs"
                  >
                    <MessageCircle className="h-3 w-3 mr-1" />
                    Discuss
                  </Button>
                </div>
              </div>
              <div className="absolute top-2 left-2">
                <Badge className="bg-purple-500 text-white text-xs px-2 py-1">
                  track ID
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Discussion Section */}
        <div className="px-4 py-4 border-t border-[#222222]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Discussion</h3>
            <div className="flex items-center space-x-4 text-sm text-gray-400">
              <span>{comments?.length || 5} comments</span>
              <button className="text-[#5271ff]">Sort by votes</button>
            </div>
          </div>

          {/* Sample Comments */}
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="h-8 w-8 rounded-full bg-[#333] flex items-center justify-center">
                <User className="h-4 w-4 text-gray-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-sm font-medium text-white">techno_lover</span>
                  <span className="text-xs text-gray-500">2m ago</span>
                </div>
                <p className="text-sm text-gray-300">
                  Just discovered this artist through their latest EP - the production quality is insane! 🔥
                </p>
                <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                  <button className="flex items-center space-x-1 hover:text-[#5271ff]">
                    <span>▲</span>
                    <span>12</span>
                  </button>
                  <button className="hover:text-[#5271ff]">reply</button>
                  <span>fake</span>
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="h-8 w-8 rounded-full bg-[#333] flex items-center justify-center">
                <User className="h-4 w-4 text-gray-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-sm font-medium text-white">berlin_vibes</span>
                  <span className="text-xs text-gray-500">15m ago</span>
                </div>
                <p className="text-sm text-gray-300">
                  Saw them live last month at Watergate. Absolutely incredible set, the crowd was going wild!
                </p>
                <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                  <button className="flex items-center space-x-1 hover:text-[#5271ff]">
                    <span>▲</span>
                    <span>8</span>
                  </button>
                  <button className="hover:text-[#5271ff]">reply</button>
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="h-8 w-8 rounded-full bg-[#333] flex items-center justify-center">
                <User className="h-4 w-4 text-gray-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-sm font-medium text-white">warehouse_kid</span>
                  <span className="text-xs text-gray-500">45m ago</span>
                </div>
                <p className="text-sm text-gray-300">
                  Anyone know if they're touring this year? Would love to catch them in NYC
                </p>
                <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                  <button className="flex items-center space-x-1 hover:text-[#5271ff]">
                    <span>▲</span>
                    <span>3</span>
                  </button>
                  <button className="hover:text-[#5271ff]">reply</button>
                  <span>General</span>
                </div>
              </div>
            </div>
          </div>

          {/* Comment Input */}
          <div className="mt-6 flex items-center space-x-3">
            <Input
              placeholder="Message the group..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="flex-1 bg-[#1a1a1a] border-[#333] text-white placeholder-gray-400"
            />
            <Button
              size="sm"
              className="bg-[#5271ff] hover:bg-[#5271ff]/80 text-white p-2"
            >
              <MessageCircle className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </main>

      {/* Bottom Navigation Tabs */}
      <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-[#222222]">
        <div className="flex items-center justify-around py-2">
          <Link href="/" className="flex flex-col items-center py-2 px-4">
            <MessageCircle className="h-5 w-5 text-gray-400" />
            <span className="text-xs text-gray-400 mt-1">Threads</span>
          </Link>
          <Link href="/venues" className="flex flex-col items-center py-2 px-4">
            <div className="h-5 w-5 text-gray-400">📍</div>
            <span className="text-xs text-gray-400 mt-1">Places</span>
          </Link>
          <Link href="/songs" className="flex flex-col items-center py-2 px-4">
            <div className="h-5 w-5 text-gray-400">🎵</div>
            <span className="text-xs text-gray-400 mt-1">Songs</span>
          </Link>
          <Link href="/artists" className="flex flex-col items-center py-2 px-4">
            <User className="h-5 w-5 text-gray-400" />
            <span className="text-xs text-gray-400 mt-1">Artists</span>
          </Link>
          <Link href="/sets" className="flex flex-col items-center py-2 px-4">
            <div className="h-5 w-5 text-[#5271ff]">😊</div>
            <span className="text-xs text-[#5271ff] mt-1">Sets</span>
          </Link>
        </div>
      </div>
    </div>
  );
}