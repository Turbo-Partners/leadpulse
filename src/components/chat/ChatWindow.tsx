import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Send, Plus, Users } from 'lucide-react';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';
import { supabase } from '../../lib/supabase';

interface Message {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  user?: {
    name: string;
  };
}

interface ChatWindowProps {
  roomId: string;
}

const ChatWindow = ({ roomId }: ChatWindowProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [roomDetails, setRoomDetails] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!roomId) return;

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          id,
          content,
          user_id,
          created_at,
          user:users (
            name
          )
        `)
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Erro ao buscar mensagens:', error);
        return;
      }

      setMessages(data || []);
    };

    const fetchRoomDetails = async () => {
      const { data, error } = await supabase
        .from('chat_rooms')
        .select(`
          id,
          name,
          type,
          chat_participants (
            user:users (
              id,
              name
            )
          )
        `)
        .eq('id', roomId)
        .single();

      if (error) {
        console.error('Erro ao buscar detalhes da sala:', error);
        return;
      }

      setRoomDetails(data);
    };

    fetchMessages();
    fetchRoomDetails();

    // Inscrever para atualizações em tempo real
    const subscription = supabase
      .channel(`room:${roomId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'chat_messages',
        filter: `room_id=eq.${roomId}`
      }, fetchMessages)
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [roomId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    const { error } = await supabase
      .from('chat_messages')
      .insert({
        room_id: roomId,
        user_id: user.id,
        content: newMessage.trim()
      });

    if (error) {
      console.error('Erro ao enviar mensagem:', error);
      return;
    }

    setNewMessage('');
  };

  if (!roomDetails) return null;

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {roomDetails.type === 'direct' ? (
            <Avatar name={roomDetails.name} size="md" />
          ) : (
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Users size={20} className="text-blue-600" />
            </div>
          )}
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{roomDetails.name}</h2>
            <p className="text-sm text-gray-500">
              {roomDetails.chat_participants?.length} participantes
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          leftIcon={<Plus size={16} />}
        >
          Convidar
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => {
          const isCurrentUser = message.user_id === user?.id;
          const showAvatar = index === 0 || 
            messages[index - 1].user_id !== message.user_id;

          return (
            <div
              key={message.id}
              className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isCurrentUser && showAvatar && (
                <Avatar
                  name={message.user?.name || ''}
                  size="sm"
                  className="mr-2 mt-1"
                />
              )}
              <div
                className={`max-w-[70%] ${
                  isCurrentUser
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-900'
                } rounded-lg px-4 py-2`}
              >
                {showAvatar && !isCurrentUser && (
                  <p className="text-xs text-gray-500 mb-1">
                    {message.user?.name}
                  </p>
                )}
                <p className="text-sm">{message.content}</p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Digite sua mensagem..."
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Button type="submit" disabled={!newMessage.trim()}>
            <Send size={20} />
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ChatWindow