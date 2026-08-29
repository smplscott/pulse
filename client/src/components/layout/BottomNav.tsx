import { useState } from "react";
import { Link, useLocation } from "wouter";
import { MessageCircle, Ticket, MapPin, UserIcon, Plus, Radar } from "lucide-react";
import { cn } from "@/lib/utils";
import CreateFlowModal from "@/components/create/CreateFlowModal";

export default function BottomNav() {
  const [location] = useLocation();
  const [createOpen, setCreateOpen] = useState(false);

  const navItems = [
    { icon: MessageCircle, label: "Threads", path: "/" },
    { icon: Ticket, label: "Shows", path: "/shows" },
    { icon: Radar, label: "Radar", path: "/radar" },
    { icon: MapPin, label: "Places", path: "/places" },
    { icon: UserIcon, label: "Profile", path: "/profile" },
  ];

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 bg-[#121212] border-t border-[#3E3E3E] px-1 py-1 flex justify-around items-center z-40">
        {navItems.map((item) => (
          <Link key={item.path} href={item.path}>
            <button
              className={cn(
                "flex min-w-[58px] flex-col items-center justify-center px-1 py-1",
                location === item.path
                  ? item.path === "/radar" ? "text-[#ff83ba]" : "green-gradient-text"
                  : "text-[#B3B3B3]"
              )}
            >
              {location === item.path
                ? <item.icon className={cn("h-5 w-5", item.path === "/radar" ? "text-[#ff6fae]" : "text-[#c2f970]")} />
                : <item.icon className="h-5 w-5" />
              }
              <span className="text-xs mt-1">{item.label}</span>
            </button>
          </Link>
        ))}
      </nav>

      {/* Global floating action button */}
      <button
        onClick={() => setCreateOpen(true)}
        className="fixed bottom-20 right-4 z-40 w-14 h-14 rounded-full bg-gradient-to-r from-[#c2f970] to-[#ecffa1] hover:opacity-90 active:scale-95 transition-all flex items-center justify-center shadow-lg shadow-black/30"
        aria-label="Create"
      >
        <Plus className="h-7 w-7 text-black" strokeWidth={3} />
      </button>

      <CreateFlowModal open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}
