import { AlertTriangle } from 'lucide-react';

export default function SuperadminReports() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <AlertTriangle className="text-red-500" size={28} />
        <h1 className="text-2xl font-bold text-content-primary">Laporan Masuk</h1>
      </div>

      <div className="bg-surface-card rounded-2xl border border-border overflow-hidden shadow-sm">
        <div className="p-4 border-b border-border bg-surface-secondary/50 flex justify-between items-center">
          <h2 className="font-semibold text-content-primary">Daftar Laporan Pengguna</h2>
        </div>
        <div className="p-8 text-center">
          <p className="text-content-secondary">Belum ada laporan masuk dari pengguna.</p>
        </div>
      </div>
    </div>
  );
}
