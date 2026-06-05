// ============================================================
// lib/tokko.ts
// Integración con Tokko Broker API
// Base URL: https://www.tokkobroker.com/api/v1/
//
// Modo MOCK: se activa automáticamente cuando
// NEXT_PUBLIC_TOKKO_API_KEY está vacío. Se desactiva solo
// al agregar la key real en .env.local.
// ============================================================
import { validateCoordinates, getValidationReasonLabel } from './geoValidation';

const TOKKO_BASE_URL = 'https://www.tokkobroker.com/api/v1';

// ------------------------------------------------------------
// Tipos
// ------------------------------------------------------------

export interface PropertyPhoto {
  image: string;
  thumb: string;
  original: string;
  is_front_photo: boolean;
}

export interface PropertyType {
  id: number;
  name: string;
}

export interface OperationType {
  id: number;
  name: string;
  prices?: Array<{
    currency: string;
    price: number;
    period: string | null;
  }>;
}

export interface PropertyLocation {
  id: number;
  name: string;
  full_location: string;
  short_location: string;
  zip_code: string | null;
}

export interface PropertyBranch {
  address: string;
  phone: string | null;
  phone_area: string | null;
  alternative_phone: string | null;
  alternative_phone_area: string | null;
  email: string | null;
}

export interface PropertyProducer {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  cellphone: string | null;
}

/** Estado de validación geográfica de la propiedad */
export type GeoStatus = 'valid' | 'imprecise' | 'no_coords';

export interface Property {
  id: number;
  title: string;
  address: string;
  real_address: string | null;
  fake_address: string | null;
  publication_title: string | null;
  reference_code: string | null;
  public_url: string | null;
  geo_lat: string | null;
  geo_long: string | null;
  /** Precio en la moneda de la operación principal */
  price: number | null;
  currency: string | null;
  rooms: number | null;
  surface_total: number | null;
  surface_covered: number | null;
  roofed_surface: number | null;
  semiroofed_surface: number | null;
  unroofed_surface: number | null;
  front_measure: number | null;
  depth_measure: number | null;
  photos: PropertyPhoto[];
  property_type: PropertyType | null;
  operations: OperationType[];
  status: number;
  development_status: string | null;
  /** Texto descriptivo de la propiedad */
  description: string | null;
  rich_description: string | null;
  suite_amount: number | null;
  bathroom_amount: number | null;
  toilet_amount: number | null;
  parking_lot_amount: number | null;
  covered_parking_lot: number | null;
  uncovered_parking_lot: number | null;
  floors: number | null;
  floors_amount: number | null;
  age: number | null;
  orientation: string | null;
  property_condition: string | null;
  situation: string | null;
  disposition: string | null;
  credit_eligible: string | null;
  expenses: number | null;
  location: PropertyLocation | null;
  branch: PropertyBranch | null;
  producer: PropertyProducer | null;
  tags: Array<{ id: number; name: string }>;
  extra_attributes: Array<{ id: number; name: string; value: string; attribute_type: string }>;
  videos: Array<{ url: string; title: string }>;
  /** Resultado de la validación de coordenadas */
  _geoStatus?: GeoStatus;
  /** Clasificación de terreno: 'privado' (seguridad 24hs) o 'abierto' */
  _terrainClass?: 'privado' | 'abierto';
  /** Marca que indica que este objeto viene del endpoint /development/ */
  _isDevelopment?: boolean;
  /** Datos del emprendimiento al que pertenece esta unidad (campo 'development' de Tokko) */
  _development?: {
    id: number;
    name: string;
    type: { id: number; name: string; code: string } | null;
    address: string | null;
    geo_lat: string | null;
    geo_long: string | null;
    photos: PropertyPhoto[];
  } | null;
}


export interface TokkoMeta {
  total_count: number;
  limit: number;
  offset: number;
  next: string | null;
  previous: string | null;
}

