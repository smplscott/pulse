import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Song } from "@shared/schema";

export function useMusic() {
  const { toast } = useToast();

  /**
   * Upvote a song (increase its ranking)
   */
  const upvoteSong = async (songId: number) => {
    try {
      await apiRequest("POST", `/api/songs/${songId}/upvote`, undefined);
      toast({
        title: "Upvoted!",
        description: "Song ranking has been increased",
      });
      return true;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upvote song",
        variant: "destructive",
      });
      return false;
    }
  };

  /**
   * Add a song to user's favorites
   */
  const addToFavorites = async (userId: number, songId: number) => {
    try {
      await apiRequest("POST", `/api/users/${userId}/favorites`, { songId });
      toast({
        title: "Added to favorites",
        description: "Song has been added to your favorites",
      });
      return true;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add song to favorites",
        variant: "destructive",
      });
      return false;
    }
  };

  /**
   * Add a song to a playlist
   */
  const addToPlaylist = async (playlistId: number, songId: number) => {
    try {
      await apiRequest("POST", `/api/playlists/${playlistId}/songs`, { songId });
      toast({
        title: "Added to playlist",
        description: "Song has been added to the playlist",
      });
      return true;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add song to playlist",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    upvoteSong,
    addToFavorites,
    addToPlaylist
  };
}
