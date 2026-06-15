import { useEffect, useRef } from 'react';

/**
 * Hook yang menjalankan callback saat browser tab kembali fokus.
 * Memiliki cooldown agar tidak terlalu sering re-fetch.
 * 
 * @param callback - Fungsi yang akan dipanggil saat tab kembali fokus
 * @param options - Opsi konfigurasi
 * @param options.enabled - Apakah hook aktif (default: true)
 * @param options.cooldownMs - Minimum interval antar refetch (default: 30000ms / 30 detik)
 * 
 * @example
 * ```tsx
 * useRefetchOnFocus(fetchData, { enabled: !!user });
 * ```
 */
export function useRefetchOnFocus(
  callback: () => void | Promise<void>,
  options?: { enabled?: boolean; cooldownMs?: number }
) {
  const { enabled = true, cooldownMs = 30000 } = options || {};
  const lastFetchRef = useRef<number>(Date.now());
  const callbackRef = useRef(callback);

  // Selalu update ref agar tidak perlu callback di dependency array
  callbackRef.current = callback;

  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible') return;

      const now = Date.now();
      const elapsed = now - lastFetchRef.current;

      if (elapsed < cooldownMs) {
        // Cooldown belum habis, skip
        console.log(`[RefetchOnFocus] Cooldown aktif, ${Math.ceil((cooldownMs - elapsed) / 1000)}s tersisa`);
        return;
      }

      lastFetchRef.current = now;
      console.log('[RefetchOnFocus] Tab kembali fokus, refetch data...');
      callbackRef.current();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [enabled, cooldownMs]);
}
