import { Link } from "wouter";
import { cn, formatRelativeTime } from "@/lib/utils";
import { MessageCircleIcon, BookmarkIcon, Star, Music2Icon, MicVocalIcon, Disc3, Ticket } from "lucide-react";
import { Thread, Song, Artist } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const THREAD_TYPE_LABELS: Record<string, string> = {
  new_music: "New Music",
  listening_now: "Listening Now",
  live_show_review: "Live Show Review",
  album_review: "Album Review",
  topic: "Topic",
};

const THREAD_TYPE_COLORS: Record<string, string> = {
  new_music: "bg-[#c2f970]/20 text-[#c2f970]",
  listening_now: "bg-[#b388eb]/20 text-[#b388eb]",
  live_show_review: "bg-orange-500/20 text-orange-400",
  album_review: "bg-[#b388eb]/20 text-[#b388eb]",
  topic: "bg-purple-500/20 text-purple-400",
};

const THREAD_TYPE_ICONS: Record<string, typeof Disc3> = {
  live_show_review: Ticket,
  album_review: Disc3,
};

type ThreadCardProps = {
  thread: Thread;
  className?: string;
};

export default function ThreadCard({ thread, className }: ThreadCardProps) {
  const { data: user } = useQuery<User>({
    queryKey: [`/api/users/${thread.userId}`],
  });

  const { data: song } = useQuery<Song>({
    queryKey: [`/api/songs/${thread.songId}`],
    enabled: !!thread.songId,
  });

  const { data: artist } = useQuery<Artist>({
    queryKey: [`/api/artists/${thread.artistId}`],
    enabled: !!thread.artistId,
  });

  const createdAt = new Date(thread.createdAt || Date.now());
  const typeLabel = THREAD_TYPE_LABELS[thread.threadType] || "Topic";
  const typeColor = THREAD_TYPE_COLORS[thread.threadType] || THREAD_TYPE_COLORS.topic;
  const TypeIcon = THREAD_TYPE_ICONS[thread.threadType];

  const linkedLabel = thread.albumName
    ? thread.albumName
    : song
    ? `${song.title} — ${song.artist}`
    : artist?.name
    ? artist.name
    : thread.artistName
    ? thread.artistName
    : null;

  const linkedIcon = thread.albumName
    ? <Disc3 className="h-3 w-3 flex-shrink-0" />
    : song
    ? <Music2Icon className="h-3 w-3 flex-shrink-0" />
    : <MicVocalIcon className="h-3 w-3 flex-shrink-0" />;

  return (
    <Link href={`/thread/${thread.id}`}>
      <div className={cn("bg-[#181818] rounded-xl p-4 cursor-pointer hover:bg-[#1e1e1e] transition-colors", className)}>
        <div className="flex items-start gap-3">
          <Avatar className="w-9 h-9 rounded-full flex-shrink-0 mt-0.5">
            {user?.profilePicture ? (
              <AvatarImage src={user.profilePicture} alt={user.username} />
            ) : (
              <AvatarFallback className="bg-[#3E3E3E] text-xs">
                {user?.username?.substring(0, 2).toUpperCase() || "U"}
              </AvatarFallback>
            )}
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1", typeColor)}>
                {TypeIcon && <TypeIcon className="h-3 w-3" />}
                {typeLabel}
              </span>
              {linkedLabel && (
                <span className="text-xs text-[#B3B3B3] flex items-center gap-1 truncate">
                  {linkedIcon}
                  <span className="truncate">{linkedLabel}</span>
                </span>
              )}
            </div>

            <p className="font-semibold text-white text-sm leading-snug mb-1">{thread.title}</p>

            <p className="text-xs text-[#B3B3B3] mb-2">
              @{user?.username || "user"} · {formatRelativeTime(createdAt)}
            </p>

            {(thread.threadType === "live_show_review" || thread.threadType === "album_review") && thread.starRating && (
              <div className="flex items-center gap-0.5 mb-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn("h-3 w-3", i < (thread.starRating || 0) ? "text-yellow-400 fill-yellow-400" : "text-[#3E3E3E]")}
                  />
                ))}
              </div>
            )}

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <MessageCircleIcon className="h-3.5 w-3.5 text-[#B3B3B3]" />
                <span className="text-xs text-[#B3B3B3]">{thread.commentsCount || 0}</span>
              </div>
              <div className="flex items-center gap-1">
                <BookmarkIcon className="h-3.5 w-3.5 text-[#B3B3B3]" />
                <span className="text-xs text-[#B3B3B3]">{thread.savesCount || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
