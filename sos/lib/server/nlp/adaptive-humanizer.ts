import { supabaseAdmin } from '@/lib/server/supabase-admin';

interface HumanizerWeight {
  rule_name: string;
  rule_type: string;
  base_weight: number;
  learned_weight: number;
  confidence: number;
  best_emotions: string[];
  worst_emotions: string[];
}

interface HumanizationStats {
  phrasesRemoved: number;
  markersAdded: number;
  contractionsApplied: number;
  emojisAdded: number;
  rulesApplied: string[];
}

/**
 * Humanizador Adaptativo v2.0
 *
 * Aprende com feedback dos usuários para melhorar a humanização:
 * - Ajusta pesos das regras baseado em correlação com ratings
 * - Adapta por emoção (algumas regras funcionam melhor em certos contextos)
 * - Usa sistema de confiança para balancear exploração vs. exploitação
 */
export class AdaptiveHumanizer {
  private weights: Map<string, HumanizerWeight> = new Map();
  private lastWeightsFetch: number = 0;
  private readonly CACHE_TTL = 15 * 60 * 1000; // 15 minutos
  private lastStats: HumanizationStats = {
    phrasesRemoved: 0,
    markersAdded: 0,
    contractionsApplied: 0,
    emojisAdded: 0,
    rulesApplied: [],
  };

  /**
   * Humaniza resposta usando pesos adaptativos
   */
  async humanize(
    rawResponse: string,
    emotion: string,
    intensity: number,
    tone: 'formal' | 'casual' | 'amiga'
  ): Promise<string> {
    await this.loadWeights();

    // Reset stats
    this.lastStats = {
      phrasesRemoved: 0,
      markersAdded: 0,
      contractionsApplied: 0,
      emojisAdded: 0,
      rulesApplied: [],
    };

    let humanized = rawResponse;

    // 1. Remover frases robóticas (sempre, com pesos adaptativos)
    humanized = this.removeRoboticPhrases(humanized, emotion);

    // 2. Aplicar contrações informais
    humanized = this.applyContractions(humanized, emotion);

    // 3. Adicionar marcadores conversacionais (baseado em tone e pesos)
    if (tone === 'amiga' || tone === 'casual') {
      humanized = this.addConversationalMarkers(humanized, emotion);
    }

    // 4. Adicionar emojis contextuais (se intensidade adequada e peso favorável)
    if (intensity >= 0.4) {
      humanized = this.addEmojis(humanized, emotion, intensity);
    }

    // 5. Ajustar pontuação e formatação
    humanized = this.adjustFormatting(humanized);

    return humanized.trim();
  }

  /**
   * Carrega pesos do banco de dados
   */
  private async loadWeights(): Promise<void> {
    if (Date.now() - this.lastWeightsFetch < this.CACHE_TTL && this.weights.size > 0) {
      return;
    }

    try {
      const { data, error } = await supabaseAdmin
        .from('ai_humanizer_weights')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;

      this.weights.clear();
      for (const weight of data || []) {
        this.weights.set(weight.rule_name, weight);
      }

      this.lastWeightsFetch = Date.now();
    } catch (error) {
      console.error('Erro ao carregar pesos do humanizador:', error);
      // Usar pesos padrão
      this.useDefaultWeights();
    }
  }

  /**
   * Pesos padrão quando banco não disponível
   */
  private useDefaultWeights(): void {
    const defaults: HumanizerWeight[] = [
      { rule_name: 'marker_olha', rule_type: 'marker', base_weight: 1.0, learned_weight: 1.0, confidence: 0.5, best_emotions: ['triste', 'ansiosa'], worst_emotions: ['feliz'] },
      { rule_name: 'marker_sabe', rule_type: 'marker', base_weight: 1.0, learned_weight: 1.0, confidence: 0.5, best_emotions: ['triste', 'confusa'], worst_emotions: ['raiva'] },
      { rule_name: 'contraction_pra', rule_type: 'contraction', base_weight: 1.0, learned_weight: 1.0, confidence: 0.5, best_emotions: [], worst_emotions: [] },
      { rule_name: 'emoji_abraco', rule_type: 'emoji', base_weight: 0.9, learned_weight: 0.9, confidence: 0.5, best_emotions: ['triste', 'desesperada'], worst_emotions: ['raiva'] },
    ];

    for (const w of defaults) {
      this.weights.set(w.rule_name, w);
    }
  }

  /**
   * Obtém peso efetivo de uma regra para uma emoção
   */
  private getEffectiveWeight(ruleName: string, emotion: string): number {
    const weight = this.weights.get(ruleName);

    if (!weight) return 1.0;

    // Começar com peso aprendido (ou base se não há dados suficientes)
    let effectiveWeight = weight.confidence > 0.7
      ? weight.learned_weight
      : weight.base_weight;

    // Ajustar por emoção
    if (weight.best_emotions?.includes(emotion)) {
      effectiveWeight *= 1.2;
    }
    if (weight.worst_emotions?.includes(emotion)) {
      effectiveWeight *= 0.6;
    }

    return effectiveWeight;
  }

