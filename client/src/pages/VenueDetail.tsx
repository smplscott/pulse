import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import MusicPlayer from "@/components/layout/MusicPlayer";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Venue } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ChevronLeft, 
  MapPin, 
  Star, 
  Share2, 
  Calendar, 
  Link as LinkIcon, 
  ExternalLink, 
  Clock, 
  Music2 
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function VenueDetail() {
  const params = useParams<{ id: string }>();
  const venueId = parseInt(params.id);
  const { toast } = useToast();

  const { data: venue, isLoading } = useQuery<Venue>({
    queryKey: [`/api/venues/${venueId}`],
  });

  // Handler for saving venue to favorites
  const handleSaveVenue = () => {
    toast({
      title: "Venue Saved",
      description: `${venue?.name} has been added to your saved venues`,
    });
  };

  // Handler for sharing venue
  const handleShare = () => {
    // In a real app, this would use the Web Share API or similar
    toast({
      title: "Share Link",
      description: "Venue link copied to clipboard",
    });
  };

  // Check if the venue has events tonight
  const today = new Date().toDateString();
  const venueEvents = venue?.upcomingEvents ?? [];
  const hasEventsTonight = venueEvents.some(
    event => new Date(event.date).toDateString() === today
  );

  return (
    <div className="min-h-screen pb-32">
      <Header />
      
      {isLoading ? (
        <div className="pt-4 px-4">
          <div className="flex items-center mb-4">
            <ChevronLeft className="h-6 w-6 mr-2" />
            <Skeleton className="h-6 w-40" />
          </div>
          <Skeleton className="h-64 w-full mb-4" />
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-32 mb-4" />
          <div className="flex space-x-4 mb-6">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
        </div>
      ) : venue ? (
        <>
          <div className="pt-4 px-4">
            <Link href="/venues">
              <div className="flex items-center mb-4 cursor-pointer">
                <ChevronLeft className="h-6 w-6 mr-2" />
                <span className="text-lg font-medium">Venue</span>
              </div>
            </Link>
            
            <div className="relative h-64 rounded-xl overflow-hidden mb-4">
              {venue.image ? (
                <img
                  src={venue.image}
                  alt={venue.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-[#282828] flex items-center justify-center">
                  <Music2 className="h-16 w-16 text-[#B3B3B3]" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
              <div className="absolute bottom-4 left-4 right-4">
                {hasEventsTonight ? (
                  <Badge variant="default" className="text-xs mb-2">
                    TONIGHT
                  </Badge>
                ) : (
                  <Badge variant="active" className="text-xs mb-2">
                    UPCOMING
                  </Badge>
                )}
                <h1 className="text-3xl font-bold">{venue.name}</h1>
                <div className="flex items-center text-[#B3B3B3]">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span className="text-sm">{venue.location}</span>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between items-center mb-6">
              <div className="flex space-x-2">
                {(venue.genres ?? []).map((genre, index) => (
                  <Badge key={index} variant="genre" className="text-xs">
                    {genre}
                  </Badge>
                ))}
              </div>
              <div className="flex items-center">
                <Star className="h-4 w-4 text-[#c2f970] mr-1" />
                <span className="text-sm">{((venue.rating ?? 0) / 10).toFixed(1)}</span>
              </div>
            </div>
            
            <div className="flex space-x-4 mb-8">
              <button 
                className="flex-1 pink-gradient pink-gradient-hover text-white py-2 px-4 rounded-full text-sm font-medium flex items-center justify-center"
                onClick={handleSaveVenue}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Save Venue
              </button>
              <button 
                className="w-10 h-10 rounded-full bg-[#282828] flex items-center justify-center"
                onClick={handleShare}
              >
                <Share2 className="h-5 w-5 text-white" />
              </button>
              <a 
                href={`https://maps.google.com/?q=${venue.name},${venue.location}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-[#282828] flex items-center justify-center"
              >
                <ExternalLink className="h-5 w-5 text-white" />
              </a>
            </div>
            
            {venue.description && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-2">About</h2>
                <p className="text-sm text-[#B3B3B3]">{venue.description}</p>
              </div>
            )}
          </div>
          
          <div className="px-4 mb-6">
            <h2 className="text-lg font-semibold mb-4">Upcoming Events</h2>
            
            {venueEvents.length > 0 ? (
              <div className="space-y-3">
                {venueEvents.map((event, index) => {
                  const eventDate = new Date(event.date);
                  const isToday = eventDate.toDateString() === today;
                  
                  return (
                    <div key={index} className="bg-[#181818] rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-[#282828] rounded-full mr-3 flex items-center justify-center text-xs">
                            <div className="text-center">
                              <div className="font-bold">
                                {eventDate.getDate()}
                              </div>
                              <div className="text-[10px] uppercase">
                                {eventDate.toLocaleString('default', { month: 'short' })}
                              </div>
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center">
                              <p className="font-medium">{event.artist}</p>
                              {isToday && (
                                <Badge variant="default" className="ml-2 text-xs">
                                  TONIGHT
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center text-xs text-[#B3B3B3]">
                              <Clock className="h-3 w-3 mr-1" />
                              <span>Doors: 8:00 PM</span>
                            </div>
                          </div>
                        </div>
                        {event.ticketsUrl && (
                          <a
                            href={event.ticketsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-[#282828] text-white py-1.5 px-3 rounded-full text-xs font-medium hover:bg-[#3E3E3E]"
                          >
                            Tickets
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-[#181818] rounded-lg p-4 text-center">
                <p className="text-[#B3B3B3]">No upcoming events</p>
              </div>
            )}
          </div>
          
          {venue.currentDj && (
            <div className="px-4 mb-8">
              <h2 className="text-lg font-semibold mb-3">Currently Playing</h2>
              <div className="bg-[#181818] rounded-lg p-4 flex items-center">
                <Avatar className="h-12 w-12 mr-4">
                  <AvatarFallback className="bg-[#3E3E3E]">
                    {venue.currentDj.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{venue.currentDj}</p>
                  <p className="text-sm text-[#B3B3B3]">DJ Set</p>
                </div>
                <div className="ml-auto">
                  <Badge className="bg-[#c1ff72] text-black text-xs">LIVE NOW</Badge>
                </div>
              </div>
            </div>
          )}
          
          <div className="px-4 mb-6">
            <h2 className="text-lg font-semibold mb-3">Community Photos</h2>
            <div className="bg-[#181818] rounded-lg p-4 text-center">
              <p className="text-[#B3B3B3]">No photos yet</p>
              <button className="mt-2 bg-[#282828] text-white py-1.5 px-4 rounded-full text-xs font-medium">
                Add Photos
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="pt-4 px-4 text-center">
          <Link href="/venues">
            <div className="flex items-center mb-4 cursor-pointer">
              <ChevronLeft className="h-6 w-6 mr-2" />
              <span className="text-lg font-medium">Back</span>
            </div>
          </Link>
          <p className="text-[#B3B3B3]">Venue not found</p>
        </div>
      )}
      
      <MusicPlayer />
      <BottomNav />
    </div>
  );
}
