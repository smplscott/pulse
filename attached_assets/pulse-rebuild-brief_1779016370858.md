# Pulse — Replit Rebuild Brief
**Version:** 2.0 Direction  
**Status:** Ready for development  
**Prepared:** May 2026

---

## Overview

Pulse is a community platform for music heads who actually go to shows. The core thesis: music culture knowledge — which shows were life-changing, which venues are genre-defining, which albums deserve deeper conversation — lives in people's heads and dies there. Pulse gives it a home.

This brief covers the structural changes needed to evolve the existing Replit prototype toward the IRL-first direction. It does not require a full rebuild — the visual language, auth flow, and thread feed are solid foundations to carry forward.

---

## What Stays

- Visual identity: dark backgrounds, acid green PULSE wordmark, color-coded thread type badges
- Email/password login (no Spotify OAuth login)
- Thread feed as the home screen (Popular Discussions)
- Star ratings on thread cards in the feed
- "Create Thread" modal pattern (keep the UX, change the options inside)
- Profile page structure (threads started / threads engaged)

---

## Navigation Changes

### Replace the bottom nav

**Current:** Threads / Artists / Songs / Profile  
**New:** Threads / Shows / Places / Profile

| Tab | Icon | Purpose |
|-----|------|---------|
| Threads | Messages | Home feed — all activity across shows, albums, topics |
| Shows | Ticket | Browse and review past shows; upcoming shows in Phase 2 |
| Places | Map pin | Genre-tagged IRL spots, user-generated, city-searchable |
| Profile | User | Identity, activity history, IRL credibility layer |

**Artists is no longer a nav tab.** It becomes a search layer accessed via the global search bar. Albums surface through artist pages, also accessed via search.

### Add a persistent global search bar

A search bar sits at the top of every tab (not just Artists). Tapping it opens a search experience that returns grouped results across:

- Artists (via Spotify API)
- Shows (via Setlist.fm API)
- Albums (via Spotify API)
- Places (user-generated, from own database)

Results are grouped by type with a filter pill row: All / Artists / Shows / Albums / Places.

---

## Shows Tab (New — Primary Build)

This is the main new feature. Shows replaces the Artists tab entirely.

### Default state
- List of recent/notable past shows, surfaced from community activity (most reviewed first)
- Search bar at top to find shows by artist name
- Filter chips: All / By City / By Genre

### How shows get into the system

**Primary source:** Setlist.fm API  
Search by artist name → returns show history with venue, date, city, setlist.  

**Manual entry fallback:**  
If a show isn't found via API, users can create it. Manual entry form requires:
- Artist (linked via Spotify artist search — mandatory)
- Venue name
- City
- Date
- Optional: notes/context

Manual entries are marked with a "Community added" indicator.

### Show page structure

Each show has its own page with two tabs:

**Reviews tab**
- One review per user (enforced)
- Star rating (1–5) + written review
- Reviews aggregate into an overall show score shown at the top
- "I was there" badge auto-applied to reviewer's profile when they post

**Discussion tab**
- Open thread — anyone can post, reply, like
- No rating required
- Sorted by votes (default) or recent

### Show card (in list view)
Shows: artist name, venue, city, date, aggregate star rating (if reviews exist), comment count.

---

## Thread Creation Flow Changes

### Current flow
Search songs or artists → choose thread type

### New flow
1. Search artists first (Spotify API)
2. Once artist selected, choose thread type:
   - **Live Show Review** → prompts "Which show?" (pulls from Setlist.fm for that artist, with manual entry option)
   - **Album Review** → prompts "Which album?" (pulls from Spotify discography)
   - **Topic / General** → open discussion, no anchor required

### Thread types (revised)

| Type | Badge colour | Notes |
|------|-------------|-------|
| Live Show Review | Orange | Requires star rating + show selection |
| Album Review | Blue | Requires album selection via Spotify |
| Topic | Purple | Open discussion, no anchor |

**Remove:** "Listening Right Now" and "New Music / Discoveries" as standalone thread types. These concepts get absorbed — listening discussions happen in Topic threads, new music surfaces through Album Reviews.

---

## Places Tab (Carry Forward + Promote)

The Places concept from the second prototype is strong and distinctive. Promote it to a primary nav tab. Keep the core experience, simplify where needed.

