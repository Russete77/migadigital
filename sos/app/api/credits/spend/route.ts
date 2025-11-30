import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/server/supabase-admin';
import { TOKEN_COSTS, formatTokens, type TokenCostType } from '@/lib/constants/tokens';

/**
 * POST /api/credits/spend - Gastar tokens
 * Aceita action_type como chave do TOKEN_COSTS ou amount direto
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { feature, amount: customAmount, description, metadata = {} } = body;

    // Determinar quantidade a gastar
    let amount: number;
    let actionType: string;
    let actionDescription: string;

    if (feature && feature in TOKEN_COSTS) {
      // Usar custo pre-definido da feature
      amount = TOKEN_COSTS[feature as TokenCostType];
      actionType = feature;
      actionDescription = description || `Uso de ${feature}`;
    } else if (customAmount && customAmount > 0) {
      // Usar quantidade customizada (para casos especiais)
      amount = customAmount;
      actionType = body.action_type || 'custom';
      actionDescription = description || 'Uso de tokens';
    } else {
      return NextResponse.json(
        { error: 'Informe feature (CHAT_MESSAGE, PRINT_ANALYSIS, etc) ou amount' },
        { status: 400 }
      );
    }

    // Get user profile
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, credits_remaining')
      .eq('clerk_id', userId)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Perfil nao encontrado' }, { status: 404 });
    }

    // Verificar saldo suficiente
    if (profile.credits_remaining < amount) {
      return NextResponse.json(
        {
          error: 'Tokens insuficientes',
          required: amount,
          available: profile.credits_remaining,
          required_formatted: formatTokens(amount),
          available_formatted: formatTokens(profile.credits_remaining),
        },
        { status: 403 }
      );
    }

    // Atualizar saldo diretamente
    const newBalance = profile.credits_remaining - amount;

    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ credits_remaining: newBalance })
      .eq('id', profile.id);

    if (updateError) {
      console.error('Error updating credits:', updateError);
      return NextResponse.json({ error: 'Erro ao gastar tokens' }, { status: 500 });
    }

    // Registrar no historico
    const { data: historyEntry, error: historyError } = await supabaseAdmin
      .from('credits_history')
      .insert({
        user_id: profile.id,
        amount: -amount,
        action_type: actionType,
        description: actionDescription,
        metadata,
      })
      .select('id')
      .single();

    if (historyError) {
      console.error('Error logging credit history:', historyError);
    }

    console.log(`💸 Tokens gastos: -${formatTokens(amount)} (${actionType}) - ${userId}`);

    return NextResponse.json({
      success: true,
      amount: -amount,
      amount_formatted: formatTokens(amount),
      new_balance: newBalance,
      new_balance_formatted: formatTokens(newBalance),
      history_id: historyEntry?.id,
    });
  } catch (error) {
    console.error('Credits spend error:', error);
    return NextResponse.json({ error: 'Erro ao gastar tokens' }, { status: 500 });
  }
}
