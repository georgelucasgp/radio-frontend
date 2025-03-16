"use client"

import { useState, useEffect, useRef } from 'react'
import { Play, Pause, Volume2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'

type QueueItem = {
  id: number;
  filename: string;
  filepath: string;
  metadata: {
    title: string;
    duration: number;
  };
  status: 'waiting' | 'playing' | 'finished';
  addedAt: Date;
}

export function Player() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(1)
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [currentTrack, setCurrentTrack] = useState<QueueItem | null>(null)
  const { toast } = useToast()

  // Atualiza informações da música atual
  useEffect(() => {
    // Atualiza a cada 5 segundos
    const interval = setInterval(fetchNowPlaying, 5000);
    
    // Busca imediatamente ao montar o componente
    fetchNowPlaying();
    
    return () => clearInterval(interval);
  }, [toast]);

  // Inicializa o player com o stream
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.src = `${process.env.NEXT_PUBLIC_STREAM_URL}/radio.mp3`;
      audioRef.current.volume = volume;
      
      // Se já estava tocando, continua tocando
      if (isPlaying) {
        audioRef.current.play().catch(console.error);
      }
    }
  }, []); // Remove a dependência do volume

  const togglePlay = async () => {
    setIsLoading(true);
    try {
      if (audioRef.current) {
        if (isPlaying) {
          audioRef.current.pause();
        } else {
          await audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
      }
    } catch (error) {
      console.error('Erro ao tocar stream:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível reproduzir o áudio',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0] / 100;
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const fetchNowPlaying = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/now-playing`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      })

      if (!response.ok) {
        throw new Error('Falha ao obter informações da música atual')
      }

      const data = await response.json()
      setCurrentTrack(data.track)
    } catch (error) {
      console.error('Erro ao buscar música atual:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-lg bg-primary/20 flex items-center justify-center text-4xl font-bold text-primary">
            ♪
          </div>
          
          <div className="flex-1">
            <h2 className="text-2xl font-bold">
              {currentTrack ? currentTrack.metadata.title : 'Nenhuma música tocando'}
            </h2>
            {currentTrack && (
              <p className="text-muted-foreground">
                Rádio ao vivo
              </p>
            )}
            
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-4">
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={togglePlay}
                  disabled={isLoading}
                  className={`${isLoading ? 'opacity-50' : ''}`}
                >
                  {isLoading ? (
                    <div className="animate-spin h-5 w-5 border-2 border-primary rounded-full border-t-transparent" />
                  ) : isPlaying ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>
                <div className="flex items-center gap-2 ml-4">
                  <Volume2 className="h-4 w-4" />
                  <Slider
                    value={[volume * 100]}
                    max={100}
                    step={1}
                    className="w-24"
                    onValueChange={handleVolumeChange}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <audio
          ref={audioRef}
          preload="none"
          onError={(e) => {
            console.error('Erro no áudio:', e);
            setIsPlaying(false);
            setIsLoading(false);
            toast({
              title: 'Erro',
              description: 'Erro ao reproduzir o áudio',
              variant: 'destructive',
            });
          }}
        />
      </CardContent>
    </Card>
  )
}