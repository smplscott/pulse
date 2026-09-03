import type {
  User, InsertUser,
  Artist, InsertArtist,
  Song,
  Thread, InsertThread,
  Comment, InsertComment,
  MusicSet, InsertSet,
  SongRecommendation, InsertSongRecommendation,
  TrackId, InsertTrackId,
  TrackIdVote, InsertTrackIdVote,
  Notification, InsertNotification,
  ThreadFollow,
  Place, InsertPlace,
  PlaceReview, InsertPlaceReview,
  PlaceComment, InsertPlaceComment,
  Show, InsertShow,
  ShowReview, InsertShowReview,
  ShowComment, InsertShowComment,
  UserTravelPlan, InsertUserTravelPlan,
  UserShowWishlistItem, InsertUserShowWishlistItem,
  WishlistEventMatch, InsertWishlistEventMatch,
  PlaceList, InsertPlaceList,
  PlaceListItem, InsertPlaceListItem,
} from "@shared/schema";

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

  // Thread operations
  getThread(id: number): Promise<Thread | undefined>;
  getAllThreads(type?: string, limit?: number): Promise<Thread[]>;
  getFeaturedThreads(limit?: number): Promise<Thread[]>;
  getEngagedThreadsByUser(userId: number): Promise<Thread[]>;
  getThreadsByUser(userId: number): Promise<Thread[]>;
  createThread(thread: InsertThread): Promise<Thread>;
  updateThread(id: number, updates: Partial<InsertThread>): Promise<Thread | undefined>;
  deleteThread(id: number): Promise<void>;

  // Comment operations
  getCommentsByThread(threadId: number): Promise<Comment[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  upvoteComment(id: number): Promise<Comment | undefined>;

  // MusicSet operations
  getSet(id: number): Promise<MusicSet | undefined>;
  getSetsByUser(userId: number): Promise<MusicSet[]>;
  getAllSets(limit?: number): Promise<MusicSet[]>;
  getFeaturedSets(limit?: number): Promise<MusicSet[]>;
  createSet(set: InsertSet): Promise<MusicSet>;

  // Song Recommendation operations
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

  // Thread follow operations
  getThreadFollowers(threadId: number): Promise<ThreadFollow[]>;

  // Notification operations
  getNotificationsByUser(userId: number): Promise<Notification[]>;
  getUnreadNotificationCount(userId: number): Promise<number>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationRead(id: number): Promise<void>;
  markAllNotificationsRead(userId: number): Promise<void>;

  // User IRL stat helpers
  getThreadsCountByUser(userId: number): Promise<number>;
  getShowReviewCountByUser(userId: number): Promise<number>;
  getPlacesCountByUser(userId: number): Promise<number>;
  getPlacesByUser(userId: number): Promise<Place[]>;
  getShowReviewsByUser(userId: number): Promise<(ShowReview & { show: Show })[]>;

  // Travel plan operations
  getUserTravelPlans(userId: number): Promise<UserTravelPlan[]>;
  createUserTravelPlan(plan: InsertUserTravelPlan): Promise<UserTravelPlan>;
  updateUserTravelPlan(id: number, plan: Partial<InsertUserTravelPlan>): Promise<UserTravelPlan | undefined>;
  deleteUserTravelPlan(id: number): Promise<void>;

  // Show wishlist operations
  getUserShowWishlist(userId: number): Promise<UserShowWishlistItem[]>;
  addToShowWishlist(item: InsertUserShowWishlistItem): Promise<UserShowWishlistItem>;
  removeFromShowWishlist(id: number): Promise<void>;
  removeFromShowWishlistByArtist(userId: number, artistName: string): Promise<void>;

  // Wishlist × trip matches
  getUserWishlistMatches(userId: number): Promise<WishlistEventMatch[]>;
  createWishlistEventMatch(match: InsertWishlistEventMatch): Promise<WishlistEventMatch>;

  // Place operations
  getPlace(id: number): Promise<Place | undefined>;
  getPlaceByGooglePlaceId(googlePlaceId: string): Promise<Place | undefined>;
  getPlaceByDedupeKey(dedupeKey: string): Promise<Place | undefined>;
  getAllPlaces(limit?: number): Promise<Place[]>;
  searchPlaces(query: string): Promise<Place[]>;
  createPlace(place: InsertPlace): Promise<Place>;
  getPlaceReviews(placeId: number): Promise<PlaceReview[]>;
  createPlaceReview(review: InsertPlaceReview): Promise<PlaceReview>;
  updatePlaceReview(id: number, rating: number, body?: string): Promise<PlaceReview | undefined>;
  deletePlaceReview(id: number): Promise<void>;
  getPlaceComments(placeId: number): Promise<PlaceComment[]>;
  createPlaceComment(comment: InsertPlaceComment): Promise<PlaceComment>;

  // Place list operations
  getPlaceLists(userId: number): Promise<PlaceList[]>;
  createPlaceList(list: InsertPlaceList): Promise<PlaceList>;
  deletePlaceList(id: number): Promise<void>;
  getPlaceListItems(listId: number): Promise<(PlaceListItem & { place: Place })[]>;
  addToPlaceList(item: InsertPlaceListItem): Promise<PlaceListItem>;
  removeFromPlaceList(listId: number, placeId: number): Promise<void>;
  isPlaceInAnyList(userId: number, placeId: number): Promise<{ saved: boolean; lists: PlaceList[] }>;

  // Show operations
  getShow(id: number): Promise<Show | undefined>;
  getShowBySetlistfmId(setlistfmId: string): Promise<Show | undefined>;
  getAllShows(limit?: number): Promise<Show[]>;
  createShow(show: InsertShow): Promise<Show>;
  getShowReviews(showId: number): Promise<ShowReview[]>;
  getUserShowReview(userId: number, showId: number): Promise<ShowReview | undefined>;
  createShowReview(review: InsertShowReview): Promise<ShowReview>;
  updateShowReview(id: number, rating: number, content?: string, imageUrl?: string | null): Promise<ShowReview | undefined>;
  deleteShowReview(id: number): Promise<void>;
  getShowComments(showId: number): Promise<ShowComment[]>;
  createShowComment(comment: InsertShowComment): Promise<ShowComment>;
  upvoteShowComment(id: number): Promise<ShowComment | undefined>;
}
