import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { StarIcon, MessageCircleIcon } from "lucide-react";
import { Venue } from "@shared/schema";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type VenueCardProps = {
  venue: Venue;
  className?: string;
};

export default function VenueCard({ venue, className }: VenueCardProps) {
  const hasUpcomingEvents = venue.upcomingEvents && venue.upcomingEvents.length > 0;
  const firstEvent = hasUpcomingEvents ? venue.upcomingEvents[0] : null;
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
              {venue.genres && venue.genres.slice(0, 2).map((genre, index) => (
                <Badge key={index} variant="genre" className="text-xs px-2 py-0.5 rounded-full">
                  {genre}
                </Badge>
              ))}
            </div>
            <div className="flex items-center">
              <StarIcon className="h-3 w-3 text-[#E51D3E] mr-1" />
              <span className="text-sm">{(venue.rating / 10).toFixed(1)}</span>
            </div>
          </div>
          <p className="text-sm mb-3">{venue.description}</p>
          <div className="flex justify-between items-center">
            {venue.currentDj && (
              <div className="flex items-center">
                <Avatar className="w-6 h-6">
                  <AvatarFallback className="bg-[#3E3E3E] text-xs">
                    {venue.currentDj.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs ml-2">DJ Tonight: {venue.currentDj}</span>
              </div>
            )}
            <button 
              className="text-sm font-medium text-[#E51D3E] flex items-center"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                window.location.href = `/thread/venue_${venue.id}`;
              }}
            >
              <MessageCircleIcon className="h-3 w-3 mr-1" />
              Join Discussion
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
