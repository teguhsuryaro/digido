import { LayoutDashboard } from 'lucide-react';

export default function SuperadminDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <LayoutDashboard className="text-red-500" size={28} />
        <h1 className="text-2xl font-bold text-content-primary">Dashboard Utama</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Placeholder Statistic Cards */}
        <div className="p-6 bg-surface-card rounded-2xl border border-border shadow-sm flex flex-col gap-2">
          <p className="text-sm font-medium text-content-secondary">Total Pengguna</p>
          <p className="text-3xl font-extrabold text-content-primary">-</p>
        </div>
        <div className="p-6 bg-surface-card rounded-2xl border border-border shadow-sm flex flex-col gap-2">
          <p className="text-sm font-medium text-content-secondary">Mitra Aktif</p>
          <p className="text-3xl font-extrabold text-content-primary">-</p>
        </div>
        <div className="p-6 bg-surface-card rounded-2xl border border-border shadow-sm flex flex-col gap-2">
          <p className="text-sm font-medium text-content-secondary">Laporan Terbuka</p>
          <p className="text-3xl font-extrabold text-red-500">-</p>
        </div>
      </div>

      <div className="p-6 bg-surface-card rounded-2xl border border-border shadow-sm mt-8">
        <p className="text-content-secondary text-center py-10">Data statistik belum tersedia. Akan diimplementasikan lebih lanjut.</p>
      </div>
    </div>
  );
}
