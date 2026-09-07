import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bookmark } from "lucide-react";
import { WANT_TO_GO_LIST_NAME } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

export default function WantToGoButton({
  placeId,
  compact,
}: {
  placeId: number;
  compact?: boolean;
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: lists } = useQuery<Array<{ id: number; name: string }>>({
    queryKey: ["/api/users", user?.id, "place-lists"],
    enabled: !!user?.id,
  });

  const wantList = lists?.find(list => list.name === WANT_TO_GO_LIST_NAME);

  const { data: items } = useQuery<Array<{ placeId: number }>>({
    queryKey: ["/api/place-lists", wantList?.id, "items"],
    enabled: !!wantList?.id,
  });

  const saved = !!items?.some(item => item.placeId === placeId);

  const toggle = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/places/${placeId}/want-to-go`, { want: !saved });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", user?.id, "place-lists"] });
      queryClient.invalidateQueries({ queryKey: ["/api/place-lists"] });
    },
    onError: (err: Error) => toast({ title: err.message, variant: "destructive" }),
  });

  if (!user) return null;

  return (
    <button
      type="button"
      onClick={event => {
        event.preventDefault();
        event.stopPropagation();
        toggle.mutate();
      }}
      className={
        compact
          ? `rounded-lg p-1.5 ${saved ? "text-[#1DB954]" : "text-muted-foreground hover:text-white"}`
          : `flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium ${
              saved ? "bg-[#1DB954] text-black" : "bg-white/10 text-white"
            }`
      }
      aria-label={saved ? "Remove from Want to go" : "Want to go"}
    >
      <Bookmark className={`h-4 w-4 ${saved ? "fill-current" : ""}`} />
      {!compact && "Want to go"}
    </button>
  );
}
