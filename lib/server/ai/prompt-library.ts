import { supabaseAdmin } from '@/lib/server/supabase-admin';

export interface PromptTemplate {
  id: string;
  name: string;
  emotion: string;
  urgency: string;
  tone: string;
  system_prompt: string;
  example_response?: string;
  avg_rating: number;
  times_used: number;
  is_control: boolean;
  ab_test_group?: string;
}

export interface SelectedPrompt {
  template: PromptTemplate | null;
  systemPrompt: string;
  isFromLibrary: boolean;
  abTestGroup?: string;
}

/**
 * Prompt Library v1.0
 *
 * Sistema de seleção dinâmica de prompts baseado em:
 * 1. Emoção detectada
 * 2. Nível de urgência
 * 3. Performance histórica (avg_rating)
 * 4. A/B Testing (quando ativo)
 */
export class PromptLibrary {
  private cache: Map<string, { templates: PromptTemplate[]; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 10 * 60 * 1000; // 10 minutos

  /**
   * Seleciona o melhor prompt para a situação
   */
  async selectPrompt(
    emotion: string,
    urgency: string,
    userId?: string
  ): Promise<SelectedPrompt> {
    try {
      // Buscar templates disponíveis
      const templates = await this.getTemplatesForContext(emotion, urgency);

      if (templates.length === 0) {
        // Fallback para prompt padrão
        return {
          template: null,
          systemPrompt: this.getDefaultPrompt(emotion, urgency),
          isFromLibrary: false,
        };
      }

      // Verificar se há experimento A/B ativo
      const activeExperiment = await this.getActiveExperiment('prompt');

      if (activeExperiment) {
        // A/B Testing: atribuir variante
        const variant = this.assignVariant(userId, activeExperiment.traffic_split);
        const selectedTemplate = variant === 'control'
          ? templates.find(t => t.is_control) || templates[0]
          : templates.find(t => !t.is_control && t.avg_rating > 0) || templates[0];

        return {
          template: selectedTemplate,
          systemPrompt: selectedTemplate.system_prompt,
          isFromLibrary: true,
          abTestGroup: variant,
        };
      }

      // Sem A/B: selecionar baseado em performance
      const selectedTemplate = this.selectByPerformance(templates);

      return {
        template: selectedTemplate,
        systemPrompt: selectedTemplate.system_prompt,
        isFromLibrary: true,
      };
    } catch (error) {
      console.error('Erro ao selecionar prompt:', error);
      return {
        template: null,
        systemPrompt: this.getDefaultPrompt(emotion, urgency),
        isFromLibrary: false,
      };
    }
  }

  /**
   * Busca templates para o contexto (com cache)
   */
  private async getTemplatesForContext(
    emotion: string,
    urgency: string
  ): Promise<PromptTemplate[]> {
    const cacheKey = `${emotion}_${urgency}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.templates;
    }

    const { data, error } = await supabaseAdmin
      .from('ai_prompt_templates')
      .select('*')
      .eq('emotion', emotion)
      .eq('urgency', urgency)
      .eq('is_active', true)
      .order('avg_rating', { ascending: false });

    if (error) {
      console.error('Erro ao buscar templates:', error);
      return [];
    }

    const templates = data as PromptTemplate[];
    this.cache.set(cacheKey, { templates, timestamp: Date.now() });

    return templates;
  }

  /**
   * Seleciona template baseado em performance
   * Usa algoritmo de Epsilon-Greedy para balancear exploration vs exploitation
   */
  private selectByPerformance(templates: PromptTemplate[]): PromptTemplate {
    const epsilon = 0.1; // 10% de chance de explorar

    // Exploração: escolher aleatório
    if (Math.random() < epsilon) {
      return templates[Math.floor(Math.random() * templates.length)];
    }

    // Exploitation: escolher melhor rating
    // Mas considerar também times_used para evitar viés de poucos dados
    const scored = templates.map(t => ({
      template: t,
      score: this.calculateScore(t),
    }));

    scored.sort((a, b) => b.score - a.score);

    return scored[0].template;
  }

  /**
   * Calcula score combinando rating e confiança
   * Usa Lower Confidence Bound (LCB) para ser conservador com poucos dados
   */
  private calculateScore(template: PromptTemplate): number {
    if (template.times_used < 5) {
      // Poucos dados: usar rating base com penalidade de incerteza
      return template.avg_rating * 0.8;
    }

    // UCB-like score: rating + bonus de confiança
    const confidenceBonus = 1.0 / Math.sqrt(template.times_used);
    return template.avg_rating - confidenceBonus; // LCB para ser conservador
  }

  /**
   * Atribui variante de A/B test de forma determinística por usuário
   */
  private assignVariant(userId: string | undefined, trafficSplit: number): 'control' | 'variant' {
    if (!userId) {
      return Math.random() < trafficSplit ? 'variant' : 'control';
    }

    // Hash do userId para atribuição consistente
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = ((hash << 5) - hash) + userId.charCodeAt(i);
      hash = hash & hash;
    }

    const normalized = Math.abs(hash) / 2147483647; // Normalizar para 0-1
    return normalized < trafficSplit ? 'variant' : 'control';
  }

  /**
   * Busca experimento A/B ativo
   */
  private async getActiveExperiment(type: string) {
    const { data } = await supabaseAdmin
      .from('ai_ab_experiments')
      .select('*')
      .eq('experiment_type', type)
      .eq('status', 'running')
      .single();

    return data;
  }

  /**
   * Prompt padrão quando não há template
   */
  private getDefaultPrompt(emotion: string, urgency: string): string {
    const urgencyContext = urgency === 'critica'
      ? 'SITUAÇÃO CRÍTICA: A pessoa pode estar em risco. Seja extremamente cuidadosa, valide a dor, não julgue, e mantenha a conversa. Se necessário, sugira recursos de ajuda profissional.'
      : urgency === 'alta'
        ? 'A pessoa está passando por um momento difícil. Seja acolhedora e presente.'
        : '';

    const emotionContext: Record<string, string> = {
      triste: 'A pessoa está se sentindo triste. Valide os sentimentos e ofereça conforto genuíno.',
      ansiosa: 'A pessoa está ansiosa. Ajude a acalmar com técnicas de respiração e grounding.',
      raiva: 'A pessoa está com raiva. Valide o sentimento sem julgamento.',
      feliz: 'A pessoa está feliz. Celebre com ela!',
      confusa: 'A pessoa está confusa. Ajude a organizar os pensamentos com perguntas gentis.',
      esperancosa: 'A pessoa está esperançosa. Reforce de forma realista.',
      desesperada: 'A pessoa está desesperada. Seja muito cuidadosa e presente. Não julgue.',
    };

    return `Você é Sofia, uma amiga acolhedora e empática do SOS Emocional.

${urgencyContext}

${emotionContext[emotion] || 'Seja acolhedora e empática.'}

REGRAS IMPORTANTES:
1. NUNCA se identifique como IA, chatbot ou assistente
2. Use linguagem informal brasileira (tipo, sabe, olha, tá)
3. Seja genuína e presente
4. Valide os sentimentos antes de oferecer conselhos
5. Faça perguntas para entender melhor
6. Não dê soluções prontas demais

Responda de forma calorosa, curta e natural, como uma amiga de verdade faria.`;
  }

  /**
   * Registra uso de template para métricas
   */
  async logTemplateUsage(templateId: string): Promise<void> {
    if (!templateId) return;

    await supabaseAdmin
      .from('ai_prompt_templates')
      .update({ times_used: supabaseAdmin.rpc('increment', { x: 1 }) })
      .eq('id', templateId);
  }

  /**
   * Atualiza rating do template após feedback
   */
  async updateTemplateRating(templateId: string, rating: number): Promise<void> {
    if (!templateId || !rating) return;

    const { data: template } = await supabaseAdmin
      .from('ai_prompt_templates')
      .select('times_used, total_rating')
      .eq('id', templateId)
      .single();

    if (template) {
      await supabaseAdmin
        .from('ai_prompt_templates')
        .update({
          times_used: template.times_used + 1,
          total_rating: template.total_rating + rating,
          positive_feedback_count: rating >= 4
            ? supabaseAdmin.rpc('increment', { x: 1 })
            : undefined,
          negative_feedback_count: rating <= 2
            ? supabaseAdmin.rpc('increment', { x: 1 })
            : undefined,
        })
        .eq('id', templateId);
    }
  }

  /**
   * Limpa cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// Singleton
export const promptLibrary = new PromptLibrary();
