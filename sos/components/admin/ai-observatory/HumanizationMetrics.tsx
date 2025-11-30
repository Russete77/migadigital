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

interface HumanizationMetricsProps {
  responses: any[];
}

export function HumanizationMetrics({ responses }: HumanizationMetricsProps) {
  if (!responses || responses.length === 0) {
    return null;
  }

  // Agrupar por data
  const dataByDate: Record<string, { before: number[]; after: number[] }> = {};

  responses.forEach((r) => {
    const date = new Date(r.created_at).toISOString().split('T')[0];
    if (!dataByDate[date]) {
      dataByDate[date] = { before: [], after: [] };
    }
    dataByDate[date].before.push(r.roboticness_before);
    dataByDate[date].after.push(r.roboticness_after);
  });

  const chartData = Object.entries(dataByDate)
    .map(([date, values]) => ({
      date: new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
      antes:
        ((values.before.reduce((sum, v) => sum + v, 0) / values.before.length) * 100).toFixed(1),
      depois:
        ((values.after.reduce((sum, v) => sum + v, 0) / values.after.length) * 100).toFixed(1),
      melhoria: (
        ((values.before.reduce((sum, v) => sum + v, 0) / values.before.length -
          values.after.reduce((sum, v) => sum + v, 0) / values.after.length) /
          (values.before.reduce((sum, v) => sum + v, 0) / values.before.length)) *
        100
      ).toFixed(1),
    }))
    .sort(
      (a, b) =>
        new Date(a.date.split('/').reverse().join('-')).getTime() -
        new Date(b.date.split('/').reverse().join('-')).getTime()
    );

  return (
    <div className="bg-bg-secondary rounded-xl shadow-tinder-sm border border-border-default p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-text-primary">Evolução da Humanização</h2>
        <p className="text-sm text-text-secondary mt-1">
          Roboticness antes e depois ao longo do tempo
        </p>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" stroke="#9ca3af" style={{ fontSize: '12px' }} />
          <YAxis
            stroke="#9ca3af"
            style={{ fontSize: '12px' }}
            label={{ value: 'Roboticness (%)', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="antes"
            stroke="#f87171"
            strokeWidth={2}
            name="Antes (GPT)"
            dot={{ r: 4 }}
            strokeDasharray="5 5"
          />
          <Line
            type="monotone"
            dataKey="depois"
            stroke="#34d399"
            strokeWidth={2}
            name="Depois (NLP)"
            dot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="melhoria"
            stroke="#3b82f6"
            strokeWidth={2}
            name="Melhoria (%)"
            dot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
