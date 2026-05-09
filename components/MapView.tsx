'use client';
// ============================================================
// components/MapView.tsx — Pills + clustering nativo
// Touch-optimized for mobile. Clustering groups nearby properties.
// Pills show for unclustered points, hide when inside a cluster.
// ============================================================
import { useEffect, useRef, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Property, getPriceInfo, formatPriceLabel, getFrontPhoto } from '@/lib/tokko';

const CENTER: [number, number] = [-60.6505, -32.9468];
const ZOOM = 12;
const SRC = 'props';
const CLUSTER_R = 40;
const CLUSTER_Z = 14;

export interface BoundingBox { north: number; south: number; east: number; west: number; }
interface Props {
  properties: Property[];
  selectedId?: number | null;
  isDark?: boolean;
  featuredIds?: number[];
  onBoundsChange: (b: BoundingBox) => void;
  onPropertySelect: (id: number) => void;
  flyToLocation?: [number, number] | null;
  filterKey?: string;
}

// ── Pill CSS — touch-optimized ───────────────────────────────
const CSS = `
.np{cursor:pointer;display:inline-flex;flex-direction:column;align-items:center;pointer-events:auto;touch-action:manipulation;-webkit-tap-highlight-color:transparent;position:relative}
.np::after{content:'';position:absolute;top:-8px;left:-8px;right:-8px;bottom:-4px;z-index:-1}
.np-p{display:flex;align-items:center;gap:5px;padding:5px 11px 5px 8px;border-radius:999px;background:#0042cd;border:1.5px solid #0042cd;box-shadow:0 2px 8px rgba(0,0,0,.15);transition:box-shadow .15s,background .15s;white-space:nowrap}
.np-p:hover,.np-p:active{background:#0062fa;border-color:#0062fa;box-shadow:0 6px 20px rgba(0,98,250,.35)}
.np-d{width:7px;height:7px;border-radius:50%;background:#01d3f7;flex-shrink:0}
.np-t{font-family:var(--font-mazzard),system-ui,sans-serif;font-size:11.5px;font-weight:700;color:#fff;letter-spacing:-.2px}
.np-a{width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:7px solid #0042cd;transition:border-top-color .15s}
.np-p:hover+.np-a,.np-p:active+.np-a{border-top-color:#0062fa}
.np.sel .np-p{background:#000d36;border-color:#000d36;box-shadow:0 6px 20px rgba(0,13,54,.4)}
.np.sel .np-a{border-top-color:#000d36}
`;

function injectCSS() {
  if (document.getElementById('np-css')) return;
  const s = document.createElement('style'); s.id = 'np-css'; s.textContent = CSS;
  document.head.appendChild(s);
}

function injectPopupCSS() {
  if (document.getElementById('np-popup')) return;
  const s = document.createElement('style'); s.id = 'np-popup';
  s.textContent = `
.mapboxgl-popup-content{padding:10px!important;border-radius:14px!important;box-shadow:0 8px 30px rgba(0,0,0,.18)!important;overflow:hidden}
.mapboxgl-popup-close-button{font-size:20px!important;width:32px!important;height:32px!important;right:4px!important;top:4px!important;color:#fff!important;background:rgba(0,0,0,.4)!important;border-radius:50%!important;z-index:10!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:0!important;line-height:32px!important}
.mapboxgl-popup-close-button:hover{background:rgba(0,0,0,.7)!important}
`;
  document.head.appendChild(s);
}

function makeEl(label: string, sel: boolean): HTMLDivElement {
  const w = document.createElement('div');
  w.className = `np${sel ? ' sel' : ''}`;
  w.innerHTML = `<div class="np-p"><div class="np-d"></div><span class="np-t">${label}</span></div><div class="np-a"></div>`;
  return w;
}

