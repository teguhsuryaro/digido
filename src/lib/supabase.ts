import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase URL atau Anon Key belum dikonfigurasi! ' +
    'Pastikan file .env berisi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY.'
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,       // Otomatis refresh token sebelum expire
    persistSession: true,         // Simpan session di localStorage
    detectSessionInUrl: true,     // Untuk OAuth callback (jika nanti dipakai)
    storageKey: 'digido-auth',    // Key spesifik agar tidak bentrok
    // MEMATIKAN FITUR WEB LOCK SUPABASE UNTUK MENCEGAH BUG HANG DI BROWSER
    // @ts-ignore - Supabase versions have different lock signatures
    lock: async (...args: any[]) => {
      // Bypass API navigator.locks secara utuh. Eksekusi callback secara langsung.
      const acquire = args.find(arg => typeof arg === 'function');
      if (acquire) return await acquire();
    }
  },
});
