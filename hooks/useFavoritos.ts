'use client';

// ============================================================
// hooks/useFavoritos.ts
// Lee y escribe favoritos en localStorage (key: netze_favoritos)
// ============================================================

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'netze_favoritos';

export function useFavoritos() {
  // Inicializado como array vacío para evitar mismatch SSR
  const [favoritos, setFavoritos] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Leer localStorage solo en el cliente después del montaje
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setFavoritos(JSON.parse(stored) as string[]);
      }
    } catch {
      // localStorage no disponible (SSR, iframe, etc.)
    }
    setHydrated(true);
  }, []);

  // Sincronizar a localStorage cuando cambia el estado
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favoritos));
    } catch {
      // ignore
    }
  }, [favoritos, hydrated]);

  const toggleFavorito = useCallback((id: string | number) => {
    const stringId = String(id);
    setFavoritos((prev) =>
      prev.includes(stringId) ? prev.filter((f) => f !== stringId) : [...prev, stringId]
    );
  }, []);

  const esFavorito = useCallback(
    (id: string | number): boolean => {
      return favoritos.includes(String(id));
    },
    [favoritos]
  );

  return { favoritos, toggleFavorito, esFavorito, hydrated };
}
