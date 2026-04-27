import { Link, useLocation } from "wouter";
import { MessageCircle, Music2Icon, UserIcon, Disc3, MicVocalIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export default function BottomNav() {
  const [location] = useLocation();

  const navItems = [
    { icon: MessageCircle, label: "Threads", path: "/" },
    { icon: MicVocalIcon, label: "Artists", path: "/artists" },
    { icon: Music2Icon, label: "Songs", path: "/songs" },
    { icon: Disc3, label: "Sets", path: "/sets" },
    { icon: UserIcon, label: "Profile", path: "/profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#121212] border-t border-[#3E3E3E] px-2 py-1 flex justify-around z-50">
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
