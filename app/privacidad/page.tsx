import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de Privacidad | Netze',
  description: 'Cómo Administración Netze recopila, usa y protege tus datos personales. Ley 25.326.',
};

export default function PrivacidadPage() {
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
          <h1 className="text-2xl font-black text-gray-900 mb-1">Política de Privacidad</h1>
          <p className="text-sm text-gray-400 mb-2">Última actualización: {updated}</p>
          <p className="text-xs text-gray-400 mb-8">
            De conformidad con la <strong>Ley N° 25.326 de Protección de Datos Personales</strong> de la
            República Argentina y su Decreto Reglamentario N° 1558/2001.
          </p>

          <div className="prose prose-gray max-w-none text-sm leading-relaxed space-y-6">

            <section>
              <h2 className="text-base font-bold text-gray-800 mb-2">1. Responsable del tratamiento</h2>
              <p className="text-gray-600">
                <strong>Administración Netze</strong><br />
                Domicilio: Urquiza 1470, Rosario, Santa Fe, Argentina<br />
                Email: <a href="mailto:administracion@netze.com.ar" className="text-[#0041CE] underline">administracion@netze.com.ar</a><br />
                Teléfono: +54 9 341 330-5741
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-800 mb-2">2. Datos que recopilamos</h2>
              <p className="text-gray-600 mb-2">
                Recopilamos únicamente los datos que el usuario nos proporciona voluntariamente a través de los
                formularios de contacto del Sitio:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>Nombre y apellido</li>
                <li>Dirección de correo electrónico</li>
                <li>Número de teléfono o WhatsApp</li>
                <li>Mensaje de consulta</li>
                <li>Propiedad de interés (referencia interna)</li>
              </ul>
              <p className="text-gray-600 mt-2">
                <strong>No recopilamos</strong> datos sensibles (salud, creencias, origen étnico u otros contemplados
                en el art. 2 de la Ley 25.326).
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-800 mb-2">3. Finalidad del tratamiento</h2>
              <p className="text-gray-600">
                Los datos recopilados se utilizan exclusivamente para:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-1 mt-2">
                <li>Responder consultas sobre propiedades publicadas en el Sitio</li>
                <li>Coordinar visitas a propiedades de interés</li>
                <li>Enviar información sobre propiedades relevantes, previa aceptación del usuario</li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-800 mb-2">4. Base legal del tratamiento</h2>
              <p className="text-gray-600">
                El tratamiento se basa en el consentimiento libre, expreso e informado del usuario al completar y
                enviar el formulario de contacto, conforme al art. 5 de la Ley 25.326.
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-800 mb-2">5. Compartir datos con terceros</h2>
              <p className="text-gray-600">
                <strong>No vendemos, alquilamos ni cedemos</strong> los datos personales de los usuarios a terceros
                con fines comerciales. Los datos pueden ser accedidos por:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-1 mt-2">
                <li><strong>Tokko Broker:</strong> plataforma de gestión inmobiliaria utilizada para almacenar las consultas (con sede en Argentina, cumple Ley 25.326)</li>
                <li><strong>Supabase:</strong> servicio de base de datos donde se almacenan las consultas recibidas (servidores en Brasil/EE.UU., con cláusulas contractuales de transferencia internacional)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-800 mb-2">6. Conservación de los datos</h2>
              <p className="text-gray-600">
                Los datos se conservarán durante el tiempo necesario para gestionar la relación comercial y
                hasta que el usuario solicite su eliminación, o por el plazo que exija la legislación aplicable.
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-800 mb-2">7. Derechos del usuario (ARCO)</h2>
              <p className="text-gray-600 mb-2">
                Conforme a los artículos 14, 16 y 17 de la Ley 25.326, el usuario tiene derecho a:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li><strong>Acceso:</strong> solicitar qué datos personales tenemos sobre usted</li>
                <li><strong>Rectificación:</strong> corregir datos inexactos o incompletos</li>
                <li><strong>Cancelación:</strong> solicitar la eliminación de sus datos</li>
                <li><strong>Oposición:</strong> oponerse al tratamiento de sus datos</li>
              </ul>
              <p className="text-gray-600 mt-2">
                Para ejercer estos derechos, enviar un email a{' '}
                <a href="mailto:administracion@netze.com.ar" className="text-[#0041CE] underline">
                  administracion@netze.com.ar
                </a>{' '}
                con el asunto <em>"Derechos ARCO"</em>. Responderemos dentro de los 5 días hábiles.
              </p>
              <p className="text-gray-600 mt-2">
                El titular de los datos tiene la facultad de ejercer el derecho de acceso a los mismos en forma
                gratuita a intervalos no inferiores a seis meses, salvo que se acredite un interés legítimo al
                efecto, conforme el artículo 14, inciso 3 de la Ley 25.326.{' '}
                <strong>La Dirección Nacional de Protección de Datos Personales</strong>, Órgano de Control de la
                Ley 25.326, tiene la atribución de atender las denuncias y reclamos que se interpongan con relación
                al incumplimiento de las normas sobre protección de datos personales.
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-800 mb-2">8. Seguridad</h2>
              <p className="text-gray-600">
                Implementamos medidas técnicas y organizativas razonables para proteger los datos personales contra
                acceso no autorizado, alteración, divulgación o destrucción. La comunicación entre el Sitio y el
                usuario se realiza bajo protocolo HTTPS.
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-800 mb-2">9. Cookies y analytics</h2>
              <p className="text-gray-600">
                El Sitio puede utilizar cookies técnicas necesarias para su funcionamiento. No utilizamos cookies
                de seguimiento publicitario de terceros. En caso de implementar herramientas de analytics, se
                informará oportunamente.
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-800 mb-2">10. Modificaciones</h2>
              <p className="text-gray-600">
                Nos reservamos el derecho de actualizar esta Política. Las modificaciones serán publicadas en esta
                página con la fecha de actualización. Recomendamos revisarla periódicamente.
              </p>
            </section>

          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          © {new Date().getFullYear()} Administración Netze · Rosario, Argentina ·{' '}
          <Link href="/terminos" className="underline">Términos y Condiciones</Link>
        </p>
      </div>
    </div>
  );
}
