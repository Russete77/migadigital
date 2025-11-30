import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/server/supabase-admin';

/**
 * GET /api/admin/metrics/sentiment - Metricas de sentimento
 */
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    }

    // Verificar se e admin
    const { data: admin } = await supabaseAdmin
      .from('admin_users')
      .select('id')
      .eq('clerk_id', userId)
      .eq('is_active', true)
      .single();

    if (!admin) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const days = Number(searchParams.get('days')) || 30;

    // Buscar dados dos ultimos N dias
    const nDaysAgo = new Date();
    nDaysAgo.setDate(nDaysAgo.getDate() - days);

    const { data: responses, error } = await supabaseAdmin
      .from('ai_response_logs')
      .select('*')
      .gte('created_at', nDaysAgo.toISOString())
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Agrupar por data para trends
    const trendsByDate: Record<string, Record<string, number>> = {};
    responses?.forEach((r) => {
      const date = new Date(r.created_at).toISOString().split('T')[0];
      if (!trendsByDate[date]) {
        trendsByDate[date] = {};
      }
      const emotion = r.sentiment_emotion;
      if (emotion) {
        trendsByDate[date][emotion] = (trendsByDate[date][emotion] || 0) + 1;
      }
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
      if (emotion) {
        emotionsByHour[hour][emotion] = (emotionsByHour[hour][emotion] || 0) + 1;
      }
    });

    const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
      hour: `${hour.toString().padStart(2, '0')}h`,
      ...emotionsByHour[hour],
    }));

    // Extrair todas as keywords
    const allKeywords: string[] = [];
    responses?.forEach((r) => {
      if (r.sentiment_keywords && Array.isArray(r.sentiment_keywords)) {
        allKeywords.push(...r.sentiment_keywords);
      }
    });

    // Contar frequencia
    const keywordCounts: Record<string, number> = {};
    allKeywords.forEach((kw) => {
      keywordCounts[kw] = (keywordCounts[kw] || 0) + 1;
    });

    const topKeywords = Object.entries(keywordCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 30)
      .map(([word, count]) => ({ text: word, value: count }));

    // Stats summary
    const totalAnalyzed = responses?.length || 0;

    const emotionCounts: Record<string, number> = {};
    responses?.forEach((r) => {
      if (r.sentiment_emotion) {
        emotionCounts[r.sentiment_emotion] = (emotionCounts[r.sentiment_emotion] || 0) + 1;
      }
    });

    const dominantEmotion = totalAnalyzed > 0
      ? Object.entries(emotionCounts).sort(([, a], [, b]) => b - a)[0]?.[0] || 'N/A'
      : 'N/A';

    // Calcular intensidade media
    const avgIntensity = responses && responses.length > 0
      ? responses.reduce((acc, r) => acc + (r.sentiment_intensity || 0), 0) / responses.length
      : 0;

    // Contar crises
    const crisisCount = responses?.filter((r) => r.sentiment_urgency === 'critica').length || 0;

    return NextResponse.json({
      summary: {
        totalAnalyzed,
        dominantEmotion,
        avgIntensity: Number(avgIntensity.toFixed(2)),
        crisisCount,
      },
      trends: trendsData,
      hourly: hourlyData,
      keywords: topKeywords,
      emotionDistribution: Object.entries(emotionCounts).map(([emotion, count]) => ({
        emotion,
        count,
        percentage: Number(((count / totalAnalyzed) * 100).toFixed(1)),
      })),
    });
  } catch (error) {
    console.error('Sentiment metrics error:', error);
    return NextResponse.json({ error: 'Erro ao buscar metricas' }, { status: 500 });
  }
}
