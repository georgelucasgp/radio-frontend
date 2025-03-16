"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Upload } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

export function UploadButton() {
  const [isUploading, setIsUploading] = useState(false)
  const { toast } = useToast()

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch(`/api/upload`, {
        method: 'POST',
        body: formData,
      })

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao fazer upload')
      }

      toast({
        title: 'Sucesso!',
        description: 'Música adicionada à playlist',
      })
    } catch (error) {
      console.error('Erro no upload:', error)
      toast({
        title: 'Erro!',
        description: 'Falha ao adicionar música',
        variant: 'destructive',
      })
    } finally {
      setIsUploading(false)
      event.target.value = ''
    }
  }

  return (
    <Button
      variant="outline"
      size="icon"
      className="relative"
      disabled={isUploading}
    >
      <input
        type="file"
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        accept="audio/*"
        onChange={handleUpload}
        disabled={isUploading}
      />
      {isUploading ? (
        <div className="animate-spin h-4 w-4 border-2 border-primary rounded-full border-t-transparent" />
      ) : (
        <Upload className="h-4 w-4" />
      )}
    </Button>
  )
} 