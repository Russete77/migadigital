import { createClient } from '@/lib/supabase/server';
import { SentimentTrends } from '@/components/admin/ai-observatory/SentimentTrends';
import { KeywordsCloud } from '@/components/admin/ai-observatory/KeywordsCloud';
import { EmotionByHour } from '@/components/admin/ai-observatory/EmotionByHour';

export default async function SentimentPage() {
  const supabase = await createClient();

  // Buscar dados dos últimos 30 dias
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: responses } = await supabase
    .from('ai_response_logs')
    .select('*')
    .gte('created_at', thirtyDaysAgo.toISOString())
    .order('created_at', { ascending: true });

  // Agrupar por data para trends
  const trendsByDate: Record<string, Record<string, number>> = {};
  responses?.forEach((r) => {
    const date = new Date(r.created_at).toISOString().split('T')[0];
    if (!trendsByDate[date]) {
      trendsByDate[date] = {};
    }
    const emotion = r.sentiment_emotion;
    trendsByDate[date][emotion] = (trendsByDate[date][emotion] || 0) + 1;
  });

  const trendsData = Object.entries(trendsByDate).map(([date, emotions]) => ({
    date: new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
    ...emotions,
  }));

  // Agrupar por hora do dia
  const emotionsByHour: Record<number, Record<string, number>> = {};
  responses?.forEach((r) => {
    const hour = new Date(r.created_at).getHours();
    if (!emotionsByHour[hour]) {
      emotionsByHour[hour] = {};
    }
    const emotion = r.sentiment_emotion;
    emotionsByHour[hour][emotion] = (emotionsByHour[hour][emotion] || 0) + 1;
  });

  const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
    hour: `${hour.toString().padStart(2, '0')}h`,
    ...emotionsByHour[hour],
  }));

  // Extrair todas as keywords
  const allKeywords: string[] = [];
  responses?.forEach((r) => {
    if (r.sentiment_keywords) {
      allKeywords.push(...r.sentiment_keywords);
    }
  });

  // Contar frequência
  const keywordCounts: Record<string, number> = {};
  allKeywords.forEach((kw) => {
    keywordCounts[kw] = (keywordCounts[kw] || 0) + 1;
  });

  const topKeywords = Object.entries(keywordCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 30)
    .map(([word, count]) => ({ text: word, value: count }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Análise de Sentimentos</h1>
        <p className="mt-2 text-text-secondary">
          Tendências emocionais e palavras-chave dos últimos 30 dias
        </p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-bg-secondary rounded-xl shadow-tinder-sm border border-border-default p-6">
          <p className="text-sm font-medium text-text-secondary">Total Analisadas</p>
          <p className="text-3xl font-bold text-text-primary mt-2">
            {responses?.length || 0}
          </p>
        </div>

        <div className="bg-bg-secondary rounded-xl shadow-tinder-sm border border-border-default p-6">
          <p className="text-sm font-medium text-text-secondary">Emoção Dominante</p>
          <p className="text-2xl font-bold text-blue-600 mt-2">
            {responses && responses.length > 0
              ? Object.entries(
                  responses.reduce((acc: any, r) => {
                    acc[r.sentiment_emotion] = (acc[r.sentiment_emotion] || 0) + 1;
                    return acc;
                  }, {})
                ).sort(([, a]: any, [, b]: any) => b - a)[0][0]
              : 'N/A'}
          </p>
        </div>

        <div className="bg-bg-secondary rounded-xl shadow-tinder-sm border border-border-default p-6">
          <p className="text-sm font-medium text-text-secondary">Keywords Únicas</p>
          <p className="text-3xl font-bold text-purple-600 mt-2">
            {Object.keys(keywordCounts).length}
          </p>
        </div>

        <div className="bg-bg-secondary rounded-xl shadow-tinder-sm border border-border-default p-6">
          <p className="text-sm font-medium text-text-secondary">Intensidade Média</p>
          <p className="text-3xl font-bold text-orange-600 mt-2">
            {responses && responses.length > 0
              ? (
                  responses.reduce((sum, r) => sum + (r.sentiment_intensity || 0), 0) /
                  responses.length
                ).toFixed(2)
              : '0'}
          </p>
        </div>
      </div>

      {/* Trends Chart */}
      <SentimentTrends data={trendsData} />

      {/* Grid: Keywords + Hourly */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <KeywordsCloud keywords={topKeywords} />
        <EmotionByHour data={hourlyData} />
      </div>
    </div>
  );
}
