import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface WhatsAppMessage {
  id: string;
  from: string;
  body: string;
  timestamp: number;
  type: string;
  isFromMe?: boolean;
  chat?: {
    id: string;
    name: string;
  };
}

interface WhatsAppChat {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: number;
  unreadCount: number;
}

interface UseWhatsAppReturn {
  isConnected: boolean;
  qrCode: string | null;
  chats: WhatsAppChat[];
  messages: WhatsAppMessage[];
  loading: boolean;
  error: string | null;
  connect: () => void;
  disconnect: () => void;
  sendMessage: (chatId: string, message: string) => void;
  getChats: () => void;
  getMessages: (chatId: string) => void;
  reconnect: () => void;
}

export const useWhatsApp = (): UseWhatsAppReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [chats, setChats] = useState<WhatsAppChat[]>([]);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const socketRef = useRef<Socket | null>(null);

  const connect = () => {
    if (socketRef.current?.connected) return;

    setLoading(true);
    setError(null);

    socketRef.current = io('http://localhost:3001');

    socketRef.current.on('connect', () => {
      console.log('Conectado ao servidor WhatsApp');
      setLoading(false);
    });

    socketRef.current.on('disconnect', () => {
      console.log('Desconectado do servidor WhatsApp');
      setIsConnected(false);
      setLoading(false);
    });

    socketRef.current.on('status', (status: { isConnected: boolean; qrCodeData: string | null }) => {
      setIsConnected(status.isConnected);
      setQrCode(status.qrCodeData);
    });

    socketRef.current.on('qr-code', (qrCodeData: string) => {
      console.log('QR Code recebido');
      setQrCode(qrCodeData);
      setIsConnected(false);
    });

    socketRef.current.on('connected', (connected: boolean) => {
      console.log('WhatsApp conectado:', connected);
      setIsConnected(connected);
      if (connected) {
        setQrCode(null);
        setError(null);
      }
    });

    socketRef.current.on('chats', (chatsData: WhatsAppChat[]) => {
      console.log('Conversas recebidas:', chatsData);
      setChats(chatsData);
    });

    socketRef.current.on('messages', (messagesData: WhatsAppMessage[]) => {
      console.log('Mensagens recebidas:', messagesData);
      setMessages(messagesData);
    });

    socketRef.current.on('new-message', (message: WhatsAppMessage) => {
      console.log('Nova mensagem recebida:', message);
      setMessages(prev => [...prev, message]);
    });

    socketRef.current.on('message-sent', (message: WhatsAppMessage) => {
      console.log('Mensagem enviada:', message);
      setMessages(prev => [...prev, message]);
    });

    socketRef.current.on('error', (errorMessage: string) => {
      console.error('Erro do servidor WhatsApp:', errorMessage);
      setError(errorMessage);
      setLoading(false);
    });
  };

  const disconnect = () => {
    if (socketRef.current) {
      socketRef.current.emit('disconnect-whatsapp');
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setIsConnected(false);
    setQrCode(null);
    setChats([]);
    setMessages([]);
    setError(null);
  };

  const sendMessage = (chatId: string, message: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('send-message', { chatId, message });
    } else {
      setError('WhatsApp não está conectado');
    }
  };

  const getChats = () => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('get-chats');
    } else {
      setError('WhatsApp não está conectado');
    }
  };

  const getMessages = (chatId: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('get-messages', { chatId });
    } else {
      setError('WhatsApp não está conectado');
    }
  };

  const reconnect = () => {
    if (socketRef.current) {
      socketRef.current.emit('reconnect-whatsapp');
    }
  };

  useEffect(() => {
    // Conectar automaticamente quando o hook for montado
    connect();

    // Cleanup quando o componente for desmontado
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  return {
    isConnected,
    qrCode,
    chats,
    messages,
    loading,
    error,
    connect,
    disconnect,
    sendMessage,
    getChats,
    getMessages,
    reconnect
  };
}; 