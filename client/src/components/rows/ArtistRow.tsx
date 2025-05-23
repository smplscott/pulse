import { Link } from "wouter";
import { Artist } from "@shared/schema";
import { Plus, Smile, MessageCircle } from "lucide-react";

type ArtistRowProps = {
  artist: Artist;
  onClick?: () => void;
}

export default function ArtistRow({ artist, onClick }: ArtistRowProps) {
  return (
    <Link href={`/thread/artist_${artist.id}`}>
      <div 
        className="py-3 px-4 bg-[#1A1A1A] rounded-lg mb-2 cursor-pointer hover:bg-[#252525] transition-colors"
        onClick={onClick}
      >
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-12 h-12 overflow-hidden rounded-full">
            {artist.profilePicture ? (
              <img 
                src={artist.profilePicture} 
                alt={artist.name} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-[#333] flex items-center justify-center text-white font-bold">
                {artist.name.substring(0, 1)}
              </div>
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-base">{artist.name}</h3>
            <p className="text-sm text-[#A0A0A0]">
              {artist.trackCount || 1} Tracks
            </p>
          </div>
          <div className="flex gap-2">
            <button 
              className="w-6 h-6 rounded-full bg-[#2A2A2A] flex items-center justify-center hover:bg-[#3A3A3A] transition-colors"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // Save artist functionality would go here
              }}
            >
              <Plus size={12} className="text-[#B3B3B3]" />
            </button>
            <button 
              className="w-6 h-6 rounded-full bg-[#2A2A2A] flex items-center justify-center hover:bg-[#3A3A3A] transition-colors"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // React to artist functionality would go here
              }}
            >
              <Smile size={12} className="text-[#B3B3B3]" />
            </button>
            <button 
              className="w-6 h-6 rounded-full bg-[#2A2A2A] flex items-center justify-center hover:bg-[#3A3A3A] transition-colors"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                window.location.href = `/thread/artist_${artist.id}`;
              }}
            >
              <MessageCircle size={12} className="text-[#B3B3B3]" />
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}