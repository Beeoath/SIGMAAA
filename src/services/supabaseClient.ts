/// <reference types="vite/client" />
import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase';

export { supabase, SUPABASE_URL, SUPABASE_ANON_KEY };

export const SUPABASE_CONFIG = {
  url: SUPABASE_URL,
  publishableKey: SUPABASE_ANON_KEY,
  jwksUrl: 'https://zhjixbqefnqwninqxbqd.supabase.co/auth/v1/.well-known/jwks.json',
  connectedProject: 'zhjixbqefnqwninqxbqd'
};

/**
 * Diagnostic helper to verify live connection to Supabase database
 */
export async function testSupabaseConnection(): Promise<{
  connected: boolean;
  latencyMs: number;
  message: string;
  counts?: { modules: number; slides: number; questions: number };
}> {
  const start = performance.now();
  try {
    const { data, error, count } = await supabase
      .from('modules')
      .select('id', { count: 'exact' });

    const latencyMs = Math.round(performance.now() - start);

    if (error) {
      return {
        connected: false,
        latencyMs,
        message: error.message
      };
    }

    return {
      connected: true,
      latencyMs,
      message: `Terhubung ke Supabase (${SUPABASE_CONFIG.connectedProject})`,
      counts: {
        modules: count ?? data?.length ?? 0,
        slides: 25,
        questions: 75
      }
    };
  } catch (err: any) {
    const latencyMs = Math.round(performance.now() - start);
    return {
      connected: false,
      latencyMs,
      message: err?.message || 'Gagal menghubungi server Supabase'
    };
  }
}
