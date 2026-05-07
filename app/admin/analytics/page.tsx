'use client';
// ============================================================
// app/admin/analytics/page.tsx — Dashboard de analytics
// ============================================================
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface PropertyRank { id: string; title: string; address: string; count: number }
interface DayData { date: string; views: number; whatsapp: number; map: number }
interface Analytics {
  totals: { views: number; whatsapp_clicks: number; map_clicks: number };
  topViews: PropertyRank[];
  topWhatsApp: PropertyRank[];
  topMapClicks: PropertyRank[];
  dailyTrend: DayData[];
}

export default function AnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/analytics')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-5xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Analytics</h1>
        <p className="text-sm text-gray-400 mb-8">Cargando datos...</p>
        <div className="grid grid-cols-3 gap-4">
          {[1,2,3].map(i => (
            <div key={i} className="h-28 rounded-2xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.totals === undefined) {
    return (
      <div className="max-w-5xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Analytics</h1>
        <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm px-4 py-3 rounded-xl">
          No hay datos de analytics disponibles todavía. Los eventos se registrarán cuando los visitantes interactúen con las propiedades.
        </div>
      </div>
    );
  }

  const maxBarValue = Math.max(
    ...data.dailyTrend.map(d => d.views + d.whatsapp + d.map),
    1
  );

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-sm text-gray-400 mt-1">Métricas de interacción con las propiedades</p>
      </div>

      {/* ── Totales ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#0041CE] flex items-center justify-center shrink-0">
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <p className="text-3xl font-bold text-gray-900">{data.totals.views}</p>
            <p className="text-xs text-gray-500 mt-0.5">Vistas totales</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#25D366] flex items-center justify-center shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </div>
          <div>
            <p className="text-3xl font-bold text-gray-900">{data.totals.whatsapp_clicks}</p>
            <p className="text-xs text-gray-500 mt-0.5">Consultas WhatsApp</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center shrink-0">
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
          </div>
          <div>
            <p className="text-3xl font-bold text-gray-900">{data.totals.map_clicks}</p>
            <p className="text-xs text-gray-500 mt-0.5">Clicks en mapa</p>
          </div>
        </div>
      </div>

      {/* ── Gráfico últimos 7 días ────────────────────────── */}
      {data.dailyTrend.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-8">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Últimos 7 días</h3>
          <div className="flex items-end gap-2 h-32">
            {data.dailyTrend.map(day => {
              const total = day.views + day.whatsapp + day.map;
              const height = Math.max((total / maxBarValue) * 100, 4);
              const dayLabel = new Date(day.date + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'short' });
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] font-semibold text-gray-600">{total}</span>
                  <div
                    className="w-full rounded-t-lg bg-gradient-to-t from-[#0041CE] to-[#0061FB] transition-all duration-300"
                    style={{ height: `${height}%`, minHeight: '4px' }}
                    title={`${day.date}: ${day.views} vistas, ${day.whatsapp} WA, ${day.map} mapa`}
                  />
                  <span className="text-[10px] text-gray-400 capitalize">{dayLabel}</span>
                </div>
              );
            })}
          </div>
          <div className="flex gap-4 mt-3 text-[10px] text-gray-400">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#0041CE]"/>Vistas</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#25D366]"/>WhatsApp</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"/>Mapa</span>
          </div>
        </div>
      )}

      {/* ── Rankings ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Vistas */}
        <RankingTable
          title="🏆 Más vistas"
          items={data.topViews}
          emptyText="Aún no hay vistas registradas"
        />

        {/* Top WhatsApp */}
        <RankingTable
          title="📱 Más consultadas (WhatsApp)"
          items={data.topWhatsApp}
          emptyText="Aún no hay consultas registradas"
        />
      </div>
    </div>
  );
}

function RankingTable({ title, items, emptyText }: { title: string; items: PropertyRank[]; emptyText: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">{title}</h3>
      {items.length === 0 ? (
        <p className="text-sm text-gray-400 italic">{emptyText}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((item, i) => (
            <Link
              key={item.id}
              href={`/propiedad/${item.id}`}
              target="_blank"
              className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500 shrink-0">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{item.title}</p>
                <p className="text-[11px] text-gray-400 truncate">{item.address}</p>
              </div>
              <span className="text-sm font-bold text-[#0041CE] shrink-0">{item.count}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
