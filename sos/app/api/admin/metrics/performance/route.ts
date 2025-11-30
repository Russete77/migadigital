import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/server/supabase-admin';

/**
 * GET /api/admin/metrics/performance - Metricas de performance
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
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Trends por data
    const trendsByDate: Record<string, {
      total: number[];
      bert: number[];
      gpt: number[];
      humanizer: number[];
      count: number;
    }> = {};

    responses?.forEach((r) => {
      const date = new Date(r.created_at).toISOString().split('T')[0];
      if (!trendsByDate[date]) {
        trendsByDate[date] = { total: [], bert: [], gpt: [], humanizer: [], count: 0 };
      }
      if (r.processing_time_ms) trendsByDate[date].total.push(r.processing_time_ms);
      if (r.bert_time_ms) trendsByDate[date].bert.push(r.bert_time_ms);
      if (r.gpt_time_ms) trendsByDate[date].gpt.push(r.gpt_time_ms);
      if (r.humanizer_time_ms) trendsByDate[date].humanizer.push(r.humanizer_time_ms);
      trendsByDate[date].count++;
    });

    const trendsData = Object.entries(trendsByDate).map(([date, data]) => ({
      date: new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
      total: data.total.length > 0 ? Number((data.total.reduce((a, b) => a + b, 0) / data.total.length).toFixed(0)) : 0,
      bert: data.bert.length > 0 ? Number((data.bert.reduce((a, b) => a + b, 0) / data.bert.length).toFixed(0)) : 0,
      gpt: data.gpt.length > 0 ? Number((data.gpt.reduce((a, b) => a + b, 0) / data.gpt.length).toFixed(0)) : 0,
      humanizer: data.humanizer.length > 0 ? Number((data.humanizer.reduce((a, b) => a + b, 0) / data.humanizer.length).toFixed(0)) : 0,
    }));

    // Stats summary
    const totalRequests = responses?.length || 0;

    const avgTotalTime = responses && responses.length > 0
      ? responses.reduce((acc, r) => acc + (r.processing_time_ms || 0), 0) / responses.length
      : 0;

    const avgBertTime = responses && responses.length > 0
      ? responses.reduce((acc, r) => acc + (r.bert_time_ms || 0), 0) / responses.length
      : 0;

    const avgGptTime = responses && responses.length > 0
      ? responses.reduce((acc, r) => acc + (r.gpt_time_ms || 0), 0) / responses.length
      : 0;

    const avgHumanizerTime = responses && responses.length > 0
      ? responses.reduce((acc, r) => acc + (r.humanizer_time_ms || 0), 0) / responses.length
      : 0;

    // Percentis (p50, p95, p99)
    const totalTimes = responses?.map((r) => r.processing_time_ms || 0).sort((a, b) => a - b) || [];
    const p50 = totalTimes[Math.floor(totalTimes.length * 0.5)] || 0;
    const p95 = totalTimes[Math.floor(totalTimes.length * 0.95)] || 0;
    const p99 = totalTimes[Math.floor(totalTimes.length * 0.99)] || 0;

    // Distribuicao por tipo de AI
    const aiTypeCounts: Record<string, number> = {};
    responses?.forEach((r) => {
      if (r.ai_type) {
        aiTypeCounts[r.ai_type] = (aiTypeCounts[r.ai_type] || 0) + 1;
      }
    });

    return NextResponse.json({
      summary: {
        totalRequests,
        avgTotalTime: Number(avgTotalTime.toFixed(0)),
        avgBertTime: Number(avgBertTime.toFixed(0)),
        avgGptTime: Number(avgGptTime.toFixed(0)),
        avgHumanizerTime: Number(avgHumanizerTime.toFixed(0)),
        percentiles: { p50, p95, p99 },
      },
      trends: trendsData,
      aiTypeDistribution: Object.entries(aiTypeCounts).map(([type, count]) => ({
        type,
        count,
        percentage: Number(((count / totalRequests) * 100).toFixed(1)),
      })),
    });
  } catch (error) {
    console.error('Performance metrics error:', error);
    return NextResponse.json({ error: 'Erro ao buscar metricas' }, { status: 500 });
  }
}
