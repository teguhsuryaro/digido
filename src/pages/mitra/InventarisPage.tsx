import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, Pencil, Trash2, Package, ChevronLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { formatRupiah } from '@/utils/format';
import { toast } from '@/components/ui/Toast';
import PageTransition from '@/components/ui/PageTransition';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import Modal from '@/components/ui/Modal';
import ProductForm from '@/components/mitra/ProductForm';

export default function InventarisPage() {
  const navigate = useNavigate();
  const locationState = useLocation();
  const isFromSettings = locationState.pathname.includes('/pengaturan');
  const user = useAuthStore((s) => s.user);
  const [umkm, setUmkm] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    if (!user) return;
    
    try {
      // 1. Get UMKM
      const { data: umkmData, error: umkmError } = await supabase
        .from('umkm')
        .select('id, name')
        .eq('owner_id', user.id)
        .maybeSingle();
      
      if (umkmError) throw umkmError;

      if (!umkmData) {
        setUmkm(null);
        setProducts([]);
        return;
      }
      
      setUmkm(umkmData as any);

      // 2. Get Products
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('umkm_id', (umkmData as any).id)
        .order('created_at', { ascending: false });

      if (productError) throw productError;
      setProducts(productData || []);
    } catch (err) {
      console.error('Error fetching inventory:', err);
      toast.error('Gagal memuat inventaris.');
      setUmkm(null);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleToggleStock = async (product: any) => {
    const newStatus = !product.is_available;
    
    // Optimistic Update
    setProducts(prev => prev.map(p => 
      p.id === product.id ? { ...p, is_available: newStatus } : p
    ));

    try {
      const { error } = await supabase
        .from('products')
        .update({ is_available: newStatus } as any)
        .eq('id', product.id);

      if (error) throw error;
      toast.success(`${product.name} sekarang ${newStatus ? 'Tersedia' : 'Habis'}`);
    } catch (err) {
      // Rollback
      setProducts(prev => prev.map(p => 
        p.id === product.id ? { ...p, is_available: !newStatus } : p
      ));
      toast.error('Gagal memperbarui status stok.');
    }
  };

  const handleDelete = async () => {
    if (!deletingProduct) return;
    setIsSubmitting(true);
    
    try {
      // 1. Delete from database
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', deletingProduct.id);

      if (error) throw error;

      // 2. Delete image from Storage (if exists)
      if (deletingProduct.image_url) {
        const urlParts = deletingProduct.image_url.split('/');
        const fileName = urlParts[urlParts.length - 1];
        const folderName = urlParts[urlParts.length - 2];
        await supabase.storage
          .from('products')
          .remove([`${folderName}/${fileName}`]);
      }

      toast.success('Produk berhasil dihapus');
      setIsDeleteOpen(false);
      fetchData();
    } catch (err) {
      toast.error('Gagal menghapus produk');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEdit = (product: any) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  const openAdd = () => {
    setEditingProduct(null);
    setIsFormOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48 mb-4" />
        <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4 lg:gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-24 w-full rounded-card" />
          ))}
        </div>
      </div>
    );
  }

  if (!umkm) {
    return (
      <div className="py-20 text-center">
        <h2 className="text-xl font-semibold mb-2 text-content-primary">Belum Punya Toko</h2>
        <p className="text-content-secondary mb-6">
          Silakan daftar sebagai mitra terlebih dahulu untuk mengelola inventaris.
        </p>
        <Button onClick={() => navigate('/daftar-mitra')} variant="primary">
          Daftar Sebagai Mitra
        </Button>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-8 pb-20 md:pb-8">
        {/* Header */}
        <div className="flex flex-col gap-4">
          {isFromSettings && (
            <button onClick={() => navigate('/mitra/pengaturan')} className="flex items-center gap-2 text-content-secondary hover:text-content-primary font-medium w-fit transition-colors">
              <ChevronLeft size={20} />
              Kembali ke Pengaturan
            </button>
          )}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-content-primary">Manajemen Inventaris</h1>
              <p className="text-sm text-content-secondary mt-1">Kelola menu dan stok produk Anda.</p>
            </div>
            <Button variant="primary" size="sm" onClick={openAdd} className="flex items-center gap-1.5 shrink-0">
              <Plus size={14} /> Tambah
            </Button>
          </div>
        </div>

        {/* Product Grid Layout */}
        {products.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4 lg:gap-6">
            {products.map((product) => (
              <Card key={product.id} className="p-4 border-border hover:border-primary-500/50 transition-colors flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {/* Thumbnail & Title (Mobile) */}
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="w-16 h-16 rounded-lg bg-surface-secondary overflow-hidden shrink-0 flex items-center justify-center relative">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <Package size={24} className="text-content-placeholder" />
                    )}
                    {product.discount_percentage > 0 && (
                      <div className="absolute top-0 left-0 bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-br-lg z-10 shadow-sm">
                        -{product.discount_percentage}%
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 sm:hidden">
                    <h3 className="font-bold text-content-primary text-sm truncate leading-tight">{product.name}</h3>
                    <div className="flex flex-col mt-1">
                      {product.discount_percentage > 0 ? (
                        <>
                          <span className="text-[10px] font-medium text-content-placeholder line-through decoration-red-500/50 mb-0.5">
                            {formatRupiah(product.price)}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-red-500">
                              {formatRupiah(product.price - (product.price * product.discount_percentage / 100))}
                            </span>
                            <div className="w-1 h-1 bg-border rounded-full shrink-0" />
                            <span className="text-[10px] text-content-placeholder uppercase font-bold shrink-0 truncate">Stok: {product.daily_stock ?? '∞'}</span>
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-primary-500">{formatRupiah(product.price)}</span>
                          <div className="w-1 h-1 bg-border rounded-full shrink-0" />
                          <span className="text-[10px] text-content-placeholder uppercase font-bold shrink-0 truncate">Stok: {product.daily_stock ?? '∞'}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Info (Desktop) */}
                <div className="hidden sm:block flex-1 min-w-0">
                  <h3 className="font-bold text-content-primary text-sm truncate leading-tight">{product.name}</h3>
                  <div className="flex flex-col mt-1">
                    {product.discount_percentage > 0 ? (
                      <>
                        <span className="text-[10px] font-medium text-content-placeholder line-through decoration-red-500/50 mb-0.5">
                          {formatRupiah(product.price)}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-red-500 shrink-0">
                            {formatRupiah(product.price - (product.price * product.discount_percentage / 100))}
                          </span>
                          <div className="w-1 h-1 bg-border rounded-full shrink-0" />
                          <span className="text-[10px] text-content-placeholder uppercase font-bold shrink-0">Stok: {product.daily_stock ?? '∞'}</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-primary-500 shrink-0">{formatRupiah(product.price)}</span>
                        <div className="w-1 h-1 bg-border rounded-full shrink-0" />
                        <span className="text-[10px] text-content-placeholder uppercase font-bold shrink-0">Stok: {product.daily_stock ?? '∞'}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/30 shrink-0">
                  <span className="text-[10px] font-bold text-content-secondary uppercase sm:hidden">
                    {product.is_available ? 'Tersedia' : 'Habis'}
                  </span>
                  
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Toggle Stock */}
                    <button 
                      onClick={() => handleToggleStock(product)}
                      className={`
                        w-10 h-6 rounded-full p-1 transition-colors relative shrink-0
                        ${product.is_available ? 'bg-green-500' : 'bg-content-placeholder'}
                      `}
                      aria-label="Toggles stock availability"
                    >
                      <div className={`
                        w-4 h-4 bg-white rounded-full shadow-sm transition-transform
                        ${product.is_available ? 'translate-x-4' : ''}
                      `} />
                    </button>

                    {/* Edit */}
                    <button 
                      onClick={() => openEdit(product)}
                      className="p-1.5 text-content-placeholder hover:text-primary-500 transition-colors shrink-0"
                      aria-label="Edit product"
                    >
                      <Pencil size={16} />
                    </button>

                    {/* Delete */}
                    <button 
                      onClick={() => {
                        setDeletingProduct(product);
                        setIsDeleteOpen(true);
                      }}
                      className="p-1.5 text-content-placeholder hover:text-red-500 transition-colors shrink-0"
                      aria-label="Delete product"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center bg-surface-secondary rounded-card border border-dashed border-border">
            <p className="text-content-placeholder font-medium">Belum ada produk.</p>
            <Button variant="secondary" size="sm" className="mt-4" onClick={openAdd}>
              Mulai Tambah Produk
            </Button>
          </div>
        )}

        {/* Modal: Add/Edit Form */}
        <Modal 
          isOpen={isFormOpen} 
          onClose={() => setIsFormOpen(false)}
          title={editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}
          noPadding
        >
          <ProductForm 
            umkmId={umkm?.id} 
            initialData={editingProduct}
            onCancel={() => setIsFormOpen(false)}
            onSuccess={() => {
              setIsFormOpen(false);
              fetchData();
            }}
          />
        </Modal>

        {/* Modal: Confirm Delete */}
        <Modal 
          isOpen={isDeleteOpen} 
          onClose={() => setIsDeleteOpen(false)}
          title="Hapus Produk"
        >
          <div className="p-6">
            <p className="text-content-secondary text-sm mb-6">
              Apakah Anda yakin ingin menghapus <span className="font-bold text-content-primary">"{deletingProduct?.name}"</span>? 
              Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex gap-3">
              <Button variant="secondary" fullWidth onClick={() => setIsDeleteOpen(false)} disabled={isSubmitting}>
                Batal
              </Button>
              <Button variant="danger" fullWidth onClick={handleDelete} isLoading={isSubmitting}>
                Hapus Sekarang
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </PageTransition>
  );
}
