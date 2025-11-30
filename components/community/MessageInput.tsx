"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, AlertCircle, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface MessageInputProps {
  onSendMessage: (content: string) => Promise<void>;
  disabled?: boolean;
  placeholder?: string;
}

export function MessageInput({
  onSendMessage,
  disabled = false,
  placeholder = "Escreva sua mensagem...",
}: MessageInputProps) {
  const [content, setContent] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [rateLimitWarning, setRateLimitWarning] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const MAX_LENGTH = 2000;
  const RATE_LIMIT = 10; // mensagens por minuto
  const RATE_LIMIT_WINDOW = 60000; // 1 minuto em ms

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [content]);

  // Rate limit tracking
  useEffect(() => {
    if (messageCount >= RATE_LIMIT - 2) {
      setRateLimitWarning(true);
    } else {
      setRateLimitWarning(false);
    }

    if (messageCount > 0) {
      const timeout = setTimeout(() => {
        setMessageCount((prev) => Math.max(0, prev - 1));
      }, RATE_LIMIT_WINDOW);

      return () => clearTimeout(timeout);
    }
  }, [messageCount]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    const trimmedContent = content.trim();

    if (!trimmedContent) {
      toast.error("Digite uma mensagem");
      return;
    }

    if (trimmedContent.length > MAX_LENGTH) {
      toast.error(`Mensagem muito longa (max. ${MAX_LENGTH} caracteres)`);
      return;
    }

    if (messageCount >= RATE_LIMIT) {
      toast.error("Voce esta enviando mensagens muito rapido. Aguarde um momento!");
      return;
    }

    setIsSending(true);

    try {
      await onSendMessage(trimmedContent);
      setContent("");
      setMessageCount((prev) => prev + 1);

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast.error(error.message || "Erro ao enviar mensagem");
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Send with Enter (without Shift)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const remainingChars = MAX_LENGTH - content.length;
  const isNearLimit = remainingChars < 200;
  const isOverLimit = remainingChars < 0;

  return (
    <div className="bg-bg-secondary border-t-2 border-border-default p-4">
      <div className="max-w-4xl mx-auto">
        {/* Rate Limit Warning */}
        <AnimatePresence>
          {rateLimitWarning && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mb-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0" />
              <p className="text-xs text-yellow-500 font-medium">
                Voce enviou {messageCount} de {RATE_LIMIT} mensagens no ultimo
                minuto. Aguarde um pouco antes de enviar mais.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit}>

        <div className="relative">
          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled || isSending || messageCount >= RATE_LIMIT}
            placeholder={placeholder}
            rows={1}
            maxLength={MAX_LENGTH + 100} // Allow typing a bit over to show warning
            className="w-full bg-bg-elevated border-2 border-border-default focus:border-flame-primary rounded-2xl px-4 py-3 pr-28 text-text-primary placeholder:text-text-tertiary resize-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              minHeight: "48px",
              maxHeight: "200px",
            }}
          />

          {/* Character Counter */}
          <div className="absolute bottom-3 right-16 flex items-center gap-2">
            {content.length > 0 && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`text-xs font-medium ${
                  isOverLimit
                    ? "text-danger"
                    : isNearLimit
                    ? "text-yellow-500"
                    : "text-text-tertiary"
                }`}
              >
                {remainingChars < 0 ? `+${Math.abs(remainingChars)}` : remainingChars}
              </motion.span>
            )}
          </div>

          {/* Send Button */}
          <button
            type="submit"
            disabled={
              disabled ||
              isSending ||
              !content.trim() ||
              isOverLimit ||
              messageCount >= RATE_LIMIT
            }
            className="absolute bottom-3 right-3 w-10 h-10 bg-gradient-hero text-white rounded-xl flex items-center justify-center transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {isSending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
        </form>

        {/* Security Notice */}
        <div className="mt-2 p-2 bg-flame-primary/5 border border-flame-primary/20 rounded-lg">
          <div className="flex items-center gap-2 text-xs text-flame-primary">
            <ShieldAlert className="w-3 h-3 flex-shrink-0" />
            <span>
              Para sua seguranca, nao compartilhe telefone, email ou redes sociais
            </span>
          </div>
        </div>

        {/* Hints */}
        <div className="mt-2 flex items-center justify-between text-xs text-text-tertiary">
          <span>Enter para enviar, Shift+Enter para nova linha</span>
          {messageCount > 0 && (
            <span>
              {messageCount}/{RATE_LIMIT} mensagens/min
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
