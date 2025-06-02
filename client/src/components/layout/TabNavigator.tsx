import { cn } from "@/lib/utils";

type Tab = {
  id: string;
  label: string;
};

type TabNavigatorProps = {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
};

export default function TabNavigator({ tabs, activeTab, onTabChange, className }: TabNavigatorProps) {
  return (
    <div className={cn("px-4 pt-6 pb-2 bg-[#121212]", className)}>
      <div className="flex space-x-2 overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap",
                isActive
                  ? "bg-[#282828] text-white"
                  : "bg-[#181818] border border-[#3E3E3E] text-[#B3B3B3]"
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
