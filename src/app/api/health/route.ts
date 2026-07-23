import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/portal/supabase-server';

export async function GET() {
  let supabaseStatus: 'ok' | 'error' = 'ok';

  try {
    const { error } = await supabaseAdmin.from('courses').select('id').limit(1);
    if (error) {
      console.error('Health Check - Supabase query error:', error);
      supabaseStatus = 'error';
    }
  } catch (err) {
    console.error('Health Check - Supabase connection exception:', err);
    supabaseStatus = 'error';
  }

  const isOk = supabaseStatus === 'ok';

  return NextResponse.json(
    {
      status: isOk ? 'ok' : 'error',
      supabase: supabaseStatus,
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    },
    { status: isOk ? 200 : 503 }
  );
}
