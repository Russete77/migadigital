import { createClient } from '@/lib/supabase/server';
import { HumanizationMetrics } from '@/components/admin/ai-observatory/HumanizationMetrics';
import { RoboticnessDistribution } from '@/components/admin/ai-observatory/RoboticnessDistribution';

export default async function HumanizationPage() {
  const supabase = await createClient();

  const { data: responses } = await supabase
    .from('ai_response_logs')
    .select('*')
    .not('humanized_response', 'is', null)
    .order('created_at', { ascending: false });

  // Calcular métricas
  const avgBefore =
    responses && responses.length > 0
      ? responses.reduce((sum, r) => sum + (r.roboticness_before || 0), 0) / responses.length
      : 0;

  const avgAfter =
    responses && responses.length > 0
      ? responses.reduce((sum, r) => sum + (r.roboticness_after || 0), 0) / responses.length
      : 0;

  const improvement = avgBefore > 0 ? ((avgBefore - avgAfter) / avgBefore) * 100 : 0;

  // Distribuição de roboticness (antes e depois)
  const beforeDistribution = Array.from({ length: 10 }, (_, i) => {
    const min = i * 0.1;
    const max = (i + 1) * 0.1;
    const count =
      responses?.filter((r) => r.roboticness_before >= min && r.roboticness_before < max)
        .length || 0;
    return {
      range: `${(min * 100).toFixed(0)}-${(max * 100).toFixed(0)}%`,
      count,
    };
  });

  const afterDistribution = Array.from({ length: 10 }, (_, i) => {
    const min = i * 0.1;
    const max = (i + 1) * 0.1;
    const count =
      responses?.filter((r) => r.roboticness_after >= min && r.roboticness_after < max).length ||
      0;
    return {
      range: `${(min * 100).toFixed(0)}-${(max * 100).toFixed(0)}%`,
      count,
    };
  });

  // Top melhores humanizações
  const topImprovements =
    responses
      ?.map((r) => ({
        id: r.id,
        created_at: r.created_at,
        before: r.roboticness_before,
        after: r.roboticness_after,
        improvement: ((r.roboticness_before - r.roboticness_after) / r.roboticness_before) * 100,
        raw_response: r.raw_response,
        humanized_response: r.humanized_response,
      }))
      .sort((a, b) => b.improvement - a.improvement)
      .slice(0, 10) || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Humanização de Respostas</h1>
        <p className="mt-2 text-text-secondary">
          Análise de como o NLP está transformando respostas robóticas em conversas naturais
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-bg-secondary rounded-xl shadow-tinder-sm border border-border-default p-6">
          <p className="text-sm font-medium text-text-secondary">Roboticness Média (Antes)</p>
          <p className="text-3xl font-bold text-red-600 mt-2">{(avgBefore * 100).toFixed(1)}%</p>
          <p className="text-sm text-text-tertiary mt-1">Respostas brutas do GPT</p>
        </div>

        <div className="bg-bg-secondary rounded-xl shadow-tinder-sm border border-border-default p-6">
          <p className="text-sm font-medium text-text-secondary">Roboticness Média (Depois)</p>
          <p className="text-3xl font-bold text-green-600 mt-2">
            {(avgAfter * 100).toFixed(1)}%
          </p>
          <p className="text-sm text-text-tertiary mt-1">Após humanização NLP</p>
        </div>

        <div className="bg-bg-secondary rounded-xl shadow-tinder-sm border border-border-default p-6">
          <p className="text-sm font-medium text-text-secondary">Melhoria Total</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">{improvement.toFixed(1)}%</p>
          <p className="text-sm text-text-tertiary mt-1">Redução média</p>
        </div>
      </div>

      {/* Métricas detalhadas */}
      <HumanizationMetrics responses={responses || []} />

      {/* Distribuições */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RoboticnessDistribution
          data={beforeDistribution}
          title="Distribuição (Antes)"
          color="red"
        />
        <RoboticnessDistribution
          data={afterDistribution}
          title="Distribuição (Depois)"
          color="green"
        />
      </div>

      {/* Top Melhores */}
      <div className="bg-bg-secondary rounded-xl shadow-tinder-sm border border-border-default p-6">
        <h2 className="text-xl font-bold text-text-primary mb-4">Top 10 Melhores Humanizações</h2>
        <div className="space-y-4">
          {topImprovements.map((item, index) => (
            <div key={item.id} className="border-b border-border-default pb-4 last:border-0">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-text-tertiary">#{index + 1}</span>
                  <div>
                    <p className="text-sm text-text-tertiary">
                      {new Date(item.created_at).toLocaleDateString('pt-BR')}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-red-600 text-sm line-through">
                        {(item.before * 100).toFixed(0)}%
                      </span>
                      <span className="text-text-tertiary">→</span>
                      <span className="text-green-600 text-sm font-semibold">
                        {(item.after * 100).toFixed(0)}%
                      </span>
                      <span className="text-blue-600 text-sm font-bold">
                        (+{item.improvement.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <details className="mt-2">
                <summary className="text-sm text-blue-600 cursor-pointer hover:text-blue-800">
                  Ver comparação
                </summary>
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-red-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-red-700 mb-1">Antes:</p>
                    <p className="text-sm text-text-secondary">{item.raw_response.substring(0, 150)}...</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-green-700 mb-1">Depois:</p>
                    <p className="text-sm text-text-secondary">
                      {item.humanized_response.substring(0, 150)}...
                    </p>
                  </div>
                </div>
              </details>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