export interface TokkoResponse {
  meta: TokkoMeta;
  objects: Property[];
}

// ------------------------------------------------------------
// Filtros disponibles (mapeados a parámetros Tokko)
// Los IDs dependen de la configuración de la agencia.
// Valores típicos de Tokko AR — verificar con /api/v1/property_type/
// ------------------------------------------------------------

/** IDs típicos de tipos de propiedad en Tokko AR */
export const PROPERTY_TYPE_IDS = {
  Lote:          1,   // Tokko name: "Terreno" en esta cuenta
  Departamento:  2,
  Casa:          3,
  Emprendimiento: 4,  // Reservado — cargar en Tokko para activar
  Campo:         5,
  Oficina:       7,
  Local:         8,
  'Depósito':    9,
  Cochera:      10,
  PH:           13,   // Tokko type "PH" = ID 13 en esta cuenta
} as const;

/** IDs típicos de tipos de operación */
export const OPERATION_TYPE_IDS = {
  Venta: 1,
  Alquiler: 2,
  'Alquiler Temporario': 3,
} as const;

/** Estados de desarrollo (para emprendimientos) */
export const DEVELOPMENT_STATUS_IDS = {
  Lanzamiento: 'launch',
  'En Ejecución': 'construction',
  'Próximo a Entregar': 'almost_complete',
  Terminados: 'complete',
} as const;

export interface PropertyFilters {
  /** Ej: [2] para Departamentos */
  property_types?: number[];
  /** Ej: [1] para Venta */
  operation_types?: number[];
  /** Estado de emprendimiento */
  development_status?: string;
  /** Precio mínimo */
  price_from?: number;
  /** Precio máximo */
  price_to?: number;
  /** Ambientes exactos (room_amount en Tokko) */
  rooms?: number;
  /** Ambientes mínimos (para "3 o más") */
  rooms_min?: number;
  /** Dormitorios exactos (suite_amount en Tokko) */
  suites?: number;
  /** Dormitorios mínimos */
  suites_min?: number;
  /** Sub-tipo textual: 'pasillo', 'loteo', 'edificio' */
  sub_type?: string;
  /** Clasificación de terreno: 'privado' o 'abierto' */
  terrain_class?: 'privado' | 'abierto';
}

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

function getApiKey(): string {
  // Prioridad: server-side (segura) → public (fallback)
  return process.env.TOKKO_API_KEY ?? process.env.NEXT_PUBLIC_TOKKO_API_KEY ?? '';
}

/**
 * Extrae el precio y moneda de la primera operación disponible.
 */
export function getPriceInfo(property: Property): { price: number | null; currency: string } {
  if (!property.operations || property.operations.length === 0) {
    return { price: property.price, currency: property.currency ?? 'USD' };
  }
  const op = property.operations[0];
  if (op.prices && op.prices.length > 0) {
    return { price: op.prices[0].price, currency: op.prices[0].currency };
  }
  return { price: null, currency: 'USD' };
}

/**
 * Formatea un precio para mostrar en cards y markers.
 * USD: "USD 150k" / "USD 1.2M" | ARS: "$85.000" / "$1M"
 */
export function formatPriceLabel(price: number | null, currency: string): string {
  if (!price || price === 0) return 'Consultar';
  // Formato igual a Tokko: separador de miles con punto, sin abreviar
  // Ej: USD 34.000 | USD 690.000 | $ 15.000.000
  const formatted = price.toLocaleString('es-AR'); // 34.000 / 690.000
  const isUSD = currency === 'USD' || currency === 'U$S' || currency === 'US$';
  return isUSD ? `USD ${formatted}` : `$ ${formatted}`;
}



/**
 * Obtiene la foto principal de una propiedad.
 */
export function getFrontPhoto(property: Property): string {
  if (!property.photos || property.photos.length === 0) {
    return '/placeholder-property.svg';
  }
  const front = property.photos.find((p) => p.is_front_photo);
  return front?.image ?? property.photos[0].image;
}

