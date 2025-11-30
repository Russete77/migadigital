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

interface PerformanceChartsProps {
  responses: any[];
}

export function PerformanceCharts({ responses }: PerformanceChartsProps) {
  if (!responses || responses.length === 0) {
    return null;
  }

  // Agrupar por data
  const dataByDate: Record<
    string,
    { total: number[]; bert: number[]; gpt: number[]; humanizer: number[] }
  > = {};

  responses.forEach((r) => {
    const date = new Date(r.created_at).toISOString().split('T')[0];
    if (!dataByDate[date]) {
      dataByDate[date] = { total: [], bert: [], gpt: [], humanizer: [] };
    }
    dataByDate[date].total.push(r.processing_time_ms || 0);
    dataByDate[date].bert.push(r.bert_time_ms || 0);
    dataByDate[date].gpt.push(r.gpt_time_ms || 0);
    dataByDate[date].humanizer.push(r.humanizer_time_ms || 0);
  });

  const chartData = Object.entries(dataByDate)
    .map(([date, values]) => ({
      date: new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
      total: (values.total.reduce((sum, v) => sum + v, 0) / values.total.length).toFixed(0),
      bert: (values.bert.reduce((sum, v) => sum + v, 0) / values.bert.length).toFixed(0),
      gpt: (values.gpt.reduce((sum, v) => sum + v, 0) / values.gpt.length).toFixed(0),
      humanizer:
        (values.humanizer.reduce((sum, v) => sum + v, 0) / values.humanizer.length).toFixed(0),
    }))
    .sort(
      (a, b) =>
        new Date(a.date.split('/').reverse().join('-')).getTime() -
        new Date(b.date.split('/').reverse().join('-')).getTime()
    );

  return (
    <div className="bg-bg-secondary rounded-xl shadow-tinder-sm border border-border-default p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-text-primary">Evolução da Performance</h2>
        <p className="text-sm text-text-secondary mt-1">Latência média de cada componente ao longo do tempo</p>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" stroke="#9ca3af" style={{ fontSize: '12px' }} />
          <YAxis
            stroke="#9ca3af"
            style={{ fontSize: '12px' }}
            label={{ value: 'Latência (ms)', angle: -90, position: 'insideLeft' }}
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
            dataKey="total"
            stroke="#3b82f6"
            strokeWidth={3}
            name="Total"
            dot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="bert"
            stroke="#a78bfa"
            strokeWidth={2}
            name="BERT"
            dot={{ r: 3 }}
          />
          <Line
            type="monotone"
            dataKey="gpt"
            stroke="#60a5fa"
            strokeWidth={2}
            name="GPT-4o"
            dot={{ r: 3 }}
          />
          <Line
            type="monotone"
            dataKey="humanizer"
            stroke="#34d399"
            strokeWidth={2}
            name="Humanizer"
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
