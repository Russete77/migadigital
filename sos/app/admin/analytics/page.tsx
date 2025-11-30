'use client';

import { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  MessageSquare,
  Clock,
  Calendar,
  RefreshCw,
  Brain,
  Heart,
  Activity,
} from 'lucide-react';

interface AnalyticsData {
  overview: {
    totalUsers: number;
    totalConversations: number;
    totalMessages: number;
    avgSessionDuration: number;
    userGrowth: number;
    messageGrowth: number;
  };
  daily: {
    date: string;
    users: number;
    conversations: number;
    messages: number;
  }[];
  topHours: {
    hour: number;
    count: number;
  }[];
  engagement: {
    avgMessagesPerConversation: number;
    avgConversationsPerUser: number;
    returnRate: number;
  };
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('7d');

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/analytics?period=${period}`);
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Erro ao buscar analytics:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${Math.round(minutes)}min`;
    return `${Math.round(minutes / 60)}h ${Math.round(minutes % 60)}min`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <RefreshCw className="w-8 h-8 animate-spin text-flame-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-flame-primary" />
            Analytics
          </h1>
          <p className="mt-2 text-text-secondary">
            Metricas de uso e engajamento da plataforma
          </p>
        </div>

        {/* Period Selector */}
        <div className="flex items-center gap-2 bg-bg-secondary rounded-lg p-1 border border-border-default">
          {(['7d', '30d', '90d'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                period === p
                  ? 'bg-flame-primary text-white'
                  : 'text-text-secondary hover:bg-bg-elevated'
              }`}
            >
              {p === '7d' ? '7 dias' : p === '30d' ? '30 dias' : '90 dias'}
            </button>
          ))}
        </div>
      </div>

      {data && (
        <>
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-bg-secondary rounded-xl p-6 border border-border-default">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-secondary">Total de Usuarias</p>
                  <p className="text-3xl font-bold text-text-primary mt-1">
                    {formatNumber(data.overview.totalUsers)}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <div className={`flex items-center gap-1 mt-4 text-sm ${
                data.overview.userGrowth >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {data.overview.userGrowth >= 0 ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                <span>{Math.abs(data.overview.userGrowth)}% vs periodo anterior</span>
              </div>
            </div>

            <div className="bg-bg-secondary rounded-xl p-6 border border-border-default">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-secondary">Conversas</p>
                  <p className="text-3xl font-bold text-text-primary mt-1">
                    {formatNumber(data.overview.totalConversations)}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <MessageSquare className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="text-sm text-text-tertiary mt-4">
                {data.engagement.avgConversationsPerUser.toFixed(1)} conversas/usuaria
              </div>
            </div>

            <div className="bg-bg-secondary rounded-xl p-6 border border-border-default">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-secondary">Mensagens</p>
                  <p className="text-3xl font-bold text-text-primary mt-1">
                    {formatNumber(data.overview.totalMessages)}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <Activity className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div className={`flex items-center gap-1 mt-4 text-sm ${
                data.overview.messageGrowth >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {data.overview.messageGrowth >= 0 ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                <span>{Math.abs(data.overview.messageGrowth)}% vs periodo anterior</span>
              </div>
            </div>

            <div className="bg-bg-secondary rounded-xl p-6 border border-border-default">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-secondary">Tempo Medio</p>
                  <p className="text-3xl font-bold text-text-primary mt-1">
                    {formatDuration(data.overview.avgSessionDuration)}
                  </p>
                </div>
                <div className="p-3 bg-orange-100 rounded-lg">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
              </div>
              <div className="text-sm text-text-tertiary mt-4">
                por sessao de conversa
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Activity Chart */}
            <div className="bg-bg-secondary rounded-xl p-6 border border-border-default">
              <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-flame-primary" />
                Atividade Diaria
              </h3>
              <div className="space-y-3">
                {data.daily.slice(-7).map((day) => (
                  <div key={day.date} className="flex items-center gap-4">
                    <span className="text-sm text-text-tertiary w-24">
                      {new Date(day.date).toLocaleDateString('pt-BR', {
                        weekday: 'short',
                        day: '2-digit',
                      })}
                    </span>
                    <div className="flex-1 bg-bg-elevated rounded-full h-6 overflow-hidden">
                      <div
                        className="h-full bg-flame-primary/80 rounded-full flex items-center justify-end pr-2"
                        style={{
                          width: `${Math.min(100, (day.messages / Math.max(...data.daily.map(d => d.messages))) * 100)}%`
                        }}
                      >
                        <span className="text-xs text-white font-medium">
                          {day.messages}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Peak Hours */}
            <div className="bg-bg-secondary rounded-xl p-6 border border-border-default">
              <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-flame-primary" />
                Horarios de Pico
              </h3>
              <div className="grid grid-cols-6 gap-2">
                {Array.from({ length: 24 }, (_, hour) => {
                  const hourData = data.topHours.find(h => h.hour === hour);
                  const maxCount = Math.max(...data.topHours.map(h => h.count), 1);
                  const intensity = hourData ? hourData.count / maxCount : 0;
                  return (
                    <div
                      key={hour}
                      className="aspect-square rounded-lg flex items-center justify-center text-xs font-medium transition-colors"
                      style={{
                        backgroundColor: intensity > 0
                          ? `rgba(239, 68, 68, ${0.2 + intensity * 0.8})`
                          : 'var(--bg-elevated)',
                        color: intensity > 0.5 ? 'white' : 'var(--text-secondary)',
                      }}
                      title={`${hour}h: ${hourData?.count || 0} mensagens`}
                    >
                      {hour}h
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-text-tertiary mt-4 text-center">
                Intensidade de uso por hora do dia
              </p>
            </div>
          </div>

          {/* Engagement Metrics */}
          <div className="bg-bg-secondary rounded-xl p-6 border border-border-default">
            <h3 className="text-lg font-semibold text-text-primary mb-6 flex items-center gap-2">
              <Heart className="w-5 h-5 text-flame-primary" />
              Metricas de Engajamento
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-4xl font-bold text-flame-primary">
                  {data.engagement.avgMessagesPerConversation.toFixed(1)}
                </p>
                <p className="text-sm text-text-secondary mt-2">
                  Mensagens por conversa
                </p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-bold text-flame-primary">
                  {data.engagement.avgConversationsPerUser.toFixed(1)}
                </p>
                <p className="text-sm text-text-secondary mt-2">
                  Conversas por usuaria
                </p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-bold text-flame-primary">
                  {data.engagement.returnRate.toFixed(0)}%
                </p>
                <p className="text-sm text-text-secondary mt-2">
                  Taxa de retorno
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
