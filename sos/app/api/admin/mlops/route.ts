import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { learningPipeline } from '@/lib/server/ai/learning-pipeline';

/**
 * API para ML Ops Dashboard
 * Fornece métricas de aprendizado e performance dos modelos
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7');

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // 1. Métricas de Modelos BERT
    const { data: bertMetrics } = await supabase
      .from('ai_response_logs')
      .select('model_used, bert_confidence, bert_time_ms')
      .gte('created_at', startDate.toISOString())
      .not('model_used', 'is', null);

    const modelStats: Record<string, { count: number; avgConfidence: number; avgTime: number; confidences: number[]; times: number[] }> = {};

    bertMetrics?.forEach(log => {
      const model = log.model_used || 'unknown';
      if (!modelStats[model]) {
        modelStats[model] = { count: 0, avgConfidence: 0, avgTime: 0, confidences: [], times: [] };
      }
      modelStats[model].count++;
      if (log.bert_confidence) modelStats[model].confidences.push(log.bert_confidence);
      if (log.bert_time_ms) modelStats[model].times.push(log.bert_time_ms);
    });

    Object.keys(modelStats).forEach(model => {
      const stats = modelStats[model];
      stats.avgConfidence = stats.confidences.length > 0
        ? stats.confidences.reduce((a, b) => a + b, 0) / stats.confidences.length
        : 0;
      stats.avgTime = stats.times.length > 0
        ? stats.times.reduce((a, b) => a + b, 0) / stats.times.length
        : 0;
    });

    // 2. Performance dos Templates
    const { data: templates } = await supabase
      .from('ai_prompt_templates')
      .select('*')
      .eq('is_active', true)
      .order('avg_rating', { ascending: false });

    const topTemplates = templates?.slice(0, 5).map(t => ({
      name: t.name,
      emotion: t.emotion,
      avgRating: t.avg_rating,
      timesUsed: t.times_used,
      positiveRate: t.times_used > 0
        ? ((t.positive_feedback_count / t.times_used) * 100).toFixed(1)
        : 0,
    })) || [];

    // 3. Experimentos A/B Ativos
    const { data: experiments } = await supabase
      .from('ai_ab_experiments')
      .select('*')
      .in('status', ['running', 'completed'])
      .order('created_at', { ascending: false })
      .limit(5);

    const abExperiments = experiments?.map(e => ({
      name: e.name,
      status: e.status,
      type: e.experiment_type,
      controlAvgRating: e.control_avg_rating,
      variantAvgRating: e.variant_avg_rating,
      controlImpressions: e.control_impressions,
      variantImpressions: e.variant_impressions,
      isSignificant: e.is_significant,
      winner: e.winner,
      lift: e.control_avg_rating > 0
        ? (((e.variant_avg_rating - e.control_avg_rating) / e.control_avg_rating) * 100).toFixed(1)
        : 0,
    })) || [];

    // 4. Pesos do Humanizador
    const { data: humanizerWeights } = await supabase
      .from('ai_humanizer_weights')
      .select('*')
      .eq('is_active', true)
      .order('learned_weight', { ascending: false });

    const weightsList = humanizerWeights?.map(w => ({
      rule: w.rule_name,
      type: w.rule_type,
      baseWeight: w.base_weight,
      learnedWeight: w.learned_weight,
      confidence: w.confidence,
      timesApplied: w.times_applied,
      positiveCorrelation: w.positive_correlation,
      negativeCorrelation: w.negative_correlation,
    })) || [];

    // 5. Métricas de Aprendizado Diário
    const { data: dailyMetrics } = await supabase
      .from('ai_learning_metrics')
      .select('*')
      .gte('metric_date', startDate.toISOString().split('T')[0])
      .order('metric_date', { ascending: true });

    // 6. Distribuição de Emoções
    const emotionCounts: Record<string, number> = {};
    bertMetrics?.forEach(log => {
      // Buscar emoção do log
    });

    const { data: emotionData } = await supabase
      .from('ai_response_logs')
      .select('sentiment_emotion')
      .gte('created_at', startDate.toISOString())
      .not('sentiment_emotion', 'is', null);

    emotionData?.forEach(log => {
      const emotion = log.sentiment_emotion || 'unknown';
      emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
    });

    // 7. Taxa de Melhoria do Humanizador
    const { data: humanizationData } = await supabase
      .from('ai_response_logs')
      .select('roboticness_before, roboticness_after')
      .gte('created_at', startDate.toISOString())
      .not('roboticness_before', 'is', null)
      .not('roboticness_after', 'is', null);

    let totalImprovement = 0;
    let improvementCount = 0;

    humanizationData?.forEach(log => {
      if (log.roboticness_before > 0) {
        const improvement = ((log.roboticness_before - log.roboticness_after) / log.roboticness_before) * 100;
        totalImprovement += improvement;
        improvementCount++;
      }
    });

    const avgImprovement = improvementCount > 0 ? totalImprovement / improvementCount : 0;

    // 8. KPIs Resumidos
    const totalResponses = bertMetrics?.length || 0;
    const avgBertTime = bertMetrics && bertMetrics.length > 0
      ? bertMetrics.filter(b => b.bert_time_ms).reduce((s, b) => s + (b.bert_time_ms || 0), 0) / bertMetrics.filter(b => b.bert_time_ms).length
      : 0;

    return NextResponse.json({
      kpis: {
        totalResponses,
        avgBertTime: Math.round(avgBertTime),
        avgImprovement: avgImprovement.toFixed(1),
        activeExperiments: experiments?.filter(e => e.status === 'running').length || 0,
        activeTemplates: templates?.length || 0,
      },
      modelStats: Object.entries(modelStats).map(([model, stats]) => ({
        model,
        count: stats.count,
        avgConfidence: (stats.avgConfidence * 100).toFixed(1),
        avgTime: Math.round(stats.avgTime),
      })),
      topTemplates,
      abExperiments,
      humanizerWeights: weightsList,
      dailyMetrics: dailyMetrics?.map(d => ({
        date: d.metric_date,
        totalAnalyses: d.total_analyses,
        avgRating: d.avg_rating,
        avgImprovement: d.avg_improvement_percent,
        totalCrises: d.total_crises,
      })) || [],
      emotionDistribution: emotionCounts,
    });

  } catch (error) {
    console.error('ML Ops API error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar métricas de ML' },
      { status: 500 }
    );
  }
}

/**
 * POST: Trigger ações de ML Ops
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, params } = body;

    switch (action) {
      case 'aggregate_daily_metrics':
        const metrics = await learningPipeline.aggregateDailyMetrics(
          params?.date ? new Date(params.date) : undefined
        );
        return NextResponse.json({ success: true, metrics });

      case 'get_top_templates':
        const topTemplates = await learningPipeline.getTopPerformingTemplates(params?.limit || 5);
        return NextResponse.json({ success: true, templates: topTemplates });

      case 'get_effective_rules':
        const rules = await learningPipeline.getEffectiveHumanizerRules();
        return NextResponse.json({ success: true, rules });

      default:
        return NextResponse.json({ error: 'Ação desconhecida' }, { status: 400 });
    }

  } catch (error) {
    console.error('ML Ops POST error:', error);
    return NextResponse.json(
      { error: 'Erro ao executar ação de ML' },
      { status: 500 }
    );
  }
}
