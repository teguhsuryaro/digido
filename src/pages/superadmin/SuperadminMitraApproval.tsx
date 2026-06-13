import { useEffect, useState } from 'react';
import { Users, CheckCircle, XCircle, FileText, ExternalLink } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/Toast';
import Button from '@/components/ui/Button';

export default function SuperadminMitraApproval() {
  const [pendingUmkm, setPendingUmkm] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('umkm')
        .select(`
          *,
          profiles:owner_id ( full_name, email, phone )
        `)
        .eq('approval_status', 'pending');
        
      if (error) throw error;
      setPendingUmkm(data || []);
    } catch (err) {
      toast.error('Gagal mengambil data pengajuan mitra');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (umkmId: string, ownerId: string) => {
    if (!window.confirm('Yakin ingin menyetujui pendaftaran mitra ini?')) return;
    
    try {
      // 1. Update UMKM status and is_active
      await supabase.from('umkm').update({ approval_status: 'approved', is_active: true } as any).eq('id', umkmId);
      // 2. Update Profile role
      await supabase.from('profiles').update({ role: 'mitra' } as any).eq('id', ownerId);
      
      toast.success('Mitra berhasil disetujui');
      fetchPending();
    } catch (err) {
      toast.error('Gagal menyetujui mitra');
    }
  };

  const handleReject = async (umkmId: string) => {
    const reason = window.prompt('Masukkan alasan penolakan (opsional):');
    if (reason === null) return; // cancelled
    
    try {
      await supabase.from('umkm').update({ approval_status: 'rejected', rejection_reason: reason || 'Tidak memenuhi syarat' } as any).eq('id', umkmId);
      toast.success('Mitra berhasil ditolak');
      fetchPending();
    } catch (err) {
      toast.error('Gagal menolak mitra');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Users className="text-red-500" size={28} />
        <h1 className="text-2xl font-bold text-content-primary">Validasi Pendaftaran Mitra</h1>
      </div>

      <div className="bg-surface-card rounded-2xl border border-border overflow-hidden shadow-sm">
        <div className="p-4 border-b border-border bg-surface-secondary/50">
          <h2 className="font-semibold text-content-primary">Daftar Pengajuan Mitra</h2>
        </div>
        
        {isLoading ? (
          <div className="p-8 text-center text-content-secondary">Memuat data...</div>
        ) : pendingUmkm.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-content-secondary">Belum ada data pengajuan mitra yang perlu divalidasi saat ini.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {pendingUmkm.map((umkm) => (
              <div key={umkm.id} className="p-4 sm:p-6 flex flex-col lg:flex-row gap-6">
                <div className="flex-1 space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-content-primary">{umkm.name}</h3>
                    <p className="text-sm text-content-secondary">{umkm.business_type} • {umkm.whatsapp_number}</p>
                  </div>
                  
                  <div className="bg-surface-secondary p-4 rounded-card text-sm space-y-2">
                    <p><strong>Pemilik:</strong> {umkm.profiles?.full_name}</p>
                    <p><strong>Email:</strong> {umkm.profiles?.email}</p>
                    <p><strong>Pencairan:</strong> {umkm.withdrawal_method?.toUpperCase()} {umkm.withdrawal_provider ? `(${umkm.withdrawal_provider})` : ''}</p>
                  </div>
                  
                  <div>
                    <p className="text-xs font-bold text-content-secondary mb-2">DOKUMEN:</p>
                    <div className="flex flex-wrap gap-2">
                      <a href={umkm.photo_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors">
                        <FileText size={14} /> Foto Toko <ExternalLink size={12} />
                      </a>
                      <span className="text-xs text-content-placeholder italic ml-2">(Buka dokumen pendukung dari dashboard Supabase)</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-row lg:flex-col gap-2 shrink-0 justify-center">
                  <Button variant="primary" onClick={() => handleApprove(umkm.id, umkm.owner_id)} className="flex-1 lg:flex-none justify-center">
                    <CheckCircle size={18} className="mr-2" /> Terima
                  </Button>
                  <Button variant="secondary" onClick={() => handleReject(umkm.id)} className="flex-1 lg:flex-none justify-center border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700">
                    <XCircle size={18} className="mr-2" /> Tolak
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
