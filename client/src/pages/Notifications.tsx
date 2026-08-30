import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Bell, MessageCircle, Bookmark, CheckCheck, ChevronLeft, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Notification as AppNotification } from "@shared/schema";

function timeAgo(date: string | Date | null): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function Notifications() {
  const { data: notifications, isLoading } = useQuery<AppNotification[]>({
    queryKey: ["/api/notifications"],
  });

  const markAllRead = useMutation({
    mutationFn: () => apiRequest("POST", "/api/notifications/read-all"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
  });

  const markRead = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/api/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
  });

  const unreadCount = notifications?.filter(n => !n.read).length ?? 0;

  return (
    <div className="min-h-screen pb-32">
      <Header />
      <main className="px-4 pt-4 max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Link href="/">
              <button className="text-[#B3B3B3] hover:text-white mr-1">
                <ChevronLeft className="h-5 w-5" />
              </button>
            </Link>
            <h1 className="text-xl font-bold">Notifications</h1>
            {unreadCount > 0 && (
              <span className="text-xs bg-[#c2f970] text-black rounded-full px-2 py-0.5 font-semibold">
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-[#b388eb] hover:text-[#b388eb] hover:bg-[#b388eb]/10 text-xs"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
            >
              <CheckCheck className="h-3.5 w-3.5 mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        ) : !notifications || notifications.length === 0 ? (
          <div className="text-center py-16">
            <Bell className="h-12 w-12 text-[#3E3E3E] mx-auto mb-4" />
            <p className="text-[#B3B3B3] text-sm">No notifications yet</p>
            <p className="text-[#666] text-xs mt-1">Thread activity and wishlist show matches appear here</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map(n => {
              const isMatch = n.type === "wishlist_match";
              const href = isMatch
                ? "/radar"
                : `/thread/${n.threadId}`;
              return (
                <Link key={n.id} href={href}>
                  <div
                    onClick={() => !n.read && markRead.mutate(n.id)}
                    className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition ${
                      n.read ? "bg-[#181818] hover:bg-[#1e1e1e]" : "bg-[#180e24] hover:bg-[#1e1230] border border-[#b388eb]/20"
                    }`}
                  >
                    <div className={`mt-0.5 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      n.type === "comment"
                        ? "bg-[#b388eb]/20"
                        : isMatch
                          ? "bg-[#c2f970]/15"
                          : "bg-emerald-500/20"
                    }`}>
                      {n.type === "comment" ? (
                        <MessageCircle className="h-4 w-4 text-[#b388eb]" />
                      ) : isMatch ? (
                        <Ticket className="h-4 w-4 text-[#c2f970]" />
                      ) : (
                        <Bookmark className="h-4 w-4 text-emerald-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white leading-snug">
                        {isMatch ? (
                          <>
                            <span className="font-semibold">Radar match</span>
                            <span className="text-[#B3B3B3]"> — {n.threadTitle}</span>
                          </>
                        ) : (
                          <>
                            <span className="font-semibold">{n.actorUsername}</span>
                            {n.type === "comment" ? " commented on " : " saved "}
                            <span className="text-[#B3B3B3] italic">"{n.threadTitle}"</span>
                          </>
                        )}
                      </p>
                      <p className="text-xs text-[#666] mt-0.5">{timeAgo(n.createdAt)}</p>
                    </div>
                    {!n.read && (
                      <div className="flex-shrink-0 mt-1.5 w-2 h-2 rounded-full bg-[#c2f970]" />
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
