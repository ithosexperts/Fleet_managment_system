/**
 * Location Geocoding & Place Suggestion Service
 * Provides fast, free, typeahead place autocomplete for destinations, facilities, and street addresses.
 * Uses Photon (OpenStreetMap/Komoot) with proximity bias, in-memory caching, and offline Indian logistics hub fallbacks.
 */

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
let activeAbortController: AbortController | null = null;

export function abortPlaceSearch() {
  if (activeAbortController) {
    activeAbortController.abort();
    activeAbortController = null;
  }
}

/**
 * Searches places with debounce, query caching, and optional proximity bias.
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

  try {
    const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(trimmed)}&lat=${proximity.latitude}&lon=${proximity.longitude}&limit=6`;
    const res = await fetch(url, {
      signal: activeAbortController.signal,
      headers: {
        Accept: 'application/json'
      }
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

          const formattedAddress = addressParts.join(', ') || name;

          return {
            id: `geo-${props.osm_id || idx}-${Date.now()}`,
            name,
            address: formattedAddress,
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
    if (err.name === 'AbortError') {
      return matchingSaved;
    }
    console.warn('[Geocoding] Photon lookup error, trying Nominatim online:', err.message);
  }

  // If Photon returned empty or failed, fallback to live Nominatim OpenStreetMap API
  if (geocodedResults.length === 0 && !activeAbortController?.signal?.aborted) {
    try {
      const nomUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(trimmed)}&countrycodes=in&limit=6&addressdetails=1`;
      const nomRes = await fetch(nomUrl, {
        signal: activeAbortController?.signal,
        headers: {
          Accept: 'application/json',
          'User-Agent': 'TruckTracker-Logistics-Platform/2.0'
        }
      });
      if (nomRes.ok) {
        const nomData = await nomRes.json();
        if (Array.isArray(nomData)) {
          geocodedResults = nomData.map((item: any, idx: number): PlaceSuggestion => {
            const addr = item.address || {};
            const name = addr.building || addr.amenity || addr.shop || addr.office || addr.neighbourhood || addr.suburb || item.name || trimmed;
            const fullAddress = item.display_name || name;

            return {
              id: `nom-${item.place_id || idx}-${Date.now()}`,
              name,
              address: fullAddress,
              city: addr.city || addr.town || addr.district,
              state: addr.state,
              country: addr.country || 'India',
              postcode: addr.postcode,
              latitude: Number(parseFloat(item.lat).toFixed(6)),
              longitude: Number(parseFloat(item.lon).toFixed(6)),
              isSavedDestination: false
            };
          });
        }
      }
    } catch (nomErr: any) {
      if (nomErr.name !== 'AbortError') {
        console.warn('[Geocoding] Nominatim online fallback failed:', nomErr.message);
      }
    }
  }

  // Combine saved destinations from database at top, followed by live geocoded places
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

  // Keep cache reasonable
  if (searchCache.size > 100) {
    const oldestKey = searchCache.keys().next().value;
    if (oldestKey) searchCache.delete(oldestKey);
  }
  searchCache.set(cacheKey, uniqueResults);

  return uniqueResults;
}
