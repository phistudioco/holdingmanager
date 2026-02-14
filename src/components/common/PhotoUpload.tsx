'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Camera, Upload, Trash2, Loader2, User } from 'lucide-react'
import Image from 'next/image'
import { getAvatarBlurDataURL } from '@/lib/utils/image-shimmer'

type PhotoUploadProps = {
  currentPhotoUrl?: string | null
  onPhotoChange: (url: string | null) => void
  bucketName?: string
  folderPath?: string
  className?: string
}

export function PhotoUpload({
  currentPhotoUrl,
  onPhotoChange,
  bucketName = 'photos',
  folderPath = 'employes',
  className = '',
}: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentPhotoUrl || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validation du fichier
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setError('Format non supporté. Utilisez JPG, PNG ou WebP.')
      return
    }

    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      setError('Le fichier est trop volumineux (max 5MB).')
      return
    }

    setError(null)
    setUploading(true)

    try {
      const supabase = createClient()

      // Générer un nom de fichier unique
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`
      const filePath = `${folderPath}/${fileName}`

      // Supprimer l'ancienne photo si elle existe
      if (currentPhotoUrl) {
        const oldPath = currentPhotoUrl.split('/').pop()
        if (oldPath) {
          await supabase.storage.from(bucketName).remove([`${folderPath}/${oldPath}`])
        }
      }

      // Upload du nouveau fichier
      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) {
        throw uploadError
      }

      // Obtenir l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath)

      setPreviewUrl(publicUrl)
      onPhotoChange(publicUrl)
    } catch (err) {
      console.error('Erreur upload:', err)
      setError('Erreur lors de l\'upload. Veuillez réessayer.')
    } finally {
      setUploading(false)
    }
  }

  const handleRemovePhoto = async () => {
    if (!previewUrl) return

    setUploading(true)
    try {
      const supabase = createClient()

      // Extraire le chemin du fichier depuis l'URL
      const urlParts = previewUrl.split('/')
      const fileName = urlParts[urlParts.length - 1]
      const filePath = `${folderPath}/${fileName}`

      await supabase.storage.from(bucketName).remove([filePath])

      setPreviewUrl(null)
      onPhotoChange(null)
    } catch (err) {
      console.error('Erreur suppression:', err)
      setError('Erreur lors de la suppression.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-6">
        {/* Preview */}
        <div className="relative">
          <div className="w-32 h-32 rounded-2xl overflow-hidden bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
            {previewUrl ? (
              <Image
                src={previewUrl}
                alt="Photo"
                fill
                className="object-cover"
                placeholder="blur"
                blurDataURL={getAvatarBlurDataURL(128)}
              />
            ) : (
              <User className="w-16 h-16 text-gray-300" />
            )}
            {uploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
            )}
          </div>
          {previewUrl && !uploading && (
            <button
              type="button"
              onClick={handleRemovePhoto}
              className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="gap-2"
          >
            {previewUrl ? (
              <>
                <Camera className="w-4 h-4" />
                Changer la photo
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Ajouter une photo
              </>
            )}
          </Button>
          <p className="text-xs text-gray-500">
            JPG, PNG ou WebP. Max 5MB.
          </p>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}
