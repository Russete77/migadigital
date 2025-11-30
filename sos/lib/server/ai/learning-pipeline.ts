import { supabaseAdmin } from '@/lib/server/supabase-admin';
import { adaptiveHumanizer } from '../nlp/adaptive-humanizer';

export interface LearningEvent {
  responseLogId: string;
  rating: number;
  emotion: string;
  urgency: string;
  templateId?: string;
  abExperimentId?: string;
  abVariant?: string;
  rulesApplied?: string[];
  modelUsed?: string;
}

export interface DailyMetrics {
  date: string;
  totalAnalyses: number;
  emotionDistribution: Record<string, number>;
  urgencyDistribution: Record<string, number>;
  avgConfidence: number;
  totalHumanizations: number;
  avgRoboticnessBefore: number;
  avgRoboticnessAfter: number;
  avgImprovement: number;
  totalFeedbacks: number;
  avgRating: number;
  totalCrises: number;
}

/**
 * Learning Pipeline v1.0
 *
 * Orquestra o aprendizado contínuo da IA:
 * 1. Processa feedback em tempo real
 * 2. Atualiza pesos do humanizador
 * 3. Atualiza métricas dos templates
 * 4. Agrega métricas diárias
 * 5. Identifica padrões e anomalias
 */
export class LearningPipeline {
  /**
   * Processa evento de feedback
   */
  async processFeedback(event: LearningEvent): Promise<void> {
    console.log('🧠 Learning Pipeline: Processando feedback', {
      rating: event.rating,
      emotion: event.emotion,
    });

    try {
      // 1. Atualizar pesos do humanizador
      if (event.rulesApplied && event.rulesApplied.length > 0) {
        await adaptiveHumanizer.updateWeightsFromFeedback(
          event.rulesApplied,
          event.rating,
          event.emotion
        );
        console.log('✅ Pesos do humanizador atualizados');
      }

      // 2. Atualizar métricas do template
      if (event.templateId) {
        await this.updateTemplateMetrics(event.templateId, event.rating);
        console.log('✅ Métricas do template atualizadas');
      }

      // 3. Registrar resultado do A/B test
      if (event.abExperimentId && event.abVariant) {
        await this.recordABResult(
          event.abExperimentId,
          event.abVariant,
          event.rating,
          event.responseLogId
        );
        console.log('✅ Resultado A/B registrado');
      }

      // 4. Verificar se precisa de ação (rating muito baixo)
      if (event.rating <= 2) {
        await this.handleNegativeFeedback(event);
      }

      // 5. Atualizar log com informações de aprendizado
      await supabaseAdmin
        .from('ai_response_logs')
        .update({
          learning_processed: true,
          learning_processed_at: new Date().toISOString(),
        })
        .eq('id', event.responseLogId);

    } catch (error) {
      console.error('❌ Erro no Learning Pipeline:', error);
    }
  }

  /**
   * Atualiza métricas do template
   */
  private async updateTemplateMetrics(templateId: string, rating: number): Promise<void> {
    const { data: template } = await supabaseAdmin
      .from('ai_prompt_templates')
      .select('times_used, total_rating, positive_feedback_count, negative_feedback_count')
      .eq('id', templateId)
      .single();

    if (!template) return;

    await supabaseAdmin
      .from('ai_prompt_templates')
      .update({
        times_used: template.times_used + 1,
        total_rating: template.total_rating + rating,
        positive_feedback_count: rating >= 4
          ? template.positive_feedback_count + 1
          : template.positive_feedback_count,
        negative_feedback_count: rating <= 2
          ? template.negative_feedback_count + 1
          : template.negative_feedback_count,
        updated_at: new Date().toISOString(),
      })
      .eq('id', templateId);
  }

