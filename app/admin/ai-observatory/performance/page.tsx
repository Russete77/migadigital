import { createClient } from '@/lib/supabase/server';
import { PerformanceCharts } from '@/components/admin/ai-observatory/PerformanceCharts';
import { LatencyBreakdown } from '@/components/admin/ai-observatory/LatencyBreakdown';

export default async function PerformancePage() {
  const supabase = await createClient();

  const { data: responses } = await supabase
    .from('ai_response_logs')
    .select('*')
    .order('created_at', { ascending: false });

  // Calcular médias
  const avgTotal =
    responses && responses.length > 0
      ? responses.reduce((sum, r) => sum + (r.processing_time_ms || 0), 0) / responses.length
      : 0;

  const avgBert =
    responses && responses.length > 0
      ? responses.reduce((sum, r) => sum + (r.bert_time_ms || 0), 0) / responses.length
      : 0;

  const avgGpt =
    responses && responses.length > 0
      ? responses.reduce((sum, r) => sum + (r.gpt_time_ms || 0), 0) / responses.length
      : 0;

  const avgHumanizer =
    responses && responses.length > 0
      ? responses.reduce((sum, r) => sum + (r.humanizer_time_ms || 0), 0) / responses.length
      : 0;

  // Latência mais rápida e mais lenta
  const fastest = responses && responses.length > 0
    ? responses.reduce((min, r) =>
        (r.processing_time_ms || Infinity) < (min.processing_time_ms || Infinity) ? r : min
      )
    : null;

  const slowest = responses && responses.length > 0
    ? responses.reduce((max, r) =>
        (r.processing_time_ms || 0) > (max.processing_time_ms || 0) ? r : max
      )
    : null;

  // P95 (95 percentil)
  const sortedTimes =
    responses
      ?.map((r) => r.processing_time_ms)
      .filter((t) => t !== null)
      .sort((a, b) => a - b) || [];
  const p95Index = Math.floor(sortedTimes.length * 0.95);
  const p95 = sortedTimes[p95Index] || 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Performance e Latência</h1>
        <p className="mt-2 text-text-secondary">
          Análise de tempo de processamento das camadas NLP + GPT
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-bg-secondary rounded-xl shadow-tinder-sm border border-border-default p-6">
          <p className="text-sm font-medium text-text-secondary">Latência Média Total</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">{avgTotal.toFixed(0)}ms</p>
          <p className="text-sm text-text-tertiary mt-1">~{(avgTotal / 1000).toFixed(1)}s</p>
        </div>

        <div className="bg-bg-secondary rounded-xl shadow-tinder-sm border border-border-default p-6">
          <p className="text-sm font-medium text-text-secondary">P95</p>
          <p className="text-3xl font-bold text-orange-600 mt-2">{p95.toFixed(0)}ms</p>
          <p className="text-sm text-text-tertiary mt-1">95% abaixo disso</p>
        </div>

        <div className="bg-bg-secondary rounded-xl shadow-tinder-sm border border-border-default p-6">
          <p className="text-sm font-medium text-text-secondary">Mais Rápido</p>
          <p className="text-3xl font-bold text-green-600 mt-2">
            {fastest?.processing_time_ms || 0}ms
          </p>
          <p className="text-sm text-text-tertiary mt-1">Melhor tempo</p>
        </div>

        <div className="bg-bg-secondary rounded-xl shadow-tinder-sm border border-border-default p-6">
          <p className="text-sm font-medium text-text-secondary">Mais Lento</p>
          <p className="text-3xl font-bold text-red-600 mt-2">
            {slowest?.processing_time_ms || 0}ms
          </p>
          <p className="text-sm text-text-tertiary mt-1">Pior tempo</p>
        </div>
      </div>

      {/* Breakdown de componentes */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-bg-secondary rounded-xl shadow-tinder-sm border border-border-default p-6">
          <p className="text-sm font-medium text-text-secondary">BERT (Sentiment)</p>
          <p className="text-2xl font-bold text-purple-600 mt-2">{avgBert.toFixed(0)}ms</p>
          <p className="text-sm text-text-tertiary mt-1">
            {((avgBert / avgTotal) * 100).toFixed(0)}% do total
          </p>
        </div>

        <div className="bg-bg-secondary rounded-xl shadow-tinder-sm border border-border-default p-6">
          <p className="text-sm font-medium text-text-secondary">GPT-4o</p>
          <p className="text-2xl font-bold text-blue-600 mt-2">{avgGpt.toFixed(0)}ms</p>
          <p className="text-sm text-text-tertiary mt-1">
            {((avgGpt / avgTotal) * 100).toFixed(0)}% do total
          </p>
        </div>

        <div className="bg-bg-secondary rounded-xl shadow-tinder-sm border border-border-default p-6">
          <p className="text-sm font-medium text-text-secondary">Humanizer</p>
          <p className="text-2xl font-bold text-green-600 mt-2">{avgHumanizer.toFixed(0)}ms</p>
          <p className="text-sm text-text-tertiary mt-1">
            {((avgHumanizer / avgTotal) * 100).toFixed(0)}% do total
          </p>
        </div>

        <div className="bg-bg-secondary rounded-xl shadow-tinder-sm border border-border-default p-6">
          <p className="text-sm font-medium text-text-secondary">Overhead</p>
          <p className="text-2xl font-bold text-text-secondary mt-2">
            {(avgTotal - avgBert - avgGpt - avgHumanizer).toFixed(0)}ms
          </p>
          <p className="text-sm text-text-tertiary mt-1">Network + DB</p>
        </div>
      </div>

      {/* Charts */}
      <PerformanceCharts responses={responses || []} />

      {/* Breakdown visual */}
      <LatencyBreakdown
        bert={avgBert}
        gpt={avgGpt}
        humanizer={avgHumanizer}
        overhead={avgTotal - avgBert - avgGpt - avgHumanizer}
      />

      {/* Lista de respostas mais lentas */}
      <div className="bg-bg-secondary rounded-xl shadow-tinder-sm border border-border-default p-6">
        <h2 className="text-xl font-bold text-text-primary mb-4">Top 10 Respostas Mais Lentas</h2>
        <div className="space-y-3">
          {responses
            ?.sort((a, b) => (b.processing_time_ms || 0) - (a.processing_time_ms || 0))
            .slice(0, 10)
            .map((r, index) => (
              <div key={r.id} className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-text-tertiary">#{index + 1}</span>
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      {new Date(r.created_at).toLocaleString('pt-BR')}
                    </p>
                    <p className="text-xs text-text-tertiary">
                      BERT: {r.bert_time_ms}ms • GPT: {r.gpt_time_ms}ms • Humanizer:{' '}
                      {r.humanizer_time_ms}ms
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-red-600">{r.processing_time_ms}ms</p>
                  <p className="text-xs text-text-tertiary">{(r.processing_time_ms / 1000).toFixed(2)}s</p>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
