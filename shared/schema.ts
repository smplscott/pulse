import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name"),
  profilePicture: text("profile_picture"),
  favoriteSongs: jsonb("favorite_songs").default('[]'),
  favoriteGenres: jsonb("favorite_genres").default('[]'),
  favoriteSubGenres: jsonb("favorite_sub_genres").default('[]'),
  favoriteCountries: jsonb("favorite_countries").default('[]'),
  badges: jsonb("badges").default('[]'),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  displayName: true,
  profilePicture: true,
});

// Songs table
export const songs = pgTable("songs", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  artist: text("artist").notNull(),
  features: jsonb("features").default('[]'),
  sample: text("sample"),
  story: text("story"),
  dialects: jsonb("dialects").default('[]'),
  streamingLinks: jsonb("streaming_links").default('[]'),
  ranking: integer("ranking").default(0),
  genre: text("genre"),
  subGenres: jsonb("sub_genres").default('[]'),
  albumArt: text("album_art"),
  releaseDate: timestamp("release_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSongSchema = createInsertSchema(songs).pick({
  title: true,
  artist: true,
  features: true,
  sample: true,
  story: true,
  dialects: true,
  streamingLinks: true,
  genre: true,
  subGenres: true,
  albumArt: true,
  releaseDate: true,
});

// Artists table
export const artists = pgTable("artists", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  realName: text("real_name"),
  firstDiscoveredIn: text("first_discovered_in"),
  firstAlbumReleaseDate: timestamp("first_album_release_date"),
  sample: text("sample"),
  story: text("story"),
  streamingLinks: jsonb("streaming_links").default('[]'),
  ranking: integer("ranking").default(0),
  genres: jsonb("genres").default('[]'),
  profilePicture: text("profile_picture"),
  verified: boolean("verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertArtistSchema = createInsertSchema(artists).pick({
  name: true,
  realName: true,
  firstDiscoveredIn: true,
  firstAlbumReleaseDate: true,
  sample: true,
  story: true,
  streamingLinks: true,
  genres: true,
  profilePicture: true,
  verified: true,
});

// Venues table
export const venues = pgTable("venues", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  location: text("location").notNull(),
  description: text("description"),
  genres: jsonb("genres").default('[]'),
  rating: integer("rating").default(0),
  image: text("image"),
  upcomingEvents: jsonb("upcoming_events").default('[]'),
  currentDj: text("current_dj"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertVenueSchema = createInsertSchema(venues).pick({
  name: true,
  location: true,
  description: true,
  genres: true,
  rating: true,
  image: true,
  upcomingEvents: true,
  currentDj: true,
});

// Threads table
export const threads = pgTable("threads", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(), // 'discussion', 'song_request', etc.
  status: text("status").default("active"), // 'active', 'solved', etc.
  upvotes: integer("upvotes").default(0),
  commentsCount: integer("comments_count").default(0),
  recommendationsCount: integer("recommendations_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertThreadSchema = createInsertSchema(threads).pick({
  title: true,
  content: true,
  userId: true,
  type: true,
  status: true,
});

// Comments table
export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  threadId: integer("thread_id").notNull(),
  userId: integer("user_id").notNull(),
  content: text("content").notNull(),
  upvotes: integer("upvotes").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCommentSchema = createInsertSchema(comments).pick({
  threadId: true,
  userId: true,
  content: true,
});

// Playlists table
export const playlists = pgTable("playlists", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  curator: text("curator").notNull(),
  userId: integer("user_id").notNull(),
  image: text("image"),
  streamingLink: text("streaming_link"),
  songs: jsonb("songs").default('[]'),
  saves: integer("saves").default(0),
  genres: jsonb("genres").default('[]'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPlaylistSchema = createInsertSchema(playlists).pick({
  title: true,
  description: true,
  curator: true,
  userId: true,
  image: true,
  streamingLink: true,
  songs: true,
  genres: true,
});

// Song recommendations for threads
export const songRecommendations = pgTable("song_recommendations", {
  id: serial("id").primaryKey(),
  threadId: integer("thread_id").notNull(),
  userId: integer("user_id").notNull(),
  songId: integer("song_id").notNull(),
  comment: text("comment"),
  upvotes: integer("upvotes").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSongRecommendationSchema = createInsertSchema(songRecommendations).pick({
  threadId: true,
  userId: true,
  songId: true,
  comment: true,
});

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Song = typeof songs.$inferSelect;
export type InsertSong = z.infer<typeof insertSongSchema>;

export type Artist = typeof artists.$inferSelect;
export type InsertArtist = z.infer<typeof insertArtistSchema>;

export type Venue = typeof venues.$inferSelect;
export type InsertVenue = z.infer<typeof insertVenueSchema>;

export type Thread = typeof threads.$inferSelect;
export type InsertThread = z.infer<typeof insertThreadSchema>;

export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;

export type Playlist = typeof playlists.$inferSelect;
export type InsertPlaylist = z.infer<typeof insertPlaylistSchema>;

export type SongRecommendation = typeof songRecommendations.$inferSelect;
export type InsertSongRecommendation = z.infer<typeof insertSongRecommendationSchema>;
