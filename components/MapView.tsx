'use client';
// ============================================================
// components/MapView.tsx
// Sistema de mapa: Mapbox GL con markers HTML nativos + clustering.
//
// Los markers usan anchor:'bottom' para que NUNCA se muevan al
// hacer zoom. El clustering se maneja 100% via GeoJSON source.
// ============================================================
import { useEffect, useRef, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Property, getPriceInfo, formatPriceLabel, getFrontPhoto } from '@/lib/tokko';

// ── Constantes ────────────────────────────────────────────────
const INITIAL_CENTER: [number, number] = [-60.6505, -32.9468];
const INITIAL_ZOOM   = 12;
const SOURCE_ID      = 'netze-props';
const L_CLUSTERS     = 'layer-clusters';
const L_CLUSTER_CNT  = 'layer-cluster-count';
const CLUSTER_RADIUS = 60;
const CLUSTER_MAX_ZOOM = 14;
const STYLE_LIGHT    = 'mapbox://styles/mapbox/light-v11';
const STYLE_DARK     = 'mapbox://styles/mapbox/dark-v11';

export interface BoundingBox {
  north: number; south: number; east: number; west: number;
}

interface MapViewProps {
  properties: Property[];
  selectedId?: number | null;
  isDark?: boolean;
  onBoundsChange: (bbox: BoundingBox) => void;
  onPropertySelect: (id: number) => void;
  flyToLocation?: [number, number] | null;
}

// ── CSS ───────────────────────────────────────────────────────
const MARKER_CSS = `
.netze-marker{cursor:pointer;display:inline-flex;flex-direction:column;align-items:center;pointer-events:auto}
.netze-marker-pill{display:flex;align-items:center;gap:5px;padding:5px 11px 5px 8px;border-radius:999px;background:#0042cd;border:1.5px solid #0042cd;box-shadow:0 2px 8px rgba(0,0,0,.15);transition:transform .2s cubic-bezier(0.34, 1.56, 0.64, 1),box-shadow .2s ease,background .2s ease,border-color .2s ease;white-space:nowrap}
.netze-marker-pill:hover{transform:scale(1.08) translateY(-4px);background:#0062fa;border-color:#0062fa;box-shadow:0 8px 24px rgba(0,98,250,.4)}
.netze-marker-pill:hover .netze-marker-dot{background:#fff}
.netze-marker-pill:hover .netze-marker-price{color:#fff}
.netze-marker-dot{width:7px;height:7px;border-radius:50%;background:#01d3f7;flex-shrink:0}
.netze-marker-price{font-family:var(--font-mazzard),system-ui,sans-serif;font-size:11.5px;font-weight:700;color:#fff;letter-spacing:-.2px}
.netze-marker-tail{width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:7px solid #0042cd;transition:border-top-color .2s ease}
.netze-marker-pill:hover+.netze-marker-tail{border-top-color:#0062fa}
.netze-marker.selected .netze-marker-pill{background:#000d36;border-color:#000d36;box-shadow:0 8px 24px rgba(0,13,54,.5);transform:scale(1.1) translateY(-4px)}
.netze-marker.selected .netze-marker-dot{background:#01d3f7}
.netze-marker.selected .netze-marker-price{color:#fff}
.netze-marker.selected .netze-marker-tail{border-top-color:#000d36}
.dark-map .netze-marker-pill{background:#000d36;border-color:#000d36;box-shadow:0 2px 8px rgba(0,0,0,.5)}
.dark-map .netze-marker-price{color:#bac5d1}
.dark-map .netze-marker-tail{border-top-color:#000d36}
.dark-map .netze-marker.selected .netze-marker-pill{background:#0062fa;border-color:#0062fa;box-shadow:0 4px 16px rgba(0,98,250,.5)}
.dark-map .netze-marker.selected .netze-marker-tail{border-top-color:#0062fa}
`;

function injectCSS() {
  if (document.getElementById('netze-mcss')) return;
  const s = document.createElement('style');
  s.id = 'netze-mcss';
  s.textContent = MARKER_CSS;
  document.head.appendChild(s);
}

