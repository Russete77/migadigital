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

interface SentimentTrendsProps {
  data: any[];
}

const EMOTION_COLORS: Record<string, string> = {
  triste: '#60a5fa',
  ansiosa: '#fbbf24',
  raiva: '#f87171',
  feliz: '#34d399',
  confusa: '#a78bfa',
  esperancosa: '#22d3ee',
  desesperada: '#fb923c',
};

export function SentimentTrends({ data }: SentimentTrendsProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-bg-secondary rounded-xl shadow-tinder-sm border border-border-default p-12 text-center">
        <p className="text-text-tertiary">Nenhum dado de tendência ainda</p>
      </div>
    );
  }

  // Identificar quais emoções aparecem nos dados
  const emotions = new Set<string>();
  data.forEach((day) => {
    Object.keys(day).forEach((key) => {
      if (key !== 'date' && EMOTION_COLORS[key]) {
        emotions.add(key);
      }
    });
  });

  return (
    <div className="bg-bg-secondary rounded-xl shadow-tinder-sm border border-border-default p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-text-primary">Tendências de Emoções (30 dias)</h2>
        <p className="text-sm text-text-secondary mt-1">
          Evolução das emoções detectadas ao longo do tempo
        </p>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" stroke="#9ca3af" style={{ fontSize: '12px' }} />
          <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
          />
          <Legend />
          {Array.from(emotions).map((emotion) => (
            <Line
              key={emotion}
              type="monotone"
              dataKey={emotion}
              stroke={EMOTION_COLORS[emotion]}
              strokeWidth={2}
              name={emotion.charAt(0).toUpperCase() + emotion.slice(1)}
              dot={{ r: 3 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
