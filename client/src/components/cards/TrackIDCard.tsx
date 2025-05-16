import { Link } from "wouter";
import { cn, formatNumber } from "@/lib/utils";
import { Playlist } from "@shared/schema";
import { MessageCircleIcon } from "lucide-react";

type TrackIDCardProps = {
  playlist: Playlist;
  className?: string;
};

export default function TrackIDCard({ playlist, className }: TrackIDCardProps) {
  return (
    <Link href={`/thread/playlist_${playlist.id}`}>
      <div className={cn("flex-shrink-0 w-40 bg-[#181818] rounded-lg overflow-hidden cursor-pointer", className)}>
        <div className="relative">
          {playlist.image && (
            <img
              src={playlist.image}
              alt={`${playlist.title} cover`}
              className="w-full h-40 object-cover"
            />
          )}
          <div className="absolute top-2 left-2 right-2 flex justify-between">
            <div className="flex items-center">
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/1/19/Spotify_logo_without_text.svg" 
                alt="Spotify" 
                className="w-5 h-5"
              />
            </div>
            <span className="text-xs bg-[#E51D3E] text-white px-2 py-0.5 rounded-sm font-medium">
              track IDs
            </span>
          </div>
        </div>
        <div className="p-3">
          <p className="font-semibold text-sm truncate">{playlist.title}</p>
          <div className="flex justify-between items-center mt-1">
            <p className="text-xs text-[#B3B3B3]">{formatNumber(playlist.saves || 0)} saves</p>
            <button 
              className="flex items-center text-xs text-[#E51D3E]"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                window.location.href = `/thread/playlist_${playlist.id}`;
              }}
            >
              <MessageCircleIcon className="h-3 w-3 mr-1" />
              <span>Discuss</span>
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
