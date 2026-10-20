import { createClient } from '@supabase/supabase-js';

// Retrieve credentials from environment or runtime localStorage config
export const getSupabaseConfig = () => {
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  const customUrl = localStorage.getItem('khata_supabase_url');
  const customKey = localStorage.getItem('khata_supabase_key');

  const supabaseUrl = (customUrl && customUrl.trim()) || (envUrl && envUrl.trim());
  const supabaseKey = (customKey && customKey.trim()) || (envKey && envKey.trim());

  const isConfigured = Boolean(
    supabaseUrl && 
    supabaseKey && 
    supabaseUrl.startsWith('https://') &&
    !supabaseUrl.includes('your-supabase-project')
  );

  return { supabaseUrl, supabaseKey, isConfigured };
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
