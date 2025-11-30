'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface UrgencyDistributionProps {
  data: Record<string, number>;
}

const URGENCY_LABELS: Record<string, string> = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
  critica: 'Crítica',
};

const URGENCY_COLORS: Record<string, string> = {
  baixa: '#34d399',
  media: '#fbbf24',
  alta: '#fb923c',
  critica: '#f87171',
};

const URGENCY_ORDER = ['baixa', 'media', 'alta', 'critica'];

export function UrgencyDistribution({ data }: UrgencyDistributionProps) {
  // Transformar e ordenar dados
  const chartData = URGENCY_ORDER
    .map((urgency) => ({
      name: URGENCY_LABELS[urgency],
      value: data[urgency] || 0,
      color: URGENCY_COLORS[urgency],
    }));

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="bg-bg-secondary rounded-xl shadow-tinder-sm border border-border-default p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-text-primary">Níveis de Urgência</h2>
        <p className="text-sm text-text-secondary mt-1">
          Últimos 7 dias • {total} classificações
        </p>
      </div>

      {total === 0 ? (
        <div className="h-80 flex items-center justify-center">
          <p className="text-text-tertiary">Nenhuma urgência detectada ainda</p>
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="name"
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
              />
              <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Percentuais */}
          <div className="grid grid-cols-4 gap-2 mt-4">
            {chartData.map((item) => (
              <div key={item.name} className="text-center">
                <div
                  className="w-full h-2 rounded-full mb-2"
                  style={{ backgroundColor: item.color }}
                />
                <p className="text-xs text-text-secondary">{item.name}</p>
                <p className="text-lg font-bold text-text-primary">
                  {total > 0 ? ((item.value / total) * 100).toFixed(0) : 0}%
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