  /**
   * Registra resultado de A/B test
   */
  private async recordABResult(
    experimentId: string,
    variant: string,
    rating: number,
    responseLogId: string
  ): Promise<void> {
    // Registrar assignment
    await supabaseAdmin.from('ai_ab_assignments').insert({
      experiment_id: experimentId,
      response_log_id: responseLogId,
      variant,
      rating,
      was_positive: rating >= 4,
    });

    // Atualizar contadores do experimento
    const column = variant === 'control'
      ? rating >= 4 ? 'control_conversions' : 'control_impressions'
      : rating >= 4 ? 'variant_conversions' : 'variant_impressions';

    // Buscar e atualizar
    const { data: experiment } = await supabaseAdmin
      .from('ai_ab_experiments')
      .select('*')
      .eq('id', experimentId)
      .single();

    if (experiment) {
      const updates: Record<string, number> = {};
      if (variant === 'control') {
        if (rating >= 4) updates.control_conversions = experiment.control_conversions + 1;
      } else {
        if (rating >= 4) updates.variant_conversions = experiment.variant_conversions + 1;
      }

      // Recalcular médias
      const { data: assignments } = await supabaseAdmin
        .from('ai_ab_assignments')
        .select('variant, rating')
        .eq('experiment_id', experimentId)
        .not('rating', 'is', null);

      if (assignments) {
        const control = assignments.filter(a => a.variant === 'control');
        const variantData = assignments.filter(a => a.variant === 'variant');

        updates.control_avg_rating = control.length > 0
          ? control.reduce((s, a) => s + a.rating, 0) / control.length
          : 0;
        updates.variant_avg_rating = variantData.length > 0
          ? variantData.reduce((s, a) => s + a.rating, 0) / variantData.length
          : 0;
      }

      await supabaseAdmin
        .from('ai_ab_experiments')
        .update(updates)
        .eq('id', experimentId);
    }
  }

  /**
   * Lida com feedback negativo
   */
  private async handleNegativeFeedback(event: LearningEvent): Promise<void> {
    // Registrar para análise
    console.warn('⚠️ Feedback negativo detectado:', {
      emotion: event.emotion,
      urgency: event.urgency,
      rating: event.rating,
    });

    // Se urgência crítica e feedback negativo, alertar
    if (event.urgency === 'critica') {
      await this.createAlert({
        type: 'negative_crisis_feedback',
        severity: 'high',
        message: `Feedback negativo (${event.rating}/5) em situação crítica`,
        responseLogId: event.responseLogId,
      });
    }

    // Se template teve muitos negativos, desativar temporariamente
    if (event.templateId) {
      const { data: template } = await supabaseAdmin
        .from('ai_prompt_templates')
        .select('negative_feedback_count, times_used')
        .eq('id', event.templateId)
        .single();

      if (template && template.times_used >= 10) {
        const negativeRate = template.negative_feedback_count / template.times_used;
        if (negativeRate > 0.3) {
          // Mais de 30% negativo - desativar
          await supabaseAdmin
            .from('ai_prompt_templates')
            .update({ is_active: false })
            .eq('id', event.templateId);

          await this.createAlert({
            type: 'template_disabled',
            severity: 'medium',
            message: `Template desativado por alta taxa de feedback negativo (${(negativeRate * 100).toFixed(0)}%)`,
            templateId: event.templateId,
          });
        }
      }
    }
  }

  /**
   * Cria alerta no sistema
   */
  private async createAlert(alert: {
    type: string;
    severity: 'low' | 'medium' | 'high';
    message: string;
    responseLogId?: string;
    templateId?: string;
  }): Promise<void> {
    // Por agora, apenas logar. Futuramente pode enviar para Slack/Discord
    console.log('🚨 ALERTA:', alert);

    // Opcional: salvar em tabela de alertas
    // await supabaseAdmin.from('ai_alerts').insert(alert);
  }

