'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface CrisisTimelineProps {
  crises: any[];
}

export function CrisisTimeline({ crises }: CrisisTimelineProps) {
  if (!crises || crises.length === 0) {
    return (
      <div className="bg-bg-secondary rounded-xl shadow-tinder-sm border border-border-default p-12 text-center">
        <p className="text-text-tertiary">Nenhuma crise detectada ainda</p>
        <p className="text-sm text-text-tertiary mt-2">Isso é ótimo! 🎉</p>
      </div>
    );
  }

  // Agrupar por data
  const dataByDate: Record<string, number> = {};

  crises.forEach((c) => {
    const date = new Date(c.created_at).toISOString().split('T')[0];
    dataByDate[date] = (dataByDate[date] || 0) + 1;
  });

  const chartData = Object.entries(dataByDate)
    .map(([date, count]) => ({
      date: new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
      crises: count,
    }))
    .sort(
      (a, b) =>
        new Date(a.date.split('/').reverse().join('-')).getTime() -
        new Date(b.date.split('/').reverse().join('-')).getTime()
    );

  return (
    <div className="bg-bg-secondary rounded-xl shadow-tinder-sm border border-border-default p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-text-primary">Timeline de Crises</h2>
        <p className="text-sm text-text-secondary mt-1">Crises detectadas ao longo do tempo</p>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" stroke="#9ca3af" style={{ fontSize: '12px' }} />
          <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-default)',
              borderRadius: '8px',
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="crises"
            stroke="#f87171"
            strokeWidth={3}
            name="Crises Detectadas"
            dot={{ r: 5, fill: '#dc2626' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
