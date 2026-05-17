import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { MessageSquare, Music2, MapPin, Edit, Mic } from "lucide-react";
import { Link } from "wouter";
import ThreadCard from "@/components/cards/ThreadCard";
import { useAuth } from "@/context/AuthContext";
import { Thread } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

type PublicUser = {
  id: number;
  username: string;
  displayName?: string | null;
  bio?: string | null;
  city?: string | null;
  profilePicture?: string | null;
  favoriteGenres?: string[];
  showReviewCount?: number;
  placesCount?: number;
};

const TASTE_COLORS: Record<string, string> = {
  "Electronic": "bg-[#5271ff]/20 text-[#5271ff]",
  "Rock": "bg-rose-500/20 text-rose-400",
  "Pop": "bg-pink-500/20 text-pink-400",
  "R&B": "bg-purple-500/20 text-purple-400",
  "Hip-Hop": "bg-amber-500/20 text-amber-400",
  "House": "bg-teal-500/20 text-teal-400",
  "Techno": "bg-cyan-500/20 text-cyan-400",
  "Jazz": "bg-orange-500/20 text-orange-400",
  "Soul": "bg-violet-500/20 text-violet-400",
};

function tasteColor(genre: string): string {
  return TASTE_COLORS[genre] ?? "bg-[#282828] text-[#B3B3B3]";
}

function IWasThereTag() {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#5271ff]/15 text-[#5271ff] border border-[#5271ff]/30 uppercase tracking-wide">
      <Mic className="h-2.5 w-2.5" />
      I was there
    </span>
  );
}

