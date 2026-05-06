// ============================================================
// app/propiedad/[id]/page.tsx  — Detalle completo con todos los campos Tokko
// ============================================================
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getProperty, getPriceInfo, formatPriceLabel, Property } from '@/lib/tokko';
import PropertyDetailClient from './PropertyDetailClient';
import PhotoGallery from '@/components/PhotoGallery';

interface PageProps { params: Promise<{ id: string }>; }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const p = await getProperty(id);
    const { price, currency } = getPriceInfo(p);
    const priceLabel = formatPriceLabel(price, currency);
    const title = `${p.publication_title ?? p.address} — ${priceLabel} | Netze`;
    const description = `${p.property_type?.name ?? 'Propiedad'} en ${p.address}. ${priceLabel}.${p.rooms ? ` ${p.rooms} ambientes.` : ''}${p.surface_total ? ` ${p.surface_total} m².` : ''}`;
    const photos = (p as unknown as { photos?: { image: string }[] }).photos ?? [];
    const img = photos[0]?.image;
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: `https://www.netze.com.ar/propiedad/${p.id}`,
        siteName: 'Netze',
        locale: 'es_AR',
        type: 'website',
        ...(img ? { images: [{ url: img, width: 800, height: 600, alt: p.address }] } : {}),
      },
      twitter: { card: 'summary_large_image', title, description, ...(img ? { images: [img] } : {}) },
    };
  } catch { return { title: 'Propiedad | Netze' }; }
}

// ── helpers ──────────────────────────────────────────────────
function val(v: string | number | null | undefined) {
  if (v === null || v === undefined || v === '' || v === 0 || v === '0' || v === '0.00') return null;
  return v;
}
function condLabel(s: string | null) {
  const map: Record<string, string> = {
    Excellent: 'Excelente', Good: 'Bueno', Fair: 'Regular',
    'Not specified': '', Unknown: '', Empty: '',
  };
  return s ? (map[s] ?? s) : null;
}
function orientLabel(s: string | null) {
  const map: Record<string, string> = {
    North: 'Norte', South: 'Sur', East: 'Este', West: 'Oeste',
    Northeast: 'Noreste', Northwest: 'Noroeste', Southeast: 'Sudeste', Southwest: 'Sudoeste',
  };
  return s ? (map[s] ?? s) : null;
}

// PhotoGallery ahora es un componente client-side importado desde @/components/PhotoGallery



// ── Fila de dato ───────────────────────────────────────────────
function DataRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-start gap-4 py-2.5 border-b border-gray-100 last:border-0">
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide shrink-0 w-40">{label}</span>
      <span className="text-sm text-gray-800 text-right">{value}</span>
    </div>
  );
}

