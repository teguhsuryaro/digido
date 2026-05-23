/**
 * Memformat angka ke format mata uang Rupiah (IDR)
 * Contoh: 15000 -> Rp 15.000
 */
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Memformat tanggal ke string yang mudah dibaca
 * Contoh: 2024-05-12 -> 12 Mei 2024
 */
export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));
}
