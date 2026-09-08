import { createClient } from '@supabase/supabase-js';

// Access Vite environment variables safely in browser and node
const supabaseUrl = 
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || 
  'https://zhjixbqefnqwninqxbqd.supabase.co';

// Project's verified publishable key.
// STRICT SECURITY MANDATE:
// In Supabase, keys starting with 'sb_secret_' are SECRET server-only keys.
// Using 'sb_secret_' in browser code causes Supabase to throw:
// "Forbidden use of secret API key in browser"
// The client/browser MUST strictly use the publishable key ('sb_publishable_' or JWT 'eyJ...').
const KNOWN_PUBLISHABLE_KEY = 'sb_publishable_iaBQ513XFuMjofZtkIFOpg_2TygfPAz';

function resolveClientKey(): string {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    const pubKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    if (pubKey && !pubKey.startsWith('sb_secret_')) {
      return pubKey;
    }
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (anonKey && !anonKey.startsWith('sb_secret_')) {
      return anonKey;
    }
  }
  return KNOWN_PUBLISHABLE_KEY;
}

const supabaseAnonKey = resolveClientKey();

/**
 * Primary Supabase Client instance
 * Configured with environment variables VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (publishable key)
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export const SUPABASE_URL = supabaseUrl;
export const SUPABASE_ANON_KEY = supabaseAnonKey;

