'use client';
// ============================================================
// components/Lightbox.tsx — Galería fullscreen con portal + navegación
// Se renderiza como portal en document.body para evitar issues de
// scroll/overflow del contenedor padre
// ============================================================
import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';

interface LightboxProps {
  images: { src: string; alt?: string }[];
  initialIndex?: number;
  onClose: () => void;
}

function LightboxContent({ images, initialIndex = 0, onClose }: LightboxProps) {
  const [idx, setIdx] = useState(initialIndex);
  const [loaded, setLoaded] = useState(false);
  const [animate, setAnimate] = useState(false);
  const closedRef = useRef(false);

  const total = images.length;
  const goPrev = useCallback(() => { setLoaded(false); setIdx(i => (i - 1 + total) % total); }, [total]);
  const goNext = useCallback(() => { setLoaded(false); setIdx(i => (i + 1) % total); }, [total]);

  // Cerrar via UI (no back button) — consume history entry
  const closeViaUI = useCallback(() => {
    if (closedRef.current) return;
    closedRef.current = true;
    history.back();
  }, []);

  // Botón atrás del navegador
  useEffect(() => {
    history.pushState({ lightbox: true }, '');
    function handler() {
      if (!closedRef.current) {
        closedRef.current = true;
        onClose();
      }
    }
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, [onClose]);

  // Keyboard navigation
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closeViaUI();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [closeViaUI, goPrev, goNext]);

  // Prevent ALL scrolling
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prev = { htmlO: html.style.overflow, bodyO: body.style.overflow };
    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    requestAnimationFrame(() => setAnimate(true));
    return () => {
      html.style.overflow = prev.htmlO;
      body.style.overflow = prev.bodyO;
    };
  }, []);

  // Touch swipe
  useEffect(() => {
    let startX = 0;
    function onStart(e: TouchEvent) { startX = e.touches[0].clientX; }
    function onEnd(e: TouchEvent) {
      const dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 50) { dx > 0 ? goPrev() : goNext(); }
    }
    window.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchend', onEnd, { passive: true });
    return () => { window.removeEventListener('touchstart', onStart); window.removeEventListener('touchend', onEnd); };
  }, [goPrev, goNext]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center transition-all duration-300 ${animate ? 'bg-black/95 backdrop-blur-md' : 'bg-black/0'}`}
      onClick={closeViaUI}
    >
      {/* Close button */}
      <button
        onClick={closeViaUI}
        className="absolute top-4 right-4 z-10 w-12 h-12 flex items-center justify-center rounded-full bg-white/15 hover:bg-white/25 text-white transition-colors"
        aria-label="Cerrar"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Counter */}
      <div className="absolute top-4 left-4 z-10 bg-white/10 backdrop-blur-sm text-white text-sm font-semibold px-3 py-1.5 rounded-full">
        {idx + 1} / {total}
      </div>

      {/* Prev button */}
      {total > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); goPrev(); }}
          className="absolute left-3 z-10 w-11 h-11 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/25 text-white transition-all hover:scale-110"
          aria-label="Anterior"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
      )}

      {/* Next button */}
      {total > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); goNext(); }}
          className="absolute right-3 z-10 w-11 h-11 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/25 text-white transition-all hover:scale-110"
          aria-label="Siguiente"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      )}

      {/* Image */}
      <div
        className={`relative max-w-[92vw] max-h-[80vh] transition-all duration-300 ${animate ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Loading spinner */}
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center min-w-[200px] min-h-[200px]">
            <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          </div>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={idx}
          src={images[idx].src}
          alt={images[idx].alt ?? `Foto ${idx + 1}`}
          className={`max-w-[92vw] max-h-[80vh] object-contain rounded-lg transition-opacity duration-300 select-none ${loaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setLoaded(true)}
          draggable={false}
        />
      </div>

      {/* Thumbnails strip */}
      {total > 1 && (
        <div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 max-w-[90vw] overflow-x-auto px-2 py-1.5 rounded-xl bg-black/40 backdrop-blur-sm"
          onClick={(e) => e.stopPropagation()}
        >
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => { setLoaded(false); setIdx(i); }}
              className={`w-12 h-9 rounded-lg overflow-hidden shrink-0 transition-all ring-2 ${
                i === idx ? 'ring-white scale-110' : 'ring-transparent opacity-50 hover:opacity-80'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.src} alt="" className="w-full h-full object-cover" draggable={false} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Lightbox(props: LightboxProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;
  return createPortal(<LightboxContent {...props} />, document.body);
}
