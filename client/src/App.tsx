import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import Home from "@/pages/Home";
import Discover from "@/pages/Discover";
import Threads from "@/pages/Threads";
import WhatsThisSong from "@/pages/WhatsThisSong";
import Venues from "@/pages/Venues";
import Library from "@/pages/Library";
import Profile from "@/pages/Profile";
import Artists from "@/pages/Artists";
import Songs from "@/pages/Songs";
import Sets from "@/pages/Sets";
import Badges from "@/pages/Badges";
import Messages from "@/pages/Messages";
import ArtistDetail from "@/pages/ArtistDetail";
import SongDetail from "@/pages/SongDetail";
import ThreadDetail from "@/pages/ThreadDetail";
import VenueDetail from "@/pages/VenueDetail";
import SetDetail from "@/pages/SetDetail";
import CreateThread from "@/pages/CreateThread";
import CreateSongRequest from "@/pages/CreateSongRequest";
import Credits from "@/pages/Credits";
import Samples from "@/pages/Samples";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/discover" component={Discover} />
      <Route path="/threads" component={Threads} />
      <Route path="/whats-this-song" component={WhatsThisSong} />
      <Route path="/venues" component={Venues} />
      <Route path="/library" component={Library} />
      <Route path="/profile" component={Profile} />
      <Route path="/badges" component={Badges} />
      <Route path="/messages" component={Messages} />
      <Route path="/artists" component={Artists} />
      <Route path="/songs" component={Songs} />
      <Route path="/sets" component={Sets} />
      <Route path="/artist/:id" component={ArtistDetail} />
      <Route path="/song/:id" component={SongDetail} />
      <Route path="/thread/:id" component={ThreadDetail} />
      <Route path="/venue/:id" component={VenueDetail} />
      <Route path="/sets/:id" component={SetDetail} />
      <Route path="/credits/:id" component={Credits} />
      <Route path="/samples/:id" component={Samples} />
      <Route path="/create-thread" component={CreateThread} />
      <Route path="/create-song-request" component={CreateSongRequest} />
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
