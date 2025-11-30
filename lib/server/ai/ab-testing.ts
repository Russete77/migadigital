import { supabaseAdmin } from '@/lib/server/supabase-admin';

export interface ABExperiment {
  id: string;
  name: string;
  experiment_type: 'prompt' | 'humanizer' | 'model' | 'full_pipeline';
  control_config: Record<string, unknown>;
  variant_config: Record<string, unknown>;
  traffic_split: number;
  status: 'draft' | 'running' | 'paused' | 'completed';
  control_impressions: number;
  variant_impressions: number;
  control_avg_rating: number;
  variant_avg_rating: number;
}

export interface ABAssignment {
  experimentId: string;
  variant: 'control' | 'variant';
  config: Record<string, unknown>;
}

/**
 * A/B Testing Service v1.0
 *
 * Gerencia experimentos para otimização contínua da IA:
 * - Testes de diferentes prompts
 * - Testes de configurações do humanizador
 * - Testes de modelos BERT
 * - Análise estatística de resultados
 */
export class ABTestingService {
  private activeExperiments: Map<string, ABExperiment> = new Map();
  private lastFetch: number = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutos

  /**
   * Obtém atribuição de experimento para um usuário/sessão
   */
  async getAssignment(
    userId: string | undefined,
    experimentType: string
  ): Promise<ABAssignment | null> {
    const experiment = await this.getActiveExperiment(experimentType);

    if (!experiment) {
      return null;
    }

    const variant = this.assignVariant(userId, experiment.traffic_split);

    return {
      experimentId: experiment.id,
      variant,
      config: variant === 'control' ? experiment.control_config : experiment.variant_config,
    };
  }

  /**
   * Busca experimento ativo por tipo
   */
  private async getActiveExperiment(type: string): Promise<ABExperiment | null> {
    await this.refreshCache();

    for (const [, experiment] of this.activeExperiments) {
      if (experiment.experiment_type === type && experiment.status === 'running') {
        return experiment;
      }
    }

    return null;
  }

  /**
   * Atualiza cache de experimentos ativos
   */
  private async refreshCache(): Promise<void> {
    if (Date.now() - this.lastFetch < this.CACHE_TTL) {
      return;
    }

    const { data, error } = await supabaseAdmin
      .from('ai_ab_experiments')
      .select('*')
      .eq('status', 'running');

    if (error) {
      console.error('Erro ao buscar experimentos:', error);
      return;
    }

    this.activeExperiments.clear();
    for (const experiment of data || []) {
      this.activeExperiments.set(experiment.id, experiment);
    }

    this.lastFetch = Date.now();
  }

  /**
   * Atribui variante de forma determinística
   */
  private assignVariant(
    userId: string | undefined,
    trafficSplit: number
  ): 'control' | 'variant' {
    if (!userId) {
      return Math.random() < trafficSplit ? 'variant' : 'control';
    }

    // Hash determinístico para consistência
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = ((hash << 5) - hash) + userId.charCodeAt(i);
      hash = hash & hash;
    }

