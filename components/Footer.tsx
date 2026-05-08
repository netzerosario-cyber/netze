// ============================================================
// components/Footer.tsx — Footer global
// ============================================================
import Image from 'next/image';
import Link from 'next/link';

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-gray-100 dark:border-[#21262d] bg-white dark:bg-[#0d1117] py-6 px-4 md:px-8 mt-auto">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">

        {/* Logo + info */}
        <div className="flex flex-col items-center sm:items-start gap-1">
          <Link href="/" className="flex items-center select-none shrink-0 mb-1">
            <Image 
              src="/logos/Para fondos claros.svg" 
              alt="Netze Logo" 
              width={80} 
              height={28} 
              className="block dark:hidden object-contain" 
            />
            <Image 
              src="/logos/Para fondos oscuros.svg" 
              alt="Netze Logo" 
              width={80} 
              height={28} 
              className="hidden dark:block object-contain" 
            />
          </Link>
          <p className="text-xs text-gray-400">
            Administración Netze · Rosario, Santa Fe
          </p>
          <a href="tel:+5493417538537" className="text-xs text-gray-400 hover:text-[#0041CE] transition">
            +54 9 341 753-8537
          </a>
        </div>

        {/* Links */}
        <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-gray-500">
          <Link href="/" className="hover:text-[#0041CE] transition">Propiedades</Link>
          <Link href="/nosotros" className="hover:text-[#0041CE] transition">Nosotros</Link>
          <Link href="/contacto" className="hover:text-[#0041CE] transition">Contacto</Link>
          <Link href="/terminos" className="hover:text-[#0041CE] transition">Términos</Link>
          <Link href="/privacidad" className="hover:text-[#0041CE] transition">Privacidad</Link>
        </nav>

        {/* Copyright */}
        <p className="text-xs text-gray-400 text-center sm:text-right">
          © {year} Netze
        </p>
      </div>
    </footer>
  );
}
