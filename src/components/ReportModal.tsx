import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/Toast';
import Button from '@/components/ui/Button';

interface ReportModalProps {
  targetType: 'product' | 'umkm' | 'user' | 'review';
  targetId: string;
  targetName: string;
  onClose: () => void;
}

export default function ReportModal({ targetType, targetId, targetName, onClose }: ReportModalProps) {
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const user = useAuthStore((s) => s.user);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Anda harus login untuk melaporkan.');
      return;
    }
    if (!reason.trim()) {
      toast.error('Alasan pelaporan wajib diisi.');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.from('reports').insert([
        {
          reporter_id: user.id,
          target_type: targetType,
          target_id: targetId,
          reason: reason.trim(),
          status: 'open',
        },
      ]);

      if (error) throw error;

      toast.success('Laporan berhasil dikirim. Terima kasih atas laporannya!');
      onClose();
    } catch (err) {
      console.error('Error submitting report:', err);
      toast.error('Gagal mengirim laporan. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div
          className="bg-surface-card rounded-card border border-border shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-300 relative max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-4 border-b border-border flex items-center justify-between bg-surface-secondary/50 rounded-t-card">
            <h2 className="font-bold text-content-primary flex items-center gap-2">
              <AlertTriangle size={18} className="text-red-500" />
              Laporkan {targetType === 'umkm' ? 'Toko' : 'Produk'}
            </h2>
            <button
              onClick={onClose}
              className="text-content-secondary hover:text-content-primary transition-colors p-1"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
            <div>
              <p className="text-sm font-medium text-content-secondary mb-1">
                Melaporkan:
              </p>
              <p className="font-bold text-content-primary p-3 bg-surface-secondary rounded-button border border-border/50">
                {targetName}
              </p>
            </div>

            <div>
              <label htmlFor="reason" className="block text-sm font-medium text-content-secondary mb-1">
                Alasan Laporan <span className="text-red-500">*</span>
              </label>
              <textarea
                id="reason"
                rows={4}
                className="w-full px-4 py-3 bg-surface-primary border border-border rounded-button focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-content-primary placeholder:text-content-placeholder transition-all resize-none"
                placeholder="Jelaskan secara detail mengapa Anda melaporkan ini..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                onClick={onClose}
                disabled={isLoading}
              >
                Batal
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="flex-1 bg-red-500 hover:bg-red-600 focus:ring-red-500/20 border-transparent text-white"
                isLoading={isLoading}
              >
                Kirim Laporan
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
