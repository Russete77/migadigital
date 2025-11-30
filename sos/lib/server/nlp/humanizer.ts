/**
 * Humanizador de Respostas v2.0
 * Remove frases roboticas e adiciona marcadores emocionais naturais
 * Otimizado para mostrar melhoria mensuravel
 */
export class ResponseHumanizer {
  // Contadores para tracking de mudancas
  private lastHumanizationStats = {
    phrasesRemoved: 0,
    markersAdded: 0,
    contractionsApplied: 0,
    emojisAdded: 0,
  };

  /**
   * Calcula delay de digitacao realista baseado no tamanho da mensagem
   */
  calculateTypingDelay(message: string): number {
    const words = message.trim().split(/\s+/).length;
    const baseDelayPerWord = 150;
    const variation = 0.3;
    const randomFactor = 1 + (Math.random() * variation * 2 - variation);
    const totalDelay = words * baseDelayPerWord * randomFactor;
    return Math.max(800, Math.min(5000, totalDelay));
  }

  /**
   * Retorna estatisticas da ultima humanizacao
   */
  getLastStats() {
    return this.lastHumanizationStats;
  }

  /**
   * Humaniza uma resposta da IA
   */
  async humanize(
    rawResponse: string,
    emotion: string,
    intensity: number,
    tone: 'formal' | 'casual' | 'amiga'
  ): Promise<string> {
    // Reset stats
    this.lastHumanizationStats = {
      phrasesRemoved: 0,
      markersAdded: 0,
      contractionsApplied: 0,
      emojisAdded: 0,
    };

    let humanized = rawResponse;

    // 1. Remover frases roboticas (SEMPRE)
    humanized = this.removeRoboticPhrases(humanized);

    // 2. Aplicar contracoes informais (SEMPRE)
    humanized = this.applyInformalContractions(humanized);

    // 3. Adicionar marcadores conversacionais
    if (tone === 'amiga' || tone === 'casual') {
      humanized = this.addConversationalMarkers(humanized);
    }

    // 4. Adicionar emojis contextuais (se intensidade >= 0.4)
    if (intensity >= 0.4) {
      humanized = this.addEmojis(humanized, emotion);
    }

    // 5. Ajustar pontuacao e paragrafos
    humanized = this.adjustPunctuation(humanized);

    return humanized.trim();
  }

  /**
   * Remove frases tipicas de IA/chatbot
   */
  private removeRoboticPhrases(text: string): string {
    const roboticPhrases = [
      // Identificacao como IA
      { pattern: /Como (uma )?IA,?\s*/gi, replacement: '' },
      { pattern: /Como (um )?modelo de linguagem,?\s*/gi, replacement: '' },
      { pattern: /Sou (apenas )?um(a)? (assistente|bot|IA),?\s*/gi, replacement: '' },
      { pattern: /Nao tenho (emocoes|sentimentos),?\s*/gi, replacement: '' },

      // Frases de abertura roboticas
      { pattern: /^Como posso ajuda-?la?\??\s*/gi, replacement: '' },
      { pattern: /^Estou aqui para (te )?ajudar\.?\s*/gi, replacement: '' },
      { pattern: /^Posso auxiliar\.?\s*/gi, replacement: '' },
      { pattern: /^Entendo que voce (esta|esteja)\.?\s*/gi, replacement: '' },
      { pattern: /^Compreendo (sua situacao|que voce)\.?\s*/gi, replacement: '' },

      // Frases formais demais
      { pattern: /E importante (notar|mencionar|lembrar) que\s*/gi, replacement: 'Olha, ' },
      { pattern: /Com base nisso,?\s*/gi, replacement: 'Entao, ' },
      { pattern: /Baseado no que voce disse,?\s*/gi, replacement: '' },
      { pattern: /De acordo com\s*/gi, replacement: '' },
      { pattern: /Vou te ajudar a\s*/gi, replacement: 'Vamos ' },
      { pattern: /Permita-me\s*/gi, replacement: '' },
      { pattern: /Gostaria de (ressaltar|destacar|mencionar)\s*/gi, replacement: '' },

      // Frases de recomendacao formais
      { pattern: /E fundamental que\s*/gi, replacement: 'O importante e que ' },
      { pattern: /Deve-se\s*/gi, replacement: 'Tenta ' },
      { pattern: /E essencial\s*/gi, replacement: 'E muito importante ' },
      { pattern: /E necessario\s*/gi, replacement: 'Precisa ' },
      { pattern: /Recomendo que voce\s*/gi, replacement: 'Tenta ' },
      { pattern: /Sugiro que voce\s*/gi, replacement: 'Que tal ' },
      { pattern: /Aconselho que voce\s*/gi, replacement: 'Acho que vale ' },

      // Conectores muito formais
      { pattern: /\. Entretanto,?\s*/gi, replacement: '. Mas ' },
      { pattern: /\. No entanto,?\s*/gi, replacement: '. So que ' },
      { pattern: /\. Todavia,?\s*/gi, replacement: '. Mas ' },
      { pattern: /\. Contudo,?\s*/gi, replacement: '. Mas ' },
      { pattern: /\. Portanto,?\s*/gi, replacement: '. Entao ' },
      { pattern: /\. Ademais,?\s*/gi, replacement: '. E ' },
      { pattern: /\. Outrossim,?\s*/gi, replacement: '. Tambem ' },
      { pattern: /\. Destarte,?\s*/gi, replacement: '. Assim ' },
    ];

    let cleaned = text;
    let removedCount = 0;

    roboticPhrases.forEach(({ pattern, replacement }) => {
      const beforeLength = cleaned.length;
      cleaned = cleaned.replace(pattern, replacement);
      if (cleaned.length !== beforeLength) {
        removedCount++;
      }
    });

    this.lastHumanizationStats.phrasesRemoved = removedCount;

    // Limpar espacos e linhas vazias duplicadas
    cleaned = cleaned.replace(/\n\s*\n\s*\n/g, '\n\n');
    cleaned = cleaned.replace(/\s{2,}/g, ' ');

    return cleaned;
  }

