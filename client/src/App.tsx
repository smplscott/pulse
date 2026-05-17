import { ComponentType } from "react";
import { Switch, Route, Redirect } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/context/AuthContext";

import Home from "@/pages/Home";
import Discover from "@/pages/Discover";
import Threads from "@/pages/Threads";
import WhatsThisSong from "@/pages/WhatsThisSong";
import Venues from "@/pages/Venues";
import Library from "@/pages/Library";
import Profile from "@/pages/Profile";
import Artists from "@/pages/Artists";
import Songs from "@/pages/Songs";
import Shows from "@/pages/Shows";
import Places from "@/pages/Places";
import PlaceDetail from "@/pages/PlaceDetail";
// import Sets from "@/pages/Sets";        // Sets hidden from nav — re-enable when ready
// import SetDetail from "@/pages/SetDetail"; // Sets hidden from nav — re-enable when ready
import CommunityAchievements from "@/pages/CommunityAchievements";
import Messages from "@/pages/Messages";
import ArtistDetail from "@/pages/ArtistDetail";
import SongDetail from "@/pages/SongDetail";
import ThreadDetail from "@/pages/ThreadDetail";
import VenueDetail from "@/pages/VenueDetail";
import CreateThread from "@/pages/CreateThread";
import CreateSongRequest from "@/pages/CreateSongRequest";
import Credits from "@/pages/Credits";
import Samples from "@/pages/Samples";
import Notifications from "@/pages/Notifications";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import NotFound from "@/pages/not-found";

function ProtectedRoute({ component: Component }: { component: ComponentType }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#1DB954] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/" component={() => <ProtectedRoute component={Home} />} />
      <Route path="/discover" component={() => <ProtectedRoute component={Discover} />} />
      <Route path="/threads" component={() => <ProtectedRoute component={Threads} />} />
      <Route path="/whats-this-song" component={() => <ProtectedRoute component={WhatsThisSong} />} />
      <Route path="/venues" component={() => <ProtectedRoute component={Venues} />} />
      <Route path="/library" component={() => <ProtectedRoute component={Library} />} />
      <Route path="/profile" component={() => <ProtectedRoute component={Profile} />} />
      <Route path="/profile/:username" component={Profile} />
      <Route path="/notifications" component={() => <ProtectedRoute component={Notifications} />} />
      <Route path="/achievements" component={() => <ProtectedRoute component={CommunityAchievements} />} />
      <Route path="/messages" component={() => <ProtectedRoute component={Messages} />} />
      <Route path="/artists" component={() => <ProtectedRoute component={Artists} />} />
      <Route path="/songs" component={() => <ProtectedRoute component={Songs} />} />
      <Route path="/shows" component={() => <ProtectedRoute component={Shows} />} />
      <Route path="/places" component={() => <ProtectedRoute component={Places} />} />
      <Route path="/places/:id" component={() => <ProtectedRoute component={PlaceDetail} />} />
      {/* /venues redirects to /places for backward compat */}
      <Route path="/venues" component={() => <ProtectedRoute component={Places} />} />
      {/* <Route path="/sets" component={() => <ProtectedRoute component={Sets} />} /> */}
      <Route path="/artist/:id" component={() => <ProtectedRoute component={ArtistDetail} />} />
      <Route path="/song/:id" component={() => <ProtectedRoute component={SongDetail} />} />
      <Route path="/thread/:id" component={() => <ProtectedRoute component={ThreadDetail} />} />
      <Route path="/venue/:id" component={() => <ProtectedRoute component={VenueDetail} />} />
      {/* <Route path="/sets/:id" component={() => <ProtectedRoute component={SetDetail} />} /> */}
      <Route path="/credits/:id" component={() => <ProtectedRoute component={Credits} />} />
      <Route path="/samples/:id" component={() => <ProtectedRoute component={Samples} />} />
      <Route path="/create-thread" component={() => <ProtectedRoute component={CreateThread} />} />
      <Route path="/create-song-request" component={() => <ProtectedRoute component={CreateSongRequest} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AuthProvider>
          <Router />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
