'use client';
// ============================================================
// app/admin/zonas/page.tsx — Gestión de zonas activas
// ============================================================
import { useState, useEffect } from 'react';

interface Zone {
  name: string;
  lat: number;
  lng: number;
}

export default function AdminZonasPage() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [newName, setNewName] = useState('');
  const [newLat, setNewLat] = useState('');
  const [newLng, setNewLng] = useState('');

  useEffect(() => {
    fetch('/api/admin/settings?key=active_zones')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data.value)) setZones(data.value);
      })
      .finally(() => setLoading(false));
  }, []);

  async function saveZones(newZones: Zone[]) {
    setSaving(true);
    setSaved(false);
    try {
      await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'active_zones', value: newZones }),
      });
      setZones(newZones);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error('[Admin] Error guardando zonas:', e);
    } finally {
      setSaving(false);
    }
  }

  function addZone() {
    if (!newName.trim()) return;
    const lat = parseFloat(newLat);
    const lng = parseFloat(newLng);
    if (isNaN(lat) || isNaN(lng)) return;
    const zone: Zone = { name: newName.trim(), lat, lng };
    saveZones([...zones, zone]);
    setNewName('');
    setNewLat('');
    setNewLng('');
  }

  function removeZone(idx: number) {
    saveZones(zones.filter((_, i) => i !== idx));
  }

  // Zonas predefinidas de Rosario para agregar rápido
  const presets: Zone[] = [
    { name: 'Centro', lat: -32.9468, lng: -60.6393 },
    { name: 'Fisherton', lat: -32.9150, lng: -60.7150 },
    { name: 'Pichincha', lat: -32.9365, lng: -60.6368 },
    { name: 'Echesortu', lat: -32.9450, lng: -60.6650 },
    { name: 'Macrocentro', lat: -32.9400, lng: -60.6500 },
    { name: 'Funes', lat: -32.9120, lng: -60.8100 },
    { name: 'Roldán', lat: -32.8900, lng: -60.9100 },
    { name: 'Zona Sur', lat: -32.9700, lng: -60.6400 },
    { name: 'Zona Norte', lat: -32.9000, lng: -60.6700 },
    { name: 'Alberdi', lat: -32.9150, lng: -60.6700 },
  ];

  const unusedPresets = presets.filter(p => !zones.some(z => z.name === p.name));

  if (loading) {
    return (
      <div className="max-w-3xl">
        <div className="h-8 bg-gray-200 dark:bg-[#21262d] rounded w-32 mb-6 animate-pulse" />
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-16 bg-white dark:bg-[#161b22] border border-gray-100 dark:border-[#30363d] rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Zonas Activas</h1>
        <p className="text-sm text-gray-400 mt-1">
          Definí los barrios y zonas que aparecen como filtro rápido en el mapa del portal.
        </p>
      </div>

      {/* Zonas existentes */}
      {zones.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-[#161b22] border border-gray-100 dark:border-[#30363d] rounded-2xl mb-6">
          <svg className="mx-auto mb-3 text-gray-300 dark:text-gray-600" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
          </svg>
          <p className="text-sm text-gray-400">No hay zonas configuradas aún.</p>
          <p className="text-xs text-gray-400 mt-1">Agregá zonas usando los presets o el formulario manual.</p>
        </div>
      ) : (
        <div className="space-y-2 mb-6">
          {zones.map((zone, idx) => (
            <div key={idx} className="bg-white dark:bg-[#161b22] border border-gray-100 dark:border-[#30363d] rounded-xl px-4 py-3 flex items-center gap-4">
              <div className="w-9 h-9 rounded-xl bg-[#0041CE]/10 flex items-center justify-center shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0041CE" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{zone.name}</p>
                <p className="text-[11px] text-gray-400 font-mono">{zone.lat.toFixed(4)}, {zone.lng.toFixed(4)}</p>
              </div>
              <button
                onClick={() => removeZone(idx)}
                disabled={saving}
                className="text-xs text-gray-400 hover:text-rose-500 transition-colors disabled:opacity-50"
                title="Eliminar zona"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Presets rápidos */}
      {unusedPresets.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Agregar rápido</h3>
          <div className="flex flex-wrap gap-2">
            {unusedPresets.map(preset => (
              <button
                key={preset.name}
                onClick={() => saveZones([...zones, preset])}
                disabled={saving}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 bg-white dark:bg-[#161b22] border border-gray-200 dark:border-[#30363d] rounded-lg hover:border-[#0041CE] hover:text-[#0041CE] dark:hover:border-[#0061FB] dark:hover:text-[#0061FB] transition-colors disabled:opacity-50"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                {preset.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Agregar manual */}
      <div className="bg-white dark:bg-[#161b22] border border-gray-100 dark:border-[#30363d] rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-4">Agregar zona personalizada</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1">Nombre</label>
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Ej: Barrio Norte"
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-[#30363d] bg-white dark:bg-[#0d1117] text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0041CE]/20 focus:border-[#0041CE] transition"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1">Latitud</label>
            <input
              type="number"
              step="any"
              value={newLat}
              onChange={e => setNewLat(e.target.value)}
              placeholder="-32.9468"
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-[#30363d] bg-white dark:bg-[#0d1117] text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0041CE]/20 focus:border-[#0041CE] transition"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1">Longitud</label>
            <input
              type="number"
              step="any"
              value={newLng}
              onChange={e => setNewLng(e.target.value)}
              placeholder="-60.6393"
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-[#30363d] bg-white dark:bg-[#0d1117] text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0041CE]/20 focus:border-[#0041CE] transition"
            />
          </div>
        </div>
        <button
          onClick={addZone}
          disabled={!newName.trim() || !newLat || !newLng || saving}
          className="mt-4 px-5 py-2 bg-[#0041CE] hover:bg-[#0031a0] disabled:opacity-40 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
        >
          Agregar zona
        </button>
      </div>

      {/* Toast de guardado */}
      {saved && (
        <div className="fixed bottom-6 right-6 flex items-center gap-2 bg-emerald-500 text-white text-sm font-semibold px-5 py-3 rounded-xl shadow-lg animate-in fade-in slide-in-from-bottom-2 z-50">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          Zonas guardadas
        </div>
      )}
    </div>
  );
}
