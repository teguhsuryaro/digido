import { X, Share2, Flag, Bookmark, Package } from 'lucide-react';
import StarRating from '@/components/StarRating';
import { formatRupiah } from '@/utils/format';
import { useState } from 'react';
import ReportModal from '@/components/ReportModal';

interface ProductDetailModalProps {
  product: {
    id: string;
    name: string;
    description: string;
    price: number;
    image_url: string | null;
    is_available: boolean;
    daily_stock: number | null;
    discount_percentage?: number | null;
  };
  avgRating: number;
  ratingCount: number;
  onClose: () => void;
}

export default function ProductDetailModal({
  product,
  avgRating,
  ratingCount,
  onClose,
}: ProductDetailModalProps) {
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const hasDiscount = !!product.discount_percentage && product.discount_percentage > 0;
  const finalPrice = hasDiscount
    ? product.price - (product.price * (product.discount_percentage! / 100))
    : product.price;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-surface-card rounded-card border border-border shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-10 w-8 h-8 bg-surface-card/80 backdrop-blur-sm rounded-full flex items-center justify-center text-content-secondary hover:text-content-primary transition-colors border border-border"
            aria-label="Tutup"
          >
            <X size={16} />
          </button>

          {/* Foto Produk */}
          <div className="aspect-square bg-surface-secondary relative overflow-hidden rounded-t-card">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center opacity-20 text-content-primary">
                <Package size={64} />
              </div>
            )}
            {/* Out of Stock Overlay */}
            {(!product.is_available || (product.daily_stock !== null && product.daily_stock <= 0)) && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="bg-red-500 text-white text-sm font-bold px-4 py-2 rounded-full uppercase tracking-wider">
                  Stok Habis
                </span>
              </div>
            )}
            
            {/* Discount Badge */}
            {hasDiscount && (
              <div className="absolute top-4 left-4 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-md shadow-md border border-white/20">
                DISKON {product.discount_percentage}%
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Nama & Harga */}
            <div>
              <h2 className="text-xl font-bold text-content-primary">{product.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-2xl font-extrabold text-primary-500">
                  {formatRupiah(finalPrice)}
                </p>
                {hasDiscount && (
                  <p className="text-sm font-medium text-content-placeholder line-through">
                    {formatRupiah(product.price)}
                  </p>
                )}
              </div>
              {product.daily_stock !== null && (
                <p className="text-xs text-content-placeholder mt-1">Stok tersisa: {product.daily_stock}</p>
              )}
            </div>

            {/* Rating Produk */}
            <div className="flex items-center gap-2">
              <StarRating rating={Math.round(avgRating)} readonly size="sm" />
              <span className="text-sm font-bold text-content-primary">{avgRating.toFixed(1)}</span>
              <span className="text-xs text-content-placeholder">({ratingCount} rating)</span>
            </div>

            {/* Deskripsi */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-content-placeholder mb-1">Deskripsi</p>
              <p className="text-sm text-content-secondary leading-relaxed">
                {product.description || 'Tidak ada deskripsi untuk produk ini.'}
              </p>
            </div>

            {/* Tombol Dekoratif */}
            <div className="flex gap-2 pt-3 border-t border-border">
              <button
                disabled
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-button bg-surface-secondary text-content-placeholder text-sm font-medium cursor-not-allowed opacity-60"
                title="Fitur ini belum tersedia"
              >
                <Share2 size={14} /> Bagikan
              </button>
              <button
                onClick={() => setIsReportModalOpen(true)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-button bg-surface-secondary text-content-secondary hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 text-sm font-medium transition-colors"
                title="Laporkan Produk"
              >
                <Flag size={14} /> Laporkan
              </button>
              <button
                disabled
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-button bg-surface-secondary text-content-placeholder text-sm font-medium cursor-not-allowed opacity-60"
                title="Fitur ini belum tersedia"
              >
                <Bookmark size={14} /> Simpan
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Laporan Produk */}
      {isReportModalOpen && (
        <ReportModal
          targetType="product"
          targetId={product.id}
          targetName={product.name}
          onClose={() => setIsReportModalOpen(false)}
        />
      )}
    </>
  );
}
