import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage-simple";
import { z } from "zod";
import { insertUserSchema, insertThreadSchema, insertCommentSchema, insertSongRecommendationSchema, insertSetSchema } from "@shared/schema";

const scryptAsync = promisify(scrypt);

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
  app.get("/api/users/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    
    const user = await storage.getUser(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Don't send password back to client
    const { password, ...userWithoutPassword } = user;
    return res.json(userWithoutPassword);
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
    return res.json(artists);
  });
  
  app.get("/api/artists/featured", async (_req: Request, res: Response) => {
    const artists = await storage.getFeaturedArtists();
    return res.json(artists);
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
    
    return res.json(artist);
  });
  
  // Songs routes
  app.get("/api/songs", async (_req: Request, res: Response) => {
    const songs = await storage.getAllSongs();
    return res.json(songs);
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
    
    return res.json(song);
  });
  
  app.get("/api/songs/artist/:artistName", async (req: Request, res: Response) => {
    const artistName = req.params.artistName;
    const songs = await storage.getSongsByArtist(artistName);
    return res.json(songs);
  });
  
  // Venues routes
  app.get("/api/venues", async (_req: Request, res: Response) => {
    const venues = await storage.getAllVenues();
    return res.json(venues);
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
    
    return res.json(venue);
  });
  
  // Threads routes
  app.get("/api/threads", async (req: Request, res: Response) => {
    const type = req.query.type as string | undefined;
    const threads = await storage.getAllThreads(type);
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
  
  app.post("/api/threads", async (req: Request, res: Response) => {
    try {
      const threadData = insertThreadSchema.parse(req.body);
      const thread = await storage.createThread(threadData);
      return res.status(201).json(thread);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
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
      const commentData = insertCommentSchema.parse(req.body);
      const comment = await storage.createComment(commentData);
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
    return res.json(sets);
  });
  
  app.get("/api/sets/featured", async (_req: Request, res: Response) => {
    const sets = await storage.getFeaturedSets();
    return res.json(sets);
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
    
    return res.json(set);
  });
  
  app.get("/api/users/:userId/sets", async (req: Request, res: Response) => {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    
    const sets = await storage.getSetsByUser(userId);
    return res.json(sets);
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

  const httpServer = createServer(app);
  return httpServer;
}
