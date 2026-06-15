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
  global: {
    // MEMATIKAN KONEKSI HANTU (DORMANT SOCKET)
    // Timeout 15 detik agar token refresh/db query tidak nyangkut selamanya.
    fetch: async (url, options) => {
      const urlStr = typeof url === 'string' ? url : url instanceof URL ? url.toString() : url.url;
      const isStorageUpload = urlStr?.includes('/storage/v1/object/') && 
                              (options?.method === 'POST' || options?.method === 'PUT');
      
      // Jangan limit timeout untuk upload file/storage
      if (isStorageUpload) {
        return fetch(url, options);
      }

      const controller = new AbortController();
      if (options?.signal) {
        options.signal.addEventListener('abort', () => controller.abort());
      }
      
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        return response;
      } catch (err: any) {
        if (err.name === 'AbortError') {
          // Wajib menggunakan TypeError('Failed to fetch') agar Supabase mengenalinya
          // sebagai gangguan jaringan (network error) biasa, bukan token error.
          // Ini mencegah Supabase me-logout user secara tidak adil.
          throw new TypeError('Failed to fetch');
        }
        throw err;
      } finally {
        clearTimeout(timeoutId);
      }
    }
  }
});
