import { io, Socket } from 'socket.io-client';

export type ChatMessage = {
  id: string;
  user: {
    name: string;
    avatar?: string;
  };
  content: string;
  timestamp: Date;
};

class ChatService {
  private socket: Socket | null = null;
  private listeners: Map<string, Function[]> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 2000; // 2 segundos
  private apiUrl: string = process.env.API_URL || 'http://localhost:3000';
  private messageCache: Set<string> = new Set(); // Cache para evitar duplicação de mensagens

  constructor() {
    // Não inicializar o socket durante o build da Vercel
    if (typeof window === 'undefined') {
      console.log('Ambiente de servidor detectado, não inicializando socket');
      return;
    }

    this.initialize();
    
    // Tenta reconectar a cada 5 segundos se estiver desconectado
    setInterval(() => {
      if (this.socket && !this.socket.connected && this.reconnectAttempts < this.maxReconnectAttempts) {
        console.log('Tentando reconectar automaticamente...');
        this.reconnect();
      }
    }, 5000);
  }

  private initialize() {
    if (this.socket) {
      // Se já existe um socket, desconecta antes de criar um novo
      this.socket.disconnect();
    }
    
    try {
      console.log(`Conectando ao servidor de chat em ${this.apiUrl}/chat`);
      
      this.socket = io(`${this.apiUrl}/chat`, {
        transports: ['websocket', 'polling'], // Tenta websocket primeiro, depois polling
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
        timeout: 10000, // Aumenta o timeout para 10 segundos
      });

      this.socket.on('connect', () => {
        console.log('Conectado ao servidor de chat');
        this.reconnectAttempts = 0; // Reseta as tentativas de reconexão
        this.emit('event', 'connect');
      });

      this.socket.on('disconnect', () => {
        console.log('Desconectado do servidor de chat');
        this.emit('event', 'disconnect');
      });

      this.socket.on('connect_error', (error) => {
        console.error('Erro de conexão:', error);
        this.reconnectAttempts++;
        
        if (this.reconnectAttempts > this.maxReconnectAttempts) {
          console.error('Número máximo de tentativas de reconexão atingido');
          this.emit('event', 'error', 'Não foi possível conectar ao servidor de chat após várias tentativas');
        }
      });

      this.socket.on('message', (rawMessage: any) => {
        // Ignora mensagens vazias
        if (!rawMessage || !rawMessage.content) {
          console.log('Mensagem vazia ignorada');
          return;
        }
        
        // Garante que a mensagem tenha um ID
        const message: ChatMessage = {
          ...rawMessage,
          id: rawMessage.id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          content: rawMessage.content || '',
          timestamp: new Date(),
          user: rawMessage.user || { name: 'Usuário' }
        };
        
        // Verifica se a mensagem já foi processada
        if (this.messageCache.has(message.id)) {
          console.log(`Mensagem duplicada ignorada: ${message.id}`);
          return;
        }
        
        // Adiciona ao cache
        this.messageCache.add(message.id);
        
        // Limita o tamanho do cache
        if (this.messageCache.size > 200) {
          const iterator = this.messageCache.values();
          const firstValue = iterator.next().value;
          if (firstValue) {
            this.messageCache.delete(firstValue);
          }
        }
        
        // Converte a string de timestamp para objeto Date
        if (typeof rawMessage.timestamp === 'string') {
          try {
            message.timestamp = new Date(rawMessage.timestamp);
          } catch (error) {
            console.error('Erro ao converter timestamp:', error);
            message.timestamp = new Date(); // Usa a data atual como fallback
          }
        } else if (rawMessage.timestamp instanceof Date) {
          message.timestamp = rawMessage.timestamp;
        }
        
        this.emit('message', message);
      });

      this.socket.on('recent-messages', (rawMessages: any[]) => {
        // Limpa o cache antes de processar mensagens recentes
        this.messageCache.clear();
        
        // Filtra mensagens vazias e converte as strings de timestamp para objetos Date
        const formattedMessages = rawMessages
          .filter(rawMsg => rawMsg && rawMsg.content) // Filtra mensagens vazias
          .map(rawMsg => {
            const msg: ChatMessage = {
              id: rawMsg.id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              content: rawMsg.content || '',
              timestamp: this.ensureValidDate(rawMsg.timestamp),
              user: rawMsg.user || { name: 'Usuário' }
            };
            
            // Adiciona ao cache para evitar duplicação
            this.messageCache.add(msg.id);
            
            return msg;
          });
        
        this.emit('recent-messages', formattedMessages);
      });

      this.socket.on('error', (error: any) => {
        console.error('Erro no socket:', error);
        this.emit('event', 'error', error);
      });
    } catch (error) {
      console.error('Erro ao inicializar o chat:', error);
      this.emit('event', 'error', 'Erro ao inicializar o chat');
    }
  }

