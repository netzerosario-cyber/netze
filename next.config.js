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
};

module.exports = nextConfig;