// ------------------------------------------------------------
// getProperties — búsqueda con filtros
// Endpoint: GET /property/search/?key=KEY&data=JSON&limit=20&offset=N
// Fallback: mock data si no hay API key configurada
// ------------------------------------------------------------

export async function getProperties(
  filters: PropertyFilters = {},
  offset: number = 0,
  limit: number = 20,
  options?: { skipGeoValidation?: boolean }
): Promise<TokkoResponse> {
  const key = getApiKey();

  // ── MODO MOCK ──────────────────────────────────────────────
  if (!key) {
    console.info('[Netze] TOKKO_API_KEY no configurada — usando datos de ejemplo.');
    const { getMockProperties } = await import('./mockData');
    const base = getMockProperties(0, 999);
    let filtered = base.objects;
    if (filters.property_types && filters.property_types.length > 0) {
      filtered = filtered.filter((p) =>
        p.property_type ? filters.property_types!.includes(p.property_type.id) : false
      );
    }
    if (filters.operation_types && filters.operation_types.length > 0) {
      filtered = filtered.filter((p) =>
        p.operations.some((op) => filters.operation_types!.includes(op.id))
      );
    }
    if (filters.development_status) {
      filtered = filtered.filter((p) => p.development_status === filters.development_status);
    }
    const paginated = filtered.slice(offset, offset + limit);
    return {
      meta: { total_count: filtered.length, limit, offset, next: null, previous: null },
      objects: paginated,
    };
  }
  // ── FIN MODO MOCK ──────────────────────────────────────────

  // Usamos /property/ (listado simple) en lugar de /property/search/
  // porque search/ requiere current_localization_id que es interno de Tokko.
  // El filtro geográfico lo aplica el frontend via bounding box del mapa.
  const params = new URLSearchParams({
    key,
    format: 'json',
    lang: 'es_ar',
    limit: String(limit),
    offset: String(offset),
  });

  // Filtros por tipo de operación: operation_id
  if (filters.operation_types && filters.operation_types.length > 0) {
    params.set('operation_id', String(filters.operation_types[0]));
  }
  // Filtros por tipo de propiedad: type
  // IMPORTANTE: Tokko /property/ solo acepta UN valor de type.
  // Si hay múltiples (ej: Terrenos = Lote+Barrio Cerrado), NO enviar
  // el param y filtrar client-side en page.tsx.
  // EXCEPCIÓN: sub_type 'pasillo' → en Tokko se carga como PH (tipo propio),
  // NO enviamos type=2 (Departamento) o no llegaría ningún PH.
  const skipTypeFilter =
    filters.sub_type === 'pasillo' ||
    (filters.property_types?.includes(PROPERTY_TYPE_IDS.Emprendimiento) ?? false);
  if (!skipTypeFilter && filters.property_types && filters.property_types.length === 1) {
    params.set('type', String(filters.property_types[0]));
  }
  if (filters.development_status) {
    params.set('development_status', filters.development_status);
  }
  if (typeof filters.price_from === 'number') params.set('price_from', String(filters.price_from));
  if (typeof filters.price_to   === 'number') params.set('price_to',   String(filters.price_to));
  // NO enviar room_amount a la API — Tokko puede no soportarlo bien.
  // El filtro de rooms/rooms_min se aplica client-side en page.tsx

  const url = `${TOKKO_BASE_URL}/property/?${params.toString()}`;
  console.info('[Netze] Tokko URL:', url);

  const res = await fetch(url, { next: { revalidate: 30 } });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error(`[Netze] Tokko API error: ${res.status} | ${body.slice(0, 200)}`);
    throw new Error(`Tokko API error: ${res.status}`);
  }

  // La respuesta de /property/ usa campos ligeramente distintos a /property/search/.
  // Normalizamos para que el resto de la app los consuma igual.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = await res.json() as { meta: TokkoMeta; objects: any[] };

  const objects: Property[] = (raw.objects ?? []).map((p) => ({
    id:               p.id,
    title:            p.publication_title ?? p.address ?? '',
    address:          p.address ?? '',
    geo_lat:          p.geo_lat ?? null,
    geo_long:         p.geo_long ?? null,
    price:            p.operations?.[0]?.prices?.[0]?.price ?? null,
    currency:         p.operations?.[0]?.prices?.[0]?.currency ?? 'USD',
    rooms:            p.room_amount ?? null,
    surface_total:    p.total_surface ?? p.surface ?? null,
    surface_covered:  p.roofed_surface ?? null,
    photos:           p.photos ?? [],
    property_type:    p.type ? { id: p.type.id ?? p.type, name: p.type.name ?? '' } : null,
    // Emprendimiento al que pertenece esta unidad (viene en el campo 'development' de Tokko)
    _development: p.development && typeof p.development === 'object' && p.development.id ? {
      id:      p.development.id,
      name:    p.development.name ?? p.development.publication_title ?? '',
      type:    p.development.type ?? null,
      address: p.development.address ?? null,
      geo_lat: p.development.geo_lat ?? null,
      geo_long: p.development.geo_long ?? null,
      photos:  p.development.photos ?? [],
    } : null,
    // Normalizar operations: /property/ usa operation_id en vez de id
    operations: (p.operations ?? []).map((op: { operation_id?: number; id?: number; operation_type?: string; name?: string; prices?: unknown[] }) => ({
      id:     op.operation_id ?? op.id ?? 0,
      name:   op.operation_type ?? op.name ?? '',
      prices: op.prices ?? [],
    })),
    status:              p.status ?? 2,
    development_status:  p.development_status ?? null,
    description:         p.description ?? null,
    rich_description:    p.rich_description ?? null,
    suite_amount:        p.suite_amount ?? null,
    bathroom_amount:     p.bathroom_amount ?? null,
    toilet_amount:       p.toilet_amount ?? null,
    parking_lot_amount:  p.parking_lot_amount ?? null,
    covered_parking_lot: p.covered_parking_lot ?? null,
    uncovered_parking_lot: p.uncovered_parking_lot ?? null,
    floors:              p.floors_amount ?? null,
    floors_amount:       p.floors_amount ?? null,
    age:                 p.age ?? null,
    orientation:         p.orientation ?? null,
    property_condition:  p.property_condition ?? null,
    situation:           p.situation ?? null,
    disposition:         p.disposition ?? null,
    credit_eligible:     p.credit_eligible ?? null,
    expenses:            p.expenses ?? null,
    real_address:        p.real_address ?? null,
    fake_address:        p.fake_address ?? null,
    publication_title:   p.publication_title ?? null,
    reference_code:      p.reference_code ?? null,
    public_url:          p.public_url ?? null,
    roofed_surface:      p.roofed_surface ? parseFloat(p.roofed_surface) : null,
    semiroofed_surface:  p.semiroofed_surface ? parseFloat(p.semiroofed_surface) : null,
    unroofed_surface:    p.unroofed_surface ? parseFloat(p.unroofed_surface) : null,
    front_measure:       p.front_measure ? parseFloat(p.front_measure) : null,
    depth_measure:       p.depth_measure ? parseFloat(p.depth_measure) : null,
    location:            p.location ?? null,
    branch:              p.branch ?? null,
    producer:            p.producer ?? null,
    tags:                p.tags ?? [],
    extra_attributes:    p.extra_attributes ?? [],
    videos:              p.videos ?? [],
  })).map((prop) => {
    // Clasificar terrenos: Lote (1) y Barrio Cerrado (13)
    // Solo terrenos (tipo 1) se clasifican como privado/abierto.
    // NO incluir PH (tipo 13) que en esta cuenta tiene id 13.
    const TERRAIN_TYPE_IDS = [PROPERTY_TYPE_IDS.Lote];
    if (prop.property_type?.id != null && TERRAIN_TYPE_IDS.includes(prop.property_type.id as typeof TERRAIN_TYPE_IDS[number])) {
      const tagNames = prop.tags?.map((t) => t.name ?? '') ?? [];
      const hasSeguridad24 = tagNames.some((name) => {
        const n = name.toLowerCase();
        return (n.includes('seguridad') && n.includes('24')) ||
               n.includes('guardia') ||
               n.includes('vigilancia');
      });
      // También detectar en la descripción
      const descLower = (prop.description ?? '').toLowerCase();
      const hasInDesc = descLower.includes('barrio privado') || descLower.includes('barrio cerrado');
      prop._terrainClass = (hasSeguridad24 || hasInDesc) ? 'privado' : 'abierto';
      console.info(`[Netze Terrain] id=${prop.id} type=${prop.property_type?.id} tags=[${tagNames.join(', ')}] => ${prop._terrainClass}`);
    }
    return prop;
  });

  // ── Validación + corrección de coordenadas ────────────────
  // Sistema completo: cache Supabase → validación bbox/río → 
  // fallback geocoding Mapbox → logging
  // SKIP: cuando el caller no necesita coordenadas (ej: admin dashboard)
  if (!options?.skipGeoValidation) {
    try {
      const { validateAndCorrectCoordinates } = await import('./geoCorrection');
      await validateAndCorrectCoordinates(objects);
    } catch (err) {
      // Fallback: si geoCorrection falla, aplicar validación básica inline
      console.error('[Netze Geo] geoCorrection service error, falling back to basic validation:', err);
      for (const prop of objects) {
        const v = validateCoordinates(prop.geo_lat, prop.geo_long);
        if (v.isValid) {
          prop._geoStatus = 'valid';
        } else {
          prop._geoStatus = v.reason === 'missing' || v.reason === 'zero_coords' ? 'no_coords' : 'imprecise';
          prop.geo_lat = null;
          prop.geo_long = null;
          console.warn(`[Netze Geo] ${prop.id} (${prop.address}): ${getValidationReasonLabel(v.reason)}`);
        }
      }
    }
  }

  console.info(`[Netze] Tokko devolvió ${raw.meta?.total_count ?? '?'} propiedades`);

  // ── Filtrado client-side de operación ──────────────────────
  // Tokko no filtra confiablemente por operation_id en /property/,
  // así que re-filtramos aquí para garantizar resultados correctos.
  let finalObjects = objects;
  if (filters.operation_types && filters.operation_types.length > 0) {
    finalObjects = finalObjects.filter((p) =>
      p.operations.some((op) => filters.operation_types!.includes(op.id))
    );
  }
  // Tokko tampoco filtra confiablemente por type en /property/.
  // EXCEPCIÓN: sub_type 'pasillo' → PH tiene su propio type ID,
  // no aplicar el filtro aquí; page.tsx lo filtrará por property_type.name === 'PH'.
  // EXCEPCIÓN: Emprendimiento (type 4) → las unidades se detectan por campo _development,
  // no por property_type.id. Saltear el filtro para que lleguen todos.
  const isEmprendimientoFilter = filters.property_types?.includes(PROPERTY_TYPE_IDS.Emprendimiento) ?? false;
  if (filters.property_types && filters.property_types.length > 0 && filters.sub_type !== 'pasillo' && !isEmprendimientoFilter) {
    finalObjects = finalObjects.filter((p) =>
      p.property_type ? filters.property_types!.includes(p.property_type.id) : false
    );
  }

  if (filters.sub_type === 'pasillo') {
    const typesSeen = [...new Set(finalObjects.map(p => `${p.property_type?.id}:${p.property_type?.name}`))];
    console.info('[Netze Pasillo] Tipos recibidos de Tokko:', typesSeen);
    console.info('[Netze Pasillo] Total props antes de filtro PH:', finalObjects.length);
  }

  return {
    meta: { ...raw.meta, total_count: finalObjects.length },
    objects: finalObjects,
  };
}

