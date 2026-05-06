'use client';
// ============================================================
// components/SearchBar.tsx
// Buscador de barrio/dirección con Mapbox Geocoding API
// Debounce 350ms · Solo Argentina · max 5 resultados
// ============================================================
import { useState, useRef, useEffect, useCallback } from 'react';

interface Suggestion {
  id: string;
  place_name: string;
  center: [number, number]; // [lng, lat]
  text: string;
}

interface SearchBarProps {
  onSelect: (center: [number, number], placeName: string) => void;
  className?: string;
}

export default function SearchBar({ onSelect, className = '' }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setSuggestions([]); setIsOpen(false); return; }
    setIsLoading(true);
    try {
      const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
      const encoded = encodeURIComponent(q);
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json?country=AR&language=es&limit=5&access_token=${token}`;
      const res = await fetch(url);
      const data = await res.json();
      const results: Suggestion[] = (data.features ?? []).map((f: {
        id: string; place_name: string; center: [number, number]; text: string;
      }) => ({
        id: f.id,
        place_name: f.place_name,
        center: f.center,
        text: f.text,
      }));
      setSuggestions(results);
      setIsOpen(results.length > 0);
    } catch {
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 350);
  }

  function handleSelect(s: Suggestion) {
    setQuery(s.text);
    setSuggestions([]);
    setIsOpen(false);
    onSelect(s.center, s.place_name);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') { setIsOpen(false); setSuggestions([]); }
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
        {isLoading ? (
          <svg className="w-3.5 h-3.5 text-gray-400 animate-spin shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
          </svg>
        ) : (
          <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
        )}
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => { setIsFocused(true); if (suggestions.length > 0) setIsOpen(true); }}
          onBlur={() => setIsFocused(false)}
          placeholder="Buscar barrio o dirección..."
          className="flex-1 bg-transparent text-sm text-gray-800 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none min-w-0"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setSuggestions([]); setIsOpen(false); }}
            className="shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <ul className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-[#161b22] border border-gray-100 dark:border-[#30363d] rounded-xl shadow-xl overflow-hidden z-[300]">
          {suggestions.map((s) => (
            <li key={s.id}>
              <button
                onMouseDown={(e) => e.preventDefault()} // evita blur antes del click
                onClick={() => handleSelect(s)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-[#21262d] transition text-sm group"
              >
                <svg className="w-4 h-4 text-gray-400 group-hover:text-[#0041CE] shrink-0 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
                <div className="min-w-0">
                  <p className="font-medium text-gray-800 dark:text-gray-200 truncate">{s.text}</p>
                  <p className="text-xs text-gray-400 truncate">{s.place_name}</p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