  /**
   * Aplica contracoes e formas informais
   */
  private applyInformalContractions(text: string): string {
    const contractions = [
      { pattern: /\bpara\b/gi, replacement: 'pra' },
      { pattern: /\bpara o\b/gi, replacement: 'pro' },
      { pattern: /\bpara a\b/gi, replacement: 'pra' },
      { pattern: /\bvoce esta\b/gi, replacement: 'voce ta' },
      { pattern: /\besta bem\b/gi, replacement: 'ta bem' },
      { pattern: /\bestou\b/gi, replacement: 'to' },
      { pattern: /\bnao e\b/gi, replacement: 'num e' },
      { pattern: /\bnao tem\b/gi, replacement: 'num tem' },
      { pattern: /\bcom voce\b/gi, replacement: 'contigo' },
      { pattern: /\bquer dizer\b/gi, replacement: 'tipo' },
      { pattern: /\bmuito\b/gi, replacement: 'muito' }, // manter mas contar
    ];

    let result = text;
    let contractionsCount = 0;

    contractions.forEach(({ pattern, replacement }) => {
      const matches = result.match(pattern);
      if (matches) {
        contractionsCount += matches.length;
        result = result.replace(pattern, replacement);
      }
    });

    this.lastHumanizationStats.contractionsApplied = contractionsCount;
    return result;
  }

  /**
   * Adiciona marcadores conversacionais naturais
   */
  private addConversationalMarkers(text: string): string {
    let result = text;
    let markersAdded = 0;

    // 1. Marcador no inicio (se nao tiver)
    const startMarkers = ['Olha,', 'Entao,', 'Sabe,', 'Ei,', 'Oi,'];
    const hasStartMarker = startMarkers.some(m =>
      result.toLowerCase().trim().startsWith(m.toLowerCase())
    );

    if (!hasStartMarker && result.length > 30) {
      const marker = startMarkers[Math.floor(Math.random() * startMarkers.length)];
      result = `${marker} ${result.charAt(0).toLowerCase()}${result.slice(1)}`;
      markersAdded++;
    }

    // 2. Substituicoes no meio do texto
    const midReplacements = [
      { pattern: /\. Mas /gi, replacement: '. Mas olha, ' },
      { pattern: /\. E /g, replacement: '. E sabe, ' },
      { pattern: /\. Tambem /gi, replacement: '. E olha, tambem ' },
      { pattern: /\. Alem disso/gi, replacement: '. E mais' },
    ];

    midReplacements.forEach(({ pattern, replacement }) => {
      if (pattern.test(result)) {
        result = result.replace(pattern, replacement);
        markersAdded++;
      }
    });

    // 3. Adicionar "ne?" em algumas afirmacoes (nao todas)
    const sentences = result.split(/(?<=[.!])\s+/);
    if (sentences.length >= 2) {
      // Adicionar "ne" na segunda frase se for longa
      if (sentences[1] && sentences[1].length > 30 && !sentences[1].includes('?')) {
        sentences[1] = sentences[1].replace(/\.$/, ', ne.');
        markersAdded++;
      }
    }
    result = sentences.join(' ');

    // 4. Adicionar "viu?" ou "ta?" no final de perguntas (algumas)
    if (result.endsWith('?') && Math.random() > 0.5) {
      result = result.slice(0, -1) + ', viu?';
      markersAdded++;
    }

    this.lastHumanizationStats.markersAdded = markersAdded;
    return result;
  }

