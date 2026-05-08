'use client';
// ============================================================
// app/page.tsx
// IMPORTANTE: MapSection NO es un componente interno —
// el mapa se renderiza inline para evitar re-mounts.
// ============================================================
import { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Property, PropertyFilters } from '@/lib/tokko';
import SmartFilter from '@/components/SmartFilter';
import PropertyList from '@/components/PropertyList';
import Navbar from '@/components/Navbar';
import { useTheme } from '@/lib/theme';
import type { BoundingBox } from '@/components/MapView';

const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3 text-gray-400">
        <div className="w-10 h-10 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin" />
        <span className="text-sm">Cargando mapa…</span>
      </div>
    </div>
  ),
});

const PAGE_SIZE = 20;

function filterByBbox(properties: Property[], bbox: BoundingBox | null): Property[] {
  if (!bbox) return properties;
  return properties.filter((p) => {
    if (!p.geo_lat || !p.geo_long) return false;
    const lat = parseFloat(p.geo_lat);
    const lng = parseFloat(p.geo_long);
    if (isNaN(lat) || isNaN(lng)) return false;
    return lat <= bbox.north && lat >= bbox.south && lng <= bbox.east && lng >= bbox.west;
  });
}

export default function HomePage() {
  const { isDark } = useTheme();
  const [filters,      setFilters]      = useState<PropertyFilters>({});
  const [allProps,     setAllProps]     = useState<Property[]>([]);
  const [loading,      setLoading]      = useState(false);
  const [offset,       setOffset]       = useState(0);
  const [totalCount,   setTotalCount]   = useState(0);
  const [bbox,         setBbox]         = useState<BoundingBox | null>(null);
  const [selectedId,   setSelectedId]   = useState<number | null>(null);
  const [mobileTab,    setMobileTab]    = useState<'map' | 'list'>('map');
  const [isMock,       setIsMock]       = useState(false);
  const [flyToLoc,     setFlyToLoc]     = useState<[number, number] | null>(null);
  const [featuredIds,  setFeaturedIds]  = useState<number[]>([]);

  const lastKey = useRef('');

  // ── Fetch ──────────────────────────────────────────────
  const fetchProperties = useCallback(async (
    f: PropertyFilters,
    o: number,
    append = false
  ) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        offset: String(o), limit: String(PAGE_SIZE),
        filters: JSON.stringify(f),
      });
      const data = await fetch(`/api/propiedades?${params}`).then((r) => r.json());
      setIsMock(data._source === 'mock');
      setTotalCount(data.meta?.total_count ?? 0);
      setAllProps((prev) => append ? [...prev, ...data.objects] : (data.objects ?? []));
      setOffset(o + (data.objects?.length ?? 0));
    } catch (e) {
      console.error('[Netze]', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const key = JSON.stringify(filters);
    if (key === lastKey.current) return;
    lastKey.current = key;
    setOffset(0);
    setAllProps([]);
    setSelectedId(null);
    fetchProperties(filters, 0, false);
  }, [filters, fetchProperties]);

  // Cargar IDs de destacados una sola vez
  useEffect(() => {
    fetch('/api/admin/settings?key=featured_ids')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data.value)) setFeaturedIds(data.value); })
      .catch(() => {});
  }, []);

  // Propiedades visibles con destacadas primero
  const visibleProps = filterByBbox(allProps, bbox).sort((a, b) => {
    const aFeat = featuredIds.includes(a.id) ? 0 : 1;
    const bFeat = featuredIds.includes(b.id) ? 0 : 1;
    return aFeat - bFeat;
  });
  const hasMore = allProps.length < totalCount;

  function handleMapSelect(id: number) {
    setSelectedId(id);
    setMobileTab('list');
  }


  // ── Render ─────────────────────────────────────────────
  return (
    <div className="flex flex-col h-dvh overflow-hidden">

      {/* Navbar con buscador integrado */}
      <Navbar onLocationSelect={(center) => { setFlyToLoc(center); setTimeout(() => setFlyToLoc(null), 100); }} />

      {/* ─────────────── DESKTOP: split 60/40 ─────────────── */}
      <div className="hidden md:flex flex-1 overflow-hidden pt-14">

        {/* Mapa */}
        <div className="flex-[6] relative">
          {/* MapView: nunca se re-monta, sus props cambian reactivamente */}
          <MapView
            properties={allProps}
            selectedId={selectedId}
            isDark={isDark}
            onBoundsChange={setBbox}
            onPropertySelect={handleMapSelect}
            flyToLocation={flyToLoc}
          />

          {/* SmartFilter sobre el mapa */}
          <SmartFilter
            filters={filters}
            onFilterChange={setFilters}
            resultCount={visibleProps.length}
          />

          {/* Badge mock */}
          {isMock && (
            <div className="absolute bottom-10 left-3 z-20 pointer-events-none">
              <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm border border-amber-200 text-amber-700 text-[10px] font-medium px-2.5 py-1.5 rounded-full shadow-sm">
                <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse shrink-0" />
                Datos de ejemplo
              </div>
            </div>
          )}
        </div>

        {/* Lista */}
        <div className="flex-[4] border-l border-gray-100 overflow-hidden flex flex-col bg-white">
          <PropertyList
            properties={visibleProps}
            selectedId={selectedId}
            loading={loading}
            hasMore={hasMore}
            featuredIds={featuredIds}
            onSelect={setSelectedId}
            onLoadMore={() => fetchProperties(filters, offset, true)}
          />
        </div>
      </div>

      {/* ─────────────── MOBILE: fullscreen + tab ─────────── */}
      <div className="flex md:hidden flex-1 overflow-hidden relative pt-14">

        {/* Mapa — siempre montado (z-index controla visibilidad) */}
        <div
          className="absolute inset-0"
          style={{ zIndex: mobileTab === 'map' ? 10 : 1, pointerEvents: mobileTab === 'map' ? 'auto' : 'none' }}
        >
          <MapView
            properties={allProps}
            selectedId={selectedId}
            isDark={isDark}
            onBoundsChange={setBbox}
            onPropertySelect={handleMapSelect}
            flyToLocation={flyToLoc}
          />

          {/* SmartFilter sobre el mapa */}
          <SmartFilter
            filters={filters}
            onFilterChange={setFilters}
            resultCount={visibleProps.length}
          />

          {/* Badge mock */}
          {isMock && (
            <div className="absolute bottom-20 left-3 z-20 pointer-events-none">
              <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm border border-amber-200 text-amber-700 text-[10px] font-medium px-2.5 py-1.5 rounded-full shadow-sm">
                <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse shrink-0" />
                Datos de ejemplo
              </div>
            </div>
          )}

          {/* Toggle Mapa → Lista */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
            <div className="flex bg-gray-900 rounded-full shadow-xl overflow-hidden">
              <button
                className="flex items-center gap-1.5 px-5 py-2.5 text-[13px] font-semibold text-white"
                disabled
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c-.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
                </svg>
                Mapa
              </button>
              <span className="w-px bg-gray-700 my-2" />
              <button
                onClick={() => setMobileTab('list')}
                className="flex items-center gap-1.5 px-5 py-2.5 text-[13px] font-semibold text-gray-400 hover:text-white transition"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
                Lista
                {visibleProps.length > 0 && (
                  <span className="ml-0.5 bg-white text-gray-900 text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                    {visibleProps.length > 9 ? '9+' : visibleProps.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Lista — encima cuando está activa */}
        <div
          className="absolute inset-0 bg-gray-50 overflow-hidden flex flex-col"
          style={{ zIndex: mobileTab === 'list' ? 10 : 1, pointerEvents: mobileTab === 'list' ? 'auto' : 'none' }}
        >
          <PropertyList
            properties={visibleProps}
            selectedId={selectedId}
            loading={loading}
            hasMore={hasMore}
            featuredIds={featuredIds}
            onSelect={setSelectedId}
            onLoadMore={() => fetchProperties(filters, offset, true)}
          />

          {/* Botón volver al mapa */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
            <button
              onClick={() => setMobileTab('map')}
              className="flex items-center gap-1.5 bg-gray-900 text-white text-[13px] font-semibold px-5 py-2.5 rounded-full shadow-xl"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c-.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
              </svg>
              Ver mapa
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
