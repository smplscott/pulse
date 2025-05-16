import { Link, useLocation } from "wouter";
import { HomeIcon, SearchIcon, Music2Icon, UserIcon, PlusIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export default function BottomNav() {
  const [location] = useLocation();

  const navItems = [
    { icon: HomeIcon, label: "Home", path: "/" },
    { icon: SearchIcon, label: "Discover", path: "/discover" },
    { icon: PlusIcon, label: "Create", path: "/create-thread", isSpecial: true },
    { icon: Music2Icon, label: "Library", path: "/library" },
    { icon: UserIcon, label: "Profile", path: "/profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#121212] border-t border-[#3E3E3E] px-2 py-1 flex justify-between">
      {navItems.map((item) => (
        <Link key={item.path} href={item.path}>
          <button
            className={cn(
              "flex flex-col items-center justify-center py-1 px-3",
              location === item.path ? "text-[#E51D3E]" : "text-[#B3B3B3]"
            )}
          >
            {item.isSpecial ? (
              <div className="w-10 h-10 rounded-full bg-[#E51D3E] flex items-center justify-center text-white">
                <item.icon className="h-5 w-5" />
              </div>
            ) : (
              <>
                <item.icon className="h-5 w-5" />
                <span className="text-xs mt-1">{item.label}</span>
              </>
            )}
          </button>
        </Link>
      ))}
    </nav>
  );
}
