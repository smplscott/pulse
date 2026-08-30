import { ComponentType } from "react";
import { Switch, Route, Redirect } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/context/AuthContext";

import Home from "@/pages/Home";
import Profile from "@/pages/Profile";
import Radar from "@/pages/Radar";
import Artists from "@/pages/Artists";
import Shows from "@/pages/Shows";
import ShowDetail from "@/pages/ShowDetail";
import Places from "@/pages/Places";
import PlaceDetail from "@/pages/PlaceDetail";
// import Sets from "@/pages/Sets";        // Sets hidden from nav — re-enable when ready
// import SetDetail from "@/pages/SetDetail"; // Sets hidden from nav — re-enable when ready
import CommunityAchievements from "@/pages/CommunityAchievements";
import ThreadDetail from "@/pages/ThreadDetail";
import CreateThread from "@/pages/CreateThread";
import Notifications from "@/pages/Notifications";
import AlbumPage from "@/pages/AlbumPage";
import AlbumDetail from "@/pages/AlbumDetail";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import FollowedArtistsPage from "@/pages/FollowedArtistsPage";
import SavedPlacesPage from "@/pages/SavedPlacesPage";
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
      <Route path="/venues" component={() => <Redirect to="/places" />} />
      <Route path="/radar" component={() => <ProtectedRoute component={Radar} />} />
      <Route path="/profile" component={() => <ProtectedRoute component={Profile} />} />
      <Route path="/profile/artist-follows" component={() => <ProtectedRoute component={FollowedArtistsPage} />} />
      <Route path="/profile/saved-places" component={() => <ProtectedRoute component={SavedPlacesPage} />} />
      <Route path="/profile/:username" component={() => <ProtectedRoute component={Profile} />} />
      <Route path="/notifications" component={() => <ProtectedRoute component={Notifications} />} />
      <Route path="/achievements" component={() => <ProtectedRoute component={CommunityAchievements} />} />
      <Route path="/artists" component={() => <ProtectedRoute component={Artists} />} />
      <Route path="/shows" component={Shows} />
      <Route path="/shows/:id" component={ShowDetail} />
      <Route path="/places" component={() => <ProtectedRoute component={Places} />} />
      <Route path="/places/:id" component={() => <ProtectedRoute component={PlaceDetail} />} />
      {/* <Route path="/sets" component={() => <ProtectedRoute component={Sets} />} /> */}
      <Route path="/artist/:id" component={() => <Redirect to="/artists" />} />
      <Route path="/albums/:albumId" component={() => <ProtectedRoute component={AlbumDetail} />} />
      <Route path="/album/:spotifyId" component={() => <ProtectedRoute component={AlbumPage} />} />
      <Route path="/thread/:id" component={() => <ProtectedRoute component={ThreadDetail} />} />
      <Route path="/venue/:id" component={() => <Redirect to="/places" />} />
      {/* <Route path="/sets/:id" component={() => <ProtectedRoute component={SetDetail} />} /> */}
      <Route path="/create-thread" component={() => <ProtectedRoute component={CreateThread} />} />
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
