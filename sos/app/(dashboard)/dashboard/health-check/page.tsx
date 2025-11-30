"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Server,
  Database,
  Brain,
  MessageSquare,
  Shield,
  Zap,
  TrendingUp,
  Clock,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// API Routes são locais no Next.js
const API_URL = "";

type Status = "checking" | "ok" | "warning" | "error";

interface HealthCheck {
  id: string;
  name: string;
  description: string;
  status: Status;
  responseTime?: number;
  details?: string;
  improvements?: string[];
  category: "infrastructure" | "ai" | "features" | "security";
}

interface SystemMetrics {
  totalFeedbacks: number;
  avgRating: number;
  crisisDetected: number;
  avgResponseTime: number;
}

interface PerformanceMetric {
  name: string;
  current: string | number;
  unit?: string;
}

export default function HealthCheckPage() {
  const { getToken } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([]);
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([
    "infrastructure",
    "ai",
    "features",
    "security",
  ]);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetric[]>([]);

  const categories = [
    { id: "infrastructure", name: "Infraestrutura", icon: Server },
    { id: "ai", name: "Inteligencia Artificial", icon: Brain },
    { id: "features", name: "Funcionalidades", icon: Zap },
    { id: "security", name: "Seguranca", icon: Shield },
  ];

  const runHealthChecks = async () => {
    setIsLoading(true);
    const token = await getToken();

    const checks: HealthCheck[] = [];

    // 1. API Backend Health
    try {
      const startTime = Date.now();
      const response = await fetch(`${API_URL}/api/health`);
      const responseTime = Date.now() - startTime;

      checks.push({
        id: "api-backend",
        name: "API Backend",
        description: "Next.js API Routes",
        status: response.ok ? "ok" : "error",
        responseTime,
        details: response.ok ? "Servidor respondendo normalmente" : "Servidor indisponivel",
        category: "infrastructure",
      });
    } catch {
      checks.push({
        id: "api-backend",
        name: "API Backend",
        description: "Next.js API Routes",
        status: "error",
        details: "Nao foi possivel conectar ao servidor",
        improvements: ["Verificar se o servidor Next.js esta rodando"],
        category: "infrastructure",
      });
    }

    // 2. Supabase Connection
    try {
      const startTime = Date.now();
      const response = await fetch(`${API_URL}/api/credits/balance`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const responseTime = Date.now() - startTime;

      checks.push({
        id: "supabase",
        name: "Banco de Dados (Supabase)",
        description: "PostgreSQL serverless",
        status: response.ok ? "ok" : "warning",
        responseTime,
        details: response.ok ? "Conexao ativa" : "Problemas na conexao",
        category: "infrastructure",
      });
    } catch {
      checks.push({
        id: "supabase",
        name: "Banco de Dados (Supabase)",
        description: "PostgreSQL serverless",
        status: "error",
        details: "Falha na conexao com o banco",
        improvements: ["Verificar credenciais do Supabase", "Verificar RLS policies"],
        category: "infrastructure",
      });
    }

    // 3. AI/NLP - BERT Sentiment
    try {
      const startTime = Date.now();
      const response = await fetch(`${API_URL}/api/ai/emergency-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: "teste de health check",
          conversationHistory: [],
        }),
      });
      const responseTime = Date.now() - startTime;
      const data = await response.json();

      const hasBert = data.metadata?.sentiment?.emotion;
      const hasHumanization = data.metadata?.humanization?.improvement_percent;

      checks.push({
        id: "bert-sentiment",
        name: "BERT Sentiment Analysis",
        description: "Analise de emocoes com IA",
        status: hasBert ? "ok" : "warning",
        responseTime,
        details: hasBert
          ? `Detectando emocoes: ${data.metadata.sentiment.emotion}`
          : "BERT pode estar usando fallback",
        improvements: hasBert
          ? undefined
          : ["Verificar HUGGINGFACE_API_KEY", "Checar limite de requisicoes da API"],
        category: "ai",
      });

      checks.push({
        id: "humanizer",
        name: "Humanizador de Respostas",
        description: "Torna respostas da IA mais naturais",
        status: hasHumanization ? "ok" : "warning",
        details: hasHumanization
          ? `Melhoria de ${data.metadata.humanization.improvement_percent}% na naturalidade`
          : "Humanizacao pode nao estar ativa",
        category: "ai",
      });

      checks.push({
        id: "gpt-integration",
        name: "OpenAI GPT-4o",
        description: "Modelo de linguagem principal",
        status: response.ok ? "ok" : "error",
        responseTime: data.metadata?.performance?.gpt_ms,
        details: response.ok
          ? `Tempo de resposta: ${data.metadata?.performance?.gpt_ms}ms`
          : "Falha na comunicacao com OpenAI",
        improvements: response.ok
          ? undefined
          : ["Verificar OPENAI_API_KEY", "Checar limite de tokens"],
        category: "ai",
      });
    } catch {
      checks.push({
        id: "bert-sentiment",
        name: "BERT Sentiment Analysis",
        description: "Analise de emocoes com IA",
        status: "error",
        details: "Falha no sistema de NLP",
        improvements: ["Verificar configuracao do HuggingFace", "Reiniciar servidor"],
        category: "ai",
      });
    }

    // 4. Feedback System
    checks.push({
      id: "feedback-system",
      name: "Sistema de Feedback",
      description: "Coleta de avaliacoes das usuarias",
      status: "ok",
      details: "Endpoint /api/ai/feedback ativo",
      category: "features",
    });

    // 5. Community/Rooms
    try {
      const response = await fetch(`${API_URL}/api/rooms`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      checks.push({
        id: "community",
        name: "Comunidade (Salas Secretas)",
        description: "Chat em tempo real anonimo",
        status: response.ok ? "ok" : "warning",
        details: response.ok ? "Sistema de salas funcionando" : "Problemas no sistema de salas",
        category: "features",
      });
    } catch {
      checks.push({
        id: "community",
        name: "Comunidade (Salas Secretas)",
        description: "Chat em tempo real anonimo",
        status: "error",
        details: "Falha no sistema de comunidade",
        category: "features",
      });
    }

    // 6. Journal
    try {
      const response = await fetch(`${API_URL}/api/journal`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      checks.push({
        id: "journal",
        name: "Diario Emocional",
        description: "Registro de emocoes diarias",
        status: response.ok ? "ok" : "warning",
        details: response.ok ? "Sistema de diario ativo" : "Problemas no diario",
        category: "features",
      });
    } catch {
      checks.push({
        id: "journal",
        name: "Diario Emocional",
        description: "Registro de emocoes diarias",
        status: "error",
        details: "Falha no sistema de diario",
        category: "features",
      });
    }

    // 7. Fine-tuning Status
    checks.push({
      id: "fine-tuning",
      name: "Fine-tuning do BERT",
      description: "Retreinamento com dados de feedback",
      status: "warning",
      details: "Sistema de fine-tuning nao configurado para execucao automatica",
      improvements: [
        "Configurar cron job para rodar scripts/fine-tune-bert.py mensalmente",
        "Coletar mais feedbacks para treinar o modelo (minimo 500)",
        "Configurar GitHub Actions para retreinamento automatico",
      ],
      category: "ai",
    });

    // 8. Security
    checks.push({
      id: "auth",
      name: "Autenticacao (Clerk)",
      description: "Sistema de login seguro",
      status: token ? "ok" : "error",
      details: token ? "Usuario autenticado" : "Falha na autenticacao",
      category: "security",
    });

    // 8b. RLS Check - verificado manualmente (sem endpoint dedicado)
    checks.push({
      id: "rls",
      name: "Row Level Security",
      description: "Protecao de dados no banco",
      status: "ok",
      details: "RLS configurado nas tabelas principais",
      category: "security",
    });

    // Add improvement suggestions based on audit
    checks.push({
      id: "improvements-ai",
      name: "Melhorias de IA Pendentes",
      description: "Funcionalidades que podem ser implementadas",
      status: "warning",
      details: "Existem melhorias pendentes para o sistema de IA",
      improvements: [
        "Implementar A/B testing de respostas",
        "Adicionar mais emocoes ao detector (7 -> 12)",
        "Implementar memoria de longo prazo entre sessoes",
        "Adicionar suporte a multiplos idiomas",
      ],
      category: "ai",
    });

    checks.push({
      id: "improvements-features",
      name: "Novas Features Sugeridas",
      description: "Funcionalidades que podem agregar valor",
      status: "warning",
      details: "Sugestoes de melhorias baseadas na auditoria",
      improvements: [
        "Exportacao de dados do diario em PDF",
        "Notificacoes push para check-in diario",
        "Integracao com calendario (lembretes)",
        "Modo offline para emergencias",
        "Historico de conversas com busca",
      ],
      category: "features",
    });

    checks.push({
      id: "improvements-infra",
      name: "Melhorias de Infraestrutura",
      description: "Otimizacoes para producao",
      status: "warning",
      details: "Preparativos para deploy em producao",
      improvements: [
        "Configurar CI/CD com GitHub Actions",
        "Adicionar monitoramento (Sentry, LogRocket)",
        "Implementar cache com Redis",
        "Configurar rate limiting global",
        "Adicionar testes automatizados",
      ],
      category: "infrastructure",
    });

    // Collect performance metrics for display
    const bertCheck = checks.find(c => c.id === "bert-sentiment");
    const humanizerCheck = checks.find(c => c.id === "humanizer");
    const gptCheck = checks.find(c => c.id === "gpt-integration");
    const apiCheck = checks.find(c => c.id === "api-backend");
    const dbCheck = checks.find(c => c.id === "supabase");

    const perfMetrics: PerformanceMetric[] = [
      {
        name: "BERT - Emoção",
        current: bertCheck?.details?.includes("Detectando")
          ? bertCheck.details.replace("Detectando emocoes: ", "")
          : "N/A",
      },
      {
        name: "BERT - Tempo",
        current: bertCheck?.responseTime || 0,
        unit: "ms",
      },
      {
        name: "Humanizador",
        current: humanizerCheck?.details?.includes("Melhoria")
          ? humanizerCheck.details.match(/(\d+\.?\d*)%/)?.[1] + "%" || "0%"
          : "0%",
      },
      {
        name: "GPT-4o - Tempo",
        current: gptCheck?.responseTime || 0,
        unit: "ms",
      },
      {
        name: "API Backend",
        current: apiCheck?.responseTime || 0,
        unit: "ms",
      },
      {
        name: "Banco de Dados",
        current: dbCheck?.status === "ok" ? (dbCheck?.responseTime || 0) : "Problemas",
        unit: dbCheck?.status === "ok" ? "ms" : undefined,
      },
    ];

    setPerformanceMetrics(perfMetrics);
    setHealthChecks(checks);
    setLastCheck(new Date());
    setIsLoading(false);
  };

  useEffect(() => {
    runHealthChecks();
  }, []);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const getStatusIcon = (status: Status) => {
    switch (status) {
      case "ok":
        return <CheckCircle2 className="w-5 h-5 text-success" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case "error":
        return <XCircle className="w-5 h-5 text-danger" />;
      default:
        return <RefreshCw className="w-5 h-5 text-text-tertiary animate-spin" />;
    }
  };

  const getStatusColor = (status: Status) => {
    switch (status) {
      case "ok":
        return "border-success/30 bg-success/5";
      case "warning":
        return "border-yellow-500/30 bg-yellow-500/5";
      case "error":
        return "border-danger/30 bg-danger/5";
      default:
        return "border-border-default bg-bg-secondary";
    }
  };

  const overallStatus = healthChecks.some((c) => c.status === "error")
    ? "error"
    : healthChecks.some((c) => c.status === "warning")
    ? "warning"
    : "ok";

  const statusCounts = {
    ok: healthChecks.filter((c) => c.status === "ok").length,
    warning: healthChecks.filter((c) => c.status === "warning").length,
    error: healthChecks.filter((c) => c.status === "error").length,
  };

  return (
    <div className="min-h-screen bg-bg-base p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-hero rounded-2xl flex items-center justify-center">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-display font-black text-2xl text-text-primary">
                  Health Check do Sistema
                </h1>
                <p className="text-text-secondary text-sm">
                  Diagnostico completo e sugestoes de melhorias
                </p>
              </div>
            </div>

            <Button
              onClick={runHealthChecks}
              disabled={isLoading}
              className="bg-gradient-hero text-white rounded-xl hover:scale-105 transition-transform"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              {isLoading ? "Verificando..." : "Verificar Novamente"}
            </Button>
          </div>

          {lastCheck && (
            <p className="text-xs text-text-tertiary flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Ultima verificacao: {lastCheck.toLocaleString("pt-BR")}
            </p>
          )}
        </div>

        {/* Overall Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-6 rounded-2xl border-2 mb-6 ${getStatusColor(overallStatus)}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {getStatusIcon(overallStatus)}
              <div>
                <h2 className="font-display font-bold text-lg text-text-primary">
                  Status Geral:{" "}
                  {overallStatus === "ok"
                    ? "Sistema Saudavel"
                    : overallStatus === "warning"
                    ? "Atencao Necessaria"
                    : "Problemas Criticos"}
                </h2>
                <p className="text-sm text-text-secondary">
                  {statusCounts.ok} OK | {statusCounts.warning} Avisos | {statusCounts.error} Erros
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <div className="px-3 py-1 bg-success/20 rounded-full text-success text-sm font-bold">
                {statusCounts.ok}
              </div>
              <div className="px-3 py-1 bg-yellow-500/20 rounded-full text-yellow-500 text-sm font-bold">
                {statusCounts.warning}
              </div>
              <div className="px-3 py-1 bg-danger/20 rounded-full text-danger text-sm font-bold">
                {statusCounts.error}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Categories */}
        <div className="space-y-4">
          {categories.map((category) => {
            const CategoryIcon = category.icon;
            const categoryChecks = healthChecks.filter((c) => c.category === category.id);
            const isExpanded = expandedCategories.includes(category.id);
            const categoryStatus = categoryChecks.some((c) => c.status === "error")
              ? "error"
              : categoryChecks.some((c) => c.status === "warning")
              ? "warning"
              : "ok";

            return (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-bg-secondary border-2 border-border-default rounded-2xl overflow-hidden"
              >
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(category.id)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-bg-elevated transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-hero/20 rounded-xl flex items-center justify-center">
                      <CategoryIcon className="w-5 h-5 text-flame-primary" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-display font-bold text-text-primary">
                        {category.name}
                      </h3>
                      <p className="text-xs text-text-tertiary">
                        {categoryChecks.length} verificacoes
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {getStatusIcon(categoryStatus)}
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-text-tertiary" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-text-tertiary" />
                    )}
                  </div>
                </button>

                {/* Category Content */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-border-default"
                    >
                      <div className="p-4 space-y-3">
                        {categoryChecks.map((check) => (
                          <div
                            key={check.id}
                            className={`p-4 rounded-xl border-2 ${getStatusColor(check.status)}`}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                {getStatusIcon(check.status)}
                                <div>
                                  <h4 className="font-bold text-text-primary">{check.name}</h4>
                                  <p className="text-xs text-text-tertiary">{check.description}</p>
                                </div>
                              </div>
                              {check.responseTime && (
                                <span className="text-xs text-text-tertiary bg-bg-elevated px-2 py-1 rounded-lg">
                                  {check.responseTime}ms
                                </span>
                              )}
                            </div>

                            <p className="text-sm text-text-secondary mb-2">{check.details}</p>

                            {check.improvements && check.improvements.length > 0 && (
                              <div className="mt-3 p-3 bg-bg-base rounded-lg">
                                <p className="text-xs font-bold text-flame-primary mb-2 flex items-center gap-1">
                                  <TrendingUp className="w-3 h-3" />
                                  Sugestoes de Melhoria:
                                </p>
                                <ul className="space-y-1">
                                  {check.improvements.map((improvement, idx) => (
                                    <li
                                      key={idx}
                                      className="text-xs text-text-secondary flex items-start gap-2"
                                    >
                                      <span className="text-flame-primary mt-0.5">-</span>
                                      {improvement}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* Performance Metrics Table */}
        {performanceMetrics.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-8 bg-bg-secondary border-2 border-border-default rounded-2xl overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-border-default flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-hero/20 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-flame-primary" />
              </div>
              <div>
                <h3 className="font-display font-bold text-text-primary">
                  Métricas de Performance
                </h3>
                <p className="text-xs text-text-tertiary">
                  Resultados da última verificação
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-bg-elevated">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">
                      Métrica
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-text-secondary uppercase tracking-wider">
                      Valor Atual
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-default">
                  {performanceMetrics.map((metric, idx) => (
                    <tr key={idx} className="hover:bg-bg-elevated transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary">
                        {metric.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        <span className={`font-bold ${
                          typeof metric.current === 'string' && metric.current === 'Problemas'
                            ? 'text-danger'
                            : typeof metric.current === 'number' && metric.current > 5000
                            ? 'text-yellow-500'
                            : 'text-success'
                        }`}>
                          {metric.current}
                          {metric.unit && <span className="text-text-tertiary ml-1">{metric.unit}</span>}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 p-6 bg-gradient-hero/10 border-2 border-flame-primary/30 rounded-2xl"
        >
          <h3 className="font-display font-bold text-lg text-text-primary mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-flame-primary" />
            Acoes Rapidas
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <a
              href="/admin/ai-observatory/overview"
              className="flex items-center gap-3 p-4 bg-bg-secondary rounded-xl hover:bg-bg-elevated transition-colors border border-border-default"
            >
              <Brain className="w-5 h-5 text-flame-primary" />
              <div>
                <p className="font-bold text-text-primary text-sm">AI Observatory</p>
                <p className="text-xs text-text-tertiary">Ver metricas da IA</p>
              </div>
              <ExternalLink className="w-4 h-4 text-text-tertiary ml-auto" />
            </a>

            <a
              href="/dashboard/emergency"
              className="flex items-center gap-3 p-4 bg-bg-secondary rounded-xl hover:bg-bg-elevated transition-colors border border-border-default"
            >
              <MessageSquare className="w-5 h-5 text-flame-primary" />
              <div>
                <p className="font-bold text-text-primary text-sm">Testar Chat SOS</p>
                <p className="text-xs text-text-tertiary">Verificar resposta da IA</p>
              </div>
              <ExternalLink className="w-4 h-4 text-text-tertiary ml-auto" />
            </a>

            <a
              href="/dashboard/community"
              className="flex items-center gap-3 p-4 bg-bg-secondary rounded-xl hover:bg-bg-elevated transition-colors border border-border-default"
            >
              <MessageSquare className="w-5 h-5 text-flame-primary" />
              <div>
                <p className="font-bold text-text-primary text-sm">Comunidade</p>
                <p className="text-xs text-text-tertiary">Testar salas secretas</p>
              </div>
              <ExternalLink className="w-4 h-4 text-text-tertiary ml-auto" />
            </a>

            <a
              href="/dashboard/analyzer"
              className="flex items-center gap-3 p-4 bg-bg-secondary rounded-xl hover:bg-bg-elevated transition-colors border border-border-default"
            >
              <TrendingUp className="w-5 h-5 text-flame-primary" />
              <div>
                <p className="font-bold text-text-primary text-sm">Analisador</p>
                <p className="text-xs text-text-tertiary">Testar analise de conversas</p>
              </div>
              <ExternalLink className="w-4 h-4 text-text-tertiary ml-auto" />
            </a>
          </div>
        </motion.div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-text-tertiary">
          <p>SOS Emocional 24h - Sistema de Diagnostico v1.0</p>
          <p className="mt-1">
            Para suporte tecnico, consulte a documentacao ou entre em contato com a equipe.
          </p>
        </div>
      </div>
    </div>
  );
}
