import { 
  User, InsertUser, 
  Artist, InsertArtist,
  Song, InsertSong,
  Venue, InsertVenue,
  Thread, InsertThread,
  Comment, InsertComment,
  Set, InsertSet,
  SongRecommendation, InsertSongRecommendation
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  
  // Artist operations
  getArtist(id: number): Promise<Artist | undefined>;
  getArtistByName(name: string): Promise<Artist | undefined>;
  getAllArtists(): Promise<Artist[]>;
  getFeaturedArtists(limit?: number): Promise<Artist[]>;
  createArtist(artist: InsertArtist): Promise<Artist>;
  updateArtist(id: number, updates: Partial<Artist>): Promise<Artist | undefined>;
  
  // Song operations
  getSong(id: number): Promise<Song | undefined>;
  getSongsByArtist(artistName: string): Promise<Song[]>;
  getAllSongs(limit?: number): Promise<Song[]>;
  createSong(song: InsertSong): Promise<Song>;
  updateSong(id: number, updates: Partial<Song>): Promise<Song | undefined>;
  
  // Venue operations
  getVenue(id: number): Promise<Venue | undefined>;
  getAllVenues(limit?: number): Promise<Venue[]>;
  createVenue(venue: InsertVenue): Promise<Venue>;
  updateVenue(id: number, updates: Partial<Venue>): Promise<Venue | undefined>;
  
  // Thread operations
  getThread(id: number): Promise<Thread | undefined>;
  getAllThreads(type?: string, limit?: number): Promise<Thread[]>;
  getThreadsByUser(userId: number): Promise<Thread[]>;
  createThread(thread: InsertThread): Promise<Thread>;
  updateThread(id: number, updates: Partial<Thread>): Promise<Thread | undefined>;
  upvoteThread(id: number): Promise<Thread | undefined>;
  
  // Comment operations
  getComment(id: number): Promise<Comment | undefined>;
  getCommentsByThread(threadId: number): Promise<Comment[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  upvoteComment(id: number): Promise<Comment | undefined>;
  
  // Set operations
  getSet(id: number): Promise<Set | undefined>;
  getSetsByUser(userId: number): Promise<Set[]>;
  getAllSets(limit?: number): Promise<Set[]>;
  getFeaturedSets(limit?: number): Promise<Set[]>;
  createSet(set: InsertSet): Promise<Set>;
  updateSet(id: number, updates: Partial<Set>): Promise<Set | undefined>;
  
  // Song Recommendation operations
  getSongRecommendation(id: number): Promise<SongRecommendation | undefined>;
  getSongRecommendationsByThread(threadId: number): Promise<SongRecommendation[]>;
  createSongRecommendation(recommendation: InsertSongRecommendation): Promise<SongRecommendation>;
  upvoteSongRecommendation(id: number): Promise<SongRecommendation | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private artists: Map<number, Artist> = new Map();
  private songs: Map<number, Song> = new Map();
  private venues: Map<number, Venue> = new Map();
  private threads: Map<number, Thread> = new Map();
  private comments: Map<number, Comment> = new Map();
  private sets: Map<number, Set> = new Map();
  private songRecommendations: Map<number, SongRecommendation> = new Map();
  
  private userCurrentId = 1;
  private artistCurrentId = 1;
  private songCurrentId = 1;
  private venueCurrentId = 1;
  private threadCurrentId = 1;
  private commentCurrentId = 1;
  private setCurrentId = 1;
  private songRecommendationCurrentId = 1;

  constructor() {
    this.seedData();
  }

  private seedData() {
    // Create basic test user
    const user: User = {
      id: this.userCurrentId++,
      username: "testuser",
      password: "password",
      displayName: "Test User",
      profilePicture: null,
      favoriteSongs: [],
      favoriteGenres: [],
      favoriteSubGenres: [],
      favoriteCountries: [],
      badges: [],
      createdAt: new Date()
    };
    this.users.set(user.id, user);

    // Create basic sets
    const set1: Set = {
      id: this.setCurrentId++,
      title: "Tripolism's track IDs",
      description: "Tripolism's favorite tracks. Updated regularly. Curated by Tripolism.",
      curator: "Tripolism",
      userId: user.id,
      image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300",
      streamingLink: "https://open.spotify.com/playlist/sample",
      genres: ["Electronic", "House", "Techno"],
      songs: [1, 2, 3],
      type: "set",
      tags: ["techno", "house", "electronic", "track-ids"],
      saves: 1200,
      featured: true,
      verified: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const set2: Set = {
      id: this.setCurrentId++,
      title: "&ME's track IDs",
      description: "&ME's favorite tracks. Updated regularly. Curated by &ME.",
      curator: "&ME",
      userId: user.id,
      image: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300",
      streamingLink: "https://open.spotify.com/playlist/sample",
      genres: ["House", "Techno", "Electronic"],
      songs: [4, 5, 6],
      type: "set",
      tags: ["house", "techno", "track-ids"],
      saves: 856,
      featured: false,
      verified: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const set3: Set = {
      id: this.setCurrentId++,
      title: "DESIREE's track IDs",
      description: "DESIREE's favorite tracks. Updated regularly. Curated by DESIREE.",
      curator: "DESIREE",
      userId: user.id,
      image: "https://pixabay.com/get/g90635263ffd0016cab56b4e1bc67ed1dc0ecb5500f0a4a14ae4d3c3c609dd0e77b1a8a75e680ab949a133e40d56c46ed5ee5082cc4843a1bb526c174fd0cc5e5_1280.jpg",
      streamingLink: "https://open.spotify.com/playlist/sample",
      genres: ["R&B", "Soul", "Electronic"],
      songs: [2, 4, 6],
      type: "set",
      tags: ["r&b", "soul", "track-ids"],
      saves: 742,
      featured: false,
      verified: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.sets.set(set1.id, set1);
    this.sets.set(set2.id, set2);
    this.sets.set(set3.id, set3);
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt: now,
      displayName: insertUser.displayName || null,
      profilePicture: insertUser.profilePicture || null,
      favoriteSongs: [],
      favoriteGenres: [],
      favoriteSubGenres: [],
      favoriteCountries: [],
      badges: []
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    const updated = { ...user, ...updates };
    this.users.set(id, updated);
    return updated;
  }

  // Set operations
  async getSet(id: number): Promise<Set | undefined> {
    return this.sets.get(id);
  }

  async getSetsByUser(userId: number): Promise<Set[]> {
    return Array.from(this.sets.values()).filter(set => set.userId === userId);
  }

  async getAllSets(limit: number = 50): Promise<Set[]> {
    const allSets = Array.from(this.sets.values());
    return allSets.slice(0, limit).sort((a, b) => {
      const aTime = a.createdAt?.getTime() || 0;
      const bTime = b.createdAt?.getTime() || 0;
      return bTime - aTime;
    });
  }

  async getFeaturedSets(limit: number = 10): Promise<Set[]> {
    const featuredSets = Array.from(this.sets.values()).filter(set => set.featured);
    return featuredSets.slice(0, limit).sort((a, b) => {
      const aSaves = a.saves || 0;
      const bSaves = b.saves || 0;
      return bSaves - aSaves;
    });
  }

  async createSet(insertSet: InsertSet): Promise<Set> {
    const id = this.setCurrentId++;
    const now = new Date();
    const set: Set = { 
      id,
      title: insertSet.title,
      description: insertSet.description || null,
      curator: insertSet.curator,
      userId: insertSet.userId,
      image: insertSet.image || null,
      streamingLink: insertSet.streamingLink || null,
      genres: insertSet.genres || [],
      songs: insertSet.songs || [],
      type: insertSet.type || null,
      tags: insertSet.tags || [],
      saves: 0,
      featured: false,
      verified: false,
      createdAt: now,
      updatedAt: now
    };
    this.sets.set(id, set);
    return set;
  }

  async updateSet(id: number, updates: Partial<Set>): Promise<Set | undefined> {
    const set = this.sets.get(id);
    if (!set) return undefined;
    const updated = { ...set, ...updates, updatedAt: new Date() };
    this.sets.set(id, updated);
    return updated;
  }

  // Stub implementations for other methods
  async getArtist(id: number): Promise<Artist | undefined> { return undefined; }
  async getArtistByName(name: string): Promise<Artist | undefined> { return undefined; }
  async getAllArtists(): Promise<Artist[]> { return []; }
  async getFeaturedArtists(limit?: number): Promise<Artist[]> { return []; }
  async createArtist(artist: InsertArtist): Promise<Artist> { throw new Error("Not implemented"); }
  async updateArtist(id: number, updates: Partial<Artist>): Promise<Artist | undefined> { return undefined; }

  async getSong(id: number): Promise<Song | undefined> { return undefined; }
  async getSongsByArtist(artistName: string): Promise<Song[]> { return []; }
  async getAllSongs(limit?: number): Promise<Song[]> { return []; }
  async createSong(song: InsertSong): Promise<Song> { throw new Error("Not implemented"); }
  async updateSong(id: number, updates: Partial<Song>): Promise<Song | undefined> { return undefined; }

  async getVenue(id: number): Promise<Venue | undefined> { return undefined; }
  async getAllVenues(limit?: number): Promise<Venue[]> { return []; }
  async createVenue(venue: InsertVenue): Promise<Venue> { throw new Error("Not implemented"); }
  async updateVenue(id: number, updates: Partial<Venue>): Promise<Venue | undefined> { return undefined; }

  async getThread(id: number): Promise<Thread | undefined> { return undefined; }
  async getAllThreads(type?: string, limit?: number): Promise<Thread[]> { return []; }
  async getThreadsByUser(userId: number): Promise<Thread[]> { return []; }
  async createThread(thread: InsertThread): Promise<Thread> { throw new Error("Not implemented"); }
  async updateThread(id: number, updates: Partial<Thread>): Promise<Thread | undefined> { return undefined; }
  async upvoteThread(id: number): Promise<Thread | undefined> { return undefined; }

  async getComment(id: number): Promise<Comment | undefined> { return undefined; }
  async getCommentsByThread(threadId: number): Promise<Comment[]> { return []; }
  async createComment(comment: InsertComment): Promise<Comment> { throw new Error("Not implemented"); }
  async upvoteComment(id: number): Promise<Comment | undefined> { return undefined; }

  async getSongRecommendation(id: number): Promise<SongRecommendation | undefined> { return undefined; }
  async getSongRecommendationsByThread(threadId: number): Promise<SongRecommendation[]> { return []; }
  async createSongRecommendation(recommendation: InsertSongRecommendation): Promise<SongRecommendation> { throw new Error("Not implemented"); }
  async upvoteSongRecommendation(id: number): Promise<SongRecommendation | undefined> { return undefined; }
}

export const storage = new MemStorage();