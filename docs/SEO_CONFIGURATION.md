# Configuration SEO - PHI Studios Holding Manager

## Vue d'ensemble

Configuration SEO complète pour l'application Next.js 14 Holding Manager, optimisée pour une application privée interne.

**Date de configuration :** 2026-02-14
**Version Next.js :** 14.2.35
**Statut :** Production Ready

---

## Fichiers Configurés

### 1. Metadata Racine (`src/app/layout.tsx`)

#### Metadata complète
```typescript
export const metadata: Metadata = {
  title: {
    default: 'PHI Studios Holding Manager',
    template: '%s | PHI Studios',
  },
  description: 'Système de gestion centralisé pour le groupe PHI Studios - Gestion financière, RH et opérationnelle',
  keywords: ['gestion', 'holding', 'finance', 'RH', 'PHI Studios', 'robotique', 'digital', 'outsourcing'],
  authors: [{ name: 'PHI Studios' }],
  creator: 'PHI Studios',
  publisher: 'PHI Studios',
  applicationName: 'PHI Studios Holding Manager',
  robots: {
    index: false, // Application privée
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      'max-video-preview': -1,
      'max-image-preview': 'none',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    siteName: 'PHI Studios Holding Manager',
    title: 'PHI Studios Holding Manager',
    description: 'Système de gestion centralisé pour le groupe PHI Studios',
  },
  twitter: {
    card: 'summary',
    title: 'PHI Studios Holding Manager',
    description: 'Système de gestion centralisé pour le groupe PHI Studios',
  },
  verification: {
    // Codes de vérification disponibles si nécessaire
  },
}
```

#### Viewport (Next.js 14+)
```typescript
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}
```

**Note :** Le viewport est maintenant un export séparé depuis Next.js 14 pour suivre les meilleures pratiques.

---

### 2. Sitemap (`src/app/sitemap.ts`)

Génère automatiquement `/sitemap.xml` avec les routes publiques uniquement.

```typescript
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://holding.phistudios.com'

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/portail`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ]
}
```

**Accès :** `https://holding.phistudios.com/sitemap.xml`

---

### 3. Robots.txt (`src/app/robots.ts`)

Génère automatiquement `/robots.txt` pour bloquer tous les crawlers.

```typescript
export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://holding.phistudios.com'

  return {
    rules: [
      {
        userAgent: '*',
        disallow: '/',
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
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
```

**Accès :** `https://holding.phistudios.com/robots.txt`

**Résultat :**
```txt
User-agent: *
Disallow: /

User-agent: Googlebot
Disallow: /

User-agent: Bingbot
Disallow: /

Sitemap: https://holding.phistudios.com/sitemap.xml
```

---

### 4. Favicons et App Icons

Les fichiers suivants sont présents dans `src/app/` :

| Fichier | Taille | Usage |
|---------|--------|-------|
| `favicon.ico` | 11 KB | Favicon standard (navigateurs) |
| `icon.png` | 523 KB | Icône moderne (PNG) |
| `apple-icon.png` | 523 KB | Icône Apple Touch (iOS/iPadOS) |

**Auto-détection Next.js :** Ces fichiers sont automatiquement référencés dans le `<head>` par Next.js 14.

---

## Configuration pour Application Privée

### Blocage d'indexation

L'application est configurée pour **bloquer complètement l'indexation** :

1. **robots.txt** : `Disallow: /` pour tous les user agents
2. **Meta robots** : `index: false`, `follow: false`
3. **GoogleBot spécifique** : Configuration renforcée anti-indexation
4. **Cache** : `nocache: true`

### Sécurité SEO

- Pas de pages dans le sitemap sauf portail public
- Middleware d'authentification protège les routes privées
- Aucune donnée sensible dans les metadata

---

## Variables d'Environnement

### Configuration requise dans `.env.local`

```bash
# URL publique de l'application (pour sitemap/robots)
NEXT_PUBLIC_APP_URL=https://holding.phistudios.com
```

**Fallback :** Si non définie, l'URL par défaut est `https://holding.phistudios.com`

---

## Vérifications Post-Déploiement

### URLs à tester

1. `https://holding.phistudios.com/robots.txt`
   - Doit afficher les règles de blocage

2. `https://holding.phistudios.com/sitemap.xml`
   - Doit lister uniquement les routes publiques

3. `https://holding.phistudios.com/favicon.ico`
   - Doit charger le favicon

4. Metadata dans le `<head>`
   - Inspecter avec DevTools
   - Vérifier `<meta name="robots" content="noindex,nofollow">`

### Outils de validation

```bash
# Tester localement
npm run build
npm run start

# Vérifier robots.txt
curl http://localhost:3000/robots.txt

# Vérifier sitemap.xml
curl http://localhost:3000/sitemap.xml
```

---

## Améliorations Futures (Optionnelles)

### 1. Manifest PWA

Créer `src/app/manifest.ts` pour support Progressive Web App :

```typescript
import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'PHI Studios Holding Manager',
    short_name: 'Holding Manager',
    description: 'Système de gestion centralisé pour PHI Studios',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#3B82F6',
    icons: [
      {
        src: '/icon.png',
        sizes: 'any',
        type: 'image/png',
      },
    ],
  }
}
```

### 2. Metadata par page

Pour les pages importantes, ajouter une metadata spécifique dans leurs layouts :

```typescript
// Exemple: src/app/(dashboard)/finance/layout.tsx
export const metadata: Metadata = {
  title: 'Finance',
  description: 'Gestion financière et comptabilité',
}
```

### 3. Open Graph Images

Ajouter des images OG personnalisées par section :

```typescript
// src/app/opengraph-image.tsx ou opengraph-image.png
```

### 4. Structured Data (JSON-LD)

Pour les pages publiques (portail), ajouter des données structurées :

```typescript
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'PHI Studios',
  url: 'https://holding.phistudios.com',
}
```

---

## Résolution de Problèmes

### Warning : Viewport dans metadata

**Problème :** Next.js 14 affiche un warning si `viewport` est dans `metadata`

**Solution :** Utiliser un export séparé `viewport` (déjà implémenté)

```typescript
// ✅ Correct (Next.js 14+)
export const viewport: Viewport = { ... }

// ❌ Incorrect
export const metadata: Metadata = {
  viewport: { ... }
}
```

### Build échoue avec erreur de type

**Problème :** TypeScript n'accepte pas les types Metadata

**Solution :** Vérifier l'import
```typescript
import type { Metadata, Viewport } from 'next'
```

---

## Checklist de Validation

- [x] Metadata racine configurée dans `layout.tsx`
- [x] Viewport séparé (Next.js 14+)
- [x] `sitemap.ts` créé et fonctionnel
- [x] `robots.ts` créé avec blocage complet
- [x] Favicons présents (`favicon.ico`, `icon.png`, `apple-icon.png`)
- [x] Build Next.js réussi sans warning
- [x] Application privée : `robots.index = false`
- [x] Variables d'environnement documentées
- [ ] Tests post-déploiement effectués
- [ ] Validation avec Google Search Console (optionnel)

---

## Références

- [Next.js 14 Metadata API](https://nextjs.org/docs/app/api-reference/functions/generate-metadata)
- [Next.js 14 Viewport](https://nextjs.org/docs/app/api-reference/functions/generate-viewport)
- [Next.js Sitemap](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap)
- [Next.js Robots.txt](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots)

---

**Dernière mise à jour :** 2026-02-14
**Responsable :** PHI Studios Dev Team
