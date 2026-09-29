/**
 * Location Geocoding & Place Suggestion Service (Mapbox Geocoding with Photon/Nominatim Fallback)
 * Provides typeahead autocomplete for destinations, facilities, and street addresses,
 * plus reverse geocoding for pin drops.
 */

import { NormalizedCoord } from '../components/map/types';

export interface PlaceSuggestion {
  id: string;
  name: string;
  address: string;
  city?: string;
  state?: string;
  country?: string;
  postcode?: string;
  latitude: number;
  longitude: number;
  isSavedDestination?: boolean;
}

// In-memory LRU cache for search results
const searchCache = new Map<string, PlaceSuggestion[]>();
const reverseCache = new Map<string, string>();
let activeAbortController: AbortController | null = null;

export function abortPlaceSearch() {
  if (activeAbortController) {
    activeAbortController.abort();
    activeAbortController = null;
  }
}

/**
 * Searches places with debounce, query caching, Mapbox Geocoding, and open fallbacks.
 */
export async function searchPlaceSuggestions(
  query: string,
  proximity: { latitude: number; longitude: number } = { latitude: 28.5355, longitude: 77.2680 },
  savedDestinations: Array<{ id: string; name: string; address: string; latitude: number; longitude: number }> = []
): Promise<PlaceSuggestion[]> {
  const trimmed = query.trim();
  if (!trimmed || trimmed.length < 2) return [];

  const cacheKey = `${trimmed.toLowerCase()}_${proximity.latitude.toFixed(2)}_${proximity.longitude.toFixed(2)}`;
  if (searchCache.has(cacheKey)) {
    return searchCache.get(cacheKey)!;
  }

  // 1. First, search within company saved destinations
  const matchingSaved: PlaceSuggestion[] = [];
  const lowerQ = trimmed.toLowerCase();
  for (const d of savedDestinations) {
    if (d.name.toLowerCase().includes(lowerQ) || d.address.toLowerCase().includes(lowerQ)) {
      matchingSaved.push({
        id: `saved-${d.id}`,
        name: d.name,
        address: d.address,
        latitude: d.latitude,
        longitude: d.longitude,
        isSavedDestination: true
      });
    }
  }

  // Abort previous in-flight request
  if (activeAbortController) {
    activeAbortController.abort();
  }
  activeAbortController = new AbortController();

  let geocodedResults: PlaceSuggestion[] = [];
  const mapboxToken = (import.meta.env.VITE_MAPBOX_TOKEN || '').trim();

  // 2. Try Mapbox Geocoding API if token is valid
  if (mapboxToken && !mapboxToken.includes('your-public')) {
    try {
      const mapboxUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(trimmed)}.json?access_token=${mapboxToken}&country=IN&proximity=${proximity.longitude},${proximity.latitude}&limit=6`;
      const res = await fetch(mapboxUrl, {
        signal: activeAbortController.signal,
        headers: { Accept: 'application/json' }
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.features)) {
          geocodedResults = data.features.map((f: any, idx: number): PlaceSuggestion => {
            const coords = f.center || [proximity.longitude, proximity.latitude];
            const name = f.text || f.place_name?.split(',')[0] || trimmed;
            const fullAddress = f.place_name || name;

            const context = Array.isArray(f.context) ? f.context : [];
            const city = context.find((c: any) => c.id?.startsWith('place'))?.text;
            const state = context.find((c: any) => c.id?.startsWith('region'))?.text;
            const postcode = context.find((c: any) => c.id?.startsWith('postcode'))?.text;
            const country = context.find((c: any) => c.id?.startsWith('country'))?.text || 'India';

            return {
              id: `mbx-${f.id || idx}-${Date.now()}`,
              name,
              address: fullAddress,
              city,
              state,
              country,
              postcode,
              latitude: Number(coords[1].toFixed(6)),
              longitude: Number(coords[0].toFixed(6)),
              isSavedDestination: false
            };
          });
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return matchingSaved;
      // Fall through to Photon/Nominatim
    }
  }

  // 3. Fallback to Photon (OpenStreetMap/Komoot)
  if (geocodedResults.length === 0 && !activeAbortController?.signal?.aborted) {
    try {
      const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(trimmed)}&lat=${proximity.latitude}&lon=${proximity.longitude}&limit=6`;
      const res = await fetch(url, {
        signal: activeAbortController?.signal,
        headers: { Accept: 'application/json' }
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.features)) {
          geocodedResults = data.features.map((f: any, idx: number): PlaceSuggestion => {
            const props = f.properties || {};
            const coords = f.geometry?.coordinates || [proximity.longitude, proximity.latitude];
            const name = props.name || props.street || props.city || trimmed;
            const addressParts = [
              props.housenumber ? `${props.housenumber} ${props.street || ''}` : props.street,
              props.district || props.suburb,
              props.city,
              props.state,
              props.postcode,
              props.country || 'India'
            ].filter(Boolean);

            return {
              id: `geo-${props.osm_id || idx}-${Date.now()}`,
              name,
              address: addressParts.join(', ') || name,
              city: props.city || props.district,
              state: props.state,
              country: props.country || 'India',
              postcode: props.postcode,
              latitude: Number(coords[1].toFixed(6)),
              longitude: Number(coords[0].toFixed(6)),
              isSavedDestination: false
            };
          });
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return matchingSaved;
    }
  }

  // Combine saved destinations from database at top, followed by geocoded places
  const combined = [...matchingSaved, ...geocodedResults];

  // De-duplicate by coordinate proximity (within 50 meters)
  const uniqueResults: PlaceSuggestion[] = [];
  for (const item of combined) {
    const isDuplicate = uniqueResults.some(
      (existing) =>
        Math.abs(existing.latitude - item.latitude) < 0.0005 &&
        Math.abs(existing.longitude - item.longitude) < 0.0005
    );
    if (!isDuplicate) {
      uniqueResults.push(item);
    }
  }

  if (searchCache.size > 100) {
    const oldestKey = searchCache.keys().next().value;
    if (oldestKey) searchCache.delete(oldestKey);
  }
  searchCache.set(cacheKey, uniqueResults);

  return uniqueResults;
}

