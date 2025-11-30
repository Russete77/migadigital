import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { createClient } from '@/lib/supabase/client';

// API Routes são locais no Next.js
const API_URL = '';

export interface ChatMessage {
  id: string;
  room_id: string;
  sender_id: string;
  content: string;
  message_type: string;
  reactions: Record<string, string[]>;
  created_at: string;
  is_deleted: boolean;
  sender?: {
    id: string;
    nickname: string;
    avatar_color: string;
  };
  display_color?: string;
  display_name?: string;
}

export function useRoomMessages(roomId: string) {
  const { getToken } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  // Fetch initial messages
  const fetchMessages = async (silent = false) => {
    try {
      if (!silent) {
        setIsLoading(true);
      }
      setError(null);

      const token = await getToken();
      const response = await fetch(`${API_URL}/api/rooms/${roomId}/messages`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar mensagens');
      }

      const data = await response.json();
      setMessages(data.messages || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching messages:', err);
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  };

  // Send message
  const sendMessage = async (content: string) => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/api/rooms/${roomId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao enviar mensagem');
      }

      const data = await response.json();
      return data.message;
    } catch (err: any) {
      console.error('Error sending message:', err);
      throw err;
    }
  };

  // React to message
  const reactToMessage = async (messageId: string, emoji: string) => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/api/rooms/${roomId}/messages/${messageId}/react`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ emoji }),
      });

      if (!response.ok) {
        throw new Error('Erro ao reagir');
      }

      const data = await response.json();

      // Update local state
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, reactions: data.reactions } : msg
        )
      );
    } catch (err: any) {
      console.error('Error reacting to message:', err);
      throw err;
    }
  };

  // Delete message
  const deleteMessage = async (messageId: string) => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/api/rooms/${roomId}/messages/${messageId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao deletar mensagem');
      }

      // Update local state
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? { ...msg, is_deleted: true, content: '[Mensagem deletada]' }
            : msg
        )
      );
    } catch (err: any) {
      console.error('Error deleting message:', err);
      throw err;
    }
  };

  // Setup realtime with polling fallback
  useEffect(() => {
    if (!roomId) return;

    fetchMessages();

    // Try Supabase Realtime first
    const channel = supabase
      .channel(`room:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          console.log('New message:', payload.new);
          setMessages((prev) => [payload.new as ChatMessage, ...prev]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          console.log('Message updated:', payload.new);
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === payload.new.id ? (payload.new as ChatMessage) : msg
            )
          );
        }
      )
      .subscribe();

    // Polling fallback (every 3 seconds) - silent to avoid loading flicker
    const pollingInterval = setInterval(() => {
      fetchMessages(true); // Silent refresh
    }, 3000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollingInterval);
    };
  }, [roomId]);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    reactToMessage,
    deleteMessage,
    refresh: fetchMessages,
  };
}
