'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { NotificationBell } from './NotificationBell'
import {
  Search,
  User,
  LogOut,
  Settings,
  ChevronDown,
  Menu,
} from 'lucide-react'

type UserData = {
  nom: string
  prenom: string
  email: string
  avatar?: string | null
}

type HeaderProps = {
  user: UserData | null
  onMenuClick?: () => void
}

export function Header({ user, onMenuClick }: HeaderProps) {
  const router = useRouter()
  const [showUserMenu, setShowUserMenu] = useState(false)

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-gray-200">
      <div className="h-full px-4 flex items-center justify-between gap-4">
        {/* Menu mobile */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Barre de recherche - responsive */}
        <div className="flex-1 max-w-xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="search"
              placeholder="Rechercher..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-phi-primary/20 focus:border-phi-primary"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Notifications - Temps réel avec Supabase Realtime */}
          <NotificationBell />

          {/* Menu utilisateur */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="w-8 h-8 bg-phi-primary/10 rounded-full flex items-center justify-center overflow-hidden">
                {user?.avatar ? (
                  <Image
                    src={user.avatar}
                    alt={`${user.prenom} ${user.nom}`}
                    width={32}
                    height={32}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <User className="h-4 w-4 text-phi-primary" />
                )}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium">
                  {user ? `${user.prenom} ${user.nom}` : 'Utilisateur'}
                </p>
              </div>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </button>

            {showUserMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowUserMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-56 max-w-[calc(100vw-2rem)] bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                  <div className="p-3 border-b border-gray-100">
                    <p className="font-medium text-sm">
                      {user ? `${user.prenom} ${user.nom}` : 'Utilisateur'}
                    </p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                  <div className="p-1">
                    <Link
                      href="/profil"
                      className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-gray-100"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <User className="h-4 w-4" />
                      Mon profil
                    </Link>
                    <Link
                      href="/admin/settings"
                      className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-gray-100"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <Settings className="h-4 w-4" />
                      Paramètres
                    </Link>
                    <hr className="my-1" />
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 rounded-md hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4" />
                      Déconnexion
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
