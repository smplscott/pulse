import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { cn, truncateText, formatRelativeTime } from "@/lib/utils";
import { MessageCircleIcon, HeadphonesIcon, CheckIcon, HelpCircleIcon, PlayIcon } from "lucide-react";
import { Thread } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { User, SongRecommendation, Song } from "@shared/schema";

type SongIdentificationCardProps = {
  thread: Thread;
  className?: string;
};

export default function SongIdentificationCard({ thread, className }: SongIdentificationCardProps) {
  const { data: user } = useQuery<User>({
    queryKey: [`/api/users/${thread.userId}`],
  });

  const { data: recommendations } = useQuery<SongRecommendation[]>({
    queryKey: [`/api/threads/${thread.id}/recommendations`],
  });

  const solved = thread.status === "solved";
  const createdAt = thread.createdAt ? new Date(thread.createdAt) : new Date();

  return (
    <div className={cn("bg-[#282828] rounded-lg p-4", className)}>
      <div className="flex items-start space-x-3">
        <div className={`w-10 h-10 rounded-full ${solved ? "bg-[#1DB954]" : "bg-[#E51D3E]"} flex items-center justify-center flex-shrink-0`}>
          {solved ? <CheckIcon className="h-5 w-5 text-white" /> : <HelpCircleIcon className="h-5 w-5 text-white" />}
        </div>
        <div className="flex-1">
          <div className="flex justify-between">
            <div>
              <p className="font-medium">{solved ? "Track identified!" : "Help identify this track"}</p>
              <p className="text-sm text-[#B3B3B3]">
                Posted by @{user?.username || "user"} • {formatRelativeTime(createdAt)}
              </p>
            </div>
            <Badge 
              variant={solved ? "solved" : "active"} 
              className="text-xs px-2 py-0.5 rounded-full h-fit"
            >
              {solved ? "Solved" : "Active"}
            </Badge>
          </div>
          <p className="mt-2 text-sm">{truncateText(thread.content, 120)}</p>
          
          {solved && recommendations && recommendations.length > 0 && (
            <SolvedSongDisplay recommendationId={recommendations[0].id} songId={recommendations[0].songId} />
          )}
          
          <div className="mt-3 flex justify-between items-center">
            <div className="flex items-center">
              <HeadphonesIcon className="h-3 w-3 text-[#B3B3B3] mr-1" />
              <span className="text-xs text-[#B3B3B3]">{thread.recommendationsCount} suggestions</span>
            </div>
            <Link href={`/thread/${thread.id}`}>
              <button className="px-4 py-1.5 rounded-full bg-[#E51D3E] hover:bg-[#c01733] text-white text-sm font-medium transition-colors">
                {solved ? "View Solution" : "Help Identify"}
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function SolvedSongDisplay({ recommendationId, songId }: { recommendationId: number, songId: number }) {
  const { data: song } = useQuery<Song>({
    queryKey: [`/api/songs/${songId}`],
  });

  if (!song) return null;

  return (
    <div className="mt-3 p-3 bg-[#121212] rounded flex items-center">
      <div className="flex-1">
        <p className="font-medium text-sm">{song.title}</p>
        <p className="text-xs text-[#B3B3B3]">
          {song.artist}
        </p>
      </div>
      <button className="w-8 h-8 rounded-full bg-[#1DB954] flex items-center justify-center">
        <PlayIcon className="h-4 w-4 text-white" />
      </button>
    </div>
  );
}
