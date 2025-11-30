"use client";

import { useState, useEffect, useRef } from "react";
import { useUser, useAuth } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2 } from "lucide-react";
import { BreathingExercise } from "@/components/emergency/BreathingExercise";
import { FeedbackButtons } from "@/components/ai/FeedbackButtons";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Message } from "@/types/database.types";

// API Routes são locais no Next.js
const API_URL = "";

export default function EmergencyPage() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [showBreathing, setShowBreathing] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showBreathing && messages.length === 0) {
      // Add initial AI message
      const initialMessage: Message = {
        role: "assistant",
        content:
          "Ei, para. Respira. Eu tô aqui. Me conta o que tá rolando agora... O que você tá pensando em fazer?",
        timestamp: new Date().toISOString(),
      };
      setMessages([initialMessage]);
    }
  }, [showBreathing, messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const token = await getToken();
      console.log('🎫 Token obtido:', token ? 'SIM (length: ' + token.length + ')' : 'NÃO');
      console.log('🌐 API URL:', `${API_URL}/api/ai/emergency-chat`);

      const response = await fetch(`${API_URL}/api/ai/emergency-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: input,
          conversationHistory: messages,
          sessionId,
        }),
      });

      console.log('📡 Response status:', response.status);
      if (!response.ok) {
        const errorData = await response.json();
        console.log('❌ Error data:', errorData);
        throw new Error("Falha na resposta");
      }

      const data = await response.json();

      if (data.sessionId && !sessionId) {
        setSessionId(data.sessionId);
      }

      const aiMessage: Message = {
        role: "assistant",
        content: data.message,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error:", error);
      const errorMessage: Message = {
        role: "assistant",
        content: "Desculpa, tive um problema técnico. Tenta de novo?",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  if (showBreathing) {
    return <BreathingExercise onComplete={() => setShowBreathing(false)} />;
  }

  return (
    <div className="h-screen flex flex-col bg-bg-base">
      {/* Header - Estilo Tinder */}
      <div className="bg-gradient-hero text-white px-6 py-5 border-b border-white/5">
        <h1 className="font-display font-black text-2xl mb-1">SOS Emocional</h1>
        <p className="text-base font-medium opacity-95">
          Conversando com {user?.firstName || "você"}
        </p>
      </div>

      {/* Messages - Estilo Tinder Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-bg-base">
        <AnimatePresence initial={false}>
          {messages.map((message, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex flex-col ${
                message.role === "user" ? "items-end" : "items-start"
              }`}
            >
              <div
                className={`max-w-[85%] md:max-w-[70%] rounded-3xl px-5 py-4 ${
                  message.role === "user"
                    ? "glass-elevated text-text-primary rounded-br-md"
                    : "bg-gradient-hero text-white rounded-bl-md"
                }`}
              >
                <p className="text-base font-medium leading-relaxed whitespace-pre-wrap">
                  {message.content}
                </p>
                {message.timestamp && (
                  <p
                    className={`text-xs mt-2 font-medium ${
                      message.role === "user"
                        ? "text-text-tertiary"
                        : "text-white/70"
                    }`}
                  >
                    {new Date(message.timestamp).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                )}
              </div>
              {message.role === "assistant" && sessionId && index > 0 && (
                <div className="mt-2 max-w-[85%] md:max-w-[70%]">
                  <FeedbackButtons
                    responseId={sessionId}
                    responseType="chat"
                  />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-gradient-hero text-white rounded-3xl rounded-bl-md px-5 py-4">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-base font-medium">Digitando...</span>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input - Estilo Tinder */}
      <div className="bg-bg-secondary border-t border-border-default p-5">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Digite sua mensagem..."
            className="flex-1 min-h-[48px] max-h-32 resize-none rounded-3xl border-2 border-border-default focus:border-flame-primary px-5 py-3 font-medium bg-bg-elevated text-text-primary placeholder:text-text-tertiary"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <Button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="h-12 w-12 p-0 flex-shrink-0 rounded-full bg-gradient-hero text-white hover:scale-110 transition-transform disabled:opacity-50 disabled:scale-100 border-0"
          >
            {isLoading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <Send className="w-6 h-6" />
            )}
          </Button>
        </form>
        <p className="text-xs text-text-tertiary mt-3 text-center font-medium">
          Shift + Enter para nova linha
        </p>
      </div>
    </div>
  );
}
