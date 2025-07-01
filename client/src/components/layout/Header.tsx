import { Link } from "wouter";
import { Award, UserCircle, MessageCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type HeaderProps = {
  username?: string;
  profileImage?: string;
};

export default function Header({ username, profileImage }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-[#121212] border-b border-[#3E3E3E] px-4 py-3 flex justify-between items-center">
      <div className="flex items-center space-x-2">
        <Link href="/">
          <h1 className="font-bold text-xl cursor-pointer green-gradient-text">PULSE</h1>
        </Link>
        <span className="green-gradient text-xs px-2 py-0.5 rounded-full">BETA</span>
      </div>
      <div className="flex items-center space-x-4">
        <Link href="/achievements">
          <button className="text-[#B3B3B3] hover:text-white">
            <Award className="h-5 w-5" />
          </button>
        </Link>
        <Link href="/messages">
          <button className="text-[#B3B3B3] hover:text-white">
            <MessageCircle className="h-5 w-5" />
          </button>
        </Link>
        <Link href="/profile">
          <Avatar className="w-8 h-8 cursor-pointer">
            {profileImage ? (
              <AvatarImage src={profileImage} alt={username || "Profile"} />
            ) : (
              <AvatarFallback className="bg-[#3E3E3E] text-white">
                <UserCircle className="h-5 w-5" />
              </AvatarFallback>
            )}
          </Avatar>
        </Link>
      </div>
    </header>
  );
}
