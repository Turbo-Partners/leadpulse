import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { MessageSquare, Search, Plus, Users } from 'lucide-react';
import Avatar from '../ui/Avatar';
import Input from '../ui/Input';
import { supabase } from '../../lib/supabase';

interface ChatRoom {
  id: string;
  name: string;
  type: 'direct' | 'group';
  lastMessage?: string;
  unreadCount?: number;
}

interface ChatSidebarProps {
  onRoomSelect: (roomId: string) => void;
  selectedRoomId?: string;
}

const ChatSidebar = ({ onRoomSelect, selectedRoomId }: ChatSidebarProps) => {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const fetchRooms = async () => {
      const { data, error } = await supabase
        .from('chat_rooms')
        .select(`
          id,
          name,
          type,
          chat_messages (
            content,
            created_at
          )
        `)
        .order('created_at', { foreignTable: 'chat_messages', ascending: false })
        .limit(1, { foreignTable: 'chat_messages' });

      if (error) {
        console.error('Erro ao buscar salas:', error);
        return;
      }

      setRooms(data || []);
    };

    fetchRooms();

    // Inscrever para atualizações em tempo real
    const subscription = supabase
      .channel('chat_rooms')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_rooms' }, fetchRooms)
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const filteredRooms = rooms.filter(room =>
    room.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-80 border-r border-gray-200 bg-white h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Chat</h2>
          <button className="text-gray-500 hover:text-gray-700">
            <Plus size={20} />
          </button>
        </div>
        <Input
          placeholder="Buscar conversas..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftIcon={<Search size={16} className="text-gray-400" />}
          fullWidth
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredRooms.map((room) => (
          <button
            key={room.id}
            onClick={() => onRoomSelect(room.id)}
            className={`w-full p-4 flex items-center space-x-3 hover:bg-gray-50 ${
              selectedRoomId === room.id ? 'bg-blue-50' : ''
            }`}
          >
            {room.type === 'direct' ? (
              <Avatar name={room.name} size="md" />
            ) : (
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Users size={20} className="text-blue-600" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {room.name}
                </p>
                {room.unreadCount && (
                  <span className="ml-2 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {room.unreadCount}
                  </span>
                )}
              </div>
              {room.lastMessage && (
                <p className="text-sm text-gray-500 truncate">
                  {room.lastMessage}
                </p>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ChatSidebar