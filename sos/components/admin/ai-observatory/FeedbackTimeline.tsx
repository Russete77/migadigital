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

interface FeedbackTimelineProps {
  feedbacks: any[];
}

export function FeedbackTimeline({ feedbacks }: FeedbackTimelineProps) {
  if (!feedbacks || feedbacks.length === 0) {
    return null;
  }

  // Agrupar por data
  const dataByDate: Record<string, number[]> = {};

  feedbacks.forEach((f) => {
    const date = new Date(f.created_at).toISOString().split('T')[0];
    if (!dataByDate[date]) {
      dataByDate[date] = [];
    }
    dataByDate[date].push(f.user_feedback);
  });

  const chartData = Object.entries(dataByDate)
    .map(([date, ratings]) => ({
      date: new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
      rating_medio: (ratings.reduce((sum, r) => sum + r, 0) / ratings.length).toFixed(2),
      total_feedbacks: ratings.length,
    }))
    .sort(
      (a, b) =>
        new Date(a.date.split('/').reverse().join('-')).getTime() -
        new Date(b.date.split('/').reverse().join('-')).getTime()
    );

  return (
    <div className="bg-bg-secondary rounded-xl shadow-tinder-sm border border-border-default p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-text-primary">Evolução do Rating</h2>
        <p className="text-sm text-text-secondary mt-1">Rating médio ao longo do tempo</p>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" stroke="#9ca3af" style={{ fontSize: '12px' }} />
          <YAxis
            stroke="#9ca3af"
            style={{ fontSize: '12px' }}
            domain={[0, 5]}
            ticks={[0, 1, 2, 3, 4, 5]}
          />
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
            dataKey="rating_medio"
            stroke="#fbbf24"
            strokeWidth={3}
            name="Rating Médio"
            dot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
