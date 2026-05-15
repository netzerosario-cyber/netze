'use client';
import { useEffect, useRef, useCallback, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Property, getPriceInfo, formatPriceLabel, getFrontPhoto } from '@/lib/tokko';

const CENTER: [number, number] = [-60.6505, -32.9468];
const ZOOM = 12;
const SRC = 'props';
const CLUSTER_R = 35;
const CLUSTER_Z = 16;

export interface BoundingBox { north: number; south: number; east: number; west: number; }
interface Props {
  properties: Property[];
  selectedId?: number | null;
  isDark?: boolean;
  featuredIds?: number[];
  onBoundsChange: (b: BoundingBox) => void;
  onPropertySelect: (id: number) => void;
  onPropertyDeselect?: () => void;
  flyToLocation?: [number, number] | null;
  filterKey?: string;
}

function injectMapCSS() {
  if (document.getElementById('map-ctrl-css')) return;
  const s = document.createElement('style'); s.id = 'map-ctrl-css';
  s.textContent = `
@media(max-width:768px){
.mapboxgl-ctrl-zoom-in,.mapboxgl-ctrl-zoom-out{width:48px!important;height:48px!important}
.mapboxgl-ctrl-zoom-in span,.mapboxgl-ctrl-zoom-out span{font-size:22px!important}
.mapboxgl-ctrl-group{border-radius:12px!important;box-shadow:0 2px 10px rgba(0,0,0,.15)!important;overflow:hidden}
.mapboxgl-ctrl-group button{width:48px!important;height:48px!important}
.mapboxgl-ctrl-group button+button{border-top:1px solid #e5e7eb!important}
}
.dark-map .mapboxgl-ctrl-group{background:rgba(30,30,40,.85)!important;border:1px solid rgba(255,255,255,.1)!important}
.dark-map .mapboxgl-ctrl-group button{color:#fff!important}
.dark-map .mapboxgl-ctrl-group button span{color:#fff!important}
.dark-map .mapboxgl-ctrl-group button+button{border-top:1px solid rgba(255,255,255,.15)!important}
.light-map .mapboxgl-ctrl-group{background:#fff!important}
`;
  document.head.appendChild(s);
}

function track(pid: number, t: string, title?: string, addr?: string) {
  fetch('/api/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ property_id: String(pid), event_type: t, property_title: title, property_address: addr }) }).catch(() => {});
}

function toGeo(ps: Property[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: ps.filter(p => p.geo_lat && p.geo_long).map(p => {
      const lat = parseFloat(p.geo_lat!), lng = parseFloat(p.geo_long!);
      if (isNaN(lat) || isNaN(lng)) return null;
      const { price, currency } = getPriceInfo(p);
      const label = formatPriceLabel(price, currency);
      return {
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: [lng, lat] },
        properties: { id: p.id, label, address: p.address ?? '', title: p.title ?? '' },
      };
    }).filter(Boolean) as GeoJSON.Feature[],
  };
}

// Canvas pill icon generator
function createPillCanvas(text: string, selected: boolean): HTMLCanvasElement {
  const dpr = 2;
  const fontSize = 12 * dpr;
  const paddingX = 12 * dpr;
  const paddingY = 6 * dpr;
  const dotR = 4 * dpr;
  const gap = 5 * dpr;
  const arrowH = 7 * dpr;

  const measure = document.createElement('canvas').getContext('2d')!;
  measure.font = `bold ${fontSize}px system-ui, sans-serif`;
  const tw = measure.measureText(text).width;

  const w = Math.ceil(dotR * 2 + gap + tw + paddingX * 2);
  const pillH = Math.ceil(fontSize + paddingY * 2);
  const h = pillH + arrowH;

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  const bgColor = selected ? '#000d36' : '#0042cd';
  const r = pillH / 2;

  ctx.beginPath();
  ctx.moveTo(r, 0); ctx.lineTo(w - r, 0);
  ctx.arc(w - r, r, r, -Math.PI / 2, Math.PI / 2);
  ctx.lineTo(r, pillH); ctx.arc(r, r, r, Math.PI / 2, -Math.PI / 2);
  ctx.closePath();
  ctx.fillStyle = bgColor; ctx.fill();
  ctx.shadowColor = 'rgba(0,0,0,0.15)'; ctx.shadowBlur = 8 * dpr; ctx.shadowOffsetY = 2 * dpr;
  ctx.fill(); ctx.shadowColor = 'transparent';

  ctx.beginPath();
  ctx.arc(paddingX + dotR, pillH / 2, dotR, 0, Math.PI * 2);
  ctx.fillStyle = '#01d3f7'; ctx.fill();

  ctx.font = `bold ${fontSize}px system-ui, sans-serif`;
  ctx.fillStyle = '#fff'; ctx.textBaseline = 'middle';
  ctx.fillText(text, paddingX + dotR * 2 + gap, pillH / 2 + 1);

  const ax = w / 2;
  ctx.beginPath();
  ctx.moveTo(ax - 6 * dpr, pillH); ctx.lineTo(ax, pillH + arrowH); ctx.lineTo(ax + 6 * dpr, pillH);
  ctx.closePath(); ctx.fillStyle = bgColor; ctx.fill();

  return canvas;
}

