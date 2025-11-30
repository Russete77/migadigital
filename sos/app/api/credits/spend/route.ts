import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/server/supabase-admin';

/**
 * POST /api/credits/spend - Gastar creditos
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { amount, action_type, description, metadata = {} } = body;

    // Validacao
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Quantidade deve ser maior que zero' }, { status: 400 });
    }

    if (!action_type || !description) {
      return NextResponse.json(
        { error: 'action_type e description sao obrigatorios' },
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
        { error: 'Creditos insuficientes. Faca upgrade para continuar.' },
        { status: 403 }
      );
    }

    // Call database function (passa negativo para gastar)
    const { data, error } = await supabaseAdmin.rpc('update_user_credits', {
      p_user_id: profile.id,
      p_amount: -amount, // Negativo para gastar
      p_action_type: action_type,
      p_description: description,
      p_metadata: metadata,
    });

    if (error) {
      console.error('Error spending credits:', error);

      // Se erro for de creditos insuficientes
      if (error.message.includes('insuficientes')) {
        return NextResponse.json({ error: 'Creditos insuficientes' }, { status: 403 });
      }

      return NextResponse.json({ error: 'Erro ao gastar creditos' }, { status: 500 });
    }

    console.log(`💸 Creditos gastos: -${amount} (${action_type}) - ${userId}`);

    return NextResponse.json({
      success: true,
      amount: -amount,
      new_balance: data.new_balance,
      history_id: data.history_id,
    });
  } catch (error) {
    console.error('Credits spend error:', error);
    return NextResponse.json({ error: 'Erro ao gastar creditos' }, { status: 500 });
  }
}
