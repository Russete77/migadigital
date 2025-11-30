import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/server/supabase-admin';

/**
 * POST /api/credits/daily-login - Processar login diario
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    }

    // Get user profile
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Perfil nao encontrado' }, { status: 404 });
    }

    // Call database function
    const { data, error } = await supabaseAdmin.rpc('process_daily_login', {
      p_user_id: profile.id,
    });

    if (error) {
      console.error('Error processing daily login:', error);
      return NextResponse.json({ error: 'Erro ao processar login diario' }, { status: 500 });
    }

    // Se ja logou hoje, retornar sem notificar
    if (data.already_logged_today) {
      return NextResponse.json({
        already_logged_today: true,
        streak_count: data.streak_count,
        balance: data.balance,
      });
    }

    console.log(`🔥 Login diario: Streak de ${data.streak_count} dias - ${userId}`);

    return NextResponse.json({
      already_logged_today: false,
      streak_count: data.streak_count,
      credits_earned: data.credits_earned,
      balance: data.balance,
      is_new_streak: data.is_new_streak,
    });
  } catch (error) {
    console.error('Daily login error:', error);
    return NextResponse.json({ error: 'Erro ao processar login diario' }, { status: 500 });
  }
}
