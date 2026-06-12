import { LogOut, X } from 'lucide-react';
import Button from './Button';

interface ConfirmLogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ConfirmLogoutModal({ isOpen, onClose, onConfirm }: ConfirmLogoutModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="absolute inset-0" 
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative bg-surface-card rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 border border-border">
        {/* Header */}
        <div className="bg-red-500 p-6 text-center relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/10 hover:bg-black/20 rounded-full p-1.5 transition-colors"
          >
            <X size={18} />
          </button>
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <LogOut size={32} className="text-white ml-1" />
          </div>
          <h3 className="text-lg font-bold text-white">Keluar dari DigiDO?</h3>
        </div>

        {/* Body */}
        <div className="p-6 text-center">
          <p className="text-content-secondary text-sm leading-relaxed mb-6">
            Anda yakin ingin keluar dari akun Anda? Anda harus login kembali untuk mengakses fitur-fitur DigiDO.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              variant="secondary" 
              fullWidth 
              onClick={onClose}
              className="order-2 sm:order-1 font-semibold"
            >
              Batal
            </Button>
            <Button 
              variant="danger" 
              fullWidth 
              onClick={onConfirm}
              className="order-1 sm:order-2 font-semibold shadow-lg shadow-red-500/30"
            >
              Ya, Keluar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
