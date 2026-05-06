// ============================================================
// app/sitemap.ts — Sitemap dinámico con propiedades de Tokko
// ============================================================
import type { MetadataRoute } from 'next';
import { getProperties } from '@/lib/tokko';

const BASE_URL = 'https://www.netze.com.ar';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Páginas estáticas
  const static_pages: MetadataRoute.Sitemap = [
    { url: BASE_URL,              lastModified: new Date(), changeFrequency: 'daily',   priority: 1.0 },
    { url: `${BASE_URL}/nosotros`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/contacto`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/terminos`, lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${BASE_URL}/privacidad`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ];

  // Propiedades dinámicas
  let property_pages: MetadataRoute.Sitemap = [];
  try {
    const { objects } = await getProperties({}, 0, 100);
    property_pages = objects.map((p) => ({
      url: `${BASE_URL}/propiedad/${p.id}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    }));
  } catch {
    // Si falla Tokko, igual devuelve las páginas estáticas
  }

  return [...static_pages, ...property_pages];
}
