import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { StarIcon, MessageCircleIcon, Plus, Smile, Bookmark } from "lucide-react";
import { Venue } from "@shared/schema";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type VenueCardProps = {
  venue: Venue;
  className?: string;
};

export default function VenueCard({ venue, className }: VenueCardProps) {
  const upcomingEvents = Array.isArray(venue.upcomingEvents) ? (venue.upcomingEvents as Array<{ date: string; artist: string; ticketsUrl?: string }>) : [];
  const hasUpcomingEvents = upcomingEvents.length > 0;
  const firstEvent = hasUpcomingEvents ? upcomingEvents[0] : null;
  const isTonight = firstEvent && new Date(firstEvent.date).toDateString() === new Date().toDateString();
  
  return (
    <Link href={`/thread/venue_${venue.id}`}>
      <div className={cn("bg-[#181818] rounded-lg overflow-hidden cursor-pointer", className)}>
        <div className="relative h-48">
          {venue.image && (
            <img
              src={venue.image}
              alt={venue.name}
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
          <div className="absolute bottom-4 left-4">
            <Badge 
              variant={isTonight ? "default" : "active"} 
              className="text-xs px-2 py-0.5 rounded-sm mb-1 inline-block"
            >
              {isTonight ? "TONIGHT" : "UPCOMING"}
            </Badge>
            <h3 className="font-bold text-xl">{venue.name}</h3>
            <p className="text-sm text-[#B3B3B3]">{venue.location}</p>
          </div>
        </div>
        <div className="p-4">
          <div className="flex justify-between items-center mb-3">
            <div className="flex space-x-2">
              {Array.isArray(venue.genres) && (venue.genres as string[]).slice(0, 2).map((genre, index) => (
                <Badge key={index} variant="genre" className="text-xs px-2 py-0.5 rounded-full">
                  {genre}
                </Badge>
              ))}
            </div>
            <div className="flex items-center">
              <StarIcon className="h-3 w-3 text-[#ff6fd8] mr-1" />
              <span className="text-sm">{((venue.rating ?? 0) / 10).toFixed(1)}</span>
            </div>
          </div>
          <p className="text-sm mb-4">{venue.description}</p>
          
          {/* Bottom CTAs container */}
          <div className="flex justify-between items-end">
            {/* Left side: Grey icon CTAs */}
            <div className="flex items-center space-x-0.5">
              <button 
                className="w-7 h-7 rounded-full bg-[#282828] flex items-center justify-center hover:bg-[#3E3E3E] transition"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                <Bookmark className="h-3 w-3 text-[#B3B3B3] hover:text-white" />
              </button>
              
              <button 
                className="w-7 h-7 rounded-full bg-[#282828] flex items-center justify-center hover:bg-[#3E3E3E] transition"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                <Smile className="h-3 w-3 text-[#B3B3B3] hover:text-white" />
              </button>
            </div>
            
            {/* Right side: Smaller Drop In button */}
            <button 
              className="px-4 py-1.5 rounded-full pink-gradient pink-gradient-hover text-white text-xs font-medium transition-colors flex items-center"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                window.location.href = `/thread/venue_${venue.id}`;
              }}
            >
              <MessageCircleIcon className="h-3 w-3 mr-1" />
              Drop In
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
