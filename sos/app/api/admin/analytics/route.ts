import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/server/supabase-admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '7d';

    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const previousStartDate = new Date(startDate);
    previousStartDate.setDate(previousStartDate.getDate() - days);

    // Total de usuarios
    const { count: totalUsers } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // Usuarios no periodo
    const { count: usersInPeriod } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startDate.toISOString());

    // Usuarios no periodo anterior
    const { count: usersInPreviousPeriod } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', previousStartDate.toISOString())
      .lt('created_at', startDate.toISOString());

    // Total de conversas
    const { count: totalConversations } = await supabaseAdmin
      .from('conversations')
      .select('*', { count: 'exact', head: true });

    // Total de mensagens no periodo
    const { count: messagesInPeriod } = await supabaseAdmin
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startDate.toISOString());

    // Mensagens no periodo anterior
    const { count: messagesInPreviousPeriod } = await supabaseAdmin
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', previousStartDate.toISOString())
      .lt('created_at', startDate.toISOString());

    // Total de mensagens
    const { count: totalMessages } = await supabaseAdmin
      .from('messages')
      .select('*', { count: 'exact', head: true });

    // Dados diarios
    const { data: dailyData } = await supabaseAdmin
      .from('messages')
      .select('created_at')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    // Agrupar por dia
    const dailyMap = new Map<string, { users: Set<string>; conversations: Set<string>; messages: number }>();

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      dailyMap.set(dateStr, { users: new Set(), conversations: new Set(), messages: 0 });
    }

    (dailyData || []).forEach((msg: any) => {
      const dateStr = new Date(msg.created_at).toISOString().split('T')[0];
      const dayData = dailyMap.get(dateStr);
      if (dayData) {
        dayData.messages++;
      }
    });

    const daily = Array.from(dailyMap.entries()).map(([date, data]) => ({
      date,
      users: data.users.size,
      conversations: data.conversations.size,
      messages: data.messages,
    }));

    // Horarios de pico
    const { data: hourlyData } = await supabaseAdmin
      .from('messages')
      .select('created_at')
      .gte('created_at', startDate.toISOString());

    const hourCounts = new Map<number, number>();
    (hourlyData || []).forEach((msg: any) => {
      const hour = new Date(msg.created_at).getHours();
      hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
    });

    const topHours = Array.from(hourCounts.entries())
      .map(([hour, count]) => ({ hour, count }))
      .sort((a, b) => b.count - a.count);

    // Calcular crescimentos
    const userGrowth = usersInPreviousPeriod && usersInPreviousPeriod > 0
      ? Math.round(((usersInPeriod || 0) - usersInPreviousPeriod) / usersInPreviousPeriod * 100)
      : 0;

    const messageGrowth = messagesInPreviousPeriod && messagesInPreviousPeriod > 0
      ? Math.round(((messagesInPeriod || 0) - messagesInPreviousPeriod) / messagesInPreviousPeriod * 100)
      : 0;

    // Metricas de engajamento
    const avgMessagesPerConversation = totalConversations && totalConversations > 0
      ? (totalMessages || 0) / totalConversations
      : 0;

    const avgConversationsPerUser = totalUsers && totalUsers > 0
      ? (totalConversations || 0) / totalUsers
      : 0;

    // Taxa de retorno (usuarios com mais de 1 conversa)
    const { data: userConversationCounts } = await supabaseAdmin
      .from('conversations')
      .select('user_id')
      .not('user_id', 'is', null);

    const userConvMap = new Map<string, number>();
    (userConversationCounts || []).forEach((conv: any) => {
      userConvMap.set(conv.user_id, (userConvMap.get(conv.user_id) || 0) + 1);
    });

    const returningUsers = Array.from(userConvMap.values()).filter(count => count > 1).length;
    const returnRate = userConvMap.size > 0 ? (returningUsers / userConvMap.size) * 100 : 0;

    return NextResponse.json({
      overview: {
        totalUsers: totalUsers || 0,
        totalConversations: totalConversations || 0,
        totalMessages: totalMessages || 0,
        avgSessionDuration: 15, // Placeholder - precisaria de tracking real
        userGrowth,
        messageGrowth,
      },
      daily,
      topHours,
      engagement: {
        avgMessagesPerConversation,
        avgConversationsPerUser,
        returnRate,
      },
    });
  } catch (error) {
    console.error('Admin analytics error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar analytics' },
      { status: 500 }
    );
  }
}
