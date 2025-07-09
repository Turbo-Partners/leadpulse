import React, { useState } from 'react';
import { X } from 'lucide-react';
import ChatSidebar from './ChatSidebar';
import ChatWindow from './ChatWindow';

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChatDrawer = ({ isOpen, onClose }: ChatDrawerProps) => {
  const [selectedRoomId, setSelectedRoomId] = useState<string | undefined>();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[800px] bg-white shadow-xl z-40 flex">
      <ChatSidebar
        onRoomSelect={setSelectedRoomId}
        selectedRoomId={selectedRoomId}
      />
      {selectedRoomId ? (
        <ChatWindow roomId={selectedRoomId} />
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          Selecione uma conversa para começar
        </div>
      )}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
      >
        <X size={24} />
      </button>
    </div>
  );
};

export default ChatDrawer