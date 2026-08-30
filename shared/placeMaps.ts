export interface PlaceMapIdentity {
  mapsLink?: string | null;
  googlePlaceId?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  reviewCount?: number | null;
  reviewsCount?: number | null;
  genres?: string[] | null;
}

export function recommendedGenre(place: Pick<PlaceMapIdentity, "genres">): string | null {
  const genre = place.genres?.find(value => value.trim().length > 0);
  return genre ?? null;
}

export function hasStoredCoordinates(place: PlaceMapIdentity): boolean {
  return typeof place.latitude === "number"
    && typeof place.longitude === "number"
    && Number.isFinite(place.latitude)
    && Number.isFinite(place.longitude);
}

export function isMapPinPlace(place: PlaceMapIdentity): boolean {
  const reviews = place.reviewCount ?? place.reviewsCount ?? 0;
  return reviews >= 1 && hasStoredCoordinates(place);
}

export function placeDirectionsUrl(place: PlaceMapIdentity): string | null {
  if (place.mapsLink?.trim()) return place.mapsLink.trim();
  if (place.googlePlaceId?.trim()) {
    return `https://www.google.com/maps/dir/?api=1&destination_place_id=${encodeURIComponent(place.googlePlaceId.trim())}`;
  }
  if (hasStoredCoordinates(place)) {
    return `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`;
  }
  return null;
}
