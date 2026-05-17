import { useState } from "react";
import { Link, useLocation } from "wouter";
import { MessageCircle, Ticket, MapPin, UserIcon, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import CreateFlowModal from "@/components/create/CreateFlowModal";

export default function BottomNav() {
  const [location] = useLocation();
  const [createOpen, setCreateOpen] = useState(false);

  const navItems = [
    { icon: MessageCircle, label: "Threads", path: "/" },
    { icon: Ticket, label: "Shows", path: "/shows" },
    { icon: MapPin, label: "Places", path: "/places" },
    { icon: UserIcon, label: "Profile", path: "/profile" },
  ];

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 bg-[#121212] border-t border-[#3E3E3E] px-2 py-1 flex justify-around items-center z-40">
        {/* First two nav items */}
        {navItems.slice(0, 2).map((item) => (
          <Link key={item.path} href={item.path}>
            <button
              className={cn(
                "flex flex-col items-center justify-center py-1 px-3",
                location === item.path ? "green-gradient-text" : "text-[#B3B3B3]"
              )}
            >
              {location === item.path
                ? <item.icon className="h-5 w-5 text-[#c2f970]" />
                : <item.icon className="h-5 w-5" />
              }
              <span className="text-xs mt-1">{item.label}</span>
            </button>
          </Link>
        ))}

        {/* Centre + button */}
        <button
          onClick={() => setCreateOpen(true)}
          className="flex flex-col items-center justify-center py-1 px-3 -mt-3"
          aria-label="Create"
        >
          <div className="w-12 h-12 rounded-full bg-[#5271ff] flex items-center justify-center shadow-lg shadow-[#5271ff]/30 hover:bg-[#4060ee] active:scale-95 transition-all">
            <Plus className="h-6 w-6 text-white" strokeWidth={2.5} />
          </div>
        </button>

        {/* Last two nav items */}
        {navItems.slice(2).map((item) => (
          <Link key={item.path} href={item.path}>
            <button
              className={cn(
                "flex flex-col items-center justify-center py-1 px-3",
                location === item.path ? "green-gradient-text" : "text-[#B3B3B3]"
              )}
            >
              {location === item.path
                ? <item.icon className="h-5 w-5 text-[#c2f970]" />
                : <item.icon className="h-5 w-5" />
              }
              <span className="text-xs mt-1">{item.label}</span>
            </button>
          </Link>
        ))}
      </nav>

      <CreateFlowModal open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}
