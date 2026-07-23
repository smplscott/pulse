import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Song } from "@shared/schema";
import { ChevronLeft, Flag, ThumbsUp, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";

export default function Credits() {
  const { id } = useParams<{ id: string }>();
  const songId = parseInt(id || "0");
  
  const { data: song, isLoading: isLoadingSong } = useQuery<Song>({
    queryKey: ["/api/songs", songId],
  });

  // Mock credits data based on the attached screenshot
  const credits = {
    performed: ["The Doors"],
    written: ["Jim Morrison", "John Densmore", "Ray Manzarek", "Robby Krieger"],
    produced: ["Paul A Rothchild"],
    source: "Rhino/Elektra"
  };

  // Mock comments for song discussion
  const comments = [
    {
      id: 1,
      user: "music_historian",
      avatar: "m",
      content: "The production on this track is legendary. Paul Rothchild really captured the essence of The Doors' sound.",
      timeAgo: "4m ago",
      upvotes: 18
    },
    {
      id: 2,
      user: "vinyl_collector", 
      avatar: "v",
      content: "Fun fact: This was recorded at Sunset Sound Studios in 1967. The original Elektra pressing is worth a fortune now!",
      timeAgo: "12m ago",
      upvotes: 24
    },
    {
      id: 3,
      user: "doors_fan_67",
      avatar: "d", 
      content: "Morrison's lyrics on this one are pure poetry. The way he delivers 'Break on through to the other side' gives me chills every time.",
      timeAgo: "25m ago",
      upvotes: 31
    }
  ];

  if (isLoadingSong) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="p-4">
          <Skeleton className="h-6 w-32 mb-4" />
          <Skeleton className="h-8 w-3/4 mb-6" />
          <div className="space-y-4">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-4 w-1/4" />
          </div>
        </div>
      </div>
    );
  }

  const songTitle = song?.title || "Break on Through (To the Other Side)";
  const songArtist = song?.artist || "The Doors";

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-[#222222]">
        <div className="flex items-center space-x-4">
          <Link href="/threads">
            <button className="text-white">
              <ChevronLeft className="h-6 w-6" />
            </button>
          </Link>
          <div>
            <h1 className="text-lg font-semibold">Cancel</h1>
          </div>
        </div>
      </header>

      <main className="pb-20">
        {/* Song Title */}
        <div className="px-4 pt-6 pb-4">
          <h1 className="text-2xl font-bold text-white mb-1">{songTitle}</h1>
        </div>

        {/* Credits Table */}
        <div className="px-4 space-y-6">
          {/* Performed by */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-3">Performed by</h2>
            <div className="space-y-1">
              {credits.performed.map((performer, index) => (
                <p key={index} className="text-gray-300 text-lg">{performer}</p>
              ))}
            </div>
          </div>

          {/* Written by */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-3">Written by</h2>
            <div className="space-y-1">
              {credits.written.map((writer, index) => (
                <p key={index} className="text-gray-300 text-lg">{writer}</p>
              ))}
            </div>
          </div>

          {/* Produced by */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-3">Produced by</h2>
            <div className="space-y-1">
              {credits.produced.map((producer, index) => (
                <p key={index} className="text-gray-300 text-lg">{producer}</p>
              ))}
            </div>
          </div>

          {/* Source */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-3">Source</h2>
            <p className="text-gray-300 text-lg">{credits.source}</p>
          </div>

          {/* Report Error */}
          <div className="pt-4 border-t border-[#222222]">
            <button className="flex items-center justify-between w-full text-gray-300 hover:text-white">
              <span className="text-lg">Report Error</span>
              <Flag className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Discussion Section */}
        <div className="px-4 mt-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-semibold text-white">Discussion</h2>
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
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Message Input */}
          <div className="mt-6 flex items-center space-x-3">
            <Input
              placeholder="Share your thoughts about this song..."
              className="flex-1 bg-[#1a1a1a] border-[#333] text-white placeholder-gray-400 rounded-full"
            />
            <Button size="icon" className="green-gradient rounded-full">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}