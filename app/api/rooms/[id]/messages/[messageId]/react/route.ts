import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/server/supabase-admin';

/**
 * POST /api/rooms/:id/messages/:messageId/react - Reagir a mensagem
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
    const { emoji } = body;

    if (!emoji || emoji.length > 2) {
      return NextResponse.json({ error: 'Emoji invalido' }, { status: 400 });
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Perfil nao encontrado' }, { status: 404 });
    }

    // Buscar mensagem
    const { data: message } = await supabaseAdmin
      .from('chat_messages')
      .select('reactions')
      .eq('id', messageId)
      .eq('room_id', id)
      .single();

    if (!message) {
      return NextResponse.json({ error: 'Mensagem nao encontrada' }, { status: 404 });
    }

    // Atualizar reacoes
    const reactions = (message.reactions as Record<string, string[]>) || {};

    if (!reactions[emoji]) {
      reactions[emoji] = [];
    }

    // Toggle: adicionar ou remover
    const userIdStr = profile.id;
    if (reactions[emoji].includes(userIdStr)) {
      reactions[emoji] = reactions[emoji].filter((uid) => uid !== userIdStr);
      // Remover emoji se ninguem reagiu
      if (reactions[emoji].length === 0) {
        delete reactions[emoji];
      }
    } else {
      reactions[emoji].push(userIdStr);
    }

    await supabaseAdmin
      .from('chat_messages')
      .update({ reactions })
      .eq('id', messageId);

    return NextResponse.json({ reactions });
  } catch (error) {
    console.error('React error:', error);
    return NextResponse.json({ error: 'Erro ao reagir' }, { status: 500 });
  }
}
