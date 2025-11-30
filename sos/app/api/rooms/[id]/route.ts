import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/server/supabase-admin';

/**
 * GET /api/rooms/:id - Detalhes da sala
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    }

    const { id } = await params;

    const { data: room, error } = await supabaseAdmin
      .from('chat_rooms')
      .select(`
        *,
        creator:created_by(id, full_name, avatar_url)
      `)
      .eq('id', id)
      .single();

    if (error || !room) {
      return NextResponse.json({ error: 'Sala nao encontrada' }, { status: 404 });
    }

    // Buscar membros
    const { data: members } = await supabaseAdmin
      .from('chat_room_members')
      .select(`
        *,
        profile:profile_id(
          id,
          user:user_id(full_name, avatar_url)
        )
      `)
      .eq('room_id', id);

    // Verificar se o usuario atual e membro
    let isMember = false;

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (profile) {
      const { data: chatProfile } = await supabaseAdmin
        .from('chat_profiles')
        .select('id')
        .eq('user_id', profile.id)
        .single();

      if (chatProfile) {
        const { data: membership } = await supabaseAdmin
          .from('chat_room_members')
          .select('room_id')
          .eq('room_id', id)
          .eq('profile_id', chatProfile.id)
          .maybeSingle();

        isMember = !!membership;
      }
    }

    return NextResponse.json({
      room: {
        ...room,
        hoursUntilExpiration: room.expires_at
          ? Math.max(0, (new Date(room.expires_at).getTime() - Date.now()) / (1000 * 60 * 60))
          : null,
      },
      members: members || [],
      isMember,
    });
  } catch (error) {
    console.error('Get room error:', error);
    return NextResponse.json({ error: 'Erro ao buscar sala' }, { status: 500 });
  }
}

/**
 * DELETE /api/rooms/:id - Deletar sala
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    }

    const { id } = await params;

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Perfil nao encontrado' }, { status: 404 });
    }

    // Verificar se e admin/criadora
    const { data: room } = await supabaseAdmin
      .from('chat_rooms')
      .select('created_by')
      .eq('id', id)
      .single();

    if (!room) {
      return NextResponse.json({ error: 'Sala nao encontrada' }, { status: 404 });
    }

    if (room.created_by !== profile.id) {
      return NextResponse.json(
        { error: 'Apenas a criadora pode deletar a sala' },
        { status: 403 }
      );
    }

    // Deletar sala (CASCADE vai limpar membros e mensagens)
    await supabaseAdmin.from('chat_rooms').delete().eq('id', id);

    console.log('🔥 Sala deletada:', id);

    return NextResponse.json({ message: 'Sala deletada permanentemente' });
  } catch (error) {
    console.error('Delete room error:', error);
    return NextResponse.json({ error: 'Erro ao deletar sala' }, { status: 500 });
  }
}