/* ─── Bottom Card (mobile) ─── */
function BottomCard({ prop, onClose }: { prop: Property; onClose: () => void }) {
  const { price, currency } = getPriceInfo(prop);
  const pl = formatPriceLabel(price, currency);
  const photo = getFrontPhoto(prop);
  const op = prop.operations?.[0]?.name ?? '';
  const wa = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '5493417538537';
  const wt = encodeURIComponent(`Hola! Me interesa la propiedad en ${prop.address} (${pl}). ¿Pueden darme más información?`);

  return (
    <div
      style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 50,
        background: '#fff', borderRadius: '16px 16px 0 0',
        boxShadow: '0 -4px 24px rgba(0,0,0,.15)',
        padding: 0, animation: 'slideUp .25s ease-out',
      }}
    >
      <style>{`@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>

      {/* Close — above everything, large touch target for mobile */}
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClose(); }}
        aria-label="Cerrar"
        style={{
          position: 'absolute', top: 8, right: 8, zIndex: 999,
          width: 44, height: 44, borderRadius: '50%',
          background: 'rgba(0,0,0,.6)', border: 'none', color: '#fff',
          fontSize: 22, cursor: 'pointer', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          WebkitTapHighlightColor: 'transparent',
          touchAction: 'manipulation',
        }}
      >×</button>

      {/* Clickable area → detail */}
      <a
        href={`/propiedad/${prop.id}`}
        onClick={() => { try { sessionStorage.setItem('netze-tab', 'map'); } catch {} track(prop.id, 'map_click', prop.title, prop.address); }}
        style={{ display: 'flex', textDecoration: 'none', color: 'inherit' }}
      >
        {/* Photo */}
        <div style={{ width: 120, minHeight: 110, flexShrink: 0, background: '#e5e7eb', borderRadius: '16px 0 0 0', overflow: 'hidden', position: 'relative' }}>
          <img src={photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          {op && <span style={{ position: 'absolute', top: 6, left: 6, background: 'rgba(255,255,255,.9)', color: '#374151', fontSize: 9, fontWeight: 600, padding: '2px 8px', borderRadius: 12 }}>{op}</span>}
        </div>

        {/* Info */}
        <div style={{ flex: 1, padding: '12px 14px', minWidth: 0 }}>
          <p style={{ fontSize: 18, fontWeight: 800, color: '#111', margin: '0 0 2px' }}>{pl}</p>
          <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{prop.address}</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <div
              onClick={(e) => {
                e.preventDefault(); e.stopPropagation();
                window.open(`https://wa.me/${wa}?text=${wt}`, '_blank');
                track(prop.id, 'whatsapp_click', prop.title, prop.address);
              }}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                background: '#25D366', color: '#fff', fontSize: 11, fontWeight: 700,
                padding: '10px 6px', borderRadius: 8, cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              WhatsApp
            </div>
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: '#f3f4f6', color: '#374151', fontSize: 11, fontWeight: 700,
              padding: '10px 6px', borderRadius: 8,
            }}>Ver detalle →</div>
          </div>
        </div>
      </a>
    </div>
  );
}

