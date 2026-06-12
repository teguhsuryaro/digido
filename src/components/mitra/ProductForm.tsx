import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { Camera } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/lib/supabase';
import { productSchema } from '@/lib/validations/product';
import { toast } from '@/components/ui/Toast';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

interface ProductFormProps {
  umkmId: string;
  initialData?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ProductForm({ umkmId, initialData, onSuccess, onCancel }: ProductFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialData?.image_url || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(productSchema),
    defaultValues: initialData || {
      name: '',
      description: '',
      price: 0,
      daily_stock: null,
      discount_percentage: 0,
      is_available: true,
    },
  });

  const handleImageUpload = async (file: File): Promise<string | null> => {
    if (!file) return null;

    try {
      // Validasi file size (max 5MB)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        throw new Error('Ukuran file terlalu besar (max 5MB)');
      }

      // Validasi file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Format file tidak didukung (JPEG, PNG, WebP)');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${umkmId}-${Date.now()}.${fileExt}`;
      const filePath = `products/${fileName}`;

      // Upload with timeout to prevent hanging forever
      const uploadPromise = supabase.storage.from('products').upload(filePath, file);
      const timeoutPromise = new Promise<{error: {message: string}}>((_, reject) => {
        setTimeout(() => reject(new Error('Koneksi terputus atau upload terlalu lama. Silakan coba lagi.')), 20000);
      });

      const { error: uploadError } = await Promise.race([uploadPromise, timeoutPromise]) as any;

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error(`Upload gagal: ${uploadError.message}`);
      }

      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (err: any) {
      console.error('Image upload error:', err);
      throw new Error(err.message || 'Gagal mengunggah gambar');
    }
  };

  const onSubmit = async (values: any) => {
    setIsSubmitting(true);
    try {
      let finalImageUrl = values.image_url;

      const file = fileInputRef.current?.files?.[0];
      if (file) {
        try {
          finalImageUrl = await handleImageUpload(file);
        } catch (uploadErr: any) {
          console.error('Upload error:', uploadErr);
          toast.error(uploadErr.message || 'Gagal mengunggah gambar');
          return; // Return early, finally will execute
        }
      }

      if (!umkmId) {
        throw new Error('UMKM ID tidak ditemukan');
      }

      const payload = {
        ...values,
        umkm_id: umkmId,
        image_url: finalImageUrl || null,
      };

      const dbPromise = initialData?.id 
        ? supabase.from('products').update(payload as any).eq('id', initialData.id)
        : supabase.from('products').insert(payload as any).select().maybeSingle();

      const dbTimeoutPromise = new Promise<{error: {message: string}}>((_, reject) => {
        setTimeout(() => reject(new Error('Koneksi database terlalu lama (timeout). Silakan coba lagi.')), 10000);
      });

      const { error } = await Promise.race([dbPromise, dbTimeoutPromise]) as any;

      if (error) {
        console.error('DB error:', error);
        throw new Error(error.message || 'Gagal menyimpan data produk ke database');
      }

      toast.success(initialData?.id ? 'Produk berhasil diperbarui' : 'Produk berhasil ditambahkan');

      try {
        onSuccess?.();
      } catch (callbackErr: any) {
        console.error('Callback error:', callbackErr);
        toast.error('Produk berhasil ditambahkan, tapi terjadi kesalahan di tampilan.');
      }
    } catch (err: any) {
      console.error('Error in onSubmit:', err);
      toast.error(err.message || 'Gagal menyimpan produk');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col max-h-[85vh]">
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
      {/* Image Upload */}
      <div className="flex flex-col items-center gap-3">
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="w-full h-32 md:h-40 rounded-card border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary-500 transition-colors bg-surface-secondary overflow-hidden relative group"
        >
          {previewUrl ? (
            <>
              <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold uppercase">
                Ganti Gambar
              </div>
            </>
          ) : (
            <>
              <Camera size={32} className="text-content-placeholder mb-2" />
              <span className="text-[10px] uppercase font-bold text-content-placeholder">Upload Foto Produk</span>
            </>
          )}
        </div>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={onFileChange} 
          className="hidden" 
          accept="image/*"
        />
      </div>

      <Input
        label="Nama Produk"
        placeholder="Contoh: Nasi Goreng Spesial"
        {...register('name')}
        error={errors.name?.message as any}
      />

      <div className="space-y-1">
        <label className="text-xs font-bold text-content-secondary uppercase tracking-widest px-1">Deskripsi</label>
        <textarea
          {...register('description')}
          placeholder="Jelaskan isi atau keunggulan produk..."
          className="w-full p-3 rounded-card bg-surface-secondary border border-border text-sm outline-none focus:ring-2 focus:ring-primary-500/20 min-h-[80px]"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Input
            label="Harga (Rp)"
            type="number"
            placeholder="0"
            {...register('price', { valueAsNumber: true })}
            error={errors.price?.message as any}
          />
          <p className="text-[10px] text-content-placeholder mt-1 px-1">Harga jual asli produk.</p>
        </div>
        <div>
          <Input
            label="Diskon (%)"
            type="number"
            placeholder="0"
            {...register('discount_percentage', { 
              setValueAs: (v) => (v === "" || v === null || Number.isNaN(Number(v))) ? 0 : parseInt(v, 10)
            })}
            error={errors.discount_percentage?.message as any}
          />
          <p className="text-[10px] text-content-placeholder mt-1 px-1">0 = tanpa diskon. Cth: 10 untuk 10%.</p>
        </div>
        <div>
          <Input
            label="Stok Harian"
            type="number"
            placeholder="Tanpa batas"
            {...register('daily_stock', { 
              setValueAs: (v) => (v === "" || v === null || Number.isNaN(Number(v))) ? null : parseInt(v, 10)
            })}
            error={errors.daily_stock?.message as any}
          />
          <p className="text-[10px] text-content-placeholder mt-1 px-1">Kosongkan jika stok tidak terbatas.</p>
        </div>
      </div>
      </div>

      {/* Sticky Buttons */}
      <div className="p-4 border-t border-border bg-surface-primary sticky bottom-0 z-10 shrink-0">
        <div className="flex gap-3">
          <Button 
            variant="secondary" 
            type="button" 
            fullWidth 
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Batal
          </Button>
          <Button 
            variant="primary" 
            type="submit" 
            fullWidth 
            disabled={isSubmitting || !umkmId}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2 justify-center">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Menyimpan...
              </span>
            ) : (
              initialData ? 'Simpan Perubahan' : 'Tambah Produk'
            )}
          </Button>
        </div>
        
        {!umkmId && (
          <p className="text-sm text-red-600 mt-2 text-center">
            UMKM tidak ditemukan. Silakan refresh halaman.
          </p>
        )}
      </div>
    </form>
  );
}