// ── Crear HTML del marker ─────────────────────────────────────
function makeEl(label: string, selected: boolean): HTMLDivElement {
  const w = document.createElement('div');
  w.className = `netze-marker${selected ? ' selected' : ''}`;
  w.innerHTML = `<div class="netze-marker-pill"><div class="netze-marker-dot"></div><span class="netze-marker-price">${label}</span></div><div class="netze-marker-tail"></div>`;
  return w;
}

// ── GeoJSON desde propiedades ─────────────────────────────────
function toGeoJSON(props: Property[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: props
      .filter(p => p.geo_lat && p.geo_long)
      .map(p => {
        const lat = parseFloat(p.geo_lat!);
        const lng = parseFloat(p.geo_long!);
        if (isNaN(lat) || isNaN(lng)) return null;
        const { price, currency } = getPriceInfo(p);
        return {
          type: 'Feature' as const,
          geometry: { type: 'Point' as const, coordinates: [lng, lat] },
          properties: { id: p.id, priceLabel: formatPriceLabel(price, currency) },
        };
      })
      .filter(Boolean) as GeoJSON.Feature[],
  };
}

// ── Componente ────────────────────────────────────────────────
export default function MapView({
  properties, selectedId, isDark = false, onBoundsChange, onPropertySelect, flyToLocation,
}: MapViewProps) {
  const containerRef  = useRef<HTMLDivElement>(null);
  const mapRef        = useRef<mapboxgl.Map | null>(null);
  const popupRef      = useRef<mapboxgl.Popup | null>(null);
  const markersRef    = useRef<Map<number, { marker: mapboxgl.Marker; el: HTMLDivElement }>>(new Map());
  const onSelectRef   = useRef(onPropertySelect);
  const onBoundsRef   = useRef(onBoundsChange);
  const propsRef      = useRef(properties);
  const selIdRef      = useRef(selectedId);
  const layersReady   = useRef(false);

  useEffect(() => { onSelectRef.current = onPropertySelect; }, [onPropertySelect]);
  useEffect(() => { onBoundsRef.current = onBoundsChange;   }, [onBoundsChange]);
  useEffect(() => { propsRef.current    = properties;       }, [properties]);
  useEffect(() => { selIdRef.current    = selectedId;       }, [selectedId]);

  // ── Popup ─────────────────────────────────────────────────
  const showPopup = useCallback((map: mapboxgl.Map, prop: Property, lngLat: [number, number]) => {
    popupRef.current?.remove();
    const { price, currency } = getPriceInfo(prop);
    const pl = formatPriceLabel(price, currency);
    const photo = getFrontPhoto(prop);
    const op = prop.operations?.[0]?.name ?? '';
    const wa = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '5493413492000';
    const wt = encodeURIComponent(`Hola! Me interesa la propiedad en ${prop.address} (${pl}). ¿Pueden darme más información?`);
    popupRef.current = new mapboxgl.Popup({ closeButton: true, maxWidth: '260px', offset: [0, -8] })
      .setLngLat(lngLat)
      .setHTML(`<div style="width:240px;font-family:'Inter',sans-serif">
        <a href="/propiedad/${prop.id}" style="display:block;position:relative;height:120px;overflow:hidden;border-radius:10px 10px 0 0;background:#e5e7eb">
          <img src="${photo}" alt="" style="width:100%;height:100%;object-fit:cover" onerror="this.style.display='none'"/>
          ${op ? `<span style="position:absolute;top:8px;left:8px;background:rgba(255,255,255,.95);color:#374151;font-size:10px;font-weight:600;padding:3px 8px;border-radius:20px">${op}</span>` : ''}
        </a>
        <div style="padding:12px">
          <p style="font-size:15px;font-weight:700;color:#111827;margin:0 0 2px">${pl}</p>
          <p style="font-size:12px;color:#6b7280;margin:0 0 10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${prop.address}</p>
          <div style="display:flex;flex-direction:column;gap:6px">
            <a href="https://wa.me/${wa}?text=${wt}" target="_blank" style="display:flex;align-items:center;justify-content:center;gap:6px;background:#25D366;color:#fff;font-size:12px;font-weight:600;padding:8px;border-radius:8px;text-decoration:none">Consultar por WhatsApp</a>
            <a href="/propiedad/${prop.id}" style="display:flex;align-items:center;justify-content:center;background:#f3f4f6;color:#374151;font-size:12px;font-weight:600;padding:8px;border-radius:8px;text-decoration:none">Ver detalle →</a>
          </div>
        </div></div>`)
      .addTo(map);
  }, []);

  // ── Sincronizar markers HTML con el estado del clustering ──
  const syncMarkers = useCallback((map: mapboxgl.Map) => {
    if (!layersReady.current) return;

    const zoom = map.getZoom();
    const showIndividual = zoom > CLUSTER_MAX_ZOOM;

    // Si estamos en zoom bajo (clusters visibles), ocultar todos los markers HTML
    if (!showIndividual) {
      markersRef.current.forEach(({ el }) => { el.style.display = 'none'; });
      return;
    }

    // Zoom alto: mostrar markers HTML, verificar cuáles están en el viewport
    const bounds = map.getBounds();
    markersRef.current.forEach(({ el, marker }) => {
      const lngLat = marker.getLngLat();
      const inView = bounds ? bounds.contains(lngLat) : true;
      el.style.display = inView ? '' : 'none';
    });
  }, []);

  // ── Crear/actualizar markers HTML ─────────────────────────
  const rebuildMarkers = useCallback((map: mapboxgl.Map) => {
    // Crear markers que falten
    propsRef.current.forEach(prop => {
      if (!prop.geo_lat || !prop.geo_long) return;
      if (markersRef.current.has(prop.id)) return;

      const lat = parseFloat(prop.geo_lat);
      const lng = parseFloat(prop.geo_long);
      if (isNaN(lat) || isNaN(lng)) return;

      const { price, currency } = getPriceInfo(prop);
      const el = makeEl(formatPriceLabel(price, currency), prop.id === selIdRef.current);
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        onSelectRef.current(prop.id);
        showPopup(map, prop, [lng, lat]);
      });

      // anchor:'bottom' asegura que el marker se ancla a la coordenada exacta
      const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([lng, lat])
        .addTo(map);

      markersRef.current.set(prop.id, { marker, el });
    });

    // Eliminar markers de propiedades que ya no existen
    const currentIds = new Set(propsRef.current.map(p => p.id));
    markersRef.current.forEach((entry, id) => {
      if (!currentIds.has(id)) { entry.marker.remove(); markersRef.current.delete(id); }
    });

    syncMarkers(map);
  }, [showPopup, syncMarkers]);

  // ── Configurar source + layers de clustering ──────────────
  const setupLayers = useCallback((map: mapboxgl.Map) => {
    layersReady.current = false;

    if (map.getLayer(L_CLUSTER_CNT)) map.removeLayer(L_CLUSTER_CNT);
    if (map.getLayer(L_CLUSTERS))    map.removeLayer(L_CLUSTERS);
    if (map.getSource(SOURCE_ID))    map.removeSource(SOURCE_ID);

    map.addSource(SOURCE_ID, {
      type: 'geojson',
      data: toGeoJSON(propsRef.current),
      cluster: true,
      clusterMaxZoom: CLUSTER_MAX_ZOOM,
      clusterRadius: CLUSTER_RADIUS,
    });

    // Círculos de cluster
    map.addLayer({
      id: L_CLUSTERS, type: 'circle', source: SOURCE_ID,
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': '#0041CE',
        'circle-radius': ['step', ['get', 'point_count'], 24, 10, 30, 50, 38],
        'circle-stroke-color': 'rgba(0,65,206,0.2)',
        'circle-stroke-width': 6,
        'circle-opacity': 0.9,
      },
    });

    // Número dentro del cluster
    map.addLayer({
      id: L_CLUSTER_CNT, type: 'symbol', source: SOURCE_ID,
      filter: ['has', 'point_count'],
      layout: {
        'text-field': '{point_count_abbreviated}',
        'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
        'text-size': 13, 'text-allow-overlap': true,
      },
      paint: { 'text-color': '#ffffff' },
    });

    // Click en cluster → zoom
    map.on('click', L_CLUSTERS, (e) => {
      const fs = map.queryRenderedFeatures(e.point, { layers: [L_CLUSTERS] });
      if (!fs.length) return;
      const cid = fs[0].properties?.cluster_id;
      const geom = fs[0].geometry as GeoJSON.Point;
      (map.getSource(SOURCE_ID) as mapboxgl.GeoJSONSource).getClusterExpansionZoom(
        cid, (err, zoom) => {
          if (err || zoom == null) return;
          map.easeTo({ center: geom.coordinates as [number, number], zoom: zoom + 0.5, duration: 500 });
        }
      );
    });

    map.on('mouseenter', L_CLUSTERS, () => { map.getCanvas().style.cursor = 'pointer'; });
    map.on('mouseleave', L_CLUSTERS, () => { map.getCanvas().style.cursor = ''; });

    layersReady.current = true;
    rebuildMarkers(map);
  }, [rebuildMarkers]);

  // ── Inicializar mapa ──────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    injectCSS();
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? '';

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: isDark ? STYLE_DARK : STYLE_LIGHT,
      center: INITIAL_CENTER,
      zoom: INITIAL_ZOOM,
      attributionControl: false,
    });
    if (isDark) map.getContainer().classList.add('dark-map');

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right');
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-left');

    const emitBounds = () => {
      const b = map.getBounds();
      if (!b) return;
      onBoundsRef.current({ north: b.getNorth(), south: b.getSouth(), east: b.getEast(), west: b.getWest() });
    };

    // Cuando el estilo carga, reconstruir layers
    map.on('style.load', () => { setupLayers(map); emitBounds(); });
    // Sincronizar markers en cada movimiento/zoom
    map.on('moveend', () => { syncMarkers(map); emitBounds(); });
    map.on('zoomend', () => { syncMarkers(map); });

    mapRef.current = map;
    return () => {
      markersRef.current.forEach(({ marker }) => marker.remove());
      markersRef.current.clear();
      map.remove();
      mapRef.current = null;
      layersReady.current = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Cambio de tema ────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    layersReady.current = false;
    markersRef.current.forEach(({ marker }) => marker.remove());
    markersRef.current.clear();
    if (isDark) map.getContainer().classList.add('dark-map');
    else        map.getContainer().classList.remove('dark-map');
    map.setStyle(isDark ? STYLE_DARK : STYLE_LIGHT);
  }, [isDark]);

  // ── Actualizar datos (propiedades nuevas) ─────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !layersReady.current) return;
    try {
      const src = map.getSource(SOURCE_ID) as mapboxgl.GeoJSONSource;
      if (src) src.setData(toGeoJSON(properties));
      rebuildMarkers(map);
    } catch { /* source no lista */ }
  }, [properties, rebuildMarkers]);

  // ── Actualizar estado seleccionado ────────────────────────
  useEffect(() => {
    markersRef.current.forEach(({ el }, id) => {
      el.className = `netze-marker${id === selectedId ? ' selected' : ''}`;
    });
  }, [selectedId]);

  // ── FlyTo al seleccionar propiedad ────────────────────────
  useEffect(() => {
    if (!selectedId) return;
    const map = mapRef.current;
    if (!map) return;
    const p = properties.find(x => x.id === selectedId);
    if (!p?.geo_lat || !p?.geo_long) return;
    const lat = parseFloat(p.geo_lat), lng = parseFloat(p.geo_long);
    if (isNaN(lat) || isNaN(lng)) return;
    map.flyTo({ center: [lng, lat], zoom: Math.max(map.getZoom(), 15), duration: 700 });
  }, [selectedId, properties]);

  // ── FlyTo desde SearchBar ─────────────────────────────────
  useEffect(() => {
    if (!flyToLocation) return;
    mapRef.current?.flyTo({ center: flyToLocation, zoom: 14, duration: 1000 });
  }, [flyToLocation]);

  return <div ref={containerRef} className="w-full h-full" />;
}