// ------------------------------------------------------------
// getProperty — detalle de una propiedad individual
// Endpoint: GET /property/{id}/?key=KEY&format=json
// Fallback: mock data si no hay API key configurada
// ------------------------------------------------------------

export async function getProperty(id: string | number): Promise<Property> {
  const key = getApiKey();

  // ── MODO MOCK ──────────────────────────────────────────────
  if (!key) {
    const { getMockProperty } = await import('./mockData');
    const found = getMockProperty(id);
    if (!found) throw new Error(`Mock: propiedad ${id} no encontrada`);
    return found;
  }
  // ── FIN MODO MOCK ──────────────────────────────────────────

  const url = `${TOKKO_BASE_URL}/property/${id}/?key=${key}&format=json&lang=es_ar`;
  const res = await fetch(url, { next: { revalidate: 120 } });
  if (!res.ok) throw new Error(`Tokko API error fetching property ${id}: ${res.status} ${res.statusText}`);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = await res.json() as any;

  // Mapear los campos del API Tokko al tipo Property normalizado.
  // IMPORTANTE: el endpoint /property/{id}/ devuelve nombres distintos a los de /property/ (lista):
  //   total_surface  → surface_total
  //   room_amount    → rooms
  //   type           → property_type
  //   operation_id   → operations[].id
  return {
    id:               p.id,
    title:            p.publication_title ?? p.address ?? '',
    address:          p.address ?? '',
    real_address:     p.real_address ?? null,
    fake_address:     p.fake_address ?? null,
    publication_title: p.publication_title ?? null,
    reference_code:   p.reference_code ?? null,
    public_url:       p.public_url ?? null,
    geo_lat:          p.geo_lat ?? null,
    geo_long:         p.geo_long ?? null,
    price:            p.operations?.[0]?.prices?.[0]?.price ?? null,
    currency:         p.operations?.[0]?.prices?.[0]?.currency ?? 'USD',
    rooms:            p.room_amount ?? p.rooms ?? null,
    // Superficies: Tokko usa 'total_surface' en API, nosotros usamos 'surface_total'
    surface_total:    p.total_surface  ? parseFloat(p.total_surface)  : (p.surface ? parseFloat(p.surface) : null),
    surface_covered:  p.roofed_surface ? parseFloat(p.roofed_surface) : null,
    roofed_surface:   p.roofed_surface ? parseFloat(p.roofed_surface) : null,
    semiroofed_surface: p.semiroofed_surface ? parseFloat(p.semiroofed_surface) : null,
    unroofed_surface: p.unroofed_surface ? parseFloat(p.unroofed_surface) : null,
    front_measure:    p.front_measure ? parseFloat(p.front_measure) : null,
    depth_measure:    p.depth_measure ? parseFloat(p.depth_measure) : null,
    photos:           p.photos ?? [],
    // Tokko puede usar 'type' o 'property_type' según el endpoint
    property_type:    (p.type ?? p.property_type)
                        ? { id: (p.type ?? p.property_type).id, name: (p.type ?? p.property_type).name ?? '' }
                        : null,
    operations: (p.operations ?? []).map((op: { operation_id?: number; id?: number; operation_type?: string; name?: string; prices?: unknown[] }) => ({
      id:     op.operation_id ?? op.id ?? 0,
      name:   op.operation_type ?? op.name ?? '',
      prices: op.prices ?? [],
    })),
    status:              p.status ?? 2,
    development_status:  p.development_status ?? null,
    description:         p.description ?? null,
    rich_description:    p.rich_description ?? null,
    suite_amount:        p.suite_amount ?? null,
    bathroom_amount:     p.bathroom_amount ?? null,
    toilet_amount:       p.toilet_amount ?? null,
    parking_lot_amount:  p.parking_lot_amount ?? null,
    covered_parking_lot: p.covered_parking_lot ?? null,
    uncovered_parking_lot: p.uncovered_parking_lot ?? null,
    floors:              p.floors_amount ?? null,
    floors_amount:       p.floors_amount ?? null,
    age:                 p.age ?? null,
    orientation:         p.orientation ?? null,
    property_condition:  p.property_condition ?? null,
    situation:           p.situation ?? null,
    disposition:         p.disposition ?? null,
    credit_eligible:     p.credit_eligible ?? null,
    expenses:            p.expenses ?? null,
    location:            p.location ?? null,
    branch:              p.branch ?? null,
    producer:            p.producer ?? null,
    tags:                p.tags ?? [],
    extra_attributes:    p.extra_attributes ?? [],
    videos:              p.videos ?? [],
  };
}

