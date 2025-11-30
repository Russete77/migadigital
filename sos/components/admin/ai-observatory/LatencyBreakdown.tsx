'use client';

interface LatencyBreakdownProps {
  bert: number;
  gpt: number;
  humanizer: number;
  overhead: number;
}

export function LatencyBreakdown({ bert, gpt, humanizer, overhead }: LatencyBreakdownProps) {
  const total = bert + gpt + humanizer + overhead;

  const segments = [
    { name: 'BERT', value: bert, color: 'bg-purple-500' },
    { name: 'GPT-4o', value: gpt, color: 'bg-blue-500' },
    { name: 'Humanizer', value: humanizer, color: 'bg-green-500' },
    { name: 'Overhead', value: overhead, color: 'bg-gray-400' },
  ];

  return (
    <div className="bg-bg-secondary rounded-xl shadow-tinder-sm border border-border-default p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-text-primary">Breakdown de Latência</h2>
        <p className="text-sm text-text-secondary mt-1">Proporção de cada componente no tempo total</p>
      </div>

      {/* Barra de progresso */}
      <div className="w-full h-16 bg-bg-active rounded-lg overflow-hidden flex">
        {segments.map((segment, index) => {
          const percentage = (segment.value / total) * 100;
          return (
            <div
              key={index}
              className={`${segment.color} flex items-center justify-center text-white text-sm font-semibold transition-all hover:opacity-80`}
              style={{ width: `${percentage}%` }}
              title={`${segment.name}: ${segment.value.toFixed(0)}ms (${percentage.toFixed(1)}%)`}
            >
              {percentage > 10 && (
                <span>
                  {segment.name}
                  <br />
                  {segment.value.toFixed(0)}ms
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        {segments.map((segment, index) => {
          const percentage = (segment.value / total) * 100;
          return (
            <div key={index} className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded ${segment.color}`}></div>
              <div>
                <p className="text-sm font-medium text-text-primary">{segment.name}</p>
                <p className="text-xs text-text-tertiary">
                  {segment.value.toFixed(0)}ms • {percentage.toFixed(1)}%
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
