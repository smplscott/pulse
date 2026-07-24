import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage-simple";
import { z } from "zod";
import { insertUserSchema, insertArtistSchema, insertSongSchema, insertThreadSchema, insertCommentSchema, insertSongRecommendationSchema, insertSetSchema, insertTrackIdSchema, insertTrackIdVoteSchema, insertPlaceSchema, insertPlaceCommentSchema, insertShowSchema, insertShowReviewSchema, insertShowCommentSchema, insertUserTravelPlanSchema, insertUserShowWishlistSchema, artistResponseSchema, songResponseSchema, venueResponseSchema, musicSetResponseSchema, insertPlaceListSchema, insertPlaceListItemSchema } from "@shared/schema";
import type { Artist, Song, Venue, MusicSet, ArtistResponse, SongResponse, VenueResponse, MusicSetResponse, Badge } from "@shared/schema";

// ─── Runtime normalization helpers ───────────────────────────────────────────
// These coerce jsonb fields to their expected shapes, then validate against the
// Zod response schemas.  Element-level filtering removes entries that don't fit
// the declared type (e.g. non-string genres, malformed streaming links).
// safeParse logs mismatches without blocking the response.

function normalizeArtist(a: Artist): ArtistResponse {
  const pre = {
    ...a,
    genres: Array.isArray(a.genres)
      ? a.genres.filter((g): g is string => typeof g === "string")
      : [],
    streamingLinks: Array.isArray(a.streamingLinks)
      ? a.streamingLinks.filter(
          (l): l is { platform: string; url: string } => {
            const obj = l as unknown as Record<string, unknown>;
            return obj !== null && typeof obj === "object" &&
              typeof obj.platform === "string" && typeof obj.url === "string";
          },
        )
      : [],
  };
  const result = artistResponseSchema.safeParse(pre);
  if (!result.success) {
    console.warn("[normalizeArtist] shape mismatch:", result.error.flatten());
    return pre as ArtistResponse;
  }
  return result.data;
}

function normalizeSong(s: Song): SongResponse {
  const pre = {
    ...s,
    features: Array.isArray(s.features)
      ? s.features.filter((f): f is string => typeof f === "string")
      : [],
    dialects: Array.isArray(s.dialects)
      ? s.dialects.filter((d): d is string => typeof d === "string")
      : [],
    subGenres: Array.isArray(s.subGenres)
      ? s.subGenres.filter((g): g is string => typeof g === "string")
      : [],
    streamingLinks:
      s.streamingLinks !== null &&
      typeof s.streamingLinks === "object" &&
      !Array.isArray(s.streamingLinks)
        ? Object.fromEntries(
            Object.entries(s.streamingLinks as Record<string, unknown>).filter(
              ([, v]) => typeof v === "string",
            ) as [string, string][],
          )
        : {},
  };
  const result = songResponseSchema.safeParse(pre);
  if (!result.success) {
    console.warn("[normalizeSong] shape mismatch:", result.error.flatten());
    return pre as SongResponse;
  }
  return result.data;
}

function normalizeVenue(v: Venue): VenueResponse {
  const pre = {
    ...v,
    genres: Array.isArray(v.genres)
      ? v.genres.filter((g): g is string => typeof g === "string")
      : [],
    upcomingEvents: Array.isArray(v.upcomingEvents)
      ? v.upcomingEvents.filter(
          (e): e is { date: string; artist: string; ticketsUrl?: string } => {
            const obj = e as unknown as Record<string, unknown>;
            return obj !== null && typeof obj === "object" &&
              typeof obj.date === "string" && typeof obj.artist === "string";
          },
        )
      : [],
  };
  const result = venueResponseSchema.safeParse(pre);
  if (!result.success) {
    console.warn("[normalizeVenue] shape mismatch:", result.error.flatten());
    return pre as VenueResponse;
  }
  return result.data;
}

function normalizeMusicSet(s: MusicSet): MusicSetResponse {
  const pre = {
    ...s,
    genres: Array.isArray(s.genres)
      ? s.genres.filter((g): g is string => typeof g === "string")
      : [],
    songs: Array.isArray(s.songs) ? s.songs : [],
    tags: Array.isArray(s.tags)
      ? s.tags.filter((t): t is string => typeof t === "string")
      : [],
  };
  const result = musicSetResponseSchema.safeParse(pre);
  if (!result.success) {
    console.warn("[normalizeMusicSet] shape mismatch:", result.error.flatten());
    return pre as MusicSetResponse;
  }
  return result.data;
}

const scryptAsync = promisify(scrypt);

// ── Spotify token cache (module-level so all routes share it) ──────────────
let _spotifyTokenCache: { token: string; expiresAt: number } | null = null;
async function getSpotifyToken(): Promise<string | null> {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  if (_spotifyTokenCache && Date.now() < _spotifyTokenCache.expiresAt) return _spotifyTokenCache.token;
  try {
    const res = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      },
      body: "grant_type=client_credentials",
    });
    if (!res.ok) return null;
    const data = await res.json() as { access_token: string; expires_in: number };
    _spotifyTokenCache = { token: data.access_token, expiresAt: Date.now() + (data.expires_in - 60) * 1000 };
    return data.access_token;
  } catch { return null; }
}

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  const [hashed, salt] = stored.split(".");
  if (!hashed || !salt) return false;
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

declare module "express-session" {
  interface SessionData {
    userId: number;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const schema = insertUserSchema.extend({
        username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
        email: z.string().email("Invalid email address"),
        password: z.string().min(6, "Password must be at least 6 characters"),
      });
      const { username, email, password, displayName } = schema.parse(req.body);

      const existingByUsername = await storage.getUserByUsername(username);
      if (existingByUsername) {
        return res.status(400).json({ message: "Username already taken" });
      }

      const existingByEmail = await storage.getUserByEmail(email);
      if (existingByEmail) {
        return res.status(400).json({ message: "Email already registered" });
      }

      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({ username, email, password: hashedPassword, displayName: displayName || username });

