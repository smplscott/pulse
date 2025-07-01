import { useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, Users, Search, Music, Target, MapPin, Star, Crown, Trophy, CheckCircle, Lock, ChevronDown, ChevronUp } from "lucide-react";
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
    <div className="min-h-screen bg-[#121212] text-white pb-20">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[#121212] border-b border-[#3E3E3E] px-4 py-3">
        <div className="flex items-center space-x-3">
          <Link href="/">
            <button className="text-[#B3B3B3] hover:text-white">
              <ArrowLeft className="h-5 w-5" />
            </button>
          </Link>
          <h1 className="text-xl font-bold">🏆 Community Achievements</h1>
        </div>
      </div>

      <main className="px-4 pt-6">
        {/* Stats Overview */}
        <div className="bg-gradient-to-r from-[#1a1a1a] to-[#2a2a2a] rounded-xl p-6 mb-6 border border-[#3E3E3E]">
          <h2 className="text-lg font-bold mb-4 flex items-center">
            <Trophy className="h-5 w-5 mr-2 text-yellow-500" />
            Trophy Room Overview
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {progressiveTracks.filter(track => track.unlocked).length}
              </div>
              <p className="text-sm text-[#B3B3B3]">Active Tracks</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">
                {progressiveTracks.reduce((sum, track) => sum + track.currentLevel, 0)}
              </div>
              <p className="text-sm text-[#B3B3B3]">Total Levels</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-pink-400">
                {unlockedAchievements.length}
              </div>
              <p className="text-sm text-[#B3B3B3]">Special Badges</p>
            </div>
          </div>
        </div>

        {/* Section Toggle */}
        <div className="flex bg-[#181818] rounded-lg p-1 mb-6 border border-[#3E3E3E]">
          <button
            onClick={() => setActiveSection('progressive')}
            className={cn(
              "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors",
              activeSection === 'progressive' 
                ? "bg-[#5271ff] text-white" 
                : "text-[#B3B3B3] hover:text-white"
            )}
          >
            Progressive Tracks
          </button>
          <button
            onClick={() => setActiveSection('achievements')}
            className={cn(
              "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors",
              activeSection === 'achievements' 
                ? "bg-[#5271ff] text-white" 
                : "text-[#B3B3B3] hover:text-white"
            )}
          >
            Special Achievements
          </button>
        </div>

        {/* Progressive Tracks Section */}
        {activeSection === 'progressive' && (
          <div className="space-y-4">
            {progressiveTracks.map((track) => {
              const currentLevel = getCurrentLevel(track);
              const nextLevel = getNextLevel(track);
              const isExpanded = activeTrack === track.id;
              const progressPercentage = getProgressPercentage(track);

              return (
                <div key={track.id} className="bg-[#181818] rounded-xl border border-[#3E3E3E] overflow-hidden">
                  <button
                    className="w-full p-6 text-left hover:bg-[#1a1a1a] transition-colors"
                    onClick={() => setActiveTrack(isExpanded ? null : track.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={cn(
                          "text-4xl p-3 rounded-xl",
                          track.unlocked ? "bg-[#282828]" : "bg-[#1a1a1a] grayscale"
                        )}>
                          {track.unlocked ? track.emoji : '🔒'}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-lg flex items-center">
                            {track.name}
                            {track.unlocked && currentLevel && (
                              <span className="ml-2 text-2xl">{currentLevel.emoji}</span>
                            )}
                          </h3>
                          <p className="text-sm text-[#B3B3B3] mb-2">{track.description}</p>
                          {track.unlocked && (
                            <div>
                              <div className="flex items-center justify-between text-xs text-[#B3B3B3] mb-2">
                                <span>
                                  {currentLevel ? `${currentLevel.name} (Level ${currentLevel.level})` : 'Not started'}
                                </span>
                                {nextLevel && (
                                  <span>
                                    {track.currentPoints}/{nextLevel.requirement} points
                                  </span>
                                )}
                              </div>
                              {nextLevel && (
                                <Progress 
                                  value={progressPercentage} 
                                  className="h-2"
                                />
                              )}
                              {!nextLevel && (
                                <div className="flex items-center text-xs text-yellow-500">
                                  <Crown className="h-3 w-3 mr-1" />
                                  <span>MAX LEVEL ACHIEVED</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={cn(
                          "text-xs",
                          track.unlocked 
                            ? `bg-gradient-to-r ${currentLevel?.color || 'from-gray-400 to-gray-600'} text-white`
                            : "bg-[#282828] text-[#666]"
                        )}>
                          {track.unlocked ? `Level ${track.currentLevel}` : 'Locked'}
                        </Badge>
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </div>
                  </button>

                  {/* Expanded view showing all levels */}
                  {isExpanded && track.unlocked && (
                    <div className="border-t border-[#3E3E3E] p-6">
                      <div className="mb-4">
                        <h4 className="font-medium mb-2">Points Formula</h4>
                        <p className="text-sm text-[#B3B3B3] bg-[#2a2a2a] p-2 rounded font-mono">
                          {track.pointsFormula}
                        </p>
                      </div>
                      <h4 className="font-medium mb-4">All Levels</h4>
                      <div className="space-y-3">
                        {track.levels.map((level) => {
                          const isUnlocked = level.level <= track.currentLevel;
                          const isCurrent = level.level === track.currentLevel;
                          const isNext = level.level === track.currentLevel + 1;

                          return (
                            <div key={level.level} className={cn(
                              "flex items-center space-x-4 p-4 rounded-xl",
                              isUnlocked ? "bg-[#282828]" : "bg-[#1a1a1a]"
                            )}>
                              <div className="text-3xl">
                                {isUnlocked ? level.emoji : '🔒'}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className={cn(
                                    "font-medium",
                                    isUnlocked ? "text-white" : "text-[#666]"
                                  )}>
                                    {level.name}
                                  </span>
                                  {isCurrent && (
                                    <Badge className="bg-gradient-to-r from-[#10B981] to-[#34D399] text-white text-xs">
                                      CURRENT
                                    </Badge>
                                  )}
                                  {isNext && (
                                    <Badge className="bg-gradient-to-r from-[#EC4899] to-[#BE185D] text-white text-xs">
                                      NEXT
                                    </Badge>
                                  )}
                                </div>
                                <p className={cn(
                                  "text-sm mb-1",
                                  isUnlocked ? "text-[#B3B3B3]" : "text-[#666]"
                                )}>
                                  {level.description}
                                </p>
                                <p className={cn(
                                  "text-xs",
                                  isUnlocked ? "text-[#888]" : "text-[#555]"
                                )}>
                                  {level.requirement} points required
                                </p>
                                {isNext && (
                                  <p className="text-xs mt-1 text-pink-400">
                                    {level.requirement - track.currentPoints} more points needed
                                  </p>
                                )}
                              </div>
                              {isUnlocked && (
                                <CheckCircle className="h-5 w-5 text-green-500" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Special Achievements Section */}
        {activeSection === 'achievements' && (
          <div className="space-y-6">
            {/* Unlocked Achievements */}
            {unlockedAchievements.length > 0 && (
              <div>
                <h3 className="text-lg font-medium mb-4 text-green-400 flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Unlocked Achievements
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  {['crew', 'community', 'milestone'].map(category => {
                    const categoryAchievements = unlockedAchievements.filter(a => a.category === category);
                    if (categoryAchievements.length === 0) return null;
                    
                    return (
                      <div key={category}>
                        <h4 className="text-sm font-medium text-[#B3B3B3] mb-2 uppercase tracking-wide">
                          {category === 'crew' ? '⚡ Pulse Crew' : 
                           category === 'community' ? '🤝 Community Building' : 
                           '🎯 Milestones'}
                        </h4>
                        <div className="space-y-2">
                          {categoryAchievements.map((achievement) => (
                            <div key={achievement.id} className="bg-[#181818] rounded-lg p-4 border border-[#3E3E3E]">
                              <div className="flex items-center space-x-4">
                                <div className={cn(
                                  "p-3 rounded-lg bg-gradient-to-r text-2xl",
                                  achievement.color
                                )}>
                                  {achievement.emoji}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <span className="font-medium text-white">{achievement.name}</span>
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                  </div>
                                  <p className="text-sm text-[#B3B3B3] mb-1">{achievement.description}</p>
                                  {achievement.unlockedDate && (
                                    <p className="text-xs text-green-400">Unlocked {achievement.unlockedDate}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Locked Achievements */}
            {lockedAchievements.length > 0 && (
              <div>
                <h3 className="text-lg font-medium mb-4 text-[#666] flex items-center">
                  <Lock className="h-5 w-5 mr-2" />
                  Locked Achievements
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  {['crew', 'community', 'milestone'].map(category => {
                    const categoryAchievements = lockedAchievements.filter(a => a.category === category);
                    if (categoryAchievements.length === 0) return null;
                    
                    return (
                      <div key={category}>
                        <h4 className="text-sm font-medium text-[#666] mb-2 uppercase tracking-wide">
                          {category === 'crew' ? '⚡ Pulse Crew' : 
                           category === 'community' ? '🤝 Community Building' : 
                           '🎯 Milestones'}
                        </h4>
                        <div className="space-y-2">
                          {categoryAchievements.map((achievement) => (
                            <div key={achievement.id} className="bg-[#1a1a1a] rounded-lg p-4 border border-[#333] opacity-60">
                              <div className="flex items-center space-x-4">
                                <div className="p-3 rounded-lg bg-[#2a2a2a] text-2xl grayscale">
                                  🔒
                                </div>
                                <div className="flex-1">
                                  <span className="font-medium text-[#666]">{achievement.name}</span>
                                  <p className="text-sm text-[#555]">{achievement.description}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}