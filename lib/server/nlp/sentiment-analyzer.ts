import { InferenceClient } from '@huggingface/inference';

export interface SentimentResult {
  emotion: 'triste' | 'ansiosa' | 'raiva' | 'feliz' | 'confusa' | 'esperancosa' | 'desesperada';
  intensity: number; // 0-1
  keywords: string[];
  urgency: 'baixa' | 'media' | 'alta' | 'critica';
  confidence: number; // 0-1 - confianca do modelo
  model_used: 'bert-pt' | 'bert-multilingual' | 'fallback';
}

/**
 * Analisador de Sentimento v2.0 - BERT PT-BR
 *
 * Pipeline otimizado para português brasileiro:
 * 1. Modelo primário: pysentimiento/robertuito-sentiment-analysis (~400ms)
 * 2. Modelo secundário: cardiffnlp/twitter-xlm-roberta-base-sentiment-multilingual
 * 3. Análise de keywords para refinamento de emoções específicas
 * 4. Detecção de crise com patterns específicos brasileiros
 */
export class SentimentAnalyzer {
  private client: InferenceClient;
  private cache: Map<string, { result: SentimentResult; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutos

  // Modelos BERT otimizados
  private readonly PRIMARY_MODEL = 'pysentimiento/robertuito-sentiment-analysis';
  private readonly SECONDARY_MODEL = 'cardiffnlp/twitter-xlm-roberta-base-sentiment-multilingual';

  constructor() {
    const apiKey = process.env.HUGGINGFACE_API_KEY;
    if (!apiKey) {
      console.warn('⚠️ HUGGINGFACE_API_KEY nao encontrada. SentimentAnalyzer usara fallback.');
    }
    this.client = new InferenceClient(apiKey);
  }

  /**
   * Analisa o sentimento de um texto
   */
  async analyze(text: string): Promise<SentimentResult> {
    // Check cache
    const cacheKey = text.toLowerCase().trim().substring(0, 200);
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      console.log('📦 Cache hit for sentiment analysis');
      return cached.result;
    }

    const startTime = Date.now();

    try {
      let emotion: SentimentResult['emotion'] = 'confusa';
      let intensity = 0.5;
      let confidence = 0.5;
      let modelUsed: SentimentResult['model_used'] = 'fallback';

      if (process.env.HUGGINGFACE_API_KEY) {
        // Tentar modelo primário BERT PT-BR (mais rápido e preciso)
        try {
          const primaryResult = await this.analyzeSentimentBertPT(text);
          emotion = primaryResult.emotion;
          intensity = primaryResult.intensity;
          confidence = primaryResult.confidence;
          modelUsed = 'bert-pt';
          console.log(`🧠 BERT PT-BR: ${emotion} (${(confidence * 100).toFixed(1)}%) em ${Date.now() - startTime}ms`);
        } catch (primaryError) {
          console.warn('⚠️ Modelo primário falhou, tentando secundário:', primaryError);

          // Tentar modelo secundário multilingual
          try {
            const secondaryResult = await this.analyzeSentimentMultilingual(text);
            emotion = secondaryResult.emotion;
            intensity = secondaryResult.intensity;
            confidence = secondaryResult.confidence;
            modelUsed = 'bert-multilingual';
            console.log(`🌐 BERT Multilingual: ${emotion} em ${Date.now() - startTime}ms`);
          } catch (secondaryError) {
            console.warn('⚠️ Modelo secundário falhou, usando fallback:', secondaryError);
            const fallbackResult = this.analyzeSentimentFallback(text);
            emotion = fallbackResult.emotion;
            intensity = fallbackResult.intensity;
            confidence = fallbackResult.confidence;
            modelUsed = 'fallback';
          }
        }
      } else {
        const fallbackResult = this.analyzeSentimentFallback(text);
        emotion = fallbackResult.emotion;
        intensity = fallbackResult.intensity;
        confidence = fallbackResult.confidence;
      }

      // Refinar com análise de keywords para contexto brasileiro
      const refinedResult = this.refineWithBrazilianKeywords(text, emotion, intensity);
      emotion = refinedResult.emotion;
      intensity = refinedResult.intensity;

      // Extrair keywords
      const keywords = this.extractKeywords(text);

      // Detectar urgência (prioridade máxima para crises)
      const urgency = this.detectUrgency(text, emotion, intensity);

      // Override para casos críticos
      if (urgency === 'critica') {
        emotion = 'desesperada';
        intensity = Math.max(intensity, 0.9);
      }

      const result: SentimentResult = {
        emotion,
        intensity,
        keywords,
        urgency,
        confidence,
        model_used: modelUsed,
      };

      // Cache result
      this.cache.set(cacheKey, { result, timestamp: Date.now() });

      console.log(`✅ Análise completa em ${Date.now() - startTime}ms:`, {
        emotion,
        urgency,
        model: modelUsed,
      });

      return result;
    } catch (error) {
      console.error('Erro ao analisar sentimento:', error);
      return this.analyzeSentimentFallback(text);
    }
  }

