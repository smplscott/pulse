import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import MusicPlayer from "@/components/layout/MusicPlayer";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Phone, Video, MoreHorizontal, Send } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

// Mock data for contacts and groups
const mockContacts = [
  {
    id: 1,
    name: "Tae Min",
    username: "@taemin_beats",
    lastMessage: "Reply Now",
    time: "1m",
    isOnline: true,
    avatar: "/api/placeholder/40/40",
    unreadCount: 1,
    lastSeen: "waiting for a reply to your message since 1 month ago 🔥"
  },
  {
    id: 2,
    name: "Leader-nim",
    username: "@leader_edm",
    lastMessage: "Time is running!",
    time: "1m",
    isOnline: true,
    avatar: "/api/placeholder/40/40",
    unreadCount: 3,
    lastSeen: "online"
  },
  {
    id: 3,
    name: "Se Hun Oh",
    username: "@sehun_drops",
    lastMessage: "Just stop, I'm already late!",
    time: "3m",
    isOnline: false,
    avatar: "/api/placeholder/40/40",
    unreadCount: 0,
    lastSeen: "last seen 2 hours ago"
  },
  {
    id: 4,
    name: "Jong Dae Hyung",
    username: "@jongdae_mix",
    lastMessage: "Typing...",
    time: "12m",
    isOnline: true,
    avatar: "/api/placeholder/40/40",
    unreadCount: 0,
    lastSeen: "online"
  },
  {
    id: 5,
    name: "Yixing Gege",
    username: "@yixing_producer",
    lastMessage: "🎵 Voice Message",
    time: "2h",
    isOnline: false,
    avatar: "/api/placeholder/40/40",
    unreadCount: 1,
    lastSeen: "last seen 1 hour ago"
  }
];

const mockGroups = [
  {
    id: 1,
    name: "Techno Collective",
    members: ["DESIREE", "Tripolism", "&ME"],
    lastMessage: "New track dropped! 🔥",
    time: "5m",
    avatar: "/api/placeholder/40/40",
    unreadCount: 2,
    memberCount: 8
  },
  {
    id: 2,
    name: "Berlin Underground",
    members: ["Disclosure", "Rex The Dog", "Dillon Francis"],
    lastMessage: "Who's going to Watergate tonight?",
    time: "1h",
    avatar: "/api/placeholder/40/40",
    unreadCount: 0,
    memberCount: 12
  },
  {
    id: 3,
    name: "Track ID Hunters",
    members: ["techno_junkie", "beat_seeker", "id_finder"],
    lastMessage: "Anyone know this ID from Berghain set?",
    time: "3h",
    avatar: "/api/placeholder/40/40",
    unreadCount: 5,
    memberCount: 24
  }
];

export default function Messages() {
  const [activeTab, setActiveTab] = useState<"friends" | "groups">("friends");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredContacts = mockContacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredGroups = mockGroups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.members.some(member => member.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-[#121212] text-white flex flex-col">
      <Header />
      
      <main className="flex-1 px-4 py-6">
        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">Messages</h1>
          <p className="text-[#B3B3B3] text-sm">Connect with the music community</p>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#B3B3B3] h-4 w-4" />
          <Input
            placeholder="Search messages"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-[#282828] border-[#3E3E3E] text-white placeholder-[#B3B3B3] focus:border-green-500"
          />
        </div>

        {/* Tab Filters */}
        <div className="flex space-x-1 mb-6 bg-[#181818] p-1 rounded-lg">
          <button
            onClick={() => setActiveTab("friends")}
            className={cn(
              "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all",
              activeTab === "friends"
                ? "bg-gradient-to-r from-[#FBBF24] to-[#059669] text-white"
                : "text-[#B3B3B3] hover:text-white hover:bg-[#282828]"
            )}
          >
            Friends
          </button>
          <button
            onClick={() => setActiveTab("groups")}
            className={cn(
              "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all",
              activeTab === "groups"
                ? "bg-gradient-to-r from-[#FBBF24] to-[#059669] text-white"
                : "text-[#B3B3B3] hover:text-white hover:bg-[#282828]"
            )}
          >
            Group Chats
          </button>
        </div>

        {/* Contacts/Groups List */}
        <div className="space-y-2">
          {activeTab === "friends" ? (
            filteredContacts.length > 0 ? (
              filteredContacts.map((contact) => (
                <div
                  key={contact.id}
                  className="bg-[#181818] rounded-lg p-4 hover:bg-[#282828] transition-colors cursor-pointer"
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={contact.avatar} alt={contact.name} />
                        <AvatarFallback className="bg-gradient-to-br from-[#FBBF24] to-[#059669] text-white">
                          {contact.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      {contact.isOnline && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#181818]"></div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-white truncate">{contact.name}</h3>
                        <span className="text-xs text-[#B3B3B3]">{contact.time}</span>
                      </div>
                      <p className="text-sm text-[#B3B3B3] truncate">{contact.lastMessage}</p>
                      <p className="text-xs text-[#666] mt-1">{contact.lastSeen}</p>
                    </div>

                    <div className="flex items-center space-x-2">
                      {contact.unreadCount > 0 && (
                        <Badge className="bg-gradient-to-r from-[#EC4899] to-[#8B5CF6] text-white text-xs">
                          {contact.unreadCount}
                        </Badge>
                      )}
                      <button className="text-[#B3B3B3] hover:text-white">
                        <Phone className="h-4 w-4" />
                      </button>
                      <button className="text-[#B3B3B3] hover:text-white">
                        <Video className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10">
                <p className="text-[#B3B3B3]">
                  {searchQuery ? "No friends found matching your search" : "No recent conversations"}
                </p>
              </div>
            )
          ) : (
            filteredGroups.length > 0 ? (
              filteredGroups.map((group) => (
                <div
                  key={group.id}
                  className="bg-[#181818] rounded-lg p-4 hover:bg-[#282828] transition-colors cursor-pointer"
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={group.avatar} alt={group.name} />
                        <AvatarFallback className="bg-gradient-to-br from-[#EC4899] to-[#8B5CF6] text-white">
                          {group.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1 bg-[#181818] rounded-full px-1">
                        <span className="text-xs text-[#B3B3B3]">{group.memberCount}</span>
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-white truncate">{group.name}</h3>
                        <span className="text-xs text-[#B3B3B3]">{group.time}</span>
                      </div>
                      <p className="text-sm text-[#B3B3B3] truncate">{group.lastMessage}</p>
                      <p className="text-xs text-[#666] mt-1">
                        {group.members.slice(0, 2).join(", ")}
                        {group.members.length > 2 && ` +${group.members.length - 2} more`}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      {group.unreadCount > 0 && (
                        <Badge className="bg-gradient-to-r from-[#EC4899] to-[#8B5CF6] text-white text-xs">
                          {group.unreadCount}
                        </Badge>
                      )}
                      <button className="text-[#B3B3B3] hover:text-white">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10">
                <p className="text-[#B3B3B3]">
                  {searchQuery ? "No groups found matching your search" : "No group conversations"}
                </p>
              </div>
            )
          )}
        </div>

        {/* Floating Action Button */}
        <div className="fixed bottom-24 right-6">
          <button className="w-14 h-14 bg-gradient-to-r from-[#FBBF24] to-[#059669] rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all">
            <Send className="h-6 w-6 text-white" />
          </button>
        </div>
      </main>

      <MusicPlayer />
      <BottomNav />
    </div>
  );
}