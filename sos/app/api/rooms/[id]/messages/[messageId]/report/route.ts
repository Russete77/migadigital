import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/server/supabase-admin';

/**
 * POST /api/rooms/:id/messages/:messageId/report - Denunciar mensagem
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; messageId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    }

    const { id, messageId } = await params;
    const body = await req.json();
    const { reason, description } = body;

    if (!reason) {
      return NextResponse.json({ error: 'Motivo e obrigatorio' }, { status: 400 });
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Perfil nao encontrado' }, { status: 404 });
    }

    const { data: chatProfile } = await supabaseAdmin
      .from('chat_profiles')
      .select('id')
      .eq('user_id', profile.id)
      .single();

    if (!chatProfile) {
      return NextResponse.json({ error: 'Perfil de chat nao encontrado' }, { status: 404 });
    }

    // Verificar se mensagem existe
    const { data: message } = await supabaseAdmin
      .from('chat_messages')
      .select('id')
      .eq('id', messageId)
      .eq('room_id', id)
      .single();

    if (!message) {
      return NextResponse.json({ error: 'Mensagem nao encontrada' }, { status: 404 });
    }

    // Criar denuncia
    await supabaseAdmin.from('chat_reports').insert({
      message_id: messageId,
      reporter_id: chatProfile.id,
      reason,
      description: description || null,
      status: 'pending',
    });

    // Flaggar mensagem automaticamente apos 3 denuncias
    const { count } = await supabaseAdmin
      .from('chat_reports')
      .select('id', { count: 'exact', head: true })
      .eq('message_id', messageId);

    if (count && count >= 3) {
      await supabaseAdmin
        .from('chat_messages')
        .update({ is_flagged: true })
        .eq('id', messageId);

      console.log('🚩 Mensagem flagada automaticamente:', messageId);
    }

    return NextResponse.json({ message: 'Denuncia enviada. Nossa equipe ira revisar.' });
  } catch (error) {
    console.error('Report error:', error);
    return NextResponse.json({ error: 'Erro ao denunciar' }, { status: 500 });
  }
}
