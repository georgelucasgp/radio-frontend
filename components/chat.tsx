"use client"

import { useRef, useEffect, useState, useCallback, useMemo, memo } from 'react'
import { Send, AlertCircle, Wifi, WifiOff, User, RefreshCw, ArrowDown, Check, AlertTriangle } from 'lucide-react'
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useChat } from '@/hooks/use-chat'
import { ChatMessage } from '@/lib/chat-service'
import { cn } from '@/lib/utils'

// Cores para avatares de usuários
const AVATAR_COLORS = [
  'bg-red-500',
  'bg-blue-500',
  'bg-green-500',
  'bg-yellow-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-indigo-500',
  'bg-orange-500',
  'bg-teal-500',
  'bg-cyan-500',
];

// Chaves para localStorage
const USER_NAME_KEY = 'radio-chat-username';
const USER_COLOR_KEY = 'radio-chat-usercolor';

// Interfaces para os componentes memoizados
interface ChatMessageItemProps {
  message: ChatMessage;
  userName: string;
  userColor: string;
  isCurrentUser: boolean;
  isLastMessage: boolean;
  isSameUserAsPrev: boolean;
  isSameUserAsNext: boolean;
  showUserInfo: boolean;
  isConnected: boolean;
  isLastUserMessage: boolean;
  timeString: string;
}

interface ConnectionStatusProps {
  isConnected: boolean | null;
  reconnect: () => void;
}

