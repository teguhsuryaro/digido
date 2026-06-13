import { useState, useEffect } from 'react';
import { X, Building2, Wallet as WalletIcon, QrCode } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/Toast';
import Button from '@/components/ui/Button';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  umkm: any;
  onSuccess: () => void;
}

export default function WithdrawalMethodModal({ isOpen, onClose, umkm, onSuccess }: Props) {
  const [method, setMethod] = useState<'qris' | 'ewallet' | 'bank'>('ewallet');
  const [provider, setProvider] = useState('');
  const [account, setAccount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && umkm) {
      setMethod(umkm.withdrawal_method || 'ewallet');
      setProvider(umkm.withdrawal_provider || '');
      setAccount(umkm.withdrawal_account || '');
    }
  }, [isOpen, umkm]);

  if (!isOpen) return null;

  const ewalletOptions = ['GoPay', 'OVO', 'DANA', 'ShopeePay', 'LinkAja'];
  const bankOptions = ['BCA', 'Mandiri', 'BNI', 'BRI', 'BSI', 'SeaBank', 'Bank Jago'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (method !== 'qris' && (!provider || !account)) {
      toast.error('Mohon lengkapi data pencairan dana.');
      return;
    }

    if (method === 'qris' && !account) {
       toast.error('Mohon masukkan URL/ID gambar QRIS Anda.');
       return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('umkm')
        .update({
          withdrawal_method: method,
          withdrawal_provider: method === 'qris' ? 'QRIS' : provider,
          withdrawal_account: account,
        })
        .eq('id', umkm.id);

      if (error) throw error;
      
      toast.success('Metode pencairan berhasil diperbarui.');
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error('Gagal memperbarui metode pencairan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-surface-primary w-full max-w-md rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-border flex justify-between items-center bg-surface-secondary shrink-0">
          <h2 className="text-lg font-bold text-content-primary">Ubah Metode Pencairan</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-surface-hover text-content-secondary">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto p-6 scrollbar-hide">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <label className="text-sm font-bold text-content-primary">Metode Pencairan</label>
              <div className="grid grid-cols-1 gap-3">
                <button
                  type="button"
                  onClick={() => { setMethod('qris'); setProvider(''); setAccount(''); }}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-colors ${
                    method === 'qris' 
                      ? 'border-primary-500 bg-primary-500/5' 
                      : 'border-border hover:border-primary-500/30'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${method === 'qris' ? 'bg-primary-100 text-primary-600' : 'bg-surface-secondary text-content-secondary'}`}>
                    <QrCode size={20} />
                  </div>
                  <div>
                    <p className={`font-bold text-sm ${method === 'qris' ? 'text-primary-600' : 'text-content-primary'}`}>QRIS Toko</p>
                    <p className="text-[10px] text-content-secondary">Gratis Biaya Admin</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => { setMethod('ewallet'); setProvider(''); setAccount(''); }}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-colors ${
                    method === 'ewallet' 
                      ? 'border-primary-500 bg-primary-500/5' 
                      : 'border-border hover:border-primary-500/30'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${method === 'ewallet' ? 'bg-primary-100 text-primary-600' : 'bg-surface-secondary text-content-secondary'}`}>
                    <WalletIcon size={20} />
                  </div>
                  <div>
                    <p className={`font-bold text-sm ${method === 'ewallet' ? 'text-primary-600' : 'text-content-primary'}`}>E-Wallet</p>
                    <p className="text-[10px] text-content-secondary">Biaya Admin Rp2.500/pencairan</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => { setMethod('bank'); setProvider(''); setAccount(''); }}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-colors ${
                    method === 'bank' 
                      ? 'border-primary-500 bg-primary-500/5' 
                      : 'border-border hover:border-primary-500/30'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${method === 'bank' ? 'bg-primary-100 text-primary-600' : 'bg-surface-secondary text-content-secondary'}`}>
                    <Building2 size={20} />
                  </div>
                  <div>
                    <p className={`font-bold text-sm ${method === 'bank' ? 'text-primary-600' : 'text-content-primary'}`}>Transfer Bank</p>
                    <p className="text-[10px] text-content-secondary">Biaya Admin Rp4.000/pencairan</p>
                  </div>
                </button>
              </div>
            </div>

            {method !== 'qris' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-content-primary">
                    Pilih {method === 'ewallet' ? 'E-Wallet' : 'Bank'}
                  </label>
                  <select 
                    value={provider} 
                    onChange={(e) => setProvider(e.target.value)}
                    className="w-full px-4 py-3 bg-surface-card border border-border rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                    required
                  >
                    <option value="" disabled>-- Pilih {method === 'ewallet' ? 'E-Wallet' : 'Bank'} --</option>
                    {(method === 'ewallet' ? ewalletOptions : bankOptions).map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-content-primary">Nomor Akun / Rekening</label>
                  <input 
                    type="text"
                    value={account}
                    onChange={(e) => setAccount(e.target.value)}
                    placeholder={method === 'ewallet' ? '0812...' : 'Nomor Rekening...'}
                    className="w-full px-4 py-3 bg-surface-card border border-border rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                    required
                  />
                </div>
              </div>
            )}

            {method === 'qris' && (
              <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
                <label className="text-sm font-bold text-content-primary">Upload QRIS (Link / URL Gambar)</label>
                <input 
                  type="text"
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                  placeholder="https://... (URL gambar QRIS Anda)"
                  className="w-full px-4 py-3 bg-surface-card border border-border rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                  required
                />
                <p className="text-[10px] text-content-secondary mt-1">Saat ini hanya mendukung input URL gambar QRIS.</p>
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t border-border mt-6">
              <Button type="button" variant="outline" fullWidth onClick={onClose} disabled={isSubmitting}>
                Batal
              </Button>
              <Button type="submit" variant="primary" fullWidth isLoading={isSubmitting}>
                Simpan
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
