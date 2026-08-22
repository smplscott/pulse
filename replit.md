# Pulse - Social Music Discovery Platform

## Project Overview
A cutting-edge social music discovery platform that transforms digital music interactions into immersive, personalized experiences through advanced social and interactive technologies.

**Core Technologies:**
- React frontend with TypeScript
- Spotify API integration  
- Real-time WebSocket communication
- Tailwind CSS for responsive design
- Messaging system with friends and group chat functionality
- Dynamic social interaction design with contextual UI components

## Recent Changes

### April 2026 - Task #3: Artist Pages, Song Pages & Sets

**Schema additions (`shared/schema.ts`):**
- `trackIds` table: setId, title, artist, submittedBy, confirmCount, disagreeCount, locked, removed
- `trackIdVotes` table: userId, trackId, voteType (one vote per user per track)
- `sets` table extended with `city`, `country`, `eventDate` columns
- New types exported: `TrackId`, `InsertTrackId`, `TrackIdVote`, `InsertTrackIdVote`
- **Note:** The Set type is exported as `MusicSet` (renamed from `Set` to avoid JavaScript built-in name conflict)

**New API endpoints (`server/routes.ts`):**
- `GET/POST /api/artists`, `GET /api/artists/name/:name`, `POST /api/artists`
- `POST /api/songs`
- `GET /api/sets/:setId/track-ids`, `POST /api/sets/:setId/track-ids`
- `POST /api/track-ids/:trackId/vote` (confirm ✅ / disagree ❌, one per user, lock at 5 confirms, remove at 5 disagrees)

**Frontend pages rewritten:**
- `ArtistDetail.tsx` — artist card with country emoji + platform links, Threads/Similar Artists/Singles&EPs/Albums/Featured On sections
- `SongDetail.tsx` — engagement stats bar, Credits dialog, Similar Songs
- `Artists.tsx` — search + genre filter + "Add via Spotify" stub dialog
- `Songs.tsx` — search + genre filter + "Add via Spotify" stub dialog
- `Sets.tsx` — genre filter + create set dialog (name/city/country/date/link) + set cards
- `SetDetail.tsx` — full Track ID voting UI (submit track, confirm/disagree buttons, lock badge, vote persistence)
- `TrackIDCard.tsx` — rewritten to use `MusicSet` type (no longer uses defunct Playlist type)

**Storage (`server/storage-simple.ts`):**
- 3 seed artists: The Doors, The Weeknd, Bicep
- 3 seed sets with city/country/eventDate
- 4 seed trackIds for set #1 (including one locked at 5 confirms)
- Full implementations for track-id CRUD and voting

### April 2026 - Authentication System (Login & Sign Up)

**What was added:**
- Session-based authentication using `express-session` with `memorystore`
- Password hashing via Node.js built-in `crypto` (scrypt + random salt)
- Backend endpoints: `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
- `AuthContext` (`client/src/context/AuthContext.tsx`) — React context holding logged-in user state with `login`, `register`, `logout` helpers
- Login page (`/login`) — email/password form + "Forgot password" placeholder
- Signup page (`/signup`) — email, username, password, confirm-password form
- All app routes are now protected; unauthenticated users are redirected to `/login`
- Header updated to show logged-in user's avatar/initials, a dropdown with Profile and Log Out, and a notifications bell

**Schema changes:**
- `users` table: added `email` (unique) and `bio` text fields
- `insertUserSchema` updated to include `email` and `bio`

**Storage changes:**
- Added `getUserByEmail(email)` method to both `IStorage` interfaces and `MemStorage` implementations
- `createUser` updated to handle `email` and `bio` fields

### January 2025 - Underground Music Culture Badge System Revamp
**Date:** January 1, 2025

**Major Architectural Change:** Completely revamped the badges system with a mobile-first, underground music culture aesthetic that's minimal, mature, and authentic.

**Design Philosophy:**
- Removed flashy gradients, animations, and game-like elements
- Mobile-first layout with tight spacing for smaller screens
- Minimal color scheme using dark backgrounds (#0a0a0a, #111) with subtle borders
- Clean typography with proper hierarchy and underground culture naming

**Progressive Achievement Tracks (6 total):**
- Community Contributor: MessageCircle icon (threads 4pts + comments 1pt)
- Sample Identification: Search icon (sample IDs × 5pts) 
- Discovery Assistance: Music icon (successful recommendations × 3pts)
- ID Hunter: Headphones icon (setlist track IDs × 2pts)
- IRL Listener/The Witness: MapPin icon (venue threads 10pts + venue comments 1pt)
- Live Show Critic: Mic icon (live reviews × 5pts)

**One-Time Achievements:**
- Pulse Crew (Zap icon), The Plug/Culture Catalyst (Users icon)
- OG Member (Crown icon), First Thread (MessageCircle icon)
- Deep Listener (Headphones icon), Certified Review (CheckCircle icon)
- Threadstarter (Trophy icon)

**Technical Implementation:**
- Replaced emoji system with meaningful Lucide React icons
- Clean expandable sections with minimal progress indicators
- Simple tab navigation between Progressive and Achievements
- Mobile-optimized spacing and typography
- Underground culture naming conventions

**User Experience:**
- Clean stats overview with minimal design
- Expandable track details showing level progression
- Clear distinction between unlocked/locked states
- Authentic underground music scene aesthetic

### Previous Features
- Sets implementation with Figma-matching SetDetail page design
- Credits and Samples pages for Song Threads
- Fixed navigation bugs and import errors
- Sample songs added for testing functionality

## Project Architecture

**Frontend Structure:**
- `/client/src/pages/` - Main application pages
- `/client/src/components/` - Reusable UI components
- `/shared/schema.ts` - Type definitions and database schemas

**Key Pages:**
- `CommunityAchievements.tsx` - New achievement system (replaced Badges.tsx)
- `Credits.tsx` - Song credits with condensed table layout
- `Samples.tsx` - Sample identification and usage details
- `SetDetail.tsx` - Figma-designed set details page
- `ThreadDetail.tsx` - Enhanced with Credits/Samples buttons for songs

**Storage:**
- In-memory storage system (MemStorage)
- Progressive achievement tracking ready for backend integration

## User Preferences
- Trophy room design preferred over traditional badges
- Progressive leveling system with specific point calculations
- Emoji-based visual design for achievements
- Community-focused achievement categories

## Next Development Priorities
- Backend integration for achievement point tracking
- Real-time achievement unlock notifications
- Achievement sharing functionality
- Advanced achievement statistics and leaderboards