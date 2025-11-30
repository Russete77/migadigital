import { createClient } from '@/lib/supabase/server';
import { CrisisTimeline } from '@/components/admin/ai-observatory/CrisisTimeline';
import { CrisisList } from '@/components/admin/ai-observatory/CrisisList';

export default async function CrisisPage() {
  const supabase = await createClient();

  const { data: crises } = await supabase
    .from('ai_response_logs')
    .select('*')
    .eq('was_crisis', true)
    .order('created_at', { ascending: false });

  const { data: allResponses } = await supabase
    .from('ai_response_logs')
    .select('id, created_at')
    .order('created_at', { ascending: false });

  // Calcular taxa de detecção
  const crisisRate =
    allResponses && allResponses.length > 0
      ? ((crises?.length || 0) / allResponses.length) * 100
      : 0;

  // Crises por urgência crítica
  const criticalCrises = crises?.filter((c) => c.sentiment_urgency === 'critica').length || 0;

  // Crises por emoção
  const crisesByEmotion: Record<string, number> = {};
  crises?.forEach((c) => {
    const emotion = c.sentiment_emotion;
    crisesByEmotion[emotion] = (crisesByEmotion[emotion] || 0) + 1;
  });

  const topEmotions = Object.entries(crisesByEmotion)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  // Últimas 24h
  const last24h = new Date();
  last24h.setHours(last24h.getHours() - 24);
  const crisesLast24h =
    crises?.filter((c) => new Date(c.created_at) >= last24h).length || 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Detecção de Crises</h1>
        <p className="mt-2 text-text-secondary">
          Monitoramento de situações de urgência e risco detectadas pela IA
        </p>
      </div>

      {/* Alerta se houver crises recentes */}
      {crisesLast24h > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <svg
                className="w-6 h-6 text-red-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-red-800">
                {crisesLast24h} {crisesLast24h === 1 ? 'crise detectada' : 'crises detectadas'} nas
                últimas 24h
              </h3>
              <p className="text-sm text-red-700 mt-1">
                Revise as situações críticas e verifique se alguma ação adicional é necessária
              </p>
            </div>
          </div>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-bg-secondary rounded-xl shadow-tinder-sm border border-border-default p-6">
          <p className="text-sm font-medium text-text-secondary">Total de Crises</p>
          <p className="text-3xl font-bold text-red-600 mt-2">{crises?.length || 0}</p>
          <p className="text-sm text-text-tertiary mt-1">All-time</p>
        </div>

        <div className="bg-bg-secondary rounded-xl shadow-tinder-sm border border-border-default p-6">
          <p className="text-sm font-medium text-text-secondary">Taxa de Detecção</p>
          <p className="text-3xl font-bold text-orange-600 mt-2">{crisisRate.toFixed(2)}%</p>
          <p className="text-sm text-text-tertiary mt-1">
            De {allResponses?.length || 0} respostas totais
          </p>
        </div>

        <div className="bg-bg-secondary rounded-xl shadow-tinder-sm border border-border-default p-6">
          <p className="text-sm font-medium text-text-secondary">Urgência Crítica</p>
          <p className="text-3xl font-bold text-purple-600 mt-2">{criticalCrises}</p>
          <p className="text-sm text-text-tertiary mt-1">
            {crises && crises.length > 0
              ? ((criticalCrises / crises.length) * 100).toFixed(0)
              : 0}
            % das crises
          </p>
        </div>

        <div className="bg-bg-secondary rounded-xl shadow-tinder-sm border border-border-default p-6">
          <p className="text-sm font-medium text-text-secondary">Últimas 24h</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">{crisesLast24h}</p>
          <p className="text-sm text-text-tertiary mt-1">Recentes</p>
        </div>
      </div>

      {/* Emoções mais comuns em crises */}
      <div className="bg-bg-secondary rounded-xl shadow-tinder-sm border border-border-default p-6">
        <h2 className="text-xl font-bold text-text-primary mb-4">Emoções Predominantes em Crises</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {topEmotions.map(([emotion, count], index) => (
            <div
              key={emotion}
              className="bg-gradient-to-br from-red-50 to-orange-50 rounded-lg p-4 border border-red-200"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-3xl font-bold text-text-tertiary">#{index + 1}</span>
                <span className="px-3 py-1 text-sm font-semibold bg-red-100 text-red-700 rounded-full capitalize">
                  {emotion}
                </span>
              </div>
              <p className="text-2xl font-bold text-red-600">{count}</p>
              <p className="text-sm text-text-secondary">
                {crises && crises.length > 0 ? ((count / crises.length) * 100).toFixed(0) : 0}% das
                crises
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <CrisisTimeline crises={crises || []} />

      {/* Lista de crises */}
      <CrisisList crises={crises || []} />
    </div>
  );
}
