import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    default: 'Portail Client - PHI Studios',
    template: '%s | Portail Client PHI Studios',
  },
  description: 'Portail client PHI Studios - Soumettez et suivez vos demandes',
}

export default function PortailLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {children}
    </div>
  )
}
