import { createClient } from '@/lib/supabase/server';
import { KPICards } from '@/components/admin/ai-observatory/KPICards';
import { EvolutionChart } from '@/components/admin/ai-observatory/EvolutionChart';
import { EmotionDistribution } from '@/components/admin/ai-observatory/EmotionDistribution';
import { UrgencyDistribution } from '@/components/admin/ai-observatory/UrgencyDistribution';

export default async function AIObservatoryOverview() {
  const supabase = await createClient();

  // Buscar métricas dos últimos 7 dias
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: dailyMetrics } = await supabase
    .from('ai_metrics_daily')
    .select('*')
    .gte('date', sevenDaysAgo.toISOString().split('T')[0])
    .order('date', { ascending: true });

  // Buscar total de respostas (all time)
  const { count: totalResponses } = await supabase
    .from('ai_response_logs')
    .select('*', { count: 'exact', head: true });

  // Buscar média de humanização (últimos 7 dias)
  const { data: humanizationData } = await supabase
    .from('ai_response_logs')
    .select('roboticness_before, roboticness_after')
    .gte('created_at', sevenDaysAgo.toISOString())
    .not('roboticness_after', 'is', null);

  const avgRoboticnessBefore =
    humanizationData && humanizationData.length > 0
      ? humanizationData.reduce((sum, row) => sum + (row.roboticness_before || 0), 0) / humanizationData.length
      : 0;

  const avgRoboticnessAfter =
    humanizationData && humanizationData.length > 0
      ? humanizationData.reduce((sum, row) => sum + (row.roboticness_after || 0), 0) / humanizationData.length
      : 0;

  const humanizationPercent = avgRoboticnessBefore > 0
    ? ((avgRoboticnessBefore - avgRoboticnessAfter) / avgRoboticnessBefore) * 100
    : 0;

  // Buscar total de crises detectadas (últimos 7 dias)
  const { count: crisesCount } = await supabase
    .from('ai_response_logs')
    .select('*', { count: 'exact', head: true })
    .eq('was_crisis', true)
    .gte('created_at', sevenDaysAgo.toISOString());

  // Buscar rating médio (últimos 7 dias)
  const { data: feedbackData } = await supabase
    .from('ai_response_logs')
    .select('user_feedback')
    .not('user_feedback', 'is', null)
    .gte('created_at', sevenDaysAgo.toISOString());

  const avgRating =
    feedbackData && feedbackData.length > 0
      ? feedbackData.reduce((sum, row) => sum + (row.user_feedback || 0), 0) / feedbackData.length
      : 0;

  // Buscar distribuição de emoções (últimos 7 dias)
  const { data: emotionData } = await supabase
    .from('ai_response_logs')
    .select('sentiment_emotion')
    .not('sentiment_emotion', 'is', null)
    .gte('created_at', sevenDaysAgo.toISOString());

  const emotionCounts = emotionData?.reduce((acc: any, row) => {
    const emotion = row.sentiment_emotion;
    acc[emotion] = (acc[emotion] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  // Buscar distribuição de urgência (últimos 7 dias)
  const { data: urgencyData } = await supabase
    .from('ai_response_logs')
    .select('sentiment_urgency')
    .not('sentiment_urgency', 'is', null)
    .gte('created_at', sevenDaysAgo.toISOString());

  const urgencyCounts = urgencyData?.reduce((acc: any, row) => {
    const urgency = row.sentiment_urgency;
    acc[urgency] = (acc[urgency] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-text-primary">AI Observatory</h1>
        <p className="mt-2 text-text-secondary">
          Monitore a evolução da IA em tempo real - BERT + GPT-4o
        </p>
      </div>

      {/* KPIs */}
      <KPICards
        totalResponses={totalResponses || 0}
        humanizationPercent={humanizationPercent}
        totalCrises={crisesCount || 0}
        avgRating={avgRating}
      />

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Evolution Chart */}
        <div className="lg:col-span-2">
          <EvolutionChart data={dailyMetrics || []} />
        </div>

        {/* Emotion Distribution */}
        <EmotionDistribution data={emotionCounts} />

        {/* Urgency Distribution */}
        <UrgencyDistribution data={urgencyCounts} />
      </div>
    </div>
  );
}
