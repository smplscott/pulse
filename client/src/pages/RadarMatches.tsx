import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Check, Clock, ExternalLink, MapPin, Ticket } from "lucide-react";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import type { UserTravelPlan, WishlistEventMatch } from "@shared/schema";

function formatDate(value: string | Date | null | undefined) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function RadarMatches() {
  const { user } = useAuth();
  const { toast } = useToast();
  const userId = user?.id;
  const [scope, setScope] = useState<"upcoming" | "past">("upcoming");
  const [attendingOnly, setAttendingOnly] = useState(false);

  const { data: matches = [], isLoading } = useQuery<WishlistEventMatch[]>({
    queryKey: [`/api/users/${userId}/wishlist-matches`, scope],
    queryFn: async () => {
      const res = await fetch(`/api/users/${userId}/wishlist-matches?scope=${scope}`);
      return res.json();
    },
    enabled: !!userId,
  });

  const { data: trips = [] } = useQuery<UserTravelPlan[]>({
    queryKey: [`/api/users/${userId}/travel-plans`],
    enabled: !!userId,
  });

  const { data: reviews = [] } = useQuery<{ show: { artistName: string } }[]>({
    queryKey: [`/api/users/${userId}/show-reviews`],
    enabled: !!userId,
  });

  const reviewedArtists = useMemo(
    () => new Set(reviews.map(item => item.show.artistName.trim().toLowerCase())),
    [reviews],
  );

  const visible = useMemo(() => {
    const list = attendingOnly ? matches.filter(match => match.attendingAt) : matches;
    return [...list].sort((a, b) => {
      const aTime = a.eventStartAt ? new Date(a.eventStartAt).getTime() : 0;
      const bTime = b.eventStartAt ? new Date(b.eventStartAt).getTime() : 0;
      return scope === "past" ? bTime - aTime : aTime - bTime;
    });
  }, [matches, attendingOnly, scope]);

  const reviewReminders = visible.filter(match =>
    match.attendingAt &&
    match.eventStartAt &&
    new Date(match.eventStartAt).getTime() < Date.now() &&
    !reviewedArtists.has(match.artistName.trim().toLowerCase()),
  );

  const toggleAttending = useMutation({
    mutationFn: ({ matchId, attending }: { matchId: number; attending: boolean }) =>
      apiRequest("POST", `/api/users/${userId}/wishlist-matches/${matchId}/attending`, { attending }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/wishlist-matches`] });
    },
    onError: () => toast({ title: "Couldn't update attending", variant: "destructive" }),
  });

  return (
    <div className="min-h-screen bg-[#121212] pb-32">
      <Header />
      <main className="mx-auto max-w-2xl px-4 pb-8 pt-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#ff8fbd]">Radar</p>
        <h1 className="mt-1 text-3xl font-black text-white">Matches</h1>
        <p className="mt-1 text-sm text-[#888]">Shows that line up with your artists and cities.</p>

        <div className="mt-4 flex gap-2">
          {(["upcoming", "past"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setScope(tab)}
              className={cn(
                "flex-1 rounded-full py-2 text-sm font-semibold capitalize",
                scope === tab ? "bg-[#c2f970] text-black" : "bg-[#181818] text-[#888]",
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setAttendingOnly(value => !value)}
          className={cn(
            "mt-3 rounded-full border px-3 py-1.5 text-xs font-semibold",
            attendingOnly
              ? "border-[#c2f970] bg-[#c2f970]/15 text-[#c2f970]"
              : "border-[#333] text-[#888]",
          )}
        >
          Attending
        </button>

        {reviewReminders.length > 0 && (
          <div className="mt-4 rounded-xl border border-[#c2f970]/30 bg-[#c2f970]/10 p-3">
            <p className="text-sm font-semibold text-[#c2f970]">Leave a review</p>
            <p className="mt-1 text-xs text-[#aaa]">
              You marked {reviewReminders.length} past show{reviewReminders.length === 1 ? "" : "s"} as attending.
            </p>
            <Link href="/shows">
              <span className="mt-2 inline-block text-xs font-semibold text-white underline">Write a live show review</span>
            </Link>
          </div>
        )}

        {isLoading ? (
          <div className="mt-5 space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
        ) : visible.length === 0 ? (
          <p className="mt-10 text-center text-sm text-[#777]">
            {attendingOnly ? "No attending shows in this tab." : "No matches yet. Scan from Radar."}
          </p>
        ) : (
          <div className="mt-5 space-y-3">
            {visible.map(match => {
              const trip = trips.find(item => item.id === match.travelPlanId);
              return (
                <div key={match.id} className="rounded-xl border border-[#292929] bg-[#181818] p-3">
                  <div className="flex gap-3">
                    {match.imageUrl
                      ? <img src={match.imageUrl} alt="" className="h-16 w-16 flex-shrink-0 rounded-lg object-cover" />
                      : <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg bg-[#282828]"><Ticket className="h-5 w-5 text-[#666]" /></div>}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-white">{match.artistName}</p>
                      <p className="truncate text-xs text-[#aaa]">{match.eventName}</p>
                      <p className="mt-1 flex items-center gap-1 text-[11px] text-[#666]">
                        <MapPin className="h-3 w-3" />
                        {[match.venueName, match.city].filter(Boolean).join(" · ")}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1 text-[11px] text-[#666]">
                        <Clock className="h-3 w-3" />
                        {formatDate(match.eventStartAt)}
                        {trip?.label || trip?.kind === "always_on" ? ` · ${trip.label || "Home"}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleAttending.mutate({ matchId: match.id, attending: !match.attendingAt })}
                      className={cn(
                        "flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold",
                        match.attendingAt
                          ? "border-[#c2f970] bg-[#c2f970] text-black"
                          : "border-[#333] text-[#aaa]",
                      )}
                    >
                      <Check className="h-3.5 w-3.5" />
                      {match.attendingAt ? "Attending" : "Mark attending"}
                    </button>
                    {match.ticketUrl && (
                      <a
                        href={match.ticketUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 rounded-full bg-[#c2f970]/12 px-3 py-1.5 text-xs font-semibold text-[#c2f970]"
                      >
                        <ExternalLink className="h-3.5 w-3.5" /> Tickets
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
