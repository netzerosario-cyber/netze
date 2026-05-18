/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Los errores de tipo se validan en dev, no bloquear el build
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      // Fotos mock de desarrollo (Unsplash)
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      // Fotos reales de Tokko Broker
      {
        protocol: 'https',
        hostname: 'tokkobroker.com',
      },
      {
        protocol: 'http',
        hostname: 'tokkobroker.com',
      },
      {
        protocol: 'https',
        hostname: '*.tokkobroker.com',
      },
    ],
  },

  // ── Redirects: Tokko genera links como netze.com.ar/{id} ────────
  // Redirigimos permanentemente a /propiedad/{id}
  async redirects() {
    return [
      {
        // Solo IDs numéricos (mínimo 4 dígitos) en la raíz
        source: '/:id(\\d{4,})',
        destination: '/propiedad/:id',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
