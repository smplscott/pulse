import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useLocation } from "wouter";
import Header from "@/components/layout/Header";
import TabNavigator from "@/components/layout/TabNavigator";
import BottomNav from "@/components/layout/BottomNav";
import { Input } from "@/components/ui/input";
import { Thread } from "@shared/schema";
import { SearchIcon, MessageCircle, Music, User, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { formatRelativeTime } from "@/lib/utils";

export default function Threads() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const { toast } = useToast();
  const [_, navigate] = useLocation();

  const tabs = [
    { label: "For You", path: "/" },
    { label: "Discover", path: "/discover" },
    { label: "Threads", path: "/threads" },
    { label: "What's That Song", path: "/whats-this-song" },
    { label: "Live Venues", path: "/venues" },
  ];

  const filters = [
    { id: "all", label: "All", icon: <MessageCircle className="w-4 h-4" /> },
    { id: "music", label: "Music", icon: <Music className="w-4 h-4" /> },
    { id: "community", label: "Community", icon: <User className="w-4 h-4" /> },
    { id: "events", label: "Events", icon: <Calendar className="w-4 h-4" /> }
  ];

  const { data: threads, isLoading: isLoadingThreads } = useQuery<Thread[]>({
    queryKey: ["/api/threads"],
  });

  // Get the user for a thread
  const getUserById = (userId: number) => {
    return `User #${userId}`;
  };

  // Filter threads based on search query
  const filteredThreads = threads?.filter(
    (thread) => {
      const matchesSearch = searchQuery === "" || 
        thread.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        thread.content.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesFilter = selectedFilter === "all" ? true :
        selectedFilter === "music" ? thread.type === "music" :
        selectedFilter === "community" ? thread.type === "community" :
        selectedFilter === "events" ? thread.type === "event" : false;
      
      return matchesSearch && matchesFilter;
    }
  );

  // Select only the top 3 threads for the featured section
  const featuredThreads = filteredThreads?.slice(0, 3);
  
  // The rest of the threads for the infinite scroll section
  const remainingThreads = filteredThreads?.slice(3);

  return (
    <div className="min-h-screen pb-32">
      <Header />
      <TabNavigator tabs={tabs} />
      
      <main className="px-4 py-4">
        <div className="flex items-center mb-6">
          <div className="flex-1 relative flex">
            <div className="flex-1 relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#B3B3B3]" size={18} />
              <Input
                type="text"
                placeholder="Search discussion threads..."
                className="pl-9 pr-12 bg-[#282828] border-[#3E3E3E] text-white placeholder:text-[#B3B3B3]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <button 
            className="ml-2 w-10 h-10 rounded-lg pink-gradient flex items-center justify-center pink-gradient-hover"
            onClick={() => navigate("/create-thread")}
          >
            <span className="text-white text-xl font-bold">+</span>
          </button>
        </div>
        
        {/* Thread filters (horizontal scrollable buttons) */}
        <div className="mb-6 overflow-x-auto scrollbar-hide whitespace-nowrap pb-2">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setSelectedFilter(filter.id)}
              className={`mr-3 px-4 py-1.5 rounded-full text-sm font-medium inline-flex items-center gap-2 ${
                selectedFilter === filter.id 
                  ? "pink-gradient text-white" 
                  : "bg-[#282828] text-[#B3B3B3]"
              }`}
            >
              {filter.icon}
              {filter.label}
            </button>
          ))}
        </div>

        {/* Featured threads section */}
        <div className="mb-6">
          <h2 className="text-white font-bold text-xl mb-4">Featured Discussions</h2>
          {isLoadingThreads ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : featuredThreads && featuredThreads.length > 0 ? (
            <div className="space-y-4">
              {featuredThreads.map((thread) => (
                <div 
                  key={thread.id}
                  className="bg-[#181818] rounded-lg p-4 cursor-pointer hover:bg-[#282828] transition-colors"
                  onClick={() => navigate(`/thread/${thread.id}`)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-white font-semibold text-lg">{thread.title}</h3>
                    <Badge className={`${
                      thread.type === "music" ? "green-gradient" : 
                      thread.type === "community" ? "pink-gradient" : 
                      "bg-[#5271ff]"
                    } text-white`}>
                      {thread.type.charAt(0).toUpperCase() + thread.type.slice(1)}
                    </Badge>
                  </div>
                  <p className="text-[#B3B3B3] text-sm line-clamp-2 mb-3">{thread.content}</p>
                  <div className="flex justify-between items-center text-xs text-[#808080]">
                    <div className="flex items-center gap-2">
                      <span>{getUserById(thread.userId)}</span>
                      <span>•</span>
                      <span>{formatRelativeTime(new Date(thread.createdAt || ''))}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>{thread.commentsCount || 0}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M7 11L12 6L17 11M12 18V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span>{thread.upvotes}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-[#B3B3B3]">
                {searchQuery ? "No threads found matching your search" : "No threads available"}
              </p>
            </div>
          )}
        </div>

        {/* Discussion Threads - "Infinite scroll" section */}
        <div>
          <h2 className="text-white font-bold text-xl mb-4">Discussion Threads</h2>
          {!isLoadingThreads && remainingThreads && remainingThreads.length > 0 ? (
            <div className="space-y-4">
              {remainingThreads.map((thread) => (
                <div 
                  key={thread.id}
                  className="bg-[#181818] rounded-lg p-4 cursor-pointer hover:bg-[#282828] transition-colors"
                  onClick={() => navigate(`/thread/${thread.id}`)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-white font-semibold text-lg">{thread.title}</h3>
                    <Badge className={`${
                      thread.type === "music" ? "green-gradient" : 
                      thread.type === "community" ? "pink-gradient" : 
                      "bg-[#5271ff]"
                    } text-white`}>
                      {thread.type.charAt(0).toUpperCase() + thread.type.slice(1)}
                    </Badge>
                  </div>
                  <p className="text-[#B3B3B3] text-sm line-clamp-2 mb-3">{thread.content}</p>
                  <div className="flex justify-between items-center text-xs text-[#808080]">
                    <div className="flex items-center gap-2">
                      <span>{getUserById(thread.userId)}</span>
                      <span>•</span>
                      <span>{formatRelativeTime(new Date(thread.createdAt || ''))}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>{thread.commentsCount || 0}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M7 11L12 6L17 11M12 18V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span>{thread.upvotes}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : !isLoadingThreads && (
            <div className="text-center py-10">
              <p className="text-[#B3B3B3]">
                {searchQuery ? "No more threads found" : "No more threads available"}
              </p>
            </div>
          )}
        </div>
      </main>
      
      <BottomNav />
    </div>
  );
}