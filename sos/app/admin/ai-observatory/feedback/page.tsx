import { createClient } from '@/lib/supabase/server';
import { FeedbackRatings } from '@/components/admin/ai-observatory/FeedbackRatings';
import { FeedbackTimeline } from '@/components/admin/ai-observatory/FeedbackTimeline';

export default async function FeedbackPage() {
  const supabase = await createClient();

  const { data: feedbacks } = await supabase
    .from('ai_response_logs')
    .select('*')
    .not('user_feedback', 'is', null)
    .order('created_at', { ascending: false });

  // Calcular métricas
  const avgRating =
    feedbacks && feedbacks.length > 0
      ? feedbacks.reduce((sum, f) => sum + (f.user_feedback || 0), 0) / feedbacks.length
      : 0;

  const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  feedbacks?.forEach((f) => {
    if (f.user_feedback >= 1 && f.user_feedback <= 5) {
      ratingCounts[f.user_feedback as keyof typeof ratingCounts]++;
    }
  });

  // Feedback por emoção
  const feedbackByEmotion: Record<string, { sum: number; count: number }> = {};
  feedbacks?.forEach((f) => {
    const emotion = f.sentiment_emotion;
    if (!feedbackByEmotion[emotion]) {
      feedbackByEmotion[emotion] = { sum: 0, count: 0 };
    }
    feedbackByEmotion[emotion].sum += f.user_feedback || 0;
    feedbackByEmotion[emotion].count += 1;
  });

  const avgByEmotion = Object.entries(feedbackByEmotion).map(([emotion, data]) => ({
    emotion,
    avg: data.sum / data.count,
    count: data.count,
  }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Feedback das Usuárias</h1>
        <p className="mt-2 text-text-secondary">
          Análise de ratings e comentários sobre as respostas da IA
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-bg-secondary rounded-xl shadow-tinder-sm border border-border-default p-6">
          <p className="text-sm font-medium text-text-secondary">Total de Feedbacks</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">{feedbacks?.length || 0}</p>
        </div>

        <div className="bg-bg-secondary rounded-xl shadow-tinder-sm border border-border-default p-6">
          <p className="text-sm font-medium text-text-secondary">Rating Médio</p>
          <p className="text-3xl font-bold text-yellow-600 mt-2">
            {avgRating.toFixed(1)}
            <span className="text-lg text-text-tertiary">/5</span>
          </p>
          <p className="text-sm text-text-tertiary mt-1">
            {((avgRating / 5) * 100).toFixed(0)}% de satisfação
          </p>
        </div>

        <div className="bg-bg-secondary rounded-xl shadow-tinder-sm border border-border-default p-6">
          <p className="text-sm font-medium text-text-secondary">Positivos (4-5 ⭐)</p>
          <p className="text-3xl font-bold text-green-600 mt-2">
            {ratingCounts[4] + ratingCounts[5]}
          </p>
          <p className="text-sm text-text-tertiary mt-1">
            {feedbacks && feedbacks.length > 0
              ? (((ratingCounts[4] + ratingCounts[5]) / feedbacks.length) * 100).toFixed(0)
              : 0}
            %
          </p>
        </div>

        <div className="bg-bg-secondary rounded-xl shadow-tinder-sm border border-border-default p-6">
          <p className="text-sm font-medium text-text-secondary">Negativos (1-2 ⭐)</p>
          <p className="text-3xl font-bold text-red-600 mt-2">
            {ratingCounts[1] + ratingCounts[2]}
          </p>
          <p className="text-sm text-text-tertiary mt-1">
            {feedbacks && feedbacks.length > 0
              ? (((ratingCounts[1] + ratingCounts[2]) / feedbacks.length) * 100).toFixed(0)
              : 0}
            %
          </p>
        </div>
      </div>

      {/* Distribuição de ratings */}
      <FeedbackRatings counts={ratingCounts} total={feedbacks?.length || 0} />

      {/* Rating por emoção */}
      <div className="bg-bg-secondary rounded-xl shadow-tinder-sm border border-border-default p-6">
        <h2 className="text-xl font-bold text-text-primary mb-4">Rating Médio por Emoção</h2>
        <div className="space-y-3">
          {avgByEmotion
            .sort((a, b) => b.avg - a.avg)
            .map((item) => (
              <div key={item.emotion} className="flex items-center gap-4">
                <div className="w-32">
                  <p className="text-sm font-medium text-text-secondary capitalize">{item.emotion}</p>
                  <p className="text-xs text-text-tertiary">{item.count} feedbacks</p>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-8 bg-bg-active rounded-lg overflow-hidden">
                      <div
                        className={`h-full ${
                          item.avg >= 4
                            ? 'bg-green-500'
                            : item.avg >= 3
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${(item.avg / 5) * 100}%` }}
                      ></div>
                    </div>
                    <p className="text-lg font-bold text-text-primary w-16">
                      {item.avg.toFixed(1)}
                      <span className="text-sm text-text-tertiary">/5</span>
                    </p>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Timeline */}
      <FeedbackTimeline feedbacks={feedbacks || []} />

      {/* Lista de feedbacks negativos (para análise) */}
      <div className="bg-bg-secondary rounded-xl shadow-tinder-sm border border-border-default p-6">
        <h2 className="text-xl font-bold text-text-primary mb-4">Feedbacks Negativos (1-2 ⭐)</h2>
        <div className="space-y-4">
          {feedbacks
            ?.filter((f) => f.user_feedback <= 2)
            .slice(0, 10)
            .map((f) => (
              <div key={f.id} className="border-b border-border-default pb-4 last:border-0">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm text-text-tertiary">
                      {new Date(f.created_at).toLocaleString('pt-BR')}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-yellow-500">{'⭐'.repeat(f.user_feedback)}</span>
                      <span className="px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-700 rounded-full">
                        {f.sentiment_emotion}
                      </span>
                      <span className="px-2 py-1 text-xs font-semibold bg-orange-100 text-orange-700 rounded-full">
                        {f.sentiment_urgency}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-text-tertiary">
                    Roboticness: {(f.roboticness_after * 100).toFixed(0)}%
                  </p>
                </div>
                <details>
                  <summary className="text-sm text-blue-600 cursor-pointer hover:text-blue-800">
                    Ver resposta
                  </summary>
                  <div className="mt-2 bg-bg-elevated rounded-lg p-3">
                    <p className="text-sm text-text-secondary">{f.humanized_response}</p>
                  </div>
                </details>
              </div>
            ))}
          {(!feedbacks || feedbacks.filter((f) => f.user_feedback <= 2).length === 0) && (
            <p className="text-center text-text-tertiary py-8">
              Nenhum feedback negativo ainda! 🎉
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