// ── Info completa ──────────────────────────────────────────────
function PropertyInfo({ property: p }: { property: Property }) {
  const { price, currency } = getPriceInfo(p);
  const priceLabel    = formatPriceLabel(price, currency);
  const operationLabel = p.operations?.[0]?.name ?? '';

  // Superficie — tomamos el valor correcto según lo que devuelve Tokko
  const rawP = p as unknown as Record<string, unknown>;
  const supCubierta  = Number(rawP.roofed_surface) || Number(p.surface_covered) || 0;
  const supTotal     = Number(rawP.surface) || Number(p.surface_total) || 0;
  const frente       = Number(p.front_measure) || 0;
  const fondo        = Number(p.depth_measure) || 0;

  const stats = [
    p.rooms != null && (p.rooms as number) > 0 && { icon: '🛏', value: `${p.rooms}`, label: 'Ambientes' },
    p.suite_amount != null && (p.suite_amount as number) > 0 && { icon: '🛌', value: `${p.suite_amount}`, label: 'Dormitorios' },
    p.bathroom_amount != null && (p.bathroom_amount as number) > 0 && { icon: '🚿', value: `${p.bathroom_amount}`, label: 'Baños' },
    p.toilet_amount != null && (p.toilet_amount as number) > 0 && { icon: '🪠', value: `${p.toilet_amount}`, label: 'Toilets' },
    supCubierta > 0 && { icon: '🏠', value: `${supCubierta} m²`, label: 'Sup. cubierta' },
    supTotal > 0 && { icon: '📐', value: `${supTotal} m²`, label: 'Sup. total' },
    frente > 0 && { icon: '↔️', value: `${frente} m`, label: 'Frente' },
    fondo  > 0 && { icon: '↕️', value: `${fondo} m`, label: 'Fondo' },
    p.parking_lot_amount != null && (p.parking_lot_amount as number) > 0 && { icon: '🚗', value: `${p.parking_lot_amount}`, label: 'Cocheras' },
    p.floors != null && (p.floors as number) > 0 && { icon: '🏢', value: `Piso ${p.floors}`, label: 'Piso' },
  ].filter(Boolean) as { icon: string; value: string; label: string }[];

  const condition  = condLabel(p.property_condition);
  const orient     = orientLabel(p.orientation);
  const location   = p.location?.short_location ?? p.location?.full_location ?? null;
  const refCode    = p.reference_code ?? (rawP.reference_code as string) ?? null;
  const age        = p.age != null && (p.age as number) > 0 ? `${p.age} años` : null;
  const expenses   = p.expenses != null && (p.expenses as number) > 0 ? `$${(p.expenses as number).toLocaleString('es-AR')}` : null;
  const situation  = p.situation && p.situation !== 'Empty' ? p.situation : null;
  const creditOk   = p.credit_eligible && !['Not specified','Unknown','No'].includes(p.credit_eligible) ? p.credit_eligible : null;

  const videos = (rawP.videos as { url: string; title?: string }[]) ?? [];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          {operationLabel && (
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#0041CE] bg-blue-50 px-2.5 py-1 rounded-full">{operationLabel}</span>
          )}
          {p.property_type?.name && (
            <span className="text-[11px] font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">{p.property_type.name}</span>
          )}
          {refCode && (
            <span className="text-[11px] font-mono text-gray-400 bg-gray-50 border border-gray-200 px-2 py-1 rounded-full">{refCode}</span>
          )}
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight mb-1">
          {p.publication_title ?? p.address}
        </h1>
        {location && <p className="text-sm text-gray-500 mb-2">📍 {location}</p>}
        <p className="text-3xl font-black text-[#0041CE] tracking-tight">{priceLabel}</p>
        {expenses && <p className="text-sm text-gray-500 mt-1">+ Expensas: {expenses}/mes</p>}
      </div>

      {/* Stats grid */}
      {stats.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col items-center gap-1 bg-gray-50 rounded-xl py-3 px-2 border border-gray-100">
              <span className="text-xl">{s.icon}</span>
              <span className="text-sm font-bold text-gray-800">{s.value}</span>
              <span className="text-[11px] text-gray-500">{s.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Descripción */}
      {p.description && (
        <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
          <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-3">Descripción</h2>
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{p.description}</p>
        </div>
      )}

      {/* Información general */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Información general</h2>
        </div>
        <div className="px-5 py-1">
          {val(condition)      && <DataRow label="Condición"      value={condition!} />}
          {val(age)            && <DataRow label="Antigüedad"     value={age!} />}
          {val(orient)         && <DataRow label="Orientación"    value={orient!} />}
          {val(situation)      && <DataRow label="Situación"      value={situation!} />}
          {val(creditOk)       && <DataRow label="Apto crédito"   value={creditOk!} />}
          {p.floors_amount != null && (p.floors_amount as number) > 0 && <DataRow label="Plantas" value={`${p.floors_amount}`} />}
          {val(supCubierta)    && <DataRow label="Sup. cubierta"  value={`${supCubierta} m²`} />}
          {val(supTotal)       && <DataRow label="Sup. total"     value={`${supTotal} m²`} />}
          {p.semiroofed_surface != null && (p.semiroofed_surface as number) > 0 && <DataRow label="Sup. semicubierta" value={`${p.semiroofed_surface} m²`} />}
          {p.unroofed_surface  != null && (p.unroofed_surface as number) > 0  && <DataRow label="Sup. descubierta" value={`${p.unroofed_surface} m²`} />}
          {val(frente)         && <DataRow label="Frente"         value={`${frente} m`} />}
          {val(fondo)          && <DataRow label="Fondo"          value={`${fondo} m`} />}
          {p.covered_parking_lot != null && (p.covered_parking_lot as number) > 0 && <DataRow label="Cocheras cubiertas" value={`${p.covered_parking_lot}`} />}
          {p.uncovered_parking_lot != null && (p.uncovered_parking_lot as number) > 0 && <DataRow label="Cocheras desc." value={`${p.uncovered_parking_lot}`} />}
          {val(expenses)       && <DataRow label="Expensas"       value={expenses!} />}
        </div>
      </div>

      {/* Atributos extra (si los hay) */}
      {p.extra_attributes && (p.extra_attributes as unknown[]).length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Características</h2>
          </div>
          <div className="px-5 py-1">
            {(p.extra_attributes as { id: number; name: string; value: string }[]).map((attr) => (
              <DataRow key={attr.id} label={attr.name} value={attr.value} />
            ))}
          </div>
        </div>
      )}

      {/* Tags */}
      {p.tags && (p.tags as unknown[]).length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">Comodidades</h2>
          <div className="flex flex-wrap gap-2">
            {(p.tags as { id: number; name: string }[]).map((tag) => (
              <span key={tag.id} className="text-xs font-medium text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full">
                {tag.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Videos */}
      {videos.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">Videos</h2>
          <div className="flex flex-col gap-3">
            {videos.map((v, i) => {
              const isYoutube = v.url?.includes('youtube') || v.url?.includes('youtu.be');
              const ytId = isYoutube ? v.url.split('v=')[1]?.split('&')[0] ?? v.url.split('/').pop() : null;
              return (
                <div key={i} className="rounded-xl overflow-hidden bg-black aspect-video">
                  {ytId ? (
                    <iframe
                      src={`https://www.youtube.com/embed/${ytId}`}
                      className="w-full h-full" allowFullScreen
                      title={v.title ?? `Video ${i+1}`}
                    />
                  ) : (
                    <a href={v.url} target="_blank" rel="noopener noreferrer"
                       className="flex items-center justify-center w-full h-full text-white text-sm underline">
                      {v.title ?? 'Ver video'}
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Banner CTA móvil */}
      <div className="md:hidden rounded-2xl overflow-hidden shadow-lg">
        <div className="bg-gradient-to-r from-[#0041CE] to-[#0061FB] p-4 text-white">
          <p className="text-sm font-semibold mb-0.5">¿Te interesa esta propiedad?</p>
          <p className="text-xs text-blue-200">Respondemos en menos de 1 hora</p>
        </div>
        <a
          href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '5493413492000'}?text=${encodeURIComponent(`Hola! Me interesa la propiedad ${p.reference_code ?? ''} en ${p.address} (${priceLabel}). ¿Pueden darme más información?`)}`}
          target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3.5 bg-[#25D366] text-white text-[15px] font-bold"
        >
          Consultar por WhatsApp
        </a>
      </div>

      {/* Aviso legal */}
      <p className="text-[11px] text-gray-400 leading-relaxed">
        La información sobre esta propiedad es de carácter orientativo. Los precios, disponibilidad y datos pueden variar sin previo aviso. Contactar a la inmobiliaria para confirmar. Al consultar, aceptás nuestra{' '}
        <Link href="/privacidad" className="underline hover:text-gray-600">Política de Privacidad</Link>.
      </p>
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────
export default async function PropiedadPage({ params }: PageProps) {
  const { id } = await params;
  let property: Property;
  try { property = await getProperty(id); }
  catch { notFound(); }

  // Schema.org JSON-LD
  const rawP = property as unknown as Record<string, unknown>;
  const { price: schemaPrice, currency: schemaCurrency } = getPriceInfo(property);
  const schemaPhotos = ((rawP.photos ?? []) as { image: string }[]).map(p => p.image);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: property.publication_title ?? property.address,
    description: property.description ?? undefined,
    url: `https://www.netze.com.ar/propiedad/${property.id}`,
    image: schemaPhotos,
    offers: schemaPrice ? {
      '@type': 'Offer',
      price: schemaPrice,
      priceCurrency: schemaCurrency,
      availability: 'https://schema.org/InStock',
    } : undefined,
    address: {
      '@type': 'PostalAddress',
      streetAddress: property.address,
      addressLocality: 'Rosario',
      addressRegion: 'Santa Fe',
      addressCountry: 'AR',
    },
    numberOfRooms: property.rooms ?? undefined,
    floorSize: property.surface_total ? { '@type': 'QuantitativeValue', value: property.surface_total, unitCode: 'MTK' } : undefined,
  };

  return (
    <div className="overflow-y-auto h-full bg-gray-50">
      {/* Schema.org */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="max-w-5xl mx-auto px-4 py-6">
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
          <Link href="/" className="hover:text-[#0041CE] transition-colors flex items-center gap-1.5 font-medium">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Volver al listado
          </Link>
        </nav>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-8 items-start">
          <div className="flex flex-col gap-6">
            <PhotoGallery photos={(property as unknown as { photos?: { image: string; thumb?: string; original?: string; is_front_photo?: boolean }[] }).photos ?? []} title={property.publication_title ?? property.address} />
            <PropertyInfo property={property} />
          </div>
          <div className="hidden md:block">
            <PropertyDetailClient property={property} />
          </div>
        </div>
      </div>
    </div>
  );
}
