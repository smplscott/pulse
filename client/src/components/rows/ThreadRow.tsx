import { Link } from "wouter";
import { Thread } from "@shared/schema";
import { Heart, MessageCircle } from "lucide-react";
import { TrophyIcon } from "@/components/icons/TrophyIcon";

type ThreadRowProps = {
  thread: Thread;
  onClick?: () => void;
}

export default function ThreadRow({ thread, onClick }: ThreadRowProps) {
  // Create formatted time from createdAt
  const createdAt = thread.createdAt ? new Date(thread.createdAt) : new Date();
  const timeAgo = getTimeAgo(createdAt);

  return (
    <Link href={`/thread/${thread.id}`}>
      <div 
        className="py-4 px-4 bg-[#1A1A1A] rounded-lg mb-2 cursor-pointer hover:bg-[#252525] transition-colors"
        onClick={onClick}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <TrophyIcon className="w-10 h-10 text-yellow-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{thread.title}</h3>
            <p className="text-sm text-[#A0A0A0]">
              {thread.commentsCount || 0} comments • {timeAgo}
            </p>
          </div>
          <div className="flex gap-2">
            <button className="w-10 h-10 rounded-full bg-[#252525] flex items-center justify-center">
              <Heart className="w-5 h-5 text-[#E5E5E5]" />
            </button>
            <button className="w-10 h-10 rounded-full bg-[#252525] flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-[#E5E5E5]" />
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}

// Helper function to format time ago
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
  
  if (diffInHours < 1) {
    return 'Just now';
  } else if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  } else {
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  }
}