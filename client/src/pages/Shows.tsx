import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import { Ticket } from "lucide-react";

export default function Shows() {
  return (
    <div className="min-h-screen pb-32">
      <Header />
      <main className="px-4 pt-8 max-w-lg mx-auto text-center">
        <div className="w-16 h-16 rounded-full bg-[#1a1a2e] border border-[#5271ff]/30 flex items-center justify-center mx-auto mb-4">
          <Ticket className="h-8 w-8 text-[#5271ff]" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Shows</h1>
        <p className="text-[#B3B3B3] text-sm leading-relaxed max-w-xs mx-auto">
          Browse and review past shows. Search by artist to find concerts, leave reviews, and see what the community thought.
        </p>
        <p className="mt-6 text-xs text-[#666] bg-[#181818] rounded-lg px-4 py-3 inline-block">
          Coming soon — building now
        </p>
      </main>
      <BottomNav />
    </div>
  );
}
