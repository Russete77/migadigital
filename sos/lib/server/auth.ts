import { auth, currentUser } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from './supabase-admin';

/**
 * Helper de autenticacao para API Routes
 */

export interface AuthResult {
  userId: string;
  profileId: string;
}

/**
 * Autentica usuario e retorna userId e profileId
 * Cria perfil automaticamente se nao existir
 */
export async function authenticateRequest(): Promise<AuthResult> {
  const { userId } = await auth();

  if (!userId) {
    throw new ApiError('Nao autenticado', 401);
  }

  // Buscar ou criar perfil
  let { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('clerk_id', userId)
    .single();

  if (!profile) {
    // Criar perfil automaticamente
    const user = await currentUser();

    const { data: newProfile, error } = await supabaseAdmin
      .from('profiles')
      .insert({
        clerk_id: userId,
        email: user?.emailAddresses[0]?.emailAddress || '',
        full_name: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || null,
        avatar_url: user?.imageUrl || null,
        subscription_tier: 'free',
        subscription_status: 'active',
        credits_remaining: 3,
        onboarding_completed: false,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Erro ao criar perfil:', error);
      throw new ApiError('Erro ao criar perfil', 500);
    }

    profile = newProfile;
  }

  return {
    userId,
    profileId: profile.id,
  };
}

/**
 * Verifica se usuario e admin
 */
export async function authorizeAdmin(userId: string): Promise<{ adminId: string; role: string }> {
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('clerk_id', userId)
    .single();

  if (!profile) {
    throw new ApiError('Perfil nao encontrado', 404);
  }

  const { data: adminUser } = await supabaseAdmin
    .from('admin_users')
    .select('id, role, is_active')
    .eq('user_id', profile.id)
    .single();

  if (!adminUser) {
    throw new ApiError('Acesso negado. Voce nao tem permissao de administrador.', 403);
  }

  if (!adminUser.is_active) {
    throw new ApiError('Sua conta de administrador esta desativada.', 403);
  }

  return {
    adminId: adminUser.id,
    role: adminUser.role,
  };
}

/**
 * Classe de erro para API
 */
export class ApiError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'ApiError';
  }
}

/**
 * Handler de erro para API Routes
 */
export function handleApiError(error: unknown): NextResponse {
  console.error('API Error:', error);

  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.statusCode }
    );
  }

  if (error instanceof Error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { error: 'Erro interno do servidor' },
    { status: 500 }
  );
}

/**
 * Wrapper para handlers de API que adiciona tratamento de erro
 */
export function withErrorHandler(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      return await handler(req);
    } catch (error) {
      return handleApiError(error);
    }
  };
}
