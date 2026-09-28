import 'expo-sqlite/localStorage/install';
import 'react-native-url-polyfill/auto';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

let client: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabasePublishableKey);
}

export function getSupabase(): SupabaseClient {
  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error('Falta la configuración local de Supabase.');
  }
  if (!client) {
    client = createClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        storage: localStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        flowType: 'pkce',
      },
    });
  }
  return client;
}

export function supabasePublishableHeaders(): { url: string; key: string } {
  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error('Falta la configuración local de Supabase.');
  }
  return { url: supabaseUrl, key: supabasePublishableKey };
}
