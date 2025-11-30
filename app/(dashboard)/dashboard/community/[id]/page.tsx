"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Users,
  Clock,
  Lock,
  LogOut,
  Loader2,
  Shield,
  AlertTriangle,
  ChevronDown,
  Info,
} from "lucide-react";
import { useRoomMessages } from "@/hooks/useRoomMessages";
import { MessageBubble } from "@/components/community/MessageBubble";
import { MessageInput } from "@/components/community/MessageInput";
import { ROOM_TEMPLATES } from "@/lib/constants/room-templates";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// API Routes são locais no Next.js
const API_URL = "";

interface RoomDetails {
  id: string;
  name: string;
  description: string;
  template: string;
  tags: string[];
  is_anonymous: boolean;
  expires_at: string | null;
  member_count: number;
  max_members: number;
  status: string;
  hoursUntilExpiration?: number;
}

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const { getToken, userId } = useAuth();
  const roomId = params.id as string;

  const [room, setRoom] = useState<RoomDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [passwordPrompt, setPasswordPrompt] = useState(false);
  const [password, setPassword] = useState("");
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [showRoomInfo, setShowRoomInfo] = useState(false);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    isLoading: messagesLoading,
    sendMessage,
    reactToMessage,
    deleteMessage,
  } = useRoomMessages(isMember ? roomId : "");

  // Fetch room details
  useEffect(() => {
    if (roomId) {
      fetchRoomDetails();
    }
  }, [roomId]);

  // Handle scroll detection
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      setShowScrollButton(distanceFromBottom > 300);
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  // Auto-scroll to bottom when new messages arrive (if near bottom)
  useEffect(() => {
    if (!messagesContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

    // Only auto-scroll if user is near bottom (within 300px)
    if (distanceFromBottom < 300) {
      scrollToBottom();
    }
  }, [messages]);

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
  };

  const fetchRoomDetails = async () => {
    try {
      setIsLoading(true);
      const token = await getToken();

      const response = await fetch(`${API_URL}/api/rooms/${roomId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Erro ao carregar sala");
      }

      const data = await response.json();
      setRoom(data.room);
      setIsMember(data.isMember);

      if (!data.isMember && data.room.password_hash) {
        setPasswordPrompt(true);
      }
    } catch (error: any) {
      console.error("Error fetching room:", error);
      toast.error("Erro ao carregar sala");
      router.push("/dashboard/community");
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinRoom = async (providedPassword?: string) => {
    try {
      setIsJoining(true);
      const token = await getToken();

      const response = await fetch(`${API_URL}/api/rooms/${roomId}/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          password: providedPassword || password,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erro ao entrar na sala");
      }

      toast.success("Você entrou na sala! 🎉");
      setIsMember(true);
      setPasswordPrompt(false);
      setPassword("");
      fetchRoomDetails();
    } catch (error: any) {
      console.error("Error joining room:", error);
      toast.error(error.message || "Erro ao entrar na sala");
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeaveRoom = async () => {
    if (!confirm("Deseja sair desta sala?")) return;

    try {
      setIsLeaving(true);
      const token = await getToken();

      const response = await fetch(`${API_URL}/api/rooms/${roomId}/leave`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Erro ao sair da sala");
      }

      toast.success("Você saiu da sala");
      router.push("/dashboard/community");
    } catch (error: any) {
      console.error("Error leaving room:", error);
      toast.error(error.message || "Erro ao sair da sala");
    } finally {
      setIsLeaving(false);
    }
  };

  const handleReportMessage = async (messageId: string) => {
    try {
      const token = await getToken();

      const response = await fetch(
        `${API_URL}/api/rooms/${roomId}/messages/${messageId}/report`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Erro ao reportar mensagem");
      }
    } catch (error: any) {
      console.error("Error reporting message:", error);
      throw error;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-base">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-flame-primary mx-auto mb-4" />
          <p className="text-text-secondary font-medium">Carregando sala...</p>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-base">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-danger mx-auto mb-4" />
          <p className="text-text-primary font-bold text-xl mb-2">Sala não encontrada</p>
          <Button onClick={() => router.push("/dashboard/community")}>
            Voltar para comunidade
          </Button>
        </div>
      </div>
    );
  }

  const template = ROOM_TEMPLATES[room.template] || ROOM_TEMPLATES.custom;
  const isExpiringSoon = room.hoursUntilExpiration && room.hoursUntilExpiration < 2;

  // Password Prompt Screen
  if (passwordPrompt) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-base p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-bg-secondary border-2 border-border-default rounded-3xl p-8"
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-4 mx-auto"
            style={{ backgroundColor: template.color + "20" }}
          >
            <Lock className="w-8 h-8 text-flame-primary" />
          </div>

          <h2 className="font-display font-black text-2xl text-text-primary text-center mb-2">
            Sala Protegida
          </h2>
          <p className="text-text-secondary text-center mb-6">
            Esta sala requer uma senha para entrar
          </p>

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleJoinRoom()}
            placeholder="Digite a senha"
            className="w-full bg-bg-elevated border-2 border-border-default focus:border-flame-primary rounded-xl px-4 py-3 text-text-primary mb-4"
          />

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard/community")}
              className="flex-1 border-2"
            >
              Voltar
            </Button>
            <Button
              onClick={() => handleJoinRoom()}
              disabled={!password || isJoining}
              className="flex-1 bg-gradient-hero text-white font-bold"
            >
              {isJoining ? "Entrando..." : "Entrar"}
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Join Room Screen
  if (!isMember) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-base p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-bg-secondary border-2 border-border-default rounded-3xl p-8"
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-4 mx-auto"
            style={{ backgroundColor: template.color + "20" }}
          >
            {template.icon}
          </div>

          <h2 className="font-display font-black text-2xl text-text-primary text-center mb-2">
            {room.name}
          </h2>
          <p className="text-text-secondary text-center mb-6">{room.description}</p>

          <div className="space-y-3 mb-6">
            {room.is_anonymous && (
              <div className="flex items-center gap-2 text-sm text-purple-400">
                <div className="w-2 h-2 rounded-full bg-purple-500" />
                Sala anônima
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <Users className="w-4 h-4" />
              {room.member_count}/{room.max_members} membros
            </div>
            {room.expires_at && (
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <Clock className="w-4 h-4" />
                Expira em{" "}
                {room.hoursUntilExpiration && room.hoursUntilExpiration < 24
                  ? `${Math.floor(room.hoursUntilExpiration)}h`
                  : `${Math.floor(room.hoursUntilExpiration! / 24)}d`}
              </div>
            )}
          </div>

          {room.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {room.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-bg-elevated text-text-tertiary text-xs rounded-full border border-border-subtle"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <Button
            onClick={() => handleJoinRoom()}
            disabled={isJoining}
            className="w-full bg-gradient-hero text-white font-bold py-4 rounded-2xl"
          >
            {isJoining ? "Entrando..." : "Entrar na Sala"}
          </Button>

          <Button
            variant="ghost"
            onClick={() => router.push("/dashboard/community")}
            className="w-full mt-3"
          >
            Voltar
          </Button>
        </motion.div>
      </div>
    );
  }

  // Main Room View
  return (
    <div className="min-h-screen bg-bg-base flex flex-col">
      {/* Header */}
      <div className="bg-bg-secondary border-b-2 border-border-default p-4 sticky top-0 z-30 backdrop-blur-lg bg-opacity-95">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button
              onClick={() => router.push("/dashboard/community")}
              className="text-text-tertiary hover:text-text-primary transition-colors flex-shrink-0"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>

            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
              style={{ backgroundColor: template.color + "20" }}
            >
              {template.icon}
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="font-display font-black text-xl text-text-primary truncate">
                {room.name}
              </h1>
              <div className="flex items-center gap-3 text-xs text-text-tertiary">
                {room.is_anonymous && (
                  <span className="flex items-center gap-1 text-purple-400">
                    <div className="w-2 h-2 rounded-full bg-purple-500" />
                    Anônima
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {room.member_count}
                </span>
                {isExpiringSoon && (
                  <span className="flex items-center gap-1 text-danger">
                    <Clock className="w-3 h-3" />
                    Expirando
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowRoomInfo(!showRoomInfo)}
              className="text-text-tertiary hover:text-text-primary"
            >
              <Info className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLeaveRoom}
              disabled={isLeaving}
              className="text-danger hover:text-danger hover:bg-danger/10"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Room Info Expandable */}
        <AnimatePresence>
          {showRoomInfo && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="max-w-5xl mx-auto overflow-hidden"
            >
              <div className="mt-4 p-4 bg-bg-elevated rounded-2xl border border-border-subtle">
                <p className="text-text-secondary text-sm mb-3">{room.description}</p>
                {room.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {room.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-bg-secondary text-text-tertiary text-xs rounded-lg"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Safety Notice */}
      <div className="bg-bg-base border-b border-border-subtle p-3">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-start gap-2 text-xs text-text-tertiary">
            <Shield className="w-4 h-4 flex-shrink-0 mt-0.5 text-flame-primary" />
            <p>
              <strong>Espaço seguro:</strong> Proibido compartilhar números, redes
              sociais ou informações pessoais
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 scroll-smooth"
      >
        <div className="max-w-5xl mx-auto space-y-3">
          {messagesLoading ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-flame-primary mx-auto mb-2" />
              <p className="text-text-tertiary text-sm">Carregando mensagens...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gradient-hero rounded-full flex items-center justify-center mx-auto mb-4">
                {template.icon}
              </div>
              <h3 className="font-display font-black text-xl text-text-primary mb-2">
                Seja a primeira!
              </h3>
              <p className="text-text-secondary">
                Envie a primeira mensagem neste círculo
              </p>
            </div>
          ) : (
            <>
              {[...messages].reverse().map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isAnonymous={room.is_anonymous}
                  currentUserId={userId || ""}
                  onDelete={deleteMessage}
                  onReact={reactToMessage}
                  onReport={handleReportMessage}
                />
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </div>

      {/* Scroll to Bottom Button */}
      <AnimatePresence>
        {showScrollButton && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => scrollToBottom()}
            className="fixed bottom-24 right-6 w-12 h-12 bg-gradient-hero text-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform z-20"
          >
            <ChevronDown className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Message Input */}
      <MessageInput
        onSendMessage={sendMessage}
        placeholder={`Mensagem em ${room.name}...`}
      />
    </div>
  );
}
