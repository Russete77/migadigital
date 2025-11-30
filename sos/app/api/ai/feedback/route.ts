import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, handleApiError, ApiError } from '@/lib/server/auth';
import { supabaseAdmin } from '@/lib/server/supabase-admin';
import { learningPipeline } from '@/lib/server/ai/learning-pipeline';

export async function POST(request: NextRequest) {
  try {
    // Authenticate (throws if not authenticated)
    const { profileId, userId } = await authenticateRequest();

    const body = await request.json();
    const { responseId, responseLogId, responseType, rating, tags, comment } = body;

    // Validate input
    if ((!responseId && !responseLogId) || !responseType || typeof rating !== 'number') {
      throw new ApiError('Dados inválidos', 400);
    }

    if (!['chat', 'analyzer'].includes(responseType)) {
      throw new ApiError('Tipo de resposta inválido', 400);
    }

    if (rating < 1 || rating > 5) {
      throw new ApiError('Rating deve estar entre 1 e 5', 400);
    }

    // Find the log entry
    let logEntry: {
      id: string;
      sentiment_emotion?: string;
      sentiment_urgency?: string;
      template_id?: string;
      ab_experiment_id?: string;
      ab_variant?: string;
      added_markers?: string[];
      removed_phrases?: string[];
    } | null = null;

    if (responseLogId) {
      // Busca direta pelo ID do log
      const { data, error } = await supabaseAdmin
        .from('ai_response_logs')
        .select('id, sentiment_emotion, sentiment_urgency, template_id, ab_experiment_id, ab_variant, added_markers, removed_phrases')
        .eq('id', responseLogId)
        .single();

      if (!error && data) {
        logEntry = data;
      }
    }

    if (!logEntry && responseId) {
      // Fallback: busca pelo session_id
      const { data, error } = await supabaseAdmin
        .from('ai_response_logs')
        .select('id, sentiment_emotion, sentiment_urgency, template_id, ab_experiment_id, ab_variant, added_markers, removed_phrases')
        .eq('session_id', responseId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!error && data) {
        logEntry = data;
      }
    }

    if (!logEntry) {
      console.error('Log entry not found for feedback:', { responseId, responseLogId, userId: profileId });
      throw new ApiError('Resposta não encontrada', 404);
    }

    // Insert feedback
    const { data: feedback, error: feedbackError } = await supabaseAdmin
      .from('ai_feedback')
      .insert({
        log_id: logEntry.id,
        user_id: profileId,
        response_type: responseType,
        rating,
        tags: tags || [],
        comment: comment || null,
      })
      .select('id')
      .single();

    if (feedbackError) {
      console.error('Error inserting feedback:', feedbackError);
      throw new ApiError('Erro ao salvar feedback', 500);
    }

    // Update the log with feedback
    await supabaseAdmin
      .from('ai_response_logs')
      .update({ user_feedback: rating })
      .eq('id', logEntry.id);

    console.log('✅ Feedback saved:', { feedbackId: feedback.id, rating, tags: tags?.length || 0 });

    // ═══════════════════════════════════════════════════════════════
    // LEARNING PIPELINE: Processar feedback para aprendizado
    // ═══════════════════════════════════════════════════════════════
    try {
      // Combinar regras aplicadas
      const rulesApplied = [
        ...(logEntry.added_markers || []),
        ...(logEntry.removed_phrases || []),
      ];

      await learningPipeline.processFeedback({
        responseLogId: logEntry.id,
        rating,
        emotion: logEntry.sentiment_emotion || 'confusa',
        urgency: logEntry.sentiment_urgency || 'baixa',
        templateId: logEntry.template_id || undefined,
        abExperimentId: logEntry.ab_experiment_id || undefined,
        abVariant: logEntry.ab_variant as 'control' | 'variant' | undefined,
        rulesApplied,
      });

      console.log('🧠 Learning Pipeline: Feedback processado com sucesso');
    } catch (learningError) {
      // Não falhar o request se o learning falhar
      console.error('⚠️ Learning Pipeline error (non-fatal):', learningError);
    }

    return NextResponse.json({
      success: true,
      feedbackId: feedback.id,
      learningProcessed: true,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * GET: Buscar resumo de feedback para métricas
 */
export async function GET(request: NextRequest) {
  try {
    await authenticateRequest();

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7');

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Buscar métricas agregadas
    const { data: feedbacks, error } = await supabaseAdmin
      .from('ai_feedback')
      .select('rating, tags, created_at')
      .gte('created_at', startDate.toISOString());

    if (error) throw error;

    // Calcular métricas
    const totalFeedbacks = feedbacks?.length || 0;
    const avgRating = totalFeedbacks > 0
      ? feedbacks!.reduce((sum, f) => sum + f.rating, 0) / totalFeedbacks
      : 0;

    const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const tagCounts: Record<string, number> = {};

    feedbacks?.forEach(f => {
      ratingDistribution[f.rating] = (ratingDistribution[f.rating] || 0) + 1;
      (f.tags || []).forEach((tag: string) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    return NextResponse.json({
      totalFeedbacks,
      avgRating: avgRating.toFixed(2),
      ratingDistribution,
      topTags: Object.entries(tagCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([tag, count]) => ({ tag, count })),
      positiveRate: totalFeedbacks > 0
        ? ((ratingDistribution[4] + ratingDistribution[5]) / totalFeedbacks * 100).toFixed(1)
        : 0,
      negativeRate: totalFeedbacks > 0
        ? ((ratingDistribution[1] + ratingDistribution[2]) / totalFeedbacks * 100).toFixed(1)
        : 0,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
