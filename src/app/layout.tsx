import type { Metadata } from 'next'
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

// Metadata
export const metadata: Metadata = {
  title: {
    default: 'HoldingManager | PHI Studios',
    template: '%s | HoldingManager',
  },
  description: 'Application de gestion de holding PHI Studios - Promote Human Intelligence',
  keywords: ['holding', 'gestion', 'PHI Studios', 'robotique', 'digital', 'outsourcing'],
  authors: [{ name: 'PHI Studios' }],
  creator: 'PHI Studios',
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