function EditProfileDialog({ user, onUpdated }: { user: PublicUser; onUpdated: () => void }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [displayName, setDisplayName] = useState(user.displayName ?? "");
  const [bio, setBio] = useState(user.bio ?? "");
  const [city, setCity] = useState(user.city ?? "");

  const mutation = useMutation({
    mutationFn: (body: { displayName?: string; bio?: string; city?: string | null }) =>
      apiRequest("PATCH", `/api/users/${user.id}`, body),
    onSuccess: async () => {
      await onUpdated();
      setOpen(false);
      toast({ title: "Profile updated" });
    },
    onError: () => {
      toast({ title: "Failed to update profile", variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="text-[#B3B3B3] hover:text-white flex-shrink-0">
          <Edit className="h-4 w-4" />
        </button>
      </DialogTrigger>
      <DialogContent className="bg-[#111] border-[#333] text-white max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-xs text-[#B3B3B3] font-medium">Display name</label>
            <Input
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              maxLength={50}
              className="bg-[#1a1a1a] border-[#333] text-white"
              placeholder="Your name"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-[#B3B3B3] font-medium">City / scene</label>
            <Input
              value={city}
              onChange={e => setCity(e.target.value)}
              maxLength={100}
              className="bg-[#1a1a1a] border-[#333] text-white"
              placeholder="e.g. East London, Berlin, Detroit"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-[#B3B3B3] font-medium">Bio</label>
            <Textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              maxLength={300}
              rows={3}
              className="bg-[#1a1a1a] border-[#333] text-white resize-none"
              placeholder="Tell the community about your taste…"
            />
            <p className="text-right text-[10px] text-[#555]">{bio.length}/300</p>
          </div>
          <div className="flex gap-2 pt-1">
            <Button
              variant="outline"
              className="flex-1 border-[#333] text-[#B3B3B3] hover:bg-[#222]"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-[#5271ff] hover:bg-[#3f5be0] text-white"
              onClick={() =>
                mutation.mutate({
                  displayName: displayName || undefined,
                  bio: bio || undefined,
                  city: city || null,
                })
              }
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Profile() {
  const { username } = useParams<{ username?: string }>();
  const { user: authUser } = useAuth();

  const isOwnProfile = !username || username === authUser?.username;
  const resolvedUsername = username || authUser?.username;

  const { data: profileUser, isLoading: isLoadingUser } = useQuery<PublicUser>({
    queryKey: [`/api/users/username/${resolvedUsername}`],
    enabled: !!resolvedUsername,
  });

  const userId = profileUser?.id;

  const { data: startedThreads, isLoading: isLoadingStarted } = useQuery<Thread[]>({
    queryKey: [`/api/users/${userId}/threads`],
    enabled: !!userId,
  });

  const { data: engagedThreads, isLoading: isLoadingEngaged } = useQuery<Thread[]>({
    queryKey: [`/api/users/${userId}/threads/engaged`],
    enabled: !!userId,
  });

  const genres = (profileUser?.favoriteGenres as string[] | undefined) ?? [];

  const handleProfileUpdated = async () => {
    await queryClient.invalidateQueries({ queryKey: [`/api/users/username/${resolvedUsername}`] });
  };

  return (
    <div className="min-h-screen pb-32">
      <Header />
      <main>
        {isLoadingUser ? (
          <div className="pt-6 px-4 space-y-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-20 w-20 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
          </div>
        ) : profileUser ? (
          <div className="px-4 pt-5">
            {/* Avatar + name row */}
            <div className="flex items-start gap-4 mb-4">
              <div className="w-20 h-20 rounded-full bg-[#282828] overflow-hidden flex-shrink-0 border-2 border-[#5271ff]">
                {profileUser.profilePicture ? (
                  <img src={profileUser.profilePicture} alt={profileUser.username} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#3E3E3E]">
                    <span className="text-2xl font-bold text-white">
                      {(profileUser.displayName || profileUser.username).charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0 pt-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold truncate">
                    {profileUser.displayName || profileUser.username}
                  </h1>
                  {isOwnProfile && profileUser && (
                    <EditProfileDialog user={profileUser} onUpdated={handleProfileUpdated} />
                  )}
                </div>
                <p className="text-sm text-[#B3B3B3]">@{profileUser.username}</p>
                {profileUser.city && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3 w-3 text-[#666]" />
                    <span className="text-xs text-[#888]">{profileUser.city}</span>
                  </div>
                )}
                {profileUser.bio && (
                  <p className="text-sm text-white mt-1.5 leading-relaxed">{profileUser.bio}</p>
                )}
              </div>
            </div>

            {/* Music taste tags */}
            {genres.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <Music2 className="h-3.5 w-3.5 text-[#666]" />
                  <span className="text-xs text-[#666] font-medium">Music taste</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {genres.slice(0, 8).map(g => (
                    <span key={g} className={`text-xs px-2.5 py-1 rounded-full font-medium ${tasteColor(g)}`}>
                      {g}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* IRL Stats — 3-tile grid */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="bg-[#181818] rounded-lg p-3 text-center">
                <p className="text-lg font-bold">{startedThreads?.length ?? "—"}</p>
                <p className="text-xs text-[#B3B3B3]">Threads started</p>
              </div>
              <div className="bg-[#181818] rounded-lg p-3 text-center">
                <p className="text-lg font-bold">{profileUser.showReviewCount ?? "—"}</p>
                <p className="text-xs text-[#B3B3B3]">Shows attended</p>
              </div>
              <div className="bg-[#181818] rounded-lg p-3 text-center">
                <p className="text-lg font-bold">{profileUser.placesCount ?? "—"}</p>
                <p className="text-xs text-[#B3B3B3]">Places added</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="pt-12 px-4 text-center">
            <p className="text-[#B3B3B3]">User not found</p>
          </div>
        )}

        {/* Tabs */}
        {profileUser && (
          <Tabs defaultValue="started" className="px-4 pt-2">
            <TabsList className="w-full bg-[#181818] border border-[#3E3E3E]">
              <TabsTrigger value="started" className="flex-1">
                <MessageSquare className="h-4 w-4 mr-2" />
                Started
              </TabsTrigger>
              <TabsTrigger value="engaged" className="flex-1">
                <MapPin className="h-4 w-4 mr-2" />
                Engaged
              </TabsTrigger>
            </TabsList>

            <TabsContent value="started" className="mt-4 space-y-4 pb-4">
              {isLoadingStarted ? (
                [1, 2, 3].map(i => <Skeleton key={i} className="h-36 w-full" />)
              ) : startedThreads && startedThreads.length > 0 ? (
                startedThreads.map(t => (
                  <div key={t.id}>
                    {t.threadType === "live_show_review" && (
                      <div className="mb-1.5">
                        <IWasThereTag />
                      </div>
                    )}
                    <ThreadCard thread={t} />
                  </div>
                ))
              ) : (
                <div className="bg-[#181818] rounded-lg p-8 text-center">
                  <MessageSquare className="h-10 w-10 text-[#3E3E3E] mx-auto mb-3" />
                  <p className="text-sm text-[#B3B3B3]">No threads started yet</p>
                  {isOwnProfile && (
                    <Link href="/create-thread">
                      <button className="mt-3 text-xs text-[#5271ff] hover:underline">
                        Create your first thread
                      </button>
                    </Link>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="engaged" className="mt-4 space-y-4 pb-4">
              {isLoadingEngaged ? (
                [1, 2, 3].map(i => <Skeleton key={i} className="h-36 w-full" />)
              ) : engagedThreads && engagedThreads.length > 0 ? (
                engagedThreads.map(t => <ThreadCard key={t.id} thread={t} />)
              ) : (
                <div className="bg-[#181818] rounded-lg p-8 text-center">
                  <MessageSquare className="h-10 w-10 text-[#3E3E3E] mx-auto mb-3" />
                  <p className="text-sm text-[#B3B3B3]">No thread activity yet</p>
                  {isOwnProfile && (
                    <Link href="/threads">
                      <button className="mt-3 text-xs text-[#5271ff] hover:underline">
                        Browse threads
                      </button>
                    </Link>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
