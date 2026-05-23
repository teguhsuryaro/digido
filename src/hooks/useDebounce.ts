import { useState, useEffect } from 'react';

/**
 * Hook untuk mendebounce nilai (biasanya input teks)
 * @param value Nilai yang akan didebounce
 * @param delay Jeda waktu dalam milidetik
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
