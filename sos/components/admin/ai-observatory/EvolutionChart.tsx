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

interface EvolutionChartProps {
  data: any[];
}

export function EvolutionChart({ data }: EvolutionChartProps) {
  // Formatar dados para o gráfico
  const chartData = data.map((day) => ({
    date: new Date(day.date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
    }),
    respostas: day.total_responses || 0,
    roboticness_antes: ((day.avg_roboticness_before || 0) * 100).toFixed(1),
    roboticness_depois: ((day.avg_roboticness_after || 0) * 100).toFixed(1),
    tempo_medio: day.avg_processing_time_ms || 0,
  }));

  return (
    <div className="bg-bg-secondary rounded-xl shadow-tinder-sm border border-border-default p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-text-primary">Evolução da IA (Últimos 7 dias)</h2>
        <p className="text-sm text-text-secondary mt-1">
          Respostas, roboticness e performance ao longo do tempo
        </p>
      </div>

      {chartData.length === 0 ? (
        <div className="h-80 flex items-center justify-center">
          <div className="text-center">
            <p className="text-text-tertiary mb-2">Nenhum dado ainda</p>
            <p className="text-sm text-text-disabled">
              Aguardando primeiras respostas da IA...
            </p>
          </div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              stroke="#9ca3af"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              yAxisId="left"
              stroke="#9ca3af"
              style={{ fontSize: '12px' }}
              label={{ value: 'Respostas', angle: -90, position: 'insideLeft' }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#9ca3af"
              style={{ fontSize: '12px' }}
              label={{ value: 'Roboticness (%)', angle: 90, position: 'insideRight' }}
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
              yAxisId="left"
              type="monotone"
              dataKey="respostas"
              stroke="#3b82f6"
              strokeWidth={2}
              name="Respostas"
              dot={{ r: 4 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="roboticness_antes"
              stroke="#f87171"
              strokeWidth={2}
              name="Roboticness (Antes)"
              dot={{ r: 4 }}
              strokeDasharray="5 5"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="roboticness_depois"
              stroke="#34d399"
              strokeWidth={2}
              name="Roboticness (Depois)"
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
