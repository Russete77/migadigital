'use client';

import { useState, Fragment } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface Response {
  id: string;
  created_at: string;
  sentiment_emotion: string;
  sentiment_urgency: string;
  raw_response: string;
  humanized_response: string;
  roboticness_before: number;
  roboticness_after: number;
  humanizer_time_ms: number;
}

interface ComparisonTableProps {
  responses: Response[];
}

export function ComparisonTable({ responses }: ComparisonTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getEmotionColor = (emotion: string) => {
    const colors: Record<string, string> = {
      triste: 'bg-blue-100 text-blue-700',
      ansiosa: 'bg-yellow-100 text-yellow-700',
      raiva: 'bg-red-100 text-red-700',
      feliz: 'bg-green-100 text-green-700',
      confusa: 'bg-purple-100 text-purple-700',
      esperancosa: 'bg-cyan-100 text-cyan-700',
      desesperada: 'bg-orange-100 text-orange-700',
    };
    return colors[emotion] || 'bg-bg-active text-text-secondary';
  };

  const getUrgencyColor = (urgency: string) => {
    const colors: Record<string, string> = {
      baixa: 'bg-green-100 text-green-700',
      media: 'bg-yellow-100 text-yellow-700',
      alta: 'bg-orange-100 text-orange-700',
      critica: 'bg-red-100 text-red-700',
    };
    return colors[urgency] || 'bg-bg-active text-text-secondary';
  };

  if (!responses || responses.length === 0) {
    return (
      <div className="bg-bg-secondary rounded-xl shadow-tinder-sm border border-border-default p-12 text-center">
        <p className="text-text-tertiary">Nenhuma resposta humanizada ainda</p>
        <p className="text-sm text-text-tertiary mt-2">
          Aguardando primeiras mensagens no Chat SOS...
        </p>
      </div>
    );
  }

  return (
    <div className="bg-bg-secondary rounded-xl shadow-tinder-sm border border-border-default">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-bg-elevated border-b border-border-default">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                Data/Hora
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                Emoção
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                Urgência
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                Roboticness
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                Melhoria
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-default">
            {responses.map((response) => {
              const improvement =
                ((response.roboticness_before - response.roboticness_after) /
                  response.roboticness_before) *
                100;
              const isExpanded = expandedId === response.id;

              return (
                <Fragment key={response.id}>
                  <tr className="hover:bg-bg-elevated">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                      {new Date(response.created_at).toLocaleString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${getEmotionColor(
                          response.sentiment_emotion
                        )}`}
                      >
                        {response.sentiment_emotion}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${getUrgencyColor(
                          response.sentiment_urgency
                        )}`}
                      >
                        {response.sentiment_urgency}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-red-600 line-through">
                          {(response.roboticness_before * 100).toFixed(0)}%
                        </span>
                        <span className="text-text-tertiary">→</span>
                        <span className="text-green-600 font-semibold">
                          {(response.roboticness_after * 100).toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-green-600">
                        +{improvement.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => toggleExpand(response.id)}
                        className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="w-4 h-4" />
                            Fechar
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-4 h-4" />
                            Ver comparação
                          </>
                        )}
                      </button>
                    </td>
                  </tr>

                  {/* Expanded Row */}
                  {isExpanded && (
                    <tr>
                      <td colSpan={6} className="px-6 py-6 bg-bg-elevated">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Resposta Bruta */}
                          <div>
                            <h4 className="text-sm font-semibold text-text-secondary mb-2 flex items-center gap-2">
                              <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                              Resposta Bruta (GPT-4o)
                            </h4>
                            <div className="bg-bg-secondary rounded-lg border border-red-200 p-4">
                              <p className="text-sm text-text-secondary whitespace-pre-wrap">
                                {response.raw_response}
                              </p>
                              <div className="mt-3 pt-3 border-t border-border-default">
                                <p className="text-xs text-text-tertiary">
                                  Roboticness:{' '}
                                  <span className="font-semibold text-red-600">
                                    {(response.roboticness_before * 100).toFixed(1)}%
                                  </span>
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Resposta Humanizada */}
                          <div>
                            <h4 className="text-sm font-semibold text-text-secondary mb-2 flex items-center gap-2">
                              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                              Resposta Humanizada (NLP)
                            </h4>
                            <div className="bg-bg-secondary rounded-lg border border-green-200 p-4">
                              <p className="text-sm text-text-secondary whitespace-pre-wrap">
                                {response.humanized_response}
                              </p>
                              <div className="mt-3 pt-3 border-t border-border-default space-y-1">
                                <p className="text-xs text-text-tertiary">
                                  Roboticness:{' '}
                                  <span className="font-semibold text-green-600">
                                    {(response.roboticness_after * 100).toFixed(1)}%
                                  </span>
                                </p>
                                <p className="text-xs text-text-tertiary">
                                  Tempo de processamento:{' '}
                                  <span className="font-semibold">
                                    {response.humanizer_time_ms}ms
                                  </span>
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
