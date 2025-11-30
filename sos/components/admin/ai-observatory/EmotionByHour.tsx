'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface EmotionByHourProps {
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

export function EmotionByHour({ data }: EmotionByHourProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-bg-secondary rounded-xl shadow-tinder-sm border border-border-default p-12 text-center">
        <p className="text-text-tertiary">Nenhum dado por horário ainda</p>
      </div>
    );
  }

  // Identificar emoções presentes
  const emotions = new Set<string>();
  data.forEach((hour) => {
    Object.keys(hour).forEach((key) => {
      if (key !== 'hour' && EMOTION_COLORS[key]) {
        emotions.add(key);
      }
    });
  });

  return (
    <div className="bg-bg-secondary rounded-xl shadow-tinder-sm border border-border-default p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-text-primary">Emoções por Horário</h2>
        <p className="text-sm text-text-secondary mt-1">
          Distribuição de emoções ao longo do dia
        </p>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="hour" stroke="#9ca3af" style={{ fontSize: '11px' }} />
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
            <Bar
              key={emotion}
              dataKey={emotion}
              stackId="a"
              fill={EMOTION_COLORS[emotion]}
              name={emotion.charAt(0).toUpperCase() + emotion.slice(1)}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
