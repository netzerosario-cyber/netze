import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { ThemeProvider } from '@/lib/theme';
import { ComparadorProvider } from '@/lib/comparador';
import Comparador from '@/components/Comparador';
import WhatsAppButton from '@/components/WhatsAppButton';
import Footer from '@/components/Footer';

const mazzard = localFont({
  src: [
    { path: '../public/fonts/MazzardH/MazzardH-Thin.otf', weight: '100', style: 'normal' },
    { path: '../public/fonts/MazzardH/MazzardH-ExtraLight.otf', weight: '200', style: 'normal' },
    { path: '../public/fonts/MazzardH/MazzardH-Light.otf', weight: '300', style: 'normal' },
    { path: '../public/fonts/MazzardH/MazzardH-Regular.otf', weight: '400', style: 'normal' },
    { path: '../public/fonts/MazzardH/MazzardH-Medium.otf', weight: '500', style: 'normal' },
    { path: '../public/fonts/MazzardH/MazzardH-SemiBold.otf', weight: '600', style: 'normal' },
    { path: '../public/fonts/MazzardH/MazzardH-Bold.otf', weight: '700', style: 'normal' },
    { path: '../public/fonts/MazzardH/MazzardH-ExtraBold.otf', weight: '800', style: 'normal' },
    { path: '../public/fonts/MazzardH/MazzardH-Black.otf', weight: '900', style: 'normal' },
  ],
  variable: '--font-mazzard',
});

export const metadata: Metadata = {
  title: 'netze · Portal Inmobiliario Rosario',
  description: 'Encontrá tu próxima propiedad en Rosario y alrededores. Casas, departamentos, terrenos y más. Administración Netze.',
  openGraph: {
    title: 'Netze — Portal Inmobiliario Rosario',
    description: 'Encontrá tu próxima propiedad en Rosario. Casas, departamentos, terrenos y más.',
    url: 'https://www.netze.com.ar',
    siteName: 'Netze',
    locale: 'es_AR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Netze — Portal Inmobiliario Rosario',
    description: 'Encontrá tu próxima propiedad en Rosario.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body className={`${mazzard.className} ${mazzard.variable} bg-gray-50 dark:bg-[#0d1117] text-gray-900 dark:text-[#bac5d1] antialiased h-dvh flex flex-col overflow-hidden transition-colors duration-300`}>
        <ThemeProvider>
          <ComparadorProvider>
            <main className="flex flex-col flex-1 min-h-0">
              {children}
            </main>
            {/* WhatsApp flotante — oculto en home mobile */}
            <div className="hidden md:block">
              <WhatsAppButton />
            </div>
            {/* Footer global — oculto en mobile para que el mapa ocupe toda la pantalla */}
            <div className="hidden md:block">
              <Footer />
            </div>
            {/* Barra flotante del comparador — disponible en toda la app */}
            <Comparador />
          </ComparadorProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
