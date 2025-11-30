/**
 * Sistema de Tokens - SOS Emocional
 * Margem de lucro: 85%
 */

// ============================================
// PLANOS DE ASSINATURA
// ============================================
export const SUBSCRIPTION_PLANS = {
  monthly: {
    id: 'monthly',
    name: 'Mensal',
    price: 49.90,
    tokens: 10_000_000,
    stripePriceId: process.env.STRIPE_MONTHLY_PRICE_ID,
    period: 'month',
    badge: null,
  },
  semiannual: {
    id: 'semiannual',
    name: 'Semestral',
    price: 249.90,
    tokens: 70_000_000,
    stripePriceId: process.env.STRIPE_SEMIANNUAL_PRICE_ID,
    period: 'semiannual',
    badge: 'Economia 17%',
  },
  annual: {
    id: 'annual',
    name: 'Anual',
    price: 449.90,
    tokens: 175_000_000,
    stripePriceId: process.env.STRIPE_ANNUAL_PRICE_ID,
    period: 'year',
    badge: 'Melhor Valor',
  },
} as const;

// ============================================
// PACOTES DE TOKENS AVULSOS
// ============================================
export const TOKEN_PACKAGES = {
  starter: {
    id: 'starter',
    name: 'Starter',
    price: 19.90,
    tokens: 2_000_000,
    stripePriceId: process.env.STRIPE_STARTER_PRICE_ID,
    popular: false,
  },
  plus: {
    id: 'plus',
    name: 'Plus',
    price: 49.90,
    tokens: 5_000_000,
    stripePriceId: process.env.STRIPE_PLUS_PRICE_ID,
    popular: true,
  },
  power: {
    id: 'power',
    name: 'Power',
    price: 99.90,
    tokens: 10_000_000,
    stripePriceId: process.env.STRIPE_POWER_PRICE_ID,
    popular: false,
  },
} as const;

// ============================================
// CUSTO DE TOKENS POR FEATURE
// ============================================
export const TOKEN_COSTS = {
  // Chat SOS Emocional (por mensagem)
  CHAT_MESSAGE: 300_000,

  // Analise de Print
  PRINT_ANALYSIS: 1_000_000,

  // Analise de Conversa
  CONVERSATION_ANALYSIS: 1_500_000,

  // Busca RAG (Knowledge Base)
  RAG_SEARCH: 250_000,
} as const;

// ============================================
// GAMIFICACAO - GANHO DE TOKENS
// ============================================
export const TOKEN_REWARDS = {
  // Login diario
  DAILY_LOGIN: 75_000,

  // Streak de 7 dias consecutivos
  STREAK_7_DAYS: 200_000,

  // Completar entrada no diario
  JOURNAL_ENTRY: 75_000,

  // Limite maximo por mes (gratuito)
  MAX_FREE_MONTHLY: 2_500_000,
} as const;

// ============================================
// TOKENS INICIAIS (NOVOS USUARIOS)
// ============================================
export const INITIAL_TOKENS = 500_000; // 500K para experimentar

// ============================================
// HELPERS
// ============================================

/**
 * Formata tokens para exibicao (ex: 10.000.000 -> "10M")
 */
export function formatTokens(tokens: number): string {
  if (tokens >= 1_000_000) {
    const millions = tokens / 1_000_000;
    return millions % 1 === 0
      ? `${millions.toFixed(0)}M`
      : `${millions.toFixed(1)}M`;
  }
  if (tokens >= 1_000) {
    const thousands = tokens / 1_000;
    return thousands % 1 === 0
      ? `${thousands.toFixed(0)}K`
      : `${thousands.toFixed(1)}K`;
  }
  return tokens.toString();
}

/**
 * Formata tokens para exibicao completa (ex: 10.000.000)
 */
export function formatTokensFull(tokens: number): string {
  return tokens.toLocaleString('pt-BR');
}

/**
 * Verifica se usuario tem tokens suficientes
 */
export function hasEnoughTokens(balance: number, cost: keyof typeof TOKEN_COSTS): boolean {
  return balance >= TOKEN_COSTS[cost];
}

/**
 * Calcula quantas acoes o usuario pode fazer com o saldo
 */
export function calculateActionsAvailable(balance: number, cost: keyof typeof TOKEN_COSTS): number {
  return Math.floor(balance / TOKEN_COSTS[cost]);
}

// Types
export type SubscriptionPlanId = keyof typeof SUBSCRIPTION_PLANS;
export type TokenPackageId = keyof typeof TOKEN_PACKAGES;
export type TokenCostType = keyof typeof TOKEN_COSTS;
export type TokenRewardType = keyof typeof TOKEN_REWARDS;
