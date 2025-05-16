import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { cn, truncateText, formatRelativeTime } from "@/lib/utils";
import { MessageCircleIcon, ArrowUpIcon, Music2Icon } from "lucide-react";
import { Thread } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type ThreadCardProps = {
  thread: Thread;
  className?: string;
};

export default function ThreadCard({ thread, className }: ThreadCardProps) {
  const { data: user } = useQuery<User>({
    queryKey: [`/api/users/${thread.userId}`],
  });

  const createdAt = new Date(thread.createdAt);

  // Determine badge variant based on thread metrics
  let badgeText = "New";
  let badgeVariant: "hot" | "trending" | "status" = "status";
  
  if (thread.upvotes > 100) {
    badgeText = "Hot";
    badgeVariant = "hot";
  } else if (thread.commentsCount > 20) {
    badgeText = "Trending";
    badgeVariant = "trending";
  }

  return (
    <Link href={`/thread/${thread.id}`}>
      <div className={cn("bg-[#181818] rounded-lg p-4 cursor-pointer", className)}>
        <div className="flex items-start space-x-3">
          <Avatar className="w-10 h-10 rounded-full flex-shrink-0">
            {user?.profilePicture ? (
              <AvatarImage src={user.profilePicture} alt={user.username} />
            ) : (
              <AvatarFallback className="bg-[#3E3E3E]">
                {user?.username?.substring(0, 2).toUpperCase() || "U"}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="flex-1">
            <div className="flex justify-between">
              <div>
                <p className="font-medium">{thread.title}</p>
                <p className="text-sm text-[#B3B3B3]">
                  Started by @{user?.username || "user"} • {formatRelativeTime(createdAt)}
                </p>
              </div>
              <Badge 
                variant={badgeVariant} 
                className="text-xs px-2 py-0.5 rounded-full h-fit"
              >
                {badgeText}
              </Badge>
            </div>
            <p className="mt-2 text-sm">{truncateText(thread.content, 120)}</p>
            <div className="mt-3 flex space-x-4">
              <div className="flex items-center">
                <MessageCircleIcon className="h-3 w-3 text-[#B3B3B3] mr-1" />
                <span className="text-xs text-[#B3B3B3]">{thread.commentsCount} comments</span>
              </div>
              <div className="flex items-center">
                <ArrowUpIcon className="h-3 w-3 text-[#B3B3B3] mr-1" />
                <span className="text-xs text-[#B3B3B3]">{thread.upvotes} upvotes</span>
              </div>
              <div className="flex items-center">
                <Music2Icon className="h-3 w-3 text-[#B3B3B3] mr-1" />
                <span className="text-xs text-[#B3B3B3]">{thread.recommendationsCount} recs</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
