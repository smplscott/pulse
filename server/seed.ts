import "dotenv/config";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { eq } from "drizzle-orm";
import { db, pool } from "./db";
import {
  users, artists, sets, songs, threads, trackIds, followedArtists, threadFollows,
  notifications, places, placeComments, placeReviews, shows, showReviews, showComments,
  userShowWishlist, userTravelPlans,
} from "@shared/schema";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

function hoursAgo(n: number): Date {
  return new Date(Date.now() - n * 60 * 60 * 1000);
}

async function seed() {
  const [existing] = await db.select().from(users).limit(1);
  if (existing) {
    console.log("Database already has data — skipping seed.");
    await pool.end();
    return;
  }

  const isProd = process.env.NODE_ENV === "production";

  const [devUser] = await db.insert(users).values({
    username: "dev",
    email: "dev@pulse.local",
    password: await hashPassword(isProd ? randomBytes(32).toString("hex") : "dev"),
    displayName: "Dev User",
    bio: "Development account.",
  }).returning();

  const [user] = await db.insert(users).values({
    username: "testuser",
    email: "test@pulse.fm",
    password: await hashPassword(isProd ? randomBytes(32).toString("hex") : "testpass123"),
    displayName: "Test User",
    bio: "Music lover and avid listener.",
    city: "East London",
  }).returning();

  const [set1, set2, set3] = await Promise.all([
    db.insert(sets).values({
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
      city: "Berlin",
      country: "Germany",
      eventDate: "2024-03-15",
    }).returning().then(([r]) => r),
    db.insert(sets).values({
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
      city: "Amsterdam",
      country: "Netherlands",
      eventDate: "2024-02-10",
    }).returning().then(([r]) => r),
    db.insert(sets).values({
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
      city: "London",
      country: "UK",
      eventDate: "2024-01-20",
    }).returning().then(([r]) => r),
  ]);
  // saves/featured/verified aren't part of insertSetSchema's picked fields — set them explicitly to match seed intent
  await Promise.all([
    db.update(sets).set({ saves: 1200, featured: true, verified: false }).where(eq(sets.id, set1.id)),
    db.update(sets).set({ saves: 856, featured: false, verified: true }).where(eq(sets.id, set2.id)),
    db.update(sets).set({ saves: 742, featured: false, verified: false }).where(eq(sets.id, set3.id)),
  ]);

  const [song1, song2, song3, song4] = await Promise.all([
    db.insert(songs).values({
      title: "Break on Through (To the Other Side)", artist: "The Doors",
      albumArt: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300",
      albumName: "The Doors", genre: "Rock", subGenres: ["Psychedelic Rock", "Classic Rock"],
      releaseDate: new Date("1967-01-04"), features: ["Jim Morrison", "Robby Krieger", "Ray Manzarek", "John Densmore"],
      story: "The opening track from The Doors' debut album, featuring Morrison's iconic vocals and Krieger's innovative guitar work.",
      streamingLinks: { spotify: "https://open.spotify.com/track/example1" },
    }).returning().then(([r]) => r),
    db.insert(songs).values({
      title: "Riders on the Storm", artist: "The Doors",
      albumArt: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300",
      albumName: "L.A. Woman", genre: "Rock", subGenres: ["Psychedelic Rock", "Jazz Rock"],
      releaseDate: new Date("1971-04-19"), features: ["Jim Morrison", "Robby Krieger", "Ray Manzarek", "John Densmore"],
      story: "The last song recorded with Jim Morrison, featuring storm sound effects and jazz influences.",
      streamingLinks: { spotify: "https://open.spotify.com/track/example2" },
    }).returning().then(([r]) => r),
    db.insert(songs).values({
      title: "Light My Fire", artist: "The Doors",
      albumArt: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300",
      albumName: "The Doors", genre: "Rock", subGenres: ["Psychedelic Rock", "Classic Rock"],
      releaseDate: new Date("1967-04-24"), features: ["Jim Morrison", "Robby Krieger", "Ray Manzarek", "John Densmore"],
      story: "Written by Robby Krieger, this became The Doors' biggest hit and signature song.",
      streamingLinks: { spotify: "https://open.spotify.com/track/example3" },
    }).returning().then(([r]) => r),
    db.insert(songs).values({
      title: "Blinding Lights", artist: "The Weeknd",
      albumArt: "https://images.unsplash.com/photo-1571974599782-87624638275c?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300",
      albumName: "After Hours", genre: "Pop", subGenres: ["Synthpop", "Electropop"],
      releaseDate: new Date("2019-11-29"), features: ["The Weeknd", "Max Martin", "Oscar Holter"],
      story: "A synth-heavy track that dominated charts worldwide and became one of the biggest hits of 2020.",
      streamingLinks: { spotify: "https://open.spotify.com/track/example4" },
    }).returning().then(([r]) => r),
  ]);

  await db.insert(threads).values([
    {
      title: "Most Innovative Electronic Artists of 2025",
      content: "Who do you think is pushing the boundaries of electronic music this year? I've been amazed by how producers are blending organic instrumentation with digital production.",
      userId: user.id, threadType: "topic", status: "active",
      upvotes: 48, savesCount: 34, commentsCount: 243, recommendationsCount: 12, createdAt: hoursAgo(4),
    },
    {
      title: "Techno DJs That Define Berlin's Sound",
      content: "Berlin's techno scene has always been unparalleled. Let's discuss the artists who have shaped and continue to define that raw, industrial sound.",
      userId: user.id, threadType: "topic", status: "active",
      upvotes: 62, savesCount: 29, commentsCount: 192, recommendationsCount: 8, createdAt: hoursAgo(8),
    },
    {
      title: "This track has been on repeat for 3 days straight",
      content: "Riders on the Storm just hits different at 3am. The rain sounds, the keys — pure atmosphere.",
      userId: user.id, threadType: "listening_now", songId: song2.id, status: "active",
      upvotes: 31, savesCount: 19, commentsCount: 45, recommendationsCount: 3, createdAt: hoursAgo(2),
    },
    {
      title: "Incredible live set — best show I've been to in years",
      content: "The energy was unreal. Every transition was perfectly executed and the crowd was fully locked in from start to finish.",
      userId: user.id, threadType: "live_show_review", starRating: 5, status: "active",
      upvotes: 77, savesCount: 41, commentsCount: 122, recommendationsCount: 0, createdAt: hoursAgo(12),
    },
    {
      title: "New Discoveries Worth Sharing — July 2025",
      content: "Drop your best new finds below! I've been deep in the rabbit hole this month and found some absolute gems.",
      userId: user.id, threadType: "new_music", status: "active",
      upvotes: 55, savesCount: 67, commentsCount: 156, recommendationsCount: 31, createdAt: hoursAgo(6),
    },
    {
      title: "Blinding Lights is still unmatched for that 80s synth feel",
      content: "Years later and this track still sounds fresh. The production on this is a masterclass.",
      userId: user.id, threadType: "listening_now", songId: song4.id, status: "active",
      upvotes: 23, savesCount: 15, commentsCount: 67, recommendationsCount: 5, createdAt: hoursAgo(18),
    },
  ]);

  const [artist1, artist2, artist3] = await Promise.all([
    db.insert(artists).values({
      name: "The Doors", realName: "Jim Morrison, Ray Manzarek, Robby Krieger, John Densmore",
      firstDiscoveredIn: "US", firstAlbumReleaseDate: new Date("1967-01-04"),
      story: "The Doors were an American rock band formed in Los Angeles in 1965. The band consisted of vocalist Jim Morrison, keyboardist Ray Manzarek, guitarist Robby Krieger, and drummer John Densmore. They are one of the most controversial and influential rock acts of the 1960s.",
      streamingLinks: [{ platform: "Spotify", url: "https://open.spotify.com/artist/22WZ7M66p7UkEBnCXHBf0F" }],
      genres: ["Rock", "Psychedelic Rock", "Classic Rock"],
      profilePicture: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300",
      verified: true,
    }).returning().then(([r]) => r),
    db.insert(artists).values({
      name: "The Weeknd", realName: "Abel Makkonen Tesfaye",
      firstDiscoveredIn: "CA", firstAlbumReleaseDate: new Date("2013-05-28"),
      story: "Abel Makkonen Tesfaye, known professionally as the Weeknd, is a Canadian singer, songwriter, and record producer. He is known for his sonic versatility and dark lyricism, with his music drawing from R&B, pop, synth-pop, and alternative R&B.",
      streamingLinks: [{ platform: "Spotify", url: "https://open.spotify.com/artist/1Xyo4u8uXC1ZmMpatF05PJ" }],
      genres: ["Pop", "R&B", "Synth-pop"],
      profilePicture: "https://images.unsplash.com/photo-1571974599782-87624638275c?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300",
      verified: true,
    }).returning().then(([r]) => r),
    db.insert(artists).values({
      name: "Bicep", realName: "Matt McBriar & Andy Ferguson",
      firstDiscoveredIn: "GB", firstAlbumReleaseDate: new Date("2017-09-01"),
      story: "Bicep is a Northern Irish electronic music duo consisting of Matt McBriar and Andy Ferguson. Based in London, they rose to fame through their blog 'Feel My Bicep' before pursuing music production. Known for their emotive take on house and electronic music.",
      streamingLinks: [{ platform: "Spotify", url: "https://open.spotify.com/artist/73A3bLnfnz5LoQCtml5zrN" }],
      genres: ["Electronic", "House", "Techno"],
      profilePicture: "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300",
      verified: true,
    }).returning().then(([r]) => r),
  ]);
  // ranking + spotifyId aren't part of insertArtistSchema's picked fields
  await Promise.all([
    db.update(artists).set({ ranking: 1, spotifyId: "22WZ7M66p7UkEBnCXHBf0F" }).where(eq(artists.id, artist1.id)),
    db.update(artists).set({ ranking: 2, spotifyId: "1Xyo4u8uXC1ZmMpatF05PJ" }).where(eq(artists.id, artist2.id)),
    db.update(artists).set({ ranking: 3, spotifyId: "73A3bLnfnz5LoQCtml5zrN" }).where(eq(artists.id, artist3.id)),
  ]);

  await db.insert(trackIds).values([
    { setId: set1.id, title: "Pangaea", artist: "Bicep", submittedBy: user.id, confirmCount: 5, disagreeCount: 0, locked: true, createdAt: daysAgo(3) },
    { setId: set1.id, title: "See Me Now (Original Mix)", artist: "Kerri Chandler", submittedBy: user.id, confirmCount: 3, disagreeCount: 1, createdAt: daysAgo(2) },
    { setId: set1.id, title: "Mystery of Love", artist: "Larry Heard", submittedBy: user.id, confirmCount: 1, disagreeCount: 2, createdAt: daysAgo(1) },
    { setId: set2.id, title: "Offshore", artist: "Bicep", submittedBy: user.id, confirmCount: 4, disagreeCount: 0, createdAt: daysAgo(5) },
  ]);

  await db.insert(followedArtists).values([
    { userId: user.id, artistId: artist1.id },
    { userId: user.id, artistId: artist2.id },
    { userId: user.id, artistId: artist3.id },
  ]);

  await db.insert(threadFollows).values([
    { userId: user.id, threadId: 1, createdAt: daysAgo(5) },
    { userId: user.id, threadId: 2, createdAt: daysAgo(3) },
    { userId: user.id, threadId: 3, createdAt: daysAgo(1) },
  ]);

  await db.insert(notifications).values([
    { userId: user.id, type: "comment", threadId: 1, threadTitle: "The Doors — legacy and impact on modern rock", actorId: user.id, actorUsername: "musicfan42", read: false, createdAt: new Date(Date.now() - 30 * 60 * 1000) },
    { userId: user.id, type: "save", threadId: 2, threadTitle: "Bicep live set thoughts", actorId: user.id, actorUsername: "deeplistener", read: false, createdAt: hoursAgo(2) },
    { userId: user.id, type: "comment", threadId: 3, threadTitle: "Best electronic albums of 2024", actorId: user.id, actorUsername: "rave_historian", read: true, createdAt: hoursAgo(12) },
  ]);

  const [p1, p2, p3, p4, p5] = await db.insert(places).values([
    { userId: user.id, name: "Fabric", city: "London", country: "UK", category: "club", genres: ["Techno", "House", "Drum & Bass"], description: "World-renowned nightclub in Farringdon known for its legendary lineups and unbeatable sound system. A pilgrimage site for electronic music fans.", mapsLink: "https://maps.google.com/?q=Fabric+London", createdAt: daysAgo(30) },
    { userId: user.id, name: "Berghain", city: "Berlin", country: "Germany", category: "club", genres: ["Techno", "Industrial"], description: "The world's most famous techno club, housed in a former power plant in Berlin's Friedrichshain district. Known for its strict door policy and 48-hour sets.", mapsLink: "https://maps.google.com/?q=Berghain+Berlin", createdAt: daysAgo(60) },
    { userId: user.id, name: "Amoeba Music", city: "Los Angeles", country: "USA", category: "record_store", genres: ["All Genres"], description: "The world's largest independent record store. A must-visit destination for vinyl enthusiasts with over 100,000 new and used records across every genre imaginable.", mapsLink: "https://maps.google.com/?q=Amoeba+Music+Los+Angeles", createdAt: daysAgo(15) },
    { userId: user.id, name: "Elsewhere", city: "New York", country: "USA", category: "club", genres: ["Electronic", "House", "Indie"], description: "Multi-level venue in Bushwick featuring a roof deck, hall, and zone. One of NYC's best spots for both underground and emerging artists.", mapsLink: "https://maps.google.com/?q=Elsewhere+Brooklyn", createdAt: daysAgo(7) },
    { userId: user.id, name: "Rough Trade East", city: "London", country: "UK", category: "record_store", genres: ["Indie", "Rock", "Electronic"], description: "Iconic record shop in Brick Lane's Old Truman Brewery. Regular in-store performances, extensive vinyl selection and knowledgeable staff.", mapsLink: "https://maps.google.com/?q=Rough+Trade+East+London", createdAt: daysAgo(20) },
  ]).returning();

  await db.insert(placeComments).values([
    { placeId: p1.id, userId: user.id, content: "Room 1 on a Friday night is an experience unlike anything else. The sound system is genuinely life-changing.", upvotes: 24, createdAt: daysAgo(5) },
    { placeId: p1.id, userId: user.id, content: "Get there early — the queue can be 2+ hours on peak nights. Worth it every single time though.", upvotes: 17, createdAt: daysAgo(3) },
  ]);

  const [s1, s2, s3, s4, s5] = await db.insert(shows).values([
    { artistName: "Bicep", venueName: "Alexandra Palace", city: "London", country: "UK", eventDate: "2023-11-18", genres: ["Electronic", "House"], createdAt: daysAgo(90) },
    { artistName: "The Weeknd", venueName: "Wembley Stadium", city: "London", country: "UK", eventDate: "2023-06-02", genres: ["R&B", "Pop"], createdAt: daysAgo(120) },
    { artistName: "Four Tet", venueName: "Printworks", city: "London", country: "UK", eventDate: "2023-09-15", genres: ["Electronic", "Ambient"], createdAt: daysAgo(60) },
    { artistName: "Aphex Twin", venueName: "Field Day", city: "London", country: "UK", eventDate: "2023-06-03", genres: ["Electronic", "IDM"], createdAt: daysAgo(110) },
    { artistName: "Disclosure", venueName: "Coachella Valley Music and Arts Festival", city: "Indio", country: "USA", eventDate: "2024-04-13", genres: ["Electronic", "House"], createdAt: daysAgo(30) },
  ]).returning();

  await db.insert(showReviews).values([
    { showId: s1.id, userId: user.id, rating: 5, content: "Absolutely transcendent. The sound at Ally Pally was perfect and Bicep played for nearly 3 hours. One of the best nights of my life.", createdAt: daysAgo(85) },
    { showId: s1.id, userId: devUser.id, rating: 4, content: "Incredible show. The visuals were stunning and the setlist was flawless. Only docking one star because the queue was absurd.", createdAt: daysAgo(80) },
    { showId: s2.id, userId: user.id, rating: 5, content: "The Weeknd at Wembley was just on another level. Starboy into Blinding Lights — the whole stadium erupted.", createdAt: daysAgo(115) },
    { showId: s3.id, userId: devUser.id, rating: 5, content: "Four Tet at Printworks was one of those rare magic nights. The way the light rig synced to the music was unreal.", createdAt: daysAgo(55) },
    { showId: s4.id, userId: user.id, rating: 4, content: "Aphex Twin at Field Day — chaotic, weird, brilliant. Not for everyone but if you know, you know.", createdAt: daysAgo(105) },
    { showId: s5.id, userId: devUser.id, rating: 5, content: "Disclosure at Coachella absolutely killed it. Energy was through the roof from the first track.", createdAt: daysAgo(25) },
  ]);

  await db.insert(showComments).values([
    { showId: s1.id, userId: user.id, content: "Does anyone know if they played Atlas during this set? I was near the back and couldn't hear perfectly.", upvotes: 8, createdAt: daysAgo(83) },
    { showId: s1.id, userId: user.id, content: "Yes they played it second to last! The whole crowd lost it.", upvotes: 14, createdAt: daysAgo(82) },
  ]);

  await db.insert(placeReviews).values([
    { placeId: p1.id, userId: user.id, rating: 5, body: "Room 1 is a religious experience. The sound system is the best I've ever heard.", createdAt: daysAgo(28) },
    { placeId: p2.id, userId: devUser.id, rating: 5, body: "Getting in is half the journey. Once inside, time disappears entirely.", createdAt: daysAgo(45) },
    { placeId: p3.id, userId: user.id, rating: 5, body: "Could spend an entire day here. The selection is overwhelming in the best way.", createdAt: daysAgo(12) },
    { placeId: p4.id, userId: devUser.id, rating: 4, body: "The rooftop is magical in summer. Great booking policy for emerging acts.", createdAt: daysAgo(5) },
    { placeId: p5.id, userId: user.id, rating: 5, body: "A proper record shop with soul. Staff actually know music.", createdAt: daysAgo(18) },
  ]);
  // Recompute place aggregate ratings/reviewCounts to match the one-review-per-place seed above
  for (const p of [p1, p2, p3, p4, p5]) {
    await db.update(places).set({ rating: 5, reviewsCount: 1 }).where(eq(places.id, p.id));
  }
  await db.update(places).set({ rating: 4, reviewsCount: 1 }).where(eq(places.id, p4.id));

  await db.insert(threads).values([
    {
      title: "After Hours is a masterpiece — still unmatched 5 years on",
      content: "The production, the storytelling, the atmosphere — nothing else sounds like it. Save Your Tears might be the perfect pop song.",
      userId: user.id, threadType: "album_review",
      albumId: "3TSz00N4l21XFMIqS09vJX", albumName: "After Hours",
      albumArt: "https://images.unsplash.com/photo-1571974599782-87624638275c?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300",
      artistName: "The Weeknd", starRating: 5, status: "active",
      upvotes: 94, savesCount: 58, commentsCount: 210, recommendationsCount: 0, createdAt: daysAgo(3),
    },
    {
      title: "Isles by Bicep — an emotional rollercoaster from start to finish",
      content: "Apricots, Saku, Sundial — every track hits different. Bicep managed to make something deeply personal feel universal.",
      userId: devUser.id, threadType: "album_review",
      albumId: "7KvOBpQdLuXRqAoSKVBF6l", albumName: "Isles",
      albumArt: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300",
      artistName: "Bicep", starRating: 5, status: "active",
      upvotes: 67, savesCount: 42, commentsCount: 134, recommendationsCount: 0, createdAt: daysAgo(5),
    },
    {
      title: "Midnight Minds EP is everything I needed this winter",
      content: "Four tracks, zero filler. The title track has been stuck in my head for two weeks solid.",
      userId: user.id, threadType: "album_review",
      albumId: "3TSz00N4l21XFMIqS09vJX", albumName: "After Hours",
      albumArt: "https://images.unsplash.com/photo-1571974599782-87624638275c?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300",
      artistName: "The Weeknd", starRating: 4, status: "active",
      upvotes: 31, savesCount: 19, commentsCount: 77, recommendationsCount: 0, createdAt: daysAgo(1),
    },
  ]);

  // Wishlist + upcoming trip for Ticketmaster matching beta
  await db.insert(userShowWishlist).values([
    { userId: user.id, artistName: "Bicep", spotifyImageUrl: null, createdAt: daysAgo(2) },
    { userId: user.id, artistName: "Four Tet", spotifyImageUrl: null, createdAt: daysAgo(1) },
  ]);
  const inSixMonths = new Date();
  inSixMonths.setMonth(inSixMonths.getMonth() + 6);
  const tripStart = new Date(inSixMonths.getFullYear(), inSixMonths.getMonth(), 1);
  const tripEnd = new Date(inSixMonths.getFullYear(), inSixMonths.getMonth() + 1, 0);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  await db.insert(userTravelPlans).values({
    userId: user.id,
    city: "London",
    country: "UK",
    targetDate: `${months[tripStart.getMonth()]} ${tripStart.getFullYear()}`,
    startDate: iso(tripStart),
    endDate: iso(tripEnd),
    note: "Seed trip for wishlist matching",
    createdAt: daysAgo(1),
  });

  console.log("Seed complete.");
  await pool.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
