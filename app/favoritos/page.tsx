'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useFavoritos } from '@/hooks/useFavoritos';
import { Property } from '@/lib/tokko';
import PropertyCard from '@/components/PropertyCard';

export default function FavoritosPage() {
  const { favoritos, hydrated } = useFavoritos();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!hydrated || favoritos.length === 0) {
      setProperties([]);
      return;
    }

    async function load() {
      setLoading(true);
      try {
        const results = await Promise.allSettled(
          favoritos.map((id) =>
            fetch(`/api/propiedades/${id}`).then((r) => r.json())
          )
        );
        const loaded = results
          .filter((r): r is PromiseFulfilledResult<Property> => r.status === 'fulfilled')
          .map((r) => r.value);
        setProperties(loaded);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [favoritos, hydrated]);

  if (!hydrated || loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Propiedades guardadas</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
              <div className="aspect-[16/10] bg-gray-200" />
              <div className="p-4 flex flex-col gap-2">
                <div className="h-5 bg-gray-200 rounded w-24" />
                <div className="h-4 bg-gray-100 rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (favoritos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center px-8">
        <svg className="w-14 h-14 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
        </svg>
        <div>
          <p className="text-lg font-semibold text-gray-800 mb-1">Todavía no guardaste propiedades</p>
          <p className="text-sm text-gray-400">Tocá el corazón en cualquier propiedad para guardarla.</p>
          <p className="text-xs text-gray-400 mt-1">Se guardan en este dispositivo, sin necesidad de cuenta.</p>
        </div>
        <Link
          href="/"
          className="mt-2 px-5 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-700 transition"
        >
          Explorar propiedades
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Guardadas{' '}
            <span className="text-base font-normal text-gray-400">({favoritos.length})</span>
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">Guardadas en este dispositivo · sin cuenta</p>
        </div>
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-900 transition">
          ← Volver
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {properties.map((property) => (
          <PropertyCard key={property.id} property={property} />
        ))}
      </div>
    </div>
  );
}