    const normalized = Math.abs(hash) / 2147483647;
    return normalized < trafficSplit ? 'variant' : 'control';
  }

  /**
   * Registra impressão de experimento
   */
  async logImpression(experimentId: string, variant: 'control' | 'variant'): Promise<void> {
    const column = variant === 'control' ? 'control_impressions' : 'variant_impressions';

    await supabaseAdmin.rpc('increment_column', {
      table_name: 'ai_ab_experiments',
      column_name: column,
      row_id: experimentId,
    });
  }

  /**
   * Registra resultado (conversão/rating) de experimento
   */
  async logResult(
    experimentId: string,
    variant: 'control' | 'variant',
    rating: number,
    responseLogId?: string
  ): Promise<void> {
    // Registrar assignment
    if (responseLogId) {
      await supabaseAdmin.from('ai_ab_assignments').insert({
        experiment_id: experimentId,
        response_log_id: responseLogId,
        variant,
        rating,
        was_positive: rating >= 4,
      });
    }

    // Atualizar métricas agregadas do experimento
    await this.updateExperimentMetrics(experimentId);
  }

  /**
   * Atualiza métricas agregadas do experimento
   */
  private async updateExperimentMetrics(experimentId: string): Promise<void> {
    const { data: assignments } = await supabaseAdmin
      .from('ai_ab_assignments')
      .select('variant, rating')
      .eq('experiment_id', experimentId)
      .not('rating', 'is', null);

    if (!assignments || assignments.length === 0) return;

    const control = assignments.filter(a => a.variant === 'control');
    const variant = assignments.filter(a => a.variant === 'variant');

    const controlAvg = control.length > 0
      ? control.reduce((sum, a) => sum + a.rating, 0) / control.length
      : 0;
    const variantAvg = variant.length > 0
      ? variant.reduce((sum, a) => sum + a.rating, 0) / variant.length
      : 0;

    // Calcular significância estatística (t-test simplificado)
    const { isSignificant, pValue, winner } = this.calculateSignificance(control, variant);

    await supabaseAdmin
      .from('ai_ab_experiments')
      .update({
        control_avg_rating: controlAvg,
        variant_avg_rating: variantAvg,
        control_conversions: control.filter(a => a.rating >= 4).length,
        variant_conversions: variant.filter(a => a.rating >= 4).length,
        is_significant: isSignificant,
        p_value: pValue,
        winner: isSignificant ? winner : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', experimentId);
  }

  /**
   * Calcula significância estatística usando t-test simplificado
   */
  private calculateSignificance(
    control: { rating: number }[],
    variant: { rating: number }[]
  ): { isSignificant: boolean; pValue: number; winner: 'control' | 'variant' | 'tie' } {
    if (control.length < 30 || variant.length < 30) {
      return { isSignificant: false, pValue: 1, winner: 'tie' };
    }

    const controlRatings = control.map(a => a.rating);
    const variantRatings = variant.map(a => a.rating);

    const controlMean = this.mean(controlRatings);
    const variantMean = this.mean(variantRatings);
    const controlStd = this.std(controlRatings);
    const variantStd = this.std(variantRatings);

    // Pooled standard error
    const se = Math.sqrt(
      (controlStd ** 2 / control.length) + (variantStd ** 2 / variant.length)
    );

    if (se === 0) {
      return { isSignificant: false, pValue: 1, winner: 'tie' };
    }

    // t-statistic
    const t = (variantMean - controlMean) / se;

    // Aproximação do p-value (distribuição normal para n grande)
    const pValue = 2 * (1 - this.normalCDF(Math.abs(t)));

    const isSignificant = pValue < 0.05;
    const winner = !isSignificant ? 'tie' : variantMean > controlMean ? 'variant' : 'control';

    return { isSignificant, pValue, winner };
  }

  private mean(arr: number[]): number {
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }

  private std(arr: number[]): number {
    const m = this.mean(arr);
    return Math.sqrt(arr.reduce((sum, x) => sum + (x - m) ** 2, 0) / arr.length);
  }

  private normalCDF(x: number): number {
    // Aproximação da CDF normal padrão
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x) / Math.sqrt(2);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return 0.5 * (1.0 + sign * y);
  }

  /**
   * Cria novo experimento
   */
  async createExperiment(params: {
    name: string;
    description?: string;
    experimentType: ABExperiment['experiment_type'];
    controlConfig: Record<string, unknown>;
    variantConfig: Record<string, unknown>;
    trafficSplit?: number;
  }): Promise<ABExperiment | null> {
    const { data, error } = await supabaseAdmin
      .from('ai_ab_experiments')
      .insert({
        name: params.name,
        description: params.description,
        experiment_type: params.experimentType,
        control_config: params.controlConfig,
        variant_config: params.variantConfig,
        traffic_split: params.trafficSplit || 0.5,
        status: 'draft',
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar experimento:', error);
      return null;
    }

    return data;
  }

  /**
   * Inicia experimento
   */
  async startExperiment(experimentId: string): Promise<boolean> {
    const { error } = await supabaseAdmin
      .from('ai_ab_experiments')
      .update({
        status: 'running',
        start_date: new Date().toISOString(),
      })
      .eq('id', experimentId);

    if (error) {
      console.error('Erro ao iniciar experimento:', error);
      return false;
    }

    // Limpar cache
    this.lastFetch = 0;
    return true;
  }

  /**
   * Para experimento
   */
  async stopExperiment(experimentId: string): Promise<boolean> {
    const { error } = await supabaseAdmin
      .from('ai_ab_experiments')
      .update({
        status: 'completed',
        end_date: new Date().toISOString(),
      })
      .eq('id', experimentId);

    if (error) {
      console.error('Erro ao parar experimento:', error);
      return false;
    }

    this.lastFetch = 0;
    return true;
  }
}

// Singleton
export const abTestingService = new ABTestingService();
