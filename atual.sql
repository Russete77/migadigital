-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.achievements_definitions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL,
  reward_credits integer NOT NULL DEFAULT 0,
  unlock_condition jsonb NOT NULL,
  category text DEFAULT 'general'::text,
  order_index integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT achievements_definitions_pkey PRIMARY KEY (id)
);
CREATE TABLE public.admin_users (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  clerk_id text NOT NULL UNIQUE,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'viewer'::text,
  permissions jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  last_login_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT admin_users_pkey PRIMARY KEY (id)
);
CREATE TABLE public.ai_feedback (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  log_id uuid,
  user_id text NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  tags ARRAY,
  comment text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT ai_feedback_pkey PRIMARY KEY (id),
  CONSTRAINT ai_feedback_log_id_fkey FOREIGN KEY (log_id) REFERENCES public.ai_response_logs(id)
);
CREATE TABLE public.ai_metrics_daily (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  date date NOT NULL UNIQUE,
  total_responses integer DEFAULT 0,
  total_chat_responses integer DEFAULT 0,
  total_analyzer_responses integer DEFAULT 0,
  emotion_triste integer DEFAULT 0,
  emotion_ansiosa integer DEFAULT 0,
  emotion_raiva integer DEFAULT 0,
  emotion_feliz integer DEFAULT 0,
  emotion_confusa integer DEFAULT 0,
  emotion_esperancosa integer DEFAULT 0,
  emotion_desesperada integer DEFAULT 0,
  urgency_baixa integer DEFAULT 0,
  urgency_media integer DEFAULT 0,
  urgency_alta integer DEFAULT 0,
  urgency_critica integer DEFAULT 0,
  avg_roboticness_before double precision,
  avg_roboticness_after double precision,
  avg_improvement_percent double precision,
  avg_processing_time_ms integer,
  avg_bert_time_ms integer,
  avg_gpt_time_ms integer,
  avg_humanizer_time_ms integer,
  total_feedbacks integer DEFAULT 0,
  avg_rating double precision,
  rating_1_count integer DEFAULT 0,
  rating_2_count integer DEFAULT 0,
  rating_3_count integer DEFAULT 0,
  rating_4_count integer DEFAULT 0,
  rating_5_count integer DEFAULT 0,
  total_crises integer DEFAULT 0,
  total_escalated integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT ai_metrics_daily_pkey PRIMARY KEY (id)
);
CREATE TABLE public.ai_response_logs (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  session_id uuid,
  user_id text NOT NULL,
  ai_type text NOT NULL,
  user_message text NOT NULL,
  sentiment_emotion text,
  sentiment_intensity double precision,
  sentiment_urgency text,
  sentiment_keywords ARRAY,
  raw_response text NOT NULL,
  humanized_response text,
  roboticness_before double precision,
  roboticness_after double precision,
  removed_phrases ARRAY,
  added_markers ARRAY,
  emoji_count integer DEFAULT 0,
  processing_time_ms integer,
  bert_time_ms integer,
  gpt_time_ms integer,
  humanizer_time_ms integer,
  user_feedback integer,
  user_feedback_tags ARRAY,
  user_feedback_comment text,
  was_crisis boolean DEFAULT false,
  was_escalated boolean DEFAULT false,
  was_moderated boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT ai_response_logs_pkey PRIMARY KEY (id),
  CONSTRAINT ai_response_logs_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.emergency_sessions(id)
);
CREATE TABLE public.audio_listens (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  audio_id text NOT NULL,
  listened_at timestamp with time zone DEFAULT now(),
  completed boolean DEFAULT false,
  completion_percentage integer DEFAULT 0,
  helpful boolean,
  notes text,
  CONSTRAINT audio_listens_pkey PRIMARY KEY (id),
  CONSTRAINT audio_listens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.challenge_check_ins (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_challenge_id uuid NOT NULL,
  day_number integer NOT NULL,
  checked_in_at timestamp with time zone DEFAULT now(),
  check_in_date date NOT NULL DEFAULT CURRENT_DATE,
  mood integer,
  notes text,
  was_successful boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT challenge_check_ins_pkey PRIMARY KEY (id),
  CONSTRAINT challenge_check_ins_user_challenge_id_fkey FOREIGN KEY (user_challenge_id) REFERENCES public.user_challenges(id)
);
CREATE TABLE public.challenges_definitions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text NOT NULL,
  duration_days integer NOT NULL DEFAULT 30,
  daily_reward_credits integer DEFAULT 5,
  completion_reward_credits integer DEFAULT 200,
  badge_emoji text DEFAULT '🏆'::text,
  category text DEFAULT 'growth'::text,
  difficulty text DEFAULT 'medium'::text,
  daily_prompt text,
  is_active boolean DEFAULT true,
  order_index integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT challenges_definitions_pkey PRIMARY KEY (id)
);
CREATE TABLE public.chat_messages (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  room_id uuid NOT NULL,
  sender_id uuid NOT NULL,
  message_type text NOT NULL DEFAULT 'text'::text,
  content text,
  audio_url text,
  audio_duration integer,
  is_deleted boolean DEFAULT false,
  is_flagged boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT chat_messages_pkey PRIMARY KEY (id),
  CONSTRAINT chat_messages_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.chat_rooms(id),
  CONSTRAINT chat_messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.chat_profiles(id)
);
CREATE TABLE public.chat_profiles (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL UNIQUE,
  nickname text NOT NULL UNIQUE,
  avatar_color text DEFAULT '#E94057'::text,
  bio text,
  is_banned boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT chat_profiles_pkey PRIMARY KEY (id),
  CONSTRAINT chat_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.chat_reports (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  message_id uuid NOT NULL,
  reporter_id uuid NOT NULL,
  reason text NOT NULL,
  description text,
  status text DEFAULT 'pending'::text,
  reviewed_by uuid,
  reviewed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT chat_reports_pkey PRIMARY KEY (id),
  CONSTRAINT chat_reports_message_id_fkey FOREIGN KEY (message_id) REFERENCES public.chat_messages(id),
  CONSTRAINT chat_reports_reporter_id_fkey FOREIGN KEY (reporter_id) REFERENCES public.chat_profiles(id),
  CONSTRAINT chat_reports_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.admin_users(id)
);
CREATE TABLE public.chat_room_members (
  room_id uuid NOT NULL,
  profile_id uuid NOT NULL,
  joined_at timestamp with time zone DEFAULT now(),
  last_seen timestamp with time zone DEFAULT now(),
  CONSTRAINT chat_room_members_pkey PRIMARY KEY (room_id, profile_id),
  CONSTRAINT chat_room_members_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.chat_rooms(id),
  CONSTRAINT chat_room_members_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.chat_profiles(id)
);
CREATE TABLE public.chat_rooms (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  type text NOT NULL DEFAULT 'general'::text,
  max_members integer DEFAULT 50,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT chat_rooms_pkey PRIMARY KEY (id)
);
CREATE TABLE public.content_moderation (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  content_type text NOT NULL,
  content_id uuid NOT NULL,
  user_id text NOT NULL,
  flagged_reason text NOT NULL,
  detected_patterns ARRAY,
  ai_confidence double precision,
  status text DEFAULT 'pending'::text,
  reviewed_by uuid,
  reviewed_at timestamp with time zone,
  moderator_notes text,
  action_taken text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT content_moderation_pkey PRIMARY KEY (id),
  CONSTRAINT content_moderation_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.admin_users(id)
);
CREATE TABLE public.conversation_analyses (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  conversation_text text NOT NULL,
  conversation_images ARRAY,
  analysis_result jsonb NOT NULL,
  saved boolean DEFAULT false,
  shared_anonymous boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT conversation_analyses_pkey PRIMARY KEY (id),
  CONSTRAINT conversation_analyses_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.daily_logins (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  login_date date NOT NULL,
  streak_count integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT daily_logins_pkey PRIMARY KEY (id),
  CONSTRAINT daily_logins_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.emergency_sessions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  started_at timestamp with time zone DEFAULT now(),
  ended_at timestamp with time zone,
  duration_minutes integer,
  messages jsonb DEFAULT '[]'::jsonb,
  outcome text,
  mood_before integer CHECK (mood_before >= 1 AND mood_before <= 10),
  mood_after integer CHECK (mood_after >= 1 AND mood_after <= 10),
  trigger_identified text,
  intervention_effective boolean,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT emergency_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT emergency_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.journal_entries (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  content text NOT NULL,
  mood integer CHECK (mood >= 1 AND mood <= 10),
  triggers ARRAY,
  emotions ARRAY,
  related_to_ex boolean DEFAULT false,
  emergency_session_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT journal_entries_pkey PRIMARY KEY (id),
  CONSTRAINT journal_entries_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT journal_entries_emergency_session_id_fkey FOREIGN KEY (emergency_session_id) REFERENCES public.emergency_sessions(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  clerk_id text NOT NULL UNIQUE,
  email text NOT NULL UNIQUE,
  full_name text,
  avatar_url text,
  subscription_tier USER-DEFINED DEFAULT 'free'::subscription_tier,
  subscription_status USER-DEFINED DEFAULT 'inactive'::subscription_status,
  stripe_customer_id text UNIQUE,
  stripe_subscription_id text,
  credits_remaining integer DEFAULT 3,
  credits_reset_at timestamp with time zone,
  onboarding_completed boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id)
);
CREATE TABLE public.user_achievements (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  achievement_id uuid NOT NULL,
  unlocked_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_achievements_pkey PRIMARY KEY (id),
  CONSTRAINT user_achievements_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT user_achievements_achievement_id_fkey FOREIGN KEY (achievement_id) REFERENCES public.achievements_definitions(id)
);
CREATE TABLE public.user_activities (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id text NOT NULL,
  activity_type text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_activities_pkey PRIMARY KEY (id)
);
CREATE TABLE public.user_challenges (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  challenge_id uuid NOT NULL,
  started_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  failed_at timestamp with time zone,
  status text DEFAULT 'active'::text,
  current_day integer DEFAULT 1,
  last_check_in_date date,
  total_check_ins integer DEFAULT 0,
  notes text,
  motivation text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_challenges_pkey PRIMARY KEY (id),
  CONSTRAINT user_challenges_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT user_challenges_challenge_id_fkey FOREIGN KEY (challenge_id) REFERENCES public.challenges_definitions(id)
);
CREATE TABLE public.user_credits_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount integer NOT NULL,
  action_type text NOT NULL,
  description text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_credits_history_pkey PRIMARY KEY (id),
  CONSTRAINT user_credits_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);