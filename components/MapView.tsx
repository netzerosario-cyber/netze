'use client';
// ============================================================
// components/MapView.tsx  — VERSIÓN FINAL
//
// CERO HTML markers. Todo renderizado con capas nativas de
// Mapbox GL (symbol + circle). Los puntos NUNCA se mueven
// porque son parte del canvas del mapa.
//
// Clustering a zoom bajo, puntos individuales con precio a
// zoom alto. Click → popup con carrusel de fotos.
// ============================================================
import { useEffect, useRef, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Property, getPriceInfo, formatPriceLabel, getFrontPhoto } from '@/lib/tokko';

const CENTER: [number, number] = [-60.6505, -32.9468];
const ZOOM = 12;
const SRC  = 'props';
const CLUSTER_R = 40;
const CLUSTER_Z = 13;

export interface BoundingBox { north: number; south: number; east: number; west: number; }

interface Props {
  properties: Property[];
  selectedId?: number | null;
  isDark?: boolean;
  onBoundsChange: (b: BoundingBox) => void;
  onPropertySelect: (id: number) => void;
  flyToLocation?: [number, number] | null;
}

function track(pid: number, type: string, t?: string, a?: string) {
  fetch('/api/track', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ property_id: String(pid), event_type: type, property_title: t, property_address: a }),
  }).catch(() => {});
}

function toGeo(ps: Property[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: ps.filter(p => p.geo_lat && p.geo_long).map(p => {
      const lat = parseFloat(p.geo_lat!), lng = parseFloat(p.geo_long!);
      if (isNaN(lat) || isNaN(lng)) return null;
      const { price, currency } = getPriceInfo(p);
      return {
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: [lng, lat] },
        properties: { id: p.id, price: formatPriceLabel(price, currency) },
      };
    }).filter(Boolean) as GeoJSON.Feature[],
  };
}

