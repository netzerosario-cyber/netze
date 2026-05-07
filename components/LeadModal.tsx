'use client';

// ============================================================
// components/LeadModal.tsx
// Modal de captación de leads — inserta en Supabase tabla leads
// ============================================================

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Property } from '@/lib/tokko';

interface LeadModalProps {
  propiedad: Property | null;
  isOpen: boolean;
  onClose: () => void;
}

type FormState = 'idle' | 'loading' | 'success' | 'error';

export default function LeadModal({ propiedad, isOpen, onClose }: LeadModalProps) {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [formState, setFormState] = useState<FormState>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const firstInputRef = useRef<HTMLInputElement>(null);

  // Focus al abrir
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => firstInputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Resetear al cerrar
  useEffect(() => {
    if (!isOpen) {
      setNombre('');
      setEmail('');
      setMensaje('');
      setFormState('idle');
      setErrorMsg('');
    }
  }, [isOpen]);

  // Cerrar con Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (isOpen) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMsg('El email es obligatorio.');
      return;
    }

    setFormState('loading');
    setErrorMsg('');

    const res = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: nombre.trim(),
        email: email.trim().toLowerCase(),
        mensaje: mensaje.trim() || undefined,
        propiedad_id: propiedad ? String(propiedad.id) : undefined,
        propiedad_titulo: propiedad?.title,
      }),
    });

    if (!res.ok) {
      setFormState('error');
      setErrorMsg('Ocurrió un error al enviar. Intentá nuevamente.');
    } else {
      setFormState('success');
    }
  }

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="lead-modal-title"
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 relative">
          {/* Cerrar */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors text-xl leading-none"
            aria-label="Cerrar"
          >
            ✕
          </button>

          {/* Título */}
          <h2 id="lead-modal-title" className="text-lg font-semibold text-gray-900 mb-1">
            Consultar propiedad
          </h2>
          {propiedad && (
            <p className="text-sm text-gray-500 mb-4 pr-6">{propiedad.address}</p>
          )}

          {/* Formulario */}
          {formState !== 'success' ? (
            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
              {/* Hidden fields documentados */}
              <input type="hidden" name="propiedad_id" value={propiedad ? String(propiedad.id) : ''} />
              <input type="hidden" name="propiedad_titulo" value={propiedad?.title ?? ''} />

              <div className="flex flex-col gap-1">
                <label htmlFor="lead-nombre" className="text-xs font-medium text-gray-600">
                  Nombre
                </label>
                <input
                  id="lead-nombre"
                  ref={firstInputRef}
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Tu nombre"
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 transition"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="lead-email" className="text-xs font-medium text-gray-600">
                  Email <span className="text-rose-500">*</span>
                </label>
                <input
                  id="lead-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  required
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 transition"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="lead-mensaje" className="text-xs font-medium text-gray-600">
                  Mensaje <span className="text-gray-400">(opcional)</span>
                </label>
                <textarea
                  id="lead-mensaje"
                  value={mensaje}
                  onChange={(e) => setMensaje(e.target.value)}
                  placeholder="¿Cuándo podría visitarla? ¿Alguna consulta específica?"
                  rows={3}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 transition resize-none"
                />
              </div>

              {errorMsg && (
                <p className="text-xs text-rose-600 font-medium">{errorMsg}</p>
              )}

              <button
                type="submit"
                disabled={formState === 'loading'}
                className="w-full bg-gray-900 text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-gray-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {formState === 'loading' ? 'Enviando...' : 'Enviar consulta'}
              </button>

              <p className="text-[11px] text-gray-400 text-center leading-relaxed">
                Al enviar aceptás nuestra{' '}
                <Link href="/privacidad" target="_blank" className="underline hover:text-gray-600">
                  Política de Privacidad
                </Link>.
                Tus datos se usan solo para responder tu consulta.
              </p>
            </form>
          ) : (
            /* Success state */
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <span className="text-4xl">✅</span>
              <p className="font-semibold text-gray-900">¡Consulta enviada!</p>
              <p className="text-sm text-gray-500">
                Te contactaremos a <strong>{email}</strong> a la brevedad.
              </p>
              <button
                onClick={onClose}
                className="mt-2 px-5 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:border-gray-600 transition"
              >
                Cerrar
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
