"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle, TrendingUp, TrendingDown, ArrowLeft, Share2 } from "lucide-react";
import { FeedbackButtons } from "@/components/ai/FeedbackButtons";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ConversationAnalysis } from "@/types/database.types";

// API Routes são locais no Next.js
const API_URL = "";

export default function AnalysisResultPage() {
  const params = useParams();
  const router = useRouter();
  const { getToken } = useAuth();
  const [analysis, setAnalysis] = useState<ConversationAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAnalysis();
  }, [params.id]);

  const fetchAnalysis = async () => {
    try {
      const token = await getToken();

      const response = await fetch(`${API_URL}/api/ai/analyze/${params.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Análise não encontrada");

      const data = await response.json();
      setAnalysis(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <AnalysisResultSkeleton />;
  }

  if (error || !analysis) {
    return (
      <div className="min-h-screen p-4 md:p-8 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-text-primary mb-2">
            Análise não encontrada
          </h2>
          <p className="text-text-secondary mb-4">{error}</p>
          <Button onClick={() => router.push("/dashboard/analyzer")}>
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  const result = analysis.analysis_result;
  const interestColor =
    result.interesse_nivel >= 7
      ? "text-emerald-600"
      : result.interesse_nivel >= 4
      ? "text-flame-primary"
      : "text-tinder-red";

  return (
    <div className="min-h-screen p-4 md:p-8 pb-24 md:pb-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <Button
            variant="ghost"
            onClick={() => router.push("/dashboard/analyzer")}
            className="gap-2 font-bold hover:bg-bg-elevated transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar
          </Button>
          <Button
            variant="outline"
            className="gap-2 border-2 border-flame-primary text-flame-primary hover:bg-flame-primary/10 font-bold transition-all"
          >
            <Share2 className="w-5 h-5" />
            Compartilhar
          </Button>
        </motion.div>

        {/* Interest Level Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-2 border-white/10 bg-bg-secondary shadow-glow">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl font-display font-black gradient-text">
                Nível de Interesse
              </CardTitle>
              <CardDescription className="text-text-secondary">
                Baseado na análise completa da conversa
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center py-8">
              <div className="relative w-48 h-48 mb-6">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    className="stroke-border-default"
                    strokeWidth="12"
                    fill="none"
                  />
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="url(#gradient)"
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={`${(result.interesse_nivel / 10) * 552} 552`}
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#E63946" />
                      <stop offset="50%" stopColor="#F77F00" />
                      <stop offset="100%" stopColor="#F4A261" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-6xl font-black font-display ${interestColor} drop-shadow-lg`}>
                    {result.interesse_nivel}
                  </span>
                  <span className="text-sm text-text-tertiary font-medium">de 10</span>
                </div>
              </div>
              <p className="text-center text-text-secondary max-w-md leading-relaxed font-medium">
                {result.interesse_analise}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Red Flags */}
        {result.red_flags.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-2 border-tinder-red/20 bg-bg-secondary shadow-red">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-tinder-red font-display font-black">
                  <AlertTriangle className="w-6 h-6" />
                  Red Flags Identificadas
                </CardTitle>
                <CardDescription className="text-text-secondary">
                  Sinais de alerta encontrados na conversa
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {result.red_flags.map((flag, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-tinder-red/5 border-2 border-tinder-red/20 rounded-2xl hover:border-tinder-red/40 transition-all"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-bold text-tinder-red font-display">{flag.tipo}</h4>
                      <Badge
                        className={
                          flag.gravidade === "alta"
                            ? "bg-tinder-red text-white"
                            : flag.gravidade === "média"
                            ? "bg-tinder-orange text-white"
                            : "bg-gray-500 text-white"
                        }
                      >
                        {flag.gravidade.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-sm text-text-primary mb-2">
                      <strong className="text-tinder-red">Evidência:</strong> "{flag.evidencia}"
                    </p>
                    <p className="text-sm text-text-secondary font-medium">{flag.explicacao}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Positive Signs */}
        {result.sinais_positivos.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-2 border-emerald-500/20 bg-bg-secondary shadow-tinder-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-emerald-600 font-display font-black">
                  <CheckCircle className="w-6 h-6" />
                  Sinais Positivos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {result.sinais_positivos.map((sinal, idx) => (
                    <li key={idx} className="flex items-start gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-800">
                      <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-text-primary font-medium">{sinal}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Probabilities */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <Card className="border-2 border-tinder-orange/20 bg-bg-secondary shadow-orange">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-display font-bold text-tinder-orange">
                <TrendingDown className="w-5 h-5" />
                Probabilidade de Ghosting
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-4xl font-black font-display text-tinder-orange drop-shadow-lg">
                    {result.probabilidade_ghosting}%
                  </span>
                </div>
                <div className="w-full bg-bg-elevated rounded-full h-4 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-tinder-orange to-flame-primary h-4 rounded-full transition-all duration-1000 shadow-orange"
                    style={{ width: `${result.probabilidade_ghosting}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-tinder-pink/20 bg-bg-secondary shadow-tinder-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-display font-bold text-tinder-pink">
                <TrendingUp className="w-5 h-5" />
                Probabilidade de Voltar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-4xl font-black font-display text-tinder-pink drop-shadow-lg">
                    {result.probabilidade_voltar}%
                  </span>
                </div>
                <div className="w-full bg-bg-elevated rounded-full h-4 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-tinder-pink to-accent-600 h-4 rounded-full transition-all duration-1000 shadow-pink"
                    style={{ width: `${result.probabilidade_voltar}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Translation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="bg-gradient-hero text-white border-none shadow-tinder-xl overflow-hidden relative">
            <div className="absolute inset-0 bg-black/10" />
            <CardHeader className="relative z-10">
              <CardTitle className="font-display font-black text-2xl">
                O Que Ele Realmente Está Dizendo
              </CardTitle>
              <CardDescription className="text-white/90 font-medium">
                Tradução homem → verdade
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              <p className="text-lg leading-relaxed font-medium drop-shadow-md">
                {result.traducao_real}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recommendation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="border-2 border-flame-primary/30 bg-gradient-to-br from-bg-secondary to-bg-elevated shadow-glow">
            <CardHeader>
              <CardTitle className="text-3xl font-display font-black gradient-text">
                Seu Movimento Estratégico
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-tinder-red/5 rounded-2xl border-2 border-tinder-red/20">
                <h4 className="font-black text-lg mb-3 text-tinder-red font-display">
                  O que fazer AGORA:
                </h4>
                <p className="text-text-primary leading-relaxed font-medium">
                  {result.recomendacao.acao}
                </p>
              </div>

              <div className="p-4 bg-tinder-orange/5 rounded-2xl border-2 border-tinder-orange/20">
                <h4 className="font-black text-lg mb-3 text-tinder-orange font-display">
                  Por quê:
                </h4>
                <p className="text-text-secondary leading-relaxed font-medium">
                  {result.recomendacao.justificativa}
                </p>
              </div>

              {result.recomendacao.script_resposta && (
                <div className="p-5 bg-gradient-hero text-white rounded-2xl border-none shadow-red">
                  <h4 className="font-black text-lg mb-3 font-display">
                    Script de resposta:
                  </h4>
                  <p className="italic leading-relaxed font-medium text-lg">
                    "{result.recomendacao.script_resposta}"
                  </p>
                </div>
              )}

              <div className="p-4 bg-tinder-pink/5 rounded-2xl border-2 border-tinder-pink/20">
                <h4 className="font-black text-lg mb-3 text-tinder-pink font-display">
                  Posicionamento:
                </h4>
                <p className="text-text-primary leading-relaxed font-medium">
                  {result.recomendacao.posicionamento}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Feedback Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="bg-bg-secondary border-2 border-white/10 shadow-tinder-sm">
            <CardContent className="py-6">
              <div className="flex flex-col items-center gap-4">
                <h3 className="text-lg font-display font-bold text-text-primary text-center">
                  Esta análise foi útil para você?
                </h3>
                <FeedbackButtons
                  responseId={params.id as string}
                  responseType="analyzer"
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center py-8"
        >
          <Button
            onClick={() => router.push("/dashboard/analyzer")}
            size="lg"
            className="bg-gradient-hero text-white font-black text-lg px-10 py-7 rounded-3xl shadow-tinder-xl hover:scale-105 transition-transform"
          >
            Analisar Outra Conversa
          </Button>
        </motion.div>
      </div>
    </div>
  );
}

function AnalysisResultSkeleton() {
  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-64" />
        <Skeleton className="h-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-48" />
        <Skeleton className="h-64" />
      </div>
    </div>
  );
}
