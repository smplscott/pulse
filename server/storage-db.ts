import { eq, and, desc, asc, sql, count } from "drizzle-orm";
import { db } from "./db";
import {
  users, artists, threads, comments, sets, songs, songRecommendations,
  trackIds, trackIdVotes, followedArtists, threadFollows, notifications,
  places, placeReviews, placeComments, placeLists, placeListItems,
  shows, showReviews, showComments, userTravelPlans, userShowWishlist, wishlistEventMatches,
} from "@shared/schema";
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
import type { IStorage } from "./storage-interface";

function isUniqueViolation(err: unknown): boolean {
  return typeof err === "object" && err !== null && (err as { code?: string }).code === "23505";
}

async function recomputePlaceRating(placeId: number, tx: typeof db = db): Promise<void> {
  const [agg] = await tx
    .select({ avg: sql<string | null>`avg(${placeReviews.rating})`, cnt: count() })
    .from(placeReviews)
    .where(eq(placeReviews.placeId, placeId));
  const avgRating = agg.avg !== null ? Math.round(Number(agg.avg)) : 0;
  await tx.update(places).set({ rating: avgRating, reviewsCount: agg.cnt }).where(eq(places.id, placeId));
}

export class DbStorage implements IStorage {
  // ─── User operations ────────────────────────────────────────────────────
  async getUser(id: number): Promise<User | undefined> {
    const [row] = await db.select().from(users).where(eq(users.id, id));
    return row;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [row] = await db.select().from(users).where(eq(users.username, username));
    return row;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [row] = await db.select().from(users).where(eq(users.email, email));
    return row;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [row] = await db.insert(users).values(insertUser).returning();
    return row;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const [row] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return row;
  }

  // ─── Artist operations ──────────────────────────────────────────────────
  async getArtist(id: number): Promise<Artist | undefined> {
    const [row] = await db.select().from(artists).where(eq(artists.id, id));
    return row;
  }

  async getArtistByName(name: string): Promise<Artist | undefined> {
    const [row] = await db.select().from(artists).where(sql`lower(${artists.name}) = ${name.toLowerCase()}`);
    return row;
  }

  async getAllArtists(): Promise<Artist[]> {
    return db.select().from(artists).orderBy(asc(artists.ranking));
  }

  async getFeaturedArtists(limit: number = 10): Promise<Artist[]> {
    return db.select().from(artists).where(eq(artists.verified, true)).limit(limit);
  }

  async createArtist(insertArtist: InsertArtist): Promise<Artist> {
    const [row] = await db.insert(artists).values(insertArtist).returning();
    return row;
  }

  async updateArtist(id: number, updates: Partial<Artist>): Promise<Artist | undefined> {
    const [row] = await db.update(artists).set(updates).where(eq(artists.id, id)).returning();
    return row;
  }

  // ─── Song operations ────────────────────────────────────────────────────
  async getSong(id: number): Promise<Song | undefined> {
    const [row] = await db.select().from(songs).where(eq(songs.id, id));
    return row;
  }

  // ─── Thread operations ──────────────────────────────────────────────────
  async getThread(id: number): Promise<Thread | undefined> {
    const [row] = await db.select().from(threads).where(eq(threads.id, id));
    return row;
  }

  async getAllThreads(type?: string, limit: number = 50): Promise<Thread[]> {
    const query = db.select().from(threads);
    if (type) {
      return query
        .where(sql`${threads.threadType} = ${type} or ${threads.type} = ${type}`)
        .orderBy(desc(threads.createdAt))
        .limit(limit);
    }
    return query.orderBy(desc(threads.createdAt)).limit(limit);
  }

  async getFeaturedThreads(limit: number = 20): Promise<Thread[]> {
    return db.select().from(threads).orderBy(desc(threads.upvotes)).limit(limit);
  }

