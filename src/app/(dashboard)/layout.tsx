import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardLayoutClient } from './layout-client'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    redirect('/login')
  }

  // Récupérer les données utilisateur depuis la table users
  const { data: userData } = await supabase
    .from('users')
    .select('nom, prenom, email, avatar')
    .eq('id', authUser.id)
    .single()

  const user = userData || {
    nom: authUser.user_metadata?.nom || 'Utilisateur',
    prenom: authUser.user_metadata?.prenom || '',
    email: authUser.email || '',
    avatar: null,
  }

  return <DashboardLayoutClient user={user}>{children}</DashboardLayoutClient>
}
