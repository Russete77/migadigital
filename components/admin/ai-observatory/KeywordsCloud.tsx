'use client';

interface Keyword {
  text: string;
  value: number;
}

interface KeywordsCloudProps {
  keywords: Keyword[];
}

export function KeywordsCloud({ keywords }: KeywordsCloudProps) {
  if (!keywords || keywords.length === 0) {
    return (
      <div className="bg-bg-secondary rounded-xl shadow-tinder-sm border border-border-default p-12 text-center">
        <p className="text-text-tertiary">Nenhuma keyword detectada ainda</p>
      </div>
    );
  }

  const maxValue = Math.max(...keywords.map((k) => k.value));

  return (
    <div className="bg-bg-secondary rounded-xl shadow-tinder-sm border border-border-default p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-text-primary">Top Keywords</h2>
        <p className="text-sm text-text-secondary mt-1">
          Palavras mais mencionadas pelas usuárias
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        {keywords.map((keyword, index) => {
          // Tamanho baseado na frequência
          const size = 12 + (keyword.value / maxValue) * 20;
          const opacity = 0.5 + (keyword.value / maxValue) * 0.5;

          return (
            <div
              key={index}
              className="inline-flex items-center gap-2 px-3 py-2 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
              style={{
                fontSize: `${size}px`,
                opacity,
              }}
            >
              <span className="font-medium text-purple-700">{keyword.text}</span>
              <span className="text-xs text-purple-500 bg-purple-100 px-2 py-0.5 rounded-full">
                {keyword.value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
