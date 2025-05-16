import Header from "@/components/layout/Header";
import TabNavigator from "@/components/layout/TabNavigator";
import BottomNav from "@/components/layout/BottomNav";
import MusicPlayer from "@/components/layout/MusicPlayer";
import FeaturedArtists from "@/components/sections/FeaturedArtists";
import WhatsThisSong from "@/components/sections/WhatsThisSong";
import TrackIDs from "@/components/sections/TrackIDs";
import Threads from "@/components/sections/Threads";
import Venues from "@/components/sections/Venues";

export default function Home() {
  const tabs = [
    { label: "For You", path: "/" },
    { label: "Discover", path: "/discover" },
    { label: "What's That Song", path: "/whats-this-song" },
    { label: "Live Venues", path: "/venues" },
  ];

  return (
    <div className="min-h-screen pb-32">
      <Header />
      <TabNavigator tabs={tabs} />
      
      <main>
        <FeaturedArtists />
        <WhatsThisSong />
        <TrackIDs />
        <Threads />
        <Venues />
      </main>
      
      <MusicPlayer />
      <BottomNav />
    </div>
  );
}