  /**
   * Modelo Primário: pysentimiento BERT para português/espanhol
   * Retorna: POS, NEG, NEU com scores
   */
  private async analyzeSentimentBertPT(
    text: string
  ): Promise<{ emotion: SentimentResult['emotion']; intensity: number; confidence: number }> {
    const response = await this.client.textClassification({
      model: this.PRIMARY_MODEL,
      inputs: text.substring(0, 512), // Limite de tokens
    });

    const results = Array.isArray(response) ? response : [response];

    if (results.length === 0) {
      throw new Error('Empty response from BERT PT model');
    }

    // Encontrar a label com maior score
    let topLabel = '';
    let topScore = 0;
    const allScores: Record<string, number> = {};

    for (const item of results) {
      allScores[item.label] = item.score;
      if (item.score > topScore) {
        topScore = item.score;
        topLabel = item.label;
      }
    }

    // pysentimiento retorna: POS, NEG, NEU
    // Mapear para nossas emoções baseado no score
    const negScore = allScores['NEG'] || allScores['negative'] || allScores['NEGATIVE'] || 0;
    const posScore = allScores['POS'] || allScores['positive'] || allScores['POSITIVE'] || 0;
    const neuScore = allScores['NEU'] || allScores['neutral'] || allScores['NEUTRAL'] || 0;

    let emotion: SentimentResult['emotion'];
    let intensity: number;

    if (negScore > posScore && negScore > neuScore) {
      // Negativo - determinar qual emoção negativa
      if (negScore > 0.8) {
        emotion = 'desesperada';
        intensity = 0.85;
      } else if (negScore > 0.6) {
        emotion = 'triste';
        intensity = 0.7;
      } else {
        emotion = 'ansiosa';
        intensity = 0.6;
      }
    } else if (posScore > negScore && posScore > neuScore) {
      // Positivo
      if (posScore > 0.7) {
        emotion = 'feliz';
        intensity = 0.75;
      } else {
        emotion = 'esperancosa';
        intensity = 0.6;
      }
    } else {
      // Neutro/Confuso
      emotion = 'confusa';
      intensity = 0.4;
    }

    return {
      emotion,
      intensity: intensity * topScore,
      confidence: topScore,
    };
  }

  /**
   * Modelo Secundário: XLM-RoBERTa multilingual
   */
  private async analyzeSentimentMultilingual(
    text: string
  ): Promise<{ emotion: SentimentResult['emotion']; intensity: number; confidence: number }> {
    const response = await this.client.textClassification({
      model: this.SECONDARY_MODEL,
      inputs: text.substring(0, 512),
    });

    const results = Array.isArray(response) ? response : [response];

    if (results.length === 0) {
      throw new Error('Empty response from multilingual model');
    }

    // Encontrar scores
    const allScores: Record<string, number> = {};
    let topScore = 0;

    for (const item of results) {
      allScores[item.label.toLowerCase()] = item.score;
      if (item.score > topScore) {
        topScore = item.score;
      }
    }

    const negScore = allScores['negative'] || 0;
    const posScore = allScores['positive'] || 0;

    let emotion: SentimentResult['emotion'];
    let intensity: number;

    if (negScore > posScore) {
      emotion = negScore > 0.7 ? 'triste' : 'ansiosa';
      intensity = negScore * 0.8;
    } else if (posScore > negScore) {
      emotion = posScore > 0.7 ? 'feliz' : 'esperancosa';
      intensity = posScore * 0.7;
    } else {
      emotion = 'confusa';
      intensity = 0.4;
    }

    return {
      emotion,
      intensity,
      confidence: topScore,
    };
  }

