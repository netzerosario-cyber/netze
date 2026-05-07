'use client';
// ============================================================
// app/propiedad/[id]/PropertyDetailClient.tsx
// Sidebar de contacto — diseño premium, WhatsApp como CTA principal
// ============================================================
import { useState, useEffect } from 'react';
import { Property, getPriceInfo, formatPriceLabel } from '@/lib/tokko';
import { useFavoritos } from '@/hooks/useFavoritos';
import LeadModal from '@/components/LeadModal';

interface Props { property: Property; }

function buildWaUrl(property: Property, priceLabel: string, type: 'info' | 'visit') {
  const number = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '5493413492000';
  const text = type === 'visit'
    ? `Hola! Me gustaría coordinar una visita para la propiedad en ${property.address} (${priceLabel}). ¿Cuándo podría ser?`
    : `Hola! Me interesa la propiedad en ${property.address} (${priceLabel}). ¿Pueden darme más información?`;
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

function trackEvent(propertyId: number, eventType: string, title?: string, address?: string) {
  fetch('/api/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ property_id: String(propertyId), event_type: eventType, property_title: title, property_address: address }),
  }).catch(() => {});
}

export default function PropertyDetailClient({ property }: Props) {
  const { toggleFavorito, esFavorito } = useFavoritos();
  const isFav = esFavorito(property.id);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { price, currency } = getPriceInfo(property);
  const priceLabel = formatPriceLabel(price, currency);
  const waInfoUrl  = buildWaUrl(property, priceLabel, 'info');
  const waVisitUrl = buildWaUrl(property, priceLabel, 'visit');

  // Track vista de propiedad
  useEffect(() => {
    trackEvent(property.id, 'view', property.title, property.address);
  }, [property.id, property.title, property.address]);

  return (
    <div className="sticky top-20 flex flex-col gap-3">

      {/* ── Precio destacado ──────────────────────────────── */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <div className="bg-gradient-to-br from-[#0041CE] to-[#0061FB] px-5 py-4">
          <p className="text-xs font-semibold text-blue-200 uppercase tracking-wider mb-1">
            {property.operations?.[0]?.name ?? 'Precio'}
          </p>
          <p className="text-3xl font-black text-white tracking-tight">{priceLabel}</p>
        </div>

        <div className="p-4 flex flex-col gap-2.5">
          {/* CTA principal WhatsApp */}
          <a
            href={waInfoUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent(property.id, 'whatsapp_click', property.title, property.address)}
            className="group flex items-center justify-center gap-2.5 w-full py-3.5 rounded-xl bg-[#25D366] hover:bg-[#1ebe5d] active:scale-[0.98] text-white text-[14px] font-bold transition-all shadow-md shadow-[#25D366]/30"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="shrink-0 group-hover:scale-110 transition-transform">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Consultar por WhatsApp
          </a>

          {/* CTA secundario: Coordinar visita */}
          <a
            href={waVisitUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border-2 border-[#0041CE] text-[#0041CE] text-[13px] font-bold hover:bg-[#0041CE] hover:text-white active:scale-[0.98] transition-all duration-150"
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Coordinar visita
          </a>

          {/* CTA terciario: formulario */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-gray-500 text-[13px] font-medium hover:text-gray-800 hover:bg-gray-50 transition"
          >
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Enviar consulta por email
          </button>
        </div>
      </div>

      {/* ── Respuesta rápida ──────────────────────────────── */}
      <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-green-50 border border-green-100">
        <div className="w-2 h-2 rounded-full bg-green-500 shrink-0 animate-pulse" />
        <p className="text-xs text-green-700 font-medium">Respondemos en menos de 1 hora por WhatsApp</p>
      </div>

      {/* ── Guardar favorito ─────────────────────────────── */}
      <button
        onClick={() => toggleFavorito(property.id)}
        className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border text-[13px] font-medium transition-all active:scale-[0.98] ${
          isFav
            ? 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100'
            : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700 hover:bg-gray-50'
        }`}
      >
        <svg
          className={`w-4 h-4 transition-colors ${isFav ? 'fill-rose-500 text-rose-500' : 'text-gray-400 fill-none'}`}
          viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
        </svg>
        {isFav ? 'Guardado en favoritos' : 'Guardar en favoritos'}
      </button>

      <LeadModal
        propiedad={property}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
