'use client';

import { useState, useEffect } from 'react';
import {
  Brain,
  Zap,
  TrendingUp,
  FlaskConical,
  Settings2,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Target,
} from 'lucide-react';

interface MLOpsData {
  kpis: {
    totalResponses: number;
    avgBertTime: number;
    avgImprovement: string;
    activeExperiments: number;
    activeTemplates: number;
  };
  modelStats: Array<{
    model: string;
    count: number;
    avgConfidence: string;
    avgTime: number;
  }>;
  topTemplates: Array<{
    name: string;
    emotion: string;
    avgRating: number;
    timesUsed: number;
    positiveRate: string | number;
  }>;
  abExperiments: Array<{
    name: string;
    status: string;
    type: string;
    controlAvgRating: number;
    variantAvgRating: number;
    controlImpressions: number;
    variantImpressions: number;
    isSignificant: boolean;
    winner: string | null;
    lift: string | number;
  }>;
  humanizerWeights: Array<{
    rule: string;
    type: string;
    baseWeight: number;
    learnedWeight: number;
    confidence: number;
    timesApplied: number;
    positiveCorrelation: number;
    negativeCorrelation: number;
  }>;
  emotionDistribution: Record<string, number>;
}

export default function MLOpsDashboard() {
  const [data, setData] = useState<MLOpsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/mlops?days=${days}`);
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [days]);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <RefreshCw className="w-8 h-8 animate-spin text-flame-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3">
            <Brain className="w-8 h-8 text-flame-primary" />
            ML Ops Dashboard
          </h1>
          <p className="mt-2 text-text-secondary">
            Monitoramento de modelos, experimentos e aprendizado contínuo
          </p>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={days}
            onChange={(e) => setDays(parseInt(e.target.value))}
            className="px-4 py-2 rounded-lg border border-border-default bg-bg-secondary text-text-primary"
          >
            <option value={7}>Últimos 7 dias</option>
            <option value={14}>Últimos 14 dias</option>
            <option value={30}>Últimos 30 dias</option>
          </select>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-flame-primary text-white hover:bg-flame-primary/90"
          >
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <KPICard
          title="Total Respostas"
          value={data.kpis.totalResponses.toLocaleString()}
          icon={<Brain className="w-6 h-6" />}
          color="blue"
        />
        <KPICard
          title="Tempo BERT"
          value={`${data.kpis.avgBertTime}ms`}
          icon={<Zap className="w-6 h-6" />}
          color="yellow"
        />
        <KPICard
          title="Melhoria Humaniz."
          value={`${data.kpis.avgImprovement}%`}
          icon={<TrendingUp className="w-6 h-6" />}
          color="green"
        />
        <KPICard
          title="Experimentos A/B"
          value={data.kpis.activeExperiments.toString()}
          icon={<FlaskConical className="w-6 h-6" />}
          color="purple"
        />
        <KPICard
          title="Templates Ativos"
          value={data.kpis.activeTemplates.toString()}
          icon={<Settings2 className="w-6 h-6" />}
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Model Stats */}
        <div className="bg-bg-secondary rounded-xl shadow-tinder-sm border border-border-default p-6">
          <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
            <Brain className="w-5 h-5 text-blue-500" />
            Performance dos Modelos BERT
          </h2>
          <div className="space-y-4">
            {data.modelStats.length === 0 ? (
              <p className="text-text-tertiary">Nenhum dado ainda</p>
            ) : (
              data.modelStats.map((model) => (
                <div key={model.model} className="p-4 bg-bg-elevated rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-text-primary">{model.model}</span>
                    <span className="text-sm text-text-secondary">{model.count} usos</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-text-tertiary">Confiança:</span>
                      <span className="ml-2 font-semibold text-green-600">{model.avgConfidence}%</span>
                    </div>
                    <div>
                      <span className="text-text-tertiary">Tempo:</span>
                      <span className="ml-2 font-semibold text-blue-600">{model.avgTime}ms</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Templates */}
        <div className="bg-bg-secondary rounded-xl shadow-tinder-sm border border-border-default p-6">
          <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-green-500" />
            Templates com Melhor Performance
          </h2>
          <div className="space-y-3">
            {data.topTemplates.length === 0 ? (
              <p className="text-text-tertiary">Nenhum template ainda</p>
            ) : (
              data.topTemplates.map((template, idx) => (
                <div key={template.name} className="flex items-center gap-4 p-3 bg-bg-elevated rounded-lg">
                  <span className="text-2xl font-bold text-text-tertiary">#{idx + 1}</span>
                  <div className="flex-1">
                    <p className="font-medium text-text-primary">{template.name}</p>
                    <p className="text-sm text-text-secondary capitalize">{template.emotion}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-yellow-600">
                      {template.avgRating?.toFixed(1) || 'N/A'} ★
                    </p>
                    <p className="text-xs text-text-tertiary">{template.timesUsed} usos</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* A/B Experiments */}
      <div className="bg-bg-secondary rounded-xl shadow-tinder-sm border border-border-default p-6">
        <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
          <FlaskConical className="w-5 h-5 text-purple-500" />
          Experimentos A/B
        </h2>
        {data.abExperiments.length === 0 ? (
          <p className="text-text-tertiary">Nenhum experimento configurado</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-default">
                  <th className="text-left py-3 px-4 text-text-secondary font-medium">Nome</th>
                  <th className="text-left py-3 px-4 text-text-secondary font-medium">Status</th>
                  <th className="text-center py-3 px-4 text-text-secondary font-medium">Controle</th>
                  <th className="text-center py-3 px-4 text-text-secondary font-medium">Variante</th>
                  <th className="text-center py-3 px-4 text-text-secondary font-medium">Lift</th>
                  <th className="text-center py-3 px-4 text-text-secondary font-medium">Vencedor</th>
                </tr>
              </thead>
              <tbody>
                {data.abExperiments.map((exp) => (
                  <tr key={exp.name} className="border-b border-border-default/50">
                    <td className="py-3 px-4">
                      <p className="font-medium text-text-primary">{exp.name}</p>
                      <p className="text-xs text-text-tertiary">{exp.type}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        exp.status === 'running' ? 'bg-green-100 text-green-700' :
                        exp.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {exp.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <p className="font-semibold">{exp.controlAvgRating?.toFixed(2) || '-'}</p>
                      <p className="text-xs text-text-tertiary">{exp.controlImpressions} imp.</p>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <p className="font-semibold">{exp.variantAvgRating?.toFixed(2) || '-'}</p>
                      <p className="text-xs text-text-tertiary">{exp.variantImpressions} imp.</p>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`font-bold ${
                        Number(exp.lift) > 0 ? 'text-green-600' :
                        Number(exp.lift) < 0 ? 'text-red-600' :
                        'text-text-tertiary'
                      }`}>
                        {Number(exp.lift) > 0 ? '+' : ''}{exp.lift}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {exp.isSignificant ? (
                        <span className={`flex items-center justify-center gap-1 ${
                          exp.winner === 'variant' ? 'text-green-600' : 'text-blue-600'
                        }`}>
                          <CheckCircle className="w-4 h-4" />
                          {exp.winner}
                        </span>
                      ) : (
                        <span className="text-text-tertiary flex items-center justify-center gap-1">
                          <Clock className="w-4 h-4" />
                          Aguardando
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Humanizer Weights */}
      <div className="bg-bg-secondary rounded-xl shadow-tinder-sm border border-border-default p-6">
        <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
          <Settings2 className="w-5 h-5 text-orange-500" />
          Pesos do Humanizador (Aprendidos)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.humanizerWeights.length === 0 ? (
            <p className="text-text-tertiary col-span-full">Nenhum peso configurado</p>
          ) : (
            data.humanizerWeights.map((weight) => (
              <div key={weight.rule} className="p-4 bg-bg-elevated rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-text-primary">{weight.rule}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    weight.type === 'marker' ? 'bg-blue-100 text-blue-700' :
                    weight.type === 'contraction' ? 'bg-green-100 text-green-700' :
                    weight.type === 'emoji' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {weight.type}
                  </span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-tertiary">Peso Base:</span>
                    <span>{weight.baseWeight.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-tertiary">Peso Aprendido:</span>
                    <span className={`font-semibold ${
                      weight.learnedWeight > weight.baseWeight ? 'text-green-600' :
                      weight.learnedWeight < weight.baseWeight ? 'text-red-600' :
                      'text-text-primary'
                    }`}>
                      {weight.learnedWeight.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-tertiary">Confiança:</span>
                    <span>{(weight.confidence * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-green-600">+{weight.positiveCorrelation}</span>
                    <span className="text-red-600">-{weight.negativeCorrelation}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function KPICard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'yellow' | 'purple' | 'orange';
}) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
  };

  return (
    <div className="bg-bg-secondary rounded-xl shadow-tinder-sm border border-border-default p-4">
      <div className={`w-10 h-10 rounded-lg ${colors[color]} flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <p className="text-sm text-text-secondary">{title}</p>
      <p className="text-2xl font-bold text-text-primary">{value}</p>
    </div>
  );
}
