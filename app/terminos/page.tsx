import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Términos y Condiciones | Netze',
  description: 'Condiciones de uso del portal inmobiliario Netze de Administración Netze, Rosario.',
};

export default function TerminosPage() {
  const updated = '4 de mayo de 2025';
  return (
    <div className="overflow-y-auto h-full bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <nav className="mb-8">
          <Link href="/" className="text-sm text-[#0041CE] hover:underline flex items-center gap-1.5">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Volver al inicio
          </Link>
        </nav>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h1 className="text-2xl font-black text-gray-900 mb-1">Términos y Condiciones</h1>
          <p className="text-sm text-gray-400 mb-8">Última actualización: {updated}</p>

          <div className="prose prose-gray max-w-none text-sm leading-relaxed space-y-6">

            <section>
              <h2 className="text-base font-bold text-gray-800 mb-2">1. Aceptación</h2>
              <p className="text-gray-600">
                Al acceder y utilizar el portal <strong>netze.com.ar</strong> (en adelante, "el Sitio"), operado por
                <strong> Administración Netze</strong> (en adelante, "la Inmobiliaria"), con domicilio en Urquiza 1470,
                Rosario, Santa Fe, Argentina, el usuario acepta íntegramente los presentes Términos y Condiciones.
                Si no está de acuerdo, por favor abstenerse de usar el Sitio.
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-800 mb-2">2. Carácter informativo del Sitio</h2>
              <p className="text-gray-600">
                El Sitio tiene carácter exclusivamente <strong>informativo y de exhibición</strong>. La Inmobiliaria no
                garantiza la exactitud, completitud o actualidad de la información publicada sobre las propiedades,
                incluyendo precios, superficies, disponibilidad y características. Toda la información proviene de
                la plataforma Tokko Broker y puede presentar demoras o inexactitudes.
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-800 mb-2">3. Precios y disponibilidad</h2>
              <p className="text-gray-600">
                Los precios publicados son <strong>de referencia</strong> y pueden cambiar sin previo aviso.
                La disponibilidad de las propiedades está sujeta a cambios. Para confirmar precios y disponibilidad,
                el usuario debe contactar directamente a la Inmobiliaria a través de los canales habilitados.
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-800 mb-2">4. Uso permitido</h2>
              <p className="text-gray-600">
                El usuario se compromete a utilizar el Sitio únicamente con fines lícitos y de buena fe.
                Queda prohibido: (a) reproducir o distribuir los contenidos sin autorización; (b) utilizar medios
                automatizados de scraping o extracción masiva de datos; (c) publicar información falsa o engañosa.
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-800 mb-2">5. Propiedad intelectual</h2>
              <p className="text-gray-600">
                El diseño, logotipo, textos e imágenes del Sitio son propiedad de Administración Netze o de sus
                proveedores y están protegidos por la legislación de propiedad intelectual argentina.
                Las fotografías de las propiedades son propiedad de sus respectivos propietarios o de la Inmobiliaria.
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-800 mb-2">6. Limitación de responsabilidad</h2>
              <p className="text-gray-600">
                La Inmobiliaria no se responsabiliza por: (a) decisiones tomadas por el usuario basándose en la
                información del Sitio; (b) daños derivados de interrupciones o errores técnicos; (c) contenidos de
                sitios de terceros enlazados desde el Sitio.
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-800 mb-2">7. Privacidad</h2>
              <p className="text-gray-600">
                El tratamiento de los datos personales se rige por nuestra{' '}
                <Link href="/privacidad" className="text-[#0041CE] underline">Política de Privacidad</Link>,
                que forma parte integral de estos Términos.
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-800 mb-2">8. Modificaciones</h2>
              <p className="text-gray-600">
                La Inmobiliaria se reserva el derecho de modificar estos Términos en cualquier momento.
                Las modificaciones entrarán en vigor desde su publicación en el Sitio. El uso continuado del Sitio
                implica la aceptación de los Términos vigentes.
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-800 mb-2">9. Legislación aplicable</h2>
              <p className="text-gray-600">
                Estos Términos se rigen por la legislación de la República Argentina. Cualquier disputa será resuelta
                ante los tribunales ordinarios de la ciudad de Rosario, provincia de Santa Fe.
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-800 mb-2">10. Contacto</h2>
              <p className="text-gray-600">
                Para consultas relacionadas con estos Términos, contactarse a:{' '}
                <a href="mailto:administracion@netze.com.ar" className="text-[#0041CE] underline">
                  administracion@netze.com.ar
                </a>{' '}
                o por WhatsApp al{' '}
                <a href="https://wa.me/5493413305741" target="_blank" rel="noopener noreferrer" className="text-[#0041CE] underline">
                  +54 9 341 330-5741
                </a>.
              </p>
            </section>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          © {new Date().getFullYear()} Administración Netze · Rosario, Argentina ·{' '}
          <Link href="/privacidad" className="underline">Política de Privacidad</Link>
        </p>
      </div>
    </div>
  );
}