  /**
   * Refina a emoção detectada com keywords específicas do contexto brasileiro
   * Esta é a parte mais importante para precisão em PT-BR
   */
  private refineWithBrazilianKeywords(
    text: string,
    initialEmotion: SentimentResult['emotion'],
    initialIntensity: number
  ): { emotion: SentimentResult['emotion']; intensity: number } {
    const lowerText = text.toLowerCase();

    // Keywords por emoção com pesos - otimizado para brasileiro
    const emotionPatterns: {
      emotion: SentimentResult['emotion'];
      patterns: RegExp[];
      weight: number;
      intensityBoost: number;
    }[] = [
      {
        emotion: 'desesperada',
        patterns: [
          /suic[ií]dio/i,
          /me matar/i,
          /quero morrer/i,
          /acabar com tudo/i,
          /n[aã]o aguento mais/i,
          /sem sa[ií]da/i,
          /vou fazer (besteira|merda)/i,
          /me cortar/i,
          /desespero/i,
          /n[aã]o quero mais viver/i,
          /vou embora de vez/i,
          /cansada de tudo/i,
          /ningu[eé]m me ama/i,
          /seria melhor sem mim/i,
        ],
        weight: 1.0,
        intensityBoost: 0.3,
      },
      {
        emotion: 'ansiosa',
        patterns: [
          /ansiosa?/i,
          /ansiedade/i,
          /nervosa?/i,
          /preocupada?/i,
          /surtando/i,
          /medo de/i,
          /p[aâ]nico/i,
          /cora[çc][aã]o (acelerado|disparado)/i,
          /n[aã]o consigo respirar/i,
          /tremendo/i,
          /ins[oô]nia/i,
          /n[aã]o durmo/i,
          /angustiada?/i,
          /sufocada?/i,
          /apavorada?/i,
          /taquicardia/i,
        ],
        weight: 0.85,
        intensityBoost: 0.2,
      },
      {
        emotion: 'triste',
        patterns: [
          /triste/i,
          /tristeza/i,
          /chorar/i,
          /chorando/i,
          /sozinha?/i,
          /solid[aã]o/i,
          /saudade/i,
          /deprimi/i,
          /depress/i,
          /vazio/i,
          /abandonada?/i,
          /rejeitada?/i,
          /n[aã]o tenho ningu[eé]m/i,
          /ningu[eé]m se importa/i,
          /me sinto (s[oó]|sozinha)/i,
          /dor no peito/i,
          /cora[çc][aã]o partido/i,
        ],
        weight: 0.8,
        intensityBoost: 0.15,
      },
      {
        emotion: 'raiva',
        patterns: [
          /raiva/i,
          /[oó]dio/i,
          /irritada?/i,
          /puta da vida/i,
          /revoltada?/i,
          /nojo/i,
          /indignada?/i,
          /furiosa?/i,
          /estourar/i,
          /explodir/i,
          /matar (ele|ela)/i,
          /odeio (ele|ela|isso|tudo)/i,
          /n[aã]o suporto/i,
          /fdp|filho da puta/i,
          /desgraça/i,
        ],
        weight: 0.8,
        intensityBoost: 0.2,
      },
      {
        emotion: 'confusa',
        patterns: [
          /confusa?/i,
          /perdida?/i,
          /n[aã]o sei o que fazer/i,
          /d[uú]vida/i,
          /ser[aá] que/i,
          /n[aã]o entendo/i,
          /indecisa?/i,
          /misturada?/i,
          /bagunçada?/i,
          /n[aã]o sei mais/i,
        ],
        weight: 0.6,
        intensityBoost: 0.1,
      },
      {
        emotion: 'esperancosa',
        patterns: [
          /esperan[çc]a/i,
          /vai melhorar/i,
          /conseguir/i,
          /vai dar certo/i,
          /otimista/i,
          /confio/i,
          /acredito/i,
          /for[çc]a/i,
          /vou superar/i,
          /tenho f[eé]/i,
        ],
        weight: 0.7,
        intensityBoost: 0.15,
      },
      {
        emotion: 'feliz',
        patterns: [
          /feliz/i,
          /alegre/i,
          /contente/i,
          /realizada?/i,
          /agrade[çc]/i,
          /amo (voce|isso|minha vida)/i,
          /maravilh/i,
          /incr[ií]vel/i,
          /t[oô] bem/i,
          /melhorei/i,
          /obrigada?/i,
        ],
        weight: 0.75,
        intensityBoost: 0.1,
      },
    ];

    let bestMatch: { emotion: SentimentResult['emotion']; score: number; boost: number } | null = null;

    for (const { emotion, patterns, weight, intensityBoost } of emotionPatterns) {
      let matchCount = 0;
      for (const pattern of patterns) {
        if (pattern.test(lowerText)) {
          matchCount++;
        }
      }

      if (matchCount > 0) {
        const score = matchCount * weight;
        if (!bestMatch || score > bestMatch.score) {
          bestMatch = { emotion, score, boost: intensityBoost };
        }
      }
    }

    // Se encontrou match forte de keywords, ajustar resultado
    if (bestMatch) {
      // Desesperada SEMPRE tem prioridade absoluta
      if (bestMatch.emotion === 'desesperada' && bestMatch.score >= 1.0) {
        return { emotion: 'desesperada', intensity: 0.95 };
      }

      // Se score alto, usar emoção das keywords
      if (bestMatch.score >= 0.8) {
        return {
          emotion: bestMatch.emotion,
          intensity: Math.min(1, initialIntensity + bestMatch.boost),
        };
      }

      // Se score médio e emoção é diferente, considerar combinação
      if (bestMatch.score >= 0.5 && bestMatch.emotion !== initialEmotion) {
        // Priorizar emoções negativas sobre neutras
        const negativeEmotions = ['desesperada', 'triste', 'ansiosa', 'raiva'];
        if (negativeEmotions.includes(bestMatch.emotion) && !negativeEmotions.includes(initialEmotion)) {
          return {
            emotion: bestMatch.emotion,
            intensity: Math.min(1, initialIntensity + bestMatch.boost * 0.5),
          };
        }
      }
    }

    return { emotion: initialEmotion, intensity: initialIntensity };
  }

