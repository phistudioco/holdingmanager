/**
 * Système de permissions et rôles pour HoldingManager
 * Hiérarchie: super_admin > directeur > responsable > employe
 */

// Types de rôles disponibles
export type RoleType = 'super_admin' | 'admin' | 'directeur' | 'manager' | 'responsable' | 'employe'

// Niveaux de permissions (plus le niveau est élevé, plus l'accès est large)
export const ROLE_LEVELS: Record<RoleType, number> = {
  super_admin: 100,
  admin: 80,
  directeur: 60,
  manager: 40,
  responsable: 40,
  employe: 20,
}

// Modules de l'application
export type ModuleType =
  | 'dashboard'
  | 'filiales'
  | 'employes'
  | 'clients'
  | 'factures'
  | 'contrats'
  | 'transactions'
  | 'workflows'
  | 'alertes'
  | 'services'
  | 'admin'
  | 'rapports'

// Actions possibles
export type ActionType = 'view' | 'create' | 'edit' | 'delete' | 'approve' | 'export'

// Définition des permissions par rôle
export const ROLE_PERMISSIONS: Record<RoleType, Partial<Record<ModuleType, ActionType[]>>> = {
  super_admin: {
    dashboard: ['view'],
    filiales: ['view', 'create', 'edit', 'delete'],
    employes: ['view', 'create', 'edit', 'delete'],
    clients: ['view', 'create', 'edit', 'delete'],
    factures: ['view', 'create', 'edit', 'delete', 'export'],
    contrats: ['view', 'create', 'edit', 'delete'],
    transactions: ['view', 'create', 'edit', 'delete', 'export'],
    workflows: ['view', 'create', 'edit', 'delete', 'approve'],
    alertes: ['view', 'edit'],
    services: ['view', 'create', 'edit', 'delete'],
    admin: ['view', 'create', 'edit', 'delete'],
    rapports: ['view', 'export'],
  },
  admin: {
    dashboard: ['view'],
    filiales: ['view', 'create', 'edit'],
    employes: ['view', 'create', 'edit', 'delete'],
    clients: ['view', 'create', 'edit', 'delete'],
    factures: ['view', 'create', 'edit', 'delete', 'export'],
    contrats: ['view', 'create', 'edit', 'delete'],
    transactions: ['view', 'create', 'edit', 'export'],
    workflows: ['view', 'create', 'approve'],
    alertes: ['view', 'edit'],
    services: ['view', 'edit'],
    admin: ['view'],
    rapports: ['view', 'export'],
  },
  directeur: {
    dashboard: ['view'],
    filiales: ['view'], // Voit sa filiale uniquement
    employes: ['view', 'create', 'edit'],
    clients: ['view', 'create', 'edit'],
    factures: ['view', 'create', 'edit', 'export'],
    contrats: ['view', 'create', 'edit'],
    transactions: ['view', 'create', 'edit'],
    workflows: ['view', 'create', 'approve'],
    alertes: ['view'],
    services: ['view'],
    rapports: ['view', 'export'],
  },
  manager: {
    dashboard: ['view'],
    employes: ['view'],
    clients: ['view', 'create', 'edit'],
    factures: ['view', 'create', 'edit'],
    contrats: ['view'],
    transactions: ['view', 'create'],
    workflows: ['view', 'create', 'approve'],
    alertes: ['view'],
    services: ['view'],
  },
  responsable: {
    dashboard: ['view'],
    employes: ['view'],
    clients: ['view', 'create', 'edit'],
    factures: ['view', 'create', 'edit'],
    contrats: ['view'],
    transactions: ['view', 'create'],
    workflows: ['view', 'create', 'approve'],
    alertes: ['view'],
    services: ['view'],
  },
  employe: {
    dashboard: ['view'],
    employes: ['view'], // Voit ses collègues
    clients: ['view'],
    factures: ['view'],
    workflows: ['view', 'create'], // Peut créer des demandes
    alertes: ['view'],
  },
}

// Routes protégées par niveau minimum
export const PROTECTED_ROUTES: Record<string, number> = {
  '/admin': 80,           // Admin et Super Admin uniquement
  '/filiales/nouveau': 80, // Création filiale = admin+
  '/filiales': 60,        // Directeur+
  '/employes/nouveau': 60, // Création employé = directeur+
  '/employes': 20,        // Tous peuvent voir
  '/finance/contrats/nouveau': 60,
  '/finance/contrats': 40,
  '/finance/factures': 40,
  '/finance/clients': 40,
  '/finance/transactions': 40,
  '/services': 40,
  '/workflows': 20,
  '/alertes': 20,
  '/': 20,
}

/**
 * Vérifie si un rôle a la permission pour une action sur un module
 */
export function hasPermission(
  role: RoleType | undefined,
  module: ModuleType,
  action: ActionType
): boolean {
  if (!role) return false

  const permissions = ROLE_PERMISSIONS[role]
  if (!permissions) return false

  const modulePermissions = permissions[module]
  if (!modulePermissions) return false

  return modulePermissions.includes(action)
}

/**
 * Vérifie si un rôle a accès à une route
 */
export function canAccessRoute(role: RoleType | undefined, path: string): boolean {
  if (!role) return false

  const userLevel = ROLE_LEVELS[role] || 0

  // Chercher la route la plus spécifique qui correspond
  let requiredLevel = 20 // Niveau minimum par défaut

  for (const [route, level] of Object.entries(PROTECTED_ROUTES)) {
    if (path.startsWith(route) && route.length > 1) {
      requiredLevel = Math.max(requiredLevel, level)
    }
  }

  // Route exacte
  if (PROTECTED_ROUTES[path] !== undefined) {
    requiredLevel = PROTECTED_ROUTES[path]
  }

  return userLevel >= requiredLevel
}

/**
 * Obtient le niveau d'un rôle
 */
export function getRoleLevel(role: RoleType | undefined): number {
  if (!role) return 0
  return ROLE_LEVELS[role] || 0
}

/**
 * Vérifie si un rôle est supérieur ou égal à un autre
 */
export function isRoleAtLeast(userRole: RoleType | undefined, requiredRole: RoleType): boolean {
  return getRoleLevel(userRole) >= getRoleLevel(requiredRole)
}

/**
 * Obtient les modules accessibles pour un rôle
 */
export function getAccessibleModules(role: RoleType | undefined): ModuleType[] {
  if (!role) return []

  const permissions = ROLE_PERMISSIONS[role]
  if (!permissions) return []

  return Object.keys(permissions) as ModuleType[]
}