  async getEngagedThreadsByUser(userId: number): Promise<Thread[]> {
    // Threads the user commented on but did not author themselves
    return db
      .select()
      .from(threads)
      .where(
        and(
          sql`${threads.userId} != ${userId}`,
          sql`${threads.id} in (select ${comments.threadId} from ${comments} where ${comments.userId} = ${userId})`,
        ),
      )
      .orderBy(desc(threads.createdAt))
      .limit(20);
  }

  async getThreadsByUser(userId: number): Promise<Thread[]> {
    return db.select().from(threads).where(eq(threads.userId, userId));
  }

  async createThread(insertThread: InsertThread): Promise<Thread> {
    const [row] = await db.insert(threads).values(insertThread).returning();
    return row;
  }

  // ─── Comment operations ─────────────────────────────────────────────────
  async getCommentsByThread(threadId: number): Promise<Comment[]> {
    return db.select().from(comments).where(eq(comments.threadId, threadId)).orderBy(asc(comments.createdAt));
  }

  async createComment(insertComment: InsertComment): Promise<Comment> {
    return db.transaction(async (tx) => {
      const [comment] = await tx.insert(comments).values(insertComment).returning();
      await tx
        .update(threads)
        .set({ commentsCount: sql`${threads.commentsCount} + 1` })
        .where(eq(threads.id, insertComment.threadId));
      return comment;
    });
  }

  async upvoteComment(id: number): Promise<Comment | undefined> {
    const [row] = await db
      .update(comments)
      .set({ upvotes: sql`${comments.upvotes} + 1` })
      .where(eq(comments.id, id))
      .returning();
    return row;
  }

  // ─── MusicSet operations ────────────────────────────────────────────────
  async getSet(id: number): Promise<MusicSet | undefined> {
    const [row] = await db.select().from(sets).where(eq(sets.id, id));
    return row;
  }

  async getSetsByUser(userId: number): Promise<MusicSet[]> {
    return db.select().from(sets).where(eq(sets.userId, userId));
  }

  async getAllSets(limit: number = 50): Promise<MusicSet[]> {
    return db.select().from(sets).orderBy(desc(sets.createdAt)).limit(limit);
  }

  async getFeaturedSets(limit: number = 10): Promise<MusicSet[]> {
    return db.select().from(sets).where(eq(sets.featured, true)).orderBy(desc(sets.saves)).limit(limit);
  }

  async createSet(insertSet: InsertSet): Promise<MusicSet> {
    const [row] = await db.insert(sets).values(insertSet).returning();
    return row;
  }

  // ─── Song Recommendation operations ─────────────────────────────────────
  async getSongRecommendationsByThread(threadId: number): Promise<SongRecommendation[]> {
    return db
      .select()
      .from(songRecommendations)
      .where(eq(songRecommendations.threadId, threadId))
      .orderBy(desc(songRecommendations.upvotes));
  }

  async createSongRecommendation(insertRec: InsertSongRecommendation): Promise<SongRecommendation> {
    return db.transaction(async (tx) => {
      const [rec] = await tx.insert(songRecommendations).values(insertRec).returning();
      await tx
        .update(threads)
        .set({ recommendationsCount: sql`${threads.recommendationsCount} + 1` })
        .where(eq(threads.id, insertRec.threadId));
      return rec;
    });
  }

  async upvoteSongRecommendation(id: number): Promise<SongRecommendation | undefined> {
    const [row] = await db
      .update(songRecommendations)
      .set({ upvotes: sql`${songRecommendations.upvotes} + 1` })
      .where(eq(songRecommendations.id, id))
      .returning();
    return row;
  }

  // ─── TrackId operations ─────────────────────────────────────────────────
  async getTrackIdsBySet(setId: number): Promise<TrackId[]> {
    return db
      .select()
      .from(trackIds)
      .where(and(eq(trackIds.setId, setId), eq(trackIds.removed, false)))
      .orderBy(desc(trackIds.confirmCount));
  }

  async createTrackId(insertTrackId: InsertTrackId): Promise<TrackId> {
    const [row] = await db.insert(trackIds).values(insertTrackId).returning();
    return row;
  }

