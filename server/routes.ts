import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertUserSchema, insertThreadSchema, insertCommentSchema, insertSongRecommendationSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
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
  
  // Playlists routes
  app.get("/api/playlists", async (_req: Request, res: Response) => {
    const playlists = await storage.getAllPlaylists();
    return res.json(playlists);
  });
  
  app.get("/api/playlists/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid playlist ID" });
    }
    
    const playlist = await storage.getPlaylist(id);
    if (!playlist) {
      return res.status(404).json({ message: "Playlist not found" });
    }
    
    return res.json(playlist);
  });
  
  app.get("/api/users/:userId/playlists", async (req: Request, res: Response) => {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    
    const playlists = await storage.getPlaylistsByUser(userId);
    return res.json(playlists);
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
