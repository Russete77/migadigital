import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/server/supabase-admin';

interface CreatePollBody {
  question: string;
  options: Array<{ id: string; text: string }>;
  expiresInHours?: number;
}

/**
 * POST /api/rooms/:id/polls - Criar poll
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
    const body: CreatePollBody = await req.json();

    if (!body.question || body.question.trim().length < 5) {
      return NextResponse.json(
        { error: 'Pergunta deve ter pelo menos 5 caracteres' },
        { status: 400 }
      );
    }

    if (!body.options || body.options.length < 2) {
      return NextResponse.json(
        { error: 'Poll deve ter pelo menos 2 opcoes' },
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

    // Formatar opcoes
    const options = body.options.map((opt) => ({
      ...opt,
      votes: [],
    }));

    const expiresAt = body.expiresInHours
      ? new Date(Date.now() + body.expiresInHours * 60 * 60 * 1000).toISOString()
      : null;

    const { data: poll, error } = await supabaseAdmin
      .from('chat_polls')
      .insert({
        room_id: id,
        created_by: chatProfile.id,
        question: body.question.trim(),
        options,
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ poll }, { status: 201 });
  } catch (error) {
    console.error('Create poll error:', error);
    return NextResponse.json({ error: 'Erro ao criar poll' }, { status: 500 });
  }
}
