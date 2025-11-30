import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/server/supabase-admin';
import bcrypt from 'bcryptjs';

interface CreateRoomBody {
  name: string;
  description?: string;
  type?: 'general' | 'support' | 'vent' | 'celebration' | 'advice';
  template?: 'vent' | 'support' | 'celebration' | 'advice' | 'custom';
  tags?: string[];
  isAnonymous?: boolean;
  password?: string;
  expiresInHours?: number;
  maxMembers?: number;
}

/**
 * GET /api/rooms - Listar salas ativas
 */
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('filter');
    const tags = searchParams.get('tags');

    // Sempre buscar o perfil do usuario atual
    const { data: currentProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    let query = supabaseAdmin
      .from('chat_rooms')
      .select(`
        *,
        creator:created_by(id, full_name, avatar_url)
      `)
      .eq('status', 'active')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    // Filtros
    if (filter === 'expiring') {
      query = query
        .not('expires_at', 'is', null)
        .lte('expires_at', new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString());
    }

    if (filter === 'my_rooms' && currentProfile) {
      query = query.eq('created_by', currentProfile.id);
    }

    if (tags) {
      const tagArray = tags.split(',');
      query = query.contains('tags', tagArray);
    }

    const { data: rooms, error } = await query;

    if (error) throw error;

    // Adicionar info de expiracao
    const roomsWithExpiration = rooms?.map((room) => ({
      ...room,
      hoursUntilExpiration: room.expires_at
        ? Math.max(0, (new Date(room.expires_at).getTime() - Date.now()) / (1000 * 60 * 60))
        : null,
      isExpiringSoon: room.expires_at
        ? new Date(room.expires_at).getTime() - Date.now() < 2 * 60 * 60 * 1000
        : false,
    }));

    return NextResponse.json({
      rooms: roomsWithExpiration,
      currentUserProfileId: currentProfile?.id || null,
    });
  } catch (error) {
    console.error('Get rooms error:', error);
    return NextResponse.json({ error: 'Erro ao buscar salas' }, { status: 500 });
  }
}

/**
 * POST /api/rooms - Criar sala
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    }

    const body: CreateRoomBody = await req.json();

    if (!body.name || body.name.trim().length < 3) {
      return NextResponse.json(
        { error: 'Nome da sala deve ter pelo menos 3 caracteres' },
        { status: 400 }
      );
    }

    // Get user profile
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Perfil nao encontrado' }, { status: 404 });
    }

    // Check: max 3 salas ativas (nao expiradas)
    const { count } = await supabaseAdmin
      .from('chat_rooms')
      .select('id', { count: 'exact', head: true })
      .eq('created_by', profile.id)
      .eq('status', 'active')
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);

    if (count && count >= 3) {
      return NextResponse.json(
        { error: 'Voce ja tem 3 salas ativas. Delete uma antes de criar outra.' },
        { status: 400 }
      );
    }

    // Calcular expiracao
    const expiresAt = body.expiresInHours
      ? new Date(Date.now() + body.expiresInHours * 60 * 60 * 1000).toISOString()
      : null;

    // Hash de senha (se fornecida)
    const passwordHash = body.password
      ? await bcrypt.hash(body.password, 10)
      : null;

    // Criar sala
    const { data: newRoom, error: roomError } = await supabaseAdmin
      .from('chat_rooms')
      .insert({
        name: body.name.trim(),
        description: body.description?.trim() || null,
        type: body.type || 'general',
        template: body.template || 'custom',
        tags: body.tags || [],
        is_anonymous: body.isAnonymous || false,
        password_hash: passwordHash,
        expires_at: expiresAt,
        max_members: body.maxMembers || 50,
        created_by: profile.id,
        status: 'active',
        is_active: true,
      })
      .select()
      .single();

    if (roomError) throw roomError;

    // Ensure chat profile exists
    const { data: chatProfile } = await supabaseAdmin
      .from('chat_profiles')
      .select('id')
      .eq('user_id', profile.id)
      .single();

    if (!chatProfile) {
      return NextResponse.json(
        { error: 'Perfil de chat nao encontrado. Crie um perfil primeiro.' },
        { status: 400 }
      );
    }

    // Auto-join criadora como admin
    const anonymousColor = body.isAnonymous
      ? await generateAnonymousColor(profile.id, newRoom.id)
      : null;

    await supabaseAdmin.from('chat_room_members').insert({
      room_id: newRoom.id,
      profile_id: chatProfile.id,
      is_admin: true,
      anonymous_color: anonymousColor,
    });

    console.log('✅ Sala criada:', newRoom.id);

    return NextResponse.json({ room: newRoom }, { status: 201 });
  } catch (error) {
    console.error('Create room error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao criar sala' },
      { status: 500 }
    );
  }
}

/**
 * Gerar cor anonima unica para usuario na sala
 */
async function generateAnonymousColor(userId: string, roomId: string): Promise<string> {
  const { data, error } = await supabaseAdmin.rpc('generate_anonymous_color', {
    p_user_id: userId,
    p_room_id: roomId,
  });

  if (error) {
    console.error('Erro ao gerar cor:', error);
    return '#FF6B6B'; // Fallback
  }

  return data;
}
