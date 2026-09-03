import "dotenv/config";
import { and, eq, gte, isNotNull } from "drizzle-orm";
import { db } from "../db";
import {
  notifications,
  userShowWishlist,
  userTravelPlans,
  users,
  wishlistEventMatches,
} from "@shared/schema";
import {
  eventMatchesArtist,
  searchEvents,
  tmSleep,
  type TicketmasterEvent,
} from "../ticketmaster";

export interface ScanResult {
  usersScanned: number;
  queries: number;
  matchesCreated: number;
  notificationsCreated: number;
  errors: string[];
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Monthly (or on-demand) job: for each user with wishlist + upcoming travel plans,
 * query Ticketmaster and upsert matches + notifications. Searches every wishlist
 * artist against every trip (all artists × all trips).
 */
export async function scanWishlistMatches(options: { userId?: number } = {}): Promise<ScanResult> {
  const result: ScanResult = {
    usersScanned: 0,
    queries: 0,
    matchesCreated: 0,
    notificationsCreated: 0,
    errors: [],
  };

  if (!process.env.TICKETMASTER_API_KEY) {
    result.errors.push("TICKETMASTER_API_KEY is not configured");
    return result;
  }

  const today = todayIso();

  const conditions = [
    isNotNull(userTravelPlans.startDate),
    isNotNull(userTravelPlans.endDate),
    gte(userTravelPlans.endDate, today),
  ];
  if (options.userId) {
    conditions.push(eq(userTravelPlans.userId, options.userId));
  }

  // Users who have at least one upcoming travel plan with dates
  const plans = await db
    .select()
    .from(userTravelPlans)
    .where(and(...conditions));

  const plansByUser = new Map<number, typeof plans>();
  for (const p of plans) {
    const list = plansByUser.get(p.userId) ?? [];
    list.push(p);
    plansByUser.set(p.userId, list);
  }

  // Cache identical Ticketmaster queries within this run
  const queryCache = new Map<string, TicketmasterEvent[]>();

  for (const [userId, userPlans] of plansByUser) {
    const wishlist = await db
      .select()
      .from(userShowWishlist)
      .where(eq(userShowWishlist.userId, userId));
    if (wishlist.length === 0) continue;

    result.usersScanned += 1;

    for (const plan of userPlans) {
      if (!plan.startDate || !plan.endDate) continue;
      // Clamp start to today so we don't fetch past events in a long window
      const startDate = plan.startDate < today ? today : plan.startDate;
      if (startDate > plan.endDate) continue;

      for (const item of wishlist) {
        const cacheKey = [
          item.artistName.toLowerCase(),
          plan.city.toLowerCase(),
          (plan.countryCode ?? plan.country ?? "").toLowerCase(),
          startDate,
          plan.endDate,
        ].join("|");

        let events = queryCache.get(cacheKey);
        if (!events) {
          try {
            result.queries += 1;
            events = await searchEvents({
              keyword: item.artistName,
              city: plan.city,
              country: plan.country,
              countryCode: plan.countryCode ?? undefined,
              startDate,
              endDate: plan.endDate,
            });
            queryCache.set(cacheKey, events);
            // Stay under ~5 req/s
            await tmSleep(220);
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            result.errors.push(`user ${userId} / ${item.artistName}: ${msg}`);
            events = [];
            queryCache.set(cacheKey, events);
          }
        }

        const hits = events.filter(
          (e) => e.isMusic && eventMatchesArtist(e, item.artistName),
        );

        for (const event of hits) {
          try {
            const [existing] = await db
              .select()
              .from(wishlistEventMatches)
              .where(
                and(
                  eq(wishlistEventMatches.userId, userId),
                  eq(wishlistEventMatches.ticketmasterEventId, event.id),
                ),
              )
              .limit(1);

            if (existing) continue;

            const [created] = await db
              .insert(wishlistEventMatches)
              .values({
                userId,
                travelPlanId: plan.id,
                wishlistItemId: item.id,
                artistName: item.artistName,
                eventName: event.name,
                venueName: event.venueName ?? null,
                city: event.city ?? plan.city,
                country: event.country ?? plan.country,
                eventStartAt: event.startDateTime ?? null,
                ticketmasterEventId: event.id,
                ticketUrl: event.url ?? null,
                imageUrl: event.imageUrl ?? null,
                notifiedAt: new Date(),
              })
              .returning();

            result.matchesCreated += 1;

            // System notification (actor = self / Pulse)
            const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
            await db.insert(notifications).values({
              userId,
              type: "wishlist_match",
              threadId: null,
              threadTitle: `${item.artistName} — ${event.name}`,
              actorId: userId,
              actorUsername: user?.username ?? "pulse",
              matchId: created.id,
            });
            result.notificationsCreated += 1;
          } catch (err) {
            // Unique violation = race; ignore
            const code = typeof err === "object" && err && "code" in err ? (err as { code?: string }).code : undefined;
            if (code !== "23505") {
              const msg = err instanceof Error ? err.message : String(err);
              result.errors.push(`insert ${event.id}: ${msg}`);
            }
          }
        }
      }
    }
  }

  console.log("[scanWishlistMatches]", JSON.stringify(result));
  return result;
}
