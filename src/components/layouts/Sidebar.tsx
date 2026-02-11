'use client'

import { useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth'
import { ModuleType, RoleType, ROLE_LEVELS } from '@/lib/auth/permissions'
import {
  LayoutDashboard,
  Building2,
  Users,
  Receipt,
  FileText,
  Briefcase,
  Settings,
  ChevronLeft,
  ChevronRight,
  Bot,
  Monitor,
  Package,
  Bell,
  GitBranch,
  ArrowRightLeft,
  X,
  Shield,
  UserCog,
  MessageSquareMore,
} from 'lucide-react'

type NavItem = {
  label: string
  href: string
  icon: React.ElementType
  badge?: number
  children?: NavItem[]
  // Permissions requises
  module?: ModuleType
  minRole?: RoleType
}

// Navigation avec permissions
const getNavigation = (alertCount?: number): NavItem[] => [
  {
    label: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
    module: 'dashboard',
  },
  {
    label: 'Filiales',
    href: '/filiales',
    icon: Building2,
    module: 'filiales',
    minRole: 'directeur',
  },
  {
    label: 'Employés',
    href: '/employes',
    icon: Users,
    module: 'employes',
  },
  {
    label: 'Finance',
    href: '/finance',
    icon: Receipt,
    module: 'factures',
    minRole: 'responsable',
    children: [
      { label: 'Vue générale', href: '/finance', icon: Receipt, module: 'factures' },
      { label: 'Clients', href: '/finance/clients', icon: Users, module: 'clients' },
      { label: 'Devis', href: '/finance/devis', icon: FileText, module: 'factures' },
      { label: 'Factures', href: '/finance/factures', icon: FileText, module: 'factures' },
      { label: 'Contrats', href: '/finance/contrats', icon: Briefcase, module: 'contrats', minRole: 'directeur' },
      { label: 'Transactions', href: '/finance/transactions', icon: ArrowRightLeft, module: 'transactions' },
      { label: 'Rapports', href: '/finance/rapports', icon: FileText, module: 'factures', minRole: 'responsable' },
      { label: 'Rapports perso.', href: '/finance/rapports/personnalises', icon: FileText, module: 'factures', minRole: 'responsable' },
    ],
  },
  {
    label: 'Services',
    href: '/services',
    icon: Package,
    module: 'services',
    minRole: 'responsable',
    children: [
      { label: 'Robotique', href: '/services/robotique', icon: Bot, module: 'services' },
      { label: 'Digital', href: '/services/digital', icon: Monitor, module: 'services' },
      { label: 'Out Sourcing', href: '/services/outsourcing', icon: Package, module: 'services' },
    ],
  },
  {
    label: 'Workflows',
    href: '/workflows',
    icon: GitBranch,
    module: 'workflows',
  },
  {
    label: 'Demandes Clients',
    href: '/demandes',
    icon: MessageSquareMore,
    module: 'clients',
    minRole: 'responsable',
  },
  {
    label: 'Alertes',
    href: '/alertes',
    icon: Bell,
    module: 'alertes',
    badge: alertCount,
  },
]

const getBottomNavigation = (): NavItem[] => [
  {
    label: 'Paramètres',
    href: '/parametres',
    icon: Settings,
    module: 'dashboard',
    children: [
      { label: 'Notifications', href: '/parametres/notifications', icon: Bell, module: 'dashboard' },
    ],
  },
  {
    label: 'Administration',
    href: '/admin',
    icon: Shield,
    module: 'admin',
    minRole: 'admin',
    children: [
      { label: 'Utilisateurs', href: '/admin/users', icon: UserCog, module: 'admin' },
      { label: 'Paramètres système', href: '/admin/settings', icon: Settings, module: 'admin' },
    ],
  },
]

type SidebarProps = {
  isOpen?: boolean
  onClose?: () => void
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [openMenus, setOpenMenus] = useState<string[]>([])

  // Récupérer le rôle de l'utilisateur
  const { role, roleLevel, loading } = useAuth()

  // Fonction pour vérifier si l'utilisateur a accès à un élément de navigation
  const hasAccess = useCallback((item: NavItem): boolean => {
    // Si pas de rôle défini, on bloque tout sauf le dashboard
    if (!role) {
      return item.href === '/'
    }

    // Vérifier le rôle minimum requis
    if (item.minRole) {
      const requiredLevel = ROLE_LEVELS[item.minRole] || 0
      if (roleLevel < requiredLevel) {
        return false
      }
    }

    return true
  }, [role, roleLevel])

  // Filtrer la navigation selon les permissions
  const filteredNavigation = useMemo(() => {
    const navigation = getNavigation()
    return navigation
      .filter(item => hasAccess(item))
      .map(item => ({
        ...item,
        children: item.children?.filter(child => hasAccess(child)),
      }))
  }, [hasAccess])

  const filteredBottomNavigation = useMemo(() => {
    return getBottomNavigation().filter(item => hasAccess(item))
  }, [hasAccess])

  const toggleMenu = (label: string) => {
    setOpenMenus(prev =>
      prev.includes(label)
        ? prev.filter(item => item !== label)
        : [...prev, label]
    )
  }

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/'
    }
    return pathname.startsWith(href)
  }

  const renderNavItem = (item: NavItem, isChild = false) => {
    const active = isActive(item.href)
    const hasChildren = item.children && item.children.length > 0
    const isMenuOpen = openMenus.includes(item.label)

    if (hasChildren && !collapsed) {
      return (
        <div key={item.href}>
          <button
            onClick={() => toggleMenu(item.label)}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              active
                ? 'bg-phi-primary/10 text-phi-primary'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            )}
          >
            <item.icon className="h-5 w-5 shrink-0" />
            <span className="flex-1 text-left">{item.label}</span>
            <ChevronRight
              className={cn(
                'h-4 w-4 transition-transform',
                isMenuOpen && 'rotate-90'
              )}
            />
          </button>
          {isMenuOpen && (
            <div className="ml-4 mt-1 space-y-1 border-l-2 border-gray-200 pl-3">
              {item.children?.map(child => renderNavItem(child, true))}
            </div>
          )}
        </div>
      )
    }

    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={handleNavClick}
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
          active
            ? 'bg-phi-primary/10 text-phi-primary'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
          isChild && 'py-2',
          collapsed && 'justify-center'
        )}
        title={collapsed ? item.label : undefined}
      >
        <item.icon className={cn('h-5 w-5 shrink-0', isChild && 'h-4 w-4')} />
        {!collapsed && (
          <>
            <span className="flex-1">{item.label}</span>
            {item.badge && item.badge > 0 && (
              <span className="px-2 py-0.5 text-xs font-semibold bg-phi-accent text-white rounded-full">
                {item.badge}
              </span>
            )}
          </>
        )}
      </Link>
    )
  }

  // Fermer le menu mobile lors de la navigation
  const handleNavClick = () => {
    if (onClose) onClose()
  }

  // Afficher un loader pendant le chargement
  if (loading) {
    return (
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen bg-white border-r border-gray-200 transition-all duration-300',
          'max-lg:-translate-x-full max-lg:shadow-xl',
          isOpen && 'max-lg:translate-x-0',
          'lg:translate-x-0 w-64'
        )}
      >
        <div className="h-16 flex items-center justify-center border-b border-gray-200">
          <div className="animate-pulse bg-gray-200 h-8 w-32 rounded" />
        </div>
        <nav className="p-3 space-y-2">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="animate-pulse bg-gray-100 h-10 rounded-lg" />
          ))}
        </nav>
      </aside>
    )
  }

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-white border-r border-gray-200 transition-all duration-300',
        // Mobile: caché par défaut, visible si isOpen
        'max-lg:-translate-x-full max-lg:shadow-xl',
        isOpen && 'max-lg:translate-x-0',
        // Desktop: toujours visible
        'lg:translate-x-0',
        collapsed ? 'w-64 lg:w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
        <Link href="/" className="flex items-center" onClick={handleNavClick}>
          {collapsed ? (
            <Image
              src="/logo-icon.png"
              alt="PHI Studios"
              width={32}
              height={32}
              className="rounded-lg"
            />
          ) : (
            <Image
              src="/logo-phi-studios.png"
              alt="PHI Studios"
              width={160}
              height={50}
              className="object-contain"
              priority
            />
          )}
        </Link>
        <div className="flex items-center gap-1">
          {/* Bouton fermer mobile */}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 lg:hidden"
              title="Fermer"
            >
              <X className="h-5 w-5" />
            </button>
          )}
          {/* Bouton réduire desktop */}
          {!collapsed && (
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hidden lg:block"
              title="Réduire"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
      {collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          className="w-full p-2 flex justify-center hover:bg-gray-100 text-gray-500"
          title="Agrandir"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      )}

      {/* Indicateur de rôle */}
      {!collapsed && role && (
        <div className="px-4 py-2 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className={cn(
              'w-2 h-2 rounded-full',
              role === 'super_admin' ? 'bg-purple-500' :
              role === 'admin' ? 'bg-blue-500' :
              role === 'directeur' ? 'bg-green-500' :
              role === 'responsable' || role === 'manager' ? 'bg-amber-500' :
              'bg-gray-400'
            )} />
            <span className="text-xs text-gray-500 capitalize">
              {role === 'super_admin' ? 'Super Admin' :
               role === 'responsable' ? 'Responsable' :
               role}
            </span>
          </div>
        </div>
      )}

      {/* Navigation principale */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto h-[calc(100vh-10rem)]">
        {filteredNavigation.map(item => renderNavItem(item))}
      </nav>

      {/* Navigation bas */}
      {filteredBottomNavigation.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-gray-200 bg-white">
          {filteredBottomNavigation.map(item => renderNavItem(item))}
        </div>
      )}
    </aside>
  )
}
