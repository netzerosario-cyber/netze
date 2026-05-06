'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { Property, getPriceInfo, formatPriceLabel, getFrontPhoto } from '@/lib/tokko';
import { useFavoritos } from '@/hooks/useFavoritos';
import { useComparador } from '@/lib/comparador';
import { shareProperty, buildSharePayload } from '@/lib/share';

function buildWhatsAppUrl(property: Property, price: string): string {
  const number = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '5493413492000';
  const text = encodeURIComponent(
    `Hola! Me interesa la propiedad en ${property.address} (${price}). ¿Pueden darme más información?`
  );
  return `https://wa.me/${number}?text=${text}`;
}

interface PropertyCardProps {
  property: Property;
  isSelected?: boolean;
  onClick?: (id: number) => void;
}

export default function PropertyCard({ property, isSelected = false, onClick }: PropertyCardProps) {
  const { toggleFavorito, esFavorito } = useFavoritos();
  const { toggleComparar, isSeleccionada } = useComparador();
  const isFav = esFavorito(property.id);
  const isComp = isSeleccionada(property.id);
  const { price, currency } = getPriceInfo(property);
  const priceLabel = formatPriceLabel(price, currency);
  const photoUrl = getFrontPhoto(property);
  const [imgError, setImgError] = useState(false);
  const [shareToast, setShareToast] = useState('');
  const operationType = property.operations?.[0]?.name ?? '';
  const waUrl = buildWhatsAppUrl(property, priceLabel);

  async function handleShare(e: React.MouseEvent) {
    e.stopPropagation();
    const payload = buildSharePayload(property.address, priceLabel, property.id);
    const result = await shareProperty(payload);
    if (result === 'copied') {
      setShareToast('¡Link copiado!');
      setTimeout(() => setShareToast(''), 2500);
    }
  }

  return (
    <article
      onClick={() => onClick?.(property.id)}
      className={`group relative bg-white dark:bg-[#161b22] rounded-2xl overflow-hidden transition-all duration-200 cursor-pointer ${
        isSelected
          ? 'ring-2 ring-[#0041CE] shadow-xl shadow-[#0041CE]/10'
          : 'shadow-sm hover:shadow-lg border border-gray-100 dark:border-[#30363d]'
      } ${isComp ? 'ring-2 ring-[#0061FB]' : ''}`}
    >
      {/* ── Toast compartir ──────────────────────────────────── */}
      {shareToast && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 bg-gray-900 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg whitespace-nowrap animate-in fade-in slide-in-from-top-2 duration-200">
          {shareToast}
        </div>
      )}

      {/* ── Imagen ──────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gray-100 dark:bg-[#21262d]" style={{ height: '180px' }}>
        {!imgError ? (
          <Image
            src={photoUrl}
            alt={property.address}
            fill
            sizes="(max-width: 768px) 100vw, 380px"
            className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
            onError={() => setImgError(true)}
          />
        ) : (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', color: '#9ca3af' }}>
            <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5M4.5 3h15A1.5 1.5 0 0121 4.5v15A1.5 1.5 0 0119.5 21H4.5A1.5 1.5 0 013 19.5v-15A1.5 1.5 0 014.5 3z" />
            </svg>
            <span style={{ fontSize: '12px' }}>Sin foto</span>
          </div>
        )}

        {/* Badge operación */}
        {operationType && (
          <span className="absolute top-3 left-3 bg-white/95 dark:bg-[#161b22]/95 backdrop-blur-sm text-gray-700 dark:text-gray-200 text-[11px] font-semibold px-2.5 py-1 rounded-full shadow-sm">
            {operationType}
          </span>
        )}

        {/* Acciones top-right: favorito + compartir */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          {/* Compartir */}
          <button
            onClick={handleShare}
            title="Compartir propiedad"
            className="w-8 h-8 flex items-center justify-center bg-white/95 dark:bg-[#161b22]/95 backdrop-blur-sm rounded-full shadow-sm transition-transform active:scale-90 text-gray-500 hover:text-[#0041CE] dark:text-gray-400 dark:hover:text-[#0061FB]"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </button>

          {/* Favorito */}
          <button
            onClick={(e) => { e.stopPropagation(); toggleFavorito(property.id); }}
            title={isFav ? 'Guardado en este dispositivo' : 'Guardar propiedad'}
            className="w-8 h-8 flex items-center justify-center bg-white/95 dark:bg-[#161b22]/95 backdrop-blur-sm rounded-full shadow-sm transition-transform active:scale-90"
          >
            <svg
              className={`transition-colors ${isFav ? 'fill-rose-500 text-rose-500' : 'text-gray-400 fill-none'}`}
              width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
          </button>
        </div>

        <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
      </div>

      {/* ── Info ────────────────────────────────────────── */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <span className="text-[18px] font-bold text-gray-900 dark:text-white leading-tight">{priceLabel}</span>
          <span className="shrink-0 text-[11px] font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-[#21262d] px-2 py-0.5 rounded-full mt-0.5">
            {property.property_type?.name ?? 'Propiedad'}
          </span>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400 truncate mb-3">{property.address}</p>

        {/* Atributos */}
        <div className="flex items-center gap-3.5 text-[12px] text-gray-500 dark:text-gray-500 mb-4">
          {property.rooms != null && property.rooms > 0 && (
            <span className="flex items-center gap-1">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
              {property.rooms} amb.
            </span>
          )}
          {property.surface_total != null && property.surface_total > 0 && (
            <span className="flex items-center gap-1">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
              </svg>
              {property.surface_total} m²
            </span>
          )}
          {property.bathroom_amount != null && property.bathroom_amount > 0 && (
            <span className="flex items-center gap-1">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
              {property.bathroom_amount} baño{property.bathroom_amount > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* CTAs */}
        <div className="flex flex-col gap-2">
          {/* WhatsApp */}
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[#25D366] hover:bg-[#1ebe5d] active:scale-[0.98] text-white text-[13px] font-semibold transition-all shadow-sm"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="shrink-0">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Consultar por WhatsApp
          </a>

          {/* Ver detalle + Comparar */}
          <div className="flex gap-2">
            <Link
              href={`/propiedad/${property.id}`}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 flex items-center justify-center py-2.5 rounded-xl border border-gray-200 dark:border-[#30363d] text-gray-600 dark:text-gray-300 text-[13px] font-semibold hover:border-[#0041CE] hover:bg-[#0041CE] hover:text-white dark:hover:border-[#0061FB] dark:hover:bg-[#0061FB] dark:hover:text-white transition-all duration-150 active:scale-[0.98]"
            >
              Ver detalle
            </Link>
            {/* Botón comparar */}
            <button
              onClick={(e) => { e.stopPropagation(); toggleComparar(property); }}
              title={isComp ? 'Quitar de comparación' : 'Agregar a comparación'}
              className={`w-10 flex items-center justify-center rounded-xl border text-[13px] transition active:scale-[0.98] ${
                isComp
                  ? 'border-[#0061FB] bg-[#0061FB]/10 text-[#0061FB]'
                  : 'border-gray-200 dark:border-[#30363d] text-gray-400 hover:border-[#0041CE] hover:text-[#0041CE]'
              }`}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