// ------------------------------------------------------------
// getPropertyTypes — lista todos los tipos disponibles en la cuenta
// Útil para verificar los IDs reales de la agencia
// Endpoint: GET /property_type/?key=KEY&format=json
// ------------------------------------------------------------

export async function getPropertyTypes(): Promise<PropertyType[]> {
  const key = getApiKey();
  const url = `${TOKKO_BASE_URL}/property_type/?key=${key}&format=json`;

  const res = await fetch(url, { next: { revalidate: 3600 } });

  if (!res.ok) {
    throw new Error(`Tokko API error fetching property types: ${res.status}`);
  }

  const data = await res.json();
  return data.objects ?? data;
}

// ------------------------------------------------------------
// Development — emprendimientos inmobiliarios
// Endpoint: GET /development/?key=KEY&format=json&lang=es_ar
// Los emprendimientos viven en un endpoint propio, separado de /property/
// ------------------------------------------------------------

export interface Development {
  id: number;
  name: string;
  publication_title: string | null;
  address: string;
  geo_lat: string | null;
  geo_long: string | null;
  photos: PropertyPhoto[];
  description: string | null;
  development_status: string | null;
  location: PropertyLocation | null;
  tags: Array<{ id: number; name: string }>;
  property_types: PropertyType[];
  operations: OperationType[];
  is_starred_on_web: boolean;
  minimum_price: number | null;
  currency: string | null;
  total_surface: number | null;
  units?: Property[]; // unidades del emprendimiento (solo en detalle)
}

