import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Set } from "@shared/schema";
import { ChevronLeft, MoreHorizontal, ThumbsUp, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";

export default function SetDetail() {
  const { id } = useParams<{ id: string }>();
  
  const { data: set, isLoading: isLoadingSet } = useQuery<Set>({
    queryKey: ["/api/sets", id],
  });

  const { data: allSets, isLoading: isLoadingAllSets } = useQuery<Set[]>({
    queryKey: ["/api/sets"],
  });

  // Mock comments data matching the Figma design
  const comments = [
    {
      id: 1,
      user: "techno_lover",
      avatar: "u",
      content: "Just discovered this artist through their latest EP - the production quality is insane! 🔥",
      timeAgo: "2m ago",
      upvotes: 12,
      replies: ["fake"]
    },
    {
      id: 2,
      user: "berlin_vibes", 
      avatar: "u",
      content: "Saw them live last month at Watergate. Absolutely incredible set, the crowd was going wild!",
      timeAgo: "15m ago",
      upvotes: 8,
      replies: []
    },
    {
      id: 3,
      user: "warehouse_kid",
      avatar: "u", 
      content: "Anyone know if they're touring this year? Would love to catch them in NYC",
      timeAgo: "45m ago",
      upvotes: 3,
      replies: ["General"]
    }
  ];

  if (isLoadingSet) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="p-4">
          <Skeleton className="h-6 w-32 mb-4" />
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
      {/* Header */}
      <header className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-4">
          <Link href="/sets">
            <button className="text-white">
              <ChevronLeft className="h-6 w-6" />
            </button>
          </Link>
          <h1 className="text-lg font-semibold">Set Thread</h1>
        </div>
        <button className="text-white">
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </header>

      <main className="pb-20">
        {/* Horizontal Scrolling Sets */}
        <div className="px-4 mb-6">
          <div className="flex space-x-4 overflow-x-auto pb-2">
            {isLoadingAllSets ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex-shrink-0">
                  <Skeleton className="h-16 w-16 rounded-full" />
                </div>
              ))
            ) : (
              allSets?.map((setItem) => (
                <Link key={setItem.id} href={`/sets/${setItem.id}`}>
                  <div className="flex-shrink-0 cursor-pointer">
                    <div className={`relative h-16 w-16 rounded-full overflow-hidden ${setItem.id === Number(id) ? 'ring-2 ring-pink-500' : ''}`}>
                      <img
                        src={setItem.image || "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300"}
                        alt={setItem.title}
                        className="h-full w-full object-cover"
                      />
                      {setItem.id === Number(id) && (
                        <div className="absolute -bottom-1 -right-1 bg-pink-500 rounded-full p-1">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Main Set Card */}
        <div className="px-4 mb-6">
          <div className="flex items-start space-x-4">
            <img
              src={set.image || "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300"}
              alt={set.title}
              className="h-16 w-16 rounded-lg object-cover"
            />
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <h1 className="text-xl font-bold text-white">{set.title}</h1>
                <Badge className="bg-[#4ade80] text-black text-xs font-semibold px-2 py-1 hover:bg-[#4ade80]">
                  SET
                </Badge>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                {set.description || `${set.curator}'s favorite tracks. Updated regularly. Curated by ${set.curator}.`}
              </p>
            </div>
          </div>
        </div>

        {/* Track Preview Cards */}
        <div className="px-4 mb-8">
          <div className="grid grid-cols-2 gap-3">
            <div className="relative rounded-lg overflow-hidden group cursor-pointer">
              <img
                src="https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300"
                alt="Tripolism's track IDs"
                className="w-full h-32 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute top-2 left-2">
                <Badge className="bg-[#4ade80] text-black text-xs font-semibold px-2 py-1 hover:bg-[#4ade80]">
                  Track IDs
                </Badge>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <h3 className="font-semibold text-sm mb-1">Tripolism's track I...</h3>
                <div className="flex items-center justify-between text-xs text-gray-300">
                  <span>@user</span>
                  <div className="flex items-center space-x-3">
                    <span>Discuss</span>
                    <span>0 saves</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative rounded-lg overflow-hidden group cursor-pointer">
              <img
                src="https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300"
                alt="&ME's track IDs"
                className="w-full h-32 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute top-2 left-2">
                <Badge className="bg-[#4ade80] text-black text-xs font-semibold px-2 py-1 hover:bg-[#4ade80]">
                  Track IDs
                </Badge>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <h3 className="font-semibold text-sm mb-1">&ME's track IDs</h3>
                <div className="flex items-center justify-between text-xs text-gray-300">
                  <span>@user</span>
                  <div className="flex items-center space-x-3">
                    <span>Discuss</span>
                    <span>0 saves</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Discussion Section */}
        <div className="px-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-semibold text-white">Discussion</h2>
              <span className="text-gray-400 text-sm">{comments.length} comments</span>
            </div>
            <span className="text-gray-400 text-sm">Sort by votes</span>
          </div>

          {/* Comments */}
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="flex items-start space-x-3">
                <Avatar className="h-8 w-8 bg-gray-600">
                  <AvatarFallback className="bg-gray-600 text-white text-xs">
                    {comment.avatar}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-semibold text-sm text-white">{comment.user}</span>
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed mb-2">
                    {comment.content}
                  </p>
                  <div className="flex items-center space-x-4 text-xs text-gray-400">
                    <span>{comment.timeAgo}</span>
                    <button className="hover:text-white">reply</button>
                    <button className="hover:text-white">•••</button>
                    <div className="flex items-center space-x-1">
                      <ThumbsUp className="h-3 w-3" />
                      <span>{comment.upvotes}</span>
                    </div>
                    {comment.replies.map((reply, index) => (
                      <button key={index} className="text-[#4ade80] hover:text-[#3dd474]">
                        {reply}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Message Input */}
          <div className="mt-6 flex items-center space-x-3">
            <Input
              placeholder="Message the group..."
              className="flex-1 bg-[#1a1a1a] border-[#333] text-white placeholder-gray-400 rounded-full"
            />
            <Button size="icon" className="bg-[#5271ff] hover:bg-[#4a63e8] rounded-full">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}