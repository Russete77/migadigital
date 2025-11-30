import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/server/supabase-admin';

/**
 * POST /api/rooms/:id/polls/:pollId/vote - Votar na poll
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; pollId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    }

    const { pollId } = await params;
    const body = await req.json();
    const { optionId } = body;

    if (!optionId) {
      return NextResponse.json({ error: 'optionId e obrigatorio' }, { status: 400 });
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Perfil nao encontrado' }, { status: 404 });
    }

    // Buscar poll
    const { data: poll } = await supabaseAdmin
      .from('chat_polls')
      .select('options, expires_at')
      .eq('id', pollId)
      .single();

    if (!poll) {
      return NextResponse.json({ error: 'Poll nao encontrada' }, { status: 404 });
    }

    // Verificar expiracao
    if (poll.expires_at && new Date(poll.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Esta votacao expirou' }, { status: 400 });
    }

    const options = poll.options as Array<{ id: string; text: string; votes: string[] }>;
    const userIdStr = profile.id;

    // Remover voto anterior (se existir)
    options.forEach((opt) => {
      opt.votes = opt.votes.filter((uid) => uid !== userIdStr);
    });

    // Adicionar novo voto
    const targetOption = options.find((opt) => opt.id === optionId);
    if (!targetOption) {
      return NextResponse.json({ error: 'Opcao invalida' }, { status: 400 });
    }

    targetOption.votes.push(userIdStr);

    // Atualizar poll
    await supabaseAdmin.from('chat_polls').update({ options }).eq('id', pollId);

    return NextResponse.json({ poll: { ...poll, options } });
  } catch (error) {
    console.error('Vote error:', error);
    return NextResponse.json({ error: 'Erro ao votar' }, { status: 500 });
  }
}