  /**
   * Remove frases robóticas com pesos adaptativos
   */
  private removeRoboticPhrases(text: string, emotion: string): string {
    const removalWeight = this.getEffectiveWeight('removal_formal', emotion);

    // Se peso baixo, ser mais conservador na remoção
    if (removalWeight < 0.5) {
      return text;
    }

    const roboticPhrases = [
      { pattern: /Como (uma )?IA,?\s*/gi, replacement: '' },
      { pattern: /Como (um )?modelo de linguagem,?\s*/gi, replacement: '' },
      { pattern: /Sou (apenas )?um(a)? (assistente|bot|IA),?\s*/gi, replacement: '' },
      { pattern: /^Estou aqui para (te )?ajudar\.?\s*/gi, replacement: '' },
      { pattern: /^Como posso ajuda-?la?\??\s*/gi, replacement: '' },
      { pattern: /É importante (notar|mencionar|lembrar) que\s*/gi, replacement: 'Olha, ' },
      { pattern: /Com base nisso,?\s*/gi, replacement: 'Então, ' },
      { pattern: /Gostaria de (ressaltar|destacar|mencionar)\s*/gi, replacement: '' },
      { pattern: /É fundamental que\s*/gi, replacement: 'O importante é que ' },
      { pattern: /Recomendo que você\s*/gi, replacement: 'Tenta ' },
      { pattern: /Sugiro que você\s*/gi, replacement: 'Que tal ' },
      { pattern: /\. Entretanto,?\s*/gi, replacement: '. Mas ' },
      { pattern: /\. No entanto,?\s*/gi, replacement: '. Só que ' },
      { pattern: /\. Portanto,?\s*/gi, replacement: '. Então ' },
    ];

    let cleaned = text;
    let removedCount = 0;

    roboticPhrases.forEach(({ pattern, replacement }) => {
      const before = cleaned;
      cleaned = cleaned.replace(pattern, replacement);
      if (cleaned !== before) {
        removedCount++;
        this.lastStats.rulesApplied.push('removal_formal');
      }
    });

    this.lastStats.phrasesRemoved = removedCount;
    return cleaned;
  }

  /**
   * Aplica contrações informais
   */
  private applyContractions(text: string, emotion: string): string {
    const weight = this.getEffectiveWeight('contraction_pra', emotion);

    // Se peso muito baixo, não aplicar
    if (weight < 0.4) return text;

    const contractions = [
      { pattern: /\bpara\b/gi, replacement: 'pra' },
      { pattern: /\bpara o\b/gi, replacement: 'pro' },
      { pattern: /\bpara a\b/gi, replacement: 'pra' },
      { pattern: /\bvocê está\b/gi, replacement: 'você tá' },
      { pattern: /\bestá bem\b/gi, replacement: 'tá bem' },
      { pattern: /\bestou\b/gi, replacement: 'tô' },
      { pattern: /\bcom você\b/gi, replacement: 'contigo' },
    ];

    let result = text;
    let count = 0;

    contractions.forEach(({ pattern, replacement }) => {
      const matches = result.match(pattern);
      if (matches && Math.random() < weight) { // Probabilístico baseado no peso
        result = result.replace(pattern, replacement);
        count += matches.length;
      }
    });

    this.lastStats.contractionsApplied = count;
    if (count > 0) this.lastStats.rulesApplied.push('contraction_pra');

    return result;
  }

  /**
   * Adiciona marcadores conversacionais
   */
  private addConversationalMarkers(text: string, emotion: string): string {
    let result = text;
    let markersAdded = 0;

    // Marcador no início
    const startMarkers = [
      { marker: 'Olha, ', rule: 'marker_olha' },
      { marker: 'Então, ', rule: 'marker_entao' },
      { marker: 'Sabe, ', rule: 'marker_sabe' },
      { marker: 'Ei, ', rule: 'marker_ei' },
    ];

    const hasStartMarker = startMarkers.some(m =>
      result.toLowerCase().trim().startsWith(m.marker.toLowerCase().trim())
    );

    if (!hasStartMarker && result.length > 30) {
      // Selecionar marcador baseado em pesos
      const weightedMarkers = startMarkers.map(m => ({
        ...m,
        weight: this.getEffectiveWeight(m.rule, emotion),
      }));

      // Ordenar por peso e selecionar top com aleatoriedade
      weightedMarkers.sort((a, b) => b.weight - a.weight);

      // Usar apenas se peso > threshold
      const selected = weightedMarkers.find(m => m.weight > 0.6 && Math.random() < m.weight);

      if (selected) {
        result = `${selected.marker}${result.charAt(0).toLowerCase()}${result.slice(1)}`;
        markersAdded++;
        this.lastStats.rulesApplied.push(selected.rule);
      }
    }

    // Adicionar "né?" em algumas frases
    if (Math.random() < 0.3 && !result.includes('né') && !result.endsWith('?')) {
      const sentences = result.split(/(?<=[.!])\s+/);
      if (sentences.length >= 2 && sentences[1].length > 20) {
        sentences[1] = sentences[1].replace(/\.$/, ', né.');
        result = sentences.join(' ');
        markersAdded++;
      }
    }

    this.lastStats.markersAdded = markersAdded;
    return result;
  }