// Componente memoizado para mensagem individual
const ChatMessageItem = memo(({ 
  message,
  userName,
  userColor,
  isCurrentUser,
  isLastMessage,
  isSameUserAsPrev,
  isSameUserAsNext,
  showUserInfo,
  isConnected,
  isLastUserMessage,
  timeString
}: ChatMessageItemProps) => {
  return (
    <div 
      className={cn(
        "flex items-start transition-all",
        isCurrentUser ? "flex-row-reverse" : "",
        isLastMessage ? "animate-fadeIn" : "",
        isSameUserAsPrev ? "mt-0" : "mt-0.5",
        isCurrentUser && isSameUserAsPrev ? "pr-4" : "",
        !isCurrentUser && isSameUserAsPrev ? "pl-4" : ""
      )}
    >
      {showUserInfo && (
        <Avatar className="h-4 w-4 mt-0.5 flex-shrink-0">
          {message.user?.avatar ? (
            <AvatarImage src={message.user.avatar} />
          ) : null}
          <AvatarFallback className={isCurrentUser ? userColor : ''}>
            {message.user?.name?.[0]?.toUpperCase() || '?'}
          </AvatarFallback>
        </Avatar>
      )}
      
      <div className={cn(
        "max-w-[90%]",
        showUserInfo ? (isCurrentUser ? "mr-1" : "ml-1") : ""
      )}>
        {showUserInfo && (
          <div className={`flex items-center gap-0.5 mb-0.5 ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
            <span className="font-semibold text-[11px] leading-tight">{message.user?.name || 'Usuário'}</span>
          </div>
        )}
        
        <div 
          className={cn(
            "py-1 px-2 shadow-sm relative text-[12px]",
            isCurrentUser 
              ? "bg-primary text-primary-foreground" 
              : "bg-muted",
            showUserInfo 
              ? isCurrentUser 
                ? "rounded rounded-tr-none" 
                : "rounded rounded-tl-none"
              : isSameUserAsNext
                ? isCurrentUser
                  ? "rounded rounded-tr-none rounded-br-none"
                  : "rounded rounded-tl-none rounded-bl-none"
                : isCurrentUser
                  ? "rounded rounded-tr-none"
                  : "rounded rounded-tl-none",
            isLastMessage && "animate-slideIn"
          )}
        >
          <p className="break-words leading-tight">{message.content}</p>
          
          {isCurrentUser && isLastUserMessage && (
            <div className="absolute -bottom-0.5 -right-0.5 flex items-center justify-end">
              <Check className={cn(
                "h-2 w-2 opacity-70",
                Boolean(isConnected) ? "text-green-400" : "text-gray-400"
              )} />
            </div>
          )}
        </div>
        
        {timeString && (
          <div className={`flex justify-${isCurrentUser ? 'end' : 'start'} mt-0.5`}>
            <span className="text-[9px] text-muted-foreground">
              {timeString}
            </span>
          </div>
        )}
      </div>
    </div>
  );
});
ChatMessageItem.displayName = 'ChatMessageItem';

// Componente memoizado para o status da conexão
const ConnectionStatus = memo(({ isConnected, reconnect }: ConnectionStatusProps) => (
  <div className="flex items-center gap-1">
    {Boolean(isConnected) ? (
      <Wifi className="h-3 w-3 text-green-500" />
    ) : (
      <>
        <WifiOff className="h-3 w-3 text-red-500" />
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-5 w-5 rounded-full" 
          onClick={reconnect}
          title="Tentar reconectar"
        >
          <RefreshCw className="h-2.5 w-2.5" />
        </Button>
      </>
    )}
    <span className="text-[10px] text-muted-foreground">
      {Boolean(isConnected) ? 'Conectado' : 'Desconectado'}
    </span>
  </div>
));
ConnectionStatus.displayName = 'ConnectionStatus';

export function Chat() {
  const { messages, isConnected, isLoading, error, sendMessage, reconnect } = useChat();
  const [newMessage, setNewMessage] = useState('');
  const [userName, setUserName] = useState('');
  const [showUserNameInput, setShowUserNameInput] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [newMessageCount, setNewMessageCount] = useState(0);
  const [userColor, setUserColor] = useState('');
  const [nameError, setNameError] = useState('');
  
  const inputRef = useRef<HTMLInputElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesCountRef = useRef(messages.length);
  const scrollCheckTimeout = useRef<number | null>(null);

  // Inicializa o nome do usuário e cor do localStorage
  useEffect(() => {
    const savedUserName = localStorage.getItem(USER_NAME_KEY);
    
    let savedUserColor = localStorage.getItem(USER_COLOR_KEY);
    if (!savedUserColor) {
      savedUserColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
      localStorage.setItem(USER_COLOR_KEY, savedUserColor);
    }
    
    setUserColor(savedUserColor);
    
    if (savedUserName) {
      setUserName(savedUserName);
    }
  }, []);

  // Verifica se o nome já está em uso quando as mensagens são carregadas
  useEffect(() => {
    if (messages.length > 0 && userName && showUserNameInput) {
      const isNameTaken = checkIfNameIsTaken(userName);
      
      if (!isNameTaken) {
        if (localStorage.getItem(USER_NAME_KEY) === userName) {
          setShowUserNameInput(false);
        }
      }
    }
  }, [messages, userName, showUserNameInput]);

  // Verifica se o nome já está em uso
  const checkIfNameIsTaken = useCallback((name: string): boolean => {
    if (!name.trim()) return false;
    
    // Obtém os nomes de usuários únicos das mensagens recentes
    const activeUserNames = new Set<string>();
    
    messages.forEach(message => {
      if (message.user?.name && message.user.name.trim()) {
        activeUserNames.add(message.user.name.trim().toLowerCase());
      }
    });
    
    // Verifica se o nome já está em uso (ignorando maiúsculas/minúsculas)
    return activeUserNames.has(name.trim().toLowerCase());
  }, [messages]);

  // Filtra mensagens duplicadas - memoizado para melhor performance
  const filteredMessages = useMemo(() => {
    return messages.reduce<ChatMessage[]>((acc, current) => {
      const exists = acc.some(item => item.id === current.id);
      if (!exists) {
        return [...acc, current];
      }
      return acc;
    }, []);
  }, [messages]);

  const scrollToBottom = useCallback(() => {
    if (!scrollAreaRef.current) return;
    
    const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
    if (!scrollContainer) return;
    
    try {
      scrollContainer.scrollTo({
        top: scrollContainer.scrollHeight,
        behavior: 'smooth'
      });
    } catch (error) {
      // Fallback para scrollTop direto
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
    
    setShowScrollButton(false);
    setNewMessageCount(0);
  }, []);

  const handleSendMessage = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !userName.trim()) return;

    sendMessage(newMessage, userName);
    setNewMessage('');
    
    if (messageInputRef.current) {
      messageInputRef.current.focus();
    }
    
    requestAnimationFrame(scrollToBottom);
  }, [newMessage, userName, sendMessage, scrollToBottom]);

  const handleSetUserName = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim()) return;
    
    const isNameTaken = checkIfNameIsTaken(userName);
    
    if (isNameTaken) {
      setNameError('Este nome já está sendo usado por outro usuário. Por favor, escolha outro nome.');
      return;
    }
    
    setNameError('');
    localStorage.setItem(USER_NAME_KEY, userName);
    setShowUserNameInput(false);
    
    requestAnimationFrame(() => {
      if (messageInputRef.current) {
        messageInputRef.current.focus();
      }
      scrollToBottom();
    });
  }, [userName, scrollToBottom, checkIfNameIsTaken]);

  // Formata a data para exibição
  const formatMessageTime = useCallback((timestamp: Date | string) => {
    try {
      const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleTimeString();
    } catch (error) {
      return '';
    }
  }, []);

  // Verifica se o usuário está no final do chat
  const checkScroll = useCallback(() => {
    if (!scrollAreaRef.current) return;
    
    const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
    if (!scrollContainer) return;
    
    const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    
    setShowScrollButton(!isAtBottom);
    
    if (isAtBottom) {
      setNewMessageCount(0);
    }
  }, []);

  // Rola para o final quando o componente é montado
  useEffect(() => {
    scrollToBottom();
  }, [scrollToBottom]);

  // Rola para o final quando novas mensagens chegam
  useEffect(() => {
    if (!scrollAreaRef.current) return;
    
    const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
    if (!scrollContainer) return;
    
    const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;
    
    if (isNearBottom) {
      requestAnimationFrame(scrollToBottom);
    } else {
      setShowScrollButton(true);
      
      if (messages.length > messagesCountRef.current) {
        const newMessages = messages.length - messagesCountRef.current;
        setNewMessageCount(prev => prev + newMessages);
      }
    }
    
    messagesCountRef.current = messages.length;
  }, [messages, scrollToBottom]);

  // Rola para o final quando mensagens antigas são carregadas
  useEffect(() => {
    const handleMessagesLoaded = () => scrollToBottom();
    document.addEventListener('chat:messages-loaded', handleMessagesLoaded);
    return () => document.removeEventListener('chat:messages-loaded', handleMessagesLoaded);
  }, [scrollToBottom]);

  // Adiciona listener de scroll
  useEffect(() => {
    const scrollContainer = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (!scrollContainer) return;
    
    const debouncedCheckScroll = () => {
      if (scrollCheckTimeout.current) return;
      
      scrollCheckTimeout.current = window.setTimeout(() => {
        checkScroll();
        scrollCheckTimeout.current = null;
      }, 100);
    };
    
    scrollContainer.addEventListener('scroll', debouncedCheckScroll);
    return () => scrollContainer.removeEventListener('scroll', debouncedCheckScroll);
  }, [checkScroll]);

  // Limpar timeouts na desmontagem
  useEffect(() => {
    return () => {
      if (scrollCheckTimeout.current) {
        clearTimeout(scrollCheckTimeout.current);
      }
    };
  }, []);

  // Renderizar mensagens apenas quando necessário
  const renderMessages = useMemo(() => {
    return filteredMessages.map((message, index) => {
      const timeString = formatMessageTime(message.timestamp);
      const isCurrentUser = message.user?.name === userName;
      const isLastMessage = index === filteredMessages.length - 1;
      const isLastUserMessage = isCurrentUser && 
        filteredMessages.slice(index + 1).findIndex(m => m.user?.name === userName) === -1;
      
      const prevMessage = index > 0 ? filteredMessages[index - 1] : null;
      const isSameUserAsPrev = prevMessage && prevMessage.user?.name === message.user?.name;
      
      const nextMessage = index < filteredMessages.length - 1 ? filteredMessages[index + 1] : null;
      const isSameUserAsNext = nextMessage && nextMessage.user?.name === message.user?.name;
      
      const showUserInfo = !isSameUserAsPrev;
      
      return (
        <ChatMessageItem
          key={message.id}
          message={message}
          userName={userName}
          userColor={userColor}
          isCurrentUser={isCurrentUser}
          isLastMessage={isLastMessage}
          isSameUserAsPrev={Boolean(isSameUserAsPrev)}
          isSameUserAsNext={Boolean(isSameUserAsNext)}
          showUserInfo={showUserInfo}
          isConnected={isConnected}
          isLastUserMessage={isLastUserMessage}
          timeString={timeString}
        />
      );
    });
  }, [filteredMessages, formatMessageTime, userName, userColor, isConnected]);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="border-b flex flex-row items-center justify-between py-1 px-2">
        <h3 className="text-sm font-semibold">Chat</h3>
        <ConnectionStatus isConnected={isConnected} reconnect={reconnect} />
      </CardHeader>

      <CardContent className="flex-1 p-0 relative overflow-hidden">
        {showUserNameInput && (
          <div className="absolute inset-0 bg-background/95 backdrop-blur-sm z-10 flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
              <CardHeader>
                <h3 className="text-lg font-semibold">Qual é o seu nome?</h3>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSetUserName} className="space-y-4">
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      ref={inputRef}
                      placeholder="Digite seu nome..."
                      value={userName}
                      onChange={(e) => {
                        setUserName(e.target.value);
                        setNameError('');
                      }}
                      className={cn("pl-10", nameError && "border-red-500")}
                      autoFocus
                    />
                  </div>
                  
                  {nameError && (
                    <Alert variant="destructive" className="py-2">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="text-xs ml-2">{nameError}</AlertDescription>
                    </Alert>
                  )}
                  
                  <Button type="submit" className="w-full" disabled={!userName.trim()}>
                    Entrar no Chat
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        <ScrollArea className="h-full min-h-[400px] p-2" ref={scrollAreaRef}>
          {error && (
            <Alert variant="destructive" className="mb-2 p-1.5 text-xs">
              <AlertCircle className="h-3 w-3" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {filteredMessages.length === 0 && (
            <div className="flex h-full items-center justify-center">
              <p className="text-xs text-muted-foreground">
                Nenhuma mensagem ainda. Seja o primeiro a enviar!
              </p>
            </div>
          )}
          
          <div className="space-y-1">
            {renderMessages}
          </div>
        </ScrollArea>
        
        {showScrollButton && (
          <div className="absolute bottom-1 right-1 flex flex-col items-center">
            <Button
              variant="outline"
              size="icon"
              className="h-5 w-5 rounded-full shadow-md bg-primary/90 text-primary-foreground hover:bg-primary/100 border-none animate-bounce"
              onClick={scrollToBottom}
              title="Novas mensagens"
            >
              <ArrowDown className="h-2.5 w-2.5" />
            </Button>
            {newMessageCount > 0 && (
              <span className="bg-destructive text-destructive-foreground text-[8px] rounded-full px-1 py-0 min-w-4 text-center mt-0.5">
                {newMessageCount > 99 ? '99+' : newMessageCount}
              </span>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="border-t p-1 mt-auto">
        <form onSubmit={handleSendMessage} className="flex w-full items-center gap-1">
          <div className="relative flex-1">
            {isLoading && (
              <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                <div className="animate-bounce h-1 w-1 bg-primary rounded-full"></div>
                <div className="animate-bounce h-1 w-1 bg-primary rounded-full delay-75"></div>
                <div className="animate-bounce h-1 w-1 bg-primary rounded-full delay-150"></div>
              </div>
            )}
            <Input
              ref={messageInputRef}
              placeholder="Envie sua mensagem..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className={`w-full text-xs h-8 ${isLoading ? 'pl-12' : ''}`}
              disabled={isLoading || !isConnected || showUserNameInput}
            />
          </div>
          <Button
            type="submit"
            size="icon"
            className="h-8 w-8 shrink-0"
            disabled={isLoading || !isConnected || !newMessage.trim() || showUserNameInput}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}