  /**
   * Análise de sentimento com keywords (fallback robusto)
   */
  private analyzeSentimentFallback(text: string): SentimentResult {
    const lowerText = text.toLowerCase();

    // Sistema de pontuação por emoção
    const scores: Record<SentimentResult['emotion'], number> = {
      desesperada: 0,
      triste: 0,
      ansiosa: 0,
      raiva: 0,
      feliz: 0,
      esperancosa: 0,
      confusa: 0,
    };

    // Keywords com pesos
    const emotionKeywords: { emotion: SentimentResult['emotion']; keywords: string[]; weight: number }[] = [
      { emotion: 'desesperada', keywords: ['suicidio', 'me matar', 'acabar com tudo', 'nao aguento mais', 'desespero', 'quero morrer', 'sem saida'], weight: 3 },
      { emotion: 'triste', keywords: ['triste', 'chorar', 'chorando', 'sozinha', 'saudade', 'deprimida', 'vazio', 'abandonada', 'solidao'], weight: 2 },
      { emotion: 'ansiosa', keywords: ['ansiosa', 'ansiedade', 'nervosa', 'preocupada', 'surtando', 'medo', 'panico', 'tremendo', 'angustia'], weight: 2 },
      { emotion: 'raiva', keywords: ['raiva', 'odio', 'irritada', 'puta', 'revoltada', 'nojo', 'furiosa', 'odeio'], weight: 2 },
      { emotion: 'feliz', keywords: ['feliz', 'alegre', 'contente', 'otimista', 'melhor', 'boa', 'maravilhosa', 'incrivel'], weight: 1.5 },
      { emotion: 'esperancosa', keywords: ['esperanca', 'melhorar', 'conseguir', 'confio', 'acredito', 'vai dar certo', 'forca'], weight: 1.5 },
      { emotion: 'confusa', keywords: ['confusa', 'perdida', 'nao sei', 'duvida', 'sera', 'indecisa'], weight: 1 },
    ];

    // Calcular scores
    for (const { emotion, keywords, weight } of emotionKeywords) {
      for (const keyword of keywords) {
        if (lowerText.includes(keyword)) {
          scores[emotion] += weight;
        }
      }
    }

    // Encontrar emoção dominante
    let detectedEmotion: SentimentResult['emotion'] = 'confusa';
    let maxScore = 0;

    for (const [emotion, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score;
        detectedEmotion = emotion as SentimentResult['emotion'];
      }
    }

    // Calcular intensidade
    const exclamations = (text.match(/!/g) || []).length;
    const capsWords = (text.match(/[A-Z]{2,}/g) || []).length;
    const textLength = text.length;

    let intensity = 0.5;
    intensity += Math.min(0.2, maxScore * 0.05);
    intensity += Math.min(0.1, exclamations * 0.03);
    intensity += Math.min(0.1, capsWords * 0.05);
    intensity += Math.min(0.1, textLength > 200 ? 0.1 : 0);

    if (detectedEmotion === 'confusa') intensity = Math.max(0.3, intensity - 0.2);
    if (detectedEmotion === 'desesperada') intensity = Math.max(0.9, intensity);

    intensity = Math.min(1, intensity);

    return {
      emotion: detectedEmotion,
      intensity,
      keywords: this.extractKeywords(text),
      urgency: this.detectUrgency(text, detectedEmotion, intensity),
      confidence: 0.6,
      model_used: 'fallback',
    };
  }

