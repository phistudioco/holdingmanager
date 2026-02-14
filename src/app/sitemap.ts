import { MetadataRoute } from 'next'

/**
 * Génère le sitemap.xml pour l'application
 * Note: Application privée - sitemap minimal pour robots uniquement
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://holding.phistudios.com'

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    // Routes publiques uniquement (si nécessaire)
    // Les routes privées ne doivent pas être dans le sitemap
    {
      url: `${baseUrl}/portail`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ]
}
