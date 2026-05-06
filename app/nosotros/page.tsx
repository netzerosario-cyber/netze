// ============================================================
// app/nosotros/page.tsx — Quiénes somos
// ============================================================
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Quiénes somos | Netze',
  description: 'Administración Netze — Inmobiliaria en Rosario, Santa Fe. Más de 15 años de experiencia en compra, venta y alquiler de propiedades.',
};

export default function NosotrosPage() {
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

        {/* Hero */}
        <div className="bg-gradient-to-br from-[#0041CE] to-[#0061FB] rounded-2xl p-8 md:p-12 text-white mb-8 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10"
            style={{backgroundImage: 'radial-gradient(circle at 80% 20%, white 0%, transparent 60%)'}} />
          <p className="text-sm font-semibold text-blue-200 uppercase tracking-widest mb-2">Administración Netze</p>
          <h1 className="text-3xl md:text-4xl font-black mb-4 leading-tight">
            Tu inmobiliaria de<br />confianza en Rosario
          </h1>
          <p className="text-blue-100 text-base leading-relaxed max-w-lg">
            Acompañamos a familias y empresas en uno de los momentos más importantes de su vida:
            encontrar, vender o alquilar su propiedad ideal.
          </p>
        </div>

        {/* Valores */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[
            { icon: '🤝', title: 'Compromiso', text: 'Nos involucramos personalmente en cada operación. Tu propiedad es nuestra prioridad.' },
            { icon: '📍', title: 'Conocimiento local', text: 'Más de 15 años en el mercado de Rosario y alrededores. Sabemos dónde está el valor.' },
            { icon: '⚡', title: 'Respuesta rápida', text: 'Respondemos consultas en menos de 1 hora por WhatsApp, todos los días.' },
          ].map((v) => (
            <div key={v.title} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <span className="text-3xl mb-3 block">{v.icon}</span>
              <h3 className="font-bold text-gray-900 mb-2">{v.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{v.text}</p>
            </div>
          ))}
        </div>

        {/* Info + CTA */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Nuestros servicios</h2>
            <ul className="space-y-3">
              {[
                { icon: '🏠', label: 'Compra y venta de propiedades' },
                { icon: '🔑', label: 'Alquiler residencial y comercial' },
                { icon: '📋', label: 'Tasaciones y consultoría' },
                { icon: '🏗️', label: 'Emprendimientos y desarrollos' },
                { icon: '📄', label: 'Gestión de documentación' },
              ].map((s) => (
                <li key={s.label} className="flex items-center gap-3 text-sm text-gray-700">
                  <span className="text-lg">{s.icon}</span>
                  {s.label}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col gap-4">
            <h2 className="text-lg font-bold text-gray-900">Contacto directo</h2>
            <div className="space-y-3">
              <a href="https://wa.me/5493413305741" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 text-sm text-gray-700 hover:text-[#25D366] transition">
                <span className="w-9 h-9 bg-[#25D366]/10 rounded-full flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#25D366">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </span>
                +54 9 341 330-5741 (WhatsApp)
              </a>
              <a href="mailto:administracion@netze.com.ar"
                className="flex items-center gap-3 text-sm text-gray-700 hover:text-[#0041CE] transition">
                <span className="w-9 h-9 bg-blue-50 rounded-full flex items-center justify-center">
                  <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="#0041CE" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </span>
                administracion@netze.com.ar
              </a>
              <div className="flex items-center gap-3 text-sm text-gray-700">
                <span className="w-9 h-9 bg-gray-50 rounded-full flex items-center justify-center">
                  <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="#6b7280" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </span>
                Urquiza 1470, Rosario, Santa Fe
              </div>
            </div>
            <Link href="/contacto"
              className="mt-2 flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#0041CE] text-white text-sm font-bold hover:bg-[#0035b0] transition">
              Enviar consulta
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
