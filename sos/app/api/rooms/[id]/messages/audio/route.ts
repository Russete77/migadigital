import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

/**
 * POST /api/rooms/:id/messages/audio - DESABILITADO
 * Recurso removido por seguranca (impossivel moderar dados pessoais em audio)
 */
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
  }

  return NextResponse.json(
    {
      error:
        'O envio de mensagens de audio foi desabilitado na comunidade para proteger a seguranca das usuarias. ' +
        'Por favor, utilize apenas mensagens de texto.',
    },
    { status: 403 }
  );
}
