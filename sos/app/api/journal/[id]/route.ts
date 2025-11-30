import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/server/supabase-admin';

/**
 * DELETE /api/journal/:id - Delete journal entry
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

    // Get user profile
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Perfil nao encontrado' }, { status: 404 });
    }

    // Delete entry (only if belongs to user)
    const { error } = await supabaseAdmin
      .from('journal_entries')
      .delete()
      .eq('id', id)
      .eq('user_id', profile.id);

    if (error) {
      console.error('Error deleting journal entry:', error);
      return NextResponse.json({ error: 'Erro ao deletar entrada' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Journal DELETE error:', error);
    return NextResponse.json({ error: 'Erro ao deletar entrada' }, { status: 500 });
  }
}
