import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/server/supabase-admin';

/**
 * GET /api/admin/metrics/humanization - Metricas de humanizacao
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

    const { data: responses, error } = await supabaseAdmin
      .from('ai_response_logs')
      .select('*')
      .gte('created_at', nDaysAgo.toISOString())
      .not('roboticness_before', 'is', null)
      .not('roboticness_after', 'is', null)
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Trends por data
    const trendsByDate: Record<string, { before: number[]; after: number[]; count: number }> = {};
    responses?.forEach((r) => {
      const date = new Date(r.created_at).toISOString().split('T')[0];
      if (!trendsByDate[date]) {
        trendsByDate[date] = { before: [], after: [], count: 0 };
      }
      trendsByDate[date].before.push(r.roboticness_before);
      trendsByDate[date].after.push(r.roboticness_after);
      trendsByDate[date].count++;
    });

    const trendsData = Object.entries(trendsByDate).map(([date, data]) => ({
      date: new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
      roboticness_before: Number((data.before.reduce((a, b) => a + b, 0) / data.count).toFixed(2)),
      roboticness_after: Number((data.after.reduce((a, b) => a + b, 0) / data.count).toFixed(2)),
      improvement: Number((
        ((data.before.reduce((a, b) => a + b, 0) / data.count) -
          (data.after.reduce((a, b) => a + b, 0) / data.count)) /
        (data.before.reduce((a, b) => a + b, 0) / data.count) *
        100
      ).toFixed(1)),
    }));

    // Stats summary
    const totalHumanized = responses?.length || 0;
    const avgRoboticnessBefore = responses && responses.length > 0
      ? responses.reduce((acc, r) => acc + r.roboticness_before, 0) / responses.length
      : 0;
    const avgRoboticnessAfter = responses && responses.length > 0
      ? responses.reduce((acc, r) => acc + r.roboticness_after, 0) / responses.length
      : 0;
    const avgImprovement = avgRoboticnessBefore > 0
      ? ((avgRoboticnessBefore - avgRoboticnessAfter) / avgRoboticnessBefore * 100)
      : 0;

    // Distribuicao de improvement
    const improvementRanges: Record<string, number> = {
      '0-20%': 0,
      '20-40%': 0,
      '40-60%': 0,
      '60-80%': 0,
      '80-100%': 0,
    };

    responses?.forEach((r) => {
      const improvement = r.roboticness_before > 0
        ? ((r.roboticness_before - r.roboticness_after) / r.roboticness_before * 100)
        : 0;

      if (improvement < 20) improvementRanges['0-20%']++;
      else if (improvement < 40) improvementRanges['20-40%']++;
      else if (improvement < 60) improvementRanges['40-60%']++;
      else if (improvement < 80) improvementRanges['60-80%']++;
      else improvementRanges['80-100%']++;
    });

    return NextResponse.json({
      summary: {
        totalHumanized,
        avgRoboticnessBefore: Number(avgRoboticnessBefore.toFixed(2)),
        avgRoboticnessAfter: Number(avgRoboticnessAfter.toFixed(2)),
        avgImprovement: Number(avgImprovement.toFixed(1)),
      },
      trends: trendsData,
      improvementDistribution: Object.entries(improvementRanges).map(([range, count]) => ({
        range,
        count,
        percentage: totalHumanized > 0 ? Number(((count / totalHumanized) * 100).toFixed(1)) : 0,
      })),
    });
  } catch (error) {
    console.error('Humanization metrics error:', error);
    return NextResponse.json({ error: 'Erro ao buscar metricas' }, { status: 500 });
  }
}
