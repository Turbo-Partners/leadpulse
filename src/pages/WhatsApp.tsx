import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Search, Filter, Plus, Smile, Paperclip, Send, MoreVertical, Phone, Video, RefreshCw } from 'lucide-react';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';
import Card from '../components/ui/Card';

interface Chat {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  unread: number;
  status: 'online' | 'offline';
  avatar?: string;
}

interface Message {
  id: string;
  content: string;
  timestamp: string;
  sender: 'user' | 'contact';
  status: 'sent' | 'delivered' | 'read';
  type: 'text' | 'image' | 'file';
  file?: {
    url: string;
    name: string;
    size: string;
  };
}

const WhatsApp = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [qrCode, setQrCode] = useState('dummy-qr-code-data');
  const [connecting, setConnecting] = useState(false);

  const mockChats: Chat[] = [
    {
      id: '1',
      name: 'Guilherme Cassemiro',
      lastMessage: 'Podemos começar a reunião de 15hrs',
      time: '14:50',
      unread: 3,
      status: 'online',
      avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg'
    },
    {
      id: '2',
      name: 'Daniel Teixeira',
      lastMessage: 'Fica a vontade',
      time: '14:45',
      unread: 0,
      status: 'offline',
      avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg'
    }
  ];

  const mockMessages: Message[] = [
    {
      id: '1',
      content: 'eu acabei me liberando antes aqui',
      timestamp: '14:50',
      sender: 'contact',
      status: 'read',
      type: 'text'
    },
    {
      id: '2',
      content: 'se puder fazer agora',
      timestamp: '14:50',
      sender: 'contact',
      status: 'read',
      type: 'text'
    },
    {
      id: '3',
      content: 'podemos começar',
      timestamp: '14:50',
      sender: 'contact',
      status: 'read',
      type: 'text'
    },
    {
      id: '4',
      content: 'reunião de 15hrs',
      timestamp: '14:50',
      sender: 'contact',
      status: 'read',
      type: 'text'
    },
    {
      id: '5',
      content: 'beleza',
      timestamp: '14:51',
      sender: 'user',
      status: 'read',
      type: 'text'
    },
    {
      id: '6',
      content: 'vou entrar 15h mesmo',
      timestamp: '14:51',
      sender: 'user',
      status: 'delivered',
      type: 'text'
    }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [mockMessages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    // Here you would typically send the message to your backend
    console.log('Sending message:', message);
    setMessage('');
  };

  const handleConnect = () => {
    setConnecting(true);
    // Simulate connection process
    setTimeout(() => {
      setConnecting(false);
      setIsConnected(true);
    }, 2000);
  };

  if (!isConnected) {
    return (
      <div className="h-[calc(100vh-8rem)] flex items-center justify-center">
        <Card className="p-8 max-w-md w-full text-center">
          <h2 className="text-2xl font-bold mb-6">Conectar WhatsApp</h2>
          <div className="mb-6">
            <p className="text-gray-600 mb-4">
              Para usar o WhatsApp no LeadPulse, siga os passos:
            </p>
            <ol className="text-left text-sm text-gray-600 space-y-2">
              <li>1. Abra o WhatsApp no seu celular</li>
              <li>2. Toque em Menu ou Configurações e selecione WhatsApp Web</li>
              <li>3. Aponte seu celular para esta tela para capturar o código QR</li>
            </ol>
          </div>
          
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-white rounded-lg shadow-inner">
              <QRCodeSVG value={qrCode} size={256} />
            </div>
          </div>

          <Button
            onClick={handleConnect}
            isLoading={connecting}
            leftIcon={<RefreshCw size={16} />}
            fullWidth
          >
            {connecting ? 'Conectando...' : 'Recarregar QR Code'}
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex rounded-lg overflow-hidden bg-white shadow-lg">
      {/* Chat List */}
      <div className="w-80 border-r flex flex-col">
        <div className="p-4 border-b bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Avatar 
                src="https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg"
                size="md"
              />
              <div className="ml-3">
                <p className="text-sm font-medium">Seu WhatsApp</p>
                <p className="text-xs text-green-600">Conectado</p>
              </div>
            </div>
            <button 
              onClick={() => setIsConnected(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <MoreVertical size={20} />
            </button>
          </div>
          <Input
            placeholder="Buscar ou começar nova conversa"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search size={16} className="text-gray-400" />}
            fullWidth
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          {mockChats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => setSelectedChat(chat)}
              className={`w-full p-4 flex items-center space-x-3 hover:bg-gray-50 ${
                selectedChat?.id === chat.id ? 'bg-blue-50' : ''
              }`}
            >
              <Avatar src={chat.avatar} name={chat.name} size="md" />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {chat.name}
                  </p>
                  <span className="text-xs text-gray-500">{chat.time}</span>
                </div>
                <p className="text-sm text-gray-500 truncate">{chat.lastMessage}</p>
              </div>
              {chat.unread > 0 && (
                <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                  {chat.unread}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Window */}
      {selectedChat ? (
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="p-4 border-b flex items-center justify-between bg-gray-50">
            <div className="flex items-center space-x-3">
              <Avatar src={selectedChat.avatar} name={selectedChat.name} size="md" />
              <div>
                <h2 className="text-lg font-semibold">{selectedChat.name}</h2>
                <p className="text-sm text-gray-500">
                  {selectedChat.status === 'online' ? 'Online' : 'Offline'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button className="text-gray-500 hover:text-gray-700">
                <Video size={20} />
              </button>
              <button className="text-gray-500 hover:text-gray-700">
                <Phone size={20} />
              </button>
              <button className="text-gray-500 hover:text-gray-700">
                <Search size={20} />
              </button>
              <button className="text-gray-500 hover:text-gray-700">
                <MoreVertical size={20} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div 
            className="flex-1 overflow-y-auto p-4 space-y-4"
            style={{ 
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23f3f4f6' fill-opacity='0.4' fill-rule='evenodd'/%3E%3C/svg%3E")`,
              backgroundColor: '#ffffff'
            }}
          >
            {mockMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg px-4 py-2 ${
                    msg.sender === 'user'
                      ? 'bg-green-500 text-white'
                      : 'bg-white text-gray-900 shadow'
                  }`}
                >
                  <p className="text-sm">{msg.content}</p>
                  <div className="flex items-center justify-end space-x-1 mt-1">
                    <p className="text-xs opacity-70">
                      {msg.timestamp}
                    </p>
                    {msg.sender === 'user' && (
                      <span className="text-xs">
                        {msg.status === 'sent' && '✓'}
                        {msg.status === 'delivered' && '✓✓'}
                        {msg.status === 'read' && '✓✓'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <form onSubmit={handleSendMessage} className="p-4 border-t bg-gray-50">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-200"
              >
                <Smile size={20} />
              </button>
              <button
                type="button"
                className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-200"
              >
                <Paperclip size={20} />
              </button>
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Digite uma mensagem"
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
              />
              <Button 
                type="submit" 
                disabled={!message.trim()}
                className="bg-green-500 hover:bg-green-600 rounded-full w-10 h-10 flex items-center justify-center"
              >
                <Send size={20} />
              </Button>
            </div>
          </form>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="w-48 h-48 mx-auto mb-4 text-gray-300">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              WhatsApp Web
            </h3>
            <p className="text-gray-500">
              Selecione uma conversa para começar
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default WhatsApp;