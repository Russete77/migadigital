'use client';

import { use, useEffect, useState, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, ArrowLeft, Users, Flag, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface ChatMessage {
  id: string;
  sender_id: string;
  sender_nickname: string;
  sender_avatar_color: string;
  message_type: 'text' | 'audio';
  content: string | null;
  audio_url: string | null;
  created_at: string;
  is_deleted: boolean;
}

interface ChatProfile {
  id: string;
  nickname: string;
  avatar_color: string;
}

interface ChatRoom {
  id: string;
  name: string;
  description: string;
}

export default function ChatRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { userId, isLoaded } = useAuth();
  const router = useRouter();
  const { id: roomId } = use(params);
  const [room, setRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatProfile, setChatProfile] = useState<ChatProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isLoaded && userId) {
      loadChatData();
    }

    return () => {
      if (channelRef.current) {
        unsubscribeFromChannel();
      }
    };
  }, [roomId, userId, isLoaded]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadChatData = async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();

      // Buscar sala
      const { data: roomData, error: roomError } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('id', roomId)
        .single();

      if (roomError || !roomData) {
        toast.error('Sala não encontrada');
        router.push('/dashboard/community');
        return;
      }

      setRoom(roomData);

      // Buscar profile do usuário
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('clerk_id', userId)
        .single();

      if (!profile) {
        toast.error('Perfil não encontrado');
        return;
      }

      // Buscar perfil de chat
      const { data: chatProf } = await supabase
        .from('chat_profiles')
        .select('*')
        .eq('user_id', profile.id)
        .single();

      if (!chatProf) {
        toast.error('Crie seu perfil de chat primeiro');
        router.push('/dashboard/community/setup');
        return;
      }

      setChatProfile(chatProf);

      // Adicionar usuário como membro da sala
      await supabase
        .from('chat_room_members')
        .upsert({
          room_id: roomId,
          profile_id: chatProf.id,
          last_seen: new Date().toISOString(),
        });

      // Carregar mensagens
      await loadMessages(supabase);

      // Subscribe to realtime
      subscribeToMessages(supabase);

      setIsLoading(false);
    } catch (error) {
      console.error('Error loading chat data:', error);
      toast.error('Erro ao carregar chat');
      setIsLoading(false);
    }
  };

  const loadMessages = async (supabase: any) => {
    const { data } = await supabase
      .from('chat_messages')
      .select(`
        id,
        sender_id,
        message_type,
        content,
        audio_url,
        created_at,
        is_deleted,
        chat_profiles!inner (
          nickname,
          avatar_color
        )
      `)
      .eq('room_id', roomId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true })
      .limit(100);

    if (data) {
      const formattedMessages = data.map((msg: any) => ({
        id: msg.id,
        sender_id: msg.sender_id,
        sender_nickname: msg.chat_profiles.nickname,
        sender_avatar_color: msg.chat_profiles.avatar_color,
        message_type: msg.message_type,
        content: msg.content,
        audio_url: msg.audio_url,
        created_at: msg.created_at,
        is_deleted: msg.is_deleted,
      }));

      setMessages(formattedMessages);
    }
  };

  const subscribeToMessages = (supabase: any) => {
    channelRef.current = supabase
      .channel(`room:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`,
        },
        async (payload: any) => {
          // Buscar detalhes da nova mensagem
          const { data } = await supabase
            .from('chat_messages')
            .select(`
              id,
              sender_id,
              message_type,
              content,
              audio_url,
              created_at,
              is_deleted,
              chat_profiles!inner (
                nickname,
                avatar_color
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (data) {
            const newMsg: ChatMessage = {
              id: data.id,
              sender_id: data.sender_id,
              sender_nickname: data.chat_profiles.nickname,
              sender_avatar_color: data.chat_profiles.avatar_color,
              message_type: data.message_type,
              content: data.content,
              audio_url: data.audio_url,
              created_at: data.created_at,
              is_deleted: data.is_deleted,
            };

            setMessages((prev) => [...prev, newMsg]);
          }
        }
      )
      .on('presence', { event: 'sync' }, () => {
        const state = channelRef.current?.presenceState();
        if (state) {
          setOnlineCount(Object.keys(state).length);
        }
      })
      .subscribe(async (status: string) => {
        if (status === 'SUBSCRIBED' && chatProfile) {
          await channelRef.current?.track({
            user_id: chatProfile.id,
            nickname: chatProfile.nickname,
            online_at: new Date().toISOString(),
          });
        }
      });
  };

  const unsubscribeFromChannel = async () => {
    if (channelRef.current) {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      await supabase.removeChannel(channelRef.current);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !chatProfile || isSending) return;

    // Verificar se contém informações proibidas
    const bannedPatterns = [
      { pattern: /\d{10,11}/, reason: 'telefone/CPF' },
      { pattern: /\(\d{2}\)\s?\d{4,5}-?\d{4}/, reason: 'telefone' },
      { pattern: /@[\w\.]+/gi, reason: 'rede social (@)' },
      { pattern: /whatsapp/gi, reason: 'WhatsApp' },
      { pattern: /telegram/gi, reason: 'Telegram' },
      { pattern: /instagram/gi, reason: 'Instagram' },
      { pattern: /facebook/gi, reason: 'Facebook' },
    ];

    for (const { pattern, reason } of bannedPatterns) {
      if (pattern.test(newMessage)) {
        toast.error(
          `⚠️ Não compartilhe ${reason} por segurança! Mantenha sua privacidade.`
        );
        return;
      }
    }

    setIsSending(true);

    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();

      const { error } = await supabase.from('chat_messages').insert({
        room_id: roomId,
        sender_id: chatProfile.id,
        message_type: 'text',
        content: newMessage.trim(),
      });

      if (error) {
        console.error('Error sending message:', error);
        toast.error('Erro ao enviar mensagem');
      } else {
        setNewMessage('');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erro ao enviar mensagem');
    } finally {
      setIsSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-bg-base">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-flame-primary mx-auto mb-4" />
          <p className="text-text-secondary font-medium">Entrando na sala...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-bg-base">
      {/* Header */}
      <div className="bg-gradient-hero text-white px-6 py-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/dashboard/community')}
            className="hover:scale-110 transition-transform"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="font-display font-black text-xl">{room?.name}</h1>
            <p className="text-sm opacity-90">{room?.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full">
          <Users className="w-4 h-4" />
          <span className="text-sm font-bold">{onlineCount || 0}</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        <AnimatePresence initial={false}>
          {messages.map((message) => {
            const isOwnMessage = message.sender_id === chatProfile?.id;

            return (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : ''}`}
              >
                {/* Avatar */}
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                  style={{ backgroundColor: message.sender_avatar_color }}
                >
                  {message.sender_nickname[0].toUpperCase()}
                </div>

                {/* Message */}
                <div className={`max-w-[70%] ${isOwnMessage ? 'text-right' : ''}`}>
                  <p className="text-xs text-text-tertiary mb-1 font-medium">
                    {message.sender_nickname}
                  </p>
                  <div
                    className={`px-5 py-3 rounded-3xl ${
                      isOwnMessage
                        ? 'bg-gradient-hero text-white rounded-br-md'
                        : 'bg-bg-elevated text-text-primary rounded-bl-md'
                    }`}
                  >
                    {message.message_type === 'text' ? (
                      <p className="text-base font-medium leading-relaxed whitespace-pre-wrap">
                        {message.content}
                      </p>
                    ) : (
                      <audio controls src={message.audio_url || ''} className="w-full" />
                    )}
                  </div>
                  <p
                    className={`text-xs mt-1 font-medium ${
                      isOwnMessage ? 'text-text-tertiary' : 'text-text-tertiary'
                    }`}
                  >
                    {new Date(message.created_at).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {isSending && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-end"
          >
            <div className="bg-gradient-hero text-white rounded-3xl rounded-br-md px-5 py-3">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-base font-medium">Enviando...</span>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-bg-secondary border-t border-border-default p-5">
        <form onSubmit={sendMessage} className="flex gap-3">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Digite sua mensagem..."
            className="flex-1 min-h-[48px] max-h-32 resize-none rounded-3xl border-2 border-border-default focus:border-flame-primary px-5 py-3 font-medium bg-bg-elevated text-text-primary placeholder:text-text-tertiary"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage(e);
              }
            }}
            maxLength={500}
          />
          <Button
            type="submit"
            disabled={!newMessage.trim() || isSending}
            className="h-12 w-12 p-0 flex-shrink-0 rounded-full bg-gradient-hero text-white hover:scale-110 transition-transform disabled:opacity-50 disabled:scale-100 border-0"
          >
            {isSending ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <Send className="w-6 h-6" />
            )}
          </Button>
        </form>
        <p className="text-xs text-text-tertiary mt-3 text-center font-medium">
          Shift + Enter para nova linha • Não compartilhe informações pessoais
        </p>
      </div>
    </div>
  );
}
