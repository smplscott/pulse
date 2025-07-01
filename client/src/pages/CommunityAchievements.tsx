import { useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, ChevronDown, ChevronUp, Minus } from "lucide-react";
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

  // Progressive achievement tracks - cleaner, underground culture naming
  const progressiveTracks: ProgressiveTrack[] = [
    {
      id: "community-contributor",
      name: "Community Voice",
      description: "Threads ×4pts + Comments ×1pt",
      emoji: "—",
      currentLevel: 2,
      currentPoints: 127,
      pointsFormula: "Threads × 4 + Comments × 1",
      unlocked: true,
      levels: [
        { level: 1, name: "Lurker", requirement: 25, emoji: "○", color: "", description: "Breaking the silence" },
        { level: 2, name: "Regular", requirement: 100, emoji: "●", color: "", description: "Part of the conversation" },
        { level: 3, name: "Contributor", requirement: 300, emoji: "◉", color: "", description: "Driving discussion" },
        { level: 4, name: "Curator", requirement: 750, emoji: "◎", color: "", description: "Shaping dialogue" },
        { level: 5, name: "Voice", requirement: 1500, emoji: "◈", color: "", description: "Community authority" }
      ]
    },
    {
      id: "sample-identification",
      name: "Sample Hunter",
      description: "Sample IDs ×5pts",
      emoji: "—",
      currentLevel: 1,
      currentPoints: 8,
      pointsFormula: "Sample IDs × 5",
      unlocked: true,
      levels: [
        { level: 1, name: "Digger", requirement: 5, emoji: "○", color: "", description: "First connections made" },
        { level: 2, name: "Tracker", requirement: 25, emoji: "●", color: "", description: "Following the trail" },
        { level: 3, name: "Archaeologist", requirement: 75, emoji: "◉", color: "", description: "Unearthing history" },
        { level: 4, name: "Oracle", requirement: 200, emoji: "◎", color: "", description: "Deep knowledge" },
        { level: 5, name: "Keeper", requirement: 500, emoji: "◈", color: "", description: "Guardian of samples" }
      ]
    },
    {
      id: "discovery-assistance",
      name: "Music Guide", 
      description: "Successful recs ×3pts",
      emoji: "—",
      currentLevel: 0,
      currentPoints: 0,
      pointsFormula: "Successful Recommendations × 3",
      unlocked: false,
      levels: [
        { level: 1, name: "Scout", requirement: 10, emoji: "○", color: "", description: "Spotting connections" },
        { level: 2, name: "Connector", requirement: 50, emoji: "●", color: "", description: "Reliable taste" },
        { level: 3, name: "Navigator", requirement: 150, emoji: "◉", color: "", description: "Guiding others" },
        { level: 4, name: "Tastemaker", requirement: 400, emoji: "◎", color: "", description: "Influencing taste" },
        { level: 5, name: "Prophet", requirement: 1000, emoji: "◈", color: "", description: "Shaping culture" }
      ]
    },
    {
      id: "id-hunter",
      name: "Track Sleuth",
      description: "Setlist IDs ×2pts",
      emoji: "—",
      currentLevel: 0,
      currentPoints: 0,
      pointsFormula: "Setlist Track IDs × 2",
      unlocked: false,
      levels: [
        { level: 1, name: "Listener", requirement: 10, emoji: "○", color: "", description: "Active ears" },
        { level: 2, name: "Hunter", requirement: 50, emoji: "●", color: "", description: "On the hunt" },
        { level: 3, name: "Detective", requirement: 150, emoji: "◉", color: "", description: "Solving mysteries" },
        { level: 4, name: "Specialist", requirement: 400, emoji: "◎", color: "", description: "Expert identification" },
        { level: 5, name: "Legend", requirement: 1000, emoji: "◈", color: "", description: "Mythical knowledge" }
      ]
    },
    {
      id: "irl-listener",
      name: "Scene Witness",
      description: "Venue threads ×10pts + comments ×1pt",
      emoji: "—",
      currentLevel: 1,
      currentPoints: 42,
      pointsFormula: "Venue Threads × 10 + Venue Comments × 1",
      unlocked: true,
      levels: [
        { level: 1, name: "Observer", requirement: 25, emoji: "○", color: "", description: "Taking it in" },
        { level: 2, name: "Reporter", requirement: 100, emoji: "●", color: "", description: "Documenting moments" },
        { level: 3, name: "Chronicler", requirement: 300, emoji: "◉", color: "", description: "Recording history" },
        { level: 4, name: "Journalist", requirement: 750, emoji: "◎", color: "", description: "Professional witness" },
        { level: 5, name: "Archivist", requirement: 1500, emoji: "◈", color: "", description: "Keeper of memories" }
      ]
    },
    {
      id: "live-show-critic",
      name: "Show Critic",
      description: "Live reviews ×5pts",
      emoji: "—",
      currentLevel: 0,
      currentPoints: 0,
      pointsFormula: "Live Reviews × 5",
      unlocked: false,
      levels: [
        { level: 1, name: "Attendee", requirement: 5, emoji: "○", color: "", description: "Present and engaged" },
        { level: 2, name: "Reviewer", requirement: 25, emoji: "●", color: "", description: "Sharing thoughts" },
        { level: 3, name: "Analyst", requirement: 75, emoji: "◉", color: "", description: "Deep critique" },
        { level: 4, name: "Authority", requirement: 200, emoji: "◎", color: "", description: "Trusted voice" },
        { level: 5, name: "Institution", requirement: 500, emoji: "◈", color: "", description: "Definitive judgment" }
      ]
    }
  ];

  // Special one-time achievements - simplified
  const specialAchievements: SpecialAchievement[] = [
    {
      id: "pulse-crew",
      name: "Pulse Crew",
      description: "Core community member",
      emoji: "◈",
      unlocked: true,
      unlockedDate: "Dec 2024",
      color: "",
      category: 'crew'
    },
    {
      id: "og-member",
      name: "OG",
      description: "Beta member",
      emoji: "◎",
      unlocked: true,
      unlockedDate: "Dec 2024",
      color: "",
      category: 'milestone'
    },
    {
      id: "first-thread",
      name: "First Post",
      description: "Started a thread",
      emoji: "●",
      unlocked: true,
      unlockedDate: "Jan 2025",
      color: "",
      category: 'milestone'
    },
    {
      id: "the-plug",
      name: "The Plug",
      description: "Invited 25+ members",
      emoji: "◉",
      unlocked: false,
      color: "",
      category: 'community'
    },
    {
      id: "deep-listener",
      name: "Deep Listener",
      description: "Quality context/backstory",
      emoji: "◈",
      unlocked: false,
      color: "",
      category: 'milestone'
    },
    {
      id: "threadstarter",
      name: "Threadstarter",
      description: "100+ engagement thread",
      emoji: "◎",
      unlocked: false,
      color: "",
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
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-20">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-[#1a1a1a] px-3 py-3">
        <div className="flex items-center space-x-3">
          <Link href="/">
            <button className="text-[#666] hover:text-white transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
          </Link>
          <h1 className="text-lg font-medium text-white">Status</h1>
        </div>
      </div>

      <main className="px-3 pt-4">
        {/* Simple Stats */}
        <div className="bg-[#111] border border-[#222] p-4 mb-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-xl font-medium text-white">
                {progressiveTracks.filter(track => track.unlocked).length}
              </div>
              <div className="text-xs text-[#666] uppercase tracking-wide">Active</div>
            </div>
            <div>
              <div className="text-xl font-medium text-white">
                {progressiveTracks.reduce((sum, track) => sum + track.currentLevel, 0)}
              </div>
              <div className="text-xs text-[#666] uppercase tracking-wide">Levels</div>
            </div>
            <div>
              <div className="text-xl font-medium text-white">
                {unlockedAchievements.length}
              </div>
              <div className="text-xs text-[#666] uppercase tracking-wide">Badges</div>
            </div>
          </div>
        </div>

        {/* Section Toggle */}
        <div className="flex mb-6 border-b border-[#222]">
          <button
            onClick={() => setActiveSection('progressive')}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
              activeSection === 'progressive' 
                ? "text-white border-white" 
                : "text-[#666] border-transparent hover:text-[#999]"
            )}
          >
            Progressive
          </button>
          <button
            onClick={() => setActiveSection('achievements')}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
              activeSection === 'achievements' 
                ? "text-white border-white" 
                : "text-[#666] border-transparent hover:text-[#999]"
            )}
          >
            Achievements
          </button>
        </div>

        {/* Progressive Tracks Section */}
        {activeSection === 'progressive' && (
          <div className="space-y-3">
            {progressiveTracks.map((track, index) => {
              const currentLevel = getCurrentLevel(track);
              const nextLevel = getNextLevel(track);
              const isExpanded = activeTrack === track.id;
              const progressPercentage = getProgressPercentage(track);

              return (
                <div key={track.id}>
                  <button
                    className="w-full bg-[#111] border border-[#222] p-4 text-left hover:bg-[#1a1a1a] transition-colors"
                    onClick={() => setActiveTrack(isExpanded ? null : track.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={cn(
                          "text-lg font-mono",
                          track.unlocked ? "text-white" : "text-[#444]"
                        )}>
                          {currentLevel?.emoji || "○"}
                        </div>
                        <div>
                          <div className={cn(
                            "font-medium text-sm",
                            track.unlocked ? "text-white" : "text-[#666]"
                          )}>
                            {track.name}
                          </div>
                          <div className="text-xs text-[#666]">
                            {track.description}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        {track.unlocked && (
                          <div className="text-right">
                            <div className="text-sm font-medium text-white">
                              {currentLevel?.name || "—"}
                            </div>
                            <div className="text-xs text-[#666]">
                              {track.currentPoints}pts
                            </div>
                          </div>
                        )}
                        <div className={cn(
                          "transition-transform",
                          isExpanded ? "rotate-180" : ""
                        )}>
                          <ChevronDown className="h-4 w-4 text-[#666]" />
                        </div>
                      </div>
                    </div>
                  </button>
                  
                  {isExpanded && (
                    <div className="bg-[#0a0a0a] border-l-2 border-[#333] p-4">
                      {track.unlocked && nextLevel && (
                        <div className="mb-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs text-[#666] uppercase tracking-wide">Progress</span>
                            <span className="text-xs text-[#666]">{track.currentPoints}/{nextLevel.requirement}pts</span>
                          </div>
                          <Progress value={progressPercentage} className="h-1" />
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        {track.levels.map((level, idx) => (
                          <div 
                            key={level.level}
                            className={cn(
                              "flex items-center justify-between p-2 text-xs",
                              level.level <= track.currentLevel 
                                ? "text-white" 
                                : "text-[#444]"
                            )}
                          >
                            <div className="flex items-center space-x-2">
                              <span className="font-mono">{level.emoji}</span>
                              <span>{level.name}</span>
                            </div>
                            <span className="text-[#666]">{level.requirement}pts</span>
                          </div>
                        ))}
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
          <div className="space-y-3">
            {unlockedAchievements.length > 0 && (
              <div className="space-y-3">
                <div className="text-xs text-[#666] uppercase tracking-wide px-1">Unlocked</div>
                {unlockedAchievements.map((achievement) => (
                  <div key={achievement.id} className="bg-[#111] border border-[#222] p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="text-lg font-mono text-white">
                          {achievement.emoji}
                        </div>
                        <div>
                          <div className="font-medium text-sm text-white">
                            {achievement.name}
                          </div>
                          <div className="text-xs text-[#666]">
                            {achievement.description}
                          </div>
                        </div>
                      </div>
                      {achievement.unlockedDate && (
                        <div className="text-xs text-[#666]">
                          {achievement.unlockedDate}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {lockedAchievements.length > 0 && (
              <div className="space-y-3">
                <div className="text-xs text-[#666] uppercase tracking-wide px-1 pt-6">Locked</div>
                {lockedAchievements.map((achievement) => (
                  <div key={achievement.id} className="bg-[#0a0a0a] border border-[#1a1a1a] p-4">
                    <div className="flex items-center space-x-3">
                      <div className="text-lg font-mono text-[#444]">
                        <Minus className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-medium text-sm text-[#666]">
                          {achievement.name}
                        </div>
                        <div className="text-xs text-[#444]">
                          {achievement.description}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}