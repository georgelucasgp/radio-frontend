"use client"

import { useEffect, useState } from 'react'
import { List, Music, Clock } from 'lucide-react'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/components/ui/use-toast'

type QueueItem = {
  id: number;
  filename: string;
  filepath: string;
  status: 'waiting' | 'playing' | 'finished';
  addedAt: Date;
  metadata: {
    title: string;
    duration: number;
  };
}

type QueueResponse = {
  current: QueueItem | null;
  queue: QueueItem[];
  total: number;
}

export function Queue() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [currentTrack, setCurrentTrack] = useState<QueueItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchQueue = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/radio/queue`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Erro ao buscar fila: ${response.status}`);
        }

        const data: QueueResponse = await response.json();
        setQueue(data.queue);
        setCurrentTrack(data.current);
      } catch (error) {
        console.error('Erro ao buscar fila:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar a fila',
          variant: 'destructive',
        });
        setQueue([]);
        setCurrentTrack(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQueue();
    const interval = setInterval(fetchQueue, 5000);
    return () => clearInterval(interval);
  }, [toast]);

  const formatDuration = (duration: number) => {
    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 border-b">
        <List className="h-5 w-5" />
        <div className="text-lg font-semibold">Fila de Reprodução</div>
      </CardHeader>
      
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="p-4 text-center">
              <div className="animate-spin h-5 w-5 border-2 border-primary rounded-full border-t-transparent mx-auto" />
            </div>
          ) : (
            <>
              {currentTrack && (
                <div className="p-4 border-b bg-muted/30">
                  <div className="text-sm font-medium text-muted-foreground mb-2">
                    Tocando agora
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded bg-primary/20 flex items-center justify-center">
                      <Music className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0 flex items-center justify-between">
                      <h4 className="font-medium truncate">{currentTrack.metadata.title}</h4>
                      <div className="flex items-center gap-2 text-sm text-primary ml-4">
                        <Clock className="h-3 w-3" />
                        <span>{formatDuration(currentTrack.metadata.duration)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {queue.length > 0 ? (
                <>
                  <div className="text-sm font-medium text-muted-foreground p-4 border-b">
                    Próximas músicas ({queue.length})
                  </div>
                  {queue.map((item, index) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors border-b"
                    >
                      <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0 flex items-center justify-between">
                        <h4 className="font-medium truncate">{item.metadata.title}</h4>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground ml-4">
                          <Clock className="h-3 w-3" />
                          <span>{formatDuration(item.metadata.duration)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              ) : !currentTrack ? (
                <div className="p-4 text-center text-muted-foreground">
                  Nenhuma música na fila
                </div>
              ) : null}
            </>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}