  /**
   * Agrega métricas diárias (rodar via cron)
   */
  async aggregateDailyMetrics(targetDate?: Date): Promise<DailyMetrics | null> {
    const date = targetDate || new Date(Date.now() - 24 * 60 * 60 * 1000); // Ontem
    const dateStr = date.toISOString().split('T')[0];

    console.log(`📊 Agregando métricas para ${dateStr}`);

    try {
      // Buscar logs do dia
      const { data: logs, error } = await supabaseAdmin
        .from('ai_response_logs')
        .select('*')
        .gte('created_at', `${dateStr}T00:00:00`)
        .lt('created_at', `${dateStr}T23:59:59`);

      if (error) throw error;
      if (!logs || logs.length === 0) {
        console.log('Nenhum log encontrado para o dia');
        return null;
      }

      // Calcular métricas
      const emotionCounts: Record<string, number> = {};
      const urgencyCounts: Record<string, number> = {};
      let totalConfidence = 0;
      let totalRoboticBefore = 0;
      let totalRoboticAfter = 0;
      let humanizationCount = 0;
      let totalRating = 0;
      let feedbackCount = 0;
      let crisisCount = 0;

      for (const log of logs) {
        // Emoções
        const emotion = log.sentiment_emotion || 'unknown';
        emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;

        // Urgências
        const urgency = log.sentiment_urgency || 'unknown';
        urgencyCounts[urgency] = (urgencyCounts[urgency] || 0) + 1;

        // Confiança
        if (log.bert_confidence) {
          totalConfidence += log.bert_confidence;
        }

        // Humanização
        if (log.roboticness_before != null && log.roboticness_after != null) {
          totalRoboticBefore += log.roboticness_before;
          totalRoboticAfter += log.roboticness_after;
          humanizationCount++;
        }

        // Feedback
        if (log.user_feedback != null) {
          totalRating += log.user_feedback;
          feedbackCount++;
        }

        // Crises
        if (log.was_crisis) {
          crisisCount++;
        }
      }

      const metrics: DailyMetrics = {
        date: dateStr,
        totalAnalyses: logs.length,
        emotionDistribution: emotionCounts,
        urgencyDistribution: urgencyCounts,
        avgConfidence: logs.length > 0 ? totalConfidence / logs.length : 0,
        totalHumanizations: humanizationCount,
        avgRoboticnessBefore: humanizationCount > 0 ? totalRoboticBefore / humanizationCount : 0,
        avgRoboticnessAfter: humanizationCount > 0 ? totalRoboticAfter / humanizationCount : 0,
        avgImprovement: humanizationCount > 0 && totalRoboticBefore > 0
          ? ((totalRoboticBefore - totalRoboticAfter) / totalRoboticBefore) * 100
          : 0,
        totalFeedbacks: feedbackCount,
        avgRating: feedbackCount > 0 ? totalRating / feedbackCount : 0,
        totalCrises: crisisCount,
      };

      // Salvar no banco
      await supabaseAdmin.from('ai_learning_metrics').upsert({
        metric_date: dateStr,
        metric_hour: null,
        total_analyses: metrics.totalAnalyses,
        emotion_distribution: metrics.emotionDistribution,
        urgency_distribution: metrics.urgencyDistribution,
        avg_confidence: metrics.avgConfidence,
        total_humanizations: metrics.totalHumanizations,
        avg_roboticness_before: metrics.avgRoboticnessBefore,
        avg_roboticness_after: metrics.avgRoboticnessAfter,
        avg_improvement_percent: metrics.avgImprovement,
        total_feedbacks: metrics.totalFeedbacks,
        avg_rating: metrics.avgRating,
        total_crises: metrics.totalCrises,
      }, {
        onConflict: 'metric_date,metric_hour',
      });

      console.log('✅ Métricas agregadas com sucesso:', {
        analyses: metrics.totalAnalyses,
        avgRating: metrics.avgRating.toFixed(2),
        improvement: `${metrics.avgImprovement.toFixed(1)}%`,
      });

      return metrics;

    } catch (error) {
      console.error('❌ Erro ao agregar métricas:', error);
      return null;
    }
  }

  /**
   * Identifica templates de alto desempenho
   */
  async getTopPerformingTemplates(limit: number = 5): Promise<any[]> {
    const { data } = await supabaseAdmin
      .from('ai_prompt_templates')
      .select('*')
      .eq('is_active', true)
      .gte('times_used', 10)
      .order('avg_rating', { ascending: false })
      .limit(limit);

    return data || [];
  }

  /**
   * Identifica regras de humanização mais efetivas
   */
  async getEffectiveHumanizerRules(): Promise<any[]> {
    const { data } = await supabaseAdmin
      .from('ai_humanizer_weights')
      .select('*')
      .eq('is_active', true)
      .gte('times_applied', 10)
      .order('learned_weight', { ascending: false });

    return data || [];
  }
}

// Singleton
export const learningPipeline = new LearningPipeline();
