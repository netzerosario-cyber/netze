'use client';
// ============================================================
// app/admin/login/page.tsx — Login con logo SVG y loading spinner
// ============================================================
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function AdminLoginPage() {
  const router = useRouter();
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user, pass }),
      });
      if (res.ok) {
        router.push('/admin');
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error ?? 'Credenciales incorrectas');
        setLoading(false);
      }
    } catch {
      setError('Error de conexión. Intentá de nuevo.');
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-50 px-4 z-50">
      <div className="w-full max-w-sm">
        {/* Logo SVG real */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <Image 
            src="/logos/Logo Principal.svg" 
            alt="Netze Logo" 
            width={140} 
            height={48} 
            className="object-contain" 
            priority
          />
          <span className="text-[10px] font-semibold text-gray-400 tracking-[0.25em] uppercase">Panel Administrativo</span>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <h1 className="text-lg font-bold text-gray-900 mb-1">Acceso administrativo</h1>
          <p className="text-sm text-gray-400 mb-6">Ingresá con las credenciales del portal.</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Usuario o email</label>
              <input
                type="text"
                value={user}
                onChange={(e) => setUser(e.target.value)}
                autoComplete="username"
                required
                disabled={loading}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0041CE]/30 focus:border-[#0041CE] transition disabled:opacity-50"
                placeholder="admin o tu@email.com"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Contraseña</label>
              <input
                type="password"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                autoComplete="current-password"
                required
                disabled={loading}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0041CE]/30 focus:border-[#0041CE] transition disabled:opacity-50"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 text-sm px-4 py-3 rounded-xl">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#0041CE] hover:bg-[#0031a0] disabled:bg-[#0041CE] text-white text-sm font-semibold rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Ingresando...
                </>
              ) : (
                'Ingresar'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          ← <a href="/" className="hover:text-gray-600 transition">Volver al portal</a>
        </p>
      </div>
    </div>
  );
}
