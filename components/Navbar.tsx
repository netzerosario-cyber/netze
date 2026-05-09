'use client';
// ============================================================
// components/Navbar.tsx
// ============================================================
import Link from 'next/link';
import Image from 'next/image';
import { useFavoritos } from '@/hooks/useFavoritos';
import { useTheme } from '@/lib/theme';
import SearchBar from '@/components/SearchBar';

interface NavbarProps {
  /** Callback cuando el usuario selecciona una ubicación del buscador */
  onLocationSelect?: (center: [number, number], placeName: string) => void;
}

export default function Navbar({ onLocationSelect }: NavbarProps) {
  const { favoritos } = useFavoritos();
  const { toggle, isDark } = useTheme();

  return (
    <header className="fixed top-0 inset-x-0 z-50 h-14 flex items-center gap-3 px-4 md:px-6 bg-white/95 dark:bg-[#0d1117]/95 backdrop-blur-sm border-b border-gray-100 dark:border-[#21262d] transition-colors duration-300">

      {/* ── Logo ────────────────────────────────────────── */}
      <Link href="/" className="flex items-center select-none shrink-0">
        <Image 
          src="/logos/Logo Principal.svg" 
          alt="Netze Logo" 
          width={160} 
          height={52} 
          className="block dark:hidden object-contain" 
        />
        <Image 
          src="/logos/Para fondos oscuros.svg" 
          alt="Netze Logo" 
          width={160} 
          height={52} 
          className="hidden dark:block object-contain" 
        />
      </Link>

      {/* ── SearchBar — solo desktop, centrado ─────────── */}
      {onLocationSelect && (
        <div className="hidden md:flex flex-1 max-w-md mx-auto">
          <SearchBar onSelect={onLocationSelect} className="w-full" />
        </div>
      )}

      {/* ── Spacer mobile ─────────────────────────────── */}
      <div className="flex-1 md:hidden" />

      {/* ── Acciones ─────────────────────────────────────── */}
      <div className="flex items-center gap-2 shrink-0">

        {/* Propiedades guardadas */}
        {favoritos.length > 0 && (
          <Link
            href="/favoritos"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 dark:border-[#30363d] hover:border-rose-400 dark:hover:border-rose-400 transition text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            <svg width="16" height="16" className="fill-rose-500 text-rose-500" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
            <span className="hidden sm:inline text-xs font-semibold">{favoritos.length}</span>
          </Link>
        )}

        {/* Toggle Día / Noche */}
        <button
          onClick={toggle}
          title={isDark ? 'Cambiar a modo día' : 'Cambiar a modo noche'}
          className="relative w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 dark:border-[#30363d] hover:border-[#0041CE] dark:hover:border-[#0061FB] transition-all"
        >
          {/* Sol */}
          <svg
            className={`absolute text-amber-500 transition-all duration-300 ${
              isDark ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'
            }`}
            width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
          >
            <circle cx="12" cy="12" r="4" />
            <path strokeLinecap="round" d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
          </svg>

          {/* Luna */}
          <svg
            className={`absolute text-[#0061FB] transition-all duration-300 ${
              isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'
            }`}
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
          </svg>
        </button>
      </div>
    </header>
  );
}
