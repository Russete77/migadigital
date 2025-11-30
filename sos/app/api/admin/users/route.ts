import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/server/supabase-admin';

export async function GET(request: NextRequest) {
  try {
    // Buscar usuarios da tabela profiles (sincronizada via Clerk webhook)
    const { data: users, error } = await supabaseAdmin
      .from('profiles')
      .select(`
        id,
        clerk_id,
        email,
        full_name,
        avatar_url,
        subscription_tier,
        subscription_status,
        credits_remaining,
        onboarding_completed,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
      throw error;
    }

    // Para cada usuario, buscar contagem de conversas e mensagens
    const usersWithStats = await Promise.all(
      (users || []).map(async (user) => {
        const { count: conversationCount } = await supabaseAdmin
          .from('conversations')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        const { count: messageCount } = await supabaseAdmin
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        return {
          id: user.id,
          clerk_id: user.clerk_id,
          email: user.email,
          name: user.full_name,
          avatar_url: user.avatar_url,
          role: 'user', // Default role
          subscription_tier: user.subscription_tier,
          subscription_status: user.subscription_status,
          credits_remaining: user.credits_remaining,
          created_at: user.created_at,
          last_seen_at: user.updated_at,
          is_banned: false, // Would need a dedicated column
          total_conversations: conversationCount || 0,
          total_messages: messageCount || 0,
        };
      })
    );

    // Calcular estatisticas
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const stats = {
      totalUsers: users?.length || 0,
      activeToday: users?.filter(u =>
        u.updated_at && new Date(u.updated_at) >= today
      ).length || 0,
      newThisWeek: users?.filter(u =>
        new Date(u.created_at) >= sevenDaysAgo
      ).length || 0,
      bannedUsers: 0, // Would need a dedicated column
    };

    return NextResponse.json({
      users: usersWithStats,
      stats,
    });
  } catch (error) {
    console.error('Admin users error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar usuarios' },
      { status: 500 }
    );
  }
}
