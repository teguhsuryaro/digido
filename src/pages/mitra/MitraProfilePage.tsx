import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Save, Crown, ChevronLeft, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { uploadFile } from '@/lib/supabase-helpers';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from '@/components/ui/Toast';
import PageTransition from '@/components/ui/PageTransition';
import Skeleton from '@/components/ui/Skeleton';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';

interface UMKMData {
  id: string;
  name: string;
  description: string;
  photo_url: string | null;
  whatsapp_number: string | null;
  approval_status: string;
}

export default function MitraProfilePage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [umkm, setUmkm] = useState<UMKMData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [activePlan, setActivePlan] = useState<string>('Free');

  useEffect(() => {
    if (!user) return;

    const fetchUMKM = async () => {
      try {
        const { data, error } = await supabase
          .from('umkm')
          .select('id, name, description, photo_url, whatsapp_number, approval_status')
          .eq('owner_id', user.id)
          .single();

        if (error) throw error;

        const umkmData = data as any;
        setUmkm(umkmData);
        setName(umkmData.name || '');
        setDescription(umkmData.description || '');
        setWhatsappNumber(umkmData.whatsapp_number || '');

        const { data: subData } = await supabase
          .from('subscriptions')
          .select('subscription_plans(name)')
          .eq('umkm_id', umkmData.id)
          .eq('status', 'active')
          .gte('expires_at', new Date().toISOString())
          .order('expires_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (subData) {
          setActivePlan((subData as any).subscription_plans?.name || 'Free');
        }
      } catch (err) {
        console.error('Error fetching UMKM profile:', err);
        toast.error('Gagal memuat data toko.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUMKM();
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!umkm) return;

    if (!name.trim()) {
      toast.warning('Nama toko tidak boleh kosong.');
      return;
    }

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('umkm')
        .update({
          name: name.trim(),
          description: description.trim(),
          whatsapp_number: whatsappNumber.trim() || null,
        } as any)
        .eq('id', umkm.id);

      if (error) throw error;

      setUmkm({ ...umkm, name: name.trim(), description: description.trim(), whatsapp_number: whatsappNumber.trim() || null });
      toast.success('Profil toko berhasil diperbarui!');
    } catch (err) {
      toast.error('Gagal memperbarui profil toko.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !umkm) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.warning('Ukuran file maksimal 2MB.');
      return;
    }

    setIsUploading(true);
    try {
      const url = await uploadFile('business-photos', `${umkm.id}/shop-profile-${Date.now()}`, file);

      if (url) {
        const { error } = await supabase
          .from('umkm')
          .update({ photo_url: url } as any)
          .eq('id', umkm.id);

        if (error) throw error;

        setUmkm({ ...umkm, photo_url: url });
        toast.success('Foto toko berhasil diperbarui!');
      }
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('Gagal mengunggah foto toko.');
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Skeleton className="h-40 w-full rounded-card" />
        <Skeleton className="h-64 w-full rounded-card" />
      </div>
    );
  }

  if (!umkm) {
    return (
      <div className="text-center py-16">
        <p className="text-content-placeholder">Data toko tidak ditemukan.</p>
      </div>
    );
  }

  // Generate inisial untuk fallback avatar
  const initials = umkm.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto space-y-8 pb-20 md:pb-8">
        <div className="flex flex-col gap-4">
          <button onClick={() => navigate('/mitra/pengaturan')} className="flex items-center gap-2 text-content-secondary hover:text-content-primary font-medium w-fit transition-colors">
            <ChevronLeft size={20} />
            Kembali ke Pengaturan
          </button>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-black text-content-primary">Profil Toko</h1>
              <p className="text-sm text-content-secondary mt-1">Kelola informasi dasar dan tampilan toko Anda.</p>
            </div>
            {umkm.approval_status === 'approved' && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-600 rounded-full text-xs font-bold border border-green-200">
                <Check size={14} /> Terverifikasi
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Kolom Kiri: Foto Profil & Paket */}
          <div className="lg:sticky lg:top-24 space-y-6">
            <Card className="p-6 flex flex-col items-center gap-4 text-center border-border shadow-sm">
              <div className="relative group">
                <div className="w-32 h-32 rounded-2xl overflow-hidden border-4 border-surface-card shadow-lg bg-primary-500 flex items-center justify-center text-4xl font-bold text-white">
                  {umkm.photo_url ? (
                    <img src={umkm.photo_url} alt="Foto Toko" className="w-full h-full object-cover" />
                  ) : (
                    initials
                  )}
                  {isUploading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 w-10 h-10 bg-primary-500 rounded-full border-4 border-surface-primary text-white flex items-center justify-center hover:scale-110 transition-transform shadow-md"
                  aria-label="Ubah foto toko"
                >
                  <Camera size={16} />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoUpload}
                  className="hidden"
                  accept="image/*"
                />
              </div>
              <p className="text-xs text-content-placeholder">Klik ikon kamera untuk mengganti foto toko</p>
            </Card>

            {/* Paket Premium */}
            <Card
              className="p-5 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 shadow-sm"
              hoverable
              onClick={() => navigate('/mitra/pengaturan/langganan')}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-content-placeholder">Paket Premium</p>
                  <p className="text-xl font-extrabold text-content-primary mt-1">{activePlan}</p>
                  <p className="text-[10px] text-content-secondary mt-1">Klik untuk melihat atau upgrade paket</p>
                </div>
                <Crown size={32} className="text-yellow-500 drop-shadow-sm" />
              </div>
            </Card>
          </div>

          {/* Kolom Kanan: Form Edit Data Toko */}
          <div className="space-y-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-content-secondary px-1 hidden lg:block">Data Informasi Toko</h2>
            <Card className="p-6 shadow-sm border-border">
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <Input
                  label="Nama Toko"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Warung Berkah"
                  required
                />
                <div className="space-y-1">
                  <label className="text-xs font-bold text-content-secondary uppercase tracking-widest px-1">Deskripsi Toko</label>
                  <textarea
                    className="w-full p-4 rounded-card bg-surface-secondary border border-border text-sm outline-none focus:ring-2 focus:ring-primary-500/20 min-h-[120px]"
                    placeholder="Jelaskan apa yang dijual di toko Anda..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                <Input
                  label="Nomor WhatsApp Toko"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="Contoh: 081234567890"
                />
                <p className="text-[10px] text-content-placeholder px-1 -mt-4 mb-2">
                  Nomor ini digunakan pelanggan untuk menghubungi toko via tombol "Chat Penjual".
                </p>
                <div className="pt-2">
                  <Button
                    variant="primary"
                    fullWidth
                    type="submit"
                    isLoading={isUpdating}
                    disabled={isUpdating}
                  >
                    <Save size={16} className="mr-2" /> Simpan Perubahan
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
