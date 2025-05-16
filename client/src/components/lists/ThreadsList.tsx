import { useState } from "react";
import { Thread } from "@shared/schema";
import { Link } from "wouter";
import { Heart, MessageCircle, Trophy } from "lucide-react";
import { TrophyIcon } from "@/components/icons/TrophyIcon";
import { formatRelativeTime } from "@/lib/utils";

type ThreadsListProps = {
  threads: Thread[];
  title?: string;
}

export default function ThreadsList({ threads, title }: ThreadsListProps) {
  return (
    <div className="space-y-2">
      {title && (
        <h2 className="text-lg font-semibold mb-3">{title}</h2>
      )}
      
      <div className="space-y-2">
        {threads.map((thread) => (
          <ThreadListItem key={thread.id} thread={thread} />
        ))}
      </div>
    </div>
  );
}

function ThreadListItem({ thread }: { thread: Thread }) {
  const createdAt = thread.createdAt ? new Date(thread.createdAt) : new Date();
  
  return (
    <Link href={`/thread/${thread.id}`}>
      <div className="py-4 px-4 bg-[#1A1A1A] rounded-lg cursor-pointer hover:bg-[#252525] transition-colors">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <TrophyIcon className="w-10 h-10 text-yellow-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{thread.title}</h3>
            <p className="text-sm text-[#A0A0A0]">
              {thread.commentsCount || 0} comments • {formatRelativeTime(createdAt)}
            </p>
          </div>
          <div className="flex gap-2">
            <button 
              className="w-10 h-10 rounded-full bg-[#252525] flex items-center justify-center"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // Like thread functionality would go here
              }}
            >
              <Heart className={`w-5 h-5 ${(thread.upvotes || 0) > 0 ? "text-[#5271ff] fill-[#5271ff]" : "text-[#E5E5E5]"}`} />
            </button>
            <button 
              className="w-10 h-10 rounded-full bg-[#252525] flex items-center justify-center"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                window.location.href = `/thread/${thread.id}`;
              }}
            >
              <MessageCircle className="w-5 h-5 text-[#E5E5E5]" />
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}