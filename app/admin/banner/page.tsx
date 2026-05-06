'use client';
// ============================================================
// app/admin/banner/page.tsx — Configuración del banner hero
// ============================================================
import { useState, useEffect, FormEvent } from 'react';

interface BannerData {
  title: string;
  subtitle: string;
  image_url: string;
  cta_text: string;
  cta_link: string;
}

const EMPTY: BannerData = { title: '', subtitle: '', image_url: '', cta_text: '', cta_link: '' };

export default function AdminBannerPage() {
  const [banner, setBanner] = useState<BannerData>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/admin/settings?key=banner')
      .then(r => r.json())
      .then(data => {
        if (data.value && typeof data.value === 'object') setBanner({ ...EMPTY, ...data.value });
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'banner', value: banner }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('[Admin] Error guardando banner:', err);
    } finally {
      setSaving(false);
    }
  }

  const hasContent = banner.title || banner.subtitle || banner.image_url;

  if (loading) {
    return (
      <div className="max-w-3xl">
        <div className="h-8 bg-gray-200 dark:bg-[#21262d] rounded w-32 mb-6 animate-pulse" />
        <div className="bg-white dark:bg-[#161b22] border border-gray-100 dark:border-[#30363d] rounded-2xl p-6 animate-pulse">
          <div className="space-y-4">
            {[1,2,3,4,5].map(i => <div key={i} className="h-10 bg-gray-100 dark:bg-[#21262d] rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Banner Hero</h1>
        <p className="text-sm text-gray-400 mt-1">
          Configurá el banner principal que aparece en la home del portal.
        </p>
      </div>

      {/* Preview */}
      {hasContent && (
        <div className="mb-6 rounded-2xl overflow-hidden border border-gray-100 dark:border-[#30363d] relative">
          <div className="relative h-48 bg-gradient-to-r from-gray-900 to-gray-700">
            {banner.image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={banner.image_url} alt="Banner preview" className="absolute inset-0 w-full h-full object-cover opacity-60" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6">
              {banner.title && <h2 className="text-xl font-bold text-white mb-1">{banner.title}</h2>}
              {banner.subtitle && <p className="text-sm text-white/80">{banner.subtitle}</p>}
              {banner.cta_text && (
                <button className="mt-3 px-5 py-2 bg-[#0041CE] text-white text-sm font-semibold rounded-xl">
                  {banner.cta_text}
                </button>
              )}
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-[#0d1117] px-4 py-2 text-[10px] text-gray-400 font-medium uppercase tracking-wider">
            Preview del banner
          </div>
        </div>
      )}

      {/* Formulario */}
      <form onSubmit={handleSave} className="bg-white dark:bg-[#161b22] border border-gray-100 dark:border-[#30363d] rounded-2xl p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Título</label>
            <input
              type="text"
              value={banner.title}
              onChange={e => setBanner({ ...banner, title: e.target.value })}
              placeholder="Encontrá tu próximo hogar"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-[#30363d] bg-white dark:bg-[#0d1117] text-gray-900 dark:text-white text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0041CE]/30 focus:border-[#0041CE] transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Subtítulo</label>
            <input
              type="text"
              value={banner.subtitle}
              onChange={e => setBanner({ ...banner, subtitle: e.target.value })}
              placeholder="Las mejores propiedades de Rosario y la región"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-[#30363d] bg-white dark:bg-[#0d1117] text-gray-900 dark:text-white text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0041CE]/30 focus:border-[#0041CE] transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">URL de imagen</label>
            <input
              type="url"
              value={banner.image_url}
              onChange={e => setBanner({ ...banner, image_url: e.target.value })}
              placeholder="https://images.unsplash.com/..."
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-[#30363d] bg-white dark:bg-[#0d1117] text-gray-900 dark:text-white text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0041CE]/30 focus:border-[#0041CE] transition"
            />
            <p className="text-[11px] text-gray-400 mt-1">Tamaño recomendado: 1920x600px. Usar una URL pública.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Texto del botón</label>
              <input
                type="text"
                value={banner.cta_text}
                onChange={e => setBanner({ ...banner, cta_text: e.target.value })}
                placeholder="Ver propiedades"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-[#30363d] bg-white dark:bg-[#0d1117] text-gray-900 dark:text-white text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0041CE]/30 focus:border-[#0041CE] transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Link del botón</label>
              <input
                type="text"
                value={banner.cta_link}
                onChange={e => setBanner({ ...banner, cta_link: e.target.value })}
                placeholder="/propiedades"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-[#30363d] bg-white dark:bg-[#0d1117] text-gray-900 dark:text-white text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0041CE]/30 focus:border-[#0041CE] transition"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-6 pt-5 border-t border-gray-100 dark:border-[#21262d]">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-[#0041CE] hover:bg-[#0031a0] disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
          >
            {saving ? 'Guardando...' : 'Guardar banner'}
          </button>

          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              Guardado
            </span>
          )}

          {hasContent && (
            <button
              type="button"
              onClick={() => setBanner(EMPTY)}
              className="ml-auto text-xs text-gray-400 hover:text-rose-500 transition-colors"
            >
              Limpiar todo
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