  async getTrackIdVote(userId: number, trackId: number): Promise<TrackIdVote | undefined> {
    const [row] = await db
      .select()
      .from(trackIdVotes)
      .where(and(eq(trackIdVotes.userId, userId), eq(trackIdVotes.trackId, trackId)));
    return row;
  }

  async castTrackIdVote(insertVote: InsertTrackIdVote): Promise<{ trackId: TrackId; vote: TrackIdVote }> {
    return db.transaction(async (tx) => {
      const [track] = await tx.select().from(trackIds).where(eq(trackIds.id, insertVote.trackId));
      if (!track) throw new Error("Track ID not found");
      if (track.locked || track.removed) throw new Error("Track ID is locked or removed");

      let vote: TrackIdVote;
      try {
        [vote] = await tx.insert(trackIdVotes).values(insertVote).returning();
      } catch (err) {
        if (isUniqueViolation(err)) throw new Error("Already voted on this track ID");
        throw err;
      }

      const confirmInc = insertVote.voteType === "confirm" ? 1 : 0;
      const disagreeInc = insertVote.voteType === "disagree" ? 1 : 0;
      const [updatedTrack] = await tx
        .update(trackIds)
        .set({
          confirmCount: sql`${trackIds.confirmCount} + ${confirmInc}`,
          disagreeCount: sql`${trackIds.disagreeCount} + ${disagreeInc}`,
          locked: sql`(${trackIds.confirmCount} + ${confirmInc}) >= 5`,
          removed: sql`(${trackIds.disagreeCount} + ${disagreeInc}) >= 5`,
        })
        .where(eq(trackIds.id, insertVote.trackId))
        .returning();

      return { trackId: updatedTrack, vote };
    });
  }

  // ─── Follow operations ──────────────────────────────────────────────────
  async getFollowedArtists(userId: number): Promise<Artist[]> {
    const rows = await db
      .select({ artist: artists })
      .from(followedArtists)
      .innerJoin(artists, eq(followedArtists.artistId, artists.id))
      .where(eq(followedArtists.userId, userId));
    return rows.map((r) => r.artist);
  }

  async followArtist(userId: number, artistId: number): Promise<void> {
    await db
      .insert(followedArtists)
      .values({ userId, artistId })
      .onConflictDoNothing({ target: [followedArtists.userId, followedArtists.artistId] });
  }

  async unfollowArtist(userId: number, artistId: number): Promise<void> {
    await db
      .delete(followedArtists)
      .where(and(eq(followedArtists.userId, userId), eq(followedArtists.artistId, artistId)));
  }

  // ─── Thread follow operations ───────────────────────────────────────────
  async getThreadFollowers(threadId: number): Promise<ThreadFollow[]> {
    return db.select().from(threadFollows).where(eq(threadFollows.threadId, threadId));
  }

  // ─── Notification operations ────────────────────────────────────────────
  async getNotificationsByUser(userId: number): Promise<Notification[]> {
    return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
  }

