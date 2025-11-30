'use client';

import { TrendingUp, Brain, AlertTriangle, Star } from 'lucide-react';

interface KPICardsProps {
  totalResponses: number;
  humanizationPercent: number;
  totalCrises: number;
  avgRating: number;
}

export function KPICards({
  totalResponses,
  humanizationPercent,
  totalCrises,
  avgRating,
}: KPICardsProps) {
  const kpis = [
    {
      name: 'Total de Respostas',
      value: totalResponses.toLocaleString('pt-BR'),
      change: '+12% vs. semana passada',
      icon: TrendingUp,
      color: 'blue',
      trend: 'up',
    },
    {
      name: 'Humanização',
      value: `${humanizationPercent.toFixed(1)}%`,
      subtitle: 'Melhoria vs. resposta bruta',
      icon: Brain,
      color: 'green',
      trend: 'up',
    },
    {
      name: 'Crises Detectadas',
      value: totalCrises.toString(),
      subtitle: 'Últimos 7 dias',
      icon: AlertTriangle,
      color: 'red',
      trend: 'neutral',
    },
    {
      name: 'Rating Médio',
      value: avgRating > 0 ? avgRating.toFixed(1) : 'N/A',
      subtitle: avgRating > 0 ? `${(avgRating / 5 * 100).toFixed(0)}% de satisfação` : 'Aguardando feedbacks',
      icon: Star,
      color: 'yellow',
      trend: 'up',
    },
  ];

  const colorClasses: Record<string, { bg: string; text: string; icon: string }> = {
    blue: {
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      icon: 'bg-blue-100',
    },
    green: {
      bg: 'bg-green-50',
      text: 'text-green-600',
      icon: 'bg-green-100',
    },
    red: {
      bg: 'bg-red-50',
      text: 'text-red-600',
      icon: 'bg-red-100',
    },
    yellow: {
      bg: 'bg-yellow-50',
      text: 'text-yellow-600',
      icon: 'bg-yellow-100',
    },
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {kpis.map((kpi) => {
        const colors = colorClasses[kpi.color];
        const Icon = kpi.icon;

        return (
          <div
            key={kpi.name}
            className="bg-bg-secondary rounded-xl shadow-tinder-sm border border-border-default p-6 hover:shadow-tinder-md transition-shadow"
          >
            {/* Icon */}
            <div className={`w-12 h-12 rounded-lg ${colors.icon} flex items-center justify-center mb-4`}>
              <Icon className={`w-6 h-6 ${colors.text}`} />
            </div>

            {/* Name */}
            <p className="text-sm font-medium text-text-secondary mb-1">{kpi.name}</p>

            {/* Value */}
            <p className={`text-3xl font-bold ${colors.text} mb-2`}>
              {kpi.value}
            </p>

            {/* Subtitle/Change */}
            {kpi.subtitle && (
              <p className="text-sm text-text-tertiary">{kpi.subtitle}</p>
            )}
            {kpi.change && (
              <p className="text-sm text-success flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                {kpi.change}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