      req.session.userId = user.id;
      const { password: _, ...userWithoutPassword } = user;
      return res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0]?.message || "Validation error" });
      }
      return res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { identifier, password } = z.object({
        identifier: z.string().min(1, "Email or username required"),
        password: z.string().min(1, "Password required"),
      }).parse(req.body);

      const isEmail = identifier.includes("@");
      const user = isEmail
        ? await storage.getUserByEmail(identifier)
        : await storage.getUserByUsername(identifier);

      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const passwordMatch = await comparePasswords(password, user.password);
      if (!passwordMatch) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      req.session.userId = user.id;
      const { password: _, ...userWithoutPassword } = user;
      return res.json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0]?.message || "Validation error" });
      }
      return res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy(() => {
      res.json({ message: "Logged out" });
    });
  });

  app.get("/api/auth/me", async (req: Request, res: Response) => {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    const { password, ...userWithoutPassword } = user;
    return res.json(userWithoutPassword);
  });

  // Users routes
  app.get("/api/users/username/:username", async (req: Request, res: Response) => {
    const user = await storage.getUserByUsername(req.params.username);
    if (!user) return res.status(404).json({ message: "User not found" });
    const { password, email, ...publicProfile } = user;
    const [threadsCount, showReviewCount, placesCount] = await Promise.all([
      storage.getThreadsCountByUser(user.id),
      storage.getShowReviewCountByUser(user.id),
      storage.getPlacesCountByUser(user.id),
    ]);
    return res.json({ ...publicProfile, threadsCount, showReviewCount, placesCount });
  });

  app.get("/api/users/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    
    const user = await storage.getUser(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    const { password, ...userWithoutPassword } = user;
    return res.json(userWithoutPassword);
  });

  app.patch("/api/users/:id", async (req: Request, res: Response) => {
    const sessionUserId = req.session.userId;
    if (!sessionUserId) return res.status(401).json({ message: "Not authenticated" });
    const id = parseInt(req.params.id);
    if (isNaN(id) || id !== sessionUserId) return res.status(403).json({ message: "Forbidden" });

    const schema = z.object({
      displayName: z.string().max(50).optional(),
      bio: z.string().max(300).optional(),
      city: z.string().max(100).optional().nullable(),
    });
    try {
      const updates = schema.parse(req.body);
      const updated = await storage.updateUser(id, updates);
      if (!updated) return res.status(404).json({ message: "User not found" });
      const { password, email, ...publicProfile } = updated;
      return res.json(publicProfile);
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ message: error.errors[0]?.message || "Validation error" });
      return res.status(500).json({ message: "Failed to update profile" });
    }
  });
  
  app.post("/api/users", async (req: Request, res: Response) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      const { password, ...userWithoutPassword } = user;
      return res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      return res.status(500).json({ message: "Failed to create user" });
    }
  });
  
  // Artists routes
  app.get("/api/artists", async (_req: Request, res: Response) => {
    const artists = await storage.getAllArtists();
    return res.json(artists.map(normalizeArtist));
  });
  
  app.get("/api/artists/featured", async (_req: Request, res: Response) => {
    const artists = await storage.getFeaturedArtists();
    return res.json(artists.map(normalizeArtist));
  });
  
  app.get("/api/artists/name/:name", async (req: Request, res: Response) => {
    const artist = await storage.getArtistByName(req.params.name);
    if (!artist) {
      return res.status(404).json({ message: "Artist not found" });
    }
    return res.json(normalizeArtist(artist));
  });

  app.get("/api/artists/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid artist ID" });
    }
    
    const artist = await storage.getArtist(id);
    if (!artist) {
      return res.status(404).json({ message: "Artist not found" });
    }
    
    return res.json(normalizeArtist(artist));
  });

  app.post("/api/artists", async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) return res.status(401).json({ message: "Not authenticated" });
      const artistData = insertArtistSchema.parse(req.body);
      const artist = await storage.createArtist(artistData);
      return res.status(201).json(artist);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0]?.message || "Validation error" });
      }
      return res.status(500).json({ message: "Failed to create artist" });
    }
  });

  app.patch("/api/artists/:id", async (req: Request, res: Response) => {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid artist ID" });
    const schema = z.object({
      profilePicture: z.string().url().nullable().optional(),
      spotifyId: z.string().nullable().optional(),
      lastEnrichedAt: z.coerce.date().nullable().optional(),
    });
    try {
      const updates = schema.parse(req.body);
      const artist = await storage.updateArtist(id, updates);
      if (!artist) return res.status(404).json({ message: "Artist not found" });
      return res.json(normalizeArtist(artist));
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0]?.message || "Validation error" });
      }
      return res.status(500).json({ message: "Failed to update artist" });
    }
  });
  
  // Songs routes
  app.get("/api/songs", async (_req: Request, res: Response) => {
    const songs = await storage.getAllSongs();
    return res.json(songs.map(normalizeSong));
  });
  
  app.get("/api/songs/artist/:artistName", async (req: Request, res: Response) => {
    const artistName = req.params.artistName;
    const songs = await storage.getSongsByArtist(artistName);
    return res.json(songs.map(normalizeSong));
  });

  app.get("/api/songs/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid song ID" });
    }
    
    const song = await storage.getSong(id);
    if (!song) {
      return res.status(404).json({ message: "Song not found" });
    }
    
    return res.json(normalizeSong(song));
  });
  
  // Venues routes
  app.get("/api/venues", async (_req: Request, res: Response) => {
    const venues = await storage.getAllVenues();
    return res.json(venues.map(normalizeVenue));
  });
  
  app.get("/api/venues/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid venue ID" });
    }
    
    const venue = await storage.getVenue(id);
    if (!venue) {
      return res.status(404).json({ message: "Venue not found" });
    }
    
    return res.json(normalizeVenue(venue));
  });
  
  // Global search — aggregates Spotify artists, Setlist.fm shows, Spotify albums, local places
  app.get("/api/search", async (req: Request, res: Response) => {
    const q = ((req.query.q as string) || "").trim();
    const type = (req.query.type as string) || "all";
    if (!q || q.length < 2) return res.json({ artists: [], shows: [], albums: [], places: [] });

    const results: { artists: unknown[]; shows: unknown[]; albums: unknown[]; places: unknown[] } = {
      artists: [], shows: [], albums: [], places: [],
    };

    const token = await getSpotifyToken();
    const setlistKey = process.env.SETLISTFM_API_KEY;

    type SpotifyArtistItem = { id: string; name: string; images: Array<{ url: string }>; genres: string[] };
    type SpotifyAlbumItem = { id: string; name: string; images: Array<{ url: string }>; release_date: string; artists: Array<{ id: string; name: string }> };
    type SetlistFmSetlist = { id: string; artist: { name: string }; venue: { name: string; city: { name: string; country: { name: string } } }; eventDate: string };

    await Promise.allSettled([
      // Spotify artists
      (type === "all" || type === "artists") && token
        ? fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=artist&limit=6`, {
            headers: { Authorization: `Bearer ${token}` },
          }).then(r => r.json()).then((data: { artists?: { items: SpotifyArtistItem[] } }) => {
            results.artists = (data.artists?.items || []).map(a => ({
              spotifyId: a.id, name: a.name, imageUrl: a.images[0]?.url || null, genres: (a.genres || []).slice(0, 2),
            }));
          }).catch(err => console.warn("[search] Spotify artist search failed:", err))
        : Promise.resolve(),

      // Setlist.fm shows
      (type === "all" || type === "shows") && setlistKey
        ? fetch(`https://api.setlist.fm/rest/1.0/search/setlists?artistName=${encodeURIComponent(q)}&p=1`, {
            headers: { "x-api-key": setlistKey, Accept: "application/json" },
          }).then(r => r.json()).then((data: { setlist?: SetlistFmSetlist[] }) => {
            results.shows = (data.setlist || []).slice(0, 6).map(s => ({
              setlistfmId: s.id,
              artistName: s.artist?.name ?? q,
              venueName: s.venue?.name ?? "Unknown Venue",
              city: s.venue?.city?.name ?? "",
              country: s.venue?.city?.country?.name ?? "",
              eventDate: s.eventDate ? s.eventDate.split("-").reverse().join("-") : "",
            }));
          }).catch(err => console.warn("[search] Setlist.fm search failed:", err))
        : Promise.resolve(),

      // Spotify albums
      (type === "all" || type === "albums") && token
        ? fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=album&limit=6`, {
            headers: { Authorization: `Bearer ${token}` },
          }).then(r => r.json()).then((data: { albums?: { items: SpotifyAlbumItem[] } }) => {
            results.albums = (data.albums?.items || []).map(a => ({
              spotifyId: a.id, name: a.name,
              imageUrl: a.images[0]?.url || null,
              releaseYear: a.release_date?.slice(0, 4) || "",
              artistName: a.artists?.[0]?.name || "",
              artistSpotifyId: a.artists?.[0]?.id || "",
            }));
          }).catch(err => console.warn("[search] Spotify album search failed:", err))
        : Promise.resolve(),

      // Local places
      (type === "all" || type === "places")
        ? storage.searchPlaces(q).then(places => {
            results.places = places.slice(0, 6).map(p => ({
              id: p.id, name: p.name, city: p.city, country: p.country, category: p.category,
            }));
          }).catch(err => console.warn("[search] Places search failed:", err))
        : Promise.resolve(),
    ]);

    return res.json(results);
  });

  // Threads routes
  app.get("/api/threads/featured", async (req: Request, res: Response) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const threadType = req.query.threadType as string | undefined;
    let threads = await storage.getFeaturedThreads(limit * 3);
    if (threadType) {
      if (threadType === "artist") {
        threads = threads.filter(t => t.threadType === "live_show_review" || t.threadType === "album_review");
      } else {
        threads = threads.filter(t => t.threadType === threadType);
      }
    }
    return res.json(threads.slice(0, limit));
  });

  app.get("/api/threads", async (req: Request, res: Response) => {
    const type = req.query.type as string | undefined;
    const artistName = req.query.artistName as string | undefined;
    const artistIdParam = req.query.artistId as string | undefined;
    const albumId = req.query.albumId as string | undefined;
    let threads = await storage.getAllThreads(type);

    // Artist filter: support numeric artistId AND/OR artistName (OR logic when both given)
    if (artistIdParam || artistName) {
      const aid = artistIdParam ? parseInt(artistIdParam) : null;
      const lc = artistName ? artistName.toLowerCase() : null;
      threads = threads.filter(t =>
        (aid !== null && !isNaN(aid) && t.artistId === aid) ||
        (lc !== null && t.artistName != null && t.artistName.toLowerCase() === lc)
      );
    }

    if (albumId) {
      threads = threads.filter(t => t.albumId === albumId);
    }
    return res.json(threads);
  });

  app.get("/api/threads/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid thread ID" });
    }
    
    const thread = await storage.getThread(id);
    if (!thread) {
      return res.status(404).json({ message: "Thread not found" });
    }
    
    return res.json(thread);
  });

  app.get("/api/users/:userId/threads/engaged", async (req: Request, res: Response) => {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    const threads = await storage.getEngagedThreadsByUser(userId);
    return res.json(threads);
  });
  
  app.post("/api/threads", async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) return res.status(401).json({ message: "Not authenticated" });

      const schema = insertThreadSchema.extend({
        title: z.string().min(3, "Title must be at least 3 characters"),
        threadType: z.enum(["new_music", "listening_now", "live_show_review", "album_review", "topic"]),
        starRating: z.number().int().min(1).max(5).optional().nullable(),
        songId: z.number().int().optional().nullable(),
        artistId: z.number().int().optional().nullable(),
        setId: z.number().int().optional().nullable(),
        showId: z.number().int().optional().nullable(),
        albumId: z.string().optional().nullable(),
        albumName: z.string().optional().nullable(),
        artistName: z.string().optional().nullable(),
        reviewImageUrl: z.string().optional().nullable(),
      });
      const threadData = schema.parse({ ...req.body, userId });
      const thread = await storage.createThread(threadData);
      // Auto-remove artist from wishlist when a live show review is posted
      if (thread.threadType === "live_show_review" && thread.artistName) {
        await storage.removeFromShowWishlistByArtist(userId, thread.artistName);
      }
      return res.status(201).json(thread);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0]?.message || "Validation error" });
      }
      return res.status(500).json({ message: "Failed to create thread" });
    }
  });
  
  app.post("/api/threads/:id/upvote", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid thread ID" });
    }
    
    const thread = await storage.upvoteThread(id);
    if (!thread) {
      return res.status(404).json({ message: "Thread not found" });
    }
    
    return res.json(thread);
  });

  app.post("/api/threads/:id/save", async (req: Request, res: Response) => {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid thread ID" });

    const thread = await storage.saveThread(id);
    if (!thread) return res.status(404).json({ message: "Thread not found" });

    // Record user as a thread follower/watcher when they save
    await storage.followThread(userId, id);

    // Notify thread owner + all watchers (excluding the saver)
    const actor = await storage.getUser(userId);
    if (actor) {
      const followers = await storage.getThreadFollowers(thread.id);
      const recipientIds = new Set<number>();
      if (thread.userId !== userId) recipientIds.add(thread.userId);
      for (const f of followers) {
        if (f.userId !== userId) recipientIds.add(f.userId);
      }
      for (const recipientId of recipientIds) {
        await storage.createNotification({
          userId: recipientId,
          type: "save",
          threadId: thread.id,
          threadTitle: thread.title,
          actorId: userId,
          actorUsername: actor.username,
        });
      }
    }

    return res.json(thread);
  });

  app.get("/api/threads/:id/follow-status", async (req: Request, res: Response) => {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid thread ID" });
    const following = await storage.isFollowingThread(userId, id);
    return res.json({ following });
  });

  app.post("/api/threads/:id/follow", async (req: Request, res: Response) => {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid thread ID" });
    await storage.followThread(userId, id);
    return res.json({ success: true });
  });

  app.post("/api/threads/:id/unfollow", async (req: Request, res: Response) => {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid thread ID" });
    await storage.unfollowThread(userId, id);
    return res.json({ success: true });
  });
  
  // Comments routes
  app.get("/api/threads/:threadId/comments", async (req: Request, res: Response) => {
    const threadId = parseInt(req.params.threadId);
    if (isNaN(threadId)) {
      return res.status(400).json({ message: "Invalid thread ID" });
    }
    
    const comments = await storage.getCommentsByThread(threadId);
    return res.json(comments);
  });
  
  app.post("/api/comments", async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) return res.status(401).json({ message: "Not authenticated" });
      const commentData = insertCommentSchema.parse({ ...req.body, userId });
      const comment = await storage.createComment(commentData);

      // Fire notifications to thread owner + all watchers (skip actor/self)
      const thread = await storage.getThread(commentData.threadId);
      const actor = await storage.getUser(userId);
      if (thread && actor) {
        const followers = await storage.getThreadFollowers(thread.id);
        // Build set of recipients: owner + watchers, excluding the commenter
        const recipientIds = new Set<number>();
        if (thread.userId !== userId) recipientIds.add(thread.userId);
        for (const f of followers) {
          if (f.userId !== userId) recipientIds.add(f.userId);
        }
        for (const recipientId of recipientIds) {
          await storage.createNotification({
            userId: recipientId,
            type: "comment",
            threadId: thread.id,
            threadTitle: thread.title,
            actorId: userId,
            actorUsername: actor.username,
          });
        }
      }

      return res.status(201).json(comment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      return res.status(500).json({ message: "Failed to create comment" });
    }
  });
  
  app.post("/api/comments/:id/upvote", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid comment ID" });
    }
    
    const comment = await storage.upvoteComment(id);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }
    
    return res.json(comment);
  });
  
  // Sets routes
  app.get("/api/sets", async (_req: Request, res: Response) => {
    const sets = await storage.getAllSets();
    return res.json(sets.map(normalizeMusicSet));
  });
  
  app.get("/api/sets/featured", async (_req: Request, res: Response) => {
    const sets = await storage.getFeaturedSets();
    return res.json(sets.map(normalizeMusicSet));
  });
  
  app.get("/api/sets/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid set ID" });
    }
    
    const set = await storage.getSet(id);
    if (!set) {
      return res.status(404).json({ message: "Set not found" });
    }
    
    return res.json(normalizeMusicSet(set));
  });
  
  app.get("/api/users/:userId/threads", async (req: Request, res: Response) => {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) return res.status(400).json({ message: "Invalid user ID" });
    const threads = await storage.getThreadsByUser(userId);
    return res.json(threads);
  });

  app.get("/api/users/:userId/sets", async (req: Request, res: Response) => {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    
    const sets = await storage.getSetsByUser(userId);
    return res.json(sets);
  });

  app.post("/api/sets", async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) return res.status(401).json({ message: "Not authenticated" });
      const user = await storage.getUser(userId);
      const schema = insertSetSchema.extend({
        title: z.string().min(2, "Title must be at least 2 characters"),
      });
      const setData = schema.parse({ ...req.body, userId, curator: user?.username || "unknown" });
      const set = await storage.createSet(setData);
      return res.status(201).json(set);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0]?.message || "Validation error" });
      }
      return res.status(500).json({ message: "Failed to create set" });
    }
  });

  // Song (stub) creation via Spotify link
  app.post("/api/songs", async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) return res.status(401).json({ message: "Not authenticated" });
      const schema = insertSongSchema.extend({
        title: z.string().min(1),
        artist: z.string().min(1),
      });
      const songData = schema.parse(req.body);
      const song = await storage.createSong(songData);
      return res.status(201).json(song);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0]?.message || "Validation error" });
      }
      return res.status(500).json({ message: "Failed to create song" });
    }
  });

  // Track IDs routes
  app.get("/api/sets/:setId/track-ids", async (req: Request, res: Response) => {
    const setId = parseInt(req.params.setId);
    if (isNaN(setId)) return res.status(400).json({ message: "Invalid set ID" });
    const trackIds = await storage.getTrackIdsBySet(setId);
    // Include whether the current user has voted
    const userId = req.session.userId;
    const trackIdsWithVote = await Promise.all(
      trackIds.map(async (t) => {
        const userVote = userId ? await storage.getTrackIdVote(userId, t.id) : undefined;
        return { ...t, userVote: userVote?.voteType || null };
      })
    );
    return res.json(trackIdsWithVote);
  });

  app.post("/api/sets/:setId/track-ids", async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) return res.status(401).json({ message: "Not authenticated" });
      const setId = parseInt(req.params.setId);
      if (isNaN(setId)) return res.status(400).json({ message: "Invalid set ID" });
      const set = await storage.getSet(setId);
      if (!set) return res.status(404).json({ message: "Set not found" });
      const schema = insertTrackIdSchema.extend({
        title: z.string().min(1, "Track title required"),
        artist: z.string().min(1, "Artist name required"),
      });
      const trackIdData = schema.parse({ ...req.body, setId, submittedBy: userId });
      const trackId = await storage.createTrackId(trackIdData);
      return res.status(201).json({ ...trackId, userVote: null });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0]?.message || "Validation error" });
      }
      return res.status(500).json({ message: "Failed to submit track ID" });
    }
  });

  app.post("/api/track-ids/:trackId/vote", async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) return res.status(401).json({ message: "Not authenticated" });
      const trackId = parseInt(req.params.trackId);
      if (isNaN(trackId)) return res.status(400).json({ message: "Invalid track ID" });
      const schema = insertTrackIdVoteSchema.extend({
        voteType: z.enum(["confirm", "disagree"]),
      });
      const voteData = schema.parse({ ...req.body, userId, trackId });
      const result = await storage.castTrackIdVote(voteData);
      return res.status(201).json({ ...result.trackId, userVote: result.vote.voteType });
    } catch (error) {
      if (error instanceof Error && error.message === "Already voted on this track ID") {
        return res.status(409).json({ message: error.message });
      }
      if (error instanceof Error && error.message === "Track ID is locked or removed") {
        return res.status(422).json({ message: error.message });
      }
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0]?.message || "Validation error" });
      }
      return res.status(500).json({ message: "Failed to cast vote" });
    }
  });
  
  // Song Recommendations routes
  app.get("/api/threads/:threadId/recommendations", async (req: Request, res: Response) => {
    const threadId = parseInt(req.params.threadId);
    if (isNaN(threadId)) {
      return res.status(400).json({ message: "Invalid thread ID" });
    }
    
    const recommendations = await storage.getSongRecommendationsByThread(threadId);
    return res.json(recommendations);
  });
  
  app.post("/api/recommendations", async (req: Request, res: Response) => {
    try {
      const recommendationData = insertSongRecommendationSchema.parse(req.body);
      const recommendation = await storage.createSongRecommendation(recommendationData);
      return res.status(201).json(recommendation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      return res.status(500).json({ message: "Failed to create recommendation" });
    }
  });
  
  app.post("/api/recommendations/:id/upvote", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid recommendation ID" });
    }
    
    const recommendation = await storage.upvoteSongRecommendation(id);
    if (!recommendation) {
      return res.status(404).json({ message: "Recommendation not found" });
    }
    
    return res.json(recommendation);
  });

  // Follow routes — Artists
  app.get("/api/users/me/followed-artists", async (req: Request, res: Response) => {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    const artists = await storage.getFollowedArtists(userId);
    return res.json(artists);
  });

  app.post("/api/users/me/followed-artists/by-name", async (req: Request, res: Response) => {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    const { artistName } = req.body;
    if (!artistName || typeof artistName !== "string") {
      return res.status(400).json({ message: "artistName is required" });
    }
    let artist = await storage.getArtistByName(artistName.trim());
    if (!artist) {
      artist = await storage.createArtist({ name: artistName.trim() });
    }
    await storage.followArtist(userId, artist.id);
    return res.json({ success: true, artist });
  });

  app.post("/api/users/me/followed-artists/:artistId", async (req: Request, res: Response) => {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    const artistId = parseInt(req.params.artistId);
    if (isNaN(artistId)) return res.status(400).json({ message: "Invalid artist ID" });
    const artist = await storage.getArtist(artistId);
    if (!artist) return res.status(404).json({ message: "Artist not found" });
    await storage.followArtist(userId, artistId);
    return res.json({ success: true });
  });

  app.delete("/api/users/me/followed-artists/:artistId", async (req: Request, res: Response) => {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    const artistId = parseInt(req.params.artistId);
    if (isNaN(artistId)) return res.status(400).json({ message: "Invalid artist ID" });
    await storage.unfollowArtist(userId, artistId);
    return res.json({ success: true });
  });

  // Follow routes — Songs
  app.get("/api/users/me/followed-songs", async (req: Request, res: Response) => {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    const songs = await storage.getFollowedSongs(userId);
    return res.json(songs);
  });

  app.post("/api/users/me/followed-songs/:songId", async (req: Request, res: Response) => {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    const songId = parseInt(req.params.songId);
    if (isNaN(songId)) return res.status(400).json({ message: "Invalid song ID" });
    const song = await storage.getSong(songId);
    if (!song) return res.status(404).json({ message: "Song not found" });
    await storage.followSong(userId, songId);
    return res.json({ success: true });
  });

  app.delete("/api/users/me/followed-songs/:songId", async (req: Request, res: Response) => {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    const songId = parseInt(req.params.songId);
    if (isNaN(songId)) return res.status(400).json({ message: "Invalid song ID" });
    await storage.unfollowSong(userId, songId);
    return res.json({ success: true });
  });

  // Notifications routes
  app.get("/api/notifications", async (req: Request, res: Response) => {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    const notifications = await storage.getNotificationsByUser(userId);
    return res.json(notifications);
  });

  app.get("/api/notifications/unread-count", async (req: Request, res: Response) => {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    const count = await storage.getUnreadNotificationCount(userId);
    return res.json({ count });
  });

  app.post("/api/notifications/read-all", async (req: Request, res: Response) => {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    await storage.markAllNotificationsRead(userId);
    return res.json({ success: true });
  });

  app.post("/api/notifications/:id/read", async (req: Request, res: Response) => {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid notification ID" });
    const notifications = await storage.getNotificationsByUser(userId);
    const belongs = notifications.some(n => n.id === id);
    if (!belongs) return res.status(403).json({ message: "Forbidden" });
    await storage.markNotificationRead(id);
    return res.json({ success: true });
  });

  // Places routes
  async function enrichPlace(place: Awaited<ReturnType<typeof storage.getPlace>>) {
    if (!place) return null;
    const reviews = await storage.getPlaceReviews(place.id);
    let firstReviewerUsername: string | null = null;
    if (reviews.length > 0) {
      const firstReview = reviews.reduce((oldest, r) =>
        (r.createdAt?.getTime() || 0) < (oldest.createdAt?.getTime() || 0) ? r : oldest
      );
      const u = await storage.getUser(firstReview.userId);
      firstReviewerUsername = u?.username ?? null;
    }
    const reviewsWithRating = reviews.filter(r => r.rating != null);
    const avgRating = reviewsWithRating.length > 0
      ? Math.round((reviewsWithRating.reduce((s, r) => s + (r.rating ?? 0), 0) / reviewsWithRating.length) * 10) / 10
      : null;
    return { ...place, firstReviewerUsername, reviewCount: reviews.length, avgRating };
  }

  app.get("/api/places", async (_req: Request, res: Response) => {
    const places = await storage.getAllPlaces();
    const enriched = await Promise.all(places.map(enrichPlace));
    return res.json(enriched);
  });

  app.get("/api/places/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid place ID" });
    const place = await storage.getPlace(id);
    if (!place) return res.status(404).json({ message: "Place not found" });
    return res.json(await enrichPlace(place));
  });

  app.post("/api/places", async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) return res.status(401).json({ message: "Not authenticated" });
      const schema = insertPlaceSchema.extend({
        name: z.string().min(2, "Name must be at least 2 characters"),
        city: z.string().min(1, "City is required"),
        country: z.string().min(1, "Country is required"),
        description: z.string().min(10, "Description must be at least 10 characters").max(280, "Max 280 characters"),
        category: z.enum(["bar", "club", "record_store", "coffee_shop", "other"]),
        rating: z.number().int().min(1).max(5).optional(),
      });
      const { rating, ...placeFields } = schema.parse({ ...req.body, userId });
      const place = await storage.createPlace(placeFields);
      // Auto-create a review for the creator if they provided a rating
      if (rating) {
        await storage.createPlaceReview({ placeId: place.id, userId, rating, body: placeFields.description });
      }
      return res.status(201).json(await storage.getPlace(place.id));
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0]?.message || "Validation error" });
      }
      return res.status(500).json({ message: "Failed to create place" });
    }
  });

  app.get("/api/places/:id/reviews", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid place ID" });
    const reviews = await storage.getPlaceReviews(id);
    // Attach username for each review
    const withUsers = await Promise.all(reviews.map(async r => {
      const u = await storage.getUser(r.userId);
      return { ...r, username: u?.username ?? "unknown" };
    }));
    return res.json(withUsers);
  });

  app.post("/api/places/:id/reviews", async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) return res.status(401).json({ message: "Not authenticated" });
      const placeId = parseInt(req.params.id);
      if (isNaN(placeId)) return res.status(400).json({ message: "Invalid place ID" });
      const place = await storage.getPlace(placeId);
      if (!place) return res.status(404).json({ message: "Place not found" });
      const schema = z.object({
        rating: z.number().int().min(1).max(5),
        body: z.string().max(280).optional(),
      });
      const { rating, body } = schema.parse(req.body);
      const review = await storage.createPlaceReview({ placeId, userId, rating, body });
      const u = await storage.getUser(userId);
      return res.status(201).json({ ...review, username: u?.username ?? "unknown" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0]?.message || "Validation error" });
      }
      return res.status(500).json({ message: "Failed to submit review" });
    }
  });

  app.patch("/api/places/:id/reviews/:reviewId", async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) return res.status(401).json({ message: "Not authenticated" });
      const placeId = parseInt(req.params.id);
      const reviewId = parseInt(req.params.reviewId);
      if (isNaN(placeId) || isNaN(reviewId)) return res.status(400).json({ message: "Invalid ID" });
      const reviews = await storage.getPlaceReviews(placeId);
      const review = reviews.find(r => r.id === reviewId);
      if (!review) return res.status(404).json({ message: "Review not found" });
      if (review.userId !== userId) return res.status(403).json({ message: "Not your review" });
      const schema = z.object({
        rating: z.number().int().min(1).max(5),
        body: z.string().max(280).optional(),
      });
      const data = schema.parse(req.body);
      const updated = await storage.updatePlaceReview(reviewId, data.rating, data.body);
      const u = await storage.getUser(userId);
      return res.json({ ...updated, username: u?.username ?? "unknown" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0]?.message || "Validation error" });
      }
      return res.status(500).json({ message: "Failed to update review" });
    }
  });

  app.delete("/api/places/:id/reviews/:reviewId", async (req: Request, res: Response) => {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    const placeId = parseInt(req.params.id);
    const reviewId = parseInt(req.params.reviewId);
    if (isNaN(placeId) || isNaN(reviewId)) return res.status(400).json({ message: "Invalid ID" });
    const reviews = await storage.getPlaceReviews(placeId);
    const review = reviews.find(r => r.id === reviewId);
    if (!review) return res.status(404).json({ message: "Review not found" });
    if (review.userId !== userId) return res.status(403).json({ message: "Not your review" });
    await storage.deletePlaceReview(reviewId);
    return res.status(204).end();
  });

  app.get("/api/places/:id/comments", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid place ID" });
    const comments = await storage.getPlaceComments(id);
    return res.json(comments);
  });

  app.post("/api/places/:id/comments", async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) return res.status(401).json({ message: "Not authenticated" });
      const placeId = parseInt(req.params.id);
      if (isNaN(placeId)) return res.status(400).json({ message: "Invalid place ID" });
      const place = await storage.getPlace(placeId);
      if (!place) return res.status(404).json({ message: "Place not found" });
      const schema = insertPlaceCommentSchema.extend({
        content: z.string().min(1, "Comment cannot be empty").max(280),
      });
      const commentData = schema.parse({ ...req.body, placeId, userId });
      const comment = await storage.createPlaceComment(commentData);
      return res.status(201).json(comment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0]?.message || "Validation error" });
      }
      return res.status(500).json({ message: "Failed to post comment" });
    }
  });

  // Spotify proxy routes (use module-level getSpotifyToken)
  app.get("/api/spotify/artists/search", async (req: Request, res: Response) => {
    const q = ((req.query.q as string) || "").trim();
    if (!q) return res.json({ results: [] });

    // Always include local artists that match the query
    const allLocal = await storage.getAllArtists();
    const ql = q.toLowerCase();
    const localResults = allLocal
      .filter(a => a.name.toLowerCase().includes(ql))
      .map(a => ({
        spotifyId: `local-${a.id}`,
        name: a.name,
        imageUrl: a.profilePicture || null,
        genres: (Array.isArray(a.genres) ? (a.genres as string[]) : []).slice(0, 3),
      }));

    const token = await getSpotifyToken();
    if (!token) return res.json({ results: localResults });

    try {
      const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=artist&limit=8`;
      const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) {
        console.warn("[spotify search] artist search failed:", response.status, await response.text());
        return res.json({ results: localResults });
      }
      const data = await response.json() as { artists: { items: Array<{ id: string; name: string; images: Array<{ url: string }>; genres: string[] }> } };
      const spotifyResults = data.artists.items.map(a => ({
        spotifyId: a.id, name: a.name, imageUrl: a.images[0]?.url || null, genres: (a.genres || []).slice(0, 3),
      }));
      // Merge: Spotify first, then any local artists not already represented
      const spotifyNames = new Set(spotifyResults.map(a => a.name.toLowerCase()));
      const extra = localResults.filter(a => !spotifyNames.has(a.name.toLowerCase()));
      return res.json({ results: [...spotifyResults, ...extra] });
    } catch { return res.json({ results: localResults }); }
  });

  app.get("/api/spotify/artists/:spotifyId/albums", async (req: Request, res: Response) => {
    const { spotifyId } = req.params;
    const token = await getSpotifyToken();
    if (!token) return res.json({ error: "SPOTIFY credentials not configured", results: [] });
    try {
      const url = `https://api.spotify.com/v1/artists/${spotifyId}/albums?include_groups=album,single&market=US&limit=10`;
      const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) return res.json({ error: "Spotify API error", results: [] });
      const data = await response.json() as { items: Array<{ id: string; name: string; images: Array<{ url: string }>; release_date: string; album_type: string }> };
      const results = data.items.map(a => ({
        spotifyId: a.id, name: a.name, imageUrl: a.images[0]?.url || null,
        releaseYear: a.release_date?.slice(0, 4) || "", albumType: a.album_type,
      }));
      return res.json({ results });
    } catch { return res.json({ error: "Failed to fetch albums from Spotify", results: [] }); }
  });

  // Single Spotify artist metadata
  app.get("/api/spotify/artists/:spotifyId", async (req: Request, res: Response) => {
    const { spotifyId } = req.params;
    const token = await getSpotifyToken();
    if (!token) return res.json({ error: "SPOTIFY credentials not configured", artist: null });
    try {
      const response = await fetch(`https://api.spotify.com/v1/artists/${spotifyId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) return res.json({ error: "Spotify API error", artist: null });
      const a = await response.json() as { id: string; name: string; images: Array<{ url: string }>; genres: string[]; followers: { total: number } };
      return res.json({
        artist: {
          spotifyId: a.id, name: a.name,
          imageUrl: a.images[0]?.url || null,
          genres: a.genres || [],
          followers: a.followers?.total || 0,
        }
      });
    } catch { return res.json({ error: "Failed to fetch artist from Spotify", artist: null }); }
  });

  // Single Spotify album metadata
  app.get("/api/spotify/albums/:spotifyId", async (req: Request, res: Response) => {
    const { spotifyId } = req.params;
    const token = await getSpotifyToken();
    if (!token) return res.json({ error: "SPOTIFY credentials not configured", album: null });
    try {
      const response = await fetch(`https://api.spotify.com/v1/albums/${spotifyId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) return res.json({ error: "Spotify API error", album: null });
      const a = await response.json() as { id: string; name: string; images: Array<{ url: string }>; release_date: string; album_type: string; total_tracks: number; artists: Array<{ id: string; name: string }> };
      return res.json({
        album: {
          spotifyId: a.id, name: a.name,
          imageUrl: a.images[0]?.url || null,
          releaseYear: a.release_date?.slice(0, 4) || "",
          albumType: a.album_type,
          totalTracks: a.total_tracks,
          artistName: a.artists?.[0]?.name || "",
          artistSpotifyId: a.artists?.[0]?.id || "",
        }
      });
    } catch { return res.json({ error: "Failed to fetch album from Spotify", album: null }); }
  });

  // Setlist.fm proxy
  app.get("/api/setlistfm/search", async (req: Request, res: Response) => {
    const artist = (req.query.artist as string || "").trim();
    if (!artist) return res.json({ results: [] });
    const apiKey = process.env.SETLISTFM_API_KEY;
    if (!apiKey) {
      return res.json({ error: "SETLISTFM_API_KEY not configured", results: [] });
    }
    try {
      const url = `https://api.setlist.fm/rest/1.0/search/setlists?artistName=${encodeURIComponent(artist)}&p=1`;
      const response = await fetch(url, {
        headers: { "x-api-key": apiKey, "Accept": "application/json" },
      });
      if (!response.ok) {
        return res.json({ error: "Setlist.fm API error", results: [] });
      }
      const data = await response.json() as {
        setlist?: Array<{
          id: string;
          artist: { name: string };
          venue: { name: string; city: { name: string; country: { name: string } } };
          eventDate: string;
        }>;
      };
      const results = (data.setlist || []).map(s => ({
        setlistfmId: s.id,
        artistName: s.artist?.name ?? artist,
        venueName: s.venue?.name ?? "Unknown Venue",
        city: s.venue?.city?.name ?? "",
        country: s.venue?.city?.country?.name ?? "",
        eventDate: s.eventDate
          ? s.eventDate.split("-").reverse().join("-")
          : "",
      }));
      return res.json({ results });
    } catch {
      return res.json({ error: "Failed to fetch from Setlist.fm", results: [] });
    }
  });

  // Shows routes
  async function enrichShow(show: Awaited<ReturnType<typeof storage.getShow>>) {
    if (!show) return null;
    const reviews = await storage.getShowReviews(show.id);
    const comments = await storage.getShowComments(show.id);
    const avgRating = reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : null;
    let firstReviewerUsername: string | null = null;
    if (reviews.length > 0) {
      const firstReview = reviews.reduce((oldest, r) =>
        (r.createdAt?.getTime() || 0) < (oldest.createdAt?.getTime() || 0) ? r : oldest
      );
      const u = await storage.getUser(firstReview.userId);
      firstReviewerUsername = u?.username ?? null;
    }
    return { ...show, avgRating, reviewCount: reviews.length, commentCount: comments.length, firstReviewerUsername };
  }

  // Album endpoints
  app.get("/api/albums", async (_req: Request, res: Response) => {
    // Returns the same aggregated list as /api/feed/albums
    const allThreads = await storage.getAllThreads("album_review");
    const byAlbum = new Map<string, typeof allThreads>();
    for (const t of allThreads) {
      if (!t.albumId) continue;
      if (!byAlbum.has(t.albumId)) byAlbum.set(t.albumId, []);
      byAlbum.get(t.albumId)!.push(t);
    }
    const result = await Promise.all(
      Array.from(byAlbum.entries()).map(async ([albumId, albumThreads]) => {
        const withRatings = albumThreads.filter(t => t.starRating);
        const avgRating = withRatings.length > 0
          ? withRatings.reduce((s, t) => s + (t.starRating ?? 0), 0) / withRatings.length
          : null;
        const chronological = [...albumThreads].sort((a, b) => (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0));
        const firstThread = chronological[0];
        let firstReviewerUsername: string | null = null;
        if (firstThread) {
          const u = await storage.getUser(firstThread.userId);
          firstReviewerUsername = u?.username ?? null;
        }
        const albumArt = albumThreads.find(t => (t as any).albumArt)?.albumArt ?? null;
        return { albumId, albumName: albumThreads[0].albumName, albumArt, artistName: albumThreads[0].artistName, reviewCount: albumThreads.length, avgRating, firstReviewerUsername };
      })
    );
    result.sort((a, b) => b.reviewCount - a.reviewCount);
    return res.json(result);
  });

  app.get("/api/albums/:albumId", async (req: Request, res: Response) => {
    const { albumId } = req.params;
    const allThreads = await storage.getAllThreads("album_review");
    const albumThreads = allThreads.filter(t => t.albumId === albumId);
    if (albumThreads.length === 0) return res.status(404).json({ message: "Album not found" });
    const withRatings = albumThreads.filter(t => t.starRating);
    const avgRating = withRatings.length > 0
      ? withRatings.reduce((s, t) => s + (t.starRating ?? 0), 0) / withRatings.length
      : null;
    const chronological = [...albumThreads].sort((a, b) => (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0));
    const firstThread = chronological[0];
    let firstReviewerUsername: string | null = null;
    if (firstThread) {
      const u = await storage.getUser(firstThread.userId);
      firstReviewerUsername = u?.username ?? null;
    }
    const albumArt = albumThreads.find(t => (t as any).albumArt)?.albumArt ?? null;
    return res.json({
      albumId,
      albumName: albumThreads[0].albumName,
      albumArt,
      artistName: albumThreads[0].artistName,
      reviewCount: albumThreads.length,
      avgRating,
      firstReviewerUsername,
      reviews: albumThreads,
    });
  });

  // Album review feed — aggregate album_review threads by albumId
  app.get("/api/feed/albums", async (_req: Request, res: Response) => {
    const allThreads = await storage.getAllThreads("album_review");
    const byAlbum = new Map<string, typeof allThreads>();
    for (const t of allThreads) {
      if (!t.albumId) continue;
      if (!byAlbum.has(t.albumId)) byAlbum.set(t.albumId, []);
      byAlbum.get(t.albumId)!.push(t);
    }
    const result = await Promise.all(
      Array.from(byAlbum.entries()).map(async ([albumId, albumThreads]) => {
        const withRatings = albumThreads.filter(t => t.starRating);
        const avgRating = withRatings.length > 0
          ? withRatings.reduce((s, t) => s + (t.starRating ?? 0), 0) / withRatings.length
          : null;
        const chronological = [...albumThreads].sort((a, b) => (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0));
        const firstThread = chronological[0];
        let firstReviewerUsername: string | null = null;
        if (firstThread) {
          const u = await storage.getUser(firstThread.userId);
          firstReviewerUsername = u?.username ?? null;
        }
        const latest = [...albumThreads].sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0))[0];
        return {
          albumId,
          albumName: albumThreads[0].albumName,
          artistName: albumThreads[0].artistName,
          reviewCount: albumThreads.length,
          avgRating,
          firstReviewerUsername,
          latestThreadId: latest?.id ?? null,
        };
      })
    );
    result.sort((a, b) => b.reviewCount - a.reviewCount);
    return res.json(result);
  });

  app.get("/api/shows", async (req: Request, res: Response) => {
    const q = ((req.query.q as string) || "").toLowerCase().trim();
    let shows = await storage.getAllShows();
    if (q) {
      shows = shows.filter(s =>
        s.artistName.toLowerCase().includes(q) ||
        s.venueName.toLowerCase().includes(q) ||
        s.city.toLowerCase().includes(q) ||
        (s.genres ?? []).some(g => g.toLowerCase().includes(q))
      );
    }
    const enriched = await Promise.all(shows.map(enrichShow));
    return res.json(enriched);
  });

  app.get("/api/shows/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid show ID" });
    const show = await storage.getShow(id);
    if (!show) return res.status(404).json({ message: "Show not found" });
    return res.json(await enrichShow(show));
  });

  app.post("/api/shows", async (req: Request, res: Response) => {
    try {
      const schema = insertShowSchema.extend({
        artistName: z.string().min(1, "Artist name required"),
        venueName: z.string().min(1, "Venue name required"),
        city: z.string().min(1, "City required"),
        country: z.string().min(1, "Country required"),
        eventDate: z.string().min(1, "Event date required"),
      });
      const data = schema.parse(req.body);
      // Upsert by setlistfmId if provided
      if (data.setlistfmId) {
        const existing = await storage.getShowBySetlistfmId(data.setlistfmId);
        if (existing) return res.json(existing);
      }
      const show = await storage.createShow(data);
      return res.status(201).json(show);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0]?.message || "Validation error" });
      }
      return res.status(500).json({ message: "Failed to create show" });
    }
  });

  app.get("/api/shows/:id/reviews", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid show ID" });
    const reviews = await storage.getShowReviews(id);
    const userId = req.session.userId;
    const userReview = userId ? await storage.getUserShowReview(userId, id) : undefined;
    return res.json({ reviews, userReview: userReview ?? null });
  });

  app.post("/api/shows/:id/reviews", async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) return res.status(401).json({ message: "Not authenticated" });
      const showId = parseInt(req.params.id);
      if (isNaN(showId)) return res.status(400).json({ message: "Invalid show ID" });
      const show = await storage.getShow(showId);
      if (!show) return res.status(404).json({ message: "Show not found" });
      const existing = await storage.getUserShowReview(userId, showId);
      if (existing) return res.status(409).json({ message: "You have already reviewed this show" });
      const schema = insertShowReviewSchema.extend({
        rating: z.number().int().min(1).max(5),
        content: z.string().min(10, "Review must be at least 10 characters").max(1000),
        imageUrl: z.string().optional().nullable(),
      });
      const reviewData = schema.parse({ ...req.body, showId, userId });
      const review = await storage.createShowReview(reviewData);
      // Award "I was there" badge if user doesn't already have it
      const user = await storage.getUser(userId);
      if (user) {
        const badges = (Array.isArray(user.badges) ? user.badges : []) as Array<{ type: string; earnedAt?: string }>;
        const hasBadge = badges.some(b => b.type === "i_was_there");
        if (!hasBadge) {
          await storage.updateUser(userId, {
            badges: [...badges, { type: "i_was_there", earnedAt: new Date().toISOString() }] as Badge[],
          });
        }
      }
      return res.status(201).json(review);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0]?.message || "Validation error" });
      }
      return res.status(500).json({ message: "Failed to create review" });
    }
  });

  app.patch("/api/shows/:id/reviews/:reviewId", async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) return res.status(401).json({ message: "Not authenticated" });
      const showId = parseInt(req.params.id);
      const reviewId = parseInt(req.params.reviewId);
      if (isNaN(showId) || isNaN(reviewId)) return res.status(400).json({ message: "Invalid ID" });
      const review = await storage.getUserShowReview(userId, showId);
      if (!review || review.id !== reviewId) return res.status(404).json({ message: "Review not found" });
      const schema = z.object({
        rating: z.number().int().min(1).max(5),
        content: z.string().min(10).max(1000).optional(),
        imageUrl: z.string().nullable().optional(),
      });
      const data = schema.parse(req.body);
      const updated = await storage.updateShowReview(reviewId, data.rating, data.content, data.imageUrl);
      if (!updated) return res.status(404).json({ message: "Review not found" });
      return res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0]?.message || "Validation error" });
      }
      return res.status(500).json({ message: "Failed to update review" });
    }
  });

  app.delete("/api/shows/:id/reviews/:reviewId", async (req: Request, res: Response) => {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    const showId = parseInt(req.params.id);
    const reviewId = parseInt(req.params.reviewId);
    if (isNaN(showId) || isNaN(reviewId)) return res.status(400).json({ message: "Invalid ID" });
    const review = await storage.getUserShowReview(userId, showId);
    if (!review || review.id !== reviewId) return res.status(404).json({ message: "Review not found" });
    await storage.deleteShowReview(reviewId);
    return res.status(204).end();
  });

  app.get("/api/shows/:id/comments", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid show ID" });
    const comments = await storage.getShowComments(id);
    return res.json(comments);
  });

  app.post("/api/shows/:id/comments", async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) return res.status(401).json({ message: "Not authenticated" });
      const showId = parseInt(req.params.id);
      if (isNaN(showId)) return res.status(400).json({ message: "Invalid show ID" });
      const show = await storage.getShow(showId);
      if (!show) return res.status(404).json({ message: "Show not found" });
      const schema = insertShowCommentSchema.extend({
        content: z.string().min(1, "Comment cannot be empty").max(280),
      });
      const commentData = schema.parse({ ...req.body, showId, userId });
      const comment = await storage.createShowComment(commentData);
      return res.status(201).json(comment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0]?.message || "Validation error" });
      }
      return res.status(500).json({ message: "Failed to post comment" });
    }
  });

  app.post("/api/shows/:id/comments/:commentId/upvote", async (req: Request, res: Response) => {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    const showId = parseInt(req.params.id);
    const commentId = parseInt(req.params.commentId);
    if (isNaN(showId) || isNaN(commentId)) return res.status(400).json({ message: "Invalid ID" });
    const comment = await storage.upvoteShowComment(commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });
    if (comment.showId !== showId) return res.status(404).json({ message: "Comment not found" });
    return res.json(comment);
  });

  // User places, show-reviews, travel plans, show wishlist routes
  app.get("/api/users/:id/places", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid user ID" });
    const places = await storage.getPlacesByUser(id);
    return res.json(places);
  });

  app.get("/api/users/:id/show-reviews", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid user ID" });
    const reviews = await storage.getShowReviewsByUser(id);
    return res.json(reviews);
  });

  app.get("/api/users/:id/travel-plans", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid user ID" });
    const plans = await storage.getUserTravelPlans(id);
    return res.json(plans);
  });

  app.post("/api/users/:id/travel-plans", async (req: Request, res: Response) => {
    try {
      const sessionUserId = req.session.userId;
      if (!sessionUserId) return res.status(401).json({ message: "Not authenticated" });
      const id = parseInt(req.params.id);
      if (isNaN(id) || id !== sessionUserId) return res.status(403).json({ message: "Forbidden" });
      const schema = z.object({
        city: z.string().min(1, "City is required").max(100),
        country: z.string().min(1, "Country is required").max(100),
        targetDate: z.string().min(1, "Date is required").max(50),
        note: z.string().max(200).optional(),
      });
      const { city, country, targetDate, note } = schema.parse(req.body);
      const plan = await storage.createUserTravelPlan({ userId: id, city, country, targetDate, note });
      return res.status(201).json(plan);
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ message: error.errors[0]?.message || "Validation error" });
      return res.status(500).json({ message: "Failed to create travel plan" });
    }
  });

  app.delete("/api/users/:id/travel-plans/:planId", async (req: Request, res: Response) => {
    const sessionUserId = req.session.userId;
    if (!sessionUserId) return res.status(401).json({ message: "Not authenticated" });
    const id = parseInt(req.params.id);
    if (isNaN(id) || id !== sessionUserId) return res.status(403).json({ message: "Forbidden" });
    const planId = parseInt(req.params.planId);
    if (isNaN(planId)) return res.status(400).json({ message: "Invalid plan ID" });
    const plans = await storage.getUserTravelPlans(id);
    const plan = plans.find(p => p.id === planId);
    if (!plan) return res.status(404).json({ message: "Plan not found" });
    await storage.deleteUserTravelPlan(planId);
    return res.json({ success: true });
  });

  app.get("/api/users/:id/show-wishlist", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid user ID" });
    const wishlist = await storage.getUserShowWishlist(id);
    return res.json(wishlist);
  });

  app.post("/api/users/:id/show-wishlist", async (req: Request, res: Response) => {
    try {
      const sessionUserId = req.session.userId;
      if (!sessionUserId) return res.status(401).json({ message: "Not authenticated" });
      const id = parseInt(req.params.id);
      if (isNaN(id) || id !== sessionUserId) return res.status(403).json({ message: "Forbidden" });
      const schema = z.object({
        artistName: z.string().min(1, "Artist name required").max(100),
        spotifyImageUrl: z.string().url().nullish(),
      });
      const { artistName, spotifyImageUrl } = schema.parse(req.body);
      const item = await storage.addToShowWishlist({ userId: id, artistName, spotifyImageUrl });
      return res.status(201).json(item);
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ message: error.errors[0]?.message || "Validation error" });
      return res.status(500).json({ message: "Failed to add to wishlist" });
    }
  });

  app.delete("/api/users/:id/show-wishlist/:itemId", async (req: Request, res: Response) => {
    const sessionUserId = req.session.userId;
    if (!sessionUserId) return res.status(401).json({ message: "Not authenticated" });
    const id = parseInt(req.params.id);
    if (isNaN(id) || id !== sessionUserId) return res.status(403).json({ message: "Forbidden" });
    const itemId = parseInt(req.params.itemId);
    if (isNaN(itemId)) return res.status(400).json({ message: "Invalid item ID" });
    const wishlist = await storage.getUserShowWishlist(id);
    const item = wishlist.find(w => w.id === itemId);
    if (!item) return res.status(404).json({ message: "Item not found" });
    await storage.removeFromShowWishlist(itemId);
    return res.json({ success: true });
  });

  // ─── Followed artists page ────────────────────────────────────────────────
  app.get("/api/users/:id/followed-artists", async (req: Request, res: Response) => {
    const sessionUserId = req.session.userId;
    if (!sessionUserId) return res.status(401).json({ message: "Not authenticated" });
    const id = parseInt(req.params.id);
    if (isNaN(id) || id !== sessionUserId) return res.status(403).json({ message: "Forbidden" });
    const artists = await storage.getFollowedArtists(id);
    return res.json(artists);
  });

  // ─── Place lists ──────────────────────────────────────────────────────────
  app.get("/api/users/:id/place-lists", async (req: Request, res: Response) => {
    const sessionUserId = req.session.userId;
    if (!sessionUserId) return res.status(401).json({ message: "Not authenticated" });
    const id = parseInt(req.params.id);
    if (isNaN(id) || id !== sessionUserId) return res.status(403).json({ message: "Forbidden" });
    const lists = await storage.getPlaceLists(id);
    return res.json(lists);
  });

  app.post("/api/users/:id/place-lists", async (req: Request, res: Response) => {
    try {
      const sessionUserId = req.session.userId;
      if (!sessionUserId) return res.status(401).json({ message: "Not authenticated" });
      const id = parseInt(req.params.id);
      if (isNaN(id) || id !== sessionUserId) return res.status(403).json({ message: "Forbidden" });
      const schema = z.object({ name: z.string().min(1).max(80), coverImageUrl: z.string().nullable().optional() });
      const { name, coverImageUrl } = schema.parse(req.body);
      const list = await storage.createPlaceList({ userId: id, name, coverImageUrl });
      return res.status(201).json(list);
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ message: error.errors[0]?.message || "Validation error" });
      return res.status(500).json({ message: "Failed to create list" });
    }
  });

  app.delete("/api/users/:id/place-lists/:listId", async (req: Request, res: Response) => {
    const sessionUserId = req.session.userId;
    if (!sessionUserId) return res.status(401).json({ message: "Not authenticated" });
    const id = parseInt(req.params.id);
    if (isNaN(id) || id !== sessionUserId) return res.status(403).json({ message: "Forbidden" });
    const listId = parseInt(req.params.listId);
    if (isNaN(listId)) return res.status(400).json({ message: "Invalid list ID" });
    const lists = await storage.getPlaceLists(id);
    if (!lists.find(l => l.id === listId)) return res.status(403).json({ message: "Forbidden" });
    await storage.deletePlaceList(listId);
    return res.json({ success: true });
  });

  app.get("/api/place-lists/:listId/items", async (req: Request, res: Response) => {
    const sessionUserId = req.session.userId;
    if (!sessionUserId) return res.status(401).json({ message: "Not authenticated" });
    const listId = parseInt(req.params.listId);
    if (isNaN(listId)) return res.status(400).json({ message: "Invalid list ID" });
    const lists = await storage.getPlaceLists(sessionUserId);
    if (!lists.find(l => l.id === listId)) return res.status(403).json({ message: "Forbidden" });
    const items = await storage.getPlaceListItems(listId);
    return res.json(items);
  });

  app.post("/api/place-lists/:listId/items", async (req: Request, res: Response) => {
    try {
      const sessionUserId = req.session.userId;
      if (!sessionUserId) return res.status(401).json({ message: "Not authenticated" });
      const listId = parseInt(req.params.listId);
      if (isNaN(listId)) return res.status(400).json({ message: "Invalid list ID" });
      const lists = await storage.getPlaceLists(sessionUserId);
      if (!lists.find(l => l.id === listId)) return res.status(403).json({ message: "Forbidden" });
      const schema = z.object({ placeId: z.number().int().positive() });
      const { placeId } = schema.parse(req.body);
      const item = await storage.addToPlaceList({ listId, placeId });
      return res.status(201).json(item);
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ message: error.errors[0]?.message || "Validation error" });
      return res.status(500).json({ message: "Failed to add to list" });
    }
  });

  app.delete("/api/place-lists/:listId/items/:placeId", async (req: Request, res: Response) => {
    const sessionUserId = req.session.userId;
    if (!sessionUserId) return res.status(401).json({ message: "Not authenticated" });
    const listId = parseInt(req.params.listId);
    const placeId = parseInt(req.params.placeId);
    if (isNaN(listId) || isNaN(placeId)) return res.status(400).json({ message: "Invalid ID" });
    const lists = await storage.getPlaceLists(sessionUserId);
    if (!lists.find(l => l.id === listId)) return res.status(403).json({ message: "Forbidden" });
    await storage.removeFromPlaceList(listId, placeId);
    return res.json({ success: true });
  });

  app.get("/api/users/:id/place-save-status/:placeId", async (req: Request, res: Response) => {
    const sessionUserId = req.session.userId;
    if (!sessionUserId) return res.status(401).json({ message: "Not authenticated" });
    const id = parseInt(req.params.id);
    if (isNaN(id) || id !== sessionUserId) return res.status(403).json({ message: "Forbidden" });
    const placeId = parseInt(req.params.placeId);
    if (isNaN(placeId)) return res.status(400).json({ message: "Invalid place ID" });
    const result = await storage.isPlaceInAnyList(id, placeId);
    return res.json(result);
  });

  const httpServer = createServer(app);
  return httpServer;
}
