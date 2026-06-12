import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { formatRupiah } from '@/utils/format';
import { toast } from '@/components/ui/Toast';
import { X, Wallet } from 'lucide-react';
import Button from '@/components/ui/Button';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  umkmId: string;
  maxBalance: number;
  onSuccess: () => void;
}

export default function WithdrawalModal({ isOpen, onClose, umkmId, maxBalance, onSuccess }: Props) {
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleWithdrawAll = () => {
    setAmount(maxBalance.toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const numAmount = parseInt(amount);
    
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error('Masukkan nominal yang valid.');
      return;
    }
    
    if (numAmount > maxBalance) {
      toast.error('Nominal melebihi saldo yang tersedia.');
      return;
    }

    if (numAmount < 10000) {
      toast.error('Minimal penarikan adalah Rp 10.000');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('withdrawals')
        .insert({
          umkm_id: umkmId,
          amount: numAmount,
          status: 'pending',
        });

      if (error) throw error;

      toast.success('Permintaan penarikan dana berhasil diajukan.');
      onSuccess();
      onClose();
      setAmount('');
    } catch (err: any) {
      console.error('Withdrawal error:', err);
      toast.error(err.message || 'Gagal mengajukan penarikan dana.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-surface-primary w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
        <div className="p-4 border-b border-border flex justify-between items-center bg-surface-secondary">
          <h2 className="text-lg font-bold text-content-primary flex items-center gap-2">
            <Wallet size={20} className="text-primary-500" />
            Cairkan Dana
          </h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-surface-hover text-content-secondary transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="bg-primary-500/10 p-4 rounded-xl border border-primary-500/20 text-center">
            <p className="text-xs text-content-secondary mb-1">Saldo Tersedia</p>
            <p className="text-2xl font-black text-primary-500">{formatRupiah(maxBalance)}</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-content-primary">Nominal Penarikan</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-content-secondary font-medium">Rp</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="10000"
                min="10000"
                max={maxBalance}
                className="w-full pl-12 pr-4 py-3 bg-surface-card border border-border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
              />
            </div>
            <div className="flex justify-between items-center mt-2">
              <p className="text-[11px] text-content-secondary">Min. Rp 10.000</p>
              <button
                type="button"
                onClick={handleWithdrawAll}
                className="text-[11px] font-bold text-primary-500 hover:underline"
              >
                Tarik Semua
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              fullWidth
              onClick={onClose}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              fullWidth
              isLoading={isSubmitting}
            >
              Ajukan
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