### List view
- Search bar: search by venue name, city, or genre
- Category filter chips: All / Bars / Clubs / Record Stores / Coffee Shops / Other
- Place cards show: venue name, city/country, genre tags (#House #Jazz etc.), star rating, "Drop In" CTA

### Place page structure
- Venue name, city, genre tags, rating
- Short description (user-written on submission)
- Discussion thread (open, anyone can post — same thread component as show pages)
- "Drop In" button opens/focuses the thread input

### Adding a place (user-generated)
Simple submission form:
- Venue name (required)
- City + country (required)
- Category: Bars / Clubs / Record Stores / Coffee Shops / Other
- Genre tags (multi-select from a predefined list, or type custom)
- Short description — "What makes this place special for music heads?" (required, max 280 chars)
- Google Maps link or address (optional but encouraged)

Places are live immediately on submission — no approval gate at this stage.

### Why this is a differentiator
No product currently lets you search a city by music genre culture. Google Maps won't tell you a bar plays deep house on Fridays. Yelp has no genre filter. This is genuinely unowned territory.

**Post-signup CTA:** After a user posts their first show review, prompt: *"Know a spot in [their city] great for [genre]? Add it to Places."* Contextual, not pushy.

---

## Artist Page (via Search)

When a user taps an artist from search results, they land on an artist hub page. This replaces the standalone Artists tab.

### Artist page structure

**Header:** Artist image (Spotify), name, genres, country flag, follower count (Spotify)

**Three tabs:**

**Shows** — list of past shows for this artist (Setlist.fm), each linking to its show page. Sorted by most recent. Shows aggregate review score if reviews exist.

**Albums** — discography pulled from Spotify. Each album links to an album page with Reviews tab + Discussion tab (same pattern as show pages).

**Threads** — all Topic threads linked to this artist, sorted by activity.

---

## Profile Page Changes

Keep the existing structure, add:

- **"Shows attended" count** — number of shows the user has reviewed (auto-calculated)
- **"Places added" count** — number of places submitted
- **City / scene tag** — optional field users set on their profile. Powers local discovery later.
- **"I was there" indicator** on show review cards in the profile feed — a small badge that signals IRL credibility

---

## API Stack

| API | Purpose | Notes |
|-----|---------|-------|
| Spotify Web API | Artist search, artist metadata, album/discography data, artist images | Already in prototype |
| Setlist.fm API | Past show data by artist — venue, date, city, setlist | Free tier sufficient to start |
| Ticketmaster Discovery API | Upcoming shows | Phase 2 only — skip for now |
| Google Maps (optional) | Venue location on place pages | Phase 2 — link only for now |

---

## Phase Roadmap Summary

### Phase 1 (this build)
- Global search bar across all tabs
- Shows tab with past show browsing, show pages (Reviews + Discussion), manual entry fallback
- Revised thread creation flow (artist-first, show/album/topic branches)
- Places tab promoted to primary nav with submission flow
- Artist hub page accessible via search
- Profile updates (shows attended, places added, city tag)

### Phase 2
- Upcoming shows via Ticketmaster API
- "I'm going" signals on upcoming show pages
- Hype/anticipation threads on upcoming shows
- Map view on Places tab
- Explore tab (if content density warrants a browse mode)

### Phase 3 (premium)
- Fan meetup coordination tied to upcoming shows
- Show-scoped group space — no number exchange required
- Ticket verification for trust layer
- Monetisation around this coordination feature

---

## Things to Cut or Defer

- **Songs tab** — remove entirely. Songs are too granular for meaningful community discussion.
- **"Listening Right Now" thread type** — remove as a type. Absorb into Topic.
- **"New Music / Discoveries" thread type** — absorb into Album Review or Topic.
- **Map view on Places** — defer to Phase 2. List + city search is enough to launch.
- **Upcoming shows** — defer to Phase 2. Build past shows first.

---

## Notes for Developer Handoff

The visual system (dark theme, green accent, badge colours) is solid — don't change it. The main structural changes are:

1. Nav restructure (4 tabs, new labels)
2. New Shows tab and show page template
3. Global search component with grouped results
4. Thread creation modal — new flow and reduced type options
5. Places tab promoted from secondary to primary nav
6. Artist page as a hub (accessible via search, not nav)

The show page and place page share the same Reviews + Discussion tab pattern — build it once as a reusable component.
