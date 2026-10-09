import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Music2, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  DEFAULT_PLACE_CATEGORY_IDS,
  MAX_PLAYED_ARTISTS,
  MORE_PLACE_CATEGORY_IDS,
  PLACE_CATEGORY_LABELS,
  PLACE_CONTENT_RATING_LABELS,
  PLACE_CONTENT_RATINGS,
  PLACE_MUSIC_GENRES,
  PLACE_SPECIALTY_TAGS,
  type PlaceCategory,
  type PlaceContentRating,
  type PlacePlayedArtist,
} from "@shared/placeCategories";

interface SpotifyArtist {
  spotifyId: string;
  name: string;
  imageUrl: string | null;
  genres: string[];
}

const chipClass = (active: boolean) =>
  cn(
    "text-xs px-2.5 py-1 rounded-full border transition-colors",
    active
      ? "bg-gradient-to-r from-[#c2f970] to-[#ecffa1] text-black border-transparent"
      : "bg-[#282828] text-[#B3B3B3] border-[#3E3E3E] hover:border-[#555]",
  );

export function PlaceCategoryPicker({
  value,
  onChange,
}: {
  value: PlaceCategory;
  onChange: (value: PlaceCategory) => void;
}) {
  const selectedInMore = (MORE_PLACE_CATEGORY_IDS as readonly string[]).includes(value);
  const [showMore, setShowMore] = useState(selectedInMore);

  useEffect(() => {
    if (selectedInMore) setShowMore(true);
  }, [selectedInMore]);

  return (
    <div>
      <p className="text-xs text-[#B3B3B3] mb-1.5 font-medium">Place type *</p>
      <div className="flex flex-wrap gap-1.5">
        {DEFAULT_PLACE_CATEGORY_IDS.map(id => (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={chipClass(value === id)}
          >
            {PLACE_CATEGORY_LABELS[id]}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setShowMore(open => !open)}
          className={cn(
            "text-xs px-2.5 py-1 rounded-full border transition-colors",
            showMore
              ? "bg-[#8ab4f8]/15 text-[#8ab4f8] border-[#8ab4f8]/40"
              : "bg-[#282828] text-[#B3B3B3] border-[#3E3E3E] hover:border-[#555]",
          )}
        >
          {showMore ? "Less" : "More"}
        </button>
      </div>
      {showMore && (
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          {MORE_PLACE_CATEGORY_IDS.map(id => (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              className={chipClass(value === id)}
            >
              {PLACE_CATEGORY_LABELS[id]}
            </button>
          ))}
          {value === "other" && (
            <button type="button" className={chipClass(true)}>
              {PLACE_CATEGORY_LABELS.other}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function PlaceGenrePicker({
  selected,
  onToggle,
}: {
  selected: string[];
  onToggle: (genre: string) => void;
}) {
  const hasRequired = selected.length > 0;
  return (
    <div>
      <p className="text-xs text-[#B3B3B3] mb-1.5 font-medium">
        Genres * <span className="text-[#555]">(at least one required)</span>
      </p>
      <div className="flex flex-wrap gap-1.5">
        {PLACE_MUSIC_GENRES.map(genre => (
          <button
            key={genre}
            type="button"
            onClick={() => onToggle(genre)}
            className={chipClass(selected.includes(genre))}
          >
            {genre}
          </button>
        ))}
      </div>
      <p className={cn("text-[11px] mt-1.5", hasRequired ? "text-[#7a9a4a]" : "text-[#888]")}>
        {hasRequired
          ? "Required genre tagged. Add more if you want — extra genres are optional."
          : "Tag at least one genre to continue. More genres are optional after that."}
      </p>
    </div>
  );
}

export function PlaceSpecialtyPicker({
  hostsLiveMusic,
  brandsTourHere,
  onChange,
}: {
  hostsLiveMusic: boolean;
  brandsTourHere: boolean;
  onChange: (next: { hostsLiveMusic: boolean; brandsTourHere: boolean }) => void;
}) {
  const values = { hosts_live_music: hostsLiveMusic, brands_tour_here: brandsTourHere };
  return (
    <div>
      <p className="text-xs text-[#B3B3B3] mb-1.5 font-medium">
        Specialty tags <span className="text-[#555]">(optional)</span>
      </p>
      <div className="flex flex-wrap gap-1.5">
        {PLACE_SPECIALTY_TAGS.map(tag => {
          const active = values[tag.id];
          return (
            <button
              key={tag.id}
              type="button"
              onClick={() =>
                onChange({
                  hostsLiveMusic: tag.id === "hosts_live_music" ? !hostsLiveMusic : hostsLiveMusic,
                  brandsTourHere: tag.id === "brands_tour_here" ? !brandsTourHere : brandsTourHere,
                })
              }
              className={chipClass(active)}
            >
              {tag.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function PlaceContentRatingPicker({
  value,
  onChange,
}: {
  value: PlaceContentRating | null;
  onChange: (value: PlaceContentRating | null) => void;
}) {
  return (
    <div>
      <p className="text-xs text-[#B3B3B3] mb-1.5 font-medium">
        Lyrics <span className="text-[#555]">(optional — Clean or Explicit)</span>
      </p>
      <div className="flex flex-wrap gap-1.5">
        {PLACE_CONTENT_RATINGS.map(rating => (
          <button
            key={rating}
            type="button"
            onClick={() => onChange(value === rating ? null : rating)}
            className={chipClass(value === rating)}
          >
            {PLACE_CONTENT_RATING_LABELS[rating]}
          </button>
        ))}
      </div>
    </div>
  );
}

export function PlacePlayedArtistPicker({
  artists,
  onChange,
}: {
  artists: PlacePlayedArtist[];
  onChange: (artists: PlacePlayedArtist[]) => void;
}) {
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const timeout = setTimeout(() => setQuery(input.trim()), 350);
    return () => clearTimeout(timeout);
  }, [input]);

  const { data, isFetching } = useQuery<{ results: SpotifyArtist[]; error?: string }>({
    queryKey: ["/api/spotify/artists/search", "place-played", query],
    queryFn: async () => {
      const res = await fetch(`/api/spotify/artists/search?q=${encodeURIComponent(query)}`);
      return res.json();
    },
    enabled: query.length >= 2,
  });

  const results = (data?.results ?? []).filter(
    artist => !artists.some(selected => selected.spotifyId === artist.spotifyId),
  );
  const atLimit = artists.length >= MAX_PLAYED_ARTISTS;

  function addArtist(artist: SpotifyArtist) {
    if (atLimit || artists.some(selected => selected.spotifyId === artist.spotifyId)) return;
    onChange([
      ...artists,
      { spotifyId: artist.spotifyId, name: artist.name, imageUrl: artist.imageUrl },
    ]);
    setInput("");
    setQuery("");
  }

  return (
    <div>
      <p className="text-xs text-[#B3B3B3] mb-1.5 font-medium">
        Artists played here <span className="text-[#555]">(optional — search Spotify)</span>
      </p>
      {artists.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {artists.map(artist => (
            <span
              key={artist.spotifyId}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#1a2a1a] px-2 py-1 text-xs text-[#c2f970]"
            >
              {artist.imageUrl ? (
                <img src={artist.imageUrl} alt="" className="h-4 w-4 rounded-full object-cover" />
              ) : (
                <Music2 className="h-3 w-3" />
              )}
              {artist.name}
              <button
                type="button"
                onClick={() => onChange(artists.filter(item => item.spotifyId !== artist.spotifyId))}
                className="text-[#7a9a4a] hover:text-white"
                aria-label={`Remove ${artist.name}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#B3B3B3]" />
        <Input
          value={input}
          onChange={event => setInput(event.target.value)}
          disabled={atLimit}
          className="pl-8 bg-[#282828] border-[#3E3E3E] text-white placeholder:text-[#555] h-9 text-sm"
          placeholder={atLimit ? `Up to ${MAX_PLAYED_ARTISTS} artists` : "Search artists who get played here"}
        />
      </div>
      {isFetching && (
        <div className="flex justify-center py-3">
          <Loader2 className="h-4 w-4 animate-spin text-[#c2f970]" />
        </div>
      )}
      {!isFetching && query.length >= 2 && results.length > 0 && (
        <div className="mt-2 space-y-1">
          {results.slice(0, 6).map(artist => (
            <button
              key={artist.spotifyId}
              type="button"
              onClick={() => addArtist(artist)}
              className="flex w-full items-center gap-2.5 rounded-lg p-2 text-left hover:bg-[#282828]"
            >
              {artist.imageUrl ? (
                <img src={artist.imageUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#282828]">
                  <Music2 className="h-3.5 w-3.5 text-[#888]" />
                </div>
              )}
              <span className="truncate text-sm text-white">{artist.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