/**
 * Normaliza un Development al formato Property para que se muestre
 * en el mapa y la lista principal con el resto de las propiedades.
 */
export function developmentToProperty(d: Development): Property {
  return {
    id:                 d.id,
    title:              d.publication_title ?? d.name ?? d.address,
    address:            d.address,
    real_address:       d.address,
    fake_address:       null,
    publication_title:  d.publication_title ?? d.name ?? null,
    reference_code:     null,
    public_url:         null,
    geo_lat:            d.geo_lat,
    geo_long:           d.geo_long,
    price:              d.minimum_price,
    currency:           d.currency ?? 'USD',
    rooms:              null,
    surface_total:      d.total_surface,
    surface_covered:    null,
    roofed_surface:     null,
    semiroofed_surface: null,
    unroofed_surface:   null,
    front_measure:      null,
    depth_measure:      null,
    photos:             d.photos,
    property_type:      { id: PROPERTY_TYPE_IDS.Emprendimiento, name: 'Emprendimiento' },
    operations:         d.operations.map((op) => ({
      // Tokko /development/ puede usar 'operation_type' en lugar de 'name'
      id:     (op as Record<string, unknown> & { operation_id?: number }).operation_id ?? op.id ?? 0,
      name:   (op as Record<string, unknown> & { operation_type?: string }).operation_type ?? op.name ?? 'Venta',
      prices: op.prices ?? [],
    })),
    status:              2,
    development_status:  d.development_status,
    description:         d.description,
    rich_description:    null,
    suite_amount:        null,
    bathroom_amount:     null,
    toilet_amount:       null,
    parking_lot_amount:  null,
    covered_parking_lot: null,
    uncovered_parking_lot: null,
    floors:              null,
    floors_amount:       null,
    age:                 null,
    orientation:         null,
    property_condition:  null,
    situation:           null,
    disposition:         null,
    credit_eligible:     null,
    expenses:            null,
    location:            d.location,
    branch:              null,
    producer:            null,
    tags:                d.tags ?? [],
    extra_attributes:    [],
    videos:              [],
    _isDevelopment:      true,
  };
}

