import { useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, Trophy, Star, Music, MessageCircle, Users, Headphones, Disc, Award, Crown, Flame, Target, Clock, CheckCircle, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface BadgeLevel {
  level: number;
  name: string;
  requirement: number;
  icon: React.ReactNode;
  color: string;
}

interface BadgeCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  currentLevel: number;
  currentProgress: number;
  levels: BadgeLevel[];
  unlocked: boolean;
}

interface SpecialBadge {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  unlocked: boolean;
  unlockedDate?: string;
  color: string;
}

export default function Badges() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Progressive badge categories with levels
  const badgeCategories: BadgeCategory[] = [
    {
      id: "discovery",
      name: "Music Discovery",
      description: "Discover and engage with new tracks",
      icon: <Headphones className="h-6 w-6" />,
      currentLevel: 2,
      currentProgress: 45,
      unlocked: true,
      levels: [
        { level: 1, name: "Curious Listener", requirement: 25, icon: <Headphones className="h-4 w-4" />, color: "from-slate-400 to-slate-600" },
        { level: 2, name: "Track Hunter", requirement: 100, icon: <Target className="h-4 w-4" />, color: "from-[#10B981] to-[#34D399]" },
        { level: 3, name: "Music Explorer", requirement: 250, icon: <Star className="h-4 w-4 text-[#c3f872]" />, color: "from-[#22C55E] to-[#84CC16]" },
        { level: 4, name: "Sonic Archaeologist", requirement: 500, icon: <Award className="h-4 w-4" />, color: "from-[#84CC16] to-[#EAB308]" },
        { level: 5, name: "Audio Mystic", requirement: 1000, icon: <Crown className="h-4 w-4" />, color: "from-[#EAB308] to-[#F59E0B]" }
      ]
    },
    {
      id: "community",
      name: "Community Builder",
      description: "Contribute to discussions and help others",
      icon: <MessageCircle className="h-6 w-6" />,
      currentLevel: 1,
      currentProgress: 78,
      unlocked: true,
      levels: [
        { level: 1, name: "Conversation Starter", requirement: 10, icon: <MessageCircle className="h-4 w-4" />, color: "from-slate-400 to-slate-600" },
        { level: 2, name: "Thread Weaver", requirement: 50, icon: <Users className="h-4 w-4" />, color: "from-[#10B981] to-[#34D399]" },
        { level: 3, name: "Discussion Catalyst", requirement: 150, icon: <Flame className="h-4 w-4" />, color: "from-[#22C55E] to-[#84CC16]" },
        { level: 4, name: "Community Pillar", requirement: 400, icon: <Trophy className="h-4 w-4" />, color: "from-[#84CC16] to-[#EAB308]" },
        { level: 5, name: "Pulse Legend", requirement: 1000, icon: <Crown className="h-4 w-4" />, color: "from-[#EAB308] to-[#F59E0B]" }
      ]
    },
    {
      id: "identification",
      name: "Track Detective",
      description: "Help identify unknown tracks in What's That Song",
      icon: <Target className="h-6 w-6" />,
      currentLevel: 0,
      currentProgress: 0,
      unlocked: false,
      levels: [
        { level: 1, name: "Music Sleuth", requirement: 5, icon: <Target className="h-4 w-4" />, color: "from-slate-400 to-slate-600" },
        { level: 2, name: "Audio Detective", requirement: 25, icon: <Music className="h-4 w-4" />, color: "from-[#10B981] to-[#34D399]" },
        { level: 3, name: "Sonic Sherlock", requirement: 75, icon: <Star className="h-4 w-4 text-[#c3f872]" />, color: "from-[#22C55E] to-[#84CC16]" },
        { level: 4, name: "Track Oracle", requirement: 200, icon: <Award className="h-4 w-4" />, color: "from-[#84CC16] to-[#EAB308]" },
        { level: 5, name: "Music Sage", requirement: 500, icon: <Crown className="h-4 w-4" />, color: "from-[#EAB308] to-[#F59E0B]" }
      ]
    },
    {
      id: "curation",
      name: "Playlist Curator",
      description: "Create and share amazing playlists",
      icon: <Disc className="h-6 w-6" />,
      currentLevel: 1,
      currentProgress: 20,
      unlocked: true,
      levels: [
        { level: 1, name: "Mix Maker", requirement: 3, icon: <Disc className="h-4 w-4" />, color: "from-slate-400 to-slate-600" },
        { level: 2, name: "Vibe Architect", requirement: 10, icon: <Music className="h-4 w-4" />, color: "from-[#10B981] to-[#34D399]" },
        { level: 3, name: "Sonic Curator", requirement: 25, icon: <Star className="h-4 w-4 text-[#c3f872]" />, color: "from-[#22C55E] to-[#84CC16]" },
        { level: 4, name: "Playlist Virtuoso", requirement: 75, icon: <Award className="h-4 w-4" />, color: "from-[#84CC16] to-[#EAB308]" },
        { level: 5, name: "Mix Master", requirement: 200, icon: <Crown className="h-4 w-4" />, color: "from-[#EAB308] to-[#F59E0B]" }
      ]
    }
  ];

  // Special one-time badges
  const specialBadges: SpecialBadge[] = [
    {
      id: "og",
      name: "OG Member",
      description: "Joined during the beta phase",
      icon: <Crown className="h-6 w-6" />,
      unlocked: true,
      unlockedDate: "Dec 2024",
      color: "from-[#84CC16] to-[#EAB308]"
    },
    {
      id: "first-thread",
      name: "First Post",
      description: "Created your first discussion thread",
      icon: <MessageCircle className="h-6 w-6" />,
      unlocked: true,
      unlockedDate: "Jan 2025",
      color: "from-[#10B981] to-[#34D399]"
    },
    {
      id: "night-owl",
      name: "Night Owl",
      description: "Active during late night hours (2-6 AM)",
      icon: <Clock className="h-6 w-6" />,
      unlocked: false,
      color: "from-[#EC4899] to-[#BE185D]"
    },
    {
      id: "genre-specialist",
      name: "Techno Specialist",
      description: "90% of your activity is in Techno discussions",
      icon: <Star className="h-6 w-6 text-[#c3f872]" />,
      unlocked: true,
      unlockedDate: "Feb 2025",
      color: "from-[#EC4899] to-[#BE185D]"
    },
    {
      id: "festival-goer",
      name: "Festival Veteran",
      description: "Checked into 10+ venues/festivals",
      icon: <Users className="h-6 w-6" />,
      unlocked: false,
      color: "from-[#EC4899] to-[#BE185D]"
    }
  ];

  const unlockedSpecialBadges = specialBadges.filter(badge => badge.unlocked);
  const lockedSpecialBadges = specialBadges.filter(badge => !badge.unlocked);

  const getNextLevel = (category: BadgeCategory) => {
    return category.levels.find(level => level.level > category.currentLevel);
  };

  const getCurrentLevel = (category: BadgeCategory) => {
    return category.levels.find(level => level.level === category.currentLevel);
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
          <h1 className="text-xl font-bold">Badges & Achievements</h1>
        </div>
      </div>

      <main className="px-4 pt-6">
        {/* Stats Overview */}
        <div className="bg-[#181818] rounded-lg p-4 mb-6 border border-[#3E3E3E]">
          <h2 className="text-lg font-bold mb-4">Your Progress</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold green-gradient-text">
                {badgeCategories.filter(cat => cat.unlocked).length}
              </div>
              <p className="text-sm text-[#B3B3B3]">Active Badges</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold" style={{ background: 'linear-gradient(to right, #EC4899, #BE185D)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                {unlockedSpecialBadges.length}
              </div>
              <p className="text-sm text-[#B3B3B3]">Special Achievements</p>
            </div>
          </div>
        </div>

        {/* Progressive Badges */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Progressive Badges</h2>
          <div className="space-y-4">
            {badgeCategories.map((category) => {
              const currentLevel = getCurrentLevel(category);
              const nextLevel = getNextLevel(category);
              const isExpanded = activeCategory === category.id;

              return (
                <div key={category.id} className="bg-[#181818] rounded-lg border border-[#3E3E3E] overflow-hidden">
                  <button
                    className="w-full p-4 text-left hover:bg-[#1a1a1a] transition-colors"
                    onClick={() => setActiveCategory(isExpanded ? null : category.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={cn(
                          "p-2 rounded-lg",
                          category.unlocked ? "bg-[#282828]" : "bg-[#1a1a1a]"
                        )}>
                          {category.unlocked ? (
                            <div className="text-white">{category.icon}</div>
                          ) : (
                            <Lock className="h-6 w-6 text-[#666]" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium">{category.name}</h3>
                          <p className="text-sm text-[#B3B3B3]">{category.description}</p>
                          {category.unlocked && (
                            <div className="mt-2">
                              <div className="flex items-center justify-between text-xs text-[#B3B3B3] mb-1">
                                <span>
                                  {currentLevel ? `${currentLevel.name} (Level ${currentLevel.level})` : 'Not started'}
                                </span>
                                {nextLevel && (
                                  <span>
                                    {category.currentProgress}/{nextLevel.requirement}
                                  </span>
                                )}
                              </div>
                              {nextLevel && (
                                <Progress 
                                  value={(category.currentProgress / nextLevel.requirement) * 100} 
                                  className="h-2"
                                />
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <Badge className={cn(
                        "text-xs",
                        category.unlocked 
                          ? `bg-gradient-to-r ${currentLevel?.color || 'from-gray-400 to-gray-600'} text-white`
                          : "bg-[#282828] text-[#666]"
                      )}>
                        {category.unlocked ? `Level ${category.currentLevel}` : 'Locked'}
                      </Badge>
                    </div>
                  </button>

                  {/* Expanded view showing all levels */}
                  {isExpanded && category.unlocked && (
                    <div className="border-t border-[#3E3E3E] p-4">
                      <h4 className="font-medium mb-3">All Levels</h4>
                      <div className="space-y-3">
                        {category.levels.map((level) => {
                          const isUnlocked = level.level <= category.currentLevel;
                          const isCurrent = level.level === category.currentLevel;
                          const isNext = level.level === category.currentLevel + 1;

                          return (
                            <div key={level.level} className={cn(
                              "flex items-center space-x-3 p-3 rounded-lg",
                              isUnlocked ? "bg-[#282828]" : "bg-[#1a1a1a]"
                            )}>
                              <div className={cn(
                                "p-2 rounded-lg bg-gradient-to-r",
                                isUnlocked ? level.color : "from-gray-600 to-gray-700"
                              )}>
                                {isUnlocked ? (
                                  <div className="text-white">{level.icon}</div>
                                ) : (
                                  <Lock className="h-4 w-4 text-[#666]" />
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <span className={cn(
                                    "font-medium",
                                    isUnlocked ? "text-white" : "text-[#666]"
                                  )}>
                                    {level.name}
                                  </span>
                                  {isCurrent && (
                                    <Badge className="bg-gradient-to-r from-[#10B981] to-[#34D399] text-white text-xs">Current</Badge>
                                  )}
                                  {isNext && (
                                    <Badge className="bg-gradient-to-r from-[#EC4899] to-[#BE185D] text-white text-xs">Next</Badge>
                                  )}
                                </div>
                                <p className={cn(
                                  "text-sm",
                                  isUnlocked ? "text-[#B3B3B3]" : "text-[#666]"
                                )}>
                                  {level.requirement} {category.id === 'discovery' ? 'tracks discovered' : 
                                   category.id === 'community' ? 'meaningful contributions' :
                                   category.id === 'identification' ? 'correct identifications' :
                                   'playlists created'}
                                </p>
                                {isNext && (
                                  <p className="text-xs mt-1" style={{ color: '#EC4899' }}>
                                    {level.requirement - category.currentProgress} more needed
                                  </p>
                                )}
                              </div>
                              {isUnlocked && (
                                <CheckCircle className="h-5 w-5" style={{ color: '#10B981' }} />
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
        </div>

        {/* Special Badges */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Special Achievements</h2>
          
          {/* Unlocked Special Badges */}
          {unlockedSpecialBadges.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-3" style={{ color: '#10B981' }}>Unlocked</h3>
              <div className="grid grid-cols-1 gap-3">
                {unlockedSpecialBadges.map((badge) => (
                  <div key={badge.id} className="bg-[#181818] rounded-lg p-4 border border-[#3E3E3E]">
                    <div className="flex items-center space-x-3">
                      <div className={cn(
                        "p-3 rounded-lg bg-gradient-to-r",
                        badge.color
                      )}>
                        <div className="text-white">{badge.icon}</div>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-white">{badge.name}</h4>
                        <p className="text-sm text-[#B3B3B3]">{badge.description}</p>
                        {badge.unlockedDate && (
                          <p className="text-xs mt-1" style={{ color: '#10B981' }}>
                            Unlocked {badge.unlockedDate}
                          </p>
                        )}
                      </div>
                      <CheckCircle className="h-5 w-5" style={{ color: '#10B981' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Locked Special Badges */}
          {lockedSpecialBadges.length > 0 && (
            <div>
              <h3 className="text-lg font-medium mb-3 text-[#666]">Not Yet Unlocked</h3>
              <div className="grid grid-cols-1 gap-3">
                {lockedSpecialBadges.map((badge) => (
                  <div key={badge.id} className="bg-[#1a1a1a] rounded-lg p-4 border border-[#2a2a2a]">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 rounded-lg bg-[#2a2a2a]">
                        <Lock className="h-6 w-6 text-[#666]" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-[#888]">{badge.name}</h4>
                        <p className="text-sm text-[#666]">{badge.description}</p>
                      </div>
                      <Lock className="h-5 w-5 text-[#666]" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}