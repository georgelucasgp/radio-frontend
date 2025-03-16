"use client"

import { useState, useRef } from 'react'
import { Upload, Link, Loader2 } from 'lucide-react'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'

interface MusicUploaderProps {
  className?: string;
}

export function MusicUploader({ className }: MusicUploaderProps = {}) {
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsLoading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch(`/api/upload`, {
        method: 'POST',
        body: formData,
      })

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao fazer upload');
      }

      toast({
        title: 'Sucesso!',
        description: 'Música adicionada à playlist',
      })
      e.target.value = ''
    } catch (error) {
      console.error('Erro no upload:', error)
      toast({
        title: 'Erro!',
        description: error instanceof Error ? error.message : 'Falha ao adicionar música',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleYoutubeUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!youtubeUrl || isSubmitting) return

    setIsSubmitting(true)
    setIsLoading(true)
    try {
      const response = await fetch(`/api/youtube`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: youtubeUrl }),
      })

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao baixar do YouTube');
      }

      toast({
        title: 'Sucesso!',
        description: 'Música do YouTube adicionada à playlist',
      })
      setYoutubeUrl('')
    } catch (error) {
      console.error('Erro ao baixar do YouTube:', error)
      toast({
        title: 'Erro!',
        description: error instanceof Error ? error.message : 'Falha ao adicionar música do YouTube',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
      setIsSubmitting(false)
    }
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardContent className="p-4">
        <Tabs defaultValue="file">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="file">Arquivo</TabsTrigger>
            <TabsTrigger value="youtube">YouTube</TabsTrigger>
          </TabsList>
          
          <TabsContent value="file" className="mt-4">
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                className="hidden"
                disabled={isLoading}
              />
              <Button 
                className="w-full" 
                disabled={isLoading}
                onClick={() => fileInputRef.current?.click()}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Enviar arquivo
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="youtube" className="mt-4">
            <form onSubmit={handleYoutubeUpload} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="youtube-url">URL do YouTube</Label>
                <Input
                  id="youtube-url"
                  type="url"
                  placeholder="https://youtube.com/watch?v=..."
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <Button 
                type="submit" 
                className="w-full relative" 
                disabled={isLoading || !youtubeUrl || isSubmitting}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Baixando...
                  </>
                ) : (
                  <>
                    <Link className="h-4 w-4 mr-2" />
                    Adicionar do YouTube
                  </>
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}