  /**
   * Extrai keywords relevantes
   */
  private extractKeywords(text: string): string[] {
    const cleanText = text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s]/g, ' ')
      .trim();

    const stopwords = new Set([
      'para', 'com', 'que', 'uma', 'nao', 'ele', 'ela', 'isso', 'esse', 'esta',
      'voce', 'seu', 'sua', 'meu', 'minha', 'nos', 'eles', 'elas', 'por', 'mais',
      'como', 'mas', 'foi', 'ser', 'ter', 'tem', 'muito', 'quando', 'porque',
      'onde', 'qual', 'quem', 'entre', 'sobre', 'depois', 'antes', 'mesmo',
      'ainda', 'tambem', 'cada', 'outro', 'outra', 'todos', 'todas', 'pode',
      'esta', 'estou', 'estava', 'estive', 'foram', 'fomos', 'seria',
    ]);

    const emotionalWords = new Set([
      'triste', 'feliz', 'raiva', 'medo', 'amor', 'odio', 'sozinha', 'perdida',
      'confusa', 'ansiosa', 'nervosa', 'deprimida', 'desesperada', 'esperanca',
      'ajuda', 'socorro', 'preciso', 'quero', 'sinto', 'acho', 'penso',
    ]);

    const words = cleanText.split(/\s+/)
      .filter(w => w.length > 2 && !stopwords.has(w));

    const freq: Record<string, number> = {};
    words.forEach(w => {
      const boost = emotionalWords.has(w) ? 2 : 1;
      freq[w] = (freq[w] || 0) + boost;
    });

    return Object.entries(freq)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word);
  }

  /**
   * Detecta nível de urgência com padrões específicos para crise
   */
  private detectUrgency(
    text: string,
    emotion: SentimentResult['emotion'],
    intensity: number
  ): SentimentResult['urgency'] {
    const lowerText = text.toLowerCase();

    // Padrões de crise CRÍTICA
    const criticalPatterns = [
      /suic[ií]dio/i,
      /me matar/i,
      /quero morrer/i,
      /vou (me )?matar/i,
      /acabar com (minha vida|tudo)/i,
      /n[aã]o aguento mais viver/i,
      /desespero total/i,
      /sem sa[ií]da/i,
      /vou fazer (besteira|merda|bobagem)/i,
      /vou me cortar/i,
      /j[aá] tentei (me matar|suic[ií]dio)/i,
      /tenho um plano/i,
      /ningu[eé]m vai sentir falta/i,
      /seria melhor se eu n[aã]o existisse/i,
    ];

    for (const pattern of criticalPatterns) {
      if (pattern.test(lowerText)) {
        return 'critica';
      }
    }

    // Padrões de urgência ALTA
    const highUrgencyPatterns = [
      /me ajuda/i,
      /socorro/i,
      /n[aã]o sei o que fazer/i,
      /estou surtando/i,
      /p[aâ]nico/i,
      /n[aã]o consigo (respirar|parar de chorar)/i,
      /preciso de ajuda agora/i,
      /t[oô] muito mal/i,
      /crise de/i,
    ];

    for (const pattern of highUrgencyPatterns) {
      if (pattern.test(lowerText)) {
        return 'alta';
      }
    }

    if (emotion === 'desesperada') return 'critica';
    if (intensity > 0.8 && ['raiva', 'ansiosa', 'triste'].includes(emotion)) return 'alta';
    if (intensity > 0.6 || ['raiva', 'ansiosa'].includes(emotion)) return 'media';

    return 'baixa';
  }

  /**
   * Limpa o cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}
