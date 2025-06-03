import { Link } from "wouter";
import { Smile, MessageCircle, Trophy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type DiscussionItemProps = {
  id: number | string;
  title: string;
  comments: number;
  timeAgo: string;
  rank?: number;
  onLike?: () => void;
}

export default function DiscussionItem({ id, title, comments, timeAgo, rank = 1, onLike }: DiscussionItemProps) {
  const { toast } = useToast();
  
  // Define trophy colors based on rank
  const getTrophyColor = () => {
    switch(rank) {
      case 1: return "text-[#FFD700]"; // Gold
      case 2: return "text-[#C0C0C0]"; // Silver
      case 3: return "text-[#CD7F32]"; // Bronze
      default: return "text-[#FFD700]"; // Default to gold
    }
  };
  
  return (
    <Link href={`/thread/${id}`}>
      <div className="bg-[#181818] hover:bg-[#282828] rounded-md p-3 flex items-center cursor-pointer transition">
        <div className={`mr-3 ${getTrophyColor()}`}>
          <Trophy size={16} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-[#B3B3B3]">{comments} comments • {timeAgo}</p>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            className="w-7 h-7 rounded-full bg-[#282828] flex items-center justify-center hover:bg-[#3E3E3E]"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (onLike) {
                onLike();
              } else {
                toast({ 
                  description: "Added to your liked discussions" 
                });
              }
            }}
          >
            <Smile size={14} className="text-[#B3B3B3]" />
          </button>
          <button 
            className="w-7 h-7 rounded-full bg-[#282828] flex items-center justify-center hover:bg-[#3E3E3E]"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              window.location.href = `/thread/${id}`;
            }}
          >
            <MessageCircle size={14} className="text-[#B3B3B3]" />
          </button>
        </div>
      </div>
    </Link>
  );
}