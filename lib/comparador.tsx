'use client';
// ============================================================
// lib/comparador.tsx — Context global para comparar propiedades
// Máximo 3 propiedades simultáneas
// ============================================================
import { createContext, useContext, useState } from 'react';
import type { Property } from './tokko';

interface ComparadorContextType {
  seleccionadas: Property[];
  toggleComparar: (p: Property) => void;
  isSeleccionada: (id: number) => boolean;
  limpiar: () => void;
}

const ComparadorContext = createContext<ComparadorContextType | null>(null);

export function ComparadorProvider({ children }: { children: React.ReactNode }) {
  const [seleccionadas, setSeleccionadas] = useState<Property[]>([]);

  function toggleComparar(p: Property) {
    setSeleccionadas((prev) => {
      if (prev.find((x) => x.id === p.id)) return prev.filter((x) => x.id !== p.id);
      if (prev.length >= 3) return prev; // máx 3
      return [...prev, p];
    });
  }

  function isSeleccionada(id: number) {
    return seleccionadas.some((x) => x.id === id);
  }

  function limpiar() { setSeleccionadas([]); }

  return (
    <ComparadorContext.Provider value={{ seleccionadas, toggleComparar, isSeleccionada, limpiar }}>
      {children}
    </ComparadorContext.Provider>
  );
}

export function useComparador() {
  const ctx = useContext(ComparadorContext);
  if (!ctx) throw new Error('useComparador debe usarse dentro de ComparadorProvider');
  return ctx;
}
