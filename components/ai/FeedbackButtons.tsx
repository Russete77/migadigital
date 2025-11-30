"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ThumbsUp, ThumbsDown, X, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@clerk/nextjs";

// API Routes são locais no Next.js
const API_URL = "";

interface FeedbackButtonsProps {
  responseId: string;
  responseType: 'chat' | 'analyzer';
  onFeedbackSent?: () => void;
}

const FEEDBACK_TAGS = {
  positive: [
    { id: 'perfeita', label: 'Perfeita' },
    { id: 'natural', label: 'Muito natural' },
    { id: 'ajudou', label: 'Me ajudou muito' },
    { id: 'tom_adequado', label: 'Tom adequado' },
  ],
  negative: [
    { id: 'robotica', label: 'Muito robótica' },
    { id: 'nao_entendeu', label: 'Não entendeu' },
    { id: 'tom_errado', label: 'Tom inadequado' },
    { id: 'incompleta', label: 'Resposta incompleta' },
  ],
};

export function FeedbackButtons({ responseId, responseType, onFeedbackSent }: FeedbackButtonsProps) {
  const { getToken } = useAuth();
  const [feedbackGiven, setFeedbackGiven] = useState(false);
  const [showDetailedFeedback, setShowDetailedFeedback] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'positive' | 'negative' | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleQuickFeedback = async (type: 'positive' | 'negative') => {
    try {
      const token = await getToken();
      const rating = type === 'positive' ? 5 : 2;

      await fetch(`${API_URL}/api/ai/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          responseId,
          responseType,
          rating,
          tags: [],
          comment: null,
        }),
      });

      setFeedbackGiven(true);
      toast.success('Obrigada pelo feedback!', {
        description: 'Isso ajuda a melhorar nossa IA',
      });

      if (onFeedbackSent) onFeedbackSent();
    } catch (error) {
      console.error('Error sending feedback:', error);
      toast.error('Erro ao enviar feedback');
    }
  };

  const handleDetailedFeedback = async () => {
    if (selectedTags.length === 0 && !comment.trim()) {
      toast.error('Selecione ao menos uma tag ou escreva um comentário');
      return;
    }

    setIsSubmitting(true);

    try {
      const token = await getToken();
      const rating = feedbackType === 'positive' ? 5 : 1;

      await fetch(`${API_URL}/api/ai/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          responseId,
          responseType,
          rating,
          tags: selectedTags,
          comment: comment.trim() || null,
        }),
      });

      setFeedbackGiven(true);
      setShowDetailedFeedback(false);
      toast.success('Obrigada pelo feedback detalhado!', {
        description: 'Isso é muito valioso para nós',
      });

      if (onFeedbackSent) onFeedbackSent();
    } catch (error) {
      console.error('Error sending detailed feedback:', error);
      toast.error('Erro ao enviar feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev =>
      prev.includes(tagId)
        ? prev.filter(t => t !== tagId)
        : [...prev, tagId]
    );
  };

  if (feedbackGiven) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-2 text-sm text-success"
      >
        <span className="text-lg">✅</span>
        <span className="font-medium">Feedback enviado!</span>
      </motion.div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <span className="text-xs text-text-tertiary font-medium">Esta resposta foi útil?</span>

        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleQuickFeedback('positive')}
            className="hover:bg-success/10 hover:text-success transition-colors rounded-xl"
          >
            <ThumbsUp className="w-4 h-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setFeedbackType('negative');
              setShowDetailedFeedback(true);
            }}
            className="hover:bg-danger/10 hover:text-danger transition-colors rounded-xl"
          >
            <ThumbsDown className="w-4 h-4" />
          </Button>
        </div>

        <button
          onClick={() => {
            setFeedbackType('positive');
            setShowDetailedFeedback(true);
          }}
          className="text-xs text-flame-primary hover:text-flame-primary/80 font-medium underline"
        >
          Dar feedback detalhado
        </button>
      </motion.div>

      {/* Detailed Feedback Card */}
      <AnimatePresence>
        {showDetailedFeedback && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: "auto", marginTop: 16 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            className="bg-bg-secondary border-2 border-border-default rounded-2xl p-4 overflow-hidden"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-black text-lg gradient-text flex items-center gap-2">
                {feedbackType === 'positive' ? '💚' : '❌'}
                Feedback Detalhado
              </h3>
              <button
                onClick={() => setShowDetailedFeedback(false)}
                className="text-text-tertiary hover:text-text-primary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-text-secondary mb-4">
              Ajude-nos a melhorar a IA selecionando opções e/ou escrevendo um comentário.
            </p>

            <div className="space-y-4">
              {/* Tags */}
              <div>
                <label className="block text-sm font-bold text-text-primary mb-2">
                  O que você achou?
                </label>
                <div className="flex flex-wrap gap-2">
                  {(feedbackType === 'positive' ? FEEDBACK_TAGS.positive : FEEDBACK_TAGS.negative).map(tag => (
                    <button
                      key={tag.id}
                      onClick={() => toggleTag(tag.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        selectedTags.includes(tag.id)
                          ? 'bg-gradient-hero text-white shadow-red'
                          : 'bg-bg-elevated text-text-secondary border border-border-default hover:border-flame-primary/50'
                      }`}
                    >
                      {tag.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Comment */}
              <div>
                <label className="block text-sm font-bold text-text-primary mb-2">
                  Comentário adicional (opcional)
                </label>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Ex: A resposta foi boa mas poderia ter sido mais direta..."
                  className="min-h-[100px] bg-bg-elevated text-text-primary border-2 border-border-default focus:border-flame-primary/50 rounded-2xl resize-none"
                  maxLength={500}
                />
                <div className="text-xs text-text-tertiary mt-1 text-right">
                  {comment.length}/500
                </div>
              </div>

              {/* Actions */}
              <Button
                onClick={handleDetailedFeedback}
                disabled={isSubmitting || (selectedTags.length === 0 && !comment.trim())}
                className="w-full bg-gradient-hero text-white font-bold shadow-red hover:scale-105 transition-transform rounded-2xl"
              >
                {isSubmitting ? (
                  <>
                    <Send className="w-4 h-4 mr-2 animate-pulse" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Enviar Feedback
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
