import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Artist } from "@shared/schema";
import { Music2Icon } from "lucide-react";

type ArtistCardProps = {
  artist: Artist;
  className?: string;
};

export default function ArtistCard({ artist, className }: ArtistCardProps) {
  return (
    <Link href={`/artist/${artist.id}`}>
      <div className={cn("bg-[#181818] rounded-lg overflow-hidden cursor-pointer", className)}>
        <div className="relative h-36">
          {artist.profilePicture && (
            <img
              src={artist.profilePicture}
              alt={`${artist.name} profile`}
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
          <div className="absolute bottom-2 left-2 right-2">
            <Badge 
              variant="default" 
              className="text-xs px-2 py-0.5 rounded-sm mb-1"
            >
              {artist.verified ? "Artist Spotlight" : "Artist"}
            </Badge>
            <p className="font-bold text-white">{artist.name}</p>
          </div>
        </div>
        <div className="p-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-[#B3B3B3]">
              {artist.genres && artist.genres.length > 0
                ? artist.genres.slice(0, 2).join(" / ")
                : "Genre not specified"}
            </span>
            {artist.verified && (
              <Badge variant="verified" className="text-xs px-2 py-0.5 rounded-full">
                Verified
              </Badge>
            )}
          </div>
          <div className="flex items-center text-sm">
            <Music2Icon className="h-3 w-3 mr-1 text-[#E51D3E]" />
            <span>{Math.floor(Math.random() * 50) + 10} tracks</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
