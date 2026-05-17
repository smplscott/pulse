import { Link } from "wouter";
import { Bell, LogOut, UserCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import GlobalSearch from "@/components/GlobalSearch";

export default function Header() {
  const { user, logout } = useAuth();

  const { data: unreadData } = useQuery<{ count: number }>({
    queryKey: ["/api/notifications/unread-count"],
    enabled: !!user,
    refetchInterval: 30000,
  });

  const unreadCount = unreadData?.count ?? 0;

  const initials = user?.displayName
    ? user.displayName.slice(0, 2).toUpperCase()
    : user?.username.slice(0, 2).toUpperCase() || "?";

  return (
    <header className="sticky top-0 z-50 bg-[#121212] border-b border-[#3E3E3E] px-4 py-3 flex justify-between items-center">
      <div className="flex items-center space-x-2">
        <Link href="/">
          <h1 className="font-bold text-xl cursor-pointer green-gradient-text">PULSE</h1>
        </Link>
      </div>

      {user && (
        <div className="flex items-center space-x-3">
          <GlobalSearch />
          <Link href="/notifications">
            <button className="text-[#B3B3B3] hover:text-white relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 flex items-center justify-center bg-[#5271ff] text-white text-[9px] font-bold rounded-full px-0.5 leading-none">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="focus:outline-none">
                <Avatar className="w-8 h-8 cursor-pointer">
                  {user.profilePicture ? (
                    <AvatarImage src={user.profilePicture} alt={user.username} />
                  ) : (
                    <AvatarFallback className="bg-[#1DB954] text-black text-xs font-bold">
                      {initials}
                    </AvatarFallback>
                  )}
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="bg-[#1A1A1A] border-[#3E3E3E] text-white min-w-[160px]"
            >
              <div className="px-3 py-2">
                <p className="text-sm font-semibold text-white">{user.displayName || user.username}</p>
                <p className="text-xs text-[#B3B3B3]">@{user.username}</p>
              </div>
              <DropdownMenuSeparator className="bg-[#3E3E3E]" />
              <Link href="/profile">
                <DropdownMenuItem className="cursor-pointer hover:bg-[#2A2A2A] focus:bg-[#2A2A2A]">
                  <UserCircle className="h-4 w-4 mr-2" />
                  Profile
                </DropdownMenuItem>
              </Link>
              <DropdownMenuSeparator className="bg-[#3E3E3E]" />
              <DropdownMenuItem
                onClick={() => logout()}
                className="cursor-pointer text-red-400 hover:bg-[#2A2A2A] focus:bg-[#2A2A2A] hover:text-red-400 focus:text-red-400"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </header>
  );
}
