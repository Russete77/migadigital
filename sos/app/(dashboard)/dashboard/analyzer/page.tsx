"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { Upload, FileText, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// API Routes são locais no Next.js
const API_URL = "";

export default function AnalyzerPage() {
  const router = useRouter();
  const { getToken } = useAuth();
  const [conversationText, setConversationText] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState("");

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).slice(0, 3);
      setImages((prev) => [...prev, ...newFiles].slice(0, 3));
    }
  };

  const handleAnalyze = async () => {
    if (!conversationText.trim() && images.length === 0) {
      setError("Cole o texto da conversa ou envie prints");
      return;
    }

    setError("");
    setIsAnalyzing(true);

    try {
      const token = await getToken();

      const formData = new FormData();
      formData.append("conversationText", conversationText);
      images.forEach((image) => {
        formData.append("images", image);
      });

      const response = await fetch(`${API_URL}/api/ai/analyze`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Falha na análise");
      }

      const data = await response.json();
      router.push(`/dashboard/analyzer/${data.analysisId}`);
    } catch (err: any) {
      setError(err.message || "Erro ao analisar conversa");
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 bg-bg-base">
      <div className="max-w-4xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="font-display font-bold text-3xl md:text-4xl gradient-text mb-2">
            Analisador de Conversas
          </h1>
          <p className="text-text-secondary text-lg">
            Descubra se ele tá realmente interessado ou só te enrolando
          </p>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-danger/10 border border-danger/30 rounded-lg p-4 flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
            <p className="text-danger text-sm">{error}</p>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-bg-secondary border-2 border-border-default hover:border-flame-primary/30 transition-all shadow-tinder-sm hover:shadow-tinder-md rounded-3xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-text-primary font-display font-black text-xl">
                <FileText className="w-6 h-6 text-flame-primary" />
                Contexto da Conversa
              </CardTitle>
              <CardDescription className="text-text-secondary font-medium">
                Cole aqui as mensagens trocadas entre vocês. Quanto mais contexto, melhor a análise.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                value={conversationText}
                onChange={(e) => setConversationText(e.target.value)}
                placeholder={`Exemplo:\n\nEle: Oi sumida, como você tá?\nVocê: Oi! Tudo bem sim, e você?\nEle: Tô bem, tava corrido aqui no trampo\nVocê: Imagino! Como tão as coisas?\nEle: Ah, correria, mas dá pra levar haha\n\n(Cole quantas mensagens quiser)`}
                className="min-h-[240px] font-mono text-sm bg-bg-elevated text-text-primary border-2 border-border-default focus:border-flame-primary/50 placeholder:text-text-tertiary rounded-2xl resize-none"
              />
              <div className="flex items-center gap-2 text-xs text-text-tertiary">
                <span className="w-2 h-2 rounded-full bg-flame-primary/50"></span>
                <span>Dica: Inclua mensagens dele E suas respostas para uma análise completa</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-bg-secondary border-2 border-border-default hover:border-flame-primary/30 transition-all shadow-tinder-sm hover:shadow-tinder-md rounded-3xl">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-text-primary font-display font-black text-xl">
                    <Upload className="w-6 h-6 text-flame-primary" />
                    Prints da Conversa
                  </CardTitle>
                  <CardDescription className="text-text-secondary font-medium mt-1">
                    Envie até 3 prints para análise visual completa (opcional mas recomendado)
                  </CardDescription>
                </div>
                <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-bg-elevated border border-border-default">
                  <span className="text-xs font-bold text-flame-primary">{images.length}</span>
                  <span className="text-xs text-text-tertiary">/3</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="block cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={images.length >= 3}
                />
                <div className="border-2 border-dashed border-flame-primary/30 rounded-2xl p-8 text-center hover:border-flame-primary hover:bg-bg-elevated transition-all group">
                  <Upload className="w-12 h-12 mx-auto mb-3 text-text-tertiary group-hover:text-flame-primary transition-colors" />
                  <p className="text-sm font-bold text-text-secondary mb-1">
                    {images.length >= 3 ? 'Limite de 3 imagens atingido' : 'Clique aqui para enviar prints'}
                  </p>
                  <p className="text-xs text-text-tertiary">
                    PNG, JPG ou JPEG até 5MB cada
                  </p>
                </div>
              </label>

              {images.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                    <span className="text-xs font-bold text-text-secondary">PREVIEW</span>
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {images.map((img, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="relative aspect-square rounded-2xl overflow-hidden bg-bg-elevated border-2 border-border-default group"
                      >
                        <img
                          src={URL.createObjectURL(img)}
                          alt={`Preview ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors"></div>
                        <button
                          onClick={() =>
                            setImages((prev) => prev.filter((_, i) => i !== idx))
                          }
                          className="absolute top-2 right-2 w-8 h-8 bg-danger text-white rounded-full text-sm font-bold hover:bg-danger/80 hover:scale-110 transition-all shadow-lg opacity-0 group-hover:opacity-100"
                        >
                          ×
                        </button>
                        <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 backdrop-blur-sm rounded-lg">
                          <span className="text-xs font-bold text-white">Print {idx + 1}</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Summary do que será analisado */}
        {(conversationText.trim() || images.length > 0) && !isAnalyzing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-flame-primary/10 border-2 border-flame-primary/30 rounded-2xl p-4"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-hero flex items-center justify-center flex-shrink-0 shadow-glow">
                <span className="text-xl">✨</span>
              </div>
              <div className="flex-1">
                <h3 className="font-display font-bold text-text-primary mb-2">
                  Pronto para analisar:
                </h3>
                <div className="space-y-1 text-sm">
                  {conversationText.trim() && (
                    <div className="flex items-center gap-2 text-text-secondary">
                      <FileText className="w-4 h-4 text-flame-primary" />
                      <span>
                        {conversationText.split('\n').filter(line => line.trim()).length} linhas de conversa
                      </span>
                    </div>
                  )}
                  {images.length > 0 && (
                    <div className="flex items-center gap-2 text-text-secondary">
                      <Upload className="w-4 h-4 text-flame-primary" />
                      <span>
                        {images.length} {images.length === 1 ? 'print' : 'prints'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex gap-4"
        >
          <Button
            onClick={handleAnalyze}
            disabled={isAnalyzing || (!conversationText.trim() && images.length === 0)}
            className="flex-1 h-14 text-lg bg-gradient-hero text-white font-bold shadow-red hover:scale-105 transition-transform rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            size="lg"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                Analisando com IA...
              </>
            ) : (
              <>
                <span>Analisar Conversa</span>
                <span className="ml-2">🔍</span>
              </>
            )}
          </Button>
        </motion.div>

        {/* Informações e dicas */}
        <div className="grid md:grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-warning/10 border-2 border-warning/30 rounded-2xl p-4"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-warning/20 flex items-center justify-center flex-shrink-0">
                <span className="text-lg">🔒</span>
              </div>
              <div>
                <h4 className="font-bold text-warning mb-1 text-sm">Privacidade Garantida</h4>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Sua conversa é analisada de forma segura e privada. Apenas você tem acesso ao resultado.
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-success/10 border-2 border-success/30 rounded-2xl p-4"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0">
                <span className="text-lg">💡</span>
              </div>
              <div>
                <h4 className="font-bold text-success mb-1 text-sm">Análise Completa</h4>
                <p className="text-xs text-text-secondary leading-relaxed">
                  A IA analisa texto + imagens juntos para dar uma visão 360° da conversa.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
