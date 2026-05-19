'use client';
// ============================================================
// components/SearchBar.tsx
// Buscador local — sugerencias basadas en propiedades cargadas
// Sin Mapbox geocoding, sin sugerencias externas.
// ============================================================
import { useState, useRef, useEffect, useMemo } from 'react';
import { Property } from '@/lib/tokko';

/** Normaliza tildes y mayúsculas para búsqueda case/accent-insensitive */
function norm(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

interface SearchBarProps {
  onSelect: (center: [number, number], placeName: string) => void;
  onSearchText?: (text: string) => void;
  properties?: Property[];
  className?: string;
}

interface Suggestion {
  label: string;
  sublabel: string;
  searchText: string;
  center?: [number, number];
}

export default function SearchBar({ onSelect, onSearchText, properties = [], className = '' }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // ── Generar sugerencias únicas desde las propiedades cargadas ──
  const suggestions: Suggestion[] = useMemo(() => {
    const q = norm(query.trim());
    if (q.length < 2) return [];

    const seen = new Set<string>();
    const results: Suggestion[] = [];

    // 1. Localidades / barrios desde full_location y short_location
    for (const p of properties) {
      // Tokko devuelve full_location="Argentina | Santa Fe | Rold\u00e1n | Punta Chacra"
      // Usamos ese string para extraer todas las partes de la jerarquía
      const fullLoc   = p.location?.full_location  ?? '';
      const shortLoc  = p.location?.short_location ?? '';
      const locName   = p.location?.name           ?? '';

      // Juntamos todas las partes relevantes
      const parts = [
        locName,
        ...shortLoc.split('|').map(s => s.trim()).filter(Boolean),
      ];
      // Deduplicate parts
      const uniqueParts = [...new Set(parts)];

      const lat = p.geo_lat  ? parseFloat(p.geo_lat)  : null;
      const lng = p.geo_long ? parseFloat(p.geo_long) : null;

      for (const part of uniqueParts) {
        if (part && norm(part).includes(q) && !seen.has(norm(part))) {
          seen.add(norm(part));
          results.push({
            label:      part,
            sublabel:   fullLoc || 'Zona / Localidad',
            searchText: part,
            center:     lat && lng ? [lng, lat] : undefined,
          });
        }
      }
    }

    // 2. Propiedades específicas (dirección + título)
    for (const p of properties) {
      const addr  = (p.real_address ?? p.address ?? '').trim();
      const title = (p.title ?? p.publication_title ?? '').trim();
      const matchAddr  = norm(addr).includes(q);
      const matchTitle = norm(title).includes(q);
      const matchDesc  = norm(p.description ?? '').includes(q);
      const matchTags  = p.tags?.some(t => norm(t.name ?? '').includes(q)) ?? false;

      if ((matchAddr || matchTitle || matchDesc || matchTags) && !seen.has(String(p.id))) {
        seen.add(String(p.id));
        const lat = p.geo_lat  ? parseFloat(p.geo_lat)  : null;
        const lng = p.geo_long ? parseFloat(p.geo_long) : null;
        results.push({
          label:      addr || title,
          sublabel:   p.property_type?.name ?? 'Propiedad',
          searchText: addr || title,
          center:     lat && lng ? [lng, lat] : undefined,
        });
      }
    }

    return results.slice(0, 7); // máximo 7 sugerencias
  }, [query, properties]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setQuery(val);
    onSearchText?.(val);
    setIsOpen(val.trim().length >= 2);
  }

  function handleSelect(s: Suggestion) {
    setQuery(s.searchText);
    setIsOpen(false);
    onSearchText?.(s.searchText);
    if (s.center) onSelect(s.center, s.searchText);
  }

  function handleClear() {
    setQuery('');
    setIsOpen(false);
    onSearchText?.('');
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') { setIsOpen(false); }
    if (e.key === 'Enter') {
      setIsOpen(false);
      // Bajar el teclado en mobile
      (e.target as HTMLInputElement).blur();
    }
  }

  // Cerrar al hacer click fuera
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Input */}
      <div className={`flex items-center gap-2 h-9 px-3 rounded-full border transition-all duration-200 bg-white dark:bg-[#161b22] ${
        isFocused
          ? 'border-[#0041CE] ring-2 ring-[#0041CE]/10 shadow-sm'
          : 'border-gray-200 dark:border-[#30363d] shadow-sm'
      }`}>
        <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <input
          type="search"
          inputMode="search"
          enterKeyHint="search"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => { setIsFocused(true); if (query.trim().length >= 2) setIsOpen(true); }}
          onBlur={() => setIsFocused(false)}
          placeholder="Buscar propiedad, barrio o dirección..."
          style={{ fontSize: '16px' }}
          className="flex-1 bg-transparent text-gray-800 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none min-w-0"
        />
        {query && (
          <button
            onClick={handleClear}
            className="shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Dropdown — sugerencias de propiedades reales */}
      {isOpen && suggestions.length > 0 && (
        <ul className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-[#161b22] border border-gray-100 dark:border-[#30363d] rounded-xl shadow-xl overflow-hidden z-[300]">
          {suggestions.map((s, i) => (
            <li key={i}>
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(s)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-[#21262d] transition text-sm group"
              >
                <svg className="w-4 h-4 text-gray-400 group-hover:text-[#0041CE] shrink-0 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
                <div className="min-w-0">
                  <p className="font-medium text-gray-800 dark:text-gray-200 truncate">{s.label}</p>
                  <p className="text-xs text-gray-400 truncate">{s.sublabel}</p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Sin resultados */}
      {isOpen && query.trim().length >= 2 && suggestions.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-[#161b22] border border-gray-100 dark:border-[#30363d] rounded-xl shadow-xl z-[300] px-4 py-3">
          <p className="text-sm text-gray-400">Sin resultados para &ldquo;{query}&rdquo;</p>
        </div>
      )}
    </div>
  );
}
