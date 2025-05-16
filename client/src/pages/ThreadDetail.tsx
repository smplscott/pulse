import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import MusicPlayer from "@/components/layout/MusicPlayer";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Thread, User, Comment, SongRecommendation, Song } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ChevronLeft, ArrowUp, MessageCircle, Share2, Play, Music2, 
  CheckCircle, MoreHorizontal, Heart, Repeat, Send, ThumbsUp
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatRelativeTime, formatNumber } from "@/lib/utils";
import { useState } from "react";
import { useMusic } from "@/hooks/useMusic";

export default function ThreadDetail() {
  const params = useParams<{ id: string }>();
  const threadId = parseInt(params.id);
  const { toast } = useToast();
  const { playSong } = useMusic();
  const [commentText, setCommentText] = useState("");

  // Mock user ID - in a real app this would come from auth context
  const userId = 1;

  const { data: thread, isLoading: isLoadingThread } = useQuery<Thread>({
    queryKey: [`/api/threads/${threadId}`],
  });

  const { data: user, isLoading: isLoadingUser } = useQuery<User>({
    queryKey: [`/api/users/${thread?.userId}`],
    enabled: !!thread?.userId,
  });

  const { data: comments, isLoading: isLoadingComments } = useQuery<Comment[]>({
    queryKey: [`/api/threads/${threadId}/comments`],
    enabled: !!threadId,
  });

  const { data: recommendations, isLoading: isLoadingRecommendations } = useQuery<SongRecommendation[]>({
    queryKey: [`/api/threads/${threadId}/recommendations`],
    enabled: !!threadId,
  });

  // Mutation for upvoting a thread
  const upvoteThreadMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/threads/${threadId}/upvote`, undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/threads/${threadId}`] });
      toast({
        description: "Thread has been upvoted",
      });
    },
    onError: () => {
      toast({
        description: "Failed to upvote thread",
        variant: "destructive",
      });
    },
  });

  // Mutation for adding a comment
  const addCommentMutation = useMutation({
    mutationFn: (content: string) => 
      apiRequest("POST", "/api/comments", { threadId, userId, content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/threads/${threadId}/comments`] });
      queryClient.invalidateQueries({ queryKey: [`/api/threads/${threadId}`] });
      setCommentText("");
      toast({
        description: "Your comment has been posted",
      });
    },
    onError: () => {
      toast({
        description: "Failed to post comment",
        variant: "destructive",
      });
    },
  });

  // Handle comment submission
  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (commentText.trim()) {
      addCommentMutation.mutate(commentText);
    }
  };

  // Handle upvote/like
  const handleUpvote = () => {
    upvoteThreadMutation.mutate();
  };

  // Handle share
  const handleShare = () => {
    // In a real app, this would use the Web Share API or similar
    toast({
      description: "Thread link copied to clipboard",
    });
  };

  const isSongRequest = thread?.type === "song_request";
  const isSolved = thread?.status === "solved";
  const threadViewCount = thread?.upvotes ? thread.upvotes * 5 : 0; // Simulated view count

  return (
    <div className="min-h-screen pb-32 bg-black">
      <header className="border-b border-[#222222] sticky top-0 z-10 bg-black">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href={isSongRequest ? "/whats-this-song" : "/"}>
            <div className="flex items-center cursor-pointer">
              <ChevronLeft className="h-5 w-5 mr-2" />
            </div>
          </Link>
          <h1 className="text-base font-semibold">
            {isSongRequest ? "What's This Song" : "Thread"}
          </h1>
          <button className="text-[#E51D3E]">
            <MoreHorizontal className="h-5 w-5" />
          </button>
        </div>
      </header>
      
      <main className="px-4">
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
        ) : thread && user ? (
          <>
            <div className="py-4 border-b border-[#222222]">
              <div className="flex items-start space-x-3">
                <Avatar className="w-10 h-10">
                  {user.profilePicture ? (
                    <AvatarImage src={user.profilePicture} alt={user.username} />
                  ) : (
                    <AvatarFallback className="bg-[#3E3E3E]">
                      {user.username?.substring(0, 2).toUpperCase() || "U"}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{user.displayName || user.username}</p>
                    <Badge 
                      variant={isSolved ? "solved" : (thread.upvotes || 0) > 100 ? "hot" : "status"} 
                      className="text-xs px-2 py-0.5 rounded-full"
                    >
                      {isSolved ? "Solved" : (thread.upvotes || 0) > 100 ? "Hot" : "Active"}
                    </Badge>
                  </div>
                  <p className="text-xs text-[#A0A0A0] mb-1">
                    @{user.username}
                  </p>

                  {thread.title && (
                    <h2 className="text-lg font-bold mb-2">{thread.title}</h2>
                  )}
                  <p className="text-[#E5E5E5] mb-4">{thread.content}</p>

                  {/* Song Request Status */}
                  {isSongRequest && isSolved && recommendations && recommendations.length > 0 && (
                    <SolvedSongDisplay recommendationId={recommendations[0].id} songId={recommendations[0].songId} />
                  )}
                  
                  <div className="text-xs text-[#A0A0A0] mt-2 flex items-center">
                    {formatRelativeTime(new Date(thread.createdAt || new Date()))} • {formatNumber(threadViewCount)} views
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#222222]">
                <button 
                  className="flex items-center text-[#B3B3B3] hover:text-[#E51D3E]"
                  onClick={handleUpvote}
                >
                  <Heart className={`h-5 w-5 ${(thread.upvotes || 0) > 0 ? "text-[#E51D3E] fill-[#E51D3E]" : ""}`} />
                </button>
                <button className="flex items-center text-[#B3B3B3] hover:text-white">
                  <MessageCircle className="h-5 w-5" />
                </button>
                <button className="flex items-center text-[#B3B3B3] hover:text-white">
                  <Repeat className="h-5 w-5" />
                </button>
                <button 
                  className="flex items-center text-[#B3B3B3] hover:text-white"
                  onClick={handleShare}
                >
                  <Share2 className="h-5 w-5" />
                </button>
              </div>
              
              <div className="mt-3 text-[#A0A0A0] text-sm">
                <span className="font-semibold text-white">{formatNumber(thread.upvotes || 0)}</span> likes • <span className="font-semibold text-white">{formatNumber(thread.commentsCount || 0)}</span> replies
              </div>
            </div>
            
            <div className="border-t border-[#3E3E3E] pt-4 mb-6">
              {isLoadingRecommendations ? (
                <>
                  {isSongRequest && (
                    <>
                      <h2 className="text-lg font-semibold mb-3">Song Suggestions</h2>
                      <Skeleton className="h-24 w-full mb-4" />
                      <Skeleton className="h-24 w-full mb-4" />
                    </>
                  )}
                </>
              ) : recommendations && recommendations.length > 0 && isSongRequest ? (
                <>
                  <h2 className="text-lg font-semibold mb-3">Song Suggestions</h2>
                  <div className="space-y-3 mb-6">
                    {recommendations.map((recommendation) => (
                      <SongRecommendationCard 
                        key={recommendation.id} 
                        recommendation={recommendation} 
                        solved={isSolved}
                      />
                    ))}
                  </div>
                </>
              ) : isSongRequest ? (
                <div className="bg-[#181818] rounded-lg p-4 text-center mb-6">
                  <p className="text-[#B3B3B3]">No song suggestions yet</p>
                  <button className="mt-2 bg-[#E51D3E] text-white py-1.5 px-4 rounded-full text-sm font-medium">
                    Suggest a Song
                  </button>
                </div>
              ) : null}
              
              <h2 className="text-sm font-semibold mb-3 text-[#A0A0A0]">Replies</h2>
              
              {/* Comments list */}
              {isLoadingComments ? (
                <>
                  <div className="space-y-5">
                    <div className="flex items-start space-x-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-32 mb-2" />
                        <Skeleton className="h-16 w-full" />
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-32 mb-2" />
                        <Skeleton className="h-16 w-full" />
                      </div>
                    </div>
                  </div>
                </>
              ) : comments && comments.length > 0 ? (
                <div className="space-y-5">
                  {comments.map((comment) => (
                    <CommentCard key={comment.id} comment={comment} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-5">
                  <p className="text-[#A0A0A0]">No replies yet</p>
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
      
      {/* Comment input fixed at bottom */}
      {thread && (
        <div className="fixed bottom-0 left-0 right-0 border-t border-[#222222] bg-black px-4 py-3">
          <form onSubmit={handleCommentSubmit} className="flex items-center space-x-3">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-[#3E3E3E]">
                {"U"}
              </AvatarFallback>
            </Avatar>
            <input
              type="text"
              placeholder="Add a reply..."
              className="flex-1 bg-transparent border-none outline-none text-[#B3B3B3] placeholder:text-[#707070]"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
            />
            <button 
              type="submit"
              className={`text-[#E51D3E] ${!commentText.trim() || addCommentMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={!commentText.trim() || addCommentMutation.isPending}
            >
              {addCommentMutation.isPending ? (
                <div className="h-5 w-5 border-2 border-t-transparent border-[#E51D3E] rounded-full animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function CommentCard({ comment }: { comment: Comment }) {
  const { data: user } = useQuery<User>({
    queryKey: [`/api/users/${comment.userId}`],
  });

  // Safely handle date conversion
  const createdAt = comment.createdAt ? new Date(comment.createdAt) : new Date();
  
  return (
    <div className="py-1 border-b border-[#1A1A1A]">
      <div className="flex items-start space-x-3">
        <Avatar className="w-8 h-8">
          {user?.profilePicture ? (
            <AvatarImage src={user.profilePicture} alt={user.username} />
          ) : (
            <AvatarFallback className="bg-[#3E3E3E] text-xs">
              {user?.username?.substring(0, 2).toUpperCase() || "U"}
            </AvatarFallback>
          )}
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center">
            <p className="font-semibold text-sm">{user?.displayName || user?.username || "User"}</p>
            <p className="text-xs text-[#707070] ml-1">@{user?.username || "user"}</p>
            <p className="text-xs text-[#707070] ml-auto">{formatRelativeTime(createdAt)}</p>
          </div>
          <p className="text-sm mt-1 mb-2">{comment.content}</p>
          
          <div className="flex items-center space-x-4 mb-1">
            <button className="flex items-center text-[#707070] hover:text-[#E51D3E]">
              <Heart className={`h-4 w-4 ${(comment.upvotes || 0) > 0 ? "text-[#E51D3E] fill-[#E51D3E]" : ""}`} />
            </button>
            <p className="text-xs text-[#707070]">
              {(comment.upvotes || 0) > 0 && <span className="text-white">{comment.upvotes}</span>}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SongRecommendationCard({ recommendation, solved }: { recommendation: SongRecommendation, solved: boolean }) {
  const { data: user } = useQuery<User>({
    queryKey: [`/api/users/${recommendation.userId}`],
  });

  const { data: song } = useQuery<Song>({
    queryKey: [`/api/songs/${recommendation.songId}`],
  });

  const { playSong } = useMusic();
  
  if (!song) return null;
  
  return (
    <div className={`bg-[#181818] rounded-lg p-4 ${solved ? 'border-2 border-[#1DB954]' : ''}`}>
      <div className="flex items-start space-x-3 mb-3">
        <Avatar className="w-8 h-8">
          {user?.profilePicture ? (
            <AvatarImage src={user.profilePicture} alt={user.username} />
          ) : (
            <AvatarFallback className="bg-[#3E3E3E] text-xs">
              {user?.username?.substring(0, 2).toUpperCase() || "U"}
            </AvatarFallback>
          )}
        </Avatar>
        <div>
          <p className="font-medium text-sm">{user?.displayName || user?.username || "User"}</p>
          <p className="text-xs text-[#B3B3B3]">suggested:</p>
        </div>
        {solved && (
          <div className="ml-auto">
            <Badge variant="active" className="bg-[#1DB954] text-xs">
              <CheckCircle className="h-3 w-3 mr-1" />
              Correct
            </Badge>
          </div>
        )}
      </div>
      
      <div className="flex items-center bg-[#282828] rounded-md p-3">
        <div className="w-10 h-10 bg-[#3E3E3E] rounded overflow-hidden mr-3">
          {song.albumArt ? (
            <img src={song.albumArt} alt={song.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Music2 className="h-5 w-5 text-[#B3B3B3]" />
            </div>
          )}
        </div>
        <div className="flex-1">
          <p className="font-medium text-sm">{song.title}</p>
          <p className="text-xs text-[#B3B3B3]">
            {song.artist}
          </p>
        </div>
        <button 
          className="w-8 h-8 rounded-full bg-[#1DB954] flex items-center justify-center"
          onClick={() => playSong(song)}
        >
          <Play className="h-4 w-4 text-white" />
        </button>
      </div>
      
      {recommendation.comment && (
        <p className="text-sm text-[#B3B3B3] mt-2 ml-11">{recommendation.comment}</p>
      )}
      
      <div className="flex items-center ml-11 mt-2">
        <button className="flex items-center text-[#B3B3B3] hover:text-white text-xs">
          <ArrowUp className="h-3.5 w-3.5 mr-1" />
          <span>{recommendation.upvotes}</span>
        </button>
      </div>
    </div>
  );
}

function SolvedSongDisplay({ recommendationId, songId }: { recommendationId: number, songId: number }) {
  const { data: song } = useQuery<Song>({
    queryKey: [`/api/songs/${songId}`],
  });

  const { playSong } = useMusic();
  
  if (!song) return null;

  return (
    <div className="bg-[#1DB954]/10 border border-[#1DB954] rounded-lg p-4 mb-4">
      <div className="flex items-center mb-2">
        <CheckCircle className="h-5 w-5 text-[#1DB954] mr-2" />
        <p className="font-medium">Track Identified!</p>
      </div>
      
      <div className="flex items-center bg-[#121212] rounded-md p-3">
        <div className="w-10 h-10 bg-[#3E3E3E] rounded overflow-hidden mr-3">
          {song.albumArt ? (
            <img src={song.albumArt} alt={song.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Music2 className="h-5 w-5 text-[#B3B3B3]" />
            </div>
          )}
        </div>
        <div className="flex-1">
          <p className="font-medium text-sm">{song.title}</p>
          <p className="text-xs text-[#B3B3B3]">
            {song.artist}
          </p>
        </div>
        <button 
          className="w-8 h-8 rounded-full bg-[#1DB954] flex items-center justify-center"
          onClick={() => playSong(song)}
        >
          <Play className="h-4 w-4 text-white" />
        </button>
      </div>
    </div>
  );
}