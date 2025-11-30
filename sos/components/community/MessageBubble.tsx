"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MoreVertical, Trash2, Flag, Smile } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { ChatMessage } from "@/hooks/useRoomMessages";
import { REACTION_EMOJIS } from "@/lib/constants/room-templates";
import { toast } from "sonner";
import { CustomAudioPlayer } from "./CustomAudioPlayer";

// API Routes são locais no Next.js
const API_URL = "";

interface MessageBubbleProps {
  message: ChatMessage;
  isAnonymous: boolean;
  currentUserId: string;
  onDelete: (messageId: string) => Promise<void>;
  onReact: (messageId: string, emoji: string) => Promise<void>;
  onReport: (messageId: string) => void;
}

export function MessageBubble({
  message,
  isAnonymous,
  currentUserId,
  onDelete,
  onReact,
  onReport,
}: MessageBubbleProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isOwnMessage = message.sender_id === currentUserId;
  const displayName = isAnonymous
    ? message.display_name || "Anônima"
    : message.sender?.nickname || "Usuária";
  const displayColor = isAnonymous
    ? message.display_color || "#FF6B6B"
    : "#4ECDC4";

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleDelete = async () => {
    if (!confirm("Deletar esta mensagem?")) return;

    setIsDeleting(true);
    try {
      await onDelete(message.id);
      toast.success("Mensagem deletada");
    } catch (error) {
      toast.error("Erro ao deletar mensagem");
    } finally {
      setIsDeleting(false);
      setShowMenu(false);
    }
  };

  const handleReact = async (emoji: string) => {
    try {
      await onReact(message.id, emoji);
      setShowReactions(false);
    } catch (error) {
      toast.error("Erro ao reagir");
    }
  };

  const handleReport = () => {
    onReport(message.id);
    setShowMenu(false);
    toast.success("Mensagem reportada. Obrigada por manter o espaço seguro!");
  };

  if (message.is_deleted) {
    return (
      <div className="flex items-center gap-2 py-2 px-4 opacity-50">
        <div className="text-xs text-text-tertiary italic">
          [Mensagem deletada]
        </div>
      </div>
    );
  }

  const totalReactions = Object.values(message.reactions || {}).reduce(
    (sum, users) => sum + users.length,
    0
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`group relative ${isOwnMessage ? "text-right" : "text-left"}`}
    >
      <div
        className={`inline-block max-w-[85%] md:max-w-[70%] ${
          isOwnMessage ? "ml-auto" : "mr-auto"
        }`}
      >
        {/* Sender Info */}
        {!isOwnMessage && (
          <div className="flex items-center gap-2 mb-1 px-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: displayColor }}
            />
            <span className="text-xs font-bold" style={{ color: displayColor }}>
              {displayName}
            </span>
          </div>
        )}

        {/* Message Content */}
        <div className="relative">
          <div
            className={`px-4 py-3 rounded-2xl ${
              isOwnMessage
                ? "bg-gradient-hero text-white rounded-br-md"
                : "bg-bg-secondary text-text-primary border border-border-default rounded-bl-md"
            }`}
            style={
              !isOwnMessage && isAnonymous
                ? {
                    borderLeftWidth: "3px",
                    borderLeftColor: displayColor,
                  }
                : undefined
            }
          >
            {/* Audio Player or Text Content */}
            {message.message_type === "audio" ? (
              <div className="min-w-[280px] max-w-sm">
                <CustomAudioPlayer
                  src={`${API_URL}${message.content}`}
                  isOwnMessage={isOwnMessage}
                />
              </div>
            ) : (
              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                {message.content}
              </p>
            )}

            {/* Timestamp */}
            <div
              className={`flex items-center gap-2 mt-1 ${
                isOwnMessage ? "justify-end" : "justify-start"
              }`}
            >
              <span
                className={`text-xs ${
                  isOwnMessage ? "text-white/70" : "text-text-tertiary"
                }`}
              >
                {formatTime(message.created_at)}
              </span>
            </div>
          </div>

          {/* Context Menu Button */}
          <button
            onClick={() => setShowMenu(!showMenu)}
            className={`absolute top-2 ${
              isOwnMessage ? "left-2" : "right-2"
            } opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-black/20`}
          >
            <MoreVertical className="w-4 h-4 text-white/70" />
          </button>

          {/* Context Menu */}
          <AnimatePresence>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`absolute ${
                  isOwnMessage ? "left-0" : "right-0"
                } top-10 bg-bg-elevated border border-border-default rounded-xl shadow-tinder-lg overflow-hidden z-10 min-w-[160px]`}
              >
                {isOwnMessage ? (
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="w-full px-4 py-3 text-left text-sm text-danger hover:bg-danger/10 transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    {isDeleting ? "Deletando..." : "Deletar"}
                  </button>
                ) : (
                  <button
                    onClick={handleReport}
                    className="w-full px-4 py-3 text-left text-sm text-text-primary hover:bg-bg-secondary transition-colors flex items-center gap-2"
                  >
                    <Flag className="w-4 h-4" />
                    Reportar
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Reactions Bar */}
        <div className="mt-2 px-2 flex items-center gap-2">
          {/* Reaction Button */}
          <button
            onClick={() => setShowReactions(!showReactions)}
            className="text-xs text-text-tertiary hover:text-flame-primary transition-colors flex items-center gap-1"
          >
            <Smile className="w-3.5 h-3.5" />
            Reagir
          </button>

          {/* Existing Reactions */}
          {message.reactions && Object.keys(message.reactions).length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {Object.entries(message.reactions).map(([emoji, users]) =>
                users.length > 0 ? (
                  <button
                    key={emoji}
                    onClick={() => handleReact(emoji)}
                    className={`px-2 py-0.5 rounded-full text-xs flex items-center gap-1 transition-all ${
                      users.includes(currentUserId)
                        ? "bg-flame-primary/20 border border-flame-primary/50"
                        : "bg-bg-elevated border border-border-default hover:border-flame-primary/30"
                    }`}
                  >
                    <span>{emoji}</span>
                    <span className="text-text-secondary font-medium">
                      {users.length}
                    </span>
                  </button>
                ) : null
              )}
            </div>
          )}
        </div>

        {/* Reaction Picker */}
        <AnimatePresence>
          {showReactions && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-2 p-2 bg-bg-elevated border border-border-default rounded-xl shadow-tinder-lg flex gap-1"
            >
              {REACTION_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleReact(emoji)}
                  className="w-10 h-10 flex items-center justify-center text-xl hover:bg-bg-secondary rounded-lg transition-colors hover:scale-110"
                >
                  {emoji}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
