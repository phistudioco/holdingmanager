import { MetadataRoute } from 'next'

/**
 * Génère le fichier robots.txt
 * Configuration pour application privée - blocage complet de l'indexation
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://holding.phistudios.com'

  return {
    rules: [
      {
        userAgent: '*',
        disallow: '/', // Bloquer tous les crawlers sur toutes les routes
      },
      {
        userAgent: 'Googlebot',
        disallow: '/',
      },
      {
        userAgent: 'Bingbot',
        disallow: '/',
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`, // Référence au sitemap même si bloqué
  }
}
