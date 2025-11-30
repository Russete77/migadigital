import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/server/supabase-admin';
import { formatTokens, formatTokensFull, TOKEN_COSTS, calculateActionsAvailable } from '@/lib/constants/tokens';

/**
 * GET /api/credits/balance - Obter saldo atual de tokens
 */
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    }

    // Get user profile
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('id, credits_remaining, subscription_tier, subscription_status')
      .eq('clerk_id', userId)
      .single();

    if (error || !profile) {
      return NextResponse.json({ error: 'Perfil nao encontrado' }, { status: 404 });
    }

    const balance = profile.credits_remaining || 0;

    return NextResponse.json({
      balance,
      balance_formatted: formatTokens(balance),
      balance_full: formatTokensFull(balance),
      user_id: profile.id,
      subscription: {
        tier: profile.subscription_tier || 'free',
        status: profile.subscription_status || 'inactive',
      },
      available_actions: {
        chat_messages: calculateActionsAvailable(balance, 'CHAT_MESSAGE'),
        print_analyses: calculateActionsAvailable(balance, 'PRINT_ANALYSIS'),
        conversation_analyses: calculateActionsAvailable(balance, 'CONVERSATION_ANALYSIS'),
        rag_searches: calculateActionsAvailable(balance, 'RAG_SEARCH'),
      },
      costs: {
        CHAT_MESSAGE: TOKEN_COSTS.CHAT_MESSAGE,
        PRINT_ANALYSIS: TOKEN_COSTS.PRINT_ANALYSIS,
        CONVERSATION_ANALYSIS: TOKEN_COSTS.CONVERSATION_ANALYSIS,
        RAG_SEARCH: TOKEN_COSTS.RAG_SEARCH,
      },
    });
  } catch (error) {
    console.error('Credits balance error:', error);
    return NextResponse.json({ error: 'Erro ao buscar saldo' }, { status: 500 });
  }
}
