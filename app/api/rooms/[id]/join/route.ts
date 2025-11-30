import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/server/supabase-admin';
import bcrypt from 'bcryptjs';

/**
 * POST /api/rooms/:id/join - Entrar na sala
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
    const body = await req.json();
    const { password } = body;

    // Buscar sala
    const { data: room } = await supabaseAdmin
      .from('chat_rooms')
      .select('*')
      .eq('id', id)
      .single();

    if (!room) {
      return NextResponse.json({ error: 'Sala nao encontrada' }, { status: 404 });
    }

    if (room.status !== 'active') {
      return NextResponse.json({ error: 'Esta sala nao esta mais ativa' }, { status: 400 });
    }

    // Verificar senha
    if (room.password_hash && !password) {
      return NextResponse.json({ error: 'Esta sala requer senha' }, { status: 401 });
    }

    if (room.password_hash && password) {
      const isValidPassword = await bcrypt.compare(password, room.password_hash);
      if (!isValidPassword) {
        return NextResponse.json({ error: 'Senha incorreta' }, { status: 401 });
      }
    }

    // Verificar limite de membros
    if (room.member_count >= room.max_members) {
      return NextResponse.json({ error: 'Sala esta cheia' }, { status: 400 });
    }

    // Get profile
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Perfil nao encontrado' }, { status: 404 });
    }

    // Get chat profile
    const { data: chatProfile } = await supabaseAdmin
      .from('chat_profiles')
      .select('id')
      .eq('user_id', profile.id)
      .single();

    if (!chatProfile) {
      return NextResponse.json({ error: 'Perfil de chat nao encontrado' }, { status: 400 });
    }

    // Verificar se ja e membro
    const { data: existingMember } = await supabaseAdmin
      .from('chat_room_members')
      .select('room_id')
      .eq('room_id', id)
      .eq('profile_id', chatProfile.id)
      .maybeSingle();

    if (existingMember) {
      return NextResponse.json({ message: 'Voce ja e membro desta sala', alreadyMember: true });
    }

    // Gerar cor anonima
    const anonymousColor = room.is_anonymous
      ? await generateAnonymousColor(profile.id, id)
      : null;

    // Adicionar como membro
    const { data: newMember, error: insertError } = await supabaseAdmin
      .from('chat_room_members')
      .insert({
        room_id: id,
        profile_id: chatProfile.id,
        is_admin: false,
        anonymous_color: anonymousColor,
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Erro ao adicionar membro:', insertError);
      return NextResponse.json(
        { error: 'Erro ao entrar na sala. Verifique as permissoes de RLS.' },
        { status: 500 }
      );
    }

    console.log('✅ Usuaria entrou na sala:', id);

    return NextResponse.json({ message: 'Voce entrou na sala!', anonymousColor });
  } catch (error) {
    console.error('Join room error:', error);
    return NextResponse.json({ error: 'Erro ao entrar na sala' }, { status: 500 });
  }
}

async function generateAnonymousColor(userId: string, roomId: string): Promise<string> {
  const { data, error } = await supabaseAdmin.rpc('generate_anonymous_color', {
    p_user_id: userId,
    p_room_id: roomId,
  });

  if (error) {
    console.error('Erro ao gerar cor:', error);
    return '#FF6B6B';
  }

  return data;
}