  /**
   * Adiciona emojis contextuais
   */
  private addEmojis(text: string, emotion: string, intensity: number): string {
    const emojiWeight = this.getEffectiveWeight('emoji_abraco', emotion);

    // Não adicionar emojis se peso muito baixo ou já tem emoji
    const hasEmoji = /[\u{1F300}-\u{1F9FF}]/u.test(text);
    if (hasEmoji || emojiWeight < 0.5) {
      return text;
    }

    // Probabilidade baseada em peso e intensidade
    const probability = emojiWeight * intensity;
    if (Math.random() > probability) {
      return text;
    }

    const emojiMap: Record<string, string[]> = {
      triste: ['🫂', '💜', '🤍', '💙'],
      ansiosa: ['🌟', '✨', '💫', '🌈'],
      raiva: ['💪', '🔥', '⚡'],
      feliz: ['🎉', '💖', '🌈', '✨'],
      confusa: ['🤔', '💭', '💡'],
      esperancosa: ['🌅', '🌱', '⭐', '🌻'],
      desesperada: ['🫂', '💜', '🤲', '💕'],
    };

    const emojis = emojiMap[emotion] || ['💜'];
    const emoji = emojis[Math.floor(Math.random() * emojis.length)];

    this.lastStats.emojisAdded = 1;
    this.lastStats.rulesApplied.push('emoji_' + emotion);

    return `${text} ${emoji}`;
  }

  /**
   * Ajusta formatação final
   */
  private adjustFormatting(text: string): string {
    // Remover pontos duplos
    let result = text.replace(/\.{2,}/g, '.');

    // Adicionar espaço após pontuação
    result = result.replace(/([.!?])([A-Z])/g, '$1 $2');

    // Remover espaços duplicados
    result = result.replace(/\s{2,}/g, ' ');

    // Quebrar parágrafos muito longos
    const sentences = result.split(/(?<=[.!?])\s+/);
    const paragraphs: string[] = [];
    let currentPara = '';

    sentences.forEach((sentence, i) => {
      currentPara += sentence + ' ';
      if ((i + 1) % 3 === 0 || i === sentences.length - 1) {
        paragraphs.push(currentPara.trim());
        currentPara = '';
      }
    });

    return paragraphs.join('\n\n');
  }

  /**
   * Retorna estatísticas da última humanização
   */
  getLastStats(): HumanizationStats {
    return this.lastStats;
  }

  /**
   * Detecta roboticness (score 0-1)
   */
  detectRoboticness(text: string): number {
    let score = 0.75;

    // Padrões robóticos
    const roboticPatterns = [
      /Como (uma )?IA/gi,
      /É importante (notar|mencionar)/gi,
      /Recomendo que/gi,
      /Sugiro que/gi,
      /Primeiramente/gi,
      /Além disso/gi,
    ];

    roboticPatterns.forEach(pattern => {
      if (pattern.test(text)) score += 0.06;
    });

    // Palavras formais
    const formalWords = ['entretanto', 'portanto', 'ademais', 'todavia', 'contudo'];
    formalWords.forEach(word => {
      if (text.toLowerCase().includes(word)) score += 0.05;
    });

    // Indicadores de humanidade
    if (/^(Olha|Sabe|Ei|Oi|Então)/i.test(text.trim())) score -= 0.15;

    const conversationalMarkers = ['olha', 'sabe', 'viu', 'né', 'tipo', 'ei'];
    conversationalMarkers.forEach(marker => {
      if (text.toLowerCase().includes(marker)) score -= 0.06;
    });

    const emojiCount = (text.match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length;
    score -= emojiCount * 0.10;

    const contractions = ['tá', 'pra', 'pro', 'tô', 'né', 'num'];
    contractions.forEach(c => {
      if (text.toLowerCase().includes(c)) score -= 0.05;
    });

    return Math.max(0.1, Math.min(1, score));
  }

  /**
   * Atualiza pesos baseado em feedback
   */
  async updateWeightsFromFeedback(
    rulesApplied: string[],
    rating: number,
    emotion: string
  ): Promise<void> {
    if (rulesApplied.length === 0) return;

    const isPositive = rating >= 4;
    const isNegative = rating <= 2;

    for (const ruleName of rulesApplied) {
      await supabaseAdmin.rpc('update_humanizer_weight', {
        p_rule_name: ruleName,
        p_is_positive: isPositive,
        p_is_negative: isNegative,
        p_emotion: emotion,
      });
    }

    // Invalidar cache
    this.lastWeightsFetch = 0;
  }

  /**
   * Calcula delay de digitação realista
   */
  calculateTypingDelay(message: string): number {
    const words = message.trim().split(/\s+/).length;
    const baseDelayPerWord = 150;
    const variation = 0.3;
    const randomFactor = 1 + (Math.random() * variation * 2 - variation);
    const totalDelay = words * baseDelayPerWord * randomFactor;
    return Math.max(800, Math.min(5000, totalDelay));
  }
}

// Singleton
export const adaptiveHumanizer = new AdaptiveHumanizer();
