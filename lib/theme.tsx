'use client';
// ============================================================
// lib/theme.tsx — ThemeProvider + useTheme hook
// Persiste en localStorage, aplica clase 'dark' al <html>
// ============================================================
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeCtx {
  theme: Theme;
  toggle: () => void;
  isDark: boolean;
}

const Ctx = createContext<ThemeCtx>({ theme: 'light', toggle: () => {}, isDark: false });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');

  // Leer preferencia guardada, o default por dispositivo (mobile=dark, desktop=light)
  useEffect(() => {
    const saved = localStorage.getItem('netze-theme') as Theme | null;
    if (saved) {
      setTheme(saved);
    } else {
      // Mobile = dark by default, Desktop = light by default
      const isMobile = window.innerWidth < 768;
      setTheme(isMobile ? 'dark' : 'light');
    }
  }, []);

  // Aplicar clase al <html>
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('netze-theme', theme);
  }, [theme]);

  function toggle() {
    setTheme((t) => (t === 'light' ? 'dark' : 'light'));
  }

  return (
    <Ctx.Provider value={{ theme, toggle, isDark: theme === 'dark' }}>
      {children}
    </Ctx.Provider>
  );
}

export function useTheme() {
  return useContext(Ctx);
}
