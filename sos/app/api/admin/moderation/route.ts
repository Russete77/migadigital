import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/server/supabase-admin';

export async function GET(request: NextRequest) {
  try {
    // Buscar alertas de crise dos ultimos 30 dias
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: crisisAlerts, error: crisisError } = await supabaseAdmin
      .from('ai_response_logs')
      .select(`
        id,
        user_message,
        was_crisis,
        crisis_type,
        sentiment_urgency,
        created_at,
        profiles:user_id (
          email,
          name
        )
      `)
      .eq('was_crisis', true)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(50);

    if (crisisError) {
      console.error('Error fetching crisis alerts:', crisisError);
    }

    // Transformar dados para o formato esperado
    const items = (crisisAlerts || []).map((alert: any) => ({
      id: alert.id,
      type: 'crisis',
      content: alert.user_message || 'Mensagem nao disponivel',
      user_email: alert.profiles?.email || 'Email nao disponivel',
      user_name: alert.profiles?.name || null,
      severity: alert.sentiment_urgency === 'alta' ? 'critical' :
                alert.sentiment_urgency === 'media' ? 'high' : 'medium',
      status: 'pending', // Por enquanto todos como pendentes
      reason: alert.crisis_type || 'Alerta de crise detectado',
      created_at: alert.created_at,
      reviewed_by: null,
      reviewed_at: null,
    }));

    // Calcular estatisticas
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const stats = {
      pendingItems: items.filter((i: any) => i.status === 'pending').length,
      reviewedToday: 0, // Seria calculado com base em um campo reviewed_at
      criticalAlerts: items.filter((i: any) => i.severity === 'critical').length,
      resolvedThisWeek: 0, // Seria calculado com base em um campo resolved_at
    };

    return NextResponse.json({
      items,
      stats,
    });
  } catch (error) {
    console.error('Admin moderation error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar itens de moderacao' },
      { status: 500 }
    );
  }
}
