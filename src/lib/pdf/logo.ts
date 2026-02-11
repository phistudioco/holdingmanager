/**
 * Logo PHI Studios pour les PDF
 *
 * Ce fichier fournit le logo en format base64 pour l'intégration dans les PDF
 */

// Cache pour le logo chargé
let cachedLogo: string | null = null

/**
 * Charge le logo PHI Studios et le convertit en base64
 * Le résultat est mis en cache pour éviter les rechargements
 */
export async function loadLogo(): Promise<string | null> {
  if (cachedLogo) {
    return cachedLogo
  }

  try {
    // Charger l'image depuis le dossier public
    const response = await fetch('/logo-phi-studios.png')
    if (!response.ok) {
      console.error('Erreur lors du chargement du logo:', response.status)
      return null
    }

    const blob = await response.blob()

    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        cachedLogo = reader.result as string
        resolve(cachedLogo)
      }
      reader.onerror = () => {
        console.error('Erreur lors de la conversion du logo en base64')
        resolve(null)
      }
      reader.readAsDataURL(blob)
    })
  } catch (error) {
    console.error('Erreur lors du chargement du logo:', error)
    return null
  }
}

/**
 * Dimensions recommandées du logo dans les PDF
 * Le logo original a un ratio d'environ 3:1 (largeur:hauteur)
 */
export const LOGO_DIMENSIONS = {
  width: 55,
  height: 20,
}

/**
 * Position Y du logo pour alignement avec le titre
 */
export const LOGO_Y_POSITION = 15

// Cache pour le pictogramme (filigrane)
let cachedWatermark: string | null = null

/**
 * Charge le pictogramme PHI Studios et le convertit en niveaux de gris pour le filigrane
 */
export async function loadLogoIcon(): Promise<string | null> {
  if (cachedWatermark) {
    return cachedWatermark
  }

  try {
    // Essayer d'abord logo-watermark.png, sinon logo-icon.png
    let response = await fetch('/logo-watermark.png')
    if (!response.ok) {
      response = await fetch('/logo-icon.png')
    }
    if (!response.ok) {
      console.error('Erreur lors du chargement du pictogramme:', response.status)
      return null
    }

    const blob = await response.blob()

    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        // Créer un canvas pour convertir en niveaux de gris
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')

        if (!ctx) {
          console.error('Impossible de créer le contexte canvas')
          resolve(null)
          return
        }

        // Définir la taille du canvas
        canvas.width = img.width
        canvas.height = img.height

        // Dessiner l'image
        ctx.drawImage(img, 0, 0)

        // Récupérer les données de l'image
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const data = imageData.data

        // Convertir en niveaux de gris (luminosité)
        for (let i = 0; i < data.length; i += 4) {
          // Calculer la luminosité (formule standard)
          const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114

          // Rendre le gris plus clair pour le filigrane (entre le gris original et blanc)
          const lightGray = gray + (255 - gray) * 0.3

          data[i] = lightGray     // Rouge
          data[i + 1] = lightGray // Vert
          data[i + 2] = lightGray // Bleu
          // Alpha (data[i + 3]) reste inchangé pour préserver la transparence
        }

        // Remettre les données modifiées
        ctx.putImageData(imageData, 0, 0)

        // Convertir en base64
        cachedWatermark = canvas.toDataURL('image/png')
        resolve(cachedWatermark)
      }

      img.onerror = () => {
        console.error('Erreur lors du chargement de l\'image pour le filigrane')
        resolve(null)
      }

      // Charger l'image depuis le blob
      img.src = URL.createObjectURL(blob)
    })
  } catch (error) {
    console.error('Erreur lors du chargement du pictogramme:', error)
    return null
  }
}