// ── Popup HTML con carrusel ─────────────────────────────────
function popupHTML(prop: Property): string {
  const { price, currency } = getPriceInfo(prop);
  const pl = formatPriceLabel(price, currency);
  const op = prop.operations?.[0]?.name ?? '';
  const wa = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '5493413492000';
  const wt = encodeURIComponent(`Hola! Me interesa la propiedad en ${prop.address} (${pl}). ¿Pueden darme más información?`);
  const safeT = (prop.title ?? '').replace(/'/g, "\\'");
  const safeA = (prop.address ?? '').replace(/'/g, "\\'");

  // Fotos para carrusel
  const raw = prop as unknown as { photos?: { image: string }[] };
  const photos = (raw.photos ?? []).map(p => p.image).filter(Boolean);
  const mainPhoto = getFrontPhoto(prop);
  if (photos.length === 0) photos.push(mainPhoto);

  const uid = `carousel_${prop.id}_${Date.now()}`;

  return `<div style="width:280px;font-family:'Inter',system-ui,sans-serif;margin:-10px -10px 0">
    <!-- Carrusel -->
    <div style="position:relative;height:160px;overflow:hidden;border-radius:12px 12px 0 0;background:#e5e7eb">
      <div id="${uid}" style="display:flex;transition:transform .3s ease;height:100%;width:${photos.length * 100}%">
        ${photos.map(src => `<img src="${src}" alt="" style="width:${100 / photos.length}%;height:100%;object-fit:cover;flex-shrink:0" onerror="this.style.display='none'"/>`).join('')}
      </div>
      ${op ? `<span style="position:absolute;top:8px;left:8px;background:rgba(255,255,255,.95);color:#374151;font-size:10px;font-weight:600;padding:3px 10px;border-radius:20px;z-index:2">${op}</span>` : ''}
      ${photos.length > 1 ? `
        <button onclick="(function(){var c=document.getElementById('${uid}');var i=parseInt(c.dataset.i||'0');i=Math.max(0,i-1);c.dataset.i=i;c.style.transform='translateX(-'+(i*${100/photos.length})+'%)'})()" style="position:absolute;left:6px;top:50%;transform:translateY(-50%);width:28px;height:28px;border-radius:50%;background:rgba(255,255,255,.9);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:bold;color:#374151;z-index:2;box-shadow:0 1px 4px rgba(0,0,0,.15)">‹</button>
        <button onclick="(function(){var c=document.getElementById('${uid}');var i=parseInt(c.dataset.i||'0');i=Math.min(${photos.length - 1},i+1);c.dataset.i=i;c.style.transform='translateX(-'+(i*${100/photos.length})+'%)'})()" style="position:absolute;right:6px;top:50%;transform:translateY(-50%);width:28px;height:28px;border-radius:50%;background:rgba(255,255,255,.9);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:bold;color:#374151;z-index:2;box-shadow:0 1px 4px rgba(0,0,0,.15)">›</button>
        <div style="position:absolute;bottom:8px;left:50%;transform:translateX(-50%);display:flex;gap:4px;z-index:2">
          ${photos.map((_, idx) => `<span style="width:6px;height:6px;border-radius:50%;background:${idx === 0 ? '#fff' : 'rgba(255,255,255,.5)'}"></span>`).join('')}
        </div>
      ` : ''}
    </div>
    <!-- Info -->
    <div style="padding:14px">
      <p style="font-size:17px;font-weight:800;color:#111827;margin:0 0 3px;letter-spacing:-.3px">${pl}</p>
      <p style="font-size:12px;color:#6b7280;margin:0 0 12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${prop.address}</p>
      <div style="display:flex;flex-direction:column;gap:6px">
        <a href="https://wa.me/${wa}?text=${wt}" target="_blank" onclick="fetch('/api/track',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({property_id:'${prop.id}',event_type:'whatsapp_click',property_title:'${safeT}',property_address:'${safeA}'})})" style="display:flex;align-items:center;justify-content:center;gap:6px;background:#25D366;color:#fff;font-size:12px;font-weight:700;padding:10px;border-radius:10px;text-decoration:none;box-shadow:0 2px 8px rgba(37,211,102,.3)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          Consultar por WhatsApp
        </a>
        <a href="/propiedad/${prop.id}" style="display:flex;align-items:center;justify-content:center;background:#f3f4f6;color:#374151;font-size:12px;font-weight:700;padding:10px;border-radius:10px;text-decoration:none">Ver detalle →</a>
      </div>
    </div>
  </div>`;
}

// ── Inject popup CSS ────────────────────────────────────────
function injectPopupCSS() {
  if (document.getElementById('netze-popup-css')) return;
  const s = document.createElement('style');
  s.id = 'netze-popup-css';
  s.textContent = `
    .mapboxgl-popup-content{padding:10px!important;border-radius:14px!important;box-shadow:0 8px 30px rgba(0,0,0,.18)!important;overflow:hidden}
    .mapboxgl-popup-close-button{font-size:20px!important;width:32px!important;height:32px!important;line-height:32px!important;right:4px!important;top:4px!important;color:#fff!important;background:rgba(0,0,0,.4)!important;border-radius:50%!important;z-index:10!important;text-shadow:none!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:0!important}
    .mapboxgl-popup-close-button:hover{background:rgba(0,0,0,.7)!important}
    .mapboxgl-popup-tip{border-top-color:white!important}
  `;
  document.head.appendChild(s);
}

// ── Componente ────────────────────────────────────────────────
export default function MapView({ properties, selectedId, isDark = false, onBoundsChange, onPropertySelect, flyToLocation }: Props) {
  const cRef = useRef<HTMLDivElement>(null);
  const mRef = useRef<mapboxgl.Map | null>(null);
  const pRef = useRef<mapboxgl.Popup | null>(null);
  const propsRef = useRef(properties);
  const onSelRef = useRef(onPropertySelect);
  const onBndRef = useRef(onBoundsChange);

  useEffect(() => { onSelRef.current = onPropertySelect; }, [onPropertySelect]);
  useEffect(() => { onBndRef.current = onBoundsChange; }, [onBoundsChange]);
  useEffect(() => { propsRef.current = properties; }, [properties]);

  const showPopup = useCallback((map: mapboxgl.Map, propId: number, coords: [number, number]) => {
    const prop = propsRef.current.find(p => p.id === propId);
    if (!prop) return;
    pRef.current?.remove();
    track(prop.id, 'map_click', prop.title, prop.address);
    pRef.current = new mapboxgl.Popup({ closeButton: true, maxWidth: '300px', offset: 14 })
      .setLngLat(coords)
      .setHTML(popupHTML(prop))
      .addTo(map);
  }, []);

  const setupLayers = useCallback((map: mapboxgl.Map) => {
    ['uncl-label', 'uncl-dot', 'cl-count', 'cl-circle'].forEach(l => { try { map.removeLayer(l); } catch {} });
    try { map.removeSource(SRC); } catch {}

    map.addSource(SRC, {
      type: 'geojson',
      data: toGeo(propsRef.current),
      cluster: true,
      clusterMaxZoom: CLUSTER_Z,
      clusterRadius: CLUSTER_R,
    });

    // Cluster circles
    map.addLayer({
      id: 'cl-circle', type: 'circle', source: SRC,
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': '#0041CE',
        'circle-radius': ['step', ['get', 'point_count'], 22, 5, 28, 20, 36],
        'circle-stroke-color': 'rgba(0,65,206,0.15)',
        'circle-stroke-width': 6,
      },
    });

    // Cluster count
    map.addLayer({
      id: 'cl-count', type: 'symbol', source: SRC,
      filter: ['has', 'point_count'],
      layout: {
        'text-field': '{point_count_abbreviated}',
        'text-font': ['DIN Offc Pro Bold', 'Arial Unicode MS Bold'],
        'text-size': 14,
        'text-allow-overlap': true,
      },
      paint: { 'text-color': '#ffffff' },
    });

    // Individual dots
    map.addLayer({
      id: 'uncl-dot', type: 'circle', source: SRC,
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-color': '#0041CE',
        'circle-radius': 8,
        'circle-stroke-width': 3,
        'circle-stroke-color': '#ffffff',
      },
    });

    // Price labels
    map.addLayer({
      id: 'uncl-label', type: 'symbol', source: SRC,
      filter: ['!', ['has', 'point_count']],
      layout: {
        'text-field': ['get', 'price'],
        'text-font': ['DIN Offc Pro Bold', 'Arial Unicode MS Bold'],
        'text-size': 12,
        'text-offset': [0, -2],
        'text-anchor': 'bottom',
        'text-allow-overlap': false,
      },
      paint: {
        'text-color': '#0041CE',
        'text-halo-color': '#ffffff',
        'text-halo-width': 2,
      },
    });

    // Click cluster → zoom in
    map.on('click', 'cl-circle', (e) => {
      const f = map.queryRenderedFeatures(e.point, { layers: ['cl-circle'] });
      if (!f.length) return;
      const cid = f[0].properties?.cluster_id;
      const g = f[0].geometry as GeoJSON.Point;
      (map.getSource(SRC) as mapboxgl.GeoJSONSource).getClusterExpansionZoom(cid, (err, z) => {
        if (err || z == null) return;
        map.easeTo({ center: g.coordinates as [number, number], zoom: z + 0.5, duration: 500 });
      });
    });

    // Click individual point → popup
    map.on('click', 'uncl-dot', (e) => {
      const f = map.queryRenderedFeatures(e.point, { layers: ['uncl-dot'] });
      if (!f.length) return;
      const id = f[0].properties?.id;
      const g = f[0].geometry as GeoJSON.Point;
      onSelRef.current(id);
      showPopup(map, id, g.coordinates as [number, number]);
    });

    map.on('mouseenter', 'cl-circle', () => { map.getCanvas().style.cursor = 'pointer'; });
    map.on('mouseleave', 'cl-circle', () => { map.getCanvas().style.cursor = ''; });
    map.on('mouseenter', 'uncl-dot', () => { map.getCanvas().style.cursor = 'pointer'; });
    map.on('mouseleave', 'uncl-dot', () => { map.getCanvas().style.cursor = ''; });
  }, [showPopup]);

  // Init
  useEffect(() => {
    if (!cRef.current || mRef.current) return;
    injectPopupCSS();
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? '';

    const map = new mapboxgl.Map({
      container: cRef.current,
      style: isDark ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/light-v11',
      center: CENTER, zoom: ZOOM,
      attributionControl: false,
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right');
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-left');

    const emit = () => { const b = map.getBounds(); if (b) onBndRef.current({ north: b.getNorth(), south: b.getSouth(), east: b.getEast(), west: b.getWest() }); };

    map.on('style.load', () => { setupLayers(map); emit(); });
    map.on('moveend', emit);

    mRef.current = map;
    return () => { map.remove(); mRef.current = null; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Theme
  useEffect(() => {
    const map = mRef.current;
    if (!map || !map.isStyleLoaded()) return;
    map.setStyle(isDark ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/light-v11');
  }, [isDark]);

  // Data update
  useEffect(() => {
    const map = mRef.current;
    if (!map) return;
    try {
      const src = map.getSource(SRC) as mapboxgl.GeoJSONSource;
      if (src) src.setData(toGeo(properties));
    } catch {}
  }, [properties]);

  // FlyTo property
  useEffect(() => {
    if (!selectedId) return;
    const map = mRef.current;
    if (!map) return;
    const p = properties.find(x => x.id === selectedId);
    if (!p?.geo_lat || !p?.geo_long) return;
    const lat = parseFloat(p.geo_lat), lng = parseFloat(p.geo_long);
    if (isNaN(lat) || isNaN(lng)) return;
    map.flyTo({ center: [lng, lat], zoom: Math.max(map.getZoom(), 15), duration: 700 });
    showPopup(map, selectedId, [lng, lat]);
  }, [selectedId, properties, showPopup]);

  // FlyTo from search
  useEffect(() => {
    if (!flyToLocation) return;
    mRef.current?.flyTo({ center: flyToLocation, zoom: 14, duration: 1000 });
  }, [flyToLocation]);

  return <div ref={cRef} className="w-full h-full" />;
}
