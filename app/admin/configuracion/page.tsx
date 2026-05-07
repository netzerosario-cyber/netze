'use client';
// ============================================================
// app/admin/configuracion/page.tsx — Configuración del portal
// ============================================================

interface ConfigField {
  key: string;
  label: string;
  description: string;
  currentValue: string;
  envKey: string;
  sensitive?: boolean;
}

const FIELDS: ConfigField[] = [
  {
    key: 'whatsapp',
    label: 'Número de WhatsApp',
    description: 'Número completo con código de país, sin + ni espacios.',
    currentValue: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? 'No configurado',
    envKey: 'NEXT_PUBLIC_WHATSAPP_NUMBER',
  },
  {
    key: 'tokko_key',
    label: 'API Key de Tokko Broker',
    description: 'Clave de API de Tokko para sincronizar propiedades.',
    currentValue: '••••••••••••',
    envKey: 'TOKKO_API_KEY',
    sensitive: true,
  },
  {
    key: 'mapbox_token',
    label: 'Token de Mapbox',
    description: 'Token público de Mapbox para el mapa interactivo.',
    currentValue: process.env.NEXT_PUBLIC_MAPBOX_TOKEN ? `pk.eyJ1...${process.env.NEXT_PUBLIC_MAPBOX_TOKEN.slice(-8)}` : 'No configurado',
    envKey: 'NEXT_PUBLIC_MAPBOX_TOKEN',
  },
  {
    key: 'supabase_url',
    label: 'Supabase URL',
    description: 'URL del proyecto Supabase para base de datos y analytics.',
    currentValue: process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'No configurado',
    envKey: 'NEXT_PUBLIC_SUPABASE_URL',
  },
];

export default function AdminConfiguracionPage() {
  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
        <p className="text-sm text-gray-400 mt-1">Variables de entorno y estado del sistema.</p>
      </div>

      {/* Info banner */}
      <div className="mb-6 bg-blue-50 border border-blue-200 text-blue-700 text-sm px-4 py-4 rounded-xl">
        <p className="font-semibold mb-1">¿Cómo cambiar estas variables?</p>
        <p className="text-xs leading-relaxed opacity-90">
          Estas configuraciones se definen como <strong>Environment Variables</strong> en Vercel.<br/>
          Ir a <code className="bg-blue-100 px-1 py-0.5 rounded text-xs font-mono">Vercel → Settings → Environment Variables</code>, 
          actualizar el valor y hacer un <strong>Redeploy</strong>.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {FIELDS.map((field) => (
          <div
            key={field.key}
            className="bg-white border border-gray-100 rounded-2xl p-5"
          >
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <h3 className="text-sm font-semibold text-gray-800">{field.label}</h3>
                <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{field.description}</p>
              </div>
              <code className="text-[10px] font-mono bg-gray-100 text-gray-500 px-2 py-1 rounded-lg whitespace-nowrap shrink-0">
                {field.envKey}
              </code>
            </div>

            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5">
              <span className={`w-2 h-2 rounded-full shrink-0 ${field.currentValue !== 'No configurado' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              <code className="text-sm font-mono text-gray-600 flex-1 truncate">
                {field.currentValue}
              </code>
            </div>
          </div>
        ))}

        {/* Credenciales admin */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-1">Credenciales del Admin</h3>
          <p className="text-xs text-gray-400 mb-3">Para cambiar el usuario y contraseña, actualizar en Vercel Environment Variables.</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5">
              <span className="text-xs text-gray-500">ADMIN_USER</span>
              <code className="text-xs font-mono text-gray-600">admin</code>
            </div>
            <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5">
              <span className="text-xs text-gray-500">ADMIN_PASS</span>
              <code className="text-xs font-mono text-gray-600">••••••••</code>
            </div>
          </div>
        </div>

        {/* Guía rápida */}
        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">Pasos para actualizar una variable</h3>
          <ol className="flex flex-col gap-2 text-xs text-gray-600 list-decimal list-inside leading-relaxed">
            <li>Ir a <strong>Vercel.com</strong> → tu proyecto <strong>netze</strong></li>
            <li>Ir a <strong>Settings → Environment Variables</strong></li>
            <li>Buscar la variable que querés cambiar (ej: <code className="bg-gray-200 px-1 py-0.5 rounded font-mono">NEXT_PUBLIC_WHATSAPP_NUMBER</code>)</li>
            <li>Editarla con el nuevo valor y guardar</li>
            <li>Ir a <strong>Deployments</strong> y hacer click en <strong>Redeploy</strong> en el último deploy</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
