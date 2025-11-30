import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/server/supabase-admin';
import { contentFilter } from '@/lib/server/moderation/content-filter';

/**
 * GET /api/rooms/:id/messages - Buscar mensagens
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
    const { searchParams } = new URL(req.url);
    const limit = Number(searchParams.get('limit')) || 50;
    const offset = Number(searchParams.get('offset')) || 0;

    // Verificar se e membro
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

    const { data: membership } = await supabaseAdmin
      .from('chat_room_members')
      .select('room_id')
      .eq('room_id', id)
      .eq('profile_id', chatProfile.id)
      .maybeSingle();

    if (!membership) {
      return NextResponse.json({ error: 'Voce nao e membro desta sala' }, { status: 403 });
    }

    // Buscar mensagens
    const { data: messages, error } = await supabaseAdmin
      .from('chat_messages')
      .select(`
        *,
        sender:sender_id(
          id,
          nickname,
          avatar_color
        )
      `)
      .eq('room_id', id)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // Buscar informacao de sala (se anonima)
    const { data: room } = await supabaseAdmin
      .from('chat_rooms')
      .select('is_anonymous')
      .eq('id', id)
      .single();

    // Se sala anonima, buscar cores dos membros
    let messagesWithColors = messages;
    if (room?.is_anonymous) {
      const senderIds = [...new Set(messages?.map((m) => m.sender_id))];

      const { data: members } = await supabaseAdmin
        .from('chat_room_members')
        .select('profile_id, anonymous_color')
        .eq('room_id', id)
        .in('profile_id', senderIds);

      const colorMap = new Map(members?.map((m) => [m.profile_id, m.anonymous_color]));

      messagesWithColors = messages?.map((msg) => ({
        ...msg,
        display_color: colorMap.get(msg.sender_id) || '#FF6B6B',
        display_name: room.is_anonymous ? 'Anonima' : msg.sender?.nickname,
      }));
    }

    return NextResponse.json({ messages: messagesWithColors });
  } catch (error) {
    console.error('Get messages error:', error);
    return NextResponse.json({ error: 'Erro ao buscar mensagens' }, { status: 500 });
  }
}

/**
 * POST /api/rooms/:id/messages - Enviar mensagem
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
    const { content, messageType = 'text' } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Mensagem nao pode estar vazia' }, { status: 400 });
    }

    if (content.length > 2000) {
      return NextResponse.json(
        { error: 'Mensagem muito longa (max 2000 caracteres)' },
        { status: 400 }
      );
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

    // Verificar se e membro
    const { data: membership } = await supabaseAdmin
      .from('chat_room_members')
      .select('room_id')
      .eq('room_id', id)
      .eq('profile_id', chatProfile.id)
      .maybeSingle();

    if (!membership) {
      return NextResponse.json({ error: 'Voce nao e membro desta sala' }, { status: 403 });
    }

    // Rate limiting: max 10 mensagens por minuto
    const { data: recentMessages } = await supabaseAdmin
      .from('chat_messages')
      .select('id')
      .eq('sender_id', chatProfile.id)
      .eq('room_id', id)
      .gte('created_at', new Date(Date.now() - 60000).toISOString());

    if (recentMessages && recentMessages.length >= 10) {
      return NextResponse.json(
        { error: 'Voce esta enviando mensagens muito rapido. Aguarde um momento!' },
        { status: 429 }
      );
    }

    // MODERACAO: Filtrar informacoes pessoais
    const filterResult = contentFilter.analyze(content);

    if (filterResult.isBlocked) {
      console.log('🚫 Conteudo bloqueado:', {
        patterns: filterResult.detectedPatterns,
        confidence: filterResult.confidence,
        userId: userId,
      });

      // Registrar tentativa para moderacao
      await supabaseAdmin.from('content_moderation').insert({
        content_type: 'chat_message',
        content_id: chatProfile.id,
        user_id: userId,
        flagged_reason: 'personal_info',
        detected_patterns: filterResult.detectedPatterns,
        ai_confidence: filterResult.confidence,
        status: 'blocked',
      });

      return NextResponse.json(
        {
          error:
            'Sua mensagem foi bloqueada pois contem informacoes pessoais (telefone, email, redes sociais). ' +
            'Para sua seguranca, nao compartilhe dados de contato na comunidade.',
        },
        { status: 400 }
      );
    }

    // Moderacao adicional: palavras proibidas
    const bannedWords = ['spam', 'golpe', 'venda', 'compre', 'promocao', 'clique aqui'];
    const lowerContent = content.toLowerCase();
    const hasBannedWords = bannedWords.some((word) => lowerContent.includes(word));

    if (hasBannedWords) {
      await supabaseAdmin.from('content_moderation').insert({
        content_type: 'chat_message',
        content_id: chatProfile.id,
        user_id: userId,
        flagged_reason: 'banned_words',
        detected_patterns: bannedWords.filter((word) => lowerContent.includes(word)),
        status: 'blocked',
      });

      return NextResponse.json(
        { error: 'Sua mensagem contem conteudo nao permitido' },
        { status: 400 }
      );
    }

    // Criar mensagem
    const { data: newMessage, error } = await supabaseAdmin
      .from('chat_messages')
      .insert({
        room_id: id,
        sender_id: chatProfile.id,
        message_type: messageType,
        content: content.trim(),
      })
      .select(`
        *,
        sender:sender_id(
          id,
          nickname,
          avatar_color
        )
      `)
      .single();

    if (error) throw error;

    // Atualizar last_seen do membro
    await supabaseAdmin
      .from('chat_room_members')
      .update({ last_seen: new Date().toISOString() })
      .eq('room_id', id)
      .eq('profile_id', chatProfile.id);

    return NextResponse.json({ message: newMessage }, { status: 201 });
  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json({ error: 'Erro ao enviar mensagem' }, { status: 500 });
  }
}
