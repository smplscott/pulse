import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Song } from "@shared/schema";
import { ChevronLeft, Play, ThumbsUp, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function Samples() {
  const { id } = useParams<{ id: string }>();
  const songId = parseInt(id || "0");
  
  const { data: song, isLoading: isLoadingSong } = useQuery<Song>({
    queryKey: ["/api/songs", songId],
  });

  // Sample identification data for this song
  const sampleData = {
    originalTrack: "The End",
    originalArtist: "The Doors", 
    originalAlbum: "Strange Days (1967)",
    sampleType: "Drum Break",
    timecode: "2:45 - 3:15",
    usage: "Main drum loop throughout the track",
    clearanceStatus: "Cleared",
    description: "The iconic drum break from 'The End' sampled and looped to create the foundation rhythm. John Densmore's distinctive fill pattern becomes the driving force of the new composition.",
    producers: ["Paul A Rothchild", "Bruce Botnick"],
    label: "Elektra Records"
  };

  // Mock comments for sample discussion
  const comments = [
    {
      id: 1,
      user: "sample_digger",
      avatar: "s",
      content: "This is one of the most recognizable drum breaks ever sampled. Densmore's timing on this fill is absolutely perfect - you can hear why producers keep going back to it.",
      timeAgo: "8m ago",
      upvotes: 45
    },
    {
      id: 2,
      user: "vinyl_archaeologist", 
      avatar: "v",
      content: "Fun fact: This break was actually recorded in a single take at Sunset Sound. The natural reverb from the studio space adds so much character to the sample.",
      timeAgo: "23m ago",
      upvotes: 32
    },
    {
      id: 3,
      user: "beat_maker_93",
      avatar: "b", 
      content: "I've chopped this break so many times but never knew the full story behind the original recording. The clearance process must have been intense for such an iconic sample.",
      timeAgo: "41m ago",
      upvotes: 18
    },
    {
      id: 4,
      user: "drums_historian",
      avatar: "d", 
      content: "What's amazing is how different producers have flipped this same break - from boom bap to trap to house music. It's the versatility of Densmore's original performance.",
      timeAgo: "1h ago",
      upvotes: 27
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
          <h1 className="text-lg font-semibold">Samples</h1>
        </div>
      </header>

      <main className="pb-20">
        {/* Song Title */}
        <div className="px-4 pt-6 pb-4">
          <h1 className="text-2xl font-bold text-white mb-1">{songTitle}</h1>
          <p className="text-gray-400 text-sm">Sample breakdown and identification</p>
        </div>

        {/* Sample Information */}
        <div className="px-4 space-y-6">
          {/* Main Sample Card */}
          <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#333]">
            <div className="flex items-start space-x-4">
              <div className="w-16 h-16 bg-[#333] rounded-lg flex items-center justify-center">
                <Play className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h3 className="text-lg font-semibold text-white">{sampleData.originalTrack}</h3>
                  <Badge className="bg-[#4ade80] text-black text-xs font-semibold px-2 py-1 hover:bg-[#4ade80]">
                    SAMPLE
                  </Badge>
                </div>
                <p className="text-gray-300 text-sm mb-1">by {sampleData.originalArtist}</p>
                <p className="text-gray-400 text-xs">{sampleData.originalAlbum}</p>
              </div>
            </div>
          </div>

          {/* Sample Details */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Sample Type</h3>
              <p className="text-gray-300">{sampleData.sampleType}</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Timecode</h3>
              <p className="text-gray-300">{sampleData.timecode}</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-2">How It's Used</h3>
              <p className="text-gray-300">{sampleData.usage}</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Description</h3>
              <p className="text-gray-300 leading-relaxed">{sampleData.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Clearance</h3>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <p className="text-gray-300">{sampleData.clearanceStatus}</p>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Label</h3>
                <p className="text-gray-300">{sampleData.label}</p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Original Producers</h3>
              <div className="space-y-1">
                {sampleData.producers.map((producer, index) => (
                  <p key={index} className="text-gray-300">{producer}</p>
                ))}
              </div>
            </div>
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
              placeholder="Share your knowledge about this sample..."
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