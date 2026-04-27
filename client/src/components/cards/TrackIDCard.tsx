import { Link } from "wouter";
import { MusicSet } from "@shared/schema";
import { ListMusic, MessageCircleIcon } from "lucide-react";

type TrackIDCardProps = {
  set: MusicSet;
  className?: string;
};

export default function TrackIDCard({ set, className }: TrackIDCardProps) {
  return (
    <Link href={`/sets/${set.id}`}>
      <div className={`flex-shrink-0 w-40 bg-[#181818] rounded-lg overflow-hidden cursor-pointer hover:bg-[#282828] transition ${className || ""}`}>
        <div className="relative">
          {set.image ? (
            <img
              src={set.image}
              alt={`${set.title} cover`}
              className="w-full h-40 object-cover"
            />
          ) : (
            <div className="w-full h-40 bg-[#282828] flex items-center justify-center">
              <ListMusic className="h-10 w-10 text-[#B3B3B3]" />
            </div>
          )}
          <div className="absolute top-2 right-2">
            <span className="text-xs bg-[#4ade80] text-black px-2 py-0.5 rounded-sm font-semibold">
              track IDs
            </span>
          </div>
        </div>
        <div className="p-3">
          <p className="font-semibold text-sm truncate">{set.title}</p>
          <div className="flex justify-between items-center mt-1">
            <p className="text-xs text-[#B3B3B3]">by {set.curator}</p>
            <button
              className="flex items-center text-xs text-[#5271ff]"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
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