export default function MapView({ properties, selectedId, isDark = false, onBoundsChange, onPropertySelect, onPropertyDeselect, flyToLocation, filterKey }: Props) {
  const cRef = useRef<HTMLDivElement>(null);
  const mRef = useRef<mapboxgl.Map | null>(null);
  const propsRef = useRef(properties);
  const onSel = useRef(onPropertySelect);
  const onBnd = useRef(onBoundsChange);
  const ready = useRef(false);
  const prevFilterKey = useRef(filterKey);
  const initialFitDone = useRef(false);
  const iconsAdded = useRef(new Set<string>());
  const [activeProperty, setActiveProperty] = useState<Property | null>(null);
  const cardClosedRef = useRef(false);
  // Guardar posición del mapa antes de hacer zoom a una propiedad
  const savedView = useRef<{ center: [number, number]; zoom: number } | null>(null);
  // Track si nosotros pusheamos un state de historial
  const mapCardPushed = useRef(false);

  useEffect(() => { onSel.current = onPropertySelect; }, [onPropertySelect]);
  useEffect(() => { onBnd.current = onBoundsChange; }, [onBoundsChange]);
  useEffect(() => { propsRef.current = properties; }, [properties]);



  const handlePillClick = useCallback((map: mapboxgl.Map, pid: number, coords: [number, number]) => {
    const prop = propsRef.current.find(p => p.id === pid);
    if (!prop) return;
    onSel.current(pid);
    track(pid, 'map_click', prop.title, prop.address);
    savedView.current = { center: map.getCenter().toArray() as [number, number], zoom: map.getZoom() };
    cardClosedRef.current = false;
    mapCardPushed.current = true;
    setActiveProperty(prop);
    history.pushState({ type: 'mc' }, '');
    map.easeTo({ center: coords, zoom: Math.max(map.getZoom(), 15), duration: 400 });
  }, []);

  // Función para cerrar la card y restaurar zoom
  const closeCard = useCallback(() => {
    if (cardClosedRef.current) return;
    cardClosedRef.current = true;
    mapCardPushed.current = false;
    setActiveProperty(null);
    // Limpiar selectedId en el parent para evitar que el effect re-abra la card
    onPropertyDeselect?.();
    const map = mRef.current;
    if (map && savedView.current) {
      map.easeTo({ center: savedView.current.center, zoom: savedView.current.zoom, duration: 400 });
      savedView.current = null;
    }
  }, [onPropertyDeselect]);

  // Botón atrás cierra la card
  useEffect(() => {
    const onBack = () => {
      if (mapCardPushed.current && !cardClosedRef.current) {
        (window as any).__popConsumed = true;
        closeCard();
      }
    };
    window.addEventListener('popstate', onBack);
    return () => window.removeEventListener('popstate', onBack);
  }, [closeCard]);

  const registerIcons = useCallback((map: mapboxgl.Map) => {
    propsRef.current.forEach(prop => {
      if (!prop.geo_lat || !prop.geo_long) return;
      const iconId = `pill-${prop.id}`;
      if (iconsAdded.current.has(iconId)) return;
      const { price, currency } = getPriceInfo(prop);
      const label = formatPriceLabel(price, currency);
      const canvas = createPillCanvas(label, prop.id === selectedId);
      if (!map.hasImage(iconId)) {
        map.addImage(iconId, { width: canvas.width, height: canvas.height, data: new Uint8Array(canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height).data) }, { pixelRatio: 2 });
        iconsAdded.current.add(iconId);
      }
    });
  }, [selectedId]);

  const setupLayers = useCallback((map: mapboxgl.Map) => {
    ready.current = false;
    ['unclustered-pills', 'pill-hitarea', 'cl-cnt', 'cl-cir'].forEach(l => { try { map.removeLayer(l); } catch {} });
    try { map.removeSource(SRC); } catch {}
    registerIcons(map);

    map.addSource(SRC, { type: 'geojson', data: toGeo(propsRef.current), cluster: true, clusterMaxZoom: CLUSTER_Z, clusterRadius: CLUSTER_R });

    map.addLayer({ id: 'cl-cir', type: 'circle', source: SRC, filter: ['has', 'point_count'], paint: {
      'circle-color': '#0041CE', 'circle-radius': ['step', ['get', 'point_count'], 22, 5, 28, 20, 36],
      'circle-stroke-color': 'rgba(0,65,206,0.15)', 'circle-stroke-width': 6,
    } });

    map.addLayer({ id: 'cl-cnt', type: 'symbol', source: SRC, filter: ['has', 'point_count'], layout: {
      'text-field': '{point_count_abbreviated}', 'text-font': ['DIN Offc Pro Bold', 'Arial Unicode MS Bold'],
      'text-size': 14, 'text-allow-overlap': true }, paint: { 'text-color': '#fff' } });

    // Invisible hit area for easier tapping on mobile (circle is much easier to tap than symbol)
    map.addLayer({ id: 'pill-hitarea', type: 'circle', source: SRC,
      filter: ['!', ['has', 'point_count']],
      paint: { 'circle-radius': 24, 'circle-color': 'transparent', 'circle-stroke-width': 0 },
    });

    map.addLayer({ id: 'unclustered-pills', type: 'symbol', source: SRC,
      filter: ['!', ['has', 'point_count']],
      layout: {
        'icon-image': ['concat', 'pill-', ['to-string', ['get', 'id']]],
        'icon-allow-overlap': true, 'icon-ignore-placement': true,
        'icon-anchor': 'bottom', 'icon-size': 1,
      },
    });

    // Click on cluster => expand
    map.on('click', 'cl-cir', (e) => {
      const f = map.queryRenderedFeatures(e.point, { layers: ['cl-cir'] });
      if (!f.length) return;
      const g = f[0].geometry as GeoJSON.Point;
      (map.getSource(SRC) as mapboxgl.GeoJSONSource).getClusterExpansionZoom(f[0].properties?.cluster_id, (err, z) => {
        if (err || z == null) return;
        map.easeTo({ center: g.coordinates as [number, number], zoom: z + 0.5, duration: 500 });
      });
    });

    // Click on pill or hit area => show bottom card
    const pillClickHandler = (e: mapboxgl.MapMouseEvent & { features?: mapboxgl.MapboxGeoJSONFeature[] }) => {
      if (!e.features?.length) return;
      const feat = e.features[0];
      const pid = feat.properties?.id;
      const coords = (feat.geometry as GeoJSON.Point).coordinates as [number, number];
      handlePillClick(map, pid, coords);
    };
    map.on('click', 'unclustered-pills', pillClickHandler);
    map.on('click', 'pill-hitarea', pillClickHandler);

    // Desktop cursor
    map.on('mouseenter', 'unclustered-pills', () => { map.getCanvas().style.cursor = 'pointer'; });
    map.on('mouseleave', 'unclustered-pills', () => { map.getCanvas().style.cursor = ''; });
    map.on('mouseenter', 'pill-hitarea', () => { map.getCanvas().style.cursor = 'pointer'; });
    map.on('mouseleave', 'pill-hitarea', () => { map.getCanvas().style.cursor = ''; });
    map.on('mouseenter', 'cl-cir', () => { map.getCanvas().style.cursor = 'pointer'; });
    map.on('mouseleave', 'cl-cir', () => { map.getCanvas().style.cursor = ''; });

    // Close bottom card when tapping empty map area
    map.on('click', (e) => {
      const pills = map.queryRenderedFeatures(e.point, { layers: ['unclustered-pills', 'pill-hitarea'] });
      const clusters = map.queryRenderedFeatures(e.point, { layers: ['cl-cir'] });
      if (pills.length === 0 && clusters.length === 0) {
        setActiveProperty(null);
      }
    });

    ready.current = true;
  }, [registerIcons, handlePillClick]);

  // Init map
  useEffect(() => {
    if (!cRef.current || mRef.current) return;
    injectMapCSS();
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? '';
    const map = new mapboxgl.Map({
      container: cRef.current,
      style: isDark ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/light-v11',
      center: CENTER, zoom: ZOOM, attributionControl: false,
      touchZoomRotate: true, dragPan: true, dragRotate: false,
    });
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right');
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-left');
    const emit = () => { const b = map.getBounds(); if (b) onBnd.current({ north: b.getNorth(), south: b.getSouth(), east: b.getEast(), west: b.getWest() }); };
    map.on('style.load', () => {
      setupLayers(map);
      const wc = propsRef.current.filter(p => p.geo_lat && p.geo_long);
      if (wc.length > 0) {
        const bounds = new mapboxgl.LngLatBounds();
        wc.forEach(p => { const la = parseFloat(p.geo_lat!), ln = parseFloat(p.geo_long!); if (!isNaN(la) && !isNaN(ln)) bounds.extend([ln, la]); });
        if (!bounds.isEmpty()) map.fitBounds(bounds, { padding: { top: 120, bottom: 80, left: 40, right: 40 }, maxZoom: 15, duration: 0 });
      }
      emit();
    });
    map.on('moveend', emit);
    mRef.current = map;
    return () => { map.remove(); mRef.current = null; ready.current = false; iconsAdded.current.clear(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { const map = mRef.current; if (!map || !map.isStyleLoaded()) return; ready.current = false; iconsAdded.current.clear(); map.setStyle(isDark ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/light-v11'); }, [isDark]);

  useEffect(() => {
    const map = mRef.current; if (!map || !ready.current) return;
    try { registerIcons(map); (map.getSource(SRC) as mapboxgl.GeoJSONSource)?.setData(toGeo(properties)); } catch {}
    if (!initialFitDone.current && properties.length > 0) {
      const wc = properties.filter(p => p.geo_lat && p.geo_long);
      if (wc.length > 0) {
        const bounds = new mapboxgl.LngLatBounds();
        wc.forEach(p => { const la = parseFloat(p.geo_lat!), ln = parseFloat(p.geo_long!); if (!isNaN(la) && !isNaN(ln)) bounds.extend([ln, la]); });
        if (!bounds.isEmpty()) map.fitBounds(bounds, { padding: { top: 120, bottom: 80, left: 40, right: 40 }, maxZoom: 14, duration: 800 });
        initialFitDone.current = true;
      }
    }
  }, [properties, registerIcons]);

  // selectedId effect — solo zoom + mostrar card, NO pushear historial
  // (el historial lo maneja handlePillClick; este effect es para selección desde la lista)
  const prevSelId = useRef<number | null>(null);
  useEffect(() => {
    if (!selectedId || selectedId === prevSelId.current) return;
    prevSelId.current = selectedId;
    const map = mRef.current; if (!map) return;
    const p = properties.find(x => x.id === selectedId);
    if (!p?.geo_lat || !p?.geo_long) return;
    const lat = parseFloat(p.geo_lat), lng = parseFloat(p.geo_long);
    if (isNaN(lat) || isNaN(lng)) return;
    // Solo guardar vista si no hay una card ya abierta (evitar sobreescribir)
    if (!activeProperty) {
      savedView.current = { center: map.getCenter().toArray() as [number, number], zoom: map.getZoom() };
    }
    cardClosedRef.current = false;
    // Solo pushear history si no fue ya pusheado por handlePillClick
    if (!mapCardPushed.current) {
      mapCardPushed.current = true;
      history.pushState({ type: 'mc' }, '');
    }
    map.easeTo({ center: [lng, lat], zoom: Math.max(map.getZoom(), 15), duration: 400 });
    setActiveProperty(p);
  }, [selectedId, properties, activeProperty]);

  useEffect(() => { if (!flyToLocation) return; mRef.current?.flyTo({ center: flyToLocation, zoom: 14, duration: 1000 }); }, [flyToLocation]);

  useEffect(() => {
    if (!filterKey || filterKey === prevFilterKey.current) return;
    prevFilterKey.current = filterKey;
    const map = mRef.current; if (!map) return;
    let hasFilter = false;
    try { const p = JSON.parse(filterKey); hasFilter = !!(p.property_types?.length || p.operation_types?.length || p.rooms || p.rooms_min || p.sub_type); } catch { return; }
    const wc = properties.filter(p => p.geo_lat && p.geo_long);
    if (!wc.length) { map.flyTo({ center: CENTER, zoom: ZOOM, duration: 800 }); return; }
    // Siempre ajustar al radio de las propiedades disponibles (con o sin filtro)
    const bounds = new mapboxgl.LngLatBounds();
    wc.forEach(p => { const la = parseFloat(p.geo_lat!), ln = parseFloat(p.geo_long!); if (!isNaN(la) && !isNaN(ln)) bounds.extend([ln, la]); });
    if (!bounds.isEmpty()) map.fitBounds(bounds, { padding: { top: 120, bottom: 80, left: 40, right: 40 }, maxZoom: 15, duration: 800 });
  }, [filterKey, properties]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }} className={isDark ? 'dark-map' : 'light-map'}>
      <div ref={cRef} className="w-full h-full" />
      {activeProperty && (
        <BottomCard prop={activeProperty} onClose={() => {
          if (cardClosedRef.current) return;
          const shouldGoBack = mapCardPushed.current;
          closeCard();
          if (shouldGoBack) {
            (window as any).__popConsumed = true;
            history.back();
          }
        }} />
      )}
    </div>
  );
}
