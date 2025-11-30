import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/server/supabase-admin';

/**
 * GET /api/journal - List all journal entries
 */
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
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

    // Get journal entries
    const { data: entries, error } = await supabaseAdmin
      .from('journal_entries')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching journal entries:', error);
      return NextResponse.json({ error: 'Erro ao buscar entradas' }, { status: 500 });
    }

    return NextResponse.json(entries || []);
  } catch (error) {
    console.error('Journal GET error:', error);
    return NextResponse.json({ error: 'Erro ao buscar entradas' }, { status: 500 });
  }
}

/**
 * POST /api/journal - Create new journal entry
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { content, mood, emotions } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Conteudo e obrigatorio' }, { status: 400 });
    }

    if (mood && (mood < 1 || mood > 10)) {
      return NextResponse.json({ error: 'Humor deve estar entre 1 e 10' }, { status: 400 });
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

    // Create journal entry
    const { data: entry, error } = await supabaseAdmin
      .from('journal_entries')
      .insert({
        user_id: profile.id,
        content: content.trim(),
        mood: mood || null,
        emotions: emotions || [],
        related_to_ex: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating journal entry:', error);
      return NextResponse.json({ error: 'Erro ao criar entrada' }, { status: 500 });
    }

    console.log('✅ Journal entry created:', entry.id);

    // Gamificacao: Dar 5 creditos pela entrada (1 recompensa por dia)
    try {
      const today = new Date().toISOString().split('T')[0];

      // Verificar se ja ganhou creditos hoje por journal entry
      const { data: todayReward } = await supabaseAdmin
        .from('user_credits_history')
        .select('id')
        .eq('user_id', profile.id)
        .eq('action_type', 'journal_entry')
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`)
        .limit(1)
        .single();

      // Se ainda nao ganhou hoje, dar recompensa
      if (!todayReward) {
        const { error: creditsError } = await supabaseAdmin.rpc('update_user_credits', {
          p_user_id: profile.id,
          p_amount: 5,
          p_action_type: 'journal_entry',
          p_description: 'Entrada no diario emocional',
          p_metadata: { journal_entry_id: entry.id },
        });

        if (creditsError) {
          console.error('Error adding journal credits:', creditsError);
        } else {
          console.log('💎 +5 creditos por journal entry');
        }
      } else {
        console.log('⚠️ Ja ganhou creditos por journal entry hoje');
      }
    } catch (creditsError) {
      console.error('Error in credits logic:', creditsError);
    }

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error('Journal POST error:', error);
    return NextResponse.json({ error: 'Erro ao criar entrada' }, { status: 500 });
  }
}