/**
 * Obtiene la lista de emprendimientos.
 * Endpoint: GET /development/?key=KEY&format=json&lang=es_ar
 */
export async function getDevelopments(limit = 50): Promise<Development[]> {
  const key = getApiKey();
  if (!key) {
    console.info('[Netze] getDevelopments: sin API key, retornando array vacío');
    return [];
  }

  const params = new URLSearchParams({
    key,
    format: 'json',
    lang:   'es_ar',
    limit:  String(limit),
  });

  const url = `${TOKKO_BASE_URL}/development/?${params.toString()}`;
  console.info('[Netze] Tokko Developments URL:', url);

  const res = await fetch(url, { next: { revalidate: 120 } });
  if (!res.ok) {
    console.error(`[Netze] getDevelopments error: ${res.status}`);
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = await res.json() as { meta?: TokkoMeta; objects?: any[] } | any[];
  // Tokko puede devolver un array directo o {meta, objects}
  const objects = Array.isArray(raw) ? raw : (raw.objects ?? []);

  console.info(`[Netze] Tokko devolvió ${objects.length} emprendimientos`);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return objects.map((d: any): Development => ({
    id:                d.id,
    name:              d.name ?? d.publication_title ?? '',
    publication_title: d.publication_title ?? d.name ?? null,
    address:           d.address ?? '',
    geo_lat:           d.geo_lat ?? null,
    geo_long:          d.geo_long ?? null,
    photos:            d.photos ?? [],
    description:       d.description ?? null,
    development_status: d.development_status ?? null,
    location:          d.location ?? null,
    tags:              d.tags ?? [],
    property_types:    d.property_types ?? [],
    operations:        d.operations ?? [],
    is_starred_on_web: d.is_starred_on_web ?? false,
    minimum_price:     d.minimum_price ?? d.price ?? null,
    currency:          d.currency ?? 'USD',
    total_surface:     d.total_surface ? parseFloat(d.total_surface) : null,
  }));
}

/**
 * Obtiene el detalle de un emprendimiento por ID.
 * Endpoint: GET /development/{id}/?key=KEY&format=json
 */
export async function getDevelopment(id: string | number): Promise<Development | null> {
  const key = getApiKey();
  if (!key) return null;

  const url = `${TOKKO_BASE_URL}/development/${id}/?key=${key}&format=json&lang=es_ar`;
  const res = await fetch(url, { next: { revalidate: 120 } });
  if (!res.ok) {
    console.error(`[Netze] getDevelopment ${id} error: ${res.status}`);
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = await res.json() as any;
  return {
    id:                d.id,
    name:              d.name ?? d.publication_title ?? '',
    publication_title: d.publication_title ?? d.name ?? null,
    address:           d.address ?? '',
    geo_lat:           d.geo_lat ?? null,
    geo_long:          d.geo_long ?? null,
    photos:            d.photos ?? [],
    description:       d.description ?? null,
    development_status: d.development_status ?? null,
    location:          d.location ?? null,
    tags:              d.tags ?? [],
    property_types:    d.property_types ?? [],
    operations:        d.operations ?? [],
    is_starred_on_web: d.is_starred_on_web ?? false,
    minimum_price:     d.minimum_price ?? d.price ?? null,
    currency:          d.currency ?? 'USD',
    total_surface:     d.total_surface ? parseFloat(d.total_surface) : null,
    units:             d.units ?? d.objects ?? [],
  };
}
