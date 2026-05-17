import { useState } from "react";
import { useLocation } from "wouter";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import MusicPlayer from "@/components/layout/MusicPlayer";
import NewThreadDialog from "@/components/threads/NewThreadDialog";

export default function CreateThread() {
  const [, navigate] = useLocation();
  const [open, setOpen] = useState(true);

  return (
    <div className="min-h-screen pb-32">
      <Header />
      <NewThreadDialog
        open={open}
        onOpenChange={(o) => {
          if (!o) navigate("/");
        }}
      />
      <MusicPlayer />
      <BottomNav />
    </div>
  );
}