  async getUnreadNotificationCount(userId: number): Promise<number> {
    const [row] = await db
      .select({ cnt: count() })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.read, false)));
    return row.cnt;
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const [row] = await db.insert(notifications).values(insertNotification).returning();
    return row;
  }

  async markNotificationRead(id: number): Promise<void> {
    await db.update(notifications).set({ read: true }).where(eq(notifications.id, id));
  }

  async markAllNotificationsRead(userId: number): Promise<void> {
    await db.update(notifications).set({ read: true }).where(eq(notifications.userId, userId));
  }

  // ─── User IRL stat helpers ──────────────────────────────────────────────
  async getThreadsCountByUser(userId: number): Promise<number> {
    const result = await db.execute<{ cnt: string | number }>(sql`
      select count(*)::int as cnt from (
        select id from ${threads} where user_id = ${userId}
        union
        select thread_id from ${comments} where user_id = ${userId}
      ) as ids
    `);
    return Number((result.rows[0] as { cnt: string | number }).cnt);
  }

  async getShowReviewCountByUser(userId: number): Promise<number> {
    const [row] = await db.select({ cnt: count() }).from(showReviews).where(eq(showReviews.userId, userId));
    return row.cnt;
  }

  async getPlacesCountByUser(userId: number): Promise<number> {
    const [row] = await db.select({ cnt: count() }).from(places).where(eq(places.userId, userId));
    return row.cnt;
  }

  async getPlacesByUser(userId: number): Promise<Place[]> {
    return db.select().from(places).where(eq(places.userId, userId)).orderBy(desc(places.createdAt));
  }

  async getShowReviewsByUser(userId: number): Promise<(ShowReview & { show: Show })[]> {
    const rows = await db
      .select({ review: showReviews, show: shows })
      .from(showReviews)
      .innerJoin(shows, eq(showReviews.showId, shows.id))
      .where(eq(showReviews.userId, userId))
      .orderBy(desc(showReviews.createdAt));
    return rows.map((r) => ({ ...r.review, show: r.show }));
  }

  // ─── Travel plan operations ─────────────────────────────────────────────
  async getUserTravelPlans(userId: number): Promise<UserTravelPlan[]> {
    return db.select().from(userTravelPlans).where(eq(userTravelPlans.userId, userId)).orderBy(desc(userTravelPlans.createdAt));
  }

  async createUserTravelPlan(plan: InsertUserTravelPlan): Promise<UserTravelPlan> {
    const [row] = await db.insert(userTravelPlans).values(plan).returning();
    return row;
  }

  async updateUserTravelPlan(id: number, plan: Partial<InsertUserTravelPlan>): Promise<UserTravelPlan | undefined> {
    const [row] = await db
      .update(userTravelPlans)
      .set(plan)
      .where(eq(userTravelPlans.id, id))
      .returning();
    return row;
  }

  async deleteUserTravelPlan(id: number): Promise<void> {
    await db.delete(userTravelPlans).where(eq(userTravelPlans.id, id));
  }

  // ─── Show wishlist operations ───────────────────────────────────────────
  async getUserShowWishlist(userId: number): Promise<UserShowWishlistItem[]> {
    return db.select().from(userShowWishlist).where(eq(userShowWishlist.userId, userId)).orderBy(desc(userShowWishlist.createdAt));
  }

  async addToShowWishlist(item: InsertUserShowWishlistItem): Promise<UserShowWishlistItem> {
    const existing = await db
      .select()
      .from(userShowWishlist)
      .where(
        and(
          eq(userShowWishlist.userId, item.userId),
          sql`lower(${userShowWishlist.artistName}) = ${item.artistName.toLowerCase()}`,
        ),
      )
      .limit(1);
    if (existing[0]) return existing[0];
    const [row] = await db.insert(userShowWishlist).values(item).returning();
    return row;
  }

  async removeFromShowWishlist(id: number): Promise<void> {
    await db.delete(userShowWishlist).where(eq(userShowWishlist.id, id));
  }

  async removeFromShowWishlistByArtist(userId: number, artistName: string): Promise<void> {
    await db
      .delete(userShowWishlist)
      .where(and(eq(userShowWishlist.userId, userId), sql`lower(${userShowWishlist.artistName}) = ${artistName.toLowerCase()}`));
  }

  async getUserWishlistMatches(userId: number): Promise<WishlistEventMatch[]> {
    return db
      .select()
      .from(wishlistEventMatches)
      .where(eq(wishlistEventMatches.userId, userId))
      .orderBy(asc(wishlistEventMatches.eventStartAt));
  }

  async createWishlistEventMatch(match: InsertWishlistEventMatch): Promise<WishlistEventMatch> {
    const [row] = await db.insert(wishlistEventMatches).values(match).returning();
    return row;
  }

  // ─── Place operations ───────────────────────────────────────────────────
  async getPlace(id: number): Promise<Place | undefined> {
    const [row] = await db.select().from(places).where(eq(places.id, id));
    return row;
  }

  async getAllPlaces(limit: number = 50): Promise<Place[]> {
    return db.select().from(places).orderBy(desc(places.createdAt)).limit(limit);
  }

  async searchPlaces(query: string): Promise<Place[]> {
    const q = query.toLowerCase().trim();
    if (!q) return this.getAllPlaces();
    const like = `%${q}%`;
    return db
      .select()
      .from(places)
      .where(
        sql`lower(${places.name}) like ${like}
          or lower(${places.city}) like ${like}
          or lower(${places.country}) like ${like}
          or lower(${places.description}) like ${like}
          or exists (select 1 from unnest(${places.genres}) g where lower(g) like ${like})`,
      );
  }

  async createPlace(insertPlace: InsertPlace): Promise<Place> {
    const [row] = await db.insert(places).values(insertPlace).returning();
    return row;
  }

  async getPlaceReviews(placeId: number): Promise<PlaceReview[]> {
    return db.select().from(placeReviews).where(eq(placeReviews.placeId, placeId)).orderBy(desc(placeReviews.createdAt));
  }

  async createPlaceReview(insertReview: InsertPlaceReview): Promise<PlaceReview> {
    return db.transaction(async (tx) => {
      const [review] = await tx
        .insert(placeReviews)
        .values(insertReview)
        .onConflictDoUpdate({
          target: [placeReviews.userId, placeReviews.placeId],
          set: { rating: insertReview.rating, body: insertReview.body ?? null },
        })
        .returning();
      await recomputePlaceRating(insertReview.placeId, tx as unknown as typeof db);
      return review;
    });
  }

  async updatePlaceReview(id: number, rating: number, body?: string): Promise<PlaceReview | undefined> {
    return db.transaction(async (tx) => {
      const updates: Partial<PlaceReview> = { rating };
      if (body !== undefined) updates.body = body;
      const [row] = await tx.update(placeReviews).set(updates).where(eq(placeReviews.id, id)).returning();
      if (!row) return undefined;
      await recomputePlaceRating(row.placeId, tx as unknown as typeof db);
      return row;
    });
  }

  async deletePlaceReview(id: number): Promise<void> {
    await db.transaction(async (tx) => {
      const [deleted] = await tx.delete(placeReviews).where(eq(placeReviews.id, id)).returning();
      if (deleted) await recomputePlaceRating(deleted.placeId, tx as unknown as typeof db);
    });
  }

  async getPlaceComments(placeId: number): Promise<PlaceComment[]> {
    return db.select().from(placeComments).where(eq(placeComments.placeId, placeId)).orderBy(asc(placeComments.createdAt));
  }

  async createPlaceComment(insertComment: InsertPlaceComment): Promise<PlaceComment> {
    return db.transaction(async (tx) => {
      const [comment] = await tx.insert(placeComments).values(insertComment).returning();
      await tx
        .update(places)
        .set({ reviewsCount: sql`${places.reviewsCount} + 1` })
        .where(eq(places.id, insertComment.placeId));
      return comment;
    });
  }

  // ─── Place list operations ──────────────────────────────────────────────
  async getPlaceLists(userId: number): Promise<PlaceList[]> {
    return db.select().from(placeLists).where(eq(placeLists.userId, userId)).orderBy(desc(placeLists.createdAt));
  }

  async createPlaceList(list: InsertPlaceList): Promise<PlaceList> {
    const [row] = await db.insert(placeLists).values(list).returning();
    return row;
  }

  async deletePlaceList(id: number): Promise<void> {
    await db.transaction(async (tx) => {
      await tx.delete(placeListItems).where(eq(placeListItems.listId, id));
      await tx.delete(placeLists).where(eq(placeLists.id, id));
    });
  }

  async getPlaceListItems(listId: number): Promise<(PlaceListItem & { place: Place })[]> {
    const rows = await db
      .select({ item: placeListItems, place: places })
      .from(placeListItems)
      .innerJoin(places, eq(placeListItems.placeId, places.id))
      .where(eq(placeListItems.listId, listId))
      .orderBy(desc(placeListItems.createdAt));
    return rows.map((r) => ({ ...r.item, place: r.place }));
  }

  async addToPlaceList(item: InsertPlaceListItem): Promise<PlaceListItem> {
    const [inserted] = await db
      .insert(placeListItems)
      .values(item)
      .onConflictDoNothing({ target: [placeListItems.listId, placeListItems.placeId] })
      .returning();
    if (inserted) return inserted;
    const [existing] = await db
      .select()
      .from(placeListItems)
      .where(and(eq(placeListItems.listId, item.listId), eq(placeListItems.placeId, item.placeId)));
    return existing;
  }

  async removeFromPlaceList(listId: number, placeId: number): Promise<void> {
    await db.delete(placeListItems).where(and(eq(placeListItems.listId, listId), eq(placeListItems.placeId, placeId)));
  }

  async isPlaceInAnyList(userId: number, placeId: number): Promise<{ saved: boolean; lists: PlaceList[] }> {
    const rows = await db
      .select({ list: placeLists })
      .from(placeLists)
      .innerJoin(placeListItems, eq(placeListItems.listId, placeLists.id))
      .where(and(eq(placeLists.userId, userId), eq(placeListItems.placeId, placeId)));
    const lists = rows.map((r) => r.list);
    return { saved: lists.length > 0, lists };
  }

  // ─── Show operations ────────────────────────────────────────────────────
  async getShow(id: number): Promise<Show | undefined> {
    const [row] = await db.select().from(shows).where(eq(shows.id, id));
    return row;
  }

  async getShowBySetlistfmId(setlistfmId: string): Promise<Show | undefined> {
    const [row] = await db.select().from(shows).where(eq(shows.setlistfmId, setlistfmId));
    return row;
  }

  async getAllShows(limit: number = 50): Promise<Show[]> {
    return db.select().from(shows).orderBy(desc(shows.eventDate)).limit(limit);
  }

  async createShow(insertShow: InsertShow): Promise<Show> {
    const [row] = await db.insert(shows).values(insertShow).returning();
    return row;
  }

  async getShowReviews(showId: number): Promise<ShowReview[]> {
    return db.select().from(showReviews).where(eq(showReviews.showId, showId)).orderBy(desc(showReviews.createdAt));
  }

  async getUserShowReview(userId: number, showId: number): Promise<ShowReview | undefined> {
    const [row] = await db
      .select()
      .from(showReviews)
      .where(and(eq(showReviews.userId, userId), eq(showReviews.showId, showId)));
    return row;
  }

  async createShowReview(insertReview: InsertShowReview): Promise<ShowReview> {
    const [row] = await db.insert(showReviews).values(insertReview).returning();
    return row;
  }

  async updateShowReview(
    id: number,
    rating: number,
    content?: string,
    imageUrl?: string | null,
  ): Promise<ShowReview | undefined> {
    const updates: Partial<ShowReview> = { rating };
    if (content !== undefined) updates.content = content;
    if (imageUrl !== undefined) updates.imageUrl = imageUrl;
    const [row] = await db.update(showReviews).set(updates).where(eq(showReviews.id, id)).returning();
    return row;
  }

  async deleteShowReview(id: number): Promise<void> {
    await db.delete(showReviews).where(eq(showReviews.id, id));
  }

  async getShowComments(showId: number): Promise<ShowComment[]> {
    return db
      .select()
      .from(showComments)
      .where(eq(showComments.showId, showId))
      .orderBy(desc(showComments.upvotes), desc(showComments.createdAt));
  }

  async createShowComment(insertComment: InsertShowComment): Promise<ShowComment> {
    const [row] = await db.insert(showComments).values(insertComment).returning();
    return row;
  }

  async upvoteShowComment(id: number): Promise<ShowComment | undefined> {
    const [row] = await db
      .update(showComments)
      .set({ upvotes: sql`${showComments.upvotes} + 1` })
      .where(eq(showComments.id, id))
      .returning();
    return row;
  }
}

export const storage = new DbStorage();
