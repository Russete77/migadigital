import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/server/supabase-admin';
import { TOKEN_REWARDS, formatTokens } from '@/lib/constants/tokens';

/**
 * POST /api/credits/daily-login - Processar login diario
 * Recompensa: 75.000 tokens por login + 200.000 bonus a cada 7 dias de streak
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    }

    // Get user profile with streak info
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, credits_remaining, streak_count, last_login_date')
      .eq('clerk_id', userId)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Perfil nao encontrado' }, { status: 404 });
    }

    const today = new Date().toISOString().split('T')[0];
    const lastLogin = profile.last_login_date;

    // Verificar se ja logou hoje
    if (lastLogin === today) {
      return NextResponse.json({
        already_logged_today: true,
        streak_count: profile.streak_count || 0,
        balance: profile.credits_remaining,
        balance_formatted: formatTokens(profile.credits_remaining),
      });
    }

    // Calcular streak
    let newStreak = 1;
    let isStreakBonus = false;

    if (lastLogin) {
      const lastDate = new Date(lastLogin);
      const todayDate = new Date(today);
      const diffTime = todayDate.getTime() - lastDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        // Login consecutivo - incrementa streak
        newStreak = (profile.streak_count || 0) + 1;
      }
      // Se diffDays > 1, streak reseta para 1
    }

    // Calcular tokens ganhos
    let tokensEarned = TOKEN_REWARDS.DAILY_LOGIN;

    // Bonus de streak a cada 7 dias
    if (newStreak > 0 && newStreak % 7 === 0) {
      tokensEarned += TOKEN_REWARDS.STREAK_7_DAYS;
      isStreakBonus = true;
    }

    // Atualizar perfil
    const newBalance = (profile.credits_remaining || 0) + tokensEarned;

    await supabaseAdmin
      .from('profiles')
      .update({
        credits_remaining: newBalance,
        streak_count: newStreak,
        last_login_date: today,
      })
      .eq('id', profile.id);

    // Registrar no historico
    await supabaseAdmin.from('credits_history').insert({
      user_id: profile.id,
      amount: tokensEarned,
      action_type: isStreakBonus ? 'streak_bonus' : 'daily_login',
      description: isStreakBonus
        ? `Login diario + Bonus de ${newStreak} dias de streak! +${formatTokens(tokensEarned)} tokens`
        : `Login diario - Streak de ${newStreak} dia(s). +${formatTokens(tokensEarned)} tokens`,
      metadata: { streak_count: newStreak, is_streak_bonus: isStreakBonus },
    });

    console.log(`🔥 Login diario: Streak de ${newStreak} dias, +${formatTokens(tokensEarned)} tokens - ${userId}`);

    return NextResponse.json({
      already_logged_today: false,
      streak_count: newStreak,
      tokens_earned: tokensEarned,
      tokens_earned_formatted: formatTokens(tokensEarned),
      balance: newBalance,
      balance_formatted: formatTokens(newBalance),
      is_streak_bonus: isStreakBonus,
    });
  } catch (error) {
    console.error('Daily login error:', error);
    return NextResponse.json({ error: 'Erro ao processar login diario' }, { status: 500 });
  }
}
