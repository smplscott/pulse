import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Thread, User, Comment, SongRecommendation, Song, Artist, Venue, Playlist } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ChevronLeft, ArrowUp, MessageCircle, Share2, Play, Music2, 
  CheckCircle, MoreHorizontal, Heart, Repeat, Send, ThumbsUp
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatRelativeTime, formatNumber, cn } from "@/lib/utils";
import { useState } from "react";
import { useMusic } from "@/hooks/useMusic";

export default function ThreadDetail() {
  const params = useParams<{ id: string }>();
  const { toast } = useToast();
  const { upvoteSong } = useMusic();
  const [commentText, setCommentText] = useState("");
  const [artistContentTab, setArtistContentTab] = useState("singles");

  // Handle different content types in thread ID format (e.g., "artist_1", "venue_2")
  const threadIdParam = params.id;
  let threadId: number;
  let contentType: string | null = null;
  let contentId: number | null = null;
  
  if (threadIdParam.includes('_')) {
    // Format is "type_id" (e.g., "artist_1", "venue_2")
    const [type, id] = threadIdParam.split('_');
    contentType = type;
    contentId = parseInt(id);
    threadId = parseInt(id); // Use the same ID temporarily, we'll fetch related thread
  } else {
    // Regular thread ID
    threadId = parseInt(threadIdParam);
  }
  
  // Mock user ID - in a real app this would come from auth context
  const userId = 1;

  // Fetch content based on type if this is a content-specific thread
  const { data: artistContent } = useQuery<Artist>({
    queryKey: [`/api/artists/${contentId}`],
    enabled: !!contentId && contentType === 'artist',
  });

  const { data: venueContent } = useQuery<Venue>({
    queryKey: [`/api/venues/${contentId}`],
    enabled: !!contentId && contentType === 'venue',
  });

  const { data: playlistContent } = useQuery<Playlist>({
    queryKey: [`/api/playlists/${contentId}`],
    enabled: !!contentId && contentType === 'playlist',
  });

  const { data: songContent } = useQuery<Song>({
    queryKey: [`/api/songs/${contentId}`],
    enabled: !!contentId && contentType === 'song',
  });

  const { data: thread, isLoading: isLoadingThread } = useQuery<Thread>({
    queryKey: [`/api/threads/${threadId}`],
    enabled: !contentType, // Only fetch thread data if this is not a content-specific page
  });

  const { data: user, isLoading: isLoadingUser } = useQuery<User>({
    queryKey: [`/api/users/${thread?.userId || 1}`], // Use user 1 as default for content pages
    enabled: !!thread?.userId || !!contentType,
  });

  const { data: comments, isLoading: isLoadingComments } = useQuery<Comment[]>({
    queryKey: [`/api/threads/${threadId}/comments`],
    enabled: !contentType, // For content pages, we'll create mock comments or load differently
  });

  // Mock comments for artist pages when no thread exists
  const mockComments = contentType ? [
    {
      id: 1,
      content: "Just discovered this artist through their latest EP - the production quality is insane! 🔥",
      createdAt: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
      upvotes: 12,
      userId: 2
    },
    {
      id: 2,
      content: "Saw them live last month at Watergate. Absolutely incredible set, the crowd was going wild!",
      createdAt: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
      upvotes: 8,
      userId: 3
    },
    {
      id: 3,
      content: "Anyone know if they're touring this year? Would love to catch them in NYC",
      createdAt: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
      upvotes: 3,
      userId: 4
    },
    {
      id: 4,
      content: "That collab with Âme is pure perfection. Been on repeat all week!",
      createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
      upvotes: 15,
      userId: 5
    },
    {
      id: 5,
      content: "New to their music - where should I start? Looking for their best tracks",
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      upvotes: 5,
      userId: 6
    }
  ] : undefined;

  const { data: recommendations, isLoading: isLoadingRecommendations } = useQuery<SongRecommendation[]>({
    queryKey: [`/api/threads/${threadId}/recommendations`],
  });

  // Content type checks
  const isArtistThread = contentType === 'artist';
  const isVenueThread = contentType === 'venue';
  const isPlaylistThread = contentType === 'playlist';
  const isSongThread = contentType === 'song';
  const isSongRequest = thread?.type === 'song_request';

  // Artist content tabs
  const artistContentTabs = [
    { id: "singles", label: "Singles & EPs" },
    { id: "albums", label: "Albums" },
    { id: "live", label: "Live Performances" },
    { id: "featured", label: "Featured On" },
  ];

  const getContentTitle = () => {
    if (isArtistThread && artistContent) return artistContent.name;
    if (isVenueThread && venueContent) return venueContent.name;
    if (isPlaylistThread && playlistContent) return playlistContent.title;
    if (isSongThread && songContent) return songContent.title;
    return thread?.title || 'Discussion';
  };

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      const result = await apiRequest(`/api/comments`, {
        method: 'POST',
        body: JSON.stringify({
          content,
          threadId: threadId,
          userId: userId,
        }),
      });
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/threads/${threadId}/comments`] });
      setCommentText("");
      toast({
        title: "Comment added!",
        description: "Your comment has been posted.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add comment. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Upvote comment mutation
  const upvoteCommentMutation = useMutation({
    mutationFn: async (commentId: number) => {
      const result = await apiRequest(`/api/comments/${commentId}/upvote`, {
        method: 'POST',
      });
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/threads/${threadId}/comments`] });
      toast({
        title: "Comment upvoted!",
        description: "Your vote has been recorded.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to upvote comment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (commentText.trim()) {
      addCommentMutation.mutate(commentText.trim());
    }
  };

  const upvoteComment = async (commentId: number) => {
    try {
      await upvoteCommentMutation.mutateAsync(commentId);
    } catch (error) {
      console.error('Failed to upvote comment:', error);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="flex items-center justify-between p-4 border-b border-[#222222]">
        <div className="flex items-center space-x-4">
          <Link href="/">
            <button className="text-white">
              <ChevronLeft className="h-6 w-6" />
            </button>
          </Link>
          <h1 className="text-lg font-semibold">
            {isArtistThread ? "Artist Thread" : 
             isVenueThread ? "Venue Thread" : 
             isPlaylistThread ? "Playlist Thread" :
             isSongThread ? "Song Thread" :
             isSongRequest ? "What's This Song" : "Thread"}
          </h1>
          <button className="text-[#5271ff]">
            <MoreHorizontal className="h-5 w-5" />
          </button>
        </div>
      </header>
      
      <main className="px-4 pb-20">
        {isLoadingThread || isLoadingUser ? (
          <>
            <div className="py-4 border-b border-[#222222]">
              <div className="flex items-start space-x-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-5 w-40 mb-2" />
                  <Skeleton className="h-4 w-24 mb-3" />
                  <Skeleton className="h-20 w-full mb-4" />
                </div>
              </div>
              <div className="flex items-center justify-between pt-2">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-24" />
              </div>
            </div>
          </>
        ) : (thread && user) || (contentType && user) ? (
          <>
            {/* Content-specific header for artist/venue/playlist/song threads */}
            {(isArtistThread || isVenueThread || isPlaylistThread || isSongThread) && (
              <div className="relative py-4 border-b border-[#333333] bg-[#1A1A1A] -mx-4 px-4 mb-4">
                <div className="flex items-center space-x-3">
                  {/* Image for the content */}
                  <div className="w-16 h-16 rounded-md overflow-hidden bg-[#282828] flex-shrink-0">
                    {isArtistThread && artistContent?.profilePicture && (
                      <img src={artistContent.profilePicture} alt={artistContent.name} className="w-full h-full object-cover" />
                    )}
                    {isVenueThread && venueContent?.image && (
                      <img src={venueContent.image} alt={venueContent.name} className="w-full h-full object-cover" />
                    )}
                    {isPlaylistThread && playlistContent?.image && (
                      <img src={playlistContent.image} alt={playlistContent.title} className="w-full h-full object-cover" />
                    )}
                    {isSongThread && songContent?.albumArt && (
                      <img src={songContent.albumArt} alt={songContent.title} className="w-full h-full object-cover" />
                    )}
                  </div>
                  
                  {/* Content details */}
                  <div className="flex-1">
                    <h2 className="font-bold text-xl">{getContentTitle()}</h2>
                    <div className="text-sm text-[#B3B3B3] flex items-center">
                      {isArtistThread && (
                        <span>{artistContent?.genres?.[0] || 'Artist'}</span>
                      )}
                      {isVenueThread && (
                        <span>{venueContent?.location || 'Venue'}</span>
                      )}
                      {isPlaylistThread && (
                        <span>{playlistContent?.description || 'Playlist'}</span>
                      )}
                      {isSongThread && (
                        <span>{songContent?.artist || 'Song'}</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Song Action Buttons - only shown for song threads */}
                  {isSongThread && (
                    <div className="self-start flex space-x-2">
                      <Link href={`/credits/${contentId}`}>
                        <button className="bg-transparent border border-[#333] text-gray-300 hover:bg-[#333] hover:text-white text-xs px-3 py-1 rounded">
                          Credits
                        </button>
                      </Link>
                      <Link href={`/samples/${contentId}`}>
                        <button className="bg-transparent border border-[#333] text-gray-300 hover:bg-[#333] hover:text-white text-xs px-3 py-1 rounded">
                          Samples
                        </button>
                      </Link>
                    </div>
                  )}
                  
                  {/* Artist badge - moved to top right for better spacing */}
                  {isArtistThread && (
                    <div className="self-start">
                      <Badge
                        variant="default"
                        className="artist-badge text-xs px-2 py-0.5 rounded-sm"
                      >
                        Artist
                      </Badge>
                    </div>
                  )}
                </div>
                
                {/* Artist content type tabs - only shown for artist threads */}
                {isArtistThread && (
                  <div className="mt-4 flex space-x-2 overflow-x-auto scrollbar-hide">
                    {artistContentTabs.map((tab) => (
                      <button
                        key={tab.id}
                        className={cn(
                          "px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap",
                          artistContentTab === tab.id
                            ? "artist-tab-active"
                            : "bg-[#181818] text-[#B3B3B3]"
                        )}
                        onClick={() => setArtistContentTab(tab.id)}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {/* Discussion section - flowing comments, no single thread post */}
            <div className="pb-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <h2 className="text-lg font-semibold text-white">Discussion</h2>
                  <span className="text-sm text-[#707070]">
                    {(comments || mockComments) && (comments || mockComments).length > 0 ? `${(comments || mockComments).length} comments` : 'Join the conversation'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="text-xs text-[#707070] hover:text-white px-2 py-1 rounded">
                    Sort by votes
                  </button>
                </div>
              </div>
              
              {/* Comments Section - Real Sports Style Flowing Discussion */}
              {isLoadingComments ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-[#0a0a0a] border-l-2 border-[#333] px-3 py-3">
                      <div className="flex items-start space-x-3">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="flex-1">
                          <Skeleton className="h-4 w-20 mb-2" />
                          <Skeleton className="h-6 w-3/4 mb-2" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (comments || mockComments) && (comments || mockComments).length > 0 ? (
                <div className="space-y-1 max-h-[calc(70vh-180px)] overflow-y-auto">
                  {(comments || mockComments).map((comment, index) => (
                    <div key={comment.id} className="bg-[#0a0a0a] border-l-2 border-[#333] px-3 py-3 hover:bg-[#111]">
                      <div className="flex items-start space-x-3">
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarFallback className="bg-[#444] text-white text-xs">
                            U
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-sm text-white truncate">
                              {contentType ? 
                                ['techno_lover', 'berlin_vibes', 'warehouse_kid', 'beat_seeker', 'groove_master'][index % 5] : 
                                'Anonymous'
                              }
                            </span>
                          </div>
                          <p className="text-sm text-gray-200 mt-1 leading-tight break-words">{comment.content}</p>
                          
                          {/* Comment actions row - Real Sports style */}
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center space-x-4">
                              <span className="text-xs text-gray-500">
                                {comment.createdAt ? formatRelativeTime(new Date(comment.createdAt)) : 'Now'}
                              </span>
                              <button className="text-xs font-bold hover:opacity-80" style={{background: 'linear-gradient(to right, #b388eb, #ff6fd8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'}}>
                                reply
                              </button>
                              <button className="text-xs text-gray-500 hover:text-gray-400">
                                •••
                              </button>
                              <span className="text-xs text-gray-500">General</span>
                            </div>
                            
                            {/* Upvote/Downvote section */}
                            <div className="flex items-center space-x-2">
                              <button 
                                className="flex items-center space-x-1 text-xs text-gray-400 hover:text-orange-500 transition-colors"
                                onClick={() => upvoteComment(comment.id)}
                              >
                                <svg className="w-3 h-3 rotate-180" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                                <span className="font-bold" style={{background: 'linear-gradient(to right, #b388eb, #ff6fd8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'}}>{comment.upvotes || 0}</span>
                              </button>
                              <button className="flex items-center text-xs text-gray-400 hover:text-gray-200 transition-colors">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-[#0a0a0a] border-l-2 border-[#333] px-4">
                  <p className="text-[#909090]">No comments yet</p>
                  <p className="text-xs text-[#707070] mt-1">Be the first to join the conversation</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-10">
            <p className="text-[#B3B3B3]">Thread not found</p>
            <Link href="/">
              <button className="mt-4 bg-[#282828] hover:bg-[#3E3E3E] text-white py-2 px-4 rounded-full text-sm font-medium">
                Back to Home
              </button>
            </Link>
          </div>
        )}
      </main>
      
      {/* Chat input fixed at bottom */}
      {((thread && user) || (contentType && user)) && (
        <div className="fixed bottom-[72px] left-0 right-0 border-t border-[#222222] bg-black px-3 py-2 z-40">
          <form onSubmit={handleCommentSubmit} className="flex items-center space-x-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Message the group..."
                className="w-full bg-[#121212] border border-[#333333] rounded-full py-2 pl-3 pr-8 outline-none text-white placeholder:text-[#707070] text-sm"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
              />
            </div>
            <button 
              type="submit"
              className={`w-8 h-8 flex items-center justify-center pink-gradient rounded-full ${!commentText.trim() || addCommentMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={!commentText.trim() || addCommentMutation.isPending}
            >
              {addCommentMutation.isPending ? (
                <div className="h-4 w-4 border-2 border-t-transparent border-white rounded-full animate-spin" />
              ) : (
                <Send className="h-4 w-4 text-white" />
              )}
            </button>
          </form>
        </div>
      )}
      
      <BottomNav />
    </div>
  );
}