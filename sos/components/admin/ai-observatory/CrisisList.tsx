'use client';

import { AlertTriangle } from 'lucide-react';

interface CrisisListProps {
  crises: any[];
}

export function CrisisList({ crises }: CrisisListProps) {
  if (!crises || crises.length === 0) {
    return null;
  }

  return (
    <div className="bg-bg-secondary rounded-xl shadow-tinder-sm border border-border-default p-6">
      <h2 className="text-xl font-bold text-text-primary mb-4">Histórico de Crises</h2>

      <div className="space-y-4">
        {crises.slice(0, 20).map((crisis) => (
          <div
            key={crisis.id}
            className="border-l-4 border-red-500 bg-red-50 rounded-lg p-4 hover:bg-red-100 transition-colors"
          >
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
              </div>

              {/* Content */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-semibold text-text-primary">
                      {new Date(crisis.created_at).toLocaleString('pt-BR')}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-2 py-1 text-xs font-semibold bg-red-200 text-red-800 rounded-full capitalize">
                        {crisis.sentiment_emotion}
                      </span>
                      <span className="px-2 py-1 text-xs font-semibold bg-purple-200 text-purple-800 rounded-full capitalize">
                        Urgência: {crisis.sentiment_urgency}
                      </span>
                      <span className="text-xs text-text-secondary">
                        Intensidade: {(crisis.sentiment_intensity * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* User message */}
                <div className="mt-3 bg-bg-secondary rounded-lg p-3 border border-red-200">
                  <p className="text-xs font-semibold text-text-secondary mb-1">Mensagem da usuária:</p>
                  <p className="text-sm text-text-primary">{crisis.user_message}</p>
                </div>

                {/* Keywords */}
                {crisis.sentiment_keywords && crisis.sentiment_keywords.length > 0 && (
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    <p className="text-xs font-semibold text-text-secondary">Keywords detectadas:</p>
                    {crisis.sentiment_keywords.slice(0, 5).map((kw: string, index: number) => (
                      <span
                        key={index}
                        className="px-2 py-1 text-xs bg-bg-active text-text-secondary rounded-full"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                )}

                {/* AI Response */}
                <details className="mt-3">
                  <summary className="text-sm text-blue-600 cursor-pointer hover:text-blue-800 font-medium">
                    Ver resposta da IA
                  </summary>
                  <div className="mt-2 bg-blue-50 rounded-lg p-3 border border-blue-200">
                    <p className="text-sm text-text-secondary">{crisis.humanized_response}</p>
                  </div>
                </details>
              </div>
            </div>
          </div>
        ))}
      </div>

      {crises.length > 20 && (
        <div className="mt-6 text-center">
          <p className="text-sm text-text-tertiary">
            Mostrando 20 de {crises.length} crises detectadas
          </p>
        </div>
      )}
    </div>
  );
}
