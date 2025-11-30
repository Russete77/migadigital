'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface EmotionDistributionProps {
  data: Record<string, number>;
}

const EMOTION_LABELS: Record<string, string> = {
  triste: 'Triste',
  ansiosa: 'Ansiosa',
  raiva: 'Raiva',
  feliz: 'Feliz',
  confusa: 'Confusa',
  esperancosa: 'Esperançosa',
  desesperada: 'Desesperada',
};

const EMOTION_COLORS: Record<string, string> = {
  triste: '#60a5fa',
  ansiosa: '#fbbf24',
  raiva: '#f87171',
  feliz: '#34d399',
  confusa: '#a78bfa',
  esperancosa: '#22d3ee',
  desesperada: '#fb923c',
};

export function EmotionDistribution({ data }: EmotionDistributionProps) {
  // Transformar dados para o formato do gráfico
  const chartData = Object.entries(data)
    .map(([emotion, count]) => ({
      name: EMOTION_LABELS[emotion] || emotion,
      value: count,
      color: EMOTION_COLORS[emotion] || '#9ca3af',
    }))
    .sort((a, b) => b.value - a.value); // Ordenar por contagem

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="bg-bg-secondary rounded-xl shadow-tinder-sm border border-border-default p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-text-primary">Distribuição de Emoções</h2>
        <p className="text-sm text-text-secondary mt-1">
          Últimos 7 dias • {total} análises
        </p>
      </div>

      {chartData.length === 0 ? (
        <div className="h-80 flex items-center justify-center">
          <p className="text-text-tertiary">Nenhuma emoção detectada ainda</p>
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name} ${((percent || 0) * 100).toFixed(0)}%`
                }
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Legend manual (mais bonita que a do Recharts) */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            {chartData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm text-text-secondary">
                  {item.name}: <span className="font-semibold">{item.value}</span>
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
