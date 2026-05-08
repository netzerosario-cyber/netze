'use client';
import { useRef, useEffect } from 'react';
import { Property } from '@/lib/tokko';
import PropertyCard from './PropertyCard';

interface PropertyListProps {
  properties: Property[];
  selectedId?: number | null;
  loading?: boolean;
  hasMore?: boolean;
  featuredIds?: number[];
  onSelect: (id: number) => void;
  onLoadMore?: () => void;
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl overflow-hidden border border-gray-100 dark:border-[#30363d] bg-white dark:bg-[#161b22] animate-pulse">
      <div className="aspect-[16/10] bg-gray-200 dark:bg-[#21262d]" />
      <div className="p-4 space-y-3">
        <div className="flex justify-between">
          <div className="h-5 bg-gray-200 dark:bg-[#21262d] rounded w-28" />
          <div className="h-5 bg-gray-100 dark:bg-[#30363d] rounded-full w-20" />
        </div>
        <div className="h-4 bg-gray-100 dark:bg-[#21262d] rounded w-full" />
        <div className="flex gap-3">
          <div className="h-3.5 bg-gray-100 dark:bg-[#21262d] rounded w-16" />
          <div className="h-3.5 bg-gray-100 dark:bg-[#21262d] rounded w-16" />
        </div>
        <div className="flex gap-2 pt-1">
          <div className="flex-1 h-10 bg-gray-100 dark:bg-[#21262d] rounded-xl" />
          <div className="flex-1 h-10 bg-gray-200 dark:bg-[#30363d] rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export default function PropertyList({ properties, selectedId, loading = false, hasMore = false, featuredIds = [], onSelect, onLoadMore }: PropertyListProps) {
  const selectedRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    selectedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [selectedId]);

  if (loading && properties.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto p-3 bg-gray-50 dark:bg-[#0d1117] h-full">
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  if (!loading && properties.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center bg-gray-50 dark:bg-[#0d1117]">
        <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-[#21262d] flex items-center justify-center">
          <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
          </svg>
        </div>
        <div>
          <p className="font-semibold text-gray-800 dark:text-gray-100 mb-1">Sin propiedades en esta área</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">Mové el mapa o cambiá los filtros.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-50 dark:bg-[#0d1117]">
      {/* Header con conteo */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-[#21262d] bg-white dark:bg-[#0d1117]">
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
          {properties.length} {properties.length === 1 ? 'propiedad' : 'propiedades'}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500">en el área visible</p>
      </div>

      {/* Grilla scrolleable — 2 columnas */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="grid grid-cols-2 gap-3">
          {properties.map((property) => {
            const isSel = property.id === selectedId;
            return (
              <div key={property.id} ref={isSel ? selectedRef : null}>
                <PropertyCard property={property} isSelected={isSel} isFeatured={featuredIds.includes(property.id)} onClick={onSelect} />
              </div>
            );
          })}
        </div>

        {hasMore && (
          <button
            onClick={onLoadMore}
            disabled={loading}
            className="w-full mt-3 py-3 text-sm font-semibold border border-gray-200 dark:border-[#30363d] rounded-2xl text-gray-600 dark:text-gray-400 hover:border-brand dark:hover:border-brand-light hover:text-brand dark:hover:text-brand-light hover:bg-brand/5 transition disabled:opacity-50"
          >
            {loading ? 'Cargando...' : 'Ver más propiedades'}
          </button>
        )}
      </div>
    </div>
  );
}
