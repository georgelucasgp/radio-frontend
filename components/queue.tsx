"use client"

import { useEffect, useState, useCallback, memo, useMemo, useRef } from 'react'
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

interface QueueItemProps {
  item: QueueItem;
  index: number;
  formatDuration: (duration: number) => string;
}

interface CurrentTrackProps {
  track: QueueItem;
  formatDuration: (duration: number) => string;
}

const QueueItem = memo(({ item, index, formatDuration }: QueueItemProps) => (
  <div
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
));

QueueItem.displayName = 'QueueItem';

const CurrentTrack = memo(({ track, formatDuration }: CurrentTrackProps) => (
  <div className="p-4 border-b bg-muted/30">
    <div className="text-sm font-medium text-muted-foreground mb-2">
      Tocando agora
    </div>
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 rounded bg-primary/20 flex items-center justify-center">
        <Music className="h-6 w-6 text-primary" />
      </div>
      <div className="flex-1 min-w-0 flex items-center justify-between">
        <h4 className="font-medium truncate">{track.metadata.title}</h4>
        <div className="flex items-center gap-2 text-sm text-primary ml-4">
          <Clock className="h-3 w-3" />
          <span>{formatDuration(track.metadata.duration)}</span>
        </div>
      </div>
    </div>
  </div>
));

CurrentTrack.displayName = 'CurrentTrack';

const EmptyQueue = memo(() => (
  <div className="p-4 text-center text-muted-foreground">
    Nenhuma música na fila
  </div>
));

EmptyQueue.displayName = 'EmptyQueue';

const LoadingIndicator = memo(() => (
  <div className="p-4 text-center">
    <div className="animate-spin h-5 w-5 border-2 border-primary rounded-full border-t-transparent mx-auto" />
  </div>
));

LoadingIndicator.displayName = 'LoadingIndicator';

export function Queue() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [currentTrack, setCurrentTrack] = useState<QueueItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  const intervalRef = useRef<number | null>(null);

  const fetchQueue = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/queue`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      })

      if (!response.ok) {
        throw new Error('Falha ao obter a fila de reprodução')
      }

      const data: QueueResponse = await response.json()
      setQueue(data.queue)
      setCurrentTrack(data.current)
    } catch (error) {
      console.error('Erro ao buscar fila:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar a fila de reprodução',
        variant: 'destructive',
      })
      setQueue([])
      setCurrentTrack(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchQueue();
    
    intervalRef.current = window.setInterval(fetchQueue, 5000);
    
    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [fetchQueue]);

  const formatDuration = useCallback((duration: number) => {
    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  const queueItems = useMemo(() => {
    return queue.map((item, index) => (
      <QueueItem 
        key={item.id} 
        item={item} 
        index={index} 
        formatDuration={formatDuration} 
      />
    ));
  }, [queue, formatDuration]);

  const renderContent = useMemo(() => {
    if (isLoading) {
      return <LoadingIndicator />;
    }
    
    return (
      <>
        {currentTrack && <CurrentTrack track={currentTrack} formatDuration={formatDuration} />}
        
        {queue.length > 0 ? (
          <>
            <div className="text-sm font-medium text-muted-foreground p-4 border-b">
              Próximas músicas ({queue.length})
            </div>
            {queueItems}
          </>
        ) : !currentTrack ? (
          <EmptyQueue />
        ) : null}
      </>
    );
  }, [isLoading, currentTrack, queue, queueItems, formatDuration]);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center gap-2 border-b flex-shrink-0">
        <List className="h-5 w-5" />
        <div className="text-lg font-semibold">Fila de Reprodução</div>
      </CardHeader>
      
      <CardContent className="p-0 flex-1">
        <ScrollArea className="h-full">
          {renderContent}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}