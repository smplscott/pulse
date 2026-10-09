import {
  PLACE_CONTENT_RATING_LABELS,
  PLACE_SPECIALTY_TAGS,
  isPlaceContentRating,
  placeCategoryLabel,
  type PlacePlayedArtist,
} from "@shared/placeCategories";

interface PlaceMeta {
  category: string;
  genres?: string[] | null;
  soundSystem?: string | null;
  hostsLiveMusic?: boolean | null;
  brandsTourHere?: boolean | null;
  contentRating?: string | null;
  playedArtists?: PlacePlayedArtist[] | null;
}

const muted = "text-[10px] px-2 py-0.5 rounded-full bg-[#282828] text-[#B3B3B3]";
const accent = "text-[10px] px-2 py-0.5 rounded-full bg-[#1a2a1a] text-[#c2f970]";

export function PlaceMetaChips({
  place,
  showCategory = true,
  maxGenres = 2,
  showArtists = false,
}: {
  place: PlaceMeta;
  showCategory?: boolean;
  maxGenres?: number;
  showArtists?: boolean;
}) {
  const genres = place.genres ?? [];
  const artists = place.playedArtists ?? [];
  return (
    <>
      {showCategory && (
        <span className={muted}>{placeCategoryLabel(place.category)}</span>
      )}
      {place.hostsLiveMusic && <span className={accent}>{PLACE_SPECIALTY_TAGS[0].label}</span>}
      {place.brandsTourHere && <span className={accent}>{PLACE_SPECIALTY_TAGS[1].label}</span>}
      {place.contentRating && isPlaceContentRating(place.contentRating) && (
        <span className={muted}>{PLACE_CONTENT_RATING_LABELS[place.contentRating]}</span>
      )}
      {genres.slice(0, maxGenres).map(genre => (
        <span key={genre} className={accent}>{genre}</span>
      ))}
      {genres.length > maxGenres && (
        <span className="text-[10px] text-[#666]">+{genres.length - maxGenres}</span>
      )}
      {place.soundSystem && <span className={muted}>{place.soundSystem}</span>}
      {showArtists && artists.slice(0, 3).map(artist => (
        <span key={artist.spotifyId} className={muted}>{artist.name}</span>
      ))}
      {showArtists && artists.length > 3 && (
        <span className="text-[10px] text-[#666]">+{artists.length - 3}</span>
      )}
    </>
  );
}
