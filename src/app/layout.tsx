import type { Metadata, Viewport } from 'next'
import { Inter, Poppins } from 'next/font/google'
import './globals.css'

// Fonts
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
})

// Metadata SEO complète
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
    index: false, // Application privée - ne pas indexer
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
    // Ajouter les codes de vérification si nécessaire
    // google: 'votre-code-google',
    // yandex: 'votre-code-yandex',
  },
}

// Viewport configuration (Next.js 14+)
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${inter.variable} ${poppins.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  )
}
