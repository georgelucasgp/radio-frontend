import { useState, useEffect, useCallback, useRef } from 'react';
import { chatService, ChatMessage } from '@/lib/chat-service';

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const messageCache = useRef<Set<string>>(new Set());
  const isConnectedRef = useRef(false);
  const connectionCheckIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    const handleMessage = (message: ChatMessage) => {
      if (!message.content || message.content.trim() === '') return;
      
      const messageId = message.id || `local_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
      if (messageCache.current.has(messageId)) return;
      messageCache.current.add(messageId);
      
      const validatedMessage = {
        ...message,
        id: messageId,
        user: message.user || { name: 'Usuário' },
        content: message.content.trim(),
        timestamp: message.timestamp instanceof Date ? 
          message.timestamp : 
          (typeof message.timestamp === 'string' ? new Date(message.timestamp) : new Date())
      };
      
      setMessages(prev => [...prev, validatedMessage]);
      
      if (messageCache.current.size > 200) {
        const iterator = messageCache.current.values();
        const firstValue = iterator.next().value;
        if (firstValue) {
          messageCache.current.delete(firstValue);
        }
      }
    };

    const handleRecentMessages = (recentMessages: ChatMessage[]) => {
      messageCache.current.clear();
      
      const validMessages = recentMessages
        .filter(msg => msg.content && msg.content.trim() !== '')
        .map(msg => {
          const id = msg.id || `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
          messageCache.current.add(id);
          
          return {
            ...msg,
            id,
            content: msg.content.trim(),
            timestamp: msg.timestamp instanceof Date ? 
              msg.timestamp : 
              (typeof msg.timestamp === 'string' ? new Date(msg.timestamp) : new Date()),
            user: msg.user || { name: 'Usuário' }
          };
        });
      
      if (validMessages.length > 0) {
        setMessages(validMessages);
        
        requestAnimationFrame(() => {
          document.dispatchEvent(new CustomEvent('chat:messages-loaded'));
        });
      } else {
        setMessages([]);
      }
    };

    const handleEvent = (event: string, data?: any) => {
      switch (event) {
        case 'connect':
          setIsConnected(true);
          isConnectedRef.current = true;
          setError(null);
          break;
        case 'disconnect':
          setIsConnected(false);
          isConnectedRef.current = false;
          break;
        case 'error':
          setError(typeof data === 'string' ? data : 'Erro de conexão com o chat');
          setIsConnected(false);
          isConnectedRef.current = false;
          break;
      }
    };

    chatService.on('message', handleMessage);
    chatService.on('recent-messages', handleRecentMessages);
    chatService.on('event', handleEvent);

    const initialConnectedState = chatService.isConnected();
    setIsConnected(initialConnectedState);
    isConnectedRef.current = initialConnectedState;

    connectionCheckIntervalRef.current = window.setInterval(() => {
      const connected = chatService.isConnected();
      
      if (isConnectedRef.current !== connected) {
        isConnectedRef.current = connected;
        setIsConnected(connected);
        
        if (connected && error) {
          setError(null);
        }
      }
    }, 3000);

    return () => {
      chatService.off('message', handleMessage);
      chatService.off('recent-messages', handleRecentMessages);
      chatService.off('event', handleEvent);
      
      if (connectionCheckIntervalRef.current !== null) {
        clearInterval(connectionCheckIntervalRef.current);
        connectionCheckIntervalRef.current = null;
      }
    };
  }, [error]);

  const sendMessage = useCallback(async (content: string, userName: string = 'Usuário', avatar?: string) => {
    if (!content.trim() || !userName.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      await chatService.sendMessage(content.trim(), userName.trim(), avatar);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar mensagem');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    messageCache.current.clear();
  }, []);

  const reconnect = useCallback(() => {
    chatService.reconnect();
  }, []);

  return {
    messages,
    isConnected,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    reconnect,
  };
} 