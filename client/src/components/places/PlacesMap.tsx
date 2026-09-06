import { useEffect } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import { Link } from "wouter";
import L from "leaflet";
import { Star } from "lucide-react";
import type { Place } from "@shared/schema";
import { recommendedGenre } from "@shared/placeMaps";
import "leaflet/dist/leaflet.css";

export type MappablePlace = Place & {
  reviewCount?: number;
  avgRating?: number | null;
};

const pinIcon = L.divIcon({
  className: "pulse-map-pin",
  html: `<span style="display:block;width:16px;height:16px;border-radius:999px;background:#c2f970;border:2px solid #111;box-shadow:0 0 0 3px rgba(194,249,112,0.25)"></span>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
  popupAnchor: [0, -10],
});

function FitPins({ places }: { places: MappablePlace[] }) {
  const map = useMap();
  const pinKey = places.map(place => `${place.id}:${place.latitude}:${place.longitude}`).join("|");
  useEffect(() => {
    if (places.length === 0) return;
    if (places.length === 1) {
      map.setView([places[0].latitude!, places[0].longitude!], 13);
      return;
    }
    const bounds = L.latLngBounds(places.map(place => [place.latitude!, place.longitude!] as [number, number]));
    map.fitBounds(bounds, { padding: [32, 32], maxZoom: 14 });
  }, [map, pinKey, places]);
  return null;
}

export default function PlacesMap({ places }: { places: MappablePlace[] }) {
  const fallback: [number, number] = [51.5074, -0.1278];
  const cartoKey = import.meta.env.VITE_CARTO_API_KEY as string | undefined;
  const baseTileUrl =
    "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
  const tileUrl = cartoKey
    ? `${baseTileUrl}?key=${encodeURIComponent(cartoKey)}`
    : baseTileUrl;
  return (
    <MapContainer
      center={fallback}
      zoom={3}
      className="h-[62vh] min-h-[360px] w-full rounded-xl"
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url={tileUrl}
      />
      <FitPins places={places} />
      {places.map(place => {
        const genre = recommendedGenre(place);
        const rating = place.avgRating ?? place.rating ?? 0;
        return (
          <Marker
            key={place.id}
            position={[place.latitude!, place.longitude!]}
            icon={pinIcon}
          >
            <Popup>
              <div className="min-w-[160px] space-y-1">
                <Link href={`/places/${place.id}`}>
                  <span className="block text-sm font-semibold text-white hover:underline">
                    {place.name}
                  </span>
                </Link>
                <p className="flex items-center gap-1 text-xs text-[#ccc]">
                  <Star className="h-3 w-3 fill-[#c2f970] text-[#c2f970]" />
                  {rating > 0 ? Number(rating).toFixed(1) : "–"}
                </p>
                {genre && (
                  <p className="text-[11px] font-medium text-[#c2f970]">{genre}</p>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
