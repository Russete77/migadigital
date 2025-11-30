/**
 * Filtro de Conteudo para Chat da Comunidade
 * Bloqueia informacoes pessoais: telefones, emails, redes sociais
 */

export interface FilterResult {
  isBlocked: boolean;
  detectedPatterns: string[];
  sanitizedContent: string;
  originalContent: string;
  confidence: number; // 0-1
}

export class ContentFilter {
  private patterns: Record<string, RegExp> = {
    // Telefones brasileiros (varios formatos)
    telefone: /(?:\+?55)?[\s\-.]?\(?(?:0?[1-9]{2})\)?[\s\-.]?(?:9[\s\-.]?)?[0-9]{4}[\s\-.]?[0-9]{4}/g,

    // Telefone com espacos entre numeros (ex: 9 9 1 2 3 4 5 6 7)
    telefone_espacado: /\b9\s*[0-9]\s*[0-9]\s*[0-9]\s*[0-9]\s*[0-9]\s*[0-9]\s*[0-9]\s*[0-9]\b/g,

    // Emails
    email: /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/gi,

    // Instagram
    instagram: /@[a-zA-Z0-9_.]{3,30}|instagram\.com\/[a-zA-Z0-9_.]+|insta\s*:?\s*@?[a-zA-Z0-9_.]+/gi,

    // TikTok
    tiktok: /tiktok\.com\/@?[a-zA-Z0-9_.]+|tiktok\s*:?\s*@?[a-zA-Z0-9_.]+/gi,

    // Twitter/X
    twitter: /twitter\.com\/[a-zA-Z0-9_]+|x\.com\/[a-zA-Z0-9_]+/gi,

    // Facebook
    facebook: /facebook\.com\/[a-zA-Z0-9.]+|fb\.com\/[a-zA-Z0-9.]+|fb\s*:?\s*[a-zA-Z0-9.]+/gi,

    // WhatsApp
    whatsapp: /wa\.me\/[0-9]+|whats?\s*:?\s*[0-9\s\-().]+|zap\s*:?\s*[0-9\s\-().]+/gi,

    // Telegram
    telegram: /t\.me\/[a-zA-Z0-9_]+|telegram\s*:?\s*@?[a-zA-Z0-9_]+/gi,

    // LinkedIn
    linkedin: /linkedin\.com\/in\/[a-zA-Z0-9\-]+/gi,

    // URLs genericas (qualquer link)
    url: /https?:\/\/[^\s]+/gi,

    // CPF
    cpf: /[0-9]{3}\.?[0-9]{3}\.?[0-9]{3}[\-.]?[0-9]{2}/g,

    // RG
    rg: /[0-9]{2}\.?[0-9]{3}\.?[0-9]{3}[\-.]?[0-9xX]/g,

    // PIX (chaves comuns)
    pix_chave: /chave\s*(?:pix)?\s*:?\s*[^\s]+|pix\s*:?\s*[^\s]+/gi,
  };

  // Palavras que indicam tentativa de compartilhar contato
  private contactIndicators = [
    'meu numero',
    'meu tel',
    'meu zap',
    'meu whats',
    'meu insta',
    'meu face',
    'meu email',
    'me chama no',
    'me add no',
    'me segue',
    'me encontra',
    'meu perfil',
    'minha conta',
    'conversa comigo',
    'fala comigo',
    'entra em contato',
    'manda mensagem',
    'chama no privado',
    'chama no pv',
    'passa teu',
    'qual teu numero',
    'qual seu insta',
    'qual seu zap',
  ];

  /**
   * Analisa conteudo e retorna resultado da filtragem
   */
  analyze(content: string): FilterResult {
    const detectedPatterns: string[] = [];
    let sanitizedContent = content;
    const originalContent = content;

    // 1. Verificar padroes de regex
    Object.entries(this.patterns).forEach(([name, pattern]) => {
      // Reset lastIndex para garantir busca correta
      pattern.lastIndex = 0;
      const matches = content.match(pattern);

      if (matches && matches.length > 0) {
        detectedPatterns.push(`${name}: ${matches.join(', ')}`);
        sanitizedContent = sanitizedContent.replace(pattern, '[conteudo bloqueado]');
      }
    });

    // 2. Verificar indicadores de tentativa de compartilhar contato
    const lowerContent = content.toLowerCase();
    const hasContactIndicator = this.contactIndicators.some(indicator =>
      lowerContent.includes(indicator)
    );

    if (hasContactIndicator) {
      detectedPatterns.push('indicador_contato: tentativa de compartilhar dados pessoais');
    }

    // 3. Verificar sequencias numericas suspeitas (8+ digitos seguidos)
    const numericSequences = content.match(/[0-9]{8,}/g);
    if (numericSequences) {
      detectedPatterns.push(`sequencia_numerica: ${numericSequences.join(', ')}`);
      sanitizedContent = sanitizedContent.replace(/[0-9]{8,}/g, '[numero bloqueado]');
    }

    // 4. Calcular confianca
    const confidence = this.calculateConfidence(detectedPatterns, content);

    return {
      isBlocked: detectedPatterns.length > 0,
      detectedPatterns,
      sanitizedContent,
      originalContent,
      confidence,
    };
  }

  /**
   * Calcula nivel de confianca da deteccao
   */
  private calculateConfidence(patterns: string[], content: string): number {
    if (patterns.length === 0) return 0;

    let confidence = 0.5; // Base

    // Mais padroes = maior confianca
    confidence += patterns.length * 0.1;

    // Padroes especificos aumentam confianca
    const highConfidencePatterns = ['telefone', 'email', 'cpf', 'whatsapp'];
    patterns.forEach(p => {
      const patternType = p.split(':')[0];
      if (highConfidencePatterns.includes(patternType)) {
        confidence += 0.15;
      }
    });

    // Indicador de contato + numero = muito provavel
    const hasIndicator = patterns.some(p => p.includes('indicador_contato'));
    const hasNumber = patterns.some(p =>
      p.includes('telefone') || p.includes('sequencia_numerica')
    );

    if (hasIndicator && hasNumber) {
      confidence += 0.2;
    }

    return Math.min(1, confidence);
  }

  /**
   * Verifica rapidamente se conteudo deve ser bloqueado
   */
  shouldBlock(content: string): boolean {
    const result = this.analyze(content);
    return result.isBlocked && result.confidence >= 0.5;
  }

  /**
   * Retorna versao sanitizada do conteudo
   */
  sanitize(content: string): string {
    return this.analyze(content).sanitizedContent;
  }
}

// Singleton para uso global
export const contentFilter = new ContentFilter();
