'use client';
// ============================================================
// app/page.tsx
// IMPORTANTE: MapSection NO es un componente interno —
// el mapa se renderiza inline para evitar re-mounts.
// ============================================================
import { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Property, PropertyFilters, getPriceInfo } from '@/lib/tokko';
import SmartFilter from '@/components/SmartFilter';
import PropertyList from '@/components/PropertyList';
import PropertyCard from '@/components/PropertyCard';
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
  const [mobileTab,    setMobileTabRaw]    = useState<'map' | 'list'>('map');
  const [isMock,       setIsMock]       = useState(false);
  const [flyToLoc,     setFlyToLoc]     = useState<[number, number] | null>(null);
  const [featuredIds,  setFeaturedIds]  = useState<number[]>([]);
  const [desktopView,  setDesktopView]  = useState<'map' | 'list'>('map');
  const [sortBy,       setSortBy]       = useState<'relevance' | 'price_asc' | 'price_desc'>('relevance');

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

  // Score computation for sorting
  function computeScore(p: Property): number {
    let s = 0;
    if (featuredIds.includes(p.id)) s += 50;
    const photoCount = (p as unknown as { photos?: unknown[] }).photos?.length ?? 0;
    if (photoCount >= 5) s += 20;
    else if (photoCount >= 3) s += 10;
    const { price } = getPriceInfo(p);
    if (price && price > 0) s += 15;
    if (p.description) s += 10;
    if (p.surface_total && p.surface_total > 0) s += 5;
    if (p.geo_lat && p.geo_long) s += 5;
    return s;
  }

  // ── Filtrado client-side (rooms_min, sub_type) ──────────
  // Tokko no soporta estos filtros, así que los aplicamos aquí
  const clientFilteredProps = allProps.filter((p) => {
    // rooms_min: filtrar por cantidad mínima de ambientes
    if (filters.rooms_min && (p.rooms == null || p.rooms < filters.rooms_min)) return false;
    // sub_type: buscar en tags, disposition y description
    if (filters.sub_type) {
      const st = filters.sub_type.toLowerCase();
      const inTags = p.tags?.some((t) => t.name?.toLowerCase().includes(st)) ?? false;
      const inDisp = (p.disposition ?? '').toLowerCase().includes(st);
      const inDesc = (p.description ?? '').toLowerCase().includes(st);
      const inTitle = (p.title ?? '').toLowerCase().includes(st);
      if (!inTags && !inDisp && !inDesc && !inTitle) return false;
    }
    return true;
  });

  // Propiedades visibles con mayor score primero
  const visibleProps = filterByBbox(clientFilteredProps, bbox).sort((a, b) => computeScore(b) - computeScore(a));

  // Apply sort for display
  function sortProperties(props: Property[]): Property[] {
    if (sortBy === 'relevance') return props;
    return [...props].sort((a, b) => {
      const { price: pa } = getPriceInfo(a);
      const { price: pb } = getPriceInfo(b);
      const va = pa ?? (sortBy === 'price_asc' ? Infinity : -Infinity);
      const vb = pb ?? (sortBy === 'price_asc' ? Infinity : -Infinity);
      return sortBy === 'price_asc' ? va - vb : vb - va;
    });
  }

  const sortedVisibleProps = sortProperties(visibleProps);
  const hasMore = allProps.length < totalCount;
  // hasMore se basa en allProps (paginación API), no en clientFilteredProps

  function handleMapSelect(id: number) {
    setSelectedId(id);
  }

  // Persist mobileTab in sessionStorage so it survives back-navigation from detail pages
  function setMobileTab(tab: 'map' | 'list') {
    setMobileTabRaw(tab);
    try { sessionStorage.setItem('netze-tab', tab); } catch {}
  }

  // Restore tab ONLY when coming back from a detail page (back/forward navigation)
  useEffect(() => {
    try {
      const navType = (performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming)?.type;
      if (navType === 'back_forward') {
        const saved = sessionStorage.getItem('netze-tab') as 'map' | 'list' | null;
        if (saved) setMobileTabRaw(saved);
      }
      sessionStorage.removeItem('netze-tab');
    } catch {}
  }, []);

  // Mobile tab switching with browser back button support
  function switchToList() {
    setMobileTab('list');
    history.pushState({ tab: 'list' }, '');
  }
  function switchToMap() {
    setMobileTab('map');
  }

  useEffect(() => {
    const onBack = () => {
      if (mobileTab === 'list') {
        setMobileTab('map');
      }
    };
    window.addEventListener('popstate', onBack);
    return () => window.removeEventListener('popstate', onBack);
  }, [mobileTab]);


  // ── Render ─────────────────────────────────────────────
  return (
    <div className="flex flex-col h-dvh overflow-hidden">

      {/* Navbar con buscador integrado */}
      <Navbar onLocationSelect={(center) => { setFlyToLoc(center); setTimeout(() => setFlyToLoc(null), 100); }} />

      {/* SmartFilter — siempre visible (fixed positioning), fuera de los tabs */}
      <SmartFilter
        filters={filters}
        onFilterChange={setFilters}
        resultCount={visibleProps.length}
      />

      {/* ─────────────── DESKTOP: split 60/40 or full list ─────── */}
      <div className="hidden md:flex flex-1 overflow-hidden pt-14">

        {desktopView === 'map' ? (
          <>
            {/* Mapa */}
            <div className="flex-[6] relative">
              <MapView
                properties={clientFilteredProps}
                selectedId={selectedId}
                isDark={isDark}
                featuredIds={featuredIds}
                onBoundsChange={setBbox}
                onPropertySelect={handleMapSelect}
                flyToLocation={flyToLoc}
                filterKey={JSON.stringify(filters)}
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

              {/* Toggle Mapa → Lista */}
              <div className="absolute bottom-6 left-4 z-20">
                <button
                  onClick={() => setDesktopView('list')}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-[#161b22] rounded-full shadow-lg border border-gray-200 dark:border-[#30363d] text-sm font-semibold text-gray-700 dark:text-gray-200 hover:border-[#0041CE] dark:hover:border-[#0061FB] transition-all active:scale-[0.97]"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                  </svg>
                  Ver lista
                </button>
              </div>
            </div>

            {/* Lista lateral */}
            <div className="flex-[4] border-l border-gray-100 overflow-hidden flex flex-col bg-white">
              <PropertyList
                properties={sortedVisibleProps}
                selectedId={selectedId}
                loading={loading}
                hasMore={hasMore}
                featuredIds={featuredIds}
                onSelect={setSelectedId}
                onLoadMore={() => fetchProperties(filters, offset, true)}
              />
            </div>
          </>
        ) : (
          /* Lista completa — sin mapa */
          <div className="flex-1 overflow-hidden flex flex-col bg-gray-50 dark:bg-[#0d1117]">
            {/* Bar: toggle back + sort */}
            <div className="shrink-0 flex items-center justify-between px-6 py-3 border-b border-gray-100 dark:border-[#21262d] bg-white dark:bg-[#0d1117]">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setDesktopView('map')}
                  className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 dark:border-[#30363d] text-sm font-semibold text-gray-700 dark:text-gray-200 hover:border-[#0041CE] dark:hover:border-[#0061FB] transition-all active:scale-[0.97]"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c-.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
                  </svg>
                  Ver mapa
                </button>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                  {sortedVisibleProps.length} {sortedVisibleProps.length === 1 ? 'propiedad' : 'propiedades'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-400 dark:text-gray-500 font-medium">Ordenar por</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-[#161b22] border border-gray-200 dark:border-[#30363d] rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0041CE]/30 focus:border-[#0041CE] transition cursor-pointer"
                >
                  <option value="relevance">Relevancia</option>
                  <option value="price_asc">Precio ↑ (menor a mayor)</option>
                  <option value="price_desc">Precio ↓ (mayor a menor)</option>
                </select>
              </div>
            </div>
            {/* Grid de cards */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {sortedVisibleProps.map((property) => (
                  <div key={property.id}>
                    <PropertyCard
                      property={property}
                      isSelected={property.id === selectedId}
                      isFeatured={featuredIds.includes(property.id)}
                      onClick={setSelectedId}
                    />
                  </div>
                ))}
              </div>
              {hasMore && (
                <button
                  onClick={() => fetchProperties(filters, offset, true)}
                  disabled={loading}
                  className="w-full mt-4 py-3 text-sm font-semibold border border-gray-200 dark:border-[#30363d] rounded-2xl text-gray-600 dark:text-gray-400 hover:border-[#0041CE] dark:hover:border-[#0061FB] hover:text-[#0041CE] dark:hover:text-[#0061FB] hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition disabled:opacity-50"
                >
                  {loading ? 'Cargando...' : 'Ver más propiedades'}
                </button>
              )}
              {!loading && sortedVisibleProps.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                  <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-[#21262d] flex items-center justify-center">
                    <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-gray-100 mb-1">Sin propiedades en esta vista</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500">Probá cambiando los filtros o volvé al mapa.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ─────────────── MOBILE: fullscreen + tab ─────────── */}
      <div className="flex md:hidden flex-1 overflow-hidden relative pt-14">

        {/* Mapa — siempre montado (z-index controla visibilidad) */}
        <div
          className="absolute inset-0"
          style={{ zIndex: mobileTab === 'map' ? 10 : 1, pointerEvents: mobileTab === 'map' ? 'auto' : 'none' }}
        >
          <MapView
            properties={clientFilteredProps}
            selectedId={selectedId}
            isDark={isDark}
            featuredIds={featuredIds}
            onBoundsChange={setBbox}
            onPropertySelect={handleMapSelect}
            flyToLocation={flyToLoc}
            filterKey={JSON.stringify(filters)}
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
                onClick={() => switchToList()}
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
              onClick={() => { switchToMap(); history.back(); }}
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
