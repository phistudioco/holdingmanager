import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Authentification',
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex">
      {/* Partie gauche - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-phi-primary via-phi-accent to-phi-highlight items-center justify-center p-12">
        <div className="text-center text-white max-w-md">
          <h1 className="text-5xl font-heading font-bold mb-4">
            PHI <span className="text-phi-highlight">Studios</span>
          </h1>
          <p className="text-xl italic mb-8 opacity-90">
            Promote Human Intelligence
          </p>
          <div className="space-y-4 text-left bg-white/10 backdrop-blur-sm rounded-xl p-6">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-robotique" />
              <span>Robotique - Automatisation intelligente</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-digital" />
              <span>Digital - Solutions logicielles</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-white" />
              <span>Out Sourcing - Services externalisés</span>
            </div>
          </div>
        </div>
      </div>

      {/* Partie droite - Formulaire */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  )
}
