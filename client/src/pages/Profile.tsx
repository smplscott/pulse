import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import MusicPlayer from "@/components/layout/MusicPlayer";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Thread, Playlist } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Edit, Settings, MessageSquare, Music, Smile } from "lucide-react";
import { Link } from "wouter";
import ThreadCard from "@/components/cards/ThreadCard";
import TrackIDCard from "@/components/cards/TrackIDCard";

export default function Profile() {
  // Mock user ID - in a real app this would come from auth context
  const userId = 1;

  const { data: user, isLoading: isLoadingUser } = useQuery<User>({
    queryKey: [`/api/users/${userId}`],
  });

  const { data: threads, isLoading: isLoadingThreads } = useQuery<Thread[]>({
    queryKey: [`/api/threads`, { userId }],
  });

  const { data: playlists, isLoading: isLoadingPlaylists } = useQuery<Playlist[]>({
    queryKey: [`/api/users/${userId}/playlists`],
  });

  return (
    <div className="min-h-screen pb-32">
      <Header />
      
      <main>
        {isLoadingUser ? (
          <div className="pt-6 px-4">
            <Skeleton className="h-20 w-20 rounded-full mx-auto mb-4" />
            <Skeleton className="h-6 w-48 mx-auto mb-2" />
            <Skeleton className="h-4 w-32 mx-auto mb-4" />
            <div className="flex justify-center space-x-4 mb-6">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-24" />
            </div>
          </div>
        ) : user ? (
          <div className="bg-gradient-to-b from-[#3E3E3E] to-[#121212] pt-6 px-4 pb-4">
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-[#282828] overflow-hidden mb-4 border-2 border-[#5271ff]">
                {user.profilePicture ? (
                  <img src={user.profilePicture} alt={user.username} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#3E3E3E]">
                    <span className="text-2xl font-bold text-white">
                      {user.username?.substring(0, 1).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <h1 className="text-xl font-bold mb-1">{user.displayName || user.username}</h1>
              <p className="text-sm text-[#B3B3B3] mb-3">@{user.username}</p>
              
              <div className="flex space-x-4 mb-6">
                <button className="bg-white text-black py-1.5 px-4 rounded-full text-sm font-medium flex items-center">
                  <Edit className="h-3.5 w-3.5 mr-2" />
                  Edit Profile
                </button>
                <button className="bg-[#282828] text-white py-1.5 px-4 rounded-full text-sm font-medium flex items-center">
                  <Settings className="h-3.5 w-3.5 mr-2" />
                  Settings
                </button>
              </div>
              
              {/* Profile Stats */}
              <div className="grid grid-cols-3 w-full gap-2 mb-4">
                <div className="bg-[#282828] rounded-lg p-3 text-center">
                  <p className="text-lg font-bold">120</p>
                  <p className="text-xs text-[#B3B3B3]">Following</p>
                </div>
                <div className="bg-[#282828] rounded-lg p-3 text-center">
                  <p className="text-lg font-bold">348</p>
                  <p className="text-xs text-[#B3B3B3]">Followers</p>
                </div>
                <div className="bg-[#282828] rounded-lg p-3 text-center">
                  <p className="text-lg font-bold">215</p>
                  <p className="text-xs text-[#B3B3B3]">Threads</p>
                </div>
              </div>
              
              {/* Achievements */}
              <div className="w-full mb-2">
                <p className="text-sm font-medium mb-2">Community Achievements</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="status" className="green-gradient text-[#5b5b5b]">IRL Witness</Badge>
                  <Badge variant="status" className="pink-gradient">Pulse Crew</Badge>
                  <Badge variant="status" className="bg-[#FF8C00]">Threadstarter</Badge>
                  <Badge variant="status" className="bg-gradient-to-r from-[#450af5] to-[#c4efd9]">OG Member</Badge>
                  <Badge variant="status" className="bg-[#3E3E3E]">+3 more</Badge>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="pt-6 px-4 text-center">
            <p className="text-[#B3B3B3]">Failed to load user profile</p>
          </div>
        )}
        
        <Tabs defaultValue="threads" className="px-4 pt-4">
          <TabsList className="w-full bg-[#181818] border border-[#3E3E3E]">
            <TabsTrigger value="threads" className="flex-1">
              <MessageSquare className="h-4 w-4 mr-2" />
              Threads
            </TabsTrigger>
            <TabsTrigger value="likes" className="flex-1">
              <Smile className="h-4 w-4 mr-2" />
              Likes
            </TabsTrigger>
            <TabsTrigger value="playlists" className="flex-1">
              <Music className="h-4 w-4 mr-2" />
              Playlists
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="threads" className="mt-4 space-y-4">
            {isLoadingThreads ? (
              <>
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-40 w-full" />
                ))}
              </>
            ) : threads && threads.length > 0 ? (
              threads.map((thread) => (
                <ThreadCard key={thread.id} thread={thread} />
              ))
            ) : (
              <div className="bg-[#181818] rounded-lg p-8 text-center">
                <MessageSquare className="h-12 w-12 text-[#B3B3B3] mx-auto mb-3" />
                <p className="text-lg font-medium">No threads yet</p>
                <p className="text-sm text-[#B3B3B3] mt-2 mb-4">Start a conversation or share your music thoughts</p>
                <Link href="/create-thread">
                  <button className="pink-gradient pink-gradient-hover text-white py-2 px-6 rounded-full font-medium text-sm">
                    Create Thread
                  </button>
                </Link>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="likes" className="mt-4">
            <div className="bg-[#181818] rounded-lg p-8 text-center">
              <Smile className="h-12 w-12 text-[#B3B3B3] mx-auto mb-3" />
              <p className="text-lg font-medium">No liked content yet</p>
              <p className="text-sm text-[#B3B3B3] mt-2 mb-4">Upvote threads and songs to see them here</p>
              <Link href="/">
                <button className="bg-[#282828] text-white py-2 px-6 rounded-full font-medium text-sm">
                  Discover Content
                </button>
              </Link>
            </div>
          </TabsContent>
          
          <TabsContent value="playlists" className="mt-4">
            {isLoadingPlaylists ? (
              <div className="grid grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-56 w-full" />
                ))}
              </div>
            ) : playlists && playlists.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {playlists.map((playlist) => (
                  <TrackIDCard key={playlist.id} playlist={playlist} className="w-full" />
                ))}
              </div>
            ) : (
              <div className="bg-[#181818] rounded-lg p-8 text-center">
                <Music className="h-12 w-12 text-[#B3B3B3] mx-auto mb-3" />
                <p className="text-lg font-medium">No playlists yet</p>
                <p className="text-sm text-[#B3B3B3] mt-2 mb-4">Create your first playlist to share your music taste</p>
                <button className="pink-gradient pink-gradient-hover text-white py-2 px-6 rounded-full font-medium text-sm">
                  Create Playlist
                </button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
      
      <MusicPlayer />
      <BottomNav />
    </div>
  );
}
