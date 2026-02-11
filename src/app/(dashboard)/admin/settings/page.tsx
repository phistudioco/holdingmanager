'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Building2,
  Bell,
  Shield,
  Database,
  Save,
  CheckCircle,
} from 'lucide-react'

export default function AdminSettingsPage() {
  const [saved, setSaved] = useState(false)
  const [settings, setSettings] = useState({
    // Paramètres généraux
    companyName: 'PHI Studios',
    companyEmail: 'contact@phistudios.com',
    companyPhone: '+33 1 23 45 67 89',

    // Notifications
    emailNotifications: true,
    alertsEnabled: true,
    workflowNotifications: true,

    // Sécurité
    twoFactorAuth: false,
    sessionTimeout: 30,

    // Facturation
    defaultTva: 20,
    defaultPaymentDelay: 30,
    invoicePrefix: 'FAC',
  })

  const handleSave = () => {
    // Simuler la sauvegarde
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Paramètres"
        description="Configuration générale de l'application"
      />

      <div className="grid gap-6">
        {/* Informations de l'entreprise */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-phi-primary" />
              Informations de l&apos;entreprise
            </CardTitle>
            <CardDescription>
              Informations générales de la holding
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Nom de l&apos;entreprise</Label>
                <Input
                  id="companyName"
                  value={settings.companyName}
                  onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyEmail">Email de contact</Label>
                <Input
                  id="companyEmail"
                  type="email"
                  value={settings.companyEmail}
                  onChange={(e) => setSettings({ ...settings, companyEmail: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyPhone">Téléphone</Label>
                <Input
                  id="companyPhone"
                  value={settings.companyPhone}
                  onChange={(e) => setSettings({ ...settings, companyPhone: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-phi-primary" />
              Notifications
            </CardTitle>
            <CardDescription>
              Gérez les préférences de notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Notifications par email</p>
                <p className="text-sm text-gray-500">Recevoir les notifications par email</p>
              </div>
              <Switch
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => setSettings({ ...settings, emailNotifications: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Alertes système</p>
                <p className="text-sm text-gray-500">Activer les alertes automatiques</p>
              </div>
              <Switch
                checked={settings.alertsEnabled}
                onCheckedChange={(checked) => setSettings({ ...settings, alertsEnabled: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Notifications de workflow</p>
                <p className="text-sm text-gray-500">Notifier lors des demandes d&apos;approbation</p>
              </div>
              <Switch
                checked={settings.workflowNotifications}
                onCheckedChange={(checked) => setSettings({ ...settings, workflowNotifications: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Sécurité */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-phi-primary" />
              Sécurité
            </CardTitle>
            <CardDescription>
              Paramètres de sécurité de l&apos;application
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Authentification à deux facteurs</p>
                <p className="text-sm text-gray-500">Exiger 2FA pour tous les utilisateurs</p>
              </div>
              <Switch
                checked={settings.twoFactorAuth}
                onCheckedChange={(checked) => setSettings({ ...settings, twoFactorAuth: checked })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sessionTimeout">Expiration de session (minutes)</Label>
              <Input
                id="sessionTimeout"
                type="number"
                value={settings.sessionTimeout}
                onChange={(e) => setSettings({ ...settings, sessionTimeout: parseInt(e.target.value) || 30 })}
                className="w-32"
              />
            </div>
          </CardContent>
        </Card>

        {/* Facturation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-phi-primary" />
              Facturation
            </CardTitle>
            <CardDescription>
              Paramètres par défaut pour la facturation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="defaultTva">Taux TVA par défaut (%)</Label>
                <Input
                  id="defaultTva"
                  type="number"
                  value={settings.defaultTva}
                  onChange={(e) => setSettings({ ...settings, defaultTva: parseFloat(e.target.value) || 20 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="defaultPaymentDelay">Délai de paiement (jours)</Label>
                <Input
                  id="defaultPaymentDelay"
                  type="number"
                  value={settings.defaultPaymentDelay}
                  onChange={(e) => setSettings({ ...settings, defaultPaymentDelay: parseInt(e.target.value) || 30 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invoicePrefix">Préfixe factures</Label>
                <Input
                  id="invoicePrefix"
                  value={settings.invoicePrefix}
                  onChange={(e) => setSettings({ ...settings, invoicePrefix: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bouton Sauvegarder */}
        <div className="flex justify-end">
          <Button onClick={handleSave} className="bg-phi-primary hover:bg-phi-primary/90">
            {saved ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Enregistré !
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Enregistrer les modifications
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
