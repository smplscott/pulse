import { useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, Users, Search, Music, Target, MapPin, Star, Crown, Trophy, CheckCircle, Lock, ChevronDown, ChevronUp, Sparkles, Zap, Award, Share, Copy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface AchievementLevel {
  level: number;
  name: string;
  requirement: number;
  emoji: string;
  color: string;
  description: string;
}

interface ProgressiveTrack {
  id: string;
  name: string;
  description: string;
  emoji: string;
  currentLevel: number;
  currentPoints: number;
  pointsFormula: string;
  levels: AchievementLevel[];
  unlocked: boolean;
}

interface SpecialAchievement {
  id: string;
  name: string;
  description: string;
  emoji: string;
  unlocked: boolean;
  unlockedDate?: string;
  color: string;
  category: 'crew' | 'community' | 'milestone';
}

export default function CommunityAchievements() {
  const [activeTrack, setActiveTrack] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'progressive' | 'achievements'>('progressive');

  // Progressive achievement tracks
  const progressiveTracks: ProgressiveTrack[] = [
    {
      id: "community-contributor",
      name: "Community Contributor",
      description: "Based on total threads (4 points each) and comments (1 point each)",
      emoji: "💬",
      currentLevel: 2,
      currentPoints: 127,
      pointsFormula: "Threads × 4 + Comments × 1",
      unlocked: true,
      levels: [
        { level: 1, name: "Thread Starter", requirement: 25, emoji: "🌱", color: "from-slate-400 to-slate-600", description: "Your first steps into community discussions" },
        { level: 2, name: "The Conversationalist", requirement: 100, emoji: "💭", color: "from-[#10B981] to-[#34D399]", description: "Keeping the conversation flowing" },
        { level: 3, name: "Community Glue", requirement: 300, emoji: "🤝", color: "from-[#22C55E] to-[#84CC16]", description: "Bringing people together through discussion" },
        { level: 4, name: "Thread Architect", requirement: 750, emoji: "🏗️", color: "from-[#84CC16] to-[#EAB308]", description: "Masterfully crafting meaningful discussions" },
        { level: 5, name: "Pulse/The Moderator", requirement: 1500, emoji: "👑", color: "from-[#EAB308] to-[#F59E0B]", description: "The heartbeat of our community" }
      ]
    },
    {
      id: "sample-identification",
      name: "Sample Identification",
      description: "Based on successful sample identifications",
      emoji: "🔍",
      currentLevel: 1,
      currentPoints: 8,
      pointsFormula: "Sample IDs × 5",
      unlocked: true,
      levels: [
        { level: 1, name: "Sample Spotter", requirement: 5, emoji: "👀", color: "from-slate-400 to-slate-600", description: "You've got an ear for samples" },
        { level: 2, name: "Sample Scholar", requirement: 25, emoji: "📚", color: "from-[#10B981] to-[#34D399]", description: "Studying the art of sampling" },
        { level: 3, name: "Sample Master", requirement: 75, emoji: "🎯", color: "from-[#22C55E] to-[#84CC16]", description: "Master of sample archaeology" },
        { level: 4, name: "Sample God", requirement: 200, emoji: "⚡", color: "from-[#84CC16] to-[#EAB308]", description: "Legendary sample identification skills" },
        { level: 5, name: "Sample Oracle", requirement: 500, emoji: "🔮", color: "from-[#EAB308] to-[#F59E0B]", description: "The ultimate authority on samples" }
      ]
    },
    {
      id: "discovery-assistance",
      name: "Discovery Assistance", 
      description: "Identifying artists like artists — or songs like songs",
      emoji: "🎵",
      currentLevel: 0,
      currentPoints: 0,
      pointsFormula: "Successful Recommendations × 3",
      unlocked: false,
      levels: [
        { level: 1, name: "Match Starter", requirement: 10, emoji: "🎲", color: "from-slate-400 to-slate-600", description: "Making your first musical connections" },
        { level: 2, name: "Reliable Source", requirement: 50, emoji: "📡", color: "from-[#10B981] to-[#34D399]", description: "People trust your recommendations" },
        { level: 3, name: "Rec Engine", requirement: 150, emoji: "🤖", color: "from-[#22C55E] to-[#84CC16]", description: "Like an algorithm, but human" },
        { level: 4, name: "The Prodigy", requirement: 400, emoji: "🧠", color: "from-[#84CC16] to-[#EAB308]", description: "Uncanny ability to find perfect matches" },
        { level: 5, name: "Culture Curator", requirement: 1000, emoji: "🏛️", color: "from-[#EAB308] to-[#F59E0B]", description: "Shaping musical taste across the platform" }
      ]
    },
    {
      id: "id-hunter",
      name: "ID Hunter",
      description: "ID'ing tracks in setlists",
      emoji: "🎧",
      currentLevel: 0,
      currentPoints: 0,
      pointsFormula: "Setlist Track IDs × 2",
      unlocked: false,
      levels: [
        { level: 1, name: "ID Newbie", requirement: 10, emoji: "🔰", color: "from-slate-400 to-slate-600", description: "Learning the art of track identification" },
        { level: 2, name: "ID Seeker", requirement: 50, emoji: "🕵️", color: "from-[#10B981] to-[#34D399]", description: "Actively hunting down unknown tracks" },
        { level: 3, name: "ID Source", requirement: 150, emoji: "📋", color: "from-[#22C55E] to-[#84CC16]", description: "A reliable source for track IDs" },
        { level: 4, name: "ID Inspector", requirement: 400, emoji: "🔬", color: "from-[#84CC16] to-[#EAB308]", description: "Forensic-level track identification" },
        { level: 5, name: "ID Royalty", requirement: 1000, emoji: "💎", color: "from-[#EAB308] to-[#F59E0B]", description: "The crown jewel of setlist identification" }
      ]
    },
    {
      id: "irl-listener",
      name: "IRL Listener / The Witness",
      description: "Active in the places — adding threads (10 points) and comments (1 point)",
      emoji: "📍",
      currentLevel: 1,
      currentPoints: 42,
      pointsFormula: "Venue Threads × 10 + Venue Comments × 1",
      unlocked: true,
      levels: [
        { level: 1, name: "IRL Observer", requirement: 25, emoji: "👁️", color: "from-slate-400 to-slate-600", description: "Witnessing the scene firsthand" },
        { level: 2, name: "IRL Witness", requirement: 100, emoji: "📝", color: "from-[#10B981] to-[#34D399]", description: "Documenting real-world music experiences" },
        { level: 3, name: "IRL Guide", requirement: 300, emoji: "🗺️", color: "from-[#22C55E] to-[#84CC16]", description: "Guiding others to the best experiences" },
        { level: 4, name: "IRL Journalist", requirement: 750, emoji: "📰", color: "from-[#84CC16] to-[#EAB308]", description: "Professional-level venue reporting" },
        { level: 5, name: "IRL Icon", requirement: 1500, emoji: "🌟", color: "from-[#EAB308] to-[#F59E0B]", description: "A legend in the real-world music scene" }
      ]
    },
    {
      id: "live-show-critic",
      name: "Live Show Critic",
      description: "Specifically for reviewing artist live performances",
      emoji: "🎤",
      currentLevel: 0,
      currentPoints: 0,
      pointsFormula: "Live Reviews × 5",
      unlocked: false,
      levels: [
        { level: 1, name: "Showgoer", requirement: 5, emoji: "🎫", color: "from-slate-400 to-slate-600", description: "Attending and reviewing your first shows" },
        { level: 2, name: "Crowd Critic", requirement: 25, emoji: "👥", color: "from-[#10B981] to-[#34D399]", description: "Reading the room and the performance" },
        { level: 3, name: "Stage Analyst", requirement: 75, emoji: "🎭", color: "from-[#22C55E] to-[#84CC16]", description: "Deep analysis of live performance craft" },
        { level: 4, name: "Top Reviewer", requirement: 200, emoji: "⭐", color: "from-[#84CC16] to-[#EAB308]", description: "Your reviews shape concert experiences" },
        { level: 5, name: "Live Authority", requirement: 500, emoji: "🏆", color: "from-[#EAB308] to-[#F59E0B]", description: "The definitive voice on live music" }
      ]
    }
  ];

  // Special one-time achievements
  const specialAchievements: SpecialAchievement[] = [
    // Crew badges
    {
      id: "pulse-crew",
      name: "Pulse Crew",
      description: "Internal/core advocate badge for collaborators",
      emoji: "⚡",
      unlocked: true,
      unlockedDate: "Dec 2024",
      color: "from-[#9333EA] to-[#7C3AED]",
      category: 'crew'
    },
    // Community badges
    {
      id: "the-plug",
      name: "The Plug",
      description: "Invited 25+ members to the community",
      emoji: "🔌",
      unlocked: false,
      color: "from-[#EC4899] to-[#BE185D]",
      category: 'community'
    },
    {
      id: "culture-catalyst",
      name: "Culture Catalyst", 
      description: "Invited 100+ members to the community",
      emoji: "🚀",
      unlocked: false,
      color: "from-[#F59E0B] to-[#D97706]",
      category: 'community'
    },
    // Milestone badges
    {
      id: "og-member",
      name: "OG Member Badge",
      description: "Joined during the beta phase",
      emoji: "👑",
      unlocked: true,
      unlockedDate: "Dec 2024",
      color: "from-[#84CC16] to-[#EAB308]",
      category: 'milestone'
    },
    {
      id: "first-thread",
      name: "First Thread Created",
      description: "Created your first discussion thread",
      emoji: "🎯",
      unlocked: true,
      unlockedDate: "Jan 2025",
      color: "from-[#10B981] to-[#34D399]",
      category: 'milestone'
    },
    {
      id: "deep-listener",
      name: "Deep Listener",
      description: "Recognized by our team for a deeply contextual note or backstory",
      emoji: "🎵",
      unlocked: false,
      color: "from-[#06B6D4] to-[#0891B2]",
      category: 'milestone'
    },
    {
      id: "certified-review",
      name: "Certified Review",
      description: "Wrote a review that became community-certified quality",
      emoji: "✅",
      unlocked: false,
      color: "from-[#22C55E] to-[#16A34A]",
      category: 'milestone'
    },
    {
      id: "threadstarter",
      name: "Threadstarter",
      description: "Started popular thread with 100+ engagements",
      emoji: "🔥",
      unlocked: false,
      color: "from-[#EF4444] to-[#DC2626]",
      category: 'milestone'
    }
  ];

  const unlockedAchievements = specialAchievements.filter(badge => badge.unlocked);
  const lockedAchievements = specialAchievements.filter(badge => !badge.unlocked);

  const getNextLevel = (track: ProgressiveTrack) => {
    return track.levels.find(level => level.level > track.currentLevel);
  };

  const getCurrentLevel = (track: ProgressiveTrack) => {
    return track.levels.find(level => level.level === track.currentLevel);
  };

  const getProgressPercentage = (track: ProgressiveTrack) => {
    const nextLevel = getNextLevel(track);
    if (!nextLevel) return 100;
    return (track.currentPoints / nextLevel.requirement) * 100;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#121212] to-[#1a1a1a] text-white pb-20 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-yellow-400/20 to-orange-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-2xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-40 left-1/3 w-20 h-20 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-full blur-2xl animate-pulse delay-2000"></div>
      </div>

      {/* Header */}
      <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-gradient-to-r from-yellow-500/30 to-purple-500/30 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link href="/">
              <button className="text-[#B3B3B3] hover:text-white transition-colors">
                <ArrowLeft className="h-5 w-5" />
              </button>
            </Link>
            <div className="flex items-center space-x-2">
              <div className="text-2xl">🏆</div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-600 bg-clip-text text-transparent">
                Trophy Case
              </h1>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button className="p-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 transition-all">
              <Share className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <main className="px-4 pt-8 relative z-10">
        {/* Hero Stats with Glowing Effects */}
        <div className="relative mb-12">
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/30 via-orange-500/30 to-yellow-500/30 rounded-3xl blur-2xl"></div>
          <div className="relative bg-gradient-to-br from-black/60 via-gray-900/60 to-black/60 rounded-3xl p-8 border border-yellow-500/30 backdrop-blur-xl">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent mb-2">
                Achievement Master
              </h2>
              <p className="text-gray-400">Your legendary status in the Pulse community</p>
            </div>
            
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center group">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500/40 to-emerald-500/40 rounded-2xl blur-lg group-hover:blur-xl transition-all"></div>
                  <div className="relative bg-gradient-to-br from-green-900/50 to-emerald-900/50 rounded-2xl p-6 border border-green-500/30">
                    <div className="text-4xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                      {progressiveTracks.filter(track => track.unlocked).length}
                    </div>
                    <p className="text-sm text-green-300 font-medium">Active Tracks</p>
                  </div>
                </div>
              </div>
              
              <div className="text-center group">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/40 to-violet-500/40 rounded-2xl blur-lg group-hover:blur-xl transition-all"></div>
                  <div className="relative bg-gradient-to-br from-purple-900/50 to-violet-900/50 rounded-2xl p-6 border border-purple-500/30">
                    <div className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-violet-400 bg-clip-text text-transparent">
                      {progressiveTracks.reduce((sum, track) => sum + track.currentLevel, 0)}
                    </div>
                    <p className="text-sm text-purple-300 font-medium">Total Levels</p>
                  </div>
                </div>
              </div>
              
              <div className="text-center group">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-500/40 to-rose-500/40 rounded-2xl blur-lg group-hover:blur-xl transition-all"></div>
                  <div className="relative bg-gradient-to-br from-pink-900/50 to-rose-900/50 rounded-2xl p-6 border border-pink-500/30">
                    <div className="text-4xl font-bold bg-gradient-to-r from-pink-400 to-rose-400 bg-clip-text text-transparent">
                      {unlockedAchievements.length}
                    </div>
                    <p className="text-sm text-pink-300 font-medium">Rare Badges</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section Toggle with Premium Design */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/30 to-purple-500/30 rounded-2xl blur-lg"></div>
            <div className="relative bg-black/60 backdrop-blur-xl rounded-2xl p-2 border border-gray-700/50">
              <div className="flex">
                <button
                  onClick={() => setActiveSection('progressive')}
                  className={cn(
                    "px-8 py-3 rounded-xl text-sm font-bold transition-all duration-300 flex items-center space-x-2",
                    activeSection === 'progressive' 
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25" 
                      : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                  )}
                >
                  <Zap className="h-4 w-4" />
                  <span>Progressive Mastery</span>
                </button>
                <button
                  onClick={() => setActiveSection('achievements')}
                  className={cn(
                    "px-8 py-3 rounded-xl text-sm font-bold transition-all duration-300 flex items-center space-x-2",
                    activeSection === 'achievements' 
                      ? "bg-gradient-to-r from-yellow-600 to-orange-600 text-white shadow-lg shadow-yellow-500/25" 
                      : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                  )}
                >
                  <Award className="h-4 w-4" />
                  <span>Legendary Badges</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Progressive Tracks Section */}
        {activeSection === 'progressive' && (
          <div className="space-y-8">
            {progressiveTracks.map((track, index) => {
              const currentLevel = getCurrentLevel(track);
              const nextLevel = getNextLevel(track);
              const isExpanded = activeTrack === track.id;
              const progressPercentage = getProgressPercentage(track);

              return (
                <div key={track.id} className="group relative">
                  {/* Glowing background effect */}
                  <div className={cn(
                    "absolute inset-0 rounded-3xl blur-2xl transition-all duration-500",
                    track.unlocked 
                      ? "bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 group-hover:from-blue-500/30 group-hover:via-purple-500/30 group-hover:to-pink-500/30"
                      : "bg-gradient-to-r from-gray-600/10 to-gray-800/10"
                  )}></div>
                  
                  <div className="relative bg-black/40 backdrop-blur-xl rounded-3xl border border-gray-700/50 overflow-hidden">
                    <button
                      className="w-full p-8 text-left hover:bg-white/5 transition-all duration-300"
                      onClick={() => setActiveTrack(isExpanded ? null : track.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-6">
                          {/* Track Icon with Level Badge */}
                          <div className="relative">
                            {track.unlocked ? (
                              <div className="relative">
                                <div className={cn(
                                  "text-6xl p-4 rounded-2xl transition-all duration-300 group-hover:scale-110",
                                  `bg-gradient-to-br ${currentLevel?.color || 'from-gray-400 to-gray-600'}`
                                )}>
                                  <div className="text-white">{track.emoji}</div>
                                </div>
                                {currentLevel && (
                                  <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full p-2 border-2 border-black">
                                    <div className="text-lg">{currentLevel.emoji}</div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-6xl p-4 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 opacity-50">
                                <div className="text-gray-600">🔒</div>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className={cn(
                                "text-2xl font-bold",
                                track.unlocked 
                                  ? "bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent"
                                  : "text-gray-600"
                              )}>
                                {track.name}
                              </h3>
                              {track.unlocked && !nextLevel && (
                                <div className="flex items-center space-x-1 px-3 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full">
                                  <Crown className="h-4 w-4 text-black" />
                                  <span className="text-xs font-bold text-black">MAXED</span>
                                </div>
                              )}
                            </div>
                            
                            <p className={cn(
                              "text-sm mb-4",
                              track.unlocked ? "text-gray-300" : "text-gray-600"
                            )}>
                              {track.description}
                            </p>
                            
                            {track.unlocked && (
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2">
                                    <span className="text-sm font-medium text-white">
                                      {currentLevel ? currentLevel.name : 'Not started'}
                                    </span>
                                    <span className="text-xs px-2 py-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full text-white">
                                      Level {track.currentLevel}
                                    </span>
                                  </div>
                                  {nextLevel && (
                                    <span className="text-sm text-gray-400">
                                      {track.currentPoints}/{nextLevel.requirement} points
                                    </span>
                                  )}
                                </div>
                                
                                {nextLevel && (
                                  <div className="relative">
                                    <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                                      <div 
                                        className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all duration-1000 ease-out"
                                        style={{ width: `${progressPercentage}%` }}
                                      ></div>
                                    </div>
                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-full animate-pulse"></div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          {track.unlocked && (
                            <div className="text-right">
                              <div className="text-sm text-gray-400">Next Goal</div>
                              {nextLevel ? (
                                <div className="text-lg font-bold text-white">{nextLevel.name}</div>
                              ) : (
                                <div className="text-lg font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                                  Complete!
                                </div>
                              )}
                            </div>
                          )}
                          <div className={cn(
                            "transition-transform duration-300",
                            isExpanded ? "rotate-180" : ""
                          )}>
                            <ChevronDown className="h-6 w-6 text-gray-400" />
                          </div>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Special Achievements Section */}
        {activeSection === 'achievements' && (
          <div className="text-center py-20">
            <div className="mb-8">
              <div className="text-6xl mb-4">🚧</div>
              <h3 className="text-2xl font-bold text-gray-400 mb-2">Coming Soon</h3>
              <p className="text-gray-500">Special achievements section is being redesigned with stunning visuals</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}