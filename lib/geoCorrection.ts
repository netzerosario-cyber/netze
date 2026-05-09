// ============================================================
// lib/geoCorrection.ts — Geocoding fallback + Supabase cache
// 
// Flujo:
// 1. Buscar en cache (property_coordinates_cache) por tokko_id
// 2. Si existe y address coincide → usar corrected coords
// 3. Si no → validar coords originales de Tokko
// 4. Si inválidas → re-geocodificar con Mapbox + guardar en cache
// 5. Manual overrides NUNCA se sobreescriben
// ============================================================
import { supabaseAdmin } from './supabase';
import { validateCoordinates, GRAN_ROSARIO_BBOX, getValidationReasonLabel } from './geoValidation';
import type { Property } from './tokko';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? '';
const ROSARIO_CENTER = [-60.6393, -32.9442]; // proximity bias

// ── Tipos de cache ──────────────────────────────────────────

interface CachedCoord {
  tokko_id: string;
  original_lat: number | null;
  original_lng: number | null;
  corrected_lat: number | null;
  corrected_lng: number | null;
  correction_source: 'tokko_original' | 'mapbox_geocoded' | 'manual_override';
  is_imprecise: boolean;
  address_query: string;
  updated_at: string;
}

// ── Mapbox Geocoding ────────────────────────────────────────

interface MapboxFeature {
  center: [number, number]; // [lng, lat]
  relevance: number;
  place_name: string;
}

/**
 * Geocodifica una dirección usando Mapbox Geocoding API,
 * sesgado hacia Rosario, Argentina.
 */
