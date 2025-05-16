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
import { ChevronLeft, ArrowUp, MessageCircle, Share2, Play, Music2, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatRelativeTime } from "@/lib/utils";
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
        title: "Upvoted",
        description: "Thread has been upvoted",
      });
    },
    onError: () => {
      toast({
        title: "Error",
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
        title: "Comment Added",
        description: "Your comment has been posted",
      });
    },
    onError: () => {
      toast({
        title: "Error",
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

  // Handle upvote
  const handleUpvote = () => {
    upvoteThreadMutation.mutate();
  };

  // Handle share
  const handleShare = () => {
    // In a real app, this would use the Web Share API or similar
    toast({
      title: "Share Link",
      description: "Thread link copied to clipboard",
    });
  };

  const isSongRequest = thread?.type === "song_request";
  const isSolved = thread?.status === "solved";

  return (
    <div className="min-h-screen pb-32">
      <Header />
      
      <main className="pt-4 px-4">
        <Link href={isSongRequest ? "/whats-this-song" : "/discover"}>
          <div className="flex items-center mb-4 cursor-pointer">
            <ChevronLeft className="h-6 w-6 mr-2" />
            <span className="text-lg font-medium">
              {isSongRequest ? "What's This Song" : "Thread"}
            </span>
          </div>
        </Link>
        
        {isLoadingThread || isLoadingUser ? (
          <>
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2 mb-4" />
            <Skeleton className="h-32 w-full mb-4" />
            <div className="flex justify-between mb-6">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-24" />
            </div>
          </>
        ) : thread && user ? (
          <>
            <div className="mb-6">
              <div className="flex items-start space-x-3 mb-4">
                <Avatar className="w-10 h-10">
                  {user.profilePicture ? (
                    <AvatarImage src={user.profilePicture} alt={user.username} />
                  ) : (
                    <AvatarFallback className="bg-[#3E3E3E]">
                      {user.username?.substring(0, 2).toUpperCase() || "U"}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <p className="font-medium">{user.displayName || user.username}</p>
                  <p className="text-xs text-[#B3B3B3]">
                    @{user.username} • {formatRelativeTime(new Date(thread.createdAt))}
                  </p>
                </div>
                
                <div className="ml-auto">
                  <Badge 
                    variant={isSolved ? "solved" : thread.upvotes > 100 ? "hot" : "status"} 
                    className="text-xs px-2 py-0.5 rounded-full"
                  >
                    {isSolved ? "Solved" : thread.upvotes > 100 ? "Hot" : "Active"}
                  </Badge>
                </div>
              </div>
              
              <h1 className="text-xl font-bold mb-3">{thread.title}</h1>
              <p className="text-[#E5E5E5] mb-4">{thread.content}</p>
              
              {/* Song Request Status */}
              {isSongRequest && isSolved && recommendations && recommendations.length > 0 && (
                <SolvedSongDisplay recommendationId={recommendations[0].id} songId={recommendations[0].songId} />
              )}
              
              <div className="flex items-center space-x-6 mt-4">
                <button 
                  className="flex items-center text-[#B3B3B3] hover:text-white"
                  onClick={handleUpvote}
                >
                  <ArrowUp className="h-5 w-5 mr-1" />
                  <span>{thread.upvotes}</span>
                </button>
                <button className="flex items-center text-[#B3B3B3] hover:text-white">
                  <MessageCircle className="h-5 w-5 mr-1" />
                  <span>{thread.commentsCount}</span>
                </button>
                <button 
                  className="flex items-center text-[#B3B3B3] hover:text-white ml-auto"
                  onClick={handleShare}
                >
                  <Share2 className="h-5 w-5" />
                </button>
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
              
              <h2 className="text-lg font-semibold mb-3">Comments</h2>
              
              {/* Comment form */}
              <form onSubmit={handleCommentSubmit} className="mb-6">
                <Textarea
                  placeholder="Add a comment..."
                  className="bg-[#282828] border-[#3E3E3E] placeholder:text-[#B3B3B3] mb-2"
                  rows={3}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                />
                <div className="flex justify-end">
                  <Button 
                    type="submit"
                    className="bg-[#E51D3E] hover:bg-[#c21835] text-white"
                    disabled={!commentText.trim() || addCommentMutation.isPending}
                  >
                    {addCommentMutation.isPending ? "Posting..." : "Post Comment"}
                  </Button>
                </div>
              </form>
              
              {/* Comments list */}
              {isLoadingComments ? (
                <>
                  <Skeleton className="h-24 w-full mb-4" />
                  <Skeleton className="h-24 w-full mb-4" />
                </>
              ) : comments && comments.length > 0 ? (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <CommentCard key={comment.id} comment={comment} />
                  ))}
                </div>
              ) : (
                <div className="bg-[#181818] rounded-lg p-4 text-center">
                  <p className="text-[#B3B3B3]">No comments yet. Be the first to comment!</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-10">
            <p className="text-[#B3B3B3]">Thread not found</p>
            <Link href="/">
              <button className="mt-4 bg-[#282828] hover:bg-[#3E3E3E] text-white py-2 px-6 rounded-lg text-sm font-medium">
                Back to Home
              </button>
            </Link>
          </div>
        )}
      </main>
      
      <MusicPlayer />
      <BottomNav />
    </div>
  );
}

function CommentCard({ comment }: { comment: Comment }) {
  const { data: user } = useQuery<User>({
    queryKey: [`/api/users/${comment.userId}`],
  });

  const createdAt = new Date(comment.createdAt);
  
  return (
    <div className="bg-[#181818] rounded-lg p-4">
      <div className="flex items-start space-x-3 mb-2">
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
          <p className="text-xs text-[#B3B3B3]">{formatRelativeTime(createdAt)}</p>
        </div>
        <button className="ml-auto flex items-center text-[#B3B3B3] hover:text-white">
          <ArrowUp className="h-4 w-4 mr-1" />
          <span className="text-xs">{comment.upvotes}</span>
        </button>
      </div>
      <p className="text-sm ml-11">{comment.content}</p>
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
            {song.features && song.features.length > 0
              ? `${song.artist}, ${song.features.join(", ")}`
              : song.artist}
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
            {song.features && song.features.length > 0
              ? `${song.artist}, ${song.features.join(", ")}`
              : song.artist}
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
