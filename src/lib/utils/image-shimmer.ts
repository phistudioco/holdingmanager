/**
 * Utilitaire pour générer des placeholders blur pour les images Next.js
 * Améliore l'expérience utilisateur pendant le chargement des images
 */

/**
 * Génère un SVG de shimmer animé pour le placeholder
 * @param w - Largeur du shimmer
 * @param h - Hauteur du shimmer
 * @returns SVG string du shimmer
 */
export const shimmer = (w: number, h: number) => `
<svg width="${w}" height="${h}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="g">
      <stop stop-color="#f3f4f6" offset="20%" />
      <stop stop-color="#e5e7eb" offset="50%" />
      <stop stop-color="#f3f4f6" offset="70%" />
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="#f3f4f6" />
  <rect id="r" width="${w}" height="${h}" fill="url(#g)" />
  <animate xlink:href="#r" attributeName="x" from="-${w}" to="${w}" dur="1s" repeatCount="indefinite"  />
</svg>`

/**
 * Convertit une string en base64
 * @param str - String à convertir
 * @returns String encodée en base64
 */
export const toBase64 = (str: string) =>
  typeof window === 'undefined'
    ? Buffer.from(str).toString('base64')
    : window.btoa(str)

/**
 * Génère un blurDataURL complet pour Next.js Image
 * @param width - Largeur de l'image
 * @param height - Hauteur de l'image
 * @returns Data URL prête à utiliser
 */
export const getBlurDataURL = (width: number = 700, height: number = 475) => {
  return `data:image/svg+xml;base64,${toBase64(shimmer(width, height))}`
}

/**
 * Génère un blurDataURL pour un avatar (format carré)
 * @param size - Taille de l'avatar (par défaut 128)
 * @returns Data URL pour avatar
 */
export const getAvatarBlurDataURL = (size: number = 128) => {
  return getBlurDataURL(size, size)
}
