import { Link } from "wouter";
import { Play, Heart, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Song } from "@shared/schema";
import { truncateText } from "@/lib/utils";

type SongCardProps = {
  song: Song;
  className?: string;
};

export default function SongCard({ song, className }: SongCardProps) {
  return (
    <Link href={`/songs/${song.id}`}>
      <div className={cn(
        "bg-[#181818] rounded-lg p-3 cursor-pointer transition-all hover:bg-[#282828]",
        className
      )}>
        <div className="relative aspect-square mb-3 bg-[#282828] rounded overflow-hidden">
          {song.albumArt ? (
            <img 
              src={song.albumArt}
              alt={song.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[#B3B3B3]">
              <Play className="w-10 h-10" />
            </div>
          )}
          <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <button className="w-12 h-12 flex items-center justify-center rounded-full bg-black bg-opacity-70">
              <Play className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>
        
        <div>
          <h3 className="font-semibold text-white truncate">{song.title}</h3>
          <p className="text-sm text-[#B3B3B3] truncate">{song.artist}</p>
          
          <div className="mt-3 flex items-center justify-between">
            <div className="text-xs text-[#B3B3B3]">
              {song.releaseDate ? new Date(song.releaseDate).getFullYear() : "Unknown"}
            </div>
            <div className="flex items-center space-x-2">
              <button className="text-[#B3B3B3] hover:text-white">
                <Heart className="w-4 h-4" />
              </button>
              <button className="text-[#B3B3B3] hover:text-white">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}