import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/server/supabase-admin';

/**
 * GET /api/health - Health check endpoint
 */
export async function GET() {
  try {
    // Check Supabase connection
    const { error } = await supabaseAdmin.from('profiles').select('id').limit(1);

    if (error) {
      return NextResponse.json({
        status: 'unhealthy',
        database: 'error',
        error: error.message,
        timestamp: new Date().toISOString(),
      }, { status: 503 });
    }

    return NextResponse.json({
      status: 'healthy',
      database: 'connected',
      version: '2.0.0',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 503 });
  }
}
