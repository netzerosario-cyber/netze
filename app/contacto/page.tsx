'use client';
// ============================================================
// app/contacto/page.tsx — Formulario de contacto general
// ============================================================
import { useState } from 'react';
import Link from 'next/link';
import { insertLead } from '@/lib/supabase';

type FormState = 'idle' | 'loading' | 'success' | 'error';

export default function ContactoPage() {
  const [nombre, setNombre]   = useState('');
  const [email, setEmail]     = useState('');
  const [telefono, setTelefono] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [formState, setFormState] = useState<FormState>('idle');
  const [errorMsg, setErrorMsg]   = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) { setErrorMsg('El email es obligatorio.'); return; }
    setFormState('loading'); setErrorMsg('');
    const { error } = await insertLead({
      nombre: nombre.trim(),
      email: email.trim().toLowerCase(),
      mensaje: `${telefono ? `Tel: ${telefono} — ` : ''}${mensaje.trim()}`,
    });
    setFormState(error ? 'error' : 'success');
    if (error) setErrorMsg('Error al enviar. Intentá de nuevo.');
  }

  return (
    <div className="overflow-y-auto h-full bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <nav className="mb-8">
          <Link href="/" className="text-sm text-[#0041CE] hover:underline flex items-center gap-1.5">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Volver al inicio
          </Link>
        </nav>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* Formulario */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-7">
            <h1 className="text-2xl font-black text-gray-900 mb-1">Contactanos</h1>
            <p className="text-sm text-gray-500 mb-6">Respondemos en menos de 1 hora por WhatsApp.</p>

            {formState !== 'success' ? (
              <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-600">Nombre</label>
                  <input type="text" value={nombre} onChange={e => setNombre(e.target.value)}
                    placeholder="Tu nombre"
                    className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0041CE]/30 focus:border-[#0041CE] transition" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-600">Email <span className="text-rose-500">*</span></label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="tu@email.com" required
                    className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0041CE]/30 focus:border-[#0041CE] transition" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-600">Teléfono / WhatsApp <span className="text-gray-400 font-normal">(opcional)</span></label>
                  <input type="tel" value={telefono} onChange={e => setTelefono(e.target.value)}
                    placeholder="+54 9 341..."
                    className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0041CE]/30 focus:border-[#0041CE] transition" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-600">Mensaje</label>
                  <textarea value={mensaje} onChange={e => setMensaje(e.target.value)}
                    placeholder="¿En qué podemos ayudarte? ¿Qué tipo de propiedad buscás?"
                    rows={4}
                    className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0041CE]/30 focus:border-[#0041CE] transition resize-none" />
                </div>
                {errorMsg && <p className="text-xs text-rose-600 font-medium">{errorMsg}</p>}
                <button type="submit" disabled={formState === 'loading'}
                  className="w-full py-3 rounded-xl bg-[#0041CE] text-white text-sm font-bold hover:bg-[#0035b0] transition disabled:opacity-60">
                  {formState === 'loading' ? 'Enviando...' : 'Enviar mensaje'}
                </button>
                <p className="text-[11px] text-gray-400 text-center">
                  Al enviar aceptás nuestra{' '}
                  <Link href="/privacidad" target="_blank" className="underline hover:text-gray-600">Política de Privacidad</Link>.
                </p>
              </form>
            ) : (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center text-2xl">✅</div>
                <p className="font-bold text-gray-900">¡Mensaje enviado!</p>
                <p className="text-sm text-gray-500">Te contactaremos a <strong>{email}</strong> a la brevedad.</p>
                <Link href="/" className="mt-2 text-sm text-[#0041CE] hover:underline">Volver al inicio</Link>
              </div>
            )}
          </div>

          {/* Info lateral */}
          <div className="flex flex-col gap-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="font-bold text-gray-900 mb-4">Contacto directo</h2>
              <div className="space-y-4">
                <a href="https://wa.me/5493413305741?text=Hola%21+Quisiera+consultar+sobre+propiedades."
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl bg-[#25D366]/5 border border-[#25D366]/20 hover:bg-[#25D366]/10 transition group">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  <div>
                    <p className="text-sm font-semibold text-gray-800 group-hover:text-[#1a9e4a]">WhatsApp</p>
                    <p className="text-xs text-gray-500">+54 9 341 330-5741</p>
                  </div>
                </a>
                <a href="mailto:administracion@netze.com.ar"
                  className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 border border-blue-100 hover:bg-blue-100 transition group">
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#0041CE" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Email</p>
                    <p className="text-xs text-gray-500">administracion@netze.com.ar</p>
                  </div>
                </a>
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#0041CE] to-[#0061FB] rounded-2xl p-6 text-white">
              <p className="text-sm font-semibold text-blue-200 mb-1">Horario de atención</p>
              <p className="font-bold text-lg mb-2">Lun a Vie · 9:00 – 18:00</p>
              <p className="text-xs text-blue-200">Por WhatsApp respondemos también fuera de horario.</p>
              <div className="flex items-center gap-2 mt-3">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <p className="text-xs text-green-300 font-medium">Tiempo de respuesta: &lt; 1 hora</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
