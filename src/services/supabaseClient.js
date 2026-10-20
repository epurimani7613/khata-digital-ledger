import { createClient } from '@supabase/supabase-js';

// Default project credentials baked in for zero-config multi-device sync
// These auto-fill so the app works on any device without manual setup
const DEFAULT_SUPABASE_URL = 'https://mnvhqghjvhxdfferjanm.supabase.co';
const DEFAULT_SUPABASE_KEY = 'sb_publishable_6x100XH8z2QvwAxYu2Az9w_Lt7l9s0e';

// Retrieve credentials from environment, localStorage, or built-in defaults
export const getSupabaseConfig = () => {
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  const customUrl = localStorage.getItem('khata_supabase_url');
  const customKey = localStorage.getItem('khata_supabase_key');

  let cleanUrl = (customUrl && customUrl.trim()) || (envUrl && envUrl.trim()) || DEFAULT_SUPABASE_URL;
  if (cleanUrl) {
    try {
      const parsed = new URL(cleanUrl);
      cleanUrl = parsed.origin; // Extracts https://mnvhqghjvhxdfferjanm.supabase.co
    } catch {
      cleanUrl = cleanUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
    }
  }

  const supabaseKey = (customKey && customKey.trim()) || (envKey && envKey.trim()) || DEFAULT_SUPABASE_KEY;

  const isConfigured = Boolean(
    cleanUrl && 
    supabaseKey && 
    cleanUrl.startsWith('https://') &&
    !cleanUrl.includes('your-supabase-project')
  );

  return { supabaseUrl: cleanUrl, supabaseKey, isConfigured };
};

let clientInstance = null;
let lastUrl = null;
let lastKey = null;

export const getSupabase = () => {
  const { supabaseUrl, supabaseKey, isConfigured } = getSupabaseConfig();

  if (!isConfigured) {
    return null;
  }

  if (clientInstance && lastUrl === supabaseUrl && lastKey === supabaseKey) {
    return clientInstance;
  }

  try {
    clientInstance = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });
    lastUrl = supabaseUrl;
    lastKey = supabaseKey;
    return clientInstance;
  } catch (err) {
    console.warn('Failed to initialize Supabase client:', err);
    return null;
  }
};
