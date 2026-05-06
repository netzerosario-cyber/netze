'use client';
// ============================================================
// app/admin/propiedades/page.tsx — Listado + gestión de destacados
// ============================================================
import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Property, getPriceInfo, formatPriceLabel, getFrontPhoto } from '@/lib/tokko';

export default function AdminPropiedadesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [featuredIds, setFeaturedIds] = useState<number[]>([]);
  const [savingId, setSavingId] = useState<number | null>(null);
  const PAGE_SIZE = 20;

  // Cargar propiedades + destacados
  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch('/api/propiedades?offset=0&limit=200&filters={}').then(r => r.json()),
      fetch('/api/admin/settings?key=featured_ids').then(r => r.json()),
    ]).then(([propsData, featData]) => {
      setProperties(propsData.objects ?? []);
      setFeaturedIds(Array.isArray(featData.value) ? featData.value : []);
    }).finally(() => setLoading(false));
  }, []);

  // Toggle destacado
  async function toggleFeatured(id: number) {
    setSavingId(id);
    const newIds = featuredIds.includes(id)
      ? featuredIds.filter(fid => fid !== id)
      : [...featuredIds, id];
    setFeaturedIds(newIds);
    try {
      await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'featured_ids', value: newIds }),
      });
    } catch (e) {
      console.error('[Admin] Error guardando destacados:', e);
      // Revertir
      setFeaturedIds(featuredIds);
    } finally {
      setSavingId(null);
    }
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return properties;
    const q = search.toLowerCase();
    return properties.filter(
      (p) => p.address.toLowerCase().includes(q) || p.title.toLowerCase().includes(q)
    );
  }, [properties, search]);

  // Destacados primero
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const aFeat = featuredIds.includes(a.id) ? 0 : 1;
      const bFeat = featuredIds.includes(b.id) ? 0 : 1;
      return aFeat - bFeat;
    });
  }, [filtered, featuredIds]);

  const paginated = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Propiedades</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {filtered.length} propiedades · {featuredIds.length} destacada{featuredIds.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 shrink-0" width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            placeholder="Buscar por dirección..."
            className="pl-9 pr-4 py-2 rounded-xl border border-gray-200 dark:border-[#30363d] bg-white dark:bg-[#161b22] text-sm text-gray-800 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0041CE]/20 focus:border-[#0041CE] transition w-64"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-[#161b22] border border-gray-100 dark:border-[#30363d] rounded-xl p-4 flex items-center gap-4 animate-pulse">
              <div className="w-16 h-12 bg-gray-200 dark:bg-[#21262d] rounded-lg shrink-0" />
              <div className="flex-1 flex flex-col gap-2">
                <div className="h-4 bg-gray-200 dark:bg-[#21262d] rounded w-48" />
                <div className="h-3 bg-gray-100 dark:bg-[#161b22] rounded w-32" />
              </div>
            </div>
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg font-semibold">No se encontraron propiedades</p>
          <p className="text-sm mt-1">Intentá con otra búsqueda.</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            {paginated.map((p) => {
              const { price, currency } = getPriceInfo(p);
              const priceLabel = formatPriceLabel(price, currency);
              const photo = getFrontPhoto(p);
              const opType = p.operations?.[0]?.name ?? '';
              const isFeatured = featuredIds.includes(p.id);
              const isSaving = savingId === p.id;
              return (
                <div
                  key={p.id}
                  className={`bg-white dark:bg-[#161b22] border rounded-xl p-4 flex items-center gap-4 transition-colors ${
                    isFeatured
                      ? 'border-amber-300 dark:border-amber-500/40 bg-amber-50/50 dark:bg-amber-500/5'
                      : 'border-gray-100 dark:border-[#30363d] hover:border-[#0041CE]/30 dark:hover:border-[#0061FB]/30'
                  }`}
                >
                  {/* Toggle destacado */}
                  <button
                    onClick={() => toggleFeatured(p.id)}
                    disabled={isSaving}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                      isFeatured
                        ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-500 hover:bg-amber-200 dark:hover:bg-amber-500/30'
                        : 'bg-gray-100 dark:bg-[#21262d] text-gray-300 dark:text-gray-600 hover:bg-amber-50 dark:hover:bg-amber-500/10 hover:text-amber-400'
                    } ${isSaving ? 'opacity-50 animate-pulse' : ''}`}
                    title={isFeatured ? 'Quitar de destacados' : 'Marcar como destacada'}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill={isFeatured ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                    </svg>
                  </button>

                  {/* Foto */}
                  <div className="relative w-16 h-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-[#21262d] shrink-0">
                    <Image src={photo} alt={p.address} fill className="object-cover" onError={() => {}} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{p.address}</p>
                      {isFeatured && (
                        <span className="text-[10px] bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full font-semibold whitespace-nowrap">
                          ⭐ Destacada
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs text-gray-500 dark:text-gray-400">{priceLabel}</span>
                      {opType && (
                        <span className="text-[10px] bg-[#0041CE]/10 text-[#0041CE] dark:text-[#0061FB] px-2 py-0.5 rounded-full">{opType}</span>
                      )}
                    </div>
                  </div>

                  {/* Link */}
                  <Link
                    href={`/propiedad/${p.id}`}
                    target="_blank"
                    className="text-xs text-[#0041CE] dark:text-[#0061FB] font-medium hover:underline whitespace-nowrap shrink-0"
                  >
                    Ver →
                  </Link>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-[#30363d] disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-[#21262d] transition"
              >
                ← Anterior
              </button>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Página {page + 1} de {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page === totalPages - 1}
                className="px-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-[#30363d] disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-[#21262d] transition"
              >
                Siguiente →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
