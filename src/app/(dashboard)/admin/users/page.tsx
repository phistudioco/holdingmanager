'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Users,
  Search,
  Shield,
  UserCog,
  Mail,
  Calendar,
  MoreHorizontal,
  Loader2,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

type UserWithRole = {
  id: string
  nom: string
  prenom: string
  email: string
  statut: string
  role_id: number | null
  created_at: string
  derniere_connexion: string | null
  role: {
    id: number
    nom: string
    niveau: number
  } | null
}

type Role = {
  id: number
  nom: string
  description: string | null
  niveau: number
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserWithRole[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState<string>('all')
  const [updating, setUpdating] = useState<string | null>(null)

  const supabase = createClient()

  const fetchData = useCallback(async () => {
    setLoading(true)

    // Récupérer les utilisateurs avec leurs rôles
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select(`
        id,
        nom,
        prenom,
        email,
        statut,
        role_id,
        created_at,
        derniere_connexion,
        role:roles (
          id,
          nom,
          niveau
        )
      `)
      .order('created_at', { ascending: false })

    if (!usersError && usersData) {
      setUsers(usersData as unknown as UserWithRole[])
    }

    // Récupérer les rôles
    const { data: rolesData } = await supabase
      .from('roles')
      .select('*')
      .order('niveau', { ascending: false })

    if (rolesData) {
      setRoles(rolesData)
    }

    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const updateUserRole = async (userId: string, roleId: number) => {
    setUpdating(userId)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('users')
      .update({ role_id: roleId })
      .eq('id', userId)

    if (!error) {
      await fetchData()
    }

    setUpdating(null)
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.nom.toLowerCase().includes(search.toLowerCase()) ||
      user.prenom.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase())

    const matchesRole =
      filterRole === 'all' || user.role?.nom === filterRole

    return matchesSearch && matchesRole
  })

  const getRoleBadgeColor = (roleName: string | undefined) => {
    switch (roleName) {
      case 'super_admin':
        return 'bg-purple-100 text-purple-700'
      case 'admin':
        return 'bg-blue-100 text-blue-700'
      case 'directeur':
        return 'bg-green-100 text-green-700'
      case 'responsable':
      case 'manager':
        return 'bg-amber-100 text-amber-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const stats = {
    total: users.length,
    admins: users.filter(u => u.role?.nom === 'super_admin' || u.role?.nom === 'admin').length,
    actifs: users.filter(u => u.statut === 'actif').length,
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestion des utilisateurs"
        description="Gérez les comptes utilisateurs et leurs rôles"
      />

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-gray-500">Utilisateurs</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Shield className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.admins}</p>
              <p className="text-sm text-gray-500">Administrateurs</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <UserCog className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.actifs}</p>
              <p className="text-sm text-gray-500">Actifs</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des utilisateurs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher par nom ou email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filtrer par rôle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les rôles</SelectItem>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.nom}>
                    {role.nom.replace('_', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-phi-primary" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Dernière connexion</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        Aucun utilisateur trouvé
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-phi-primary/10 flex items-center justify-center">
                              <span className="text-phi-primary font-medium">
                                {user.prenom[0]}{user.nom[0]}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium">{user.prenom} {user.nom}</p>
                              <p className="text-xs text-gray-500">
                                <Calendar className="inline h-3 w-3 mr-1" />
                                Inscrit le {formatDate(user.created_at)}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-gray-400" />
                            {user.email}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getRoleBadgeColor(user.role?.nom)}`}>
                            {user.role?.nom?.replace('_', ' ') || 'Non défini'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            user.statut === 'actif'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {user.statut}
                          </span>
                        </TableCell>
                        <TableCell className="text-gray-500">
                          {formatDate(user.derniere_connexion)}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                {updating === user.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <MoreHorizontal className="h-4 w-4" />
                                )}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {roles.map((role) => (
                                <DropdownMenuItem
                                  key={role.id}
                                  onClick={() => updateUserRole(user.id, role.id)}
                                  disabled={user.role?.id === role.id}
                                >
                                  <Shield className="h-4 w-4 mr-2" />
                                  Définir comme {role.nom.replace('_', ' ')}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
