// ============================================================
// lib/geoValidation.ts — Validación de coordenadas para Gran Rosario
// Bounding box + detección de puntos sobre el río Paraná
// ============================================================

// ── Bounding box del Gran Rosario (configurable) ─────────────
// Incluye: Rosario, Funes, Roldán, Alvear, Capitán Bermúdez,
// Granadero Baigorria, Pérez, Soldini, Villa Gobernador Gálvez, Ibarlucea
export const GRAN_ROSARIO_BBOX = {
  latMin: -33.15,
  latMax: -32.75,
  lngMin: -60.95,
  lngMax: -60.45,
} as const;

// ── Polígono aproximado del río Paraná y zona de islas ───────
// Definido como array de [lng, lat] (formato GeoJSON/Mapbox).
// Cubre el cauce principal + islas desde Granadero Baigorria hasta
// al sur de Villa Gobernador Gálvez.
// NOTA: polígono conservador — prefiere dejar pasar un falso negativo
// que bloquear una propiedad legítima en la costanera.
const PARANA_RIVER_POLYGON: [number, number][] = [
  // Costa oeste (lado ciudad) — de norte a sur
  [-60.6550, -32.7800],  // Norte, cerca de Puerto San Martín
  [-60.6700, -32.8200],  // Granadero Baigorria
  [-60.6650, -32.8500],  // Norte Rosario
  [-60.6500, -32.8800],  // Parque de la Bandera norte
  [-60.6380, -32.9100],  // Alto Rosario / Puerto Norte
  [-60.6320, -32.9300],  // Parque España
  [-60.6280, -32.9450],  // Centro / Monumento a la Bandera
  [-60.6250, -32.9600],  // Barrio Martín
  [-60.6230, -32.9800],  // Sur, zona portuaria
  [-60.6200, -33.0000],  // Sarandí
  [-60.6150, -33.0300],  // Villa Gobernador Gálvez
  [-60.6100, -33.0700],  // Sur extremo
  [-60.6050, -33.1100],  // Límite sur
  // Costa este (lado islas/Entre Ríos) — de sur a norte
  [-60.4500, -33.1100],  // Islas sur
  [-60.4500, -33.0700],
  [-60.4500, -33.0300],
  [-60.4500, -33.0000],
  [-60.4500, -32.9600],
  [-60.4500, -32.9300],
  [-60.4500, -32.9000],
  [-60.4500, -32.8500],
  [-60.4500, -32.8200],
  [-60.4500, -32.7800],  // Islas norte
  // Cerrar polígono
  [-60.6550, -32.7800],
];

// ── Tipos ────────────────────────────────────────────────────

export type CoordValidationResult = {
  isValid: boolean;
  lat: number;
  lng: number;
  reason?: 'missing' | 'parse_error' | 'zero_coords' | 'outside_bbox' | 'over_water';
};

// ── Ray-casting: punto dentro de polígono ────────────────────
// Implementación del algoritmo de ray-casting para determinar
// si un punto está dentro de un polígono. No necesita dependencias.
function pointInPolygon(lng: number, lat: number, polygon: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];
    
    const intersect = ((yi > lat) !== (yj > lat)) &&
      (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

// ── Validación principal ─────────────────────────────────────

/**
 * Valida coordenadas de una propiedad contra el bbox del Gran Rosario
 * y el polígono del río Paraná.
 * 
 * @returns Resultado con flag isValid, coordenadas parseadas, y razón de fallo.
 */
export function validateCoordinates(
  geoLat: string | null | undefined,
  geoLng: string | null | undefined,
  bbox = GRAN_ROSARIO_BBOX,
): CoordValidationResult {
  // 1. Verificar que existan
  if (!geoLat || !geoLng || geoLat.trim() === '' || geoLng.trim() === '') {
    return { isValid: false, lat: 0, lng: 0, reason: 'missing' };
  }

  // 2. Parsear a número
  const lat = parseFloat(geoLat);
  const lng = parseFloat(geoLng);

  if (isNaN(lat) || isNaN(lng)) {
    return { isValid: false, lat: 0, lng: 0, reason: 'parse_error' };
  }

  // 3. Descartar 0,0 (default de Tokko cuando no geocodificó)
  if (lat === 0 && lng === 0) {
    return { isValid: false, lat, lng, reason: 'zero_coords' };
  }

  // 4. Verificar dentro del bounding box del Gran Rosario
  if (lat < bbox.latMin || lat > bbox.latMax || lng < bbox.lngMin || lng > bbox.lngMax) {
    return { isValid: false, lat, lng, reason: 'outside_bbox' };
  }

  // 5. Verificar que NO caiga sobre el río Paraná / islas
  if (pointInPolygon(lng, lat, PARANA_RIVER_POLYGON)) {
    return { isValid: false, lat, lng, reason: 'over_water' };
  }

  return { isValid: true, lat, lng };
}

/**
 * Devuelve una etiqueta legible para la razón de fallo.
 */
export function getValidationReasonLabel(reason: CoordValidationResult['reason']): string {
  switch (reason) {
    case 'missing': return 'Sin coordenadas';
    case 'parse_error': return 'Error de formato en coordenadas';
    case 'zero_coords': return 'Coordenadas en 0,0 (sin geocodificar)';
    case 'outside_bbox': return 'Fuera del área metropolitana de Rosario';
    case 'over_water': return 'Ubicación sobre el río Paraná (imprecisa)';
    default: return 'Desconocido';
  }
}
