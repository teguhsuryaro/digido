import { formatRupiah } from '@/utils/format';

export default function QRISDisplay({ total }: { total: number }) {
  return (
    <div className="flex flex-col items-center gap-3 p-6 bg-white dark:bg-neutral-900 rounded-card border border-border shadow-sm">
      <p className="text-sm font-medium text-content-secondary">Scan QRIS untuk Membayar</p>
      
      {/* Placeholder QR — di production akan diganti QRIS asli */}
      <div className="w-48 h-48 bg-neutral-100 dark:bg-neutral-800 rounded-lg flex items-center justify-center border-2 border-dashed border-neutral-300 relative">
        <span className="text-4xl">📱</span>
        <div className="absolute inset-0 bg-gradient-to-tr from-primary-500/10 to-transparent opacity-50" />
      </div>
      
      <p className="text-xl font-extrabold text-content-primary">
        {formatRupiah(total)}
      </p>
      
      <div className="flex flex-col items-center text-center gap-1">
        <p className="text-[10px] text-content-secondary uppercase tracking-widest font-bold">
          Metode: QRIS Dinamis
        </p>
        <p className="text-xs text-content-secondary italic">
          (Prototype Mode: Tekan tombol di bawah untuk mengonfirmasi)
        </p>
      </div>
    </div>
  );
}
