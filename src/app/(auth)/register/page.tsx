'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Mail, Lock, User, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères')
      setLoading(false)
      return
    }

    try {
      const supabase = createClient()

      // Créer l'utilisateur dans Supabase Auth
      const { error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            nom: formData.nom,
            prenom: formData.prenom,
          }
        }
      })

      if (authError) {
        if (authError.message.includes('already registered')) {
          setError('Cet email est déjà utilisé')
        } else {
          setError(authError.message)
        }
        return
      }

      // Créer l'entrée dans la table users via API route
      // Note: L'insertion directe nécessite des privilèges admin
      // Le profil sera créé automatiquement via un trigger ou manuellement par l'admin
      // La création du profil utilisateur sera gérée par un trigger Supabase
      // ou via une API route avec le service_role_key

      setSuccess(true)
      setTimeout(() => {
        router.push('/login')
      }, 3000)
    } catch {
      setError('Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <Card className="border-0 shadow-xl">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-heading font-semibold">Compte créé avec succès !</h2>
            <p className="text-muted-foreground">
              Vérifiez votre email pour confirmer votre compte.
              Vous allez être redirigé vers la page de connexion...
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-xl">
      <CardHeader className="space-y-1 text-center">
        <div className="lg:hidden mb-4 flex justify-center">
          <Image
            src="/logo.png"
            alt="PHI Studios Logo"
            width={180}
            height={80}
            className="object-contain"
            priority
          />
        </div>
        <CardTitle className="text-2xl font-heading">Créer un compte</CardTitle>
        <CardDescription>
          Rejoignez HoldingManager PHI Studios
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleRegister}>
        <CardContent className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 rounded-lg">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nom">Nom</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="nom"
                  name="nom"
                  placeholder="Dupont"
                  value={formData.nom}
                  onChange={handleChange}
                  className="pl-10"
                  required
                  disabled={loading}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="prenom">Prénom</Label>
              <Input
                id="prenom"
                name="prenom"
                placeholder="Jean"
                value={formData.prenom}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="votre@email.com"
                value={formData.email}
                onChange={handleChange}
                className="pl-10"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                className="pl-10"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
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
                Création en cours...
              </>
            ) : (
              'Créer mon compte'
            )}
          </Button>

          <p className="text-sm text-center text-muted-foreground">
            Déjà un compte ?{' '}
            <Link href="/login" className="text-phi-accent hover:underline font-medium">
              Se connecter
            </Link>
          </p>

          <div className="pt-4 border-t border-gray-100">
            <Link
              href="/portail/login"
              className="flex items-center justify-center gap-2 text-sm text-phi-primary hover:text-phi-primary/80 font-medium transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              Accès Portail Client
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  )
}
