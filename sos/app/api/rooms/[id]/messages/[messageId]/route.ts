import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/server/supabase-admin';

/**
 * DELETE /api/rooms/:id/messages/:messageId - Deletar mensagem
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; messageId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    }

    const { id, messageId } = await params;

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

    // Buscar mensagem
    const { data: message } = await supabaseAdmin
      .from('chat_messages')
      .select('sender_id')
      .eq('id', messageId)
      .eq('room_id', id)
      .single();

    if (!message) {
      return NextResponse.json({ error: 'Mensagem nao encontrada' }, { status: 404 });
    }

    // Verificar se e o dono ou admin da sala
    const { data: membership } = await supabaseAdmin
      .from('chat_room_members')
      .select('is_admin')
      .eq('room_id', id)
      .eq('profile_id', chatProfile.id)
      .single();

    const isOwner = message.sender_id === chatProfile.id;
    const isAdmin = membership?.is_admin;

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Voce nao pode deletar esta mensagem' },
        { status: 403 }
      );
    }

    // Soft delete
    await supabaseAdmin
      .from('chat_messages')
      .update({ is_deleted: true, content: '[Mensagem deletada]' })
      .eq('id', messageId);

    return NextResponse.json({ message: 'Mensagem deletada' });
  } catch (error) {
    console.error('Delete message error:', error);
    return NextResponse.json({ error: 'Erro ao deletar mensagem' }, { status: 500 });
  }
}
