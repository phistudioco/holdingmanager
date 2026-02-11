/** @type {import('next').NextConfig} */
const nextConfig = {
  // Activer le mode strict React
  reactStrictMode: true,

  // Ignorer les erreurs ESLint pendant le build (Vercel)
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Ignorer les erreurs TypeScript pendant le build
  typescript: {
    ignoreBuildErrors: false,
  },

  // Configuration des images
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },

  // Optimisations expérimentales
  experimental: {
    // Optimiser les imports de packages
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },

  // Headers de sécurité
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
