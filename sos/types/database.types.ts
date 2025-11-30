/**
 * Database Types
 * Generated from Supabase schema
 */

export type SubscriptionTier = "free" | "premium" | "pro";
export type SubscriptionStatus = "active" | "inactive" | "canceled" | "past_due";

export interface Profile {
  id: string;
  clerk_id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  subscription_tier: SubscriptionTier;
  subscription_status: SubscriptionStatus;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  credits_remaining: number;
  credits_reset_at: string | null;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
}

export interface EmergencySession {
  id: string;
  user_id: string;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number | null;
  messages: Message[];
  outcome: string | null;
  mood_before: number | null;
  mood_after: number | null;
  trigger_identified: string | null;
  intervention_effective: boolean | null;
  created_at: string;
}

export interface RedFlag {
  tipo: string;
  evidencia: string;
  gravidade: "baixa" | "média" | "alta";
  explicacao: string;
}

export interface AnalysisRecommendation {
  acao: string;
  justificativa: string;
  script_resposta: string | null;
  posicionamento: string;
}

export interface AnalysisResult {
  interesse_nivel: number;
  interesse_analise: string;
  red_flags: RedFlag[];
  sinais_positivos: string[];
  padrao_comunicacao: string;
  probabilidade_ghosting: number;
  probabilidade_voltar: number;
  traducao_real: string;
  recomendacao: AnalysisRecommendation;
}

export interface ConversationAnalysis {
  id: string;
  user_id: string;
  conversation_text: string;
  conversation_images: string[] | null;
  analysis_result: AnalysisResult;
  saved: boolean;
  shared_anonymous: boolean;
  created_at: string;
}

export interface JournalEntry {
  id: string;
  user_id: string;
  content: string;
  mood: number | null;
  triggers: string[] | null;
  emotions: string[] | null;
  related_to_ex: boolean;
  emergency_session_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface AudioListen {
  id: string;
  user_id: string;
  audio_id: string;
  listened_at: string;
  completed: boolean;
  completion_percentage: number;
  helpful: boolean | null;
  notes: string | null;
}

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export interface EmergencyChatResponse {
  message: string;
  sessionId?: string;
}

export interface AnalyzeResponse {
  analysisId: string;
  analysis: AnalysisResult;
  creditsRemaining: number | null;
}
