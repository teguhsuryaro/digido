import { useEffect, useState } from 'react';
import { Users, CheckCircle, XCircle, ChevronLeft, ChevronRight, MapPin, Store, HelpCircle, Image as ImageIcon, Wallet } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/Toast';
import Button from '@/components/ui/Button';
import PageTransition from '@/components/ui/PageTransition';

export default function SuperadminMitraApproval() {
  const [pendingUmkm, setPendingUmkm] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Detail State
  const [selectedUmkm, setSelectedUmkm] = useState<any | null>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [faqs, setFaqs] = useState<any[]>([]);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    try {
      setIsLoading(true);
      const { data: umkmData, error } = await supabase
        .from('umkm')
        .select('*')
        .eq('approval_status', 'pending')
        .eq('is_active', false);
        
      if (error && error.code !== 'PGRST116') throw error;
      
      const umkms: any[] = umkmData || [];
      
      // Fetch profiles manually
      if (umkms.length > 0) {
        const ownerIds = umkms.map(u => u.owner_id);
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', ownerIds);
          
        umkms.forEach(u => {
          u.profiles = (profilesData as any[])?.find(p => p.id === u.owner_id);
        });
      }
      
      setPendingUmkm(umkms);
    } catch (err) {
      console.error('Fetch pending umkm error:', err);
      toast.error('Gagal mengambil data pengajuan mitra');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetail = async (umkm: any) => {
    setSelectedUmkm(umkm);
    setIsDetailLoading(true);
    try {
      const [docsRes, faqsRes] = await Promise.all([
        supabase.from('umkm_documents').select('*').eq('umkm_id', umkm.id),
        supabase.from('umkm_faq').select('*').eq('umkm_id', umkm.id).order('sort_order', { ascending: true })
      ]);
      
      setDocuments(docsRes.data || []);
      setFaqs(faqsRes.data || []);
    } catch (err) {
      console.error('Fetch detail error:', err);
      toast.error('Gagal memuat detail kelengkapan data.');
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleBackToList = () => {
    setSelectedUmkm(null);
    setDocuments([]);
    setFaqs([]);
  };

  const handleApprove = async () => {
    if (!selectedUmkm) return;
    if (!window.confirm('Yakin ingin menyetujui pendaftaran mitra ini?')) return;
    
    setIsSubmitting(true);
    try {
      // 1. Update UMKM status and is_active
      await supabase.from('umkm').update({ approval_status: 'approved', is_active: true } as any).eq('id', selectedUmkm.id);
      // 2. Update Profile role
      await supabase.from('profiles').update({ role: 'mitra' } as any).eq('id', selectedUmkm.owner_id);
      
      toast.success('Mitra berhasil disetujui');
      handleBackToList();
      fetchPending();
    } catch (err) {
      toast.error('Gagal menyetujui mitra');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!selectedUmkm) return;
    const reason = window.prompt('Peringatan: Menolak akan MENGHAPUS seluruh data pengajuan ini agar pendaftar dapat mengajukan ulang. \nKetik "YA" untuk membatalkan pengajuan ini:');
    if (reason?.toUpperCase() !== 'YA') return; // cancelled
    
    setIsSubmitting(true);
    try {
      // Hapus data secara tuntas agar pendaftar bisa daftar ulang
      await supabase.from('umkm_documents').delete().eq('umkm_id', selectedUmkm.id);
      await supabase.from('umkm_faq').delete().eq('umkm_id', selectedUmkm.id);
      await supabase.from('umkm').delete().eq('id', selectedUmkm.id);
      
      toast.success('Pengajuan ditolak dan data dihapus');
      handleBackToList();
      fetchPending();
    } catch (err) {
      console.error('Reject error:', err);
      toast.error('Gagal menolak mitra');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderDetailView = () => {
    if (!selectedUmkm) return null;

    return (
      <PageTransition>
        <div className="space-y-6">
          <button 
            onClick={handleBackToList}
            className="flex items-center text-sm font-bold uppercase tracking-widest text-content-secondary hover:text-primary-500 transition-colors"
          >
            <ChevronLeft size={16} className="mr-1" /> Kembali ke Daftar
          </button>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-2">
            <div className="w-16 h-16 rounded-2xl bg-primary-50 text-primary-500 flex items-center justify-center overflow-hidden shrink-0 border border-primary-100 shadow-sm">
              {selectedUmkm.photo_url ? (
                <img src={selectedUmkm.photo_url} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <Store size={32} />
              )}
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-content-primary leading-tight">{selectedUmkm.name}</h1>
              <p className="text-content-secondary text-sm mt-1">
                Pengajuan oleh: <strong className="text-content-primary">{selectedUmkm.profiles?.full_name || 'Tidak diketahui'}</strong>
              </p>
            </div>
          </div>

          {isDetailLoading ? (
            <div className="p-12 flex justify-center"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {/* Kolom Kiri: Informasi UMKM */}
              <div className="space-y-6">
                <div className="bg-surface-card rounded-2xl border border-border p-5 shadow-sm space-y-4">
                  <h3 className="font-bold flex items-center gap-2 text-content-primary border-b border-border/50 pb-3">
                    <Store size={18} className="text-primary-500" /> Informasi Toko
                  </h3>
                  <div className="space-y-4 text-sm">
                    <div>
                      <span className="text-content-placeholder text-[10px] uppercase font-bold tracking-widest block mb-1">Jenis Usaha</span>
                      <p className="font-medium text-content-primary">{selectedUmkm.business_type}</p>
                    </div>
                    <div>
                      <span className="text-content-placeholder text-[10px] uppercase font-bold tracking-widest block mb-1">WhatsApp</span>
                      <p className="font-medium text-content-primary">{selectedUmkm.whatsapp_number || '-'}</p>
                    </div>
                    <div>
                      <span className="text-content-placeholder text-[10px] uppercase font-bold tracking-widest block mb-1">Deskripsi</span>
                      <p className="text-content-secondary leading-relaxed bg-surface-secondary/50 p-3 rounded-xl border border-border/50">{selectedUmkm.description}</p>
                    </div>
                    <div>
                      <span className="text-content-placeholder text-[10px] uppercase font-bold tracking-widest block mb-1">Lokasi Koordinat</span>
                      <p className="font-medium text-content-primary flex items-center gap-1.5 bg-surface-secondary p-2 rounded-lg w-max">
                        <MapPin size={14} className="text-red-500"/> {selectedUmkm.latitude}, {selectedUmkm.longitude}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-surface-card rounded-2xl border border-border p-5 shadow-sm space-y-4">
                  <h3 className="font-bold flex items-center gap-2 text-content-primary border-b border-border/50 pb-3">
                    <Wallet size={18} className="text-primary-500" /> Keuangan & Pencairan
                  </h3>
                  <div className="space-y-4 text-sm">
                    <div>
                      <span className="text-content-placeholder text-[10px] uppercase font-bold tracking-widest block mb-1">Metode Pencairan</span>
                      <p className="font-black text-primary-600 uppercase tracking-wider">{selectedUmkm.withdrawal_method}</p>
                    </div>
                    {selectedUmkm.withdrawal_method !== 'qris' && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-content-placeholder text-[10px] uppercase font-bold tracking-widest block mb-1">Provider</span>
                          <p className="font-bold text-content-primary uppercase">{selectedUmkm.withdrawal_provider}</p>
                        </div>
                        <div>
                          <span className="text-content-placeholder text-[10px] uppercase font-bold tracking-widest block mb-1">Nomor Akun/Rekening</span>
                          <p className="font-mono bg-surface-secondary px-2 py-1 rounded w-max">{selectedUmkm.withdrawal_account}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Kolom Kanan: Dokumen & FAQ */}
              <div className="space-y-6">
                <div className="bg-surface-card rounded-2xl border border-border p-5 shadow-sm space-y-4">
                  <h3 className="font-bold flex items-center gap-2 text-content-primary border-b border-border/50 pb-3">
                    <ImageIcon size={18} className="text-primary-500" /> Dokumen Pendukung
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {documents.map(doc => (
                      <div key={doc.id} className="space-y-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-content-secondary px-1">
                          {doc.document_type === 'ktp' ? 'KTP' : 
                           doc.document_type === 'business_photo' ? 'Foto Tempat Usaha' : 
                           doc.document_type === 'qris' ? 'QRIS' : doc.document_type}
                        </span>
                        <a href={doc.file_url} target="_blank" rel="noreferrer" className="block rounded-xl overflow-hidden border border-border aspect-video group relative bg-surface-secondary">
                          <img src={doc.file_url} alt={doc.document_type} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold tracking-widest uppercase">
                            Lihat Penuh
                          </div>
                        </a>
                      </div>
                    ))}
                    {selectedUmkm.photo_url && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-content-secondary px-1">Profil Toko</span>
                        <a href={selectedUmkm.photo_url} target="_blank" rel="noreferrer" className="block rounded-xl overflow-hidden border border-border aspect-video group relative bg-surface-secondary">
                          <img src={selectedUmkm.photo_url} alt="Profile" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold tracking-widest uppercase">
                            Lihat Penuh
                          </div>
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-surface-card rounded-2xl border border-border p-5 shadow-sm space-y-4">
                  <h3 className="font-bold flex items-center gap-2 text-content-primary border-b border-border/50 pb-3">
                    <HelpCircle size={18} className="text-primary-500" /> Konfigurasi Chatbot FAQ
                  </h3>
                  <div className="space-y-3">
                    {faqs.length > 0 ? faqs.map((faq) => (
                      <div key={faq.id} className="bg-surface-secondary rounded-xl p-3 sm:p-4 text-sm border border-border/50">
                        <p className="font-bold text-primary-600 mb-1 flex gap-2"><span className="opacity-50">Q:</span> <span>{faq.question}</span></p>
                        <p className="text-content-secondary flex gap-2"><span className="opacity-50 font-bold">A:</span> <span>{faq.answer}</span></p>
                      </div>
                    )) : (
                      <p className="text-sm text-content-placeholder italic text-center py-4 bg-surface-secondary rounded-xl">Belum ada FAQ yang diatur.</p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Actions Footer */}
              <div className="lg:col-span-2 bg-surface-secondary/50 p-6 rounded-2xl border border-border shadow-inner mt-4 flex flex-col sm:flex-row items-center gap-4 justify-between">
                <div className="text-center sm:text-left w-full sm:w-auto mb-2 sm:mb-0">
                  <h4 className="font-bold text-content-primary">Keputusan Pendaftaran</h4>
                  <p className="text-[10px] text-content-secondary uppercase tracking-widest mt-1">Pastikan dokumen sesuai standar</p>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                  <Button variant="secondary" onClick={handleReject} isLoading={isSubmitting} disabled={isSubmitting} className="w-full sm:w-auto border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 bg-white dark:bg-red-950/20">
                    <XCircle size={18} className="mr-2" /> Tolak & Hapus
                  </Button>
                  <Button variant="primary" onClick={handleApprove} isLoading={isSubmitting} disabled={isSubmitting} className="w-full sm:w-auto shadow-lg shadow-primary-500/30">
                    <CheckCircle size={18} className="mr-2" /> Setujui Mitra
                  </Button>
                </div>
              </div>

            </div>
          )}
        </div>
      </PageTransition>
    );
  };

  const renderListView = () => (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <Users className="text-primary-500" size={28} />
          <div>
            <h1 className="text-2xl font-black text-content-primary">Validasi Mitra</h1>
            <p className="text-content-secondary text-sm">Tinjau pengajuan pendaftaran mitra baru</p>
          </div>
        </div>

        <div className="bg-surface-card rounded-2xl border border-border overflow-hidden shadow-sm">
          <div className="p-4 sm:p-5 border-b border-border bg-surface-secondary/50 flex flex-wrap justify-between items-center gap-3">
            <h2 className="font-bold text-content-primary">Daftar Menunggu Validasi</h2>
            <span className="bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 text-[10px] font-black tracking-widest uppercase px-3 py-1.5 rounded-full border border-primary-200 dark:border-primary-800">
              {pendingUmkm.length} Pengajuan
            </span>
          </div>
          
          {isLoading ? (
            <div className="p-16 flex flex-col items-center justify-center space-y-4">
              <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-content-placeholder font-bold uppercase tracking-widest">Memuat Data...</p>
            </div>
          ) : pendingUmkm.length === 0 ? (
            <div className="py-24 flex flex-col items-center justify-center text-center px-4">
              <div className="w-20 h-20 bg-green-50 dark:bg-green-950/30 rounded-full flex items-center justify-center mb-5 border border-green-100 dark:border-green-900/50">
                <CheckCircle size={36} className="text-green-500" />
              </div>
              <h3 className="text-xl font-black text-content-primary mb-2">Semua Telah Divalidasi</h3>
              <p className="text-content-secondary max-w-sm text-sm">
                Belum ada data pengajuan mitra baru yang perlu divalidasi saat ini. Kerja bagus!
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {pendingUmkm.map((umkm) => (
                <div 
                  key={umkm.id} 
                  onClick={() => handleViewDetail(umkm)}
                  className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-primary-50/50 dark:hover:bg-primary-950/10 cursor-pointer transition-all group"
                >
                  <div className="flex items-center gap-4 min-w-0 w-full sm:w-auto">
                    <div className="w-14 h-14 rounded-full bg-surface-secondary text-primary-500 border border-border flex items-center justify-center shrink-0 shadow-sm overflow-hidden group-hover:border-primary-200 transition-colors">
                      {umkm.photo_url ? (
                        <img src={umkm.photo_url} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        <Store size={24} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm sm:text-base font-bold text-content-primary truncate leading-tight">
                        {umkm.profiles?.full_name || 'Tanpa Nama'} <span className="font-medium text-content-secondary text-xs sm:text-sm">mendaftar sebagai</span> <span className="text-primary-600 dark:text-primary-400">{umkm.name}</span>
                      </h3>
                      <div className="flex items-center gap-3 mt-2 text-[10px] sm:text-xs font-medium text-content-secondary flex-wrap">
                        <span className="flex items-center gap-1.5 bg-surface-secondary px-2 py-1 rounded-md"><Store size={12} className="text-primary-500"/> {umkm.business_type}</span>
                        <span className="flex items-center gap-1.5 bg-surface-secondary px-2 py-1 rounded-md"><Wallet size={12} className="text-green-500"/> {umkm.withdrawal_method.toUpperCase()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0 w-full sm:w-auto">
                    <div className="text-primary-500 bg-primary-50 dark:bg-primary-900/20 group-hover:bg-primary-500 group-hover:text-white border border-primary-100 dark:border-primary-900/50 transition-all flex items-center justify-center sm:justify-start gap-1 text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-xl">
                      Buka Detail <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );

  return selectedUmkm ? renderDetailView() : renderListView();
}
