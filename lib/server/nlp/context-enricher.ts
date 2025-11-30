import { supabaseAdmin } from '../supabase-admin';

export interface UserContext {
  recentEmotions: string[];
  dominantMood: string;
  stressLevel: 'baixo' | 'medio' | 'alto';
  journalInsights: string[];
  conversationHistory: {
    totalSessions: number;
    avgSentiment: number;
    crisisCount: number;
  };
}

export interface EnrichedPrompt {
  systemPrompt: string;
  contextPrefix: string;
  toneAdjustment: 'empatica' | 'amiga' | 'terapeutica' | 'urgente';
  temperature: number;
}

/**
 * Context Enricher - Enriquece prompts com contexto emocional do usuario
 * Puxa dados do journal, historico de conversas, e sentiment analysis anterior
 */
export class ContextEnricher {
  /**
   * Busca contexto emocional recente do usuario
   */
  async getUserContext(userId: string, clerkId: string): Promise<UserContext> {
    try {
      // 1. Buscar entradas de diario dos ultimos 7 dias
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: journalEntries } = await supabaseAdmin
        .from('journal_entries')
        .select('mood, content, created_at')
        .eq('user_id', userId)
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(10);

      // 2. Buscar historico de conversas dos ultimos 30 dias
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: conversationLogs } = await supabaseAdmin
        .from('ai_response_logs')
        .select('sentiment_emotion, sentiment_intensity, sentiment_urgency, was_crisis')
        .eq('user_id', clerkId)
        .eq('ai_type', 'chat')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false });

      // 3. Extrair emocoes recentes
      const recentEmotions: string[] = [];
      conversationLogs?.slice(0, 5).forEach((log) => {
        if (log.sentiment_emotion) {
          recentEmotions.push(log.sentiment_emotion);
        }
      });

      // 4. Calcular mood dominante do journal
      const moodCounts: Record<string, number> = {};
      journalEntries?.forEach((entry) => {
        if (entry.mood) {
          moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
        }
      });
      const dominantMood = Object.entries(moodCounts).sort(([, a], [, b]) => b - a)[0]?.[0] || 'neutro';

      // 5. Calcular stress level baseado em urgencias
      const crisisCount = conversationLogs?.filter((log) => log.was_crisis).length || 0;
      const highUrgencyCount = conversationLogs?.filter((log) => log.sentiment_urgency === 'alta').length || 0;
      const totalLogs = conversationLogs?.length || 0;

      let stressLevel: 'baixo' | 'medio' | 'alto' = 'baixo';
      if (crisisCount > 0 || (highUrgencyCount / totalLogs) > 0.3) {
        stressLevel = 'alto';
      } else if ((highUrgencyCount / totalLogs) > 0.1) {
        stressLevel = 'medio';
      }

      // 6. Extrair insights do journal (ultimas entradas)
      const journalInsights = journalEntries?.slice(0, 3).map((entry) => {
        const preview = entry.content.substring(0, 200);
        return `${entry.mood}: "${preview}${entry.content.length > 200 ? '...' : ''}"`;
      }) || [];

      // 7. Estatisticas de conversas
      const avgSentiment = conversationLogs && conversationLogs.length > 0
        ? conversationLogs.reduce((acc, log) => acc + (log.sentiment_intensity || 0), 0) / conversationLogs.length
        : 0.5;

      return {
        recentEmotions,
        dominantMood,
        stressLevel,
        journalInsights,
        conversationHistory: {
          totalSessions: conversationLogs?.length || 0,
          avgSentiment,
          crisisCount,
        },
      };
    } catch (error) {
      console.error('Erro ao buscar contexto do usuario:', error);
      // Retornar contexto vazio em caso de erro
      return {
        recentEmotions: [],
        dominantMood: 'neutro',
        stressLevel: 'baixo',
        journalInsights: [],
        conversationHistory: {
          totalSessions: 0,
          avgSentiment: 0.5,
          crisisCount: 0,
        },
      };
    }
  }

  /**
   * Enriquece o system prompt com contexto emocional
   */
  enrichSystemPrompt(
    baseSystemPrompt: string,
    context: UserContext,
    currentEmotion: string,
    currentUrgency: string
  ): EnrichedPrompt {
    // 1. Determinar tom da resposta baseado em contexto + situacao atual
    let toneAdjustment: EnrichedPrompt['toneAdjustment'] = 'amiga';
    let temperature = 0.7;

    if (currentUrgency === 'critica' || context.stressLevel === 'alto') {
      toneAdjustment = 'urgente';
      temperature = 0.4; // Mais focada e direta
    } else if (context.dominantMood === 'triste' || currentEmotion === 'triste') {
      toneAdjustment = 'empatica';
      temperature = 0.6;
    } else if (context.conversationHistory.totalSessions > 5) {
      toneAdjustment = 'amiga'; // Tom mais informal para usuarias recorrentes
      temperature = 0.7;
    } else {
      toneAdjustment = 'terapeutica'; // Tom mais profissional para novas usuarias
      temperature = 0.6;
    }

    // 2. Montar contexto emocional para prefixar na mensagem do usuario
    let contextPrefix = '';

    if (context.journalInsights.length > 0) {
      contextPrefix += `📔 CONTEXTO EMOCIONAL DO DIARIO (ultimos 7 dias):\n`;
      context.journalInsights.forEach((insight, i) => {
        contextPrefix += `${i + 1}. ${insight}\n`;
      });
      contextPrefix += '\n';
    }

    if (context.recentEmotions.length > 0) {
      contextPrefix += `💭 EMOCOES RECENTES NAS CONVERSAS: ${context.recentEmotions.join(', ')}\n`;
      contextPrefix += `😌 HUMOR DOMINANTE: ${context.dominantMood}\n`;
      contextPrefix += `📊 NIVEL DE ESTRESSE: ${context.stressLevel}\n\n`;
    }

    if (context.conversationHistory.crisisCount > 0) {
      contextPrefix += `⚠️ HISTORICO: Usuaria passou por ${context.conversationHistory.crisisCount} momento(s) de crise nos ultimos 30 dias.\n\n`;
    }

    // 3. Enriquecer system prompt com instrucoes de tom
    let enrichedSystemPrompt = baseSystemPrompt;

    // Adicionar instrucao de tom especifico
    const toneInstructions = {
      urgente: `\n\n🚨 TOM URGENTE: Esta usuaria esta em crise. Seja direta, empatica, e foque em estabilizacao emocional imediata. Nao faca rodeios. Valide a dor dela e ofereca suporte concreto.`,
      empatica: `\n\n💙 TOM EMPATICO: Esta usuaria esta passando por um momento dificil. Seja extremamente acolhedora, valide os sentimentos dela, e demonstre que voce realmente entende a dor que ela esta sentindo.`,
      amiga: `\n\n👯 TOM DE AMIGA: Voce ja conversou com essa usuaria antes. Seja natural, como uma amiga que ja conhece ela. Pode usar uma linguagem mais informal e proxima.`,
      terapeutica: `\n\n🧘 TOM TERAPEUTICO: Use uma abordagem mais estruturada e profissional, mas ainda assim acolhedora. Faca perguntas reflexivas e ajude ela a processar as emocoes.`,
    };

    enrichedSystemPrompt += toneInstructions[toneAdjustment];

    // Adicionar contexto de historico se relevante
    if (context.conversationHistory.totalSessions > 0) {
      enrichedSystemPrompt += `\n\n📚 HISTORICO: Esta usuaria ja teve ${context.conversationHistory.totalSessions} conversas com voce. Lembre-se de que voces ja se conhecem.`;
    }

    return {
      systemPrompt: enrichedSystemPrompt,
      contextPrefix,
      toneAdjustment,
      temperature,
    };
  }

  /**
   * Pipeline completo: buscar contexto + enriquecer prompt
   */
  async enrichPrompt(
    userId: string,
    clerkId: string,
    baseSystemPrompt: string,
    currentEmotion: string,
    currentUrgency: string
  ): Promise<EnrichedPrompt> {
    const context = await this.getUserContext(userId, clerkId);
    return this.enrichSystemPrompt(baseSystemPrompt, context, currentEmotion, currentUrgency);
  }
}
