import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/server/supabase-admin';

/**
 * POST /api/rooms/:id/leave - Sair da sala
 */
export async function POST(
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

    const { data: chatProfile } = await supabaseAdmin
      .from('chat_profiles')
      .select('id')
      .eq('user_id', profile.id)
      .single();

    if (!chatProfile) {
      return NextResponse.json({ error: 'Perfil de chat nao encontrado' }, { status: 404 });
    }

    await supabaseAdmin
      .from('chat_room_members')
      .delete()
      .eq('room_id', id)
      .eq('profile_id', chatProfile.id);

    return NextResponse.json({ message: 'Voce saiu da sala' });
  } catch (error) {
    console.error('Leave room error:', error);
    return NextResponse.json({ error: 'Erro ao sair da sala' }, { status: 500 });
  }
}