function track(pid: number, t: string, title?: string, addr?: string) {
  fetch('/api/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ property_id: String(pid), event_type: t, property_title: title, property_address: addr }) }).catch(() => {});
}

function toGeo(ps: Property[]): GeoJSON.FeatureCollection {
  return { type: 'FeatureCollection', features: ps.filter(p => p.geo_lat && p.geo_long).map(p => {
    const lat = parseFloat(p.geo_lat!), lng = parseFloat(p.geo_long!);
    if (isNaN(lat) || isNaN(lng)) return null;
    return { type: 'Feature' as const, geometry: { type: 'Point' as const, coordinates: [lng, lat] }, properties: { id: p.id } };
  }).filter(Boolean) as GeoJSON.Feature[] };
}

function popupHTML(prop: Property): string {
  const { price, currency } = getPriceInfo(prop);
  const pl = formatPriceLabel(price, currency);
  const op = prop.operations?.[0]?.name ?? '';
  const wa = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '5493417538537';
  const wt = encodeURIComponent(`Hola! Me interesa la propiedad en ${prop.address} (${pl}). ¿Pueden darme más información?`);
  const sT = (prop.title ?? '').replace(/'/g, "\\'"), sA = (prop.address ?? '').replace(/'/g, "\\'");
  const raw = prop as unknown as { photos?: { image: string }[] };
  const photos = (raw.photos ?? []).map(p => p.image).filter(Boolean);
  if (!photos.length) photos.push(getFrontPhoto(prop));
  const uid = `c${prop.id}_${Date.now()}`;

  return `<div style="width:min(280px,85vw);font-family:system-ui,sans-serif;margin:-10px -10px 0">
<div style="position:relative;height:160px;overflow:hidden;border-radius:12px 12px 0 0;background:#e5e7eb">
<div id="${uid}" data-i="0" style="display:flex;transition:transform .3s ease;height:100%;width:${photos.length*100}%">
${photos.map(s=>`<img src="${s}" alt="" style="width:${100/photos.length}%;height:100%;object-fit:cover;flex-shrink:0" onerror="this.style.display='none'"/>`).join('')}
</div>
${op?`<span style="position:absolute;top:8px;left:8px;background:rgba(255,255,255,.95);color:#374151;font-size:10px;font-weight:600;padding:3px 10px;border-radius:20px;z-index:2">${op}</span>`:''}
${photos.length>1?`
<button onclick="(function(){var c=document.getElementById('${uid}');var i=Math.max(0,(parseInt(c.dataset.i)||0)-1);c.dataset.i=i;c.style.transform='translateX(-'+(i*${100/photos.length})+'%)'})()" style="position:absolute;left:6px;top:50%;transform:translateY(-50%);width:32px;height:32px;border-radius:50%;background:rgba(255,255,255,.9);border:none;cursor:pointer;font-size:14px;font-weight:bold;color:#374151;z-index:2;box-shadow:0 1px 4px rgba(0,0,0,.15);touch-action:manipulation">‹</button>
<button onclick="(function(){var c=document.getElementById('${uid}');var i=Math.min(${photos.length-1},(parseInt(c.dataset.i)||0)+1);c.dataset.i=i;c.style.transform='translateX(-'+(i*${100/photos.length})+'%)'})()" style="position:absolute;right:6px;top:50%;transform:translateY(-50%);width:32px;height:32px;border-radius:50%;background:rgba(255,255,255,.9);border:none;cursor:pointer;font-size:14px;font-weight:bold;color:#374151;z-index:2;box-shadow:0 1px 4px rgba(0,0,0,.15);touch-action:manipulation">›</button>
`:''}
</div>
<div style="padding:14px">
<p style="font-size:17px;font-weight:800;color:#111;margin:0 0 3px">${pl}</p>
<p style="font-size:12px;color:#6b7280;margin:0 0 12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${prop.address}</p>
<div style="display:flex;flex-direction:column;gap:6px">
<a href="https://wa.me/${wa}?text=${wt}" target="_blank" onclick="fetch('/api/track',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({property_id:'${prop.id}',event_type:'whatsapp_click',property_title:'${sT}',property_address:'${sA}'})})" style="display:flex;align-items:center;justify-content:center;gap:6px;background:#25D366;color:#fff;font-size:12px;font-weight:700;padding:10px;border-radius:10px;text-decoration:none;box-shadow:0 2px 8px rgba(37,211,102,.3);touch-action:manipulation"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>Consultar por WhatsApp</a>
<a href="/propiedad/${prop.id}" style="display:flex;align-items:center;justify-content:center;background:#f3f4f6;color:#374151;font-size:12px;font-weight:700;padding:10px;border-radius:10px;text-decoration:none;touch-action:manipulation">Ver detalle →</a>
</div></div></div>`;
}

export default function MapView({ properties, selectedId, isDark = false, onBoundsChange, onPropertySelect, flyToLocation, filterKey }: Props) {
  const cRef = useRef<HTMLDivElement>(null);
  const mRef = useRef<mapboxgl.Map | null>(null);
  const pRef = useRef<mapboxgl.Popup | null>(null);
  const mkrs = useRef<Map<number, { m: mapboxgl.Marker; el: HTMLDivElement }>>(new Map());
  const propsRef = useRef(properties);
  const onSel = useRef(onPropertySelect);
  const onBnd = useRef(onBoundsChange);
  const ready = useRef(false);
  const prevFilterKey = useRef(filterKey);

  useEffect(() => { onSel.current = onPropertySelect; }, [onPropertySelect]);
  useEffect(() => { onBnd.current = onBoundsChange; }, [onBoundsChange]);
  useEffect(() => { propsRef.current = properties; }, [properties]);

  const showPopup = useCallback((map: mapboxgl.Map, prop: Property, coords: [number, number]) => {
    pRef.current?.remove();
    track(prop.id, 'map_click', prop.title, prop.address);
    pRef.current = new mapboxgl.Popup({ closeButton: true, maxWidth: '300px', offset: 14, closeOnClick: true })
      .setLngLat(coords).setHTML(popupHTML(prop)).addTo(map);
  }, []);

  // Sync: hide pills that are inside a cluster, show the rest
  const sync = useCallback((map: mapboxgl.Map) => {
    if (!ready.current) return;
    const visible = new Set<number>();
    try {
      const fs = map.querySourceFeatures(SRC, { sourceLayer: undefined });
      fs.forEach(f => { if (!f.properties?.cluster) visible.add(f.properties?.id); });
    } catch { /* source not ready */ }
    mkrs.current.forEach(({ el }, id) => {
      el.style.display = visible.has(id) ? '' : 'none';
    });
  }, []);

  const buildMarkers = useCallback((map: mapboxgl.Map) => {
    propsRef.current.forEach(prop => {
      if (!prop.geo_lat || !prop.geo_long || mkrs.current.has(prop.id)) return;
      const lat = parseFloat(prop.geo_lat), lng = parseFloat(prop.geo_long);
      if (isNaN(lat) || isNaN(lng)) return;
      const { price, currency } = getPriceInfo(prop);
      const el = makeEl(formatPriceLabel(price, currency), prop.id === selectedId);

      // Touch-optimized click handler
      let touchHandled = false;
      const handler = () => {
        onSel.current(prop.id);
        showPopup(map, prop, [lng, lat]);
      };

      el.addEventListener('touchend', (e) => {
        e.preventDefault();
        e.stopPropagation();
        touchHandled = true;
        handler();
        setTimeout(() => { touchHandled = false; }, 300);
      }, { passive: false });

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        if (touchHandled) return;
        handler();
      });

      const m = new mapboxgl.Marker({ element: el, anchor: 'bottom' }).setLngLat([lng, lat]).addTo(map);
      mkrs.current.set(prop.id, { m, el });
    });
    // Remove stale
    const ids = new Set(propsRef.current.map(p => p.id));
    mkrs.current.forEach((v, id) => { if (!ids.has(id)) { v.m.remove(); mkrs.current.delete(id); } });
    sync(map);
  }, [selectedId, showPopup, sync]);

  const setupLayers = useCallback((map: mapboxgl.Map) => {
    ready.current = false;
    ['cl-cnt', 'cl-cir'].forEach(l => { try { map.removeLayer(l); } catch {} });
    try { map.removeSource(SRC); } catch {}

    map.addSource(SRC, { type: 'geojson', data: toGeo(propsRef.current), cluster: true, clusterMaxZoom: CLUSTER_Z, clusterRadius: CLUSTER_R });

    map.addLayer({ id: 'cl-cir', type: 'circle', source: SRC, filter: ['has', 'point_count'], paint: {
      'circle-color': '#0041CE', 'circle-radius': ['step', ['get', 'point_count'], 22, 5, 28, 20, 36],
      'circle-stroke-color': 'rgba(0,65,206,0.15)', 'circle-stroke-width': 6 } });

    map.addLayer({ id: 'cl-cnt', type: 'symbol', source: SRC, filter: ['has', 'point_count'], layout: {
      'text-field': '{point_count_abbreviated}', 'text-font': ['DIN Offc Pro Bold', 'Arial Unicode MS Bold'],
      'text-size': 14, 'text-allow-overlap': true }, paint: { 'text-color': '#fff' } });

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
    map.on('mouseenter', 'cl-cir', () => { map.getCanvas().style.cursor = 'pointer'; });
    map.on('mouseleave', 'cl-cir', () => { map.getCanvas().style.cursor = ''; });

    ready.current = true;
    buildMarkers(map);
  }, [buildMarkers]);

  // Init
  useEffect(() => {
    if (!cRef.current || mRef.current) return;
    injectCSS(); injectPopupCSS();
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? '';
    const map = new mapboxgl.Map({
      container: cRef.current,
      style: isDark ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/light-v11',
      center: CENTER,
      zoom: ZOOM,
      attributionControl: false,
      touchZoomRotate: true,
      dragPan: true,
      dragRotate: false,
    });
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right');
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-left');
    const emit = () => { const b = map.getBounds(); if (b) onBnd.current({ north: b.getNorth(), south: b.getSouth(), east: b.getEast(), west: b.getWest() }); };
    map.on('style.load', () => { setupLayers(map); emit(); });
    map.on('moveend', () => { sync(map); emit(); });
    map.on('zoomend', () => { sync(map); });
    // Sync when source data finishes loading
    map.on('data', (e: mapboxgl.MapDataEvent) => {
      const ev = e as mapboxgl.MapDataEvent & { sourceId?: string; isSourceLoaded?: boolean };
      if (ev.sourceId === SRC && ev.isSourceLoaded) sync(map);
    });
    mRef.current = map;
    return () => { mkrs.current.forEach(v => v.m.remove()); mkrs.current.clear(); map.remove(); mRef.current = null; ready.current = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Theme change
  useEffect(() => { const map = mRef.current; if (!map || !map.isStyleLoaded()) return; mkrs.current.forEach(v => v.m.remove()); mkrs.current.clear(); ready.current = false; map.setStyle(isDark ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/light-v11'); }, [isDark]);

  // Properties changed — update source + markers
  useEffect(() => { const map = mRef.current; if (!map || !ready.current) return; try { (map.getSource(SRC) as mapboxgl.GeoJSONSource)?.setData(toGeo(properties)); buildMarkers(map); } catch {} }, [properties, buildMarkers]);

  // Selected marker style
  useEffect(() => { mkrs.current.forEach(({ el }, id) => { el.className = `np${id === selectedId ? ' sel' : ''}`; }); }, [selectedId]);

  // Fly to selected
  useEffect(() => { if (!selectedId) return; const map = mRef.current; if (!map) return; const p = properties.find(x => x.id === selectedId); if (!p?.geo_lat || !p?.geo_long) return; const lat = parseFloat(p.geo_lat), lng = parseFloat(p.geo_long); if (isNaN(lat) || isNaN(lng)) return; map.flyTo({ center: [lng, lat], zoom: Math.max(map.getZoom(), 15), duration: 700 }); setTimeout(() => showPopup(map, p, [lng, lat]), 750); }, [selectedId, properties, showPopup]);

  // Fly to search location
  useEffect(() => { if (!flyToLocation) return; mRef.current?.flyTo({ center: flyToLocation, zoom: 14, duration: 1000 }); }, [flyToLocation]);

  // Fit bounds when filter changes (e.g. selecting "Terrenos" fits to all terrenos)
  useEffect(() => {
    if (!filterKey || filterKey === prevFilterKey.current) return;
    prevFilterKey.current = filterKey;
    try {
      const parsed = JSON.parse(filterKey);
      if (!parsed.property_types || parsed.property_types.length === 0) return;
    } catch { return; }
    const map = mRef.current;
    if (!map) return;
    const withCoords = properties.filter(p => p.geo_lat && p.geo_long);
    if (withCoords.length === 0) return;
    const bounds = new mapboxgl.LngLatBounds();
    withCoords.forEach(p => {
      const lat = parseFloat(p.geo_lat!), lng = parseFloat(p.geo_long!);
      if (!isNaN(lat) && !isNaN(lng)) bounds.extend([lng, lat]);
    });
    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, { padding: 60, maxZoom: 15, duration: 800 });
    }
  }, [filterKey, properties]);

  return <div ref={cRef} className="w-full h-full" style={{ touchAction: 'none' }} />;
}
