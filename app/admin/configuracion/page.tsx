'use client';
// ============================================================
// app/admin/configuracion/page.tsx — Configuración del portal
// ============================================================
import { useState } from 'react';

interface ConfigField {
  key: string;
  label: string;
  description: string;
  placeholder: string;
  type?: string;
  envKey: string;
}

const FIELDS: ConfigField[] = [
  {
    key: 'whatsapp',
    label: 'Número de WhatsApp',
    description: 'Número completo con código de país (sin + ni espacios). Ej: 5493413492000',
    placeholder: '5493413492000',
    type: 'tel',
    envKey: 'NEXT_PUBLIC_WHATSAPP_NUMBER',
  },
  {
    key: 'tokko_key',
    label: 'API Key de Tokko Broker',
    description: 'Clave de API de Tokko. Al guardarla, el portal dejará de usar datos de ejemplo.',
    placeholder: 'tu-api-key-de-tokko',
    type: 'password',
    envKey: 'NEXT_PUBLIC_TOKKO_API_KEY',
  },
  {
    key: 'mapbox_token',
    label: 'Token de Mapbox',
    description: 'Token público de Mapbox para el mapa. Rota periódicamente.',
    placeholder: 'pk.eyJ1...',
    envKey: 'NEXT_PUBLIC_MAPBOX_TOKEN',
  },
];

export default function AdminConfiguracionPage() {
  const [saved, setSaved] = useState(false);

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Configuración</h1>
        <p className="text-sm text-gray-400 mt-1">Variables de entorno y configuración del portal.</p>
      </div>

      {/* Info banner */}
      <div className="mb-6 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-400 text-sm px-4 py-4 rounded-xl">
        <p className="font-semibold mb-1">¿Cómo actualizar estas variables?</p>
        <p className="text-xs leading-relaxed opacity-90">
          Estas configuraciones se definen en el archivo <code className="bg-blue-100 dark:bg-blue-500/20 px-1 py-0.5 rounded text-xs font-mono">.env.local</code> en la raíz del proyecto.
          Editalo con los valores correctos y reiniciá el servidor con <code className="bg-blue-100 dark:bg-blue-500/20 px-1 py-0.5 rounded text-xs font-mono">npm run dev</code>.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {FIELDS.map((field) => (
          <div
            key={field.key}
            className="bg-white dark:bg-[#161b22] border border-gray-100 dark:border-[#30363d] rounded-2xl p-5"
          >
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <h3 className="text-sm font-semibold text-gray-800 dark:text-white">{field.label}</h3>
                <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{field.description}</p>
              </div>
              <code className="text-[10px] font-mono bg-gray-100 dark:bg-[#21262d] text-gray-500 dark:text-gray-400 px-2 py-1 rounded-lg whitespace-nowrap shrink-0">
                {field.envKey}
              </code>
            </div>

            <div className="flex items-center gap-2 bg-gray-50 dark:bg-[#0d1117] border border-gray-200 dark:border-[#21262d] rounded-xl px-4 py-2.5">
              <code className="text-sm font-mono text-gray-600 dark:text-gray-300 flex-1 truncate opacity-60">
                {field.placeholder}
              </code>
              <span className="text-[10px] text-gray-400 shrink-0">Editar en .env.local</span>
            </div>
          </div>
        ))}

        {/* Guía rápida */}
        <div className="bg-gray-50 dark:bg-[#161b22] border border-gray-100 dark:border-[#30363d] rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-3">Guía rápida de configuración</h3>
          <ol className="flex flex-col gap-2 text-xs text-gray-600 dark:text-gray-400 list-decimal list-inside leading-relaxed">
            <li>Abrí el archivo <code className="bg-gray-200 dark:bg-[#21262d] px-1 py-0.5 rounded font-mono">.env.local</code> en la raíz del proyecto.</li>
            <li>Actualizá el valor correspondiente (ej: <code className="bg-gray-200 dark:bg-[#21262d] px-1 py-0.5 rounded font-mono">NEXT_PUBLIC_WHATSAPP_NUMBER=5493XXXXXXXXX</code>).</li>
            <li>Guardá el archivo.</li>
            <li>Reiniciá el servidor: <code className="bg-gray-200 dark:bg-[#21262d] px-1 py-0.5 rounded font-mono">npm run dev</code>.</li>
            <li>Los cambios se aplican automáticamente en todos los componentes.</li>
          </ol>
        </div>

        {/* Credenciales admin */}
        <div className="bg-white dark:bg-[#161b22] border border-gray-100 dark:border-[#30363d] rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-1">Credenciales del Admin</h3>
          <p className="text-xs text-gray-400 mb-3">Para cambiar el usuario y contraseña de acceso a este panel.</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center justify-between bg-gray-50 dark:bg-[#0d1117] border border-gray-200 dark:border-[#21262d] rounded-xl px-4 py-2.5">
              <span className="text-xs text-gray-500 dark:text-gray-400">ADMIN_USER</span>
              <code className="text-xs font-mono text-gray-600 dark:text-gray-300">admin</code>
            </div>
            <div className="flex items-center justify-between bg-gray-50 dark:bg-[#0d1117] border border-gray-200 dark:border-[#21262d] rounded-xl px-4 py-2.5">
              <span className="text-xs text-gray-500 dark:text-gray-400">ADMIN_PASS</span>
              <code className="text-xs font-mono text-gray-600 dark:text-gray-300">••••••••</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
