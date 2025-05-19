import { Link, useLocation } from "wouter";
import { HomeIcon, MapPinIcon, Music2Icon, UserIcon, ListMusicIcon, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function BottomNav() {
  const [location] = useLocation();

  const navItems = [
    { icon: HomeIcon, label: "Home", path: "/" },
    { icon: MapPinIcon, label: "Places", path: "/venues" },
    { icon: Music2Icon, label: "Songs", path: "/songs" },
    { icon: UserIcon, label: "Artists", path: "/artists" },
    { icon: ListMusicIcon, label: "Playlists", path: "/playlists" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#121212] border-t border-[#3E3E3E] px-2 py-1 flex justify-between">
      {navItems.map((item) => (
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
  );
}
