import { 
  users, artists, songs, venues, threads, comments, sets, songRecommendations,
  type User, type InsertUser, 
  type Artist, type InsertArtist, 
  type Song, type InsertSong, 
  type Venue, type InsertVenue, 
  type Thread, type InsertThread, 
  type Comment, type InsertComment, 
  type Set, type InsertSet,
  type SongRecommendation, type InsertSongRecommendation 
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
  private users: Map<number, User>;
  private artists: Map<number, Artist>;
  private songs: Map<number, Song>;
  private venues: Map<number, Venue>;
  private threads: Map<number, Thread>;
  private comments: Map<number, Comment>;
  private sets: Map<number, Set>;
  private songRecommendations: Map<number, SongRecommendation>;
  
  private userCurrentId: number;
  private artistCurrentId: number;
  private songCurrentId: number;
  private venueCurrentId: number;
  private threadCurrentId: number;
  private commentCurrentId: number;
  private setCurrentId: number;
  private songRecommendationCurrentId: number;

  constructor() {
    this.users = new Map();
    this.artists = new Map();
    this.songs = new Map();
    this.venues = new Map();
    this.threads = new Map();
    this.comments = new Map();
    this.sets = new Map();
    this.songRecommendations = new Map();
    
    this.userCurrentId = 1;
    this.artistCurrentId = 1;
    this.songCurrentId = 1;
    this.venueCurrentId = 1;
    this.threadCurrentId = 1;
    this.commentCurrentId = 1;
    this.setCurrentId = 1;
    this.songRecommendationCurrentId = 1;

    // Initialize with some seed data
    this.seedData();
  }

  private seedData() {
    // Add seed data here for testing purposes
    const desiree = this.createArtist({
      name: "DESIREE",
      realName: "Desiree Johnson",
      firstDiscoveredIn: "New York",
      genres: ["R&B", "Soul"],
      profilePicture: "https://pixabay.com/get/g90635263ffd0016cab56b4e1bc67ed1dc0ecb5500f0a4a14ae4d3c3c609dd0e77b1a8a75e680ab949a133e40d56c46ed5ee5082cc4843a1bb526c174fd0cc5e5_1280.jpg",
      story: "Rising R&B artist known for her soulful vocals and intimate songwriting.",
      verified: true,
      streamingLinks: [
        { platform: "Spotify", url: "https://open.spotify.com/artist/sample" },
        { platform: "Apple Music", url: "https://music.apple.com/artist/sample" }
      ]
    });

    const tripolism = this.createArtist({
      name: "Tripolism",
      realName: "Tripoli Brothers",
      firstDiscoveredIn: "Berlin",
      genres: ["Electronic", "House", "Techno"],
      profilePicture: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300",
      story: "DJ collective known for their innovative electronic productions and energetic live sets.",
      verified: true,
      streamingLinks: [
        { platform: "Spotify", url: "https://open.spotify.com/artist/sample" },
        { platform: "SoundCloud", url: "https://soundcloud.com/sample" }
      ]
    });

    const andMe = this.createArtist({
      name: "&ME",
      firstDiscoveredIn: "Berlin",
      genres: ["House", "Techno", "Electronic"],
      profilePicture: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300",
      story: "Innovative electronic music producer and DJ known for deep, melodic compositions.",
      verified: true,
      streamingLinks: [
        { platform: "Spotify", url: "https://open.spotify.com/artist/sample" },
        { platform: "SoundCloud", url: "https://soundcloud.com/sample" }
      ]
    });

    const whoMadeWho = this.createArtist({
      name: "WhoMadeWho",
      genres: ["Electronic", "Indie Dance"],
      profilePicture: "https://images.unsplash.com/photo-1501335967913-f41b918b6f72?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300",
      verified: true,
      streamingLinks: [
        { platform: "Spotify", url: "https://open.spotify.com/artist/sample" }
      ]
    });

    // Add songs
    this.createSong({
      title: "Flying Away With You",
      artist: "WhoMadeWho",
      features: ["Tripolism"],
      genre: "Electronic",
      albumArt: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
      streamingLinks: [
        { platform: "Spotify", url: "https://open.spotify.com/track/sample" }
      ]
    });

    this.createSong({
      title: "King Steps (DESIREE Remix)",
      artist: "Disclosure",
      features: ["Pa Salieu", "DESIREE"],
      genre: "Electronic",
      subGenres: ["House"],
      albumArt: "https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&h=256",
      streamingLinks: [
        { platform: "Spotify", url: "https://open.spotify.com/track/sample" }
      ]
    });

    this.createSong({
      title: "Buschtaxi",
      artist: "DJ Koze",
      genre: "Electronic",
      subGenres: ["House", "Minimal"],
      albumArt: "https://images.unsplash.com/photo-1536640712-4d4c36ff0e4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&h=256",
      streamingLinks: [
        { platform: "Spotify", url: "https://open.spotify.com/track/sample" }
      ]
    });

    this.createSong({
      title: "Instant Crush",
      artist: "Daft Punk",
      features: ["Julian Casablancas"],
      genre: "Electronic",
      subGenres: ["French House", "Indie"],
      albumArt: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
      streamingLinks: [
        { platform: "Spotify", url: "https://open.spotify.com/track/sample" }
      ]
    });

    this.createSong({
      title: "Not Going Home",
      artist: "Rex The Dog",
      genre: "Electronic",
      subGenres: ["Tech House"],
      albumArt: "https://images.unsplash.com/photo-1542791048-3c4b45101695?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&h=256",
      streamingLinks: [
        { platform: "Spotify", url: "https://open.spotify.com/track/sample" }
      ]
    });

    this.createSong({
      title: "Blessed",
      artist: "Nic Fanciulli",
      features: ["Black Circle"],
      genre: "Electronic",
      subGenres: ["Tech House"],
      albumArt: "https://images.unsplash.com/photo-1546707504-6bf1bd588fc7?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&h=256",
      streamingLinks: [
        { platform: "Spotify", url: "https://open.spotify.com/track/sample" }
      ]
    });

    // Add venues
    this.createVenue({
      name: "Watergate",
      location: "Berlin, Germany",
      description: "Legendary club on the banks of the Spree river known for its electronic music lineup and impressive sound system.",
      genres: ["Techno", "House"],
      rating: 48,
      image: "https://pixabay.com/get/g3a71b1634e3223389bb5a6fbc77747911e4a5d5afd476b66852e3a62926307cac1027cf895dff023db816db4faa34d8da8e1e4be8ed1da07057c8282495ff1ac_1280.jpg",
      currentDj: "Âme",
      upcomingEvents: [
        { date: "2023-05-20", artist: "Dixon", ticketsUrl: "https://example.com/tickets" }
      ]
    });

    this.createVenue({
      name: "Blue Note",
      location: "New York, NY",
      description: "Iconic jazz club showcasing the world's finest jazz musicians in an intimate setting since 1981.",
      genres: ["Jazz", "Soul"],
      rating: 49,
      image: "https://pixabay.com/get/g529e1752113881052cb96eb8395a76a1e1166f329a89731ba2908ee872297ce5ea4470df3c9e305f1f11f1bcb2bb2141bec14c7ebaf703a1ceccb2da52e1942f_1280.jpg",
      currentDj: "BADBADNOTGOOD",
      upcomingEvents: [
        { date: "2023-05-22", artist: "Nubya Garcia", ticketsUrl: "https://example.com/tickets" }
      ]
    });

    // Add threads
    const user1 = this.createUser({
      username: "techno_junkie",
      password: "securepassword123",
      displayName: "Techno Junkie"
    });

    const user2 = this.createUser({
      username: "vinyl_collector",
      password: "securepassword123",
      displayName: "Vinyl Collector",
      profilePicture: "https://pixabay.com/get/g051135cec709001c5dce7f0375d03411671ae9703a2df3548a5fe46cd0e7eda36f80995b9d2d9170c10899871575bca8e17d19e27b64384e81a4f8054fd6a18e_1280.jpg"
    });

    const user3 = this.createUser({
      username: "musiclover44",
      password: "securepassword123",
      displayName: "Music Lover"
    });

    const user4 = this.createUser({
      username: "bass_hunter",
      password: "securepassword123",
      displayName: "Bass Hunter"
    });

    this.createThread({
      title: "Best Techno Albums of 2023 So Far",
      content: "I'm looking for recommendations on the best techno albums released this year. I've been really into minimal techno lately and would love to discover new artists...",
      userId: user1.id,
      type: "discussion",
      status: "active",
      upvotes: 128,
      commentsCount: 42,
      recommendationsCount: 24
    });

    this.createThread({
      title: "Vinyl vs. Digital - The Sound Quality Debate",
      content: "Let's settle this once and for all. I've been collecting vinyl for years and genuinely believe the warmth of analog can't be matched, but some new high-res digital...",
      userId: user2.id,
      type: "discussion",
      status: "active",
      upvotes: 215,
      commentsCount: 87,
      recommendationsCount: 12
    });

    this.createThread({
      title: "Help identify this track",
      content: "I heard this track at Boiler Room NYC last night. It had a deep bass line and female vocals saying something like 'take me higher'...",
      userId: user3.id,
      type: "song_request",
      status: "active",
      upvotes: 18,
      commentsCount: 12,
      recommendationsCount: 3
    });

    this.createThread({
      title: "Track identified!",
      content: "That deep house track from the underground club in Berlin with the distinctive piano riff...",
      userId: user4.id,
      type: "song_request",
      status: "solved",
      upvotes: 32,
      commentsCount: 8,
      recommendationsCount: 1
    });

    // Add sets without await (since createSet is synchronous)
    const set1 = this.createSet({
      title: "Tripolism's track IDs",
      description: "Tripolism's favorite tracks. Updated regularly. Curated by Tripolism.",
      curator: "Tripolism",
      userId: 1,
      image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300",
      streamingLink: "https://open.spotify.com/playlist/sample",
      genres: ["Electronic", "House", "Techno"],
      songs: [1, 2, 3],
      type: "set",
      tags: ["techno", "house", "electronic", "track-ids"]
    });

    const set2 = this.createSet({
      title: "&ME's track IDs",
      description: "&ME's favorite tracks. Updated regularly. Curated by &ME.",
      curator: "&ME",
      userId: 1,
      image: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300",
      streamingLink: "https://open.spotify.com/playlist/sample",
      genres: ["House", "Techno", "Electronic"],
      songs: [4, 5, 6],
      type: "set",
      tags: ["house", "techno", "track-ids"]
    });

    const set3 = this.createSet({
      title: "DESIREE's track IDs",
      description: "DESIREE's favorite tracks. Updated regularly. Curated by DESIREE.",
      curator: "DESIREE",
      userId: 1,
      image: "https://pixabay.com/get/g90635263ffd0016cab56b4e1bc67ed1dc0ecb5500f0a4a14ae4d3c3c609dd0e77b1a8a75e680ab949a133e40d56c46ed5ee5082cc4843a1bb526c174fd0cc5e5_1280.jpg",
      streamingLink: "https://open.spotify.com/playlist/sample",
      genres: ["R&B", "Soul", "Electronic"],
      songs: [2, 4, 6],
      type: "set",
      tags: ["r&b", "soul", "track-ids"]
    });

    // Mark the first set as featured
    this.updateSet(set1.id, { featured: true });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id, 
      favoriteSongs: [],
      favoriteGenres: [],
      favoriteSubGenres: [],
      favoriteCountries: [],
      badges: [],
      createdAt: now 
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Artist operations
  async getArtist(id: number): Promise<Artist | undefined> {
    return this.artists.get(id);
  }

  async getArtistByName(name: string): Promise<Artist | undefined> {
    return Array.from(this.artists.values()).find(
      (artist) => artist.name.toLowerCase() === name.toLowerCase(),
    );
  }

  async getAllArtists(): Promise<Artist[]> {
    return Array.from(this.artists.values());
  }

  async getFeaturedArtists(limit: number = 10): Promise<Artist[]> {
    return Array.from(this.artists.values())
      .sort(() => 0.5 - Math.random())
      .slice(0, limit);
  }

  async createArtist(insertArtist: InsertArtist): Promise<Artist> {
    const id = this.artistCurrentId++;
    const now = new Date();
    const artist: Artist = { ...insertArtist, id, ranking: 0, createdAt: now };
    this.artists.set(id, artist);
    return artist;
  }

  async updateArtist(id: number, updates: Partial<Artist>): Promise<Artist | undefined> {
    const artist = this.artists.get(id);
    if (!artist) return undefined;
    
    const updatedArtist = { ...artist, ...updates };
    this.artists.set(id, updatedArtist);
    return updatedArtist;
  }

  // Song operations
  async getSong(id: number): Promise<Song | undefined> {
    return this.songs.get(id);
  }

  async getSongsByArtist(artistName: string): Promise<Song[]> {
    return Array.from(this.songs.values()).filter(
      (song) => song.artist.toLowerCase() === artistName.toLowerCase() ||
                song.features?.some(feature => 
                  typeof feature === 'string' 
                    ? feature.toLowerCase() === artistName.toLowerCase()
                    : feature.toLowerCase() === artistName.toLowerCase()
                )
    );
  }

  async getAllSongs(limit: number = 50): Promise<Song[]> {
    return Array.from(this.songs.values()).slice(0, limit);
  }

  async createSong(insertSong: InsertSong): Promise<Song> {
    const id = this.songCurrentId++;
    const now = new Date();
    const song: Song = { ...insertSong, id, ranking: 0, createdAt: now };
    this.songs.set(id, song);
    return song;
  }

  async updateSong(id: number, updates: Partial<Song>): Promise<Song | undefined> {
    const song = this.songs.get(id);
    if (!song) return undefined;
    
    const updatedSong = { ...song, ...updates };
    this.songs.set(id, updatedSong);
    return updatedSong;
  }

  // Venue operations
  async getVenue(id: number): Promise<Venue | undefined> {
    return this.venues.get(id);
  }

  async getAllVenues(limit: number = 50): Promise<Venue[]> {
    return Array.from(this.venues.values()).slice(0, limit);
  }

  async createVenue(insertVenue: InsertVenue): Promise<Venue> {
    const id = this.venueCurrentId++;
    const now = new Date();
    const venue: Venue = { ...insertVenue, id, createdAt: now };
    this.venues.set(id, venue);
    return venue;
  }

  async updateVenue(id: number, updates: Partial<Venue>): Promise<Venue | undefined> {
    const venue = this.venues.get(id);
    if (!venue) return undefined;
    
    const updatedVenue = { ...venue, ...updates };
    this.venues.set(id, updatedVenue);
    return updatedVenue;
  }

  // Thread operations
  async getThread(id: number): Promise<Thread | undefined> {
    return this.threads.get(id);
  }

  async getAllThreads(type?: string, limit: number = 50): Promise<Thread[]> {
    let threads = Array.from(this.threads.values());
    
    if (type) {
      threads = threads.filter(thread => thread.type === type);
    }
    
    return threads
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async getThreadsByUser(userId: number): Promise<Thread[]> {
    return Array.from(this.threads.values())
      .filter(thread => thread.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createThread(insertThread: InsertThread): Promise<Thread> {
    const id = this.threadCurrentId++;
    const now = new Date();
    const thread: Thread = { 
      ...insertThread, 
      id, 
      upvotes: 0, 
      commentsCount: 0, 
      recommendationsCount: 0, 
      createdAt: now 
    };
    this.threads.set(id, thread);
    return thread;
  }

  async updateThread(id: number, updates: Partial<Thread>): Promise<Thread | undefined> {
    const thread = this.threads.get(id);
    if (!thread) return undefined;
    
    const updatedThread = { ...thread, ...updates };
    this.threads.set(id, updatedThread);
    return updatedThread;
  }

  async upvoteThread(id: number): Promise<Thread | undefined> {
    const thread = this.threads.get(id);
    if (!thread) return undefined;
    
    const updatedThread = { ...thread, upvotes: thread.upvotes + 1 };
    this.threads.set(id, updatedThread);
    return updatedThread;
  }

  // Comment operations
  async getComment(id: number): Promise<Comment | undefined> {
    return this.comments.get(id);
  }

  async getCommentsByThread(threadId: number): Promise<Comment[]> {
    return Array.from(this.comments.values())
      .filter(comment => comment.threadId === threadId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createComment(insertComment: InsertComment): Promise<Comment> {
    const id = this.commentCurrentId++;
    const now = new Date();
    const comment: Comment = { ...insertComment, id, upvotes: 0, createdAt: now };
    this.comments.set(id, comment);
    
    // Update thread comment count
    const thread = this.threads.get(insertComment.threadId);
    if (thread) {
      this.threads.set(thread.id, {
        ...thread,
        commentsCount: thread.commentsCount + 1
      });
    }
    
    return comment;
  }

  async upvoteComment(id: number): Promise<Comment | undefined> {
    const comment = this.comments.get(id);
    if (!comment) return undefined;
    
    const updatedComment = { ...comment, upvotes: comment.upvotes + 1 };
    this.comments.set(id, updatedComment);
    return updatedComment;
  }

  // Set operations
  async getSet(id: number): Promise<Set | undefined> {
    return this.sets.get(id);
  }

  async getSetsByUser(userId: number): Promise<Set[]> {
    return Array.from(this.sets.values())
      .filter(set => set.userId === userId)
      .sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime());
  }

  async getAllSets(limit: number = 50): Promise<Set[]> {
    return Array.from(this.sets.values())
      .sort((a, b) => b.saves - a.saves)
      .slice(0, limit);
  }

  async getFeaturedSets(limit: number = 10): Promise<Set[]> {
    return Array.from(this.sets.values())
      .filter(set => set.featured)
      .sort((a, b) => b.saves - a.saves)
      .slice(0, limit);
  }

  async createSet(insertSet: InsertSet): Promise<Set> {
    const id = this.setCurrentId++;
    const now = new Date();
    const set: Set = { 
      ...insertSet, 
      id, 
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
    
    const now = new Date();
    const updatedSet = { ...set, ...updates, updatedAt: now };
    this.sets.set(id, updatedSet);
    return updatedSet;
  }

  // Song Recommendation operations
  async getSongRecommendation(id: number): Promise<SongRecommendation | undefined> {
    return this.songRecommendations.get(id);
  }

  async getSongRecommendationsByThread(threadId: number): Promise<SongRecommendation[]> {
    return Array.from(this.songRecommendations.values())
      .filter(rec => rec.threadId === threadId)
      .sort((a, b) => b.upvotes - a.upvotes);
  }

  async createSongRecommendation(insertRecommendation: InsertSongRecommendation): Promise<SongRecommendation> {
    const id = this.songRecommendationCurrentId++;
    const now = new Date();
    const recommendation: SongRecommendation = { 
      ...insertRecommendation, 
      id, 
      upvotes: 0, 
      createdAt: now 
    };
    this.songRecommendations.set(id, recommendation);
    
    // Update thread recommendation count
    const thread = this.threads.get(insertRecommendation.threadId);
    if (thread) {
      this.threads.set(thread.id, {
        ...thread,
        recommendationsCount: thread.recommendationsCount + 1
      });
    }
    
    return recommendation;
  }

  async upvoteSongRecommendation(id: number): Promise<SongRecommendation | undefined> {
    const recommendation = this.songRecommendations.get(id);
    if (!recommendation) return undefined;
    
    const updatedRecommendation = { ...recommendation, upvotes: recommendation.upvotes + 1 };
    this.songRecommendations.set(id, updatedRecommendation);
    return updatedRecommendation;
  }
}

export const storage = new MemStorage();
