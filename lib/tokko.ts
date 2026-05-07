// ============================================================
// lib/tokko.ts
// Integración con Tokko Broker API
// Base URL: https://www.tokkobroker.com/api/v1/
//
// Modo MOCK: se activa automáticamente cuando
// NEXT_PUBLIC_TOKKO_API_KEY está vacío. Se desactiva solo
// al agregar la key real en .env.local.
// ============================================================

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
  Departamento: 2,
  Casa: 3,
  Lote: 1,
  Oficina: 7,
  Local: 8,
  'Barrio Cerrado': 13,
  Emprendimiento: 4,
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
  /** Ambientes mínimos */
  rooms?: number;
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
  limit: number = 20
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
  if (filters.property_types && filters.property_types.length > 0) {
    params.set('type', String(filters.property_types[0]));
  }
  if (filters.development_status) {
    params.set('development_status', filters.development_status);
  }
  if (typeof filters.price_from === 'number') params.set('price_from', String(filters.price_from));
  if (typeof filters.price_to   === 'number') params.set('price_to',   String(filters.price_to));
  if (typeof filters.rooms      === 'number') params.set('room_amount', String(filters.rooms));

  const url = `${TOKKO_BASE_URL}/property/?${params.toString()}`;
  console.info('[Netze] Tokko URL:', url);

  const res = await fetch(url, { next: { revalidate: 60 } });
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
    property_type:    p.type ? { id: p.type, name: '' } : null,
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
  }));

  console.info(`[Netze] Tokko devolvió ${raw.meta?.total_count ?? '?'} propiedades`);

  // ── Filtrado client-side de operación ──────────────────────
  // Tokko no filtra confiablemente por operation_id en /property/,
  // así que re-filtramos aquí para garantizar resultados correctos.
  let finalObjects = objects;
  if (filters.operation_types && filters.operation_types.length > 0) {
    finalObjects = objects.filter((p) =>
      p.operations.some((op) => filters.operation_types!.includes(op.id))
    );
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
  return res.json() as Promise<Property>;
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
