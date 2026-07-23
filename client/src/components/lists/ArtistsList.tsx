import { Artist } from "@shared/schema";
import { Link } from "wouter";
import { Smile, MessageCircle } from "lucide-react";

type ArtistsListProps = {
  artists: Artist[];
  title?: string;
}

export default function ArtistsList({ artists, title }: ArtistsListProps) {
  return (
    <div className="space-y-2">
      {title && (
        <h2 className="text-lg font-semibold mb-3">{title}</h2>
      )}
      
      <div className="space-y-2">
        {artists.map((artist) => (
          <ArtistListItem key={artist.id} artist={artist} />
        ))}
      </div>
    </div>
  );
}

function ArtistListItem({ artist }: { artist: Artist }) {
  // Generate a static number for tracks to display
  // In a real application, this would come from the API
  const trackCount = 1;
  
  return (
    <Link href={`/thread/artist_${artist.id}`}>
      <div 
        className="py-3 px-4 bg-[#1A1A1A] rounded-lg cursor-pointer hover:bg-[#252525] transition-colors"
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
              {trackCount} Tracks
            </p>
          </div>
          <div className="flex gap-2">
            <button 
              className="w-10 h-10 rounded-full bg-[#252525] flex items-center justify-center"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // Like artist functionality would go here
              }}
            >
              <Smile className="w-5 h-5 text-[#E5E5E5]" />
            </button>
            <button 
              className="w-10 h-10 rounded-full bg-[#252525] flex items-center justify-center"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                window.location.href = `/thread/artist_${artist.id}`;
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