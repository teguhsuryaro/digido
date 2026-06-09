import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/Toast';
import Skeleton from '@/components/ui/Skeleton';
import Button from '@/components/ui/Button';

interface Report {
  id: string;
  target_type: string;
  target_id: string;
  reason: string;
  status: string;
  created_at: string;
  profiles: {
    full_name: string;
    email: string;
  };
}

export default function SuperadminReports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('reports')
        .select(`
          *,
          profiles:reporter_id (full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (err) {
      console.error('Error fetching reports:', err);
      toast.error('Gagal mengambil data laporan.');
    } finally {
      setIsLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('reports')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      toast.success('Status laporan diperbarui');
      setReports(reports.map(r => r.id === id ? { ...r, status: newStatus } : r));
    } catch (err) {
      console.error('Error updating status:', err);
      toast.error('Gagal memperbarui status laporan.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <AlertTriangle className="text-red-500" size={28} />
        <h1 className="text-2xl font-bold text-content-primary">Laporan Masuk</h1>
      </div>

      <div className="bg-surface-card rounded-2xl border border-border overflow-hidden shadow-sm">
        <div className="p-4 border-b border-border bg-surface-secondary/50 flex justify-between items-center">
          <h2 className="font-semibold text-content-primary">Daftar Laporan Pengguna</h2>
          <Button variant="outline" size="sm" onClick={fetchReports} disabled={isLoading}>
            Refresh
          </Button>
        </div>

        {isLoading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-16 w-full rounded-card" />
            <Skeleton className="h-16 w-full rounded-card" />
            <Skeleton className="h-16 w-full rounded-card" />
          </div>
        ) : reports.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <CheckCircle size={48} className="text-green-500 mb-4 opacity-80" />
            <h3 className="text-lg font-bold text-content-primary">Semua Aman!</h3>
            <p className="text-content-secondary mt-1">Belum ada laporan masuk dari pengguna.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {reports.map((report) => (
              <div key={report.id} className="p-4 hover:bg-surface-secondary/30 transition-colors flex flex-col md:flex-row gap-4 justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      report.status === 'open' ? 'bg-red-100 text-red-600' : 
                      report.status === 'reviewed' ? 'bg-yellow-100 text-yellow-600' : 
                      'bg-green-100 text-green-600'
                    }`}>
                      {report.status}
                    </span>
                    <span className="text-xs text-content-secondary flex items-center gap-1">
                      <Clock size={12} />
                      {new Date(report.created_at).toLocaleDateString('id-ID')}
                    </span>
                  </div>
                  <h3 className="font-bold text-content-primary text-sm mt-2">
                    Laporan: {report.target_type.toUpperCase()}
                  </h3>
                  <p className="text-content-secondary text-sm mt-1 mb-2 bg-surface-secondary p-3 rounded-button italic border border-border/50">
                    "{report.reason}"
                  </p>
                  <p className="text-xs text-content-placeholder">
                    Pelapor: <span className="font-medium text-content-secondary">{report.profiles?.full_name || 'User'}</span>
                  </p>
                </div>
                
                <div className="flex flex-row md:flex-col gap-2 shrink-0 justify-end md:justify-start">
                  {report.status === 'open' && (
                    <Button size="sm" variant="secondary" onClick={() => updateStatus(report.id, 'reviewed')}>
                      Tandai Diulas
                    </Button>
                  )}
                  {report.status !== 'resolved' && (
                    <Button size="sm" className="bg-green-500 text-white hover:bg-green-600 border-transparent" onClick={() => updateStatus(report.id, 'resolved')}>
                      Tandai Selesai
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
