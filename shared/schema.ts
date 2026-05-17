import { pgTable, text, serial, integer, boolean, timestamp, jsonb, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").unique(),
  password: text("password").notNull(),
  displayName: text("display_name"),
  bio: text("bio"),
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
  email: true,
  password: true,
  displayName: true,
  bio: true,
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
  albumName: text("album_name"),
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
  albumName: true,
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
  type: text("type").notNull().default("discussion"),
  threadType: text("thread_type").notNull().default("topic"), // new_music | listening_now | live_show_review | topic
  songId: integer("song_id"),
  artistId: integer("artist_id"),
  setId: integer("set_id"),
  starRating: integer("star_rating"), // 1-5, for live_show_review only
  status: text("status").default("active"),
  upvotes: integer("upvotes").default(0),
  savesCount: integer("saves_count").default(0),
  commentsCount: integer("comments_count").default(0),
  recommendationsCount: integer("recommendations_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertThreadSchema = createInsertSchema(threads).pick({
  title: true,
  content: true,
  userId: true,
  type: true,
  threadType: true,
  songId: true,
  artistId: true,
  setId: true,
  starRating: true,
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

// Sets table
export const sets = pgTable("sets", {
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
  type: text("type").default('set'),
  tags: jsonb("tags").default('[]'),
  city: text("city"),
  country: text("country"),
  eventDate: text("event_date"),
  featured: boolean("featured").default(false),
  verified: boolean("verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSetSchema = createInsertSchema(sets).pick({
  title: true,
  description: true,
  curator: true,
  userId: true,
  image: true,
  streamingLink: true,
  songs: true,
  genres: true,
  type: true,
  tags: true,
  city: true,
  country: true,
  eventDate: true,
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

// Track IDs for sets — community-submitted song identifications
export const trackIds = pgTable("track_ids", {
  id: serial("id").primaryKey(),
  setId: integer("set_id").notNull(),
  title: text("title").notNull(),
  artist: text("artist").notNull(),
  submittedBy: integer("submitted_by").notNull(),
  confirmCount: integer("confirm_count").default(0),
  disagreeCount: integer("disagree_count").default(0),
  locked: boolean("locked").default(false),   // true at 5 confirms
  removed: boolean("removed").default(false), // true at 5 disagrees
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTrackIdSchema = createInsertSchema(trackIds).pick({
  setId: true,
  title: true,
  artist: true,
  submittedBy: true,
});

// Track ID votes — one confirm or disagree per user per track
export const trackIdVotes = pgTable("track_id_votes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  trackId: integer("track_id").notNull(),
  voteType: text("vote_type").notNull(), // 'confirm' | 'disagree'
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => ({
  userTrackUnique: unique("track_id_votes_user_track_unique").on(t.userId, t.trackId),
}));

export const insertTrackIdVoteSchema = createInsertSchema(trackIdVotes).pick({
  userId: true,
  trackId: true,
  voteType: true,
});

// Places table — user-generated directory of IRL music spots
export const places = pgTable("places", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  city: text("city").notNull(),
  country: text("country").notNull(),
  category: text("category").$type<"bar" | "club" | "record_store" | "coffee_shop" | "other">().notNull(),
  genres: text("genres").array(),
  description: text("description").notNull(),
  mapsLink: text("maps_link"),
  rating: integer("rating").default(0),
  reviewsCount: integer("reviews_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPlaceSchema = createInsertSchema(places).pick({
  userId: true,
  name: true,
  city: true,
  country: true,
  category: true,
  description: true,
  mapsLink: true,
}).extend({
  genres: z.array(z.string()).optional().default([]),
  category: z.enum(["bar", "club", "record_store", "coffee_shop", "other"]),
});

// Place comments — open discussion on each place page
export const placeComments = pgTable("place_comments", {
  id: serial("id").primaryKey(),
  placeId: integer("place_id").notNull(),
  userId: integer("user_id").notNull(),
  content: text("content").notNull(),
  upvotes: integer("upvotes").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPlaceCommentSchema = createInsertSchema(placeComments).pick({
  placeId: true,
  userId: true,
  content: true,
});

export type Place = typeof places.$inferSelect;
export type InsertPlace = z.infer<typeof insertPlaceSchema>;
export type PlaceComment = typeof placeComments.$inferSelect;
export type InsertPlaceComment = z.infer<typeof insertPlaceCommentSchema>;

// Thread follows table — users who watch a thread for activity
export const threadFollows = pgTable("thread_follows", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  threadId: integer("thread_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertThreadFollowSchema = createInsertSchema(threadFollows).pick({
  userId: true,
  threadId: true,
});

export type ThreadFollow = typeof threadFollows.$inferSelect;
export type InsertThreadFollow = z.infer<typeof insertThreadFollowSchema>;

// Notifications table
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),       // recipient
  type: text("type").notNull(),               // 'comment' | 'save'
  threadId: integer("thread_id").notNull(),
  threadTitle: text("thread_title").notNull(),
  actorId: integer("actor_id").notNull(),
  actorUsername: text("actor_username").notNull(),
  read: boolean("read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertNotificationSchema = createInsertSchema(notifications).pick({
  userId: true,
  type: true,
  threadId: true,
  threadTitle: true,
  actorId: true,
  actorUsername: true,
});

// Export types
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

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

export type MusicSet = typeof sets.$inferSelect;
export type InsertSet = z.infer<typeof insertSetSchema>;

export type SongRecommendation = typeof songRecommendations.$inferSelect;
export type InsertSongRecommendation = z.infer<typeof insertSongRecommendationSchema>;

export type TrackId = typeof trackIds.$inferSelect;
export type InsertTrackId = z.infer<typeof insertTrackIdSchema>;

export type TrackIdVote = typeof trackIdVotes.$inferSelect;
export type InsertTrackIdVote = z.infer<typeof insertTrackIdVoteSchema>;

// Shows table — past concerts/events (from Setlist.fm or manual)
export const shows = pgTable("shows", {
  id: serial("id").primaryKey(),
  setlistfmId: text("setlistfm_id").unique(),
  artistName: text("artist_name").notNull(),
  venueName: text("venue_name").notNull(),
  city: text("city").notNull(),
  country: text("country").notNull(),
  eventDate: text("event_date").notNull(), // yyyy-MM-dd
  genres: text("genres").array(),
  notes: text("notes"),
  isManual: boolean("is_manual").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertShowSchema = createInsertSchema(shows).pick({
  setlistfmId: true,
  artistName: true,
  venueName: true,
  city: true,
  country: true,
  eventDate: true,
  isManual: true,
  notes: true,
}).extend({
  genres: z.array(z.string()).optional().default([]),
});

// Show reviews — one per userId+showId (enforced at schema + API level)
export const showReviews = pgTable("show_reviews", {
  id: serial("id").primaryKey(),
  showId: integer("show_id").notNull(),
  userId: integer("user_id").notNull(),
  rating: integer("rating").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => ({
  userShowUnique: unique("show_reviews_user_show_unique").on(t.userId, t.showId),
}));

export const insertShowReviewSchema = createInsertSchema(showReviews).pick({
  showId: true,
  userId: true,
  rating: true,
  content: true,
});

// Show comments — open discussion on each show
export const showComments = pgTable("show_comments", {
  id: serial("id").primaryKey(),
  showId: integer("show_id").notNull(),
  userId: integer("user_id").notNull(),
  content: text("content").notNull(),
  upvotes: integer("upvotes").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertShowCommentSchema = createInsertSchema(showComments).pick({
  showId: true,
  userId: true,
  content: true,
});

export type Show = typeof shows.$inferSelect;
export type InsertShow = z.infer<typeof insertShowSchema>;
export type ShowReview = typeof showReviews.$inferSelect;
export type InsertShowReview = z.infer<typeof insertShowReviewSchema>;
export type ShowComment = typeof showComments.$inferSelect;
export type InsertShowComment = z.infer<typeof insertShowCommentSchema>;
