'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Mail, Lock, AlertCircle, Building2, ArrowLeft } from 'lucide-react'

export default function PortailLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const supabase = createClient()
      const db = createClient()

      // Connexion avec Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        if (authError.message === 'Invalid login credentials') {
          setError('Email ou mot de passe incorrect')
        } else {
          setError(authError.message)
        }
        return
      }

      // Vérifier que l'utilisateur est bien un client du portail
      // Table clients pas complètement typée dans database.ts - type assertion temporaire
      const { data: client, error: clientError } = await (db as any)
        .from('clients')
        .select('id, nom, portail_actif')
        .eq('portail_user_id', authData.user.id)
        .single()

      if (clientError || !client) {
        await supabase.auth.signOut()
        setError('Compte non autorisé pour le portail client')
        return
      }

      if (!client.portail_actif) {
        await supabase.auth.signOut()
        setError('Votre accès au portail n\'est pas encore activé. Contactez PHI Studios.')
        return
      }

      // Mettre à jour la dernière connexion
      // Table clients pas complètement typée dans database.ts - type assertion temporaire
      await (db as any)
        .from('clients')
        .update({ derniere_connexion_portail: new Date().toISOString() })
        .eq('id', client.id)

      router.push('/portail')
      router.refresh()
    } catch {
      setError('Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Partie gauche - Branding Client */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-phi-primary to-phi-primary/80 items-center justify-center p-12 relative overflow-hidden">
        {/* Motifs décoratifs */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-phi-highlight blur-3xl" />
          <div className="absolute bottom-20 right-20 w-80 h-80 rounded-full bg-phi-accent blur-3xl" />
        </div>

        <div className="text-center text-white max-w-md relative z-10">
          <div className="mb-8">
            <Building2 className="h-20 w-20 mx-auto mb-4 opacity-90" />
            <h1 className="text-4xl font-heading font-bold mb-2">
              Portail Client
            </h1>
            <p className="text-lg opacity-80">
              PHI Studios
            </p>
          </div>

          <div className="space-y-4 text-left bg-white/10 backdrop-blur-sm rounded-xl p-6">
            <h2 className="font-semibold text-lg mb-4">Vos avantages</h2>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 mt-2 rounded-full bg-phi-highlight shrink-0" />
              <span>Soumettez vos demandes 24h/24</span>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 mt-2 rounded-full bg-phi-highlight shrink-0" />
              <span>Suivez l'avancement en temps réel</span>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 mt-2 rounded-full bg-phi-highlight shrink-0" />
              <span>Échangez directement avec nos équipes</span>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 mt-2 rounded-full bg-phi-highlight shrink-0" />
              <span>Accédez à vos documents et livrables</span>
            </div>
          </div>
        </div>
      </div>

      {/* Partie droite - Formulaire */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour au site
          </Link>

          <Card className="border-0 shadow-xl">
            <CardHeader className="space-y-1 text-center">
              <div className="lg:hidden mb-4">
                <Building2 className="h-12 w-12 mx-auto text-phi-primary mb-2" />
                <h1 className="text-xl font-heading font-bold text-phi-primary">
                  Portail Client
                </h1>
              </div>
              <CardTitle className="text-2xl font-heading">Connexion</CardTitle>
              <CardDescription>
                Accédez à votre espace client PHI Studios
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleLogin}>
              <CardContent className="space-y-4">
                {error && (
                  <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 rounded-lg">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="votre@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Mot de passe</Label>
                    <Link
                      href="/portail/mot-de-passe-oublie"
                      className="text-sm text-phi-accent hover:underline"
                    >
                      Mot de passe oublié ?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex flex-col gap-4">
                <Button
                  type="submit"
                  className="w-full bg-phi-primary hover:bg-phi-primary/90"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Connexion en cours...
                    </>
                  ) : (
                    'Se connecter'
                  )}
                </Button>

                <p className="text-sm text-center text-muted-foreground">
                  Besoin d'un accès ?{' '}
                  <a href="mailto:contact@phistudios.com" className="text-phi-accent hover:underline font-medium">
                    Contactez-nous
                  </a>
                </p>
              </CardFooter>
            </form>
          </Card>

          <p className="text-xs text-center text-muted-foreground mt-6">
            © {new Date().getFullYear()} PHI Studios. Tous droits réservés.
          </p>
        </div>
      </div>
    </div>
  )
}
