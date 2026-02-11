'use client'

import { useState } from 'react'
import { Sidebar, Header } from '@/components/layouts'
import { AuthProvider } from '@/lib/auth'

type UserData = {
  nom: string
  prenom: string
  email: string
  avatar?: string | null
}

type DashboardLayoutClientProps = {
  children: React.ReactNode
  user: UserData
}

export function DashboardLayoutClient({ children, user }: DashboardLayoutClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const closeSidebar = () => setSidebarOpen(false)

  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Sidebar - drawer mobile, fixe desktop */}
        <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />

        {/* Overlay mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={closeSidebar}
          />
        )}

        {/* Contenu principal */}
        <div className="lg:pl-64 transition-all duration-300">
          <Header user={user} onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
          <main className="p-4 sm:p-6">{children}</main>
        </div>
      </div>
    </AuthProvider>
  )
}
