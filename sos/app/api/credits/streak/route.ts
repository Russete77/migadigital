import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/server/supabase-admin';

/**
 * GET /api/credits/streak - Obter streak atual
 */
export async function GET(req: NextRequest) {
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

    // Get last login
    const { data: lastLogin } = await supabaseAdmin
      .from('daily_logins')
      .select('login_date, streak_count')
      .eq('user_id', profile.id)
      .order('login_date', { ascending: false })
      .limit(1)
      .single();

    if (!lastLogin) {
      return NextResponse.json({
        streak_count: 0,
        last_login: null,
      });
    }

    // Verificar se o streak esta ativo (login foi hoje ou ontem)
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const lastLoginDate = new Date(lastLogin.login_date);
    const isActive =
      lastLoginDate.toDateString() === today.toDateString() ||
      lastLoginDate.toDateString() === yesterday.toDateString();

    return NextResponse.json({
      streak_count: isActive ? lastLogin.streak_count : 0,
      last_login: lastLogin.login_date,
      is_active: isActive,
    });
  } catch (error) {
    console.error('Streak error:', error);
    return NextResponse.json({ error: 'Erro ao buscar streak' }, { status: 500 });
  }
}
