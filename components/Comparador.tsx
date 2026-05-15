'use client';
// ============================================================
// components/Comparador.tsx
// Barra flotante + Modal de comparación de propiedades (máx 3)
// ============================================================
import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useComparador } from '@/lib/comparador';
import { getPriceInfo, formatPriceLabel, getFrontPhoto } from '@/lib/tokko';

export default function Comparador() {
  const { seleccionadas, toggleComparar, limpiar } = useComparador();
  const [modalOpen, setModalOpen] = useState(false);
  const closedByBackRef = useRef(false);

  // Botón atrás del navegador — cerrar modal de comparación
  useEffect(() => {
    if (!modalOpen) { closedByBackRef.current = false; return; }
    history.pushState({ comparador: true }, '');
    function handler() {
      if (!closedByBackRef.current) {
        closedByBackRef.current = true;
        setModalOpen(false);
      }
    }
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, [modalOpen]);

  const closeModal = useCallback(() => {
    if (!closedByBackRef.current) {
      closedByBackRef.current = true;
      setModalOpen(false);
      history.back();
    }
  }, []);

  if (seleccionadas.length < 2 && !modalOpen) return null;

  const waNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '5493417538537';

  return (
    <>
      {/* ── Barra flotante ─────────────────────────────────── */}
      {!modalOpen && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[500] animate-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center gap-3 bg-gray-900 dark:bg-[#161b22] text-white rounded-full shadow-2xl px-5 py-3 border border-white/10">
            {/* Miniaturas */}
            <div className="flex -space-x-2">
              {seleccionadas.map((p) => {
                const photo = getFrontPhoto(p);
                return (
                  <div key={p.id} className="w-8 h-8 rounded-full overflow-hidden border-2 border-gray-700 bg-gray-600 shrink-0">
                    <img src={photo} alt={p.address} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  </div>
                );
              })}
            </div>

            <span className="text-sm font-semibold whitespace-nowrap">
              Comparar {seleccionadas.length} propiedades
            </span>

            <button
              onClick={() => setModalOpen(true)}
              className="bg-[#0041CE] hover:bg-[#0061FB] text-white text-sm font-semibold px-4 py-1.5 rounded-full transition-colors"
            >
              Ver →
            </button>

            <button
              onClick={limpiar}
              className="text-gray-400 hover:text-white transition-colors ml-1"
              title="Cancelar comparación"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* ── Modal comparación ───────────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-[600] bg-black/70 backdrop-blur-sm flex flex-col" onClick={closeModal}>
          <div
            className="relative bg-white dark:bg-[#0d1117] flex flex-col h-full md:h-auto md:max-h-[90vh] md:m-auto md:w-full md:max-w-4xl md:rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-[#21262d] shrink-0">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Comparando propiedades</h2>
                <p className="text-xs text-gray-400 mt-0.5">{seleccionadas.length} propiedades seleccionadas</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={limpiar}
                  className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#21262d]"
                >
                  Limpiar
                </button>
                <button
                  onClick={closeModal}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-[#21262d] transition text-gray-500 dark:text-gray-400"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Tabla */}
            <div className="overflow-auto flex-1">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <td className="w-36 px-4 py-3 bg-gray-50 dark:bg-[#161b22] border-b border-r border-gray-100 dark:border-[#21262d] text-xs font-semibold text-gray-400 uppercase tracking-wider"></td>
                    {seleccionadas.map((p) => {
                      const { price, currency } = getPriceInfo(p);
                      const priceLabel = formatPriceLabel(price, currency);
                      const photo = getFrontPhoto(p);
                      return (
                        <td key={p.id} className="px-4 py-3 bg-gray-50 dark:bg-[#161b22] border-b border-r border-gray-100 dark:border-[#21262d] min-w-[200px]">
                          <div className="flex flex-col gap-2">
                            {/* Foto */}
                            <div className="relative rounded-lg overflow-hidden bg-gray-200" style={{ height: '110px' }}>
                              <Image src={photo} alt={p.address} fill className="object-cover" onError={() => {}} />
                            </div>
                            <p className="text-[15px] font-bold text-gray-900 dark:text-white">{priceLabel}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight">{p.address}</p>
                            <button
                              onClick={() => toggleComparar(p)}
                              className="text-xs text-gray-400 hover:text-rose-500 transition self-start"
                            >
                              Quitar
                            </button>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {/* Tipo */}
                  <tr className="border-b border-gray-100 dark:border-[#21262d]">
                    <td className="px-4 py-3 bg-white dark:bg-[#0d1117] border-r border-gray-100 dark:border-[#21262d] text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">Tipo</td>
                    {seleccionadas.map((p) => (
                      <td key={p.id} className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200 border-r border-gray-100 dark:border-[#21262d]">
                        {p.property_type?.name ?? '—'}
                      </td>
                    ))}
                  </tr>
                  {/* Operación */}
                  <tr className="border-b border-gray-100 dark:border-[#21262d] bg-gray-50/50 dark:bg-[#161b22]/50">
                    <td className="px-4 py-3 bg-white dark:bg-[#0d1117] border-r border-gray-100 dark:border-[#21262d] text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">Operación</td>
                    {seleccionadas.map((p) => (
                      <td key={p.id} className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200 border-r border-gray-100 dark:border-[#21262d]">
                        {p.operations?.[0]?.name ?? '—'}
                      </td>
                    ))}
                  </tr>
                  {/* Sup. total */}
                  <tr className="border-b border-gray-100 dark:border-[#21262d]">
                    <td className="px-4 py-3 bg-white dark:bg-[#0d1117] border-r border-gray-100 dark:border-[#21262d] text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">Sup. total</td>
                    {seleccionadas.map((p) => (
                      <td key={p.id} className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200 border-r border-gray-100 dark:border-[#21262d]">
                        {p.surface_total ? `${p.surface_total} m²` : '—'}
                      </td>
                    ))}
                  </tr>
                  {/* Sup. cubierta */}
                  <tr className="border-b border-gray-100 dark:border-[#21262d] bg-gray-50/50 dark:bg-[#161b22]/50">
                    <td className="px-4 py-3 bg-white dark:bg-[#0d1117] border-r border-gray-100 dark:border-[#21262d] text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">Sup. cubierta</td>
                    {seleccionadas.map((p) => (
                      <td key={p.id} className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200 border-r border-gray-100 dark:border-[#21262d]">
                        {p.surface_covered ? `${p.surface_covered} m²` : '—'}
                      </td>
                    ))}
                  </tr>
                  {/* Ambientes */}
                  <tr className="border-b border-gray-100 dark:border-[#21262d]">
                    <td className="px-4 py-3 bg-white dark:bg-[#0d1117] border-r border-gray-100 dark:border-[#21262d] text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">Ambientes</td>
                    {seleccionadas.map((p) => (
                      <td key={p.id} className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200 border-r border-gray-100 dark:border-[#21262d]">
                        {p.rooms ?? '—'}
                      </td>
                    ))}
                  </tr>
                  {/* Baños */}
                  <tr className="border-b border-gray-100 dark:border-[#21262d] bg-gray-50/50 dark:bg-[#161b22]/50">
                    <td className="px-4 py-3 bg-white dark:bg-[#0d1117] border-r border-gray-100 dark:border-[#21262d] text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">Baños</td>
                    {seleccionadas.map((p) => (
                      <td key={p.id} className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200 border-r border-gray-100 dark:border-[#21262d]">
                        {p.bathroom_amount ?? '—'}
                      </td>
                    ))}
                  </tr>
                  {/* Cocheras */}
                  <tr className="border-b border-gray-100 dark:border-[#21262d]">
                    <td className="px-4 py-3 bg-white dark:bg-[#0d1117] border-r border-gray-100 dark:border-[#21262d] text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">Cocheras</td>
                    {seleccionadas.map((p) => (
                      <td key={p.id} className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200 border-r border-gray-100 dark:border-[#21262d]">
                        {p.parking_lot_amount ?? '—'}
                      </td>
                    ))}
                  </tr>
                  {/* CTAs */}
                  <tr>
                    <td className="px-4 py-4 bg-white dark:bg-[#0d1117] border-r border-gray-100 dark:border-[#21262d] text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">Acciones</td>
                    {seleccionadas.map((p) => {
                      const { price, currency } = getPriceInfo(p);
                      const priceLabel = formatPriceLabel(price, currency);
                      const waText = encodeURIComponent(`Hola! Me interesa la propiedad en ${p.address} (${priceLabel}). ¿Pueden darme más información?`);
                      return (
                        <td key={p.id} className="px-4 py-4 border-r border-gray-100 dark:border-[#21262d]">
                          <div className="flex flex-col gap-2">
                            <a
                              href={`https://wa.me/${waNumber}?text=${waText}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe5d] text-white text-xs font-semibold py-2 px-3 rounded-lg transition"
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                              WhatsApp
                            </a>
                            <Link
                              href={`/propiedad/${p.id}`}
                              className="flex items-center justify-center bg-gray-100 dark:bg-[#21262d] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#30363d] text-xs font-semibold py-2 px-3 rounded-lg transition"
                            >
                              Ver detalle
                            </Link>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
