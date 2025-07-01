import { useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, ChevronDown, ChevronUp, Minus, MessageCircle, Search, Music, Headphones, MapPin, Mic, Users, Zap, Crown, Trophy, CheckCircle } from "lucide-react";
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
      name: "Community Contributor",
      description: "Threads ×4pts + Comments ×1pt",
      emoji: "MessageCircle",
      currentLevel: 2,
      currentPoints: 127,
      pointsFormula: "Threads × 4 + Comments × 1",
      unlocked: true,
      levels: [
        { level: 1, name: "Thread Starter", requirement: 25, emoji: "MessageCircle", color: "", description: "Breaking the silence" },
        { level: 2, name: "The Conversationalist", requirement: 100, emoji: "MessageCircle", color: "", description: "Part of the conversation" },
        { level: 3, name: "Community Glue", requirement: 300, emoji: "MessageCircle", color: "", description: "Driving discussion" },
        { level: 4, name: "Thread Architect", requirement: 750, emoji: "MessageCircle", color: "", description: "Shaping dialogue" },
        { level: 5, name: "Pulse/The Moderator", requirement: 1500, emoji: "MessageCircle", color: "", description: "Community authority" }
      ]
    },
    {
      id: "sample-identification",
      name: "Sample Identification",
      description: "Sample IDs ×5pts",
      emoji: "Search",
      currentLevel: 1,
      currentPoints: 8,
      pointsFormula: "Sample IDs × 5",
      unlocked: true,
      levels: [
        { level: 1, name: "Sample Spotter", requirement: 5, emoji: "Search", color: "", description: "First connections made" },
        { level: 2, name: "Sample Scholar", requirement: 25, emoji: "Search", color: "", description: "Following the trail" },
        { level: 3, name: "Sample Master", requirement: 75, emoji: "Search", color: "", description: "Unearthing history" },
        { level: 4, name: "Sample God", requirement: 200, emoji: "Search", color: "", description: "Deep knowledge" },
        { level: 5, name: "Sample Oracle", requirement: 500, emoji: "Search", color: "", description: "Guardian of samples" }
      ]
    },
    {
      id: "discovery-assistance",
      name: "Discovery Assistance", 
      description: "Successful recs ×3pts",
      emoji: "Music",
      currentLevel: 0,
      currentPoints: 0,
      pointsFormula: "Successful Recommendations × 3",
      unlocked: false,
      levels: [
        { level: 1, name: "Match Starter", requirement: 10, emoji: "Music", color: "", description: "Spotting connections" },
        { level: 2, name: "Reliable Source", requirement: 50, emoji: "Music", color: "", description: "Reliable taste" },
        { level: 3, name: "Rec Engine", requirement: 150, emoji: "Music", color: "", description: "Guiding others" },
        { level: 4, name: "The Prodigy", requirement: 400, emoji: "Music", color: "", description: "Influencing taste" },
        { level: 5, name: "Culture Curator", requirement: 1000, emoji: "Music", color: "", description: "Shaping culture" }
      ]
    },
    {
      id: "id-hunter",
      name: "ID Hunter",
      description: "Setlist IDs ×2pts",
      emoji: "Headphones",
      currentLevel: 0,
      currentPoints: 0,
      pointsFormula: "Setlist Track IDs × 2",
      unlocked: false,
      levels: [
        { level: 1, name: "ID Newbie", requirement: 10, emoji: "Headphones", color: "", description: "Active ears" },
        { level: 2, name: "ID Seeker", requirement: 50, emoji: "Headphones", color: "", description: "On the hunt" },
        { level: 3, name: "ID Source", requirement: 150, emoji: "Headphones", color: "", description: "Solving mysteries" },
        { level: 4, name: "ID Inspector", requirement: 400, emoji: "Headphones", color: "", description: "Expert identification" },
        { level: 5, name: "ID Royalty", requirement: 1000, emoji: "Headphones", color: "", description: "Mythical knowledge" }
      ]
    },
    {
      id: "irl-listener",
      name: "IRL Listener / The Witness",
      description: "Venue threads ×10pts + comments ×1pt",
      emoji: "MapPin",
      currentLevel: 1,
      currentPoints: 42,
      pointsFormula: "Venue Threads × 10 + Venue Comments × 1",
      unlocked: true,
      levels: [
        { level: 1, name: "IRL Observer", requirement: 25, emoji: "MapPin", color: "", description: "Taking it in" },
        { level: 2, name: "IRL Witness", requirement: 100, emoji: "MapPin", color: "", description: "Documenting moments" },
        { level: 3, name: "IRL Guide", requirement: 300, emoji: "MapPin", color: "", description: "Recording history" },
        { level: 4, name: "IRL Journalist", requirement: 750, emoji: "MapPin", color: "", description: "Professional witness" },
        { level: 5, name: "IRL Icon", requirement: 1500, emoji: "MapPin", color: "", description: "Keeper of memories" }
      ]
    },
    {
      id: "live-show-critic",
      name: "Live Show Critic",
      description: "Live reviews ×5pts",
      emoji: "Mic",
      currentLevel: 0,
      currentPoints: 0,
      pointsFormula: "Live Reviews × 5",
      unlocked: false,
      levels: [
        { level: 1, name: "Showgoer", requirement: 5, emoji: "Mic", color: "", description: "Present and engaged" },
        { level: 2, name: "Crowd Critic", requirement: 25, emoji: "Mic", color: "", description: "Sharing thoughts" },
        { level: 3, name: "Stage Analyst", requirement: 75, emoji: "Mic", color: "", description: "Deep critique" },
        { level: 4, name: "Top Reviewer", requirement: 200, emoji: "Mic", color: "", description: "Trusted voice" },
        { level: 5, name: "Live Authority", requirement: 500, emoji: "Mic", color: "", description: "Definitive judgment" }
      ]
    }
  ];

  // Special one-time achievements - simplified
  const specialAchievements: SpecialAchievement[] = [
    {
      id: "pulse-crew",
      name: "Pulse Crew",
      description: "Internal/core advocate badge for collaborators",
      emoji: "Zap",
      unlocked: true,
      unlockedDate: "Dec 2024",
      color: "",
      category: 'crew'
    },
    {
      id: "the-plug",
      name: "The Plug",
      description: "Invited 25+ members to the community",
      emoji: "Users",
      unlocked: false,
      color: "",
      category: 'community'
    },
    {
      id: "culture-catalyst",
      name: "Culture Catalyst",
      description: "Invited 100+ members to the community",
      emoji: "Users",
      unlocked: false,
      color: "",
      category: 'community'
    },
    {
      id: "og-member",
      name: "OG Member Badge",
      description: "Joined during the beta phase",
      emoji: "Crown",
      unlocked: true,
      unlockedDate: "Dec 2024",
      color: "",
      category: 'milestone'
    },
    {
      id: "first-thread",
      name: "First Thread Created",
      description: "Created your first discussion thread",
      emoji: "MessageCircle",
      unlocked: true,
      unlockedDate: "Jan 2025",
      color: "",
      category: 'milestone'
    },
    {
      id: "deep-listener",
      name: "Deep Listener",
      description: "Recognized by our team for a deeply contextual note or backstory",
      emoji: "Headphones",
      unlocked: false,
      color: "",
      category: 'milestone'
    },
    {
      id: "certified-review",
      name: "Certified Review",
      description: "Wrote a review that became community-certified quality",
      emoji: "CheckCircle",
      unlocked: false,
      color: "",
      category: 'milestone'
    },
    {
      id: "threadstarter",
      name: "Threadstarter",
      description: "Started popular thread with 100+ engagements",
      emoji: "Trophy",
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

  const renderIcon = (iconName: string, className: string = "h-4 w-4") => {
    const iconMap: { [key: string]: any } = {
      MessageCircle,
      Search,
      Music,
      Headphones,
      MapPin,
      Mic,
      Users,
      Zap,
      Crown,
      Trophy,
      CheckCircle,
      Minus
    };
    
    const IconComponent = iconMap[iconName];
    return IconComponent ? <IconComponent className={className} /> : <Minus className={className} />;
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
                    className={cn(
                      "w-full border p-4 text-left transition-colors",
                      track.unlocked 
                        ? "bg-[#111] border-[#222] hover:bg-[#1a1a1a]" 
                        : "bg-[#0a0a0a] border-[#1a1a1a] hover:bg-[#111] opacity-60"
                    )}
                    onClick={() => setActiveTrack(isExpanded ? null : track.id)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start space-x-4 flex-1 min-w-0">
                        <div className={cn(
                          "flex-shrink-0 mt-1",
                          track.unlocked ? "text-white" : "text-[#444]"
                        )}>
                          {track.unlocked ? renderIcon(track.emoji) : renderIcon("Minus")}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <div className={cn(
                              "font-medium text-sm truncate",
                              track.unlocked ? "text-white" : "text-[#666]"
                            )}>
                              {track.name}
                            </div>
                            {!track.unlocked && (
                              <div className="px-2 py-1 bg-[#1a1a1a] border border-[#333] rounded text-xs text-[#666] flex-shrink-0">
                                LOCKED
                              </div>
                            )}
                          </div>
                          <div className="text-xs text-[#666] mb-3">
                            {track.description}
                          </div>
                          {track.unlocked && (
                            <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded p-2">
                              <div className="flex items-center justify-between">
                                <div className="text-xs text-[#999]">Current Level</div>
                                <div className="text-xs text-[#666]">
                                  {track.currentPoints}pts
                                </div>
                              </div>
                              <div className="text-sm font-medium text-white mt-1">
                                {currentLevel?.name || "Not Started"}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className={cn(
                        "flex-shrink-0 transition-transform mt-1",
                        isExpanded ? "rotate-180" : ""
                      )}>
                        <ChevronDown className="h-4 w-4 text-[#666]" />
                      </div>
                    </div>
                  </button>
                  
                  {isExpanded && (
                    <div className="border-t border-[#1a1a1a] bg-[#0a0a0a] p-4">
                      {track.unlocked && nextLevel && (
                        <div className="mb-6">
                          <div className="flex justify-between items-center mb-3">
                            <span className="text-xs text-[#999] uppercase tracking-wider font-medium">Next Level Progress</span>
                            <span className="text-xs text-[#666] font-mono">{track.currentPoints}/{nextLevel.requirement}pts</span>
                          </div>
                          <Progress value={progressPercentage} className="h-2" />
                          <div className="text-xs text-[#666] mt-2">
                            {nextLevel.requirement - track.currentPoints} points to unlock: {nextLevel.name}
                          </div>
                        </div>
                      )}
                      
                      <div className="space-y-1">
                        <div className="text-xs text-[#999] uppercase tracking-wider font-medium mb-3">All Levels</div>
                        {track.levels.map((level, idx) => (
                          <div 
                            key={level.level}
                            className={cn(
                              "flex items-center justify-between p-3 rounded border",
                              level.level <= track.currentLevel 
                                ? "bg-[#111] border-[#222] text-white" 
                                : "bg-[#050505] border-[#1a1a1a] text-[#444]",
                              level.level === track.currentLevel && "ring-1 ring-[#333]"
                            )}
                          >
                            <div className="flex items-center space-x-3">
                              <div className={cn(
                                "flex items-center justify-center w-6 h-6 rounded-full border text-xs",
                                level.level <= track.currentLevel 
                                  ? "bg-white text-black border-white" 
                                  : "bg-transparent text-[#444] border-[#333]"
                              )}>
                                {level.level}
                              </div>
                              <div>
                                <div className={cn(
                                  "text-sm font-medium",
                                  level.level === track.currentLevel && "text-white"
                                )}>
                                  {level.name}
                                </div>
                                <div className="text-xs text-[#666]">{level.description}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-[#666] font-mono">{level.requirement}pts</div>
                              {level.level === track.currentLevel && (
                                <div className="text-xs text-white font-medium">CURRENT</div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {!track.unlocked && (
                        <div className="mt-4 p-3 bg-[#1a1a1a] border border-[#333] rounded text-center">
                          <div className="text-sm text-[#666] mb-1">Track Locked</div>
                          <div className="text-xs text-[#555]">Complete requirements to unlock this achievement track</div>
                        </div>
                      )}
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
            {unlockedAchievements.length > 0 && (
              <div className="space-y-3">
                <div className="text-xs text-[#999] uppercase tracking-wider font-medium px-1">Unlocked Achievements</div>
                {unlockedAchievements.map((achievement) => (
                  <div key={achievement.id} className="bg-[#111] border border-[#222] p-4 rounded">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className="text-white flex-shrink-0 mt-1">
                          {renderIcon(achievement.emoji)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="font-medium text-sm text-white">
                              {achievement.name}
                            </div>
                            <div className="px-2 py-1 bg-[#0a0a0a] border border-[#333] rounded text-xs text-[#999] flex-shrink-0">
                              {achievement.category.toUpperCase()}
                            </div>
                          </div>
                          <div className="text-xs text-[#666] mb-2">
                            {achievement.description}
                          </div>
                          {achievement.unlockedDate && (
                            <div className="text-xs text-[#888] bg-[#0a0a0a] border border-[#1a1a1a] rounded px-2 py-1 inline-block">
                              Unlocked {achievement.unlockedDate}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {lockedAchievements.length > 0 && (
              <div className="space-y-3">
                <div className="text-xs text-[#666] uppercase tracking-wider font-medium px-1">Locked Achievements</div>
                {lockedAchievements.map((achievement) => (
                  <div key={achievement.id} className="bg-[#0a0a0a] border border-[#1a1a1a] p-4 rounded opacity-60">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className="text-[#444] flex-shrink-0 mt-1">
                          {renderIcon("Minus")}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="font-medium text-sm text-[#666]">
                              {achievement.name}
                            </div>
                            <div className="px-2 py-1 bg-[#1a1a1a] border border-[#333] rounded text-xs text-[#555] flex-shrink-0">
                              LOCKED
                            </div>
                          </div>
                          <div className="text-xs text-[#555]">
                            {achievement.description}
                          </div>
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