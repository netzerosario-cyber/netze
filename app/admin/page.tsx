// ============================================================
// app/admin/page.tsx — Dashboard principal (siempre light mode)
// La página carga instantáneamente; las stats aparecen con Suspense
// ============================================================
import { Suspense } from 'react';
import Link from 'next/link';
import { getProperties } from '@/lib/tokko';

export const dynamic = 'force-dynamic';

// ── Stats async component — se carga en background ───────────
async function AdminStats() {
  let totalVenta = 0;
  let totalAlquiler = 0;
  let totalProps = 0;
  let isConnected = false;

  try {
    const all = await getProperties({}, 0, 200, { skipGeoValidation: true });
    totalProps = all.meta.total_count;
    isConnected = !!process.env.TOKKO_API_KEY;

    (all.objects ?? []).forEach(p => {
      const ops = p.operations ?? [];
      const hasVenta = ops.some((op: { id?: number; name?: string }) =>
        op.id === 1 || (op.name ?? '').toLowerCase().includes('venta')
      );
      const hasAlquiler = ops.some((op: { id?: number; name?: string }) =>
        op.id === 2 || (op.name ?? '').toLowerCase().includes('alquiler')
      );
      if (hasVenta) totalVenta++;
      if (hasAlquiler) totalAlquiler++;
    });
  } catch {
    isConnected = false;
  }

  const cards = [
    {
      label: 'Total propiedades', value: totalProps, color: 'bg-[#0041CE]', href: '/admin/propiedades',
      icon: 'M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25',
    },
    {
      label: 'En venta', value: totalVenta, color: 'bg-emerald-500', href: '/admin/propiedades',
      icon: 'M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    },
    {
      label: 'En alquiler', value: totalAlquiler, color: 'bg-amber-500', href: '/admin/propiedades',
      icon: 'M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z',
    },
  ];

  return (
    <>
      {!isConnected && (
        <div className="mb-6 flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-sm px-4 py-3 rounded-xl">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <strong>Modo demo:</strong>&nbsp;No hay TOKKO_API_KEY configurada.
          <Link href="/admin/configuracion" className="ml-auto text-amber-700 font-semibold underline text-xs">Configurar →</Link>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {cards.map((card) => (
          <Link key={card.label} href={card.href} className="group bg-white rounded-2xl border border-gray-200 p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className={`w-12 h-12 rounded-xl ${card.color} flex items-center justify-center shrink-0`}>
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d={card.icon} />
              </svg>
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900">{card.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{card.label}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Estado del sistema</h3>
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Conexión Tokko Broker</span>
            <span className={`flex items-center gap-1.5 text-xs font-semibold ${!isConnected ? 'text-amber-600' : 'text-emerald-600'}`}>
              <span className={`w-2 h-2 rounded-full ${!isConnected ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'}`} />
              {!isConnected ? 'Modo demo (sin API Key)' : 'Conectado'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">WhatsApp</span>
            <span className="text-xs font-mono text-gray-700">
              {process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? 'No configurado'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Supabase</span>
            <span className={`flex items-center gap-1.5 text-xs font-semibold ${process.env.NEXT_PUBLIC_SUPABASE_URL ? 'text-emerald-600' : 'text-amber-600'}`}>
              <span className={`w-2 h-2 rounded-full ${process.env.NEXT_PUBLIC_SUPABASE_URL ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              {process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Conectado' : 'No configurado'}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Skeleton mientras cargan las stats ───────────────────────
function StatsSkeleton() {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center gap-4 animate-pulse">
            <div className="w-12 h-12 rounded-xl bg-gray-200 shrink-0" />
            <div className="flex flex-col gap-2">
              <div className="h-8 w-12 bg-gray-200 rounded-lg" />
              <div className="h-3 w-24 bg-gray-100 rounded" />
            </div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-gray-200 p-5 animate-pulse">
        <div className="h-4 w-32 bg-gray-200 rounded mb-4" />
        <div className="flex flex-col gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="h-3 w-40 bg-gray-100 rounded" />
              <div className="h-3 w-20 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ── Página principal — carga instantánea ─────────────────────
export default function AdminDashboard() {
  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-400 mt-1">Resumen del portal inmobiliario</p>
      </div>

      {/* Stats con Suspense: el layout aparece de inmediato, números en ~2s */}
      <Suspense fallback={<StatsSkeleton />}>
        <AdminStats />
      </Suspense>

      {/* Accesos rápidos — siempre visibles de inmediato */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link href="/admin/propiedades" className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 hover:border-[#0041CE] hover:text-[#0041CE] transition-colors group">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} className="text-gray-400 group-hover:text-[#0041CE] transition-colors">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </svg>
          Ver todas las propiedades →
        </Link>
        <Link href="/admin/configuracion" className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 hover:border-[#0041CE] hover:text-[#0041CE] transition-colors group">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} className="text-gray-400 group-hover:text-[#0041CE] transition-colors">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.107-1.204l-.527-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Configurar portal →
        </Link>
      </div>
    </div>
  );
}
