import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/server/supabase-admin';

/**
 * POST /api/credits/earn - Adicionar creditos
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
      .select('id, clerk_id')
      .eq('clerk_id', userId)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Perfil nao encontrado' }, { status: 404 });
    }

    // Call database function to update credits
    const { data, error } = await supabaseAdmin.rpc('update_user_credits', {
      p_user_id: profile.id,
      p_amount: amount,
      p_action_type: action_type,
      p_description: description,
      p_metadata: metadata,
    });

    if (error) {
      console.error('Error earning credits:', error);
      return NextResponse.json({ error: 'Erro ao adicionar creditos' }, { status: 500 });
    }

    console.log(`✅ Creditos adicionados: +${amount} (${action_type}) - ${userId}`);

    return NextResponse.json({
      success: true,
      amount,
      new_balance: data.new_balance,
      history_id: data.history_id,
    });
  } catch (error) {
    console.error('Credits earn error:', error);
    return NextResponse.json({ error: 'Erro ao adicionar creditos' }, { status: 500 });
  }
}
