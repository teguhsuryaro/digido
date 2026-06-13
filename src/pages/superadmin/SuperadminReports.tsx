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
  target_name?: string;
  profiles: {
    full_name: string;
    email: string;
  };
}

export default function SuperadminReports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'toko' | 'website'>('all');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setIsLoading(true);
      const { data, error } = (await supabase
        .from('reports')
        .select(`
          *,
          profiles:reporter_id (full_name)
        `)
        .order('created_at', { ascending: false })) as any;

      if (error) throw error;
      
      const reportsData = data || [];
      
      // Ambil nama target untuk UMKM dan Produk
      const umkmIds = reportsData.filter((r: any) => r.target_type === 'umkm').map((r: any) => r.target_id);
      const productIds = reportsData.filter((r: any) => r.target_type === 'product').map((r: any) => r.target_id);
      
      const umkmMap = new Map();
      const productMap = new Map();
      
      if (umkmIds.length > 0) {
        const { data: umkmData } = await supabase.from('umkm').select('id, store_name').in('id', umkmIds);
        (umkmData as any[])?.forEach(u => umkmMap.set(u.id, u.store_name));
      }
      
      if (productIds.length > 0) {
        const { data: prodData } = await supabase.from('products').select('id, name').in('id', productIds);
        (prodData as any[])?.forEach(p => productMap.set(p.id, p.name));
      }
      
      const finalReports = reportsData.map((r: any) => {
        let targetName = '-';
        if (r.target_type === 'umkm') targetName = umkmMap.get(r.target_id) || 'Toko Tidak Ditemukan';
        if (r.target_type === 'product') targetName = productMap.get(r.target_id) || 'Produk Tidak Ditemukan';
        if (r.target_type === 'website') targetName = 'Website Digido';
        
        return { ...r, target_name: targetName };
      });

      setReports(finalReports);
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

  const filteredReports = reports.filter(r => {
    if (filterType === 'all') return true;
    if (filterType === 'website') return r.target_type === 'website';
    return r.target_type === 'umkm' || r.target_type === 'product';
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <AlertTriangle className="text-red-500" size={28} />
        <h1 className="text-2xl font-bold text-content-primary">Laporan Masuk</h1>
      </div>

      <div className="bg-surface-card rounded-2xl border border-border overflow-hidden shadow-sm">
        <div className="p-4 border-b border-border bg-surface-secondary/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex bg-surface-primary p-1 rounded-xl w-fit border border-border">
            <button
              onClick={() => setFilterType('all')}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                filterType === 'all' ? 'bg-surface-card text-red-500 shadow-sm' : 'text-content-secondary hover:text-content-primary'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setFilterType('toko')}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                filterType === 'toko' ? 'bg-surface-card text-red-500 shadow-sm' : 'text-content-secondary hover:text-content-primary'
              }`}
            >
              Laporan Toko/Produk
            </button>
            <button
              onClick={() => setFilterType('website')}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                filterType === 'website' ? 'bg-surface-card text-red-500 shadow-sm' : 'text-content-secondary hover:text-content-primary'
              }`}
            >
              Laporan Website
            </button>
          </div>
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
        ) : filteredReports.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <CheckCircle size={48} className="text-green-500 mb-4 opacity-80" />
            <h3 className="text-lg font-bold text-content-primary">
              {filterType === 'website' ? 'Tidak Ada Kendala Website!' : filterType === 'toko' ? 'Toko & Produk Aman!' : 'Semua Aman!'}
            </h3>
            <p className="text-content-secondary mt-1">Belum ada laporan masuk di kategori ini.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredReports.map((report) => (
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
                  {report.target_type !== 'website' && report.target_type !== 'user' && report.target_name && (
                    <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">Target: {report.target_name}</p>
                  )}
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