  // Garante que o timestamp seja uma data válida
  private ensureValidDate(timestamp: any): Date {
    if (timestamp instanceof Date) {
      return isNaN(timestamp.getTime()) ? new Date() : timestamp;
    }
    
    if (typeof timestamp === 'string') {
      try {
        const date = new Date(timestamp);
        return isNaN(date.getTime()) ? new Date() : date;
      } catch (error) {
        console.error('Erro ao converter string para data:', error);
        return new Date();
      }
    }
    
    return new Date();
  }

  public sendMessage(content: string, userName: string = 'Usuário', avatar?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        console.warn('Socket não existe. Tentando inicializar...');
        this.initialize();
        
        // Espera um pouco para o socket se conectar antes de rejeitar
        setTimeout(() => {
          if (!this.socket || !this.socket.connected) {
            reject(new Error('Não foi possível enviar a mensagem. Socket não inicializado.'));
          } else {
            this.sendMessageToServer(content, userName, avatar, resolve, reject);
          }
        }, 1000);
        
        return;
      }

      if (!this.socket.connected) {
        console.warn('Socket não está conectado. Tentando reconectar...');
        this.reconnect();
        
        // Espera um pouco para o socket se reconectar antes de rejeitar
        setTimeout(() => {
          if (!this.socket || !this.socket.connected) {
            reject(new Error('Não foi possível enviar a mensagem. Socket desconectado.'));
          } else {
            this.sendMessageToServer(content, userName, avatar, resolve, reject);
          }
        }, 1000);
        
        return;
      }

      this.sendMessageToServer(content, userName, avatar, resolve, reject);
    });
  }

  private sendMessageToServer(
    content: string, 
    userName: string, 
    avatar: string | undefined,
    resolve: () => void,
    reject: (error: Error) => void
  ): void {
    if (!this.socket || !this.socket.connected) {
      reject(new Error('Socket não está conectado'));
      return;
    }

    const message = {
      user: {
        name: userName,
        avatar,
      },
      content,
    };

    // Adiciona um timeout para a resposta do servidor
    let responseReceived = false;
    const timeoutId = setTimeout(() => {
      if (!responseReceived) {
        console.warn('Timeout ao enviar mensagem, mas continuando...');
        resolve(); // Resolve mesmo sem resposta para melhorar a experiência do usuário
      }
    }, 3000);

    this.socket.emit('message', message, (response: { success: boolean; error?: string } | undefined) => {
      responseReceived = true;
      clearTimeout(timeoutId);
      
      if (response && response.success) {
        resolve();
      } else if (response) {
        reject(new Error(response.error || 'Erro ao enviar mensagem'));
      } else {
        // Se não receber resposta, assume que deu certo para melhorar a experiência
        console.warn('Sem resposta do servidor, mas continuando...');
        resolve();
      }
    });
  }

  public on(event: 'message' | 'event' | 'recent-messages', callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)?.push(callback);
  }

  public off(event: 'message' | 'event' | 'recent-messages', callback: Function): void {
    if (!this.listeners.has(event)) return;
    
    const callbacks = this.listeners.get(event) || [];
    const index = callbacks.indexOf(callback);
    
    if (index !== -1) {
      callbacks.splice(index, 1);
      this.listeners.set(event, callbacks);
    }
  }

  private emit(event: string, ...args: any[]): void {
    const callbacks = this.listeners.get(event) || [];
    callbacks.forEach(callback => {
      try {
        callback(...args);
      } catch (error) {
        console.error(`Erro ao executar callback para evento ${event}:`, error);
      }
    });
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Método para forçar uma reconexão
  public reconnect(): void {
    console.log('Forçando reconexão...');
    this.initialize();
  }

  // Método para verificar o status da conexão
  public isConnected(): boolean {
    return !!this.socket && this.socket.connected;
  }
}

// Singleton para garantir uma única instância do serviço
export const chatService = new ChatService(); 