import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/server/supabase-admin';

/**
 * GET /api/admin/metrics/feedback - Metricas de feedback
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

    const nDaysAgo = new Date();
    nDaysAgo.setDate(nDaysAgo.getDate() - days);

    const { data: feedbacks, error } = await supabaseAdmin
      .from('ai_feedback')
      .select(`
        *,
        ai_response_logs (
          ai_type,
          sentiment_emotion,
          roboticness_after,
          was_crisis
        )
      `)
      .gte('created_at', nDaysAgo.toISOString())
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Trends por data
    const trendsByDate: Record<string, { ratings: number[]; count: number }> = {};
    feedbacks?.forEach((f) => {
      const date = new Date(f.created_at).toISOString().split('T')[0];
      if (!trendsByDate[date]) {
        trendsByDate[date] = { ratings: [], count: 0 };
      }
      trendsByDate[date].ratings.push(f.rating);
      trendsByDate[date].count++;
    });

    const trendsData = Object.entries(trendsByDate).map(([date, data]) => ({
      date: new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
      avgRating: Number((data.ratings.reduce((a, b) => a + b, 0) / data.count).toFixed(1)),
      count: data.count,
    }));

    // Stats summary
    const totalFeedbacks = feedbacks?.length || 0;
    const avgRating = feedbacks && feedbacks.length > 0
      ? feedbacks.reduce((acc, f) => acc + f.rating, 0) / feedbacks.length
      : 0;

    // Distribuicao de ratings
    const ratingCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    feedbacks?.forEach((f) => {
      ratingCounts[f.rating as keyof typeof ratingCounts]++;
    });

    // Distribuicao de response_type
    const typeCounts: Record<string, number> = {};
    feedbacks?.forEach((f) => {
      typeCounts[f.response_type] = (typeCounts[f.response_type] || 0) + 1;
    });

    // Tags mais comuns
    const allTags: string[] = [];
    feedbacks?.forEach((f) => {
      if (f.tags && Array.isArray(f.tags)) {
        allTags.push(...f.tags);
      }
    });

    const tagCounts: Record<string, number> = {};
    allTags.forEach((tag) => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });

    const topTags = Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));

    // Feedbacks com comentarios
    const withComments = feedbacks?.filter((f) => f.comment).length || 0;

    return NextResponse.json({
      summary: {
        totalFeedbacks,
        avgRating: Number(avgRating.toFixed(1)),
        withComments,
        commentPercentage: totalFeedbacks > 0 ? Number(((withComments / totalFeedbacks) * 100).toFixed(1)) : 0,
      },
      trends: trendsData,
      ratingDistribution: Object.entries(ratingCounts).map(([rating, count]) => ({
        rating: Number(rating),
        count,
        percentage: totalFeedbacks > 0 ? Number(((count / totalFeedbacks) * 100).toFixed(1)) : 0,
      })),
      typeDistribution: Object.entries(typeCounts).map(([type, count]) => ({
        type,
        count,
        percentage: totalFeedbacks > 0 ? Number(((count / totalFeedbacks) * 100).toFixed(1)) : 0,
      })),
      topTags,
    });
  } catch (error) {
    console.error('Feedback metrics error:', error);
    return NextResponse.json({ error: 'Erro ao buscar metricas' }, { status: 500 });
  }
}
