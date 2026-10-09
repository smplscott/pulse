export const DEFAULT_PLACE_CATEGORY_IDS = [
  "bar",
  "coffee_shop",
  "club",
  "restaurant",
  "record_store",
  "event_venue",
] as const;

export const MORE_PLACE_CATEGORY_IDS = [
  "listening_bar",
  "barbershop",
  "skate_shop",
  "boutique_store",
  "streetwear_store",
  "gym",
] as const;

export const LEGACY_PLACE_CATEGORY_IDS = ["other"] as const;

export const PLACE_CATEGORY_IDS = [
  ...DEFAULT_PLACE_CATEGORY_IDS,
  ...MORE_PLACE_CATEGORY_IDS,
  ...LEGACY_PLACE_CATEGORY_IDS,
] as const;

export type PlaceCategory = (typeof PLACE_CATEGORY_IDS)[number];

export const PLACE_CATEGORY_LABELS: Record<PlaceCategory, string> = {
  bar: "Bar",
  coffee_shop: "Coffee Shop",
  club: "Club",
  restaurant: "Restaurant",
  record_store: "Record Store",
  event_venue: "Event Venue",
  listening_bar: "Listening Bar",
  barbershop: "Barbershop",
  skate_shop: "Skate Shop",
  boutique_store: "Boutique Store",
  streetwear_store: "Streetwear Store",
  gym: "Gym",
  other: "Other",
};

export const PLACE_CATEGORY_FILTER_LABELS: Record<PlaceCategory, string> = {
  bar: "Bars",
  coffee_shop: "Coffee Shops",
  club: "Clubs",
  restaurant: "Restaurants",
  record_store: "Record Stores",
  event_venue: "Event Venues",
  listening_bar: "Listening Bars",
  barbershop: "Barbershops",
  skate_shop: "Skate Shops",
  boutique_store: "Boutique Stores",
  streetwear_store: "Streetwear Stores",
  gym: "Gyms",
  other: "Other",
};

export function isPlaceCategory(value: string): value is PlaceCategory {
  return (PLACE_CATEGORY_IDS as readonly string[]).includes(value);
}

export function placeCategoryLabel(category: string): string {
  return isPlaceCategory(category) ? PLACE_CATEGORY_LABELS[category] : category.replaceAll("_", " ");
}

export function placeCategoryFilterLabel(category: string): string {
  return isPlaceCategory(category) ? PLACE_CATEGORY_FILTER_LABELS[category] : category.replaceAll("_", " ");
}

const GOOGLE_TYPE_TO_CATEGORY: Record<string, PlaceCategory> = {
  bar: "bar",
  pub: "bar",
  cafe: "coffee_shop",
  coffee_shop: "coffee_shop",
  night_club: "club",
  restaurant: "restaurant",
  meal_takeaway: "restaurant",
  meal_delivery: "restaurant",
  record_store: "record_store",
  concert_hall: "event_venue",
  performing_arts_theater: "event_venue",
  event_venue: "event_venue",
  stadium: "event_venue",
  arena: "event_venue",
  hair_salon: "barbershop",
  barber_shop: "barbershop",
  hair_care: "barbershop",
  gym: "gym",
  fitness_center: "gym",
  clothing_store: "boutique_store",
  shoe_store: "skate_shop",
};

export function googleTypeToPlaceCategory(primaryType: string | null): PlaceCategory {
  if (!primaryType) return "bar";
  return GOOGLE_TYPE_TO_CATEGORY[primaryType] ?? "bar";
}

export const PLACE_CONTENT_RATINGS = ["clean", "explicit"] as const;
export type PlaceContentRating = (typeof PLACE_CONTENT_RATINGS)[number];

export const PLACE_CONTENT_RATING_LABELS: Record<PlaceContentRating, string> = {
  clean: "Clean",
  explicit: "Explicit",
};

export function isPlaceContentRating(value: string): value is PlaceContentRating {
  return (PLACE_CONTENT_RATINGS as readonly string[]).includes(value);
}

export const MAX_PLAYED_ARTISTS = 8;

export interface PlacePlayedArtist {
  spotifyId: string;
  name: string;
  imageUrl: string | null;
}

export const PLACE_MUSIC_GENRES = [
  "House", "Techno", "Drum & Bass", "Jungle", "Hip-Hop",
  "R&B", "Soul", "Jazz", "Electronic", "Disco", "Funk",
  "Rock", "Indie", "Pop", "Ambient", "Experimental",
] as const;

export const PLACE_SPECIALTY_TAGS = [
  { id: "hosts_live_music", label: "Hosts live music" },
  { id: "brands_tour_here", label: "Brands tour here" },
] as const;
