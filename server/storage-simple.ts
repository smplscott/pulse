import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import type { 
  User, InsertUser, 
  Artist, InsertArtist,
  Song, InsertSong,
  Venue, InsertVenue,
  Thread, InsertThread,
  Comment, InsertComment,
  MusicSet, InsertSet,
  SongRecommendation, InsertSongRecommendation,
  TrackId, InsertTrackId,
  TrackIdVote, InsertTrackIdVote,
  Notification, InsertNotification,
  ThreadFollow,
  Place, InsertPlace,
  PlaceComment, InsertPlaceComment,
  Show, InsertShow,
  ShowReview, InsertShowReview,
  ShowComment, InsertShowComment,
} from "@shared/schema";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
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
  getFeaturedThreads(limit?: number): Promise<Thread[]>;
  getEngagedThreadsByUser(userId: number): Promise<Thread[]>;
  getThreadsByUser(userId: number): Promise<Thread[]>;
  createThread(thread: InsertThread): Promise<Thread>;
  updateThread(id: number, updates: Partial<Thread>): Promise<Thread | undefined>;
  upvoteThread(id: number): Promise<Thread | undefined>;
  saveThread(id: number): Promise<Thread | undefined>;
  
  // Comment operations
  getComment(id: number): Promise<Comment | undefined>;
  getCommentsByThread(threadId: number): Promise<Comment[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  upvoteComment(id: number): Promise<Comment | undefined>;
  
  // MusicSet operations
  getSet(id: number): Promise<MusicSet | undefined>;
  getSetsByUser(userId: number): Promise<MusicSet[]>;
  getAllSets(limit?: number): Promise<MusicSet[]>;
  getFeaturedSets(limit?: number): Promise<MusicSet[]>;
  createSet(set: InsertSet): Promise<MusicSet>;
  updateSet(id: number, updates: Partial<MusicSet>): Promise<MusicSet | undefined>;
  
  // Song Recommendation operations
  getSongRecommendation(id: number): Promise<SongRecommendation | undefined>;
  getSongRecommendationsByThread(threadId: number): Promise<SongRecommendation[]>;
  createSongRecommendation(recommendation: InsertSongRecommendation): Promise<SongRecommendation>;
  upvoteSongRecommendation(id: number): Promise<SongRecommendation | undefined>;

  // TrackId operations
  getTrackIdsBySet(setId: number): Promise<TrackId[]>;
  createTrackId(trackId: InsertTrackId): Promise<TrackId>;
  getTrackIdVote(userId: number, trackId: number): Promise<TrackIdVote | undefined>;
  castTrackIdVote(vote: InsertTrackIdVote): Promise<{ trackId: TrackId; vote: TrackIdVote }>;

  // Follow operations
  getFollowedArtists(userId: number): Promise<Artist[]>;
  followArtist(userId: number, artistId: number): Promise<void>;
  unfollowArtist(userId: number, artistId: number): Promise<void>;
  getFollowedSongs(userId: number): Promise<Song[]>;
  followSong(userId: number, songId: number): Promise<void>;
  unfollowSong(userId: number, songId: number): Promise<void>;

  // Thread follow operations
  getThreadFollowers(threadId: number): Promise<ThreadFollow[]>;
  isFollowingThread(userId: number, threadId: number): Promise<boolean>;
  followThread(userId: number, threadId: number): Promise<void>;
  unfollowThread(userId: number, threadId: number): Promise<void>;

  // Notification operations
  getNotificationsByUser(userId: number): Promise<Notification[]>;
  getUnreadNotificationCount(userId: number): Promise<number>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationRead(id: number): Promise<void>;
  markAllNotificationsRead(userId: number): Promise<void>;

  // Place operations
  getPlace(id: number): Promise<Place | undefined>;
  getAllPlaces(limit?: number): Promise<Place[]>;
  searchPlaces(query: string): Promise<Place[]>;
  createPlace(place: InsertPlace): Promise<Place>;
  updatePlace(id: number, updates: Partial<Place>): Promise<Place | undefined>;
  getPlaceComments(placeId: number): Promise<PlaceComment[]>;
  createPlaceComment(comment: InsertPlaceComment): Promise<PlaceComment>;

  // Show operations
  getShow(id: number): Promise<Show | undefined>;
  getShowBySetlistfmId(setlistfmId: string): Promise<Show | undefined>;
  getAllShows(limit?: number): Promise<Show[]>;
  createShow(show: InsertShow): Promise<Show>;
  getShowReviews(showId: number): Promise<ShowReview[]>;
  getUserShowReview(userId: number, showId: number): Promise<ShowReview | undefined>;
  createShowReview(review: InsertShowReview): Promise<ShowReview>;
  getShowComments(showId: number): Promise<ShowComment[]>;
  createShowComment(comment: InsertShowComment): Promise<ShowComment>;
  upvoteShowComment(id: number): Promise<ShowComment | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private artists: Map<number, Artist> = new Map();
  private songs: Map<number, Song> = new Map();
  private venues: Map<number, Venue> = new Map();
  private threads: Map<number, Thread> = new Map();
  private comments: Map<number, Comment> = new Map();
  private sets: Map<number, MusicSet> = new Map();
  private songRecommendations: Map<number, SongRecommendation> = new Map();
  private trackIdsMap: Map<number, TrackId> = new Map();
  private trackIdVotesMap: Map<number, TrackIdVote> = new Map();
  private followedArtistsMap: Map<number, Set<number>> = new Map();
  private followedSongsMap: Map<number, Set<number>> = new Map();
  private threadFollowsMap: Map<number, ThreadFollow> = new Map();
  private notificationsMap: Map<number, Notification> = new Map();
  private placesMap: Map<number, Place> = new Map();
  private placeCommentsMap: Map<number, PlaceComment> = new Map();
  private showsMap: Map<number, Show> = new Map();
  private showReviewsMap: Map<number, ShowReview> = new Map();
  private showCommentsMap: Map<number, ShowComment> = new Map();

  private userCurrentId = 1;
  private artistCurrentId = 1;
  private songCurrentId = 1;
  private venueCurrentId = 1;
  private threadCurrentId = 1;
  private commentCurrentId = 1;
  private setCurrentId = 1;
  private songRecommendationCurrentId = 1;
  private trackIdCurrentId = 1;
  private trackIdVoteCurrentId = 1;
  private threadFollowCurrentId = 1;
  private notificationCurrentId = 1;
  private placeCurrentId = 1;
  private placeCommentCurrentId = 1;
  private showCurrentId = 1;
  private showReviewCurrentId = 1;
  private showCommentCurrentId = 1;

  constructor() {
    void this.seedData();
  }

  private async seedData() {
    const hashedPassword = await hashPassword("testpass123");
    // Create basic test user (login: testuser / testpass123 or test@pulse.fm / testpass123)
    const user: User = {
      id: this.userCurrentId++,
      username: "testuser",
      email: "test@pulse.fm",
      password: hashedPassword,
      displayName: "Test User",
      bio: "Music lover and avid listener.",
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
    const set1: MusicSet = {
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
      city: "Berlin",
      country: "Germany",
      eventDate: "2024-03-15",
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const set2: MusicSet = {
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
      city: "Amsterdam",
      country: "Netherlands",
      eventDate: "2024-02-10",
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const set3: MusicSet = {
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
      city: "London",
      country: "UK",
      eventDate: "2024-01-20",
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.sets.set(set1.id, set1);
    this.sets.set(set2.id, set2);
    this.sets.set(set3.id, set3);

    // Create sample songs
    const song1: Song = {
      id: this.songCurrentId++,
      title: "Break on Through (To the Other Side)",
      artist: "The Doors",
      albumArt: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300",
      albumName: "The Doors",
      genre: "Rock",
      subGenres: ["Psychedelic Rock", "Classic Rock"],
      releaseDate: new Date("1967-01-04"),
      features: ["Jim Morrison", "Robby Krieger", "Ray Manzarek", "John Densmore"],
      sample: null,
      story: "The opening track from The Doors' debut album, featuring Morrison's iconic vocals and Krieger's innovative guitar work.",
      dialects: [],
      streamingLinks: { spotify: "https://open.spotify.com/track/example1" },
      ranking: 1,
      createdAt: new Date()
    };

    const song2: Song = {
      id: this.songCurrentId++,
      title: "Riders on the Storm",
      artist: "The Doors",
      albumArt: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300",
      albumName: "L.A. Woman",
      genre: "Rock",
      subGenres: ["Psychedelic Rock", "Jazz Rock"],
      releaseDate: new Date("1971-04-19"),
      features: ["Jim Morrison", "Robby Krieger", "Ray Manzarek", "John Densmore"],
      sample: null,
      story: "The last song recorded with Jim Morrison, featuring storm sound effects and jazz influences.",
      dialects: [],
      streamingLinks: { spotify: "https://open.spotify.com/track/example2" },
      ranking: 2,
      createdAt: new Date()
    };

    const song3: Song = {
      id: this.songCurrentId++,
      title: "Light My Fire",
      artist: "The Doors", 
      albumArt: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300",
      albumName: "The Doors",
      genre: "Rock",
      subGenres: ["Psychedelic Rock", "Classic Rock"],
      releaseDate: new Date("1967-04-24"),
      features: ["Jim Morrison", "Robby Krieger", "Ray Manzarek", "John Densmore"],
      sample: null,
      story: "Written by Robby Krieger, this became The Doors' biggest hit and signature song.",
      dialects: [],
      streamingLinks: { spotify: "https://open.spotify.com/track/example3" },
      ranking: 3,
      createdAt: new Date()
    };

    const song4: Song = {
      id: this.songCurrentId++,
      title: "Blinding Lights",
      artist: "The Weeknd",
      albumArt: "https://images.unsplash.com/photo-1571974599782-87624638275c?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300",
      albumName: "After Hours",
      genre: "Pop",
      subGenres: ["Synthpop", "Electropop"],
      releaseDate: new Date("2019-11-29"),
      features: ["The Weeknd", "Max Martin", "Oscar Holter"],
      sample: null,
      story: "A synth-heavy track that dominated charts worldwide and became one of the biggest hits of 2020.",
      dialects: [],
      streamingLinks: { spotify: "https://open.spotify.com/track/example4" },
      ranking: 4,
      createdAt: new Date()
    };

    this.songs.set(song1.id, song1);
    this.songs.set(song2.id, song2);
    this.songs.set(song3.id, song3);
    this.songs.set(song4.id, song4);

    // Seed threads
    const seedThreads: Thread[] = [
      {
        id: this.threadCurrentId++,
        title: "Most Innovative Electronic Artists of 2025",
        content: "Who do you think is pushing the boundaries of electronic music this year? I've been amazed by how producers are blending organic instrumentation with digital production.",
        userId: user.id,
        type: "discussion",
        threadType: "topic",
        songId: null,
        artistId: null,
        setId: null,
        starRating: null,
        status: "active",
        upvotes: 48,
        savesCount: 34,
        commentsCount: 243,
        recommendationsCount: 12,
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
      },
      {
        id: this.threadCurrentId++,
        title: "Techno DJs That Define Berlin's Sound",
        content: "Berlin's techno scene has always been unparalleled. Let's discuss the artists who have shaped and continue to define that raw, industrial sound.",
        userId: user.id,
        type: "discussion",
        threadType: "topic",
        songId: null,
        artistId: null,
        setId: null,
        starRating: null,
        status: "active",
        upvotes: 62,
        savesCount: 29,
        commentsCount: 192,
        recommendationsCount: 8,
        createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
      },
      {
        id: this.threadCurrentId++,
        title: "This track has been on repeat for 3 days straight",
        content: "Riders on the Storm just hits different at 3am. The rain sounds, the keys — pure atmosphere.",
        userId: user.id,
        type: "discussion",
        threadType: "listening_now",
        songId: song2.id,
        artistId: null,
        setId: null,
        starRating: null,
        status: "active",
        upvotes: 31,
        savesCount: 19,
        commentsCount: 45,
        recommendationsCount: 3,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
      {
        id: this.threadCurrentId++,
        title: "Incredible live set — best show I've been to in years",
        content: "The energy was unreal. Every transition was perfectly executed and the crowd was fully locked in from start to finish.",
        userId: user.id,
        type: "discussion",
        threadType: "live_show_review",
        songId: null,
        artistId: null,
        setId: null,
        starRating: 5,
        status: "active",
        upvotes: 77,
        savesCount: 41,
        commentsCount: 122,
        recommendationsCount: 0,
        createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
      },
      {
        id: this.threadCurrentId++,
        title: "New Discoveries Worth Sharing — July 2025",
        content: "Drop your best new finds below! I've been deep in the rabbit hole this month and found some absolute gems.",
        userId: user.id,
        type: "discussion",
        threadType: "new_music",
        songId: null,
        artistId: null,
        setId: null,
        starRating: null,
        status: "active",
        upvotes: 55,
        savesCount: 67,
        commentsCount: 156,
        recommendationsCount: 31,
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
      },
      {
        id: this.threadCurrentId++,
        title: "Blinding Lights is still unmatched for that 80s synth feel",
        content: "Years later and this track still sounds fresh. The production on this is a masterclass.",
        userId: user.id,
        type: "discussion",
        threadType: "listening_now",
        songId: song4.id,
        artistId: null,
        setId: null,
        starRating: null,
        status: "active",
        upvotes: 23,
        savesCount: 15,
        commentsCount: 67,
        recommendationsCount: 5,
        createdAt: new Date(Date.now() - 18 * 60 * 60 * 1000),
      },
    ];

    for (const thread of seedThreads) {
      this.threads.set(thread.id, thread);
    }

    // Seed artists
    const artist1: Artist = {
      id: this.artistCurrentId++,
      name: "The Doors",
      realName: "Jim Morrison, Ray Manzarek, Robby Krieger, John Densmore",
      firstDiscoveredIn: "US",
      firstAlbumReleaseDate: new Date("1967-01-04"),
      sample: null,
      story: "The Doors were an American rock band formed in Los Angeles in 1965. The band consisted of vocalist Jim Morrison, keyboardist Ray Manzarek, guitarist Robby Krieger, and drummer John Densmore. They are one of the most controversial and influential rock acts of the 1960s.",
      streamingLinks: [{ platform: "Spotify", url: "https://open.spotify.com/artist/22WZ7M66p7UkEBnCXHBf0F" }],
      ranking: 1,
      genres: ["Rock", "Psychedelic Rock", "Classic Rock"],
      profilePicture: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300",
      verified: true,
      createdAt: new Date()
    };
    const artist2: Artist = {
      id: this.artistCurrentId++,
      name: "The Weeknd",
      realName: "Abel Makkonen Tesfaye",
      firstDiscoveredIn: "CA",
      firstAlbumReleaseDate: new Date("2013-05-28"),
      sample: null,
      story: "Abel Makkonen Tesfaye, known professionally as the Weeknd, is a Canadian singer, songwriter, and record producer. He is known for his sonic versatility and dark lyricism, with his music drawing from R&B, pop, synth-pop, and alternative R&B.",
      streamingLinks: [{ platform: "Spotify", url: "https://open.spotify.com/artist/1Xyo4u8uXC1ZmMpatF05PJ" }],
      ranking: 2,
      genres: ["Pop", "R&B", "Synth-pop"],
      profilePicture: "https://images.unsplash.com/photo-1571974599782-87624638275c?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300",
      verified: true,
      createdAt: new Date()
    };
    const artist3: Artist = {
      id: this.artistCurrentId++,
      name: "Bicep",
      realName: "Matt McBriar & Andy Ferguson",
      firstDiscoveredIn: "GB",
      firstAlbumReleaseDate: new Date("2017-09-01"),
      sample: null,
      story: "Bicep is a Northern Irish electronic music duo consisting of Matt McBriar and Andy Ferguson. Based in London, they rose to fame through their blog 'Feel My Bicep' before pursuing music production. Known for their emotive take on house and electronic music.",
      streamingLinks: [{ platform: "Spotify", url: "https://open.spotify.com/artist/73A3bLnfnz5LoQCtml5zrN" }],
      ranking: 3,
      genres: ["Electronic", "House", "Techno"],
      profilePicture: "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300",
      verified: true,
      createdAt: new Date()
    };
    this.artists.set(artist1.id, artist1);
    this.artists.set(artist2.id, artist2);
    this.artists.set(artist3.id, artist3);

    // Seed track IDs for sets
    const seedTrackIds: TrackId[] = [
      {
        id: this.trackIdCurrentId++,
        setId: set1.id,
        title: "Pangaea",
        artist: "Bicep",
        submittedBy: user.id,
        confirmCount: 5,
        disagreeCount: 0,
        locked: true,
        removed: false,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        id: this.trackIdCurrentId++,
        setId: set1.id,
        title: "See Me Now (Original Mix)",
        artist: "Kerri Chandler",
        submittedBy: user.id,
        confirmCount: 3,
        disagreeCount: 1,
        locked: false,
        removed: false,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        id: this.trackIdCurrentId++,
        setId: set1.id,
        title: "Mystery of Love",
        artist: "Larry Heard",
        submittedBy: user.id,
        confirmCount: 1,
        disagreeCount: 2,
        locked: false,
        removed: false,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
      {
        id: this.trackIdCurrentId++,
        setId: set2.id,
        title: "Offshore",
        artist: "Bicep",
        submittedBy: user.id,
        confirmCount: 4,
        disagreeCount: 0,
        locked: false,
        removed: false,
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
    ];
    for (const tid of seedTrackIds) {
      this.trackIdsMap.set(tid.id, tid);
    }

    // Seed testuser follows all 3 artists and all 4 songs
    this.followedArtistsMap.set(user.id, new Set([artist1.id, artist2.id, artist3.id]));
    this.followedSongsMap.set(user.id, new Set([1, 2, 3, 4]));

    // Seed thread follows — testuser watches threads 1, 2, 3
    const seedFollows: ThreadFollow[] = [
      { id: this.threadFollowCurrentId++, userId: user.id, threadId: 1, createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
      { id: this.threadFollowCurrentId++, userId: user.id, threadId: 2, createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
      { id: this.threadFollowCurrentId++, userId: user.id, threadId: 3, createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
    ];
    for (const f of seedFollows) {
      this.threadFollowsMap.set(f.id, f);
    }

    // Seed notifications for testuser
    const seedNotifications: Notification[] = [
      {
        id: this.notificationCurrentId++,
        userId: user.id,
        type: "comment",
        threadId: 1,
        threadTitle: "The Doors — legacy and impact on modern rock",
        actorId: user.id,
        actorUsername: "musicfan42",
        read: false,
        createdAt: new Date(Date.now() - 30 * 60 * 1000),
      },
      {
        id: this.notificationCurrentId++,
        userId: user.id,
        type: "save",
        threadId: 2,
        threadTitle: "Bicep live set thoughts",
        actorId: user.id,
        actorUsername: "deeplistener",
        read: false,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
      {
        id: this.notificationCurrentId++,
        userId: user.id,
        type: "comment",
        threadId: 3,
        threadTitle: "Best electronic albums of 2024",
        actorId: user.id,
        actorUsername: "rave_historian",
        read: true,
        createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
      },
    ];
    for (const n of seedNotifications) {
      this.notificationsMap.set(n.id, n);
    }

    // Seed places
    const seedPlaces: Place[] = [
      {
        id: this.placeCurrentId++,
        userId: user.id,
        name: "Fabric",
        city: "London",
        country: "UK",
        category: "club",
        genres: ["Techno", "House", "Drum & Bass"],
        description: "World-renowned nightclub in Farringdon known for its legendary lineups and unbeatable sound system. A pilgrimage site for electronic music fans.",
        mapsLink: "https://maps.google.com/?q=Fabric+London",
        rating: 5,
        reviewsCount: 284,
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
      {
        id: this.placeCurrentId++,
        userId: user.id,
        name: "Berghain",
        city: "Berlin",
        country: "Germany",
        category: "club",
        genres: ["Techno", "Industrial"],
        description: "The world's most famous techno club, housed in a former power plant in Berlin's Friedrichshain district. Known for its strict door policy and 48-hour sets.",
        mapsLink: "https://maps.google.com/?q=Berghain+Berlin",
        rating: 5,
        reviewsCount: 512,
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      },
      {
        id: this.placeCurrentId++,
        userId: user.id,
        name: "Amoeba Music",
        city: "Los Angeles",
        country: "USA",
        category: "record_store",
        genres: ["All Genres"],
        description: "The world's largest independent record store. A must-visit destination for vinyl enthusiasts with over 100,000 new and used records across every genre imaginable.",
        mapsLink: "https://maps.google.com/?q=Amoeba+Music+Los+Angeles",
        rating: 5,
        reviewsCount: 178,
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      },
      {
        id: this.placeCurrentId++,
        userId: user.id,
        name: "Elsewhere",
        city: "New York",
        country: "USA",
        category: "club",
        genres: ["Electronic", "House", "Indie"],
        description: "Multi-level venue in Bushwick featuring a roof deck, hall, and zone. One of NYC's best spots for both underground and emerging artists.",
        mapsLink: "https://maps.google.com/?q=Elsewhere+Brooklyn",
        rating: 4,
        reviewsCount: 96,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
      {
        id: this.placeCurrentId++,
        userId: user.id,
        name: "Rough Trade East",
        city: "London",
        country: "UK",
        category: "record_store",
        genres: ["Indie", "Rock", "Electronic"],
        description: "Iconic record shop in Brick Lane's Old Truman Brewery. Regular in-store performances, extensive vinyl selection and knowledgeable staff.",
        mapsLink: "https://maps.google.com/?q=Rough+Trade+East+London",
        rating: 5,
        reviewsCount: 143,
        createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      },
    ];
    for (const p of seedPlaces) {
      this.placesMap.set(p.id, p);
    }

    // Seed place comments for Fabric (place id 1)
    const seedPlaceComments: PlaceComment[] = [
      {
        id: this.placeCommentCurrentId++,
        placeId: 1,
        userId: user.id,
        content: "Room 1 on a Friday night is an experience unlike anything else. The sound system is genuinely life-changing.",
        upvotes: 24,
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
      {
        id: this.placeCommentCurrentId++,
        placeId: 1,
        userId: user.id,
        content: "Get there early — the queue can be 2+ hours on peak nights. Worth it every single time though.",
        upvotes: 17,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
    ];
    for (const pc of seedPlaceComments) {
      this.placeCommentsMap.set(pc.id, pc);
    }

    // Seed shows
    const seedShows: Show[] = [
      {
        id: this.showCurrentId++,
        setlistfmId: null,
        artistName: "Bicep",
        venueName: "Alexandra Palace",
        city: "London",
        country: "UK",
        eventDate: "2023-11-18",
        genres: ["Electronic", "House"],
        notes: null,
        isManual: false,
        createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      },
      {
        id: this.showCurrentId++,
        setlistfmId: null,
        artistName: "The Weeknd",
        venueName: "Wembley Stadium",
        city: "London",
        country: "UK",
        eventDate: "2023-06-02",
        genres: ["R&B", "Pop"],
        notes: null,
        isManual: false,
        createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
      },
      {
        id: this.showCurrentId++,
        setlistfmId: null,
        artistName: "Four Tet",
        venueName: "Printworks",
        city: "London",
        country: "UK",
        eventDate: "2023-09-15",
        genres: ["Electronic", "Ambient"],
        notes: null,
        isManual: false,
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      },
      {
        id: this.showCurrentId++,
        setlistfmId: null,
        artistName: "Aphex Twin",
        venueName: "Field Day",
        city: "London",
        country: "UK",
        eventDate: "2023-06-03",
        genres: ["Electronic", "IDM"],
        notes: null,
        isManual: false,
        createdAt: new Date(Date.now() - 110 * 24 * 60 * 60 * 1000),
      },
      {
        id: this.showCurrentId++,
        setlistfmId: null,
        artistName: "Disclosure",
        venueName: "Coachella Valley Music and Arts Festival",
        city: "Indio",
        country: "USA",
        eventDate: "2024-04-13",
        genres: ["Electronic", "House"],
        notes: null,
        isManual: false,
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
    ];
    for (const s of seedShows) {
      this.showsMap.set(s.id, s);
    }

    // Seed show reviews for Bicep @ Alexandra Palace (show id 1)
    const seedShowReviews: ShowReview[] = [
      {
        id: this.showReviewCurrentId++,
        showId: 1,
        userId: user.id,
        rating: 5,
        content: "Absolutely transcendent. The sound at Ally Pally was perfect and Bicep played for nearly 3 hours. One of the best nights of my life.",
        createdAt: new Date(Date.now() - 85 * 24 * 60 * 60 * 1000),
      },
      {
        id: this.showReviewCurrentId++,
        showId: 1,
        userId: user.id,
        rating: 4,
        content: "Incredible show. The visuals were stunning and the setlist was flawless. Only docking one star because the queue was absurd.",
        createdAt: new Date(Date.now() - 80 * 24 * 60 * 60 * 1000),
      },
    ];
    for (const r of seedShowReviews) {
      this.showReviewsMap.set(r.id, r);
    }

    // Seed show comments for Bicep show
    const seedShowComments: ShowComment[] = [
      {
        id: this.showCommentCurrentId++,
        showId: 1,
        userId: user.id,
        content: "Does anyone know if they played Atlas during this set? I was near the back and couldn't hear perfectly.",
        upvotes: 8,
        createdAt: new Date(Date.now() - 83 * 24 * 60 * 60 * 1000),
      },
      {
        id: this.showCommentCurrentId++,
        showId: 1,
        userId: user.id,
        content: "Yes they played it second to last! The whole crowd lost it.",
        upvotes: 14,
        createdAt: new Date(Date.now() - 82 * 24 * 60 * 60 * 1000),
      },
    ];
    for (const c of seedShowComments) {
      this.showCommentsMap.set(c.id, c);
    }
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt: now,
      email: insertUser.email || null,
      displayName: insertUser.displayName || null,
      bio: insertUser.bio || null,
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

  // MusicSet operations
  async getSet(id: number): Promise<MusicSet | undefined> {
    return this.sets.get(id);
  }

  async getSetsByUser(userId: number): Promise<MusicSet[]> {
    return Array.from(this.sets.values()).filter(set => set.userId === userId);
  }

  async getAllSets(limit: number = 50): Promise<MusicSet[]> {
    const allSets = Array.from(this.sets.values());
    return allSets.slice(0, limit).sort((a, b) => {
      const aTime = a.createdAt?.getTime() || 0;
      const bTime = b.createdAt?.getTime() || 0;
      return bTime - aTime;
    });
  }

  async getFeaturedSets(limit: number = 10): Promise<MusicSet[]> {
    const featuredSets = Array.from(this.sets.values()).filter(set => set.featured);
    return featuredSets.slice(0, limit).sort((a, b) => {
      const aSaves = a.saves || 0;
      const bSaves = b.saves || 0;
      return bSaves - aSaves;
    });
  }

  async createSet(insertSet: InsertSet): Promise<MusicSet> {
    const id = this.setCurrentId++;
    const now = new Date();
    const set: MusicSet = { 
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
      city: insertSet.city || null,
      country: insertSet.country || null,
      eventDate: insertSet.eventDate || null,
      saves: 0,
      featured: false,
      verified: false,
      createdAt: now,
      updatedAt: now
    };
    this.sets.set(id, set);
    return set;
  }

  async updateSet(id: number, updates: Partial<MusicSet>): Promise<MusicSet | undefined> {
    const set = this.sets.get(id);
    if (!set) return undefined;
    const updated = { ...set, ...updates, updatedAt: new Date() };
    this.sets.set(id, updated);
    return updated;
  }

  async getArtist(id: number): Promise<Artist | undefined> {
    return this.artists.get(id);
  }
  async getArtistByName(name: string): Promise<Artist | undefined> {
    return Array.from(this.artists.values()).find(a => a.name.toLowerCase() === name.toLowerCase());
  }
  async getAllArtists(): Promise<Artist[]> {
    return Array.from(this.artists.values()).sort((a, b) => (a.ranking || 0) - (b.ranking || 0));
  }
  async getFeaturedArtists(limit: number = 10): Promise<Artist[]> {
    return Array.from(this.artists.values())
      .filter(a => a.verified)
      .slice(0, limit);
  }
  async createArtist(insertArtist: InsertArtist): Promise<Artist> {
    const id = this.artistCurrentId++;
    const artist: Artist = {
      ...insertArtist,
      id,
      createdAt: new Date(),
      realName: insertArtist.realName || null,
      firstDiscoveredIn: insertArtist.firstDiscoveredIn || null,
      firstAlbumReleaseDate: insertArtist.firstAlbumReleaseDate || null,
      sample: insertArtist.sample || null,
      story: insertArtist.story || null,
      streamingLinks: insertArtist.streamingLinks || [],
      ranking: 0,
      genres: insertArtist.genres || [],
      profilePicture: insertArtist.profilePicture || null,
      verified: insertArtist.verified || false,
    };
    this.artists.set(id, artist);
    return artist;
  }
  async updateArtist(id: number, updates: Partial<Artist>): Promise<Artist | undefined> {
    const artist = this.artists.get(id);
    if (!artist) return undefined;
    const updated = { ...artist, ...updates };
    this.artists.set(id, updated);
    return updated;
  }

  async getSong(id: number): Promise<Song | undefined> {
    return this.songs.get(id);
  }

  async getSongsByArtist(artistName: string): Promise<Song[]> {
    return Array.from(this.songs.values()).filter(song => 
      song.artist.toLowerCase().includes(artistName.toLowerCase())
    );
  }

  async getAllSongs(limit: number = 50): Promise<Song[]> {
    const songs = Array.from(this.songs.values());
    return songs.slice(0, limit);
  }

  async createSong(insertSong: InsertSong): Promise<Song> {
    const id = this.songCurrentId++;
    const now = new Date();
    const song: Song = { 
      ...insertSong, 
      id, 
      createdAt: now,
      features: insertSong.features || [],
      sample: insertSong.sample || null,
      story: insertSong.story || null,
      dialects: insertSong.dialects || [],
      streamingLinks: insertSong.streamingLinks || {},
      ranking: null,
      genre: insertSong.genre || null,
      subGenres: insertSong.subGenres || [],
      albumArt: insertSong.albumArt || null,
      releaseDate: insertSong.releaseDate || null
    };
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

  async getVenue(id: number): Promise<Venue | undefined> { return undefined; }
  async getAllVenues(limit?: number): Promise<Venue[]> { return []; }
  async createVenue(venue: InsertVenue): Promise<Venue> { throw new Error("Not implemented"); }
  async updateVenue(id: number, updates: Partial<Venue>): Promise<Venue | undefined> { return undefined; }

  async getThread(id: number): Promise<Thread | undefined> {
    return this.threads.get(id);
  }

  async getAllThreads(type?: string, limit: number = 50): Promise<Thread[]> {
    let threads = Array.from(this.threads.values());
    if (type) threads = threads.filter(t => t.threadType === type || t.type === type);
    return threads
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0))
      .slice(0, limit);
  }

  async getFeaturedThreads(limit: number = 20): Promise<Thread[]> {
    return Array.from(this.threads.values())
      .sort((a, b) => ((b.commentsCount || 0) + (b.savesCount || 0)) - ((a.commentsCount || 0) + (a.savesCount || 0)))
      .slice(0, limit);
  }

  async getEngagedThreadsByUser(userId: number): Promise<Thread[]> {
    const userComments = Array.from(this.comments.values()).filter(c => c.userId === userId);
    const commentedThreadIds = new Set(userComments.map(c => c.threadId));
    // Exclude threads the user authored — "engaged" means commented on, not created
    return Array.from(this.threads.values())
      .filter(t => t.userId !== userId && commentedThreadIds.has(t.id))
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0))
      .slice(0, 20);
  }

  async getThreadsByUser(userId: number): Promise<Thread[]> {
    return Array.from(this.threads.values()).filter(t => t.userId === userId);
  }

  async createThread(insertThread: InsertThread): Promise<Thread> {
    const id = this.threadCurrentId++;
    const thread: Thread = {
      id,
      title: insertThread.title,
      content: insertThread.content,
      userId: insertThread.userId,
      type: insertThread.type || "discussion",
      threadType: insertThread.threadType || "topic",
      songId: insertThread.songId || null,
      artistId: insertThread.artistId || null,
      setId: insertThread.setId || null,
      starRating: insertThread.starRating || null,
      status: insertThread.status || "active",
      upvotes: 0,
      savesCount: 0,
      commentsCount: 0,
      recommendationsCount: 0,
      createdAt: new Date(),
    };
    this.threads.set(id, thread);
    return thread;
  }

  async updateThread(id: number, updates: Partial<Thread>): Promise<Thread | undefined> {
    const thread = this.threads.get(id);
    if (!thread) return undefined;
    const updated = { ...thread, ...updates };
    this.threads.set(id, updated);
    return updated;
  }

  async upvoteThread(id: number): Promise<Thread | undefined> {
    const thread = this.threads.get(id);
    if (!thread) return undefined;
    const updated = { ...thread, upvotes: (thread.upvotes || 0) + 1 };
    this.threads.set(id, updated);
    return updated;
  }

  async saveThread(id: number): Promise<Thread | undefined> {
    const thread = this.threads.get(id);
    if (!thread) return undefined;
    const updated = { ...thread, savesCount: (thread.savesCount || 0) + 1 };
    this.threads.set(id, updated);
    return updated;
  }

  async getComment(id: number): Promise<Comment | undefined> {
    return this.comments.get(id);
  }

  async getCommentsByThread(threadId: number): Promise<Comment[]> {
    return Array.from(this.comments.values())
      .filter(c => c.threadId === threadId)
      .sort((a, b) => (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0));
  }

  async createComment(insertComment: InsertComment): Promise<Comment> {
    const id = this.commentCurrentId++;
    const comment: Comment = {
      id,
      threadId: insertComment.threadId,
      userId: insertComment.userId,
      content: insertComment.content,
      upvotes: 0,
      createdAt: new Date(),
    };
    this.comments.set(id, comment);
    const thread = this.threads.get(insertComment.threadId);
    if (thread) {
      this.threads.set(thread.id, { ...thread, commentsCount: (thread.commentsCount || 0) + 1 });
    }
    return comment;
  }

  async upvoteComment(id: number): Promise<Comment | undefined> {
    const comment = this.comments.get(id);
    if (!comment) return undefined;
    const updated = { ...comment, upvotes: (comment.upvotes || 0) + 1 };
    this.comments.set(id, updated);
    return updated;
  }

  async getSongRecommendation(id: number): Promise<SongRecommendation | undefined> {
    return this.songRecommendations.get(id);
  }

  async getSongRecommendationsByThread(threadId: number): Promise<SongRecommendation[]> {
    return Array.from(this.songRecommendations.values())
      .filter(r => r.threadId === threadId)
      .sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0));
  }

  async createSongRecommendation(insertRec: InsertSongRecommendation): Promise<SongRecommendation> {
    const id = this.songRecommendationCurrentId++;
    const rec: SongRecommendation = {
      id,
      threadId: insertRec.threadId,
      userId: insertRec.userId,
      songId: insertRec.songId,
      comment: insertRec.comment || null,
      upvotes: 0,
      createdAt: new Date(),
    };
    this.songRecommendations.set(id, rec);
    const thread = this.threads.get(insertRec.threadId);
    if (thread) {
      this.threads.set(thread.id, { ...thread, recommendationsCount: (thread.recommendationsCount || 0) + 1 });
    }
    return rec;
  }

  async upvoteSongRecommendation(id: number): Promise<SongRecommendation | undefined> {
    const rec = this.songRecommendations.get(id);
    if (!rec) return undefined;
    const updated = { ...rec, upvotes: (rec.upvotes || 0) + 1 };
    this.songRecommendations.set(id, updated);
    return updated;
  }

  async getTrackIdsBySet(setId: number): Promise<TrackId[]> {
    return Array.from(this.trackIdsMap.values())
      .filter(t => t.setId === setId && !t.removed)
      .sort((a, b) => (b.confirmCount || 0) - (a.confirmCount || 0));
  }

  async createTrackId(insertTrackId: InsertTrackId): Promise<TrackId> {
    const id = this.trackIdCurrentId++;
    const trackId: TrackId = {
      id,
      setId: insertTrackId.setId,
      title: insertTrackId.title,
      artist: insertTrackId.artist,
      submittedBy: insertTrackId.submittedBy,
      confirmCount: 0,
      disagreeCount: 0,
      locked: false,
      removed: false,
      createdAt: new Date(),
    };
    this.trackIdsMap.set(id, trackId);
    return trackId;
  }

  async getTrackIdVote(userId: number, trackId: number): Promise<TrackIdVote | undefined> {
    return Array.from(this.trackIdVotesMap.values()).find(
      v => v.userId === userId && v.trackId === trackId
    );
  }

  async castTrackIdVote(insertVote: InsertTrackIdVote): Promise<{ trackId: TrackId; vote: TrackIdVote }> {
    const existing = await this.getTrackIdVote(insertVote.userId, insertVote.trackId);
    if (existing) throw new Error("Already voted on this track ID");

    const trackId = this.trackIdsMap.get(insertVote.trackId);
    if (!trackId) throw new Error("Track ID not found");
    if (trackId.locked || trackId.removed) throw new Error("Track ID is locked or removed");

    const id = this.trackIdVoteCurrentId++;
    const vote: TrackIdVote = {
      id,
      userId: insertVote.userId,
      trackId: insertVote.trackId,
      voteType: insertVote.voteType,
      createdAt: new Date(),
    };
    this.trackIdVotesMap.set(id, vote);

    const newConfirmCount = (trackId.confirmCount || 0) + (insertVote.voteType === "confirm" ? 1 : 0);
    const newDisagreeCount = (trackId.disagreeCount || 0) + (insertVote.voteType === "disagree" ? 1 : 0);
    const updatedTrackId: TrackId = {
      ...trackId,
      confirmCount: newConfirmCount,
      disagreeCount: newDisagreeCount,
      locked: newConfirmCount >= 5,
      removed: newDisagreeCount >= 5,
    };
    this.trackIdsMap.set(trackId.id, updatedTrackId);

    return { trackId: updatedTrackId, vote };
  }

  // Follow operations
  async getFollowedArtists(userId: number): Promise<Artist[]> {
    const ids = this.followedArtistsMap.get(userId) ?? new Set<number>();
    return Array.from(ids)
      .map(id => this.artists.get(id))
      .filter((a): a is Artist => a !== undefined);
  }

  async followArtist(userId: number, artistId: number): Promise<void> {
    if (!this.followedArtistsMap.has(userId)) {
      this.followedArtistsMap.set(userId, new Set());
    }
    this.followedArtistsMap.get(userId)!.add(artistId);
  }

  async unfollowArtist(userId: number, artistId: number): Promise<void> {
    this.followedArtistsMap.get(userId)?.delete(artistId);
  }

  async getFollowedSongs(userId: number): Promise<Song[]> {
    const ids = this.followedSongsMap.get(userId) ?? new Set<number>();
    return Array.from(ids)
      .map(id => this.songs.get(id))
      .filter((s): s is Song => s !== undefined);
  }

  async followSong(userId: number, songId: number): Promise<void> {
    if (!this.followedSongsMap.has(userId)) {
      this.followedSongsMap.set(userId, new Set());
    }
    this.followedSongsMap.get(userId)!.add(songId);
  }

  async unfollowSong(userId: number, songId: number): Promise<void> {
    this.followedSongsMap.get(userId)?.delete(songId);
  }

  // Thread follow operations
  async getThreadFollowers(threadId: number): Promise<ThreadFollow[]> {
    return Array.from(this.threadFollowsMap.values()).filter(f => f.threadId === threadId);
  }

  async isFollowingThread(userId: number, threadId: number): Promise<boolean> {
    return Array.from(this.threadFollowsMap.values()).some(
      f => f.userId === userId && f.threadId === threadId
    );
  }

  async followThread(userId: number, threadId: number): Promise<void> {
    const already = await this.isFollowingThread(userId, threadId);
    if (already) return;
    const id = this.threadFollowCurrentId++;
    this.threadFollowsMap.set(id, {
      id,
      userId,
      threadId,
      createdAt: new Date(),
    });
  }

  async unfollowThread(userId: number, threadId: number): Promise<void> {
    for (const [id, f] of this.threadFollowsMap.entries()) {
      if (f.userId === userId && f.threadId === threadId) {
        this.threadFollowsMap.delete(id);
        return;
      }
    }
  }

  // Notification operations
  async getNotificationsByUser(userId: number): Promise<Notification[]> {
    return Array.from(this.notificationsMap.values())
      .filter(n => n.userId === userId)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async getUnreadNotificationCount(userId: number): Promise<number> {
    return Array.from(this.notificationsMap.values())
      .filter(n => n.userId === userId && !n.read).length;
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const id = this.notificationCurrentId++;
    const notification: Notification = {
      id,
      userId: insertNotification.userId,
      type: insertNotification.type,
      threadId: insertNotification.threadId,
      threadTitle: insertNotification.threadTitle,
      actorId: insertNotification.actorId,
      actorUsername: insertNotification.actorUsername,
      read: false,
      createdAt: new Date(),
    };
    this.notificationsMap.set(id, notification);
    return notification;
  }

  async markNotificationRead(id: number): Promise<void> {
    const n = this.notificationsMap.get(id);
    if (n) this.notificationsMap.set(id, { ...n, read: true });
  }

  async markAllNotificationsRead(userId: number): Promise<void> {
    for (const [id, n] of this.notificationsMap.entries()) {
      if (n.userId === userId) {
        this.notificationsMap.set(id, { ...n, read: true });
      }
    }
  }

  // Place operations
  async getPlace(id: number): Promise<Place | undefined> {
    return this.placesMap.get(id);
  }

  async getAllPlaces(limit: number = 50): Promise<Place[]> {
    return Array.from(this.placesMap.values())
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0))
      .slice(0, limit);
  }

  async searchPlaces(query: string): Promise<Place[]> {
    const q = query.toLowerCase().trim();
    if (!q) return this.getAllPlaces();
    return Array.from(this.placesMap.values()).filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.city.toLowerCase().includes(q) ||
      p.country.toLowerCase().includes(q) ||
      (p.genres ?? []).some(g => g.toLowerCase().includes(q)) ||
      p.description.toLowerCase().includes(q)
    );
  }

  async createPlace(insertPlace: InsertPlace): Promise<Place> {
    const id = this.placeCurrentId++;
    const place: Place = {
      id,
      userId: insertPlace.userId,
      name: insertPlace.name,
      city: insertPlace.city,
      country: insertPlace.country,
      category: insertPlace.category,
      genres: insertPlace.genres || [],
      description: insertPlace.description,
      mapsLink: insertPlace.mapsLink || null,
      rating: 0,
      reviewsCount: 0,
      createdAt: new Date(),
    };
    this.placesMap.set(id, place);
    return place;
  }

  async updatePlace(id: number, updates: Partial<Place>): Promise<Place | undefined> {
    const place = this.placesMap.get(id);
    if (!place) return undefined;
    const updated = { ...place, ...updates };
    this.placesMap.set(id, updated);
    return updated;
  }

  async getPlaceComments(placeId: number): Promise<PlaceComment[]> {
    return Array.from(this.placeCommentsMap.values())
      .filter(c => c.placeId === placeId)
      .sort((a, b) => (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0));
  }

  async createPlaceComment(insertComment: InsertPlaceComment): Promise<PlaceComment> {
    const id = this.placeCommentCurrentId++;
    const comment: PlaceComment = {
      id,
      placeId: insertComment.placeId,
      userId: insertComment.userId,
      content: insertComment.content,
      upvotes: 0,
      createdAt: new Date(),
    };
    this.placeCommentsMap.set(id, comment);
    const place = this.placesMap.get(insertComment.placeId);
    if (place) {
      this.placesMap.set(place.id, { ...place, reviewsCount: (place.reviewsCount || 0) + 1 });
    }
    return comment;
  }

  // Show operations
  async getShow(id: number): Promise<Show | undefined> {
    return this.showsMap.get(id);
  }

  async getShowBySetlistfmId(setlistfmId: string): Promise<Show | undefined> {
    return Array.from(this.showsMap.values()).find(s => s.setlistfmId === setlistfmId);
  }

  async getAllShows(limit: number = 50): Promise<Show[]> {
    return Array.from(this.showsMap.values())
      .sort((a, b) => b.eventDate.localeCompare(a.eventDate))
      .slice(0, limit);
  }

  async createShow(insertShow: InsertShow): Promise<Show> {
    const id = this.showCurrentId++;
    const show: Show = {
      id,
      setlistfmId: insertShow.setlistfmId ?? null,
      artistName: insertShow.artistName,
      venueName: insertShow.venueName,
      city: insertShow.city,
      country: insertShow.country,
      eventDate: insertShow.eventDate,
      genres: insertShow.genres ?? [],
      notes: insertShow.notes ?? null,
      isManual: insertShow.isManual ?? false,
      createdAt: new Date(),
    };
    this.showsMap.set(id, show);
    return show;
  }

  async getShowReviews(showId: number): Promise<ShowReview[]> {
    return Array.from(this.showReviewsMap.values())
      .filter(r => r.showId === showId)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async getUserShowReview(userId: number, showId: number): Promise<ShowReview | undefined> {
    return Array.from(this.showReviewsMap.values()).find(
      r => r.userId === userId && r.showId === showId
    );
  }

  async createShowReview(insertReview: InsertShowReview): Promise<ShowReview> {
    const id = this.showReviewCurrentId++;
    const review: ShowReview = {
      id,
      showId: insertReview.showId,
      userId: insertReview.userId,
      rating: insertReview.rating,
      content: insertReview.content,
      createdAt: new Date(),
    };
    this.showReviewsMap.set(id, review);
    return review;
  }

  async getShowComments(showId: number): Promise<ShowComment[]> {
    return Array.from(this.showCommentsMap.values())
      .filter(c => c.showId === showId)
      .sort((a, b) => {
        const voteDiff = (b.upvotes || 0) - (a.upvotes || 0);
        if (voteDiff !== 0) return voteDiff;
        return (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0);
      });
  }

  async createShowComment(insertComment: InsertShowComment): Promise<ShowComment> {
    const id = this.showCommentCurrentId++;
    const comment: ShowComment = {
      id,
      showId: insertComment.showId,
      userId: insertComment.userId,
      content: insertComment.content,
      upvotes: 0,
      createdAt: new Date(),
    };
    this.showCommentsMap.set(id, comment);
    return comment;
  }

  async upvoteShowComment(id: number): Promise<ShowComment | undefined> {
    const comment = this.showCommentsMap.get(id);
    if (!comment) return undefined;
    const updated = { ...comment, upvotes: (comment.upvotes || 0) + 1 };
    this.showCommentsMap.set(id, updated);
    return updated;
  }
}

export const storage = new MemStorage();