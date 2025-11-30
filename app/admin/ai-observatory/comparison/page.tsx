import { createClient } from '@/lib/supabase/server';
import { ComparisonTable } from '@/components/admin/ai-observatory/ComparisonTable';

export default async function ComparisonPage() {
  const supabase = await createClient();

  // Buscar últimas 50 respostas com dados de humanização
  const { data: responses } = await supabase
    .from('ai_response_logs')
    .select('*')
    .not('humanized_response', 'is', null)
    .order('created_at', { ascending: false })
    .limit(50);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Comparação: Antes vs Depois</h1>
        <p className="mt-2 text-text-secondary">
          Análise lado a lado das respostas brutas (GPT) vs humanizadas (NLP)
        </p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-bg-secondary rounded-xl shadow-tinder-sm border border-border-default p-6">
          <p className="text-sm font-medium text-text-secondary">Total Analisado</p>
          <p className="text-3xl font-bold text-text-primary mt-2">
            {responses?.length || 0}
          </p>
          <p className="text-sm text-text-tertiary mt-1">Últimas 50 respostas</p>
        </div>

        <div className="bg-bg-secondary rounded-xl shadow-tinder-sm border border-border-default p-6">
          <p className="text-sm font-medium text-text-secondary">Melhoria Média</p>
          <p className="text-3xl font-bold text-green-600 mt-2">
            {responses && responses.length > 0
              ? (
                  (responses.reduce(
                    (sum, r) =>
                      sum +
                      ((r.roboticness_before - r.roboticness_after) /
                        r.roboticness_before) *
                        100,
                    0
                  ) /
                    responses.length)
                ).toFixed(1)
              : '0'}
            %
          </p>
          <p className="text-sm text-text-tertiary mt-1">Redução de roboticness</p>
        </div>

        <div className="bg-bg-secondary rounded-xl shadow-tinder-sm border border-border-default p-6">
          <p className="text-sm font-medium text-text-secondary">Tempo Médio Humanização</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">
            {responses && responses.length > 0
              ? (
                  responses.reduce((sum, r) => sum + (r.humanizer_time_ms || 0), 0) /
                  responses.length
                ).toFixed(0)
              : '0'}
            ms
          </p>
          <p className="text-sm text-text-tertiary mt-1">Performance do humanizer</p>
        </div>
      </div>

      {/* Comparison Table */}
      <ComparisonTable responses={responses || []} />
    </div>
  );
}