async function geocodeAddress(address: string, neighborhood?: string, city?: string): Promise<{ lat: number; lng: number } | null> {
  if (!MAPBOX_TOKEN) {
    console.warn('[Netze Geo] No Mapbox token — cannot geocode');
    return null;
  }

  // Construir query enriquecida
  const parts = [address];
  if (neighborhood) parts.push(neighborhood);
  if (city) parts.push(city);
  else parts.push('Rosario');
  parts.push('Santa Fe', 'Argentina');
  const query = parts.join(', ');

  const params = new URLSearchParams({
    access_token: MAPBOX_TOKEN,
    country: 'ar',
    language: 'es',
    limit: '1',
    proximity: `${ROSARIO_CENTER[0]},${ROSARIO_CENTER[1]}`,
    bbox: `${GRAN_ROSARIO_BBOX.lngMin},${GRAN_ROSARIO_BBOX.latMin},${GRAN_ROSARIO_BBOX.lngMax},${GRAN_ROSARIO_BBOX.latMax}`,
    types: 'address,poi,place,locality,neighborhood',
  });

  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?${params}`;

  try {
    const res = await fetch(url, { next: { revalidate: 86400 } }); // cache 24h
    if (!res.ok) {
      console.error(`[Netze Geo] Mapbox geocoding error: ${res.status}`);
      return null;
    }
    const data = await res.json();
    const features: MapboxFeature[] = data.features ?? [];

    if (features.length === 0) {
      console.warn(`[Netze Geo] No geocoding results for: "${query}"`);
      return null;
    }

    const best = features[0];
    if (best.relevance < 0.5) {
      console.warn(`[Netze Geo] Low relevance (${best.relevance}) for: "${query}" → "${best.place_name}"`);
      return null;
    }

    const [lng, lat] = best.center;
    console.info(`[Netze Geo] Geocoded "${query}" → [${lat}, ${lng}] (relevance: ${best.relevance})`);
    return { lat, lng };
  } catch (err) {
    console.error('[Netze Geo] Geocoding fetch error:', err);
    return null;
  }
}

// ── Cache operations ────────────────────────────────────────

async function getCachedCoord(tokkoId: string): Promise<CachedCoord | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('property_coordinates_cache')
      .select('*')
      .eq('tokko_id', tokkoId)
      .single();
    if (error || !data) return null;
    return data as CachedCoord;
  } catch {
    return null;
  }
}

async function upsertCachedCoord(coord: Omit<CachedCoord, 'updated_at'>): Promise<void> {
  try {
    await supabaseAdmin
      .from('property_coordinates_cache')
      .upsert({
        ...coord,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'tokko_id' });
  } catch (err) {
    console.error('[Netze Geo] Cache upsert error:', err);
  }
}

// ── Log de correcciones ─────────────────────────────────────

async function logCorrection(entry: {
  tokko_id: string;
  original_lat: number | null;
  original_lng: number | null;
  corrected_lat: number | null;
  corrected_lng: number | null;
  reason: string;
  source: string;
  address: string;
}): Promise<void> {
  try {
    await supabaseAdmin.from('coordinate_correction_log').insert({
      ...entry,
      created_at: new Date().toISOString(),
    });
  } catch {
    // Fallback: just log to console if table doesn't exist yet
    console.info(`[Netze Geo Log] ${entry.tokko_id} | ${entry.address} | ${entry.reason} | ${entry.source} | original: [${entry.original_lat}, ${entry.original_lng}] → corrected: [${entry.corrected_lat}, ${entry.corrected_lng}]`);
  }
}

// ── Función principal: validar + corregir propiedades ────────

/**
 * Procesa un array de propiedades:
 * - Valida coordenadas contra bbox + río
 * - Busca en cache de Supabase
 * - Re-geocodifica si necesario
 * - Actualiza _geoStatus y coords
 * 
 * Modifica las propiedades in-place.
 */
export async function validateAndCorrectCoordinates(properties: Property[]): Promise<void> {
  const corrections: string[] = [];

  for (const prop of properties) {
    const tokkoId = String(prop.id);
    const origLat = prop.geo_lat ? parseFloat(prop.geo_lat) : null;
    const origLng = prop.geo_long ? parseFloat(prop.geo_long) : null;

    // 1. Check cache first
    const cached = await getCachedCoord(tokkoId);

    if (cached) {
      // Manual override → always use, never re-geocode
      if (cached.correction_source === 'manual_override') {
        if (cached.corrected_lat != null && cached.corrected_lng != null) {
          prop.geo_lat = String(cached.corrected_lat);
          prop.geo_long = String(cached.corrected_lng);
          prop._geoStatus = 'valid';
        } else {
          prop._geoStatus = cached.is_imprecise ? 'imprecise' : 'no_coords';
        }
        continue;
      }

      // Cache hit with same address → use cached coords
      if (cached.address_query === prop.address && cached.corrected_lat != null && cached.corrected_lng != null) {
        const cacheValidation = validateCoordinates(String(cached.corrected_lat), String(cached.corrected_lng));
        if (cacheValidation.isValid) {
          prop.geo_lat = String(cached.corrected_lat);
          prop.geo_long = String(cached.corrected_lng);
          prop._geoStatus = 'valid';
          continue;
        }
      }
      // Address changed or cache invalid → fall through to re-validate
    }

    // 2. Validate original Tokko coords
    const validation = validateCoordinates(prop.geo_lat, prop.geo_long);

    if (validation.isValid) {
      // Valid coords → cache as tokko_original
      prop._geoStatus = 'valid';
      await upsertCachedCoord({
        tokko_id: tokkoId,
        original_lat: origLat,
        original_lng: origLng,
        corrected_lat: validation.lat,
        corrected_lng: validation.lng,
        correction_source: 'tokko_original',
        is_imprecise: false,
        address_query: prop.address,
      });
      continue;
    }

    // 3. Invalid coords → attempt geocoding fallback
    const reason = getValidationReasonLabel(validation.reason);
    console.warn(`[Netze Geo] Property ${tokkoId} (${prop.address}): ${reason} — attempting geocode...`);

    // Extract neighborhood from Tokko location data
    const neighborhood = prop.location?.short_location?.split('|').pop()?.trim() ?? '';
    const city = prop.location?.full_location?.includes('Rosario') ? 'Rosario' :
                 prop.location?.full_location?.includes('Funes') ? 'Funes' :
                 prop.location?.full_location?.includes('Roldán') ? 'Roldán' : '';

    const geocoded = await geocodeAddress(prop.address, neighborhood, city);

    if (geocoded) {
      // Re-validate geocoded coords
      const geoValidation = validateCoordinates(String(geocoded.lat), String(geocoded.lng));

      if (geoValidation.isValid) {
        // Geocoding successful + valid
        prop.geo_lat = String(geocoded.lat);
        prop.geo_long = String(geocoded.lng);
        prop._geoStatus = 'valid';
        corrections.push(`✅ ${tokkoId} "${prop.address}": geocoded to [${geocoded.lat}, ${geocoded.lng}]`);

        await upsertCachedCoord({
          tokko_id: tokkoId,
          original_lat: origLat,
          original_lng: origLng,
          corrected_lat: geocoded.lat,
          corrected_lng: geocoded.lng,
          correction_source: 'mapbox_geocoded',
          is_imprecise: false,
          address_query: prop.address,
        });

        await logCorrection({
          tokko_id: tokkoId,
          original_lat: origLat,
          original_lng: origLng,
          corrected_lat: geocoded.lat,
          corrected_lng: geocoded.lng,
          reason,
          source: 'mapbox_geocoded',
          address: prop.address,
        });
        continue;
      }
    }

    // 4. Geocoding failed or still invalid → mark as imprecise
    prop._geoStatus = validation.reason === 'missing' || validation.reason === 'zero_coords' ? 'no_coords' : 'imprecise';
    prop.geo_lat = null;
    prop.geo_long = null;
    corrections.push(`⚠️ ${tokkoId} "${prop.address}": could not correct — ${reason}`);

    await upsertCachedCoord({
      tokko_id: tokkoId,
      original_lat: origLat,
      original_lng: origLng,
      corrected_lat: null,
      corrected_lng: null,
      correction_source: 'mapbox_geocoded',
      is_imprecise: true,
      address_query: prop.address,
    });

    await logCorrection({
      tokko_id: tokkoId,
      original_lat: origLat,
      original_lng: origLng,
      corrected_lat: null,
      corrected_lng: null,
      reason: `${reason} — geocoding failed`,
      source: 'failed',
      address: prop.address,
    });
  }

  if (corrections.length > 0) {
    console.info(`[Netze Geo] Coordinate corrections:\n${corrections.join('\n')}`);
  }
}