  /**
   * Adiciona emojis contextuais baseados na emocao
   */
  private addEmojis(text: string, emotion: string): string {
    const emojiMap: Record<string, string[]> = {
      triste: ['🫂', '💜', '🤍', '💙'],
      ansiosa: ['🌟', '✨', '💫', '🌈'],
      raiva: ['💪', '🔥', '⚡', '✊'],
      feliz: ['🎉', '💖', '🌈', '✨'],
      confusa: ['🤔', '💭', '🧭', '💡'],
      esperancosa: ['🌅', '🌱', '⭐', '🌻'],
      desesperada: ['🫂', '💜', '🤲', '💕'],
    };

    const emojis = emojiMap[emotion] || ['💜'];
    let emojisAdded = 0;

    // Verificar se ja tem emoji no final
    const hasEndEmoji = /[\u{1F300}-\u{1F9FF}]\s*$/u.test(text);

    if (!hasEndEmoji) {
      const emoji = emojis[Math.floor(Math.random() * emojis.length)];
      text = `${text} ${emoji}`;
      emojisAdded++;
    }

    this.lastHumanizationStats.emojisAdded = emojisAdded;
    return text;
  }

  /**
   * Ajusta pontuacao e paragrafos
   */
  private adjustPunctuation(text: string): string {
    // Remover pontos duplos
    let result = text.replace(/\.{2,}/g, '.');

    // Adicionar espaco apos pontuacao se faltar
    result = result.replace(/([.!?])([A-Z])/g, '$1 $2');

    // Quebrar paragrafos muito longos
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
   * Detecta se uma resposta parece robotica
   * Retorna score 0-1 (0 = humana, 1 = muito robotica)
   *
   * v2.1 - Algoritmo recalibrado para melhor diferenciacao
   * entre texto bruto GPT-4o e texto humanizado
   */
  detectRoboticness(text: string): number {
    // Score base mais alto - texto nao processado comeca em 0.75
    let score = 0.75;

    // === INDICADORES DE ROBOTICIDADE (+score) ===

    // Frases tipicas de IA/chatbot (peso alto)
    const highRoboticPatterns = [
      /Como (uma )?IA/gi,
      /Como (um )?modelo/gi,
      /Nao tenho (emocoes|sentimentos)/gi,
      /Como posso ajudar/gi,
      /Estou aqui para (te )?ajudar/gi,
      /Posso auxiliar/gi,
      /Permita-me/gi,
    ];

    highRoboticPatterns.forEach(pattern => {
      if (pattern.test(text)) {
        score += 0.10;
      }
    });

    // Frases formais tipicas de GPT (peso medio)
    const mediumRoboticPatterns = [
      /E importante (notar|mencionar|lembrar|ressaltar)/gi,
      /De acordo com/gi,
      /Com base (nisso|no que)/gi,
      /Baseado no que/gi,
      /Compreendo (que|sua|o que)/gi,
      /Entendo (que voce|sua|o que)/gi,
      /Vou te ajudar/gi,
      /Recomendo (que|fortemente)/gi,
      /Sugiro que/gi,
      /Gostaria de (ressaltar|destacar|mencionar)/gi,
      /E fundamental/gi,
      /E essencial/gi,
      /Primeiramente/gi,
      /Em primeiro lugar/gi,
      /Alem disso/gi,
      /Dessa forma/gi,
      /Sendo assim/gi,
      /Nesse sentido/gi,
    ];

    mediumRoboticPatterns.forEach(pattern => {
      if (pattern.test(text)) {
        score += 0.06;
      }
    });

    // Palavras muito formais
    const formalWords = [
      'entretanto', 'portanto', 'ademais', 'outrossim',
      'destarte', 'doravante', 'todavia', 'conquanto',
      'porquanto', 'mormente', 'precipuamente', 'contudo',
      'mediante', 'perante', 'consoante', 'conforme'
    ];
    formalWords.forEach(word => {
      if (text.toLowerCase().includes(word)) {
        score += 0.05;
      }
    });

    // Ponto e virgula (muito formal)
    const semicolons = (text.match(/;/g) || []).length;
    score += semicolons * 0.04;

    // Frases muito longas (>100 chars sem pontuacao)
    const longSentences = text.split(/[.!?]/).filter(s => s.trim().length > 100).length;
    score += longSentences * 0.04;

    // Ausencia de contracoes - "para" formal
    const paraFormal = (text.match(/\bpara\s+(o|a|os|as|ele|ela|voce|mim|nos)\b/gi) || []).length;
    score += paraFormal * 0.03;

    // Verbos no infinitivo formal
    const formalInfinitives = (text.match(/\b(realizar|efetuar|proceder|estabelecer|proporcionar)\b/gi) || []).length;
    score += formalInfinitives * 0.03;

    // Lista numerada (tipico de IA)
    const hasNumberedList = /^\s*\d+[\.\)]/m.test(text);
    if (hasNumberedList) score += 0.08;

    // === INDICADORES DE HUMANIDADE (-score) ===

    // Marcadores conversacionais no INICIO (peso alto)
    const startsWithMarker = /^(Olha|Sabe|Ei|Oi|Entao|Escuta|Vem ca)/i.test(text.trim());
    if (startsWithMarker) score -= 0.15;

    // Marcadores conversacionais em geral
    const conversationalMarkers = [
      { pattern: /\bolha\b/gi, weight: 0.08 },
      { pattern: /\bsabe\b/gi, weight: 0.08 },
      { pattern: /\bviu\b/gi, weight: 0.06 },
      { pattern: /\bne\b/gi, weight: 0.06 },
      { pattern: /\btipo\b/gi, weight: 0.05 },
      { pattern: /\bei\b/gi, weight: 0.05 },
      { pattern: /\bescuta\b/gi, weight: 0.05 },
      { pattern: /\bvem ca\b/gi, weight: 0.05 },
    ];
    conversationalMarkers.forEach(({ pattern, weight }) => {
      const matches = text.match(pattern);
      if (matches) {
        score -= weight * Math.min(matches.length, 2);
      }
    });

    // Emojis (peso alto - muito humano)
    const emojiCount = (text.match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length;
    score -= emojiCount * 0.10;

    // Contracoes informais brasileiras (peso alto)
    const informalContractions = [
      { pattern: /\bta\b/gi, weight: 0.06 },
      { pattern: /\bpra\b/gi, weight: 0.06 },
      { pattern: /\bpro\b/gi, weight: 0.05 },
      { pattern: /\bto\b/gi, weight: 0.05 },
      { pattern: /\bce\b/gi, weight: 0.04 },
      { pattern: /\bnum\b/gi, weight: 0.04 },
      { pattern: /\bcontigo\b/gi, weight: 0.04 },
    ];
    informalContractions.forEach(({ pattern, weight }) => {
      if (pattern.test(text)) {
        score -= weight;
      }
    });

    // Frases curtas (< 50 chars) - mais natural em conversa
    const sentences = text.split(/[.!?]/).filter(s => s.trim().length > 0);
    const shortSentences = sentences.filter(s => s.trim().length < 50).length;
    const shortRatio = sentences.length > 0 ? shortSentences / sentences.length : 0;
    score -= shortRatio * 0.10;

    // Exclamacoes (emocional)
    const exclamations = (text.match(/!/g) || []).length;
    score -= Math.min(exclamations, 3) * 0.04;

    // Pergunta no final (engajamento)
    if (text.trim().endsWith('?') || text.trim().endsWith(', viu?') || text.trim().endsWith(', ne?')) {
      score -= 0.05;
    }

    // Garantir range 0.1 - 1.0
    return Math.max(0.1, Math.min(1, score));
  }
}