/**
 * Reverse geocodes coordinates into a human-readable street or area address.
 */
export async function reverseGeocodeLocation(coord: NormalizedCoord): Promise<string> {
  const cacheKey = `${coord.lat.toFixed(4)},${coord.lng.toFixed(4)}`;
  if (reverseCache.has(cacheKey)) {
    return reverseCache.get(cacheKey)!;
  }

  const mapboxToken = (import.meta.env.VITE_MAPBOX_TOKEN || '').trim();

  // 1. Try Mapbox Reverse Geocoding
  if (mapboxToken && !mapboxToken.includes('your-public')) {
    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${coord.lng},${coord.lat}.json?access_token=${mapboxToken}&limit=1`;
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (res.ok) {
        const data = await res.json();
        if (data.features && data.features.length > 0) {
          const address = data.features[0].place_name || data.features[0].text;
          if (address) {
            reverseCache.set(cacheKey, address);
            return address;
          }
        }
      }
    } catch {
      // Fallback
    }
  }

  // 2. Fallback to Nominatim Reverse Geocoding
  try {
    const nomUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coord.lat}&lon=${coord.lng}&zoom=18&addressdetails=1`;
    const res = await fetch(nomUrl, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'TruckTracker-Logistics-Platform/2.0'
      }
    });
    if (res.ok) {
      const data = await res.json();
      const addr = data.display_name || data.name;
      if (addr) {
        reverseCache.set(cacheKey, addr);
        return addr;
      }
    }
  } catch {
    // Fallback to formatted coordinates
  }

  const fallback = `Location at ${coord.lat.toFixed(5)}, ${coord.lng.toFixed(5)}`;
  reverseCache.set(cacheKey, fallback);
  return fallback;
}
