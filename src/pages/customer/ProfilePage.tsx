import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Store, BarChart3, ShoppingBag, LogOut, ChevronRight, Settings, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { handleLogout } from '@/utils/logout';
import { formatRupiah } from '@/utils/format';
import { toast } from '@/components/ui/Toast';
import PageTransition from '@/components/ui/PageTransition';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import ConfirmLogoutModal from '@/components/ui/ConfirmLogoutModal';
import ThemeToggle from '@/components/ui/ThemeToggle';
import ReportModal from '@/components/ReportModal';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, profile, setProfile, authVersion } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phoneNumber, setPhoneNumber] = useState(profile?.phone || '');
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingWallet, setIsLoadingWallet] = useState(true);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [umkmStatus, setUmkmStatus] = useState<'none' | 'pending' | 'rejected' | 'approved'>('none');

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhoneNumber(profile.phone || '');
    }
  }, [profile]);

  useEffect(() => {
    if (!user) return;

    const fetchWallet = async () => {
      try {
        const { data, error } = await supabase
          .from('wallets')
          .select('balance')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!error) setWalletBalance((data as any).balance);
      } catch (err) {
        console.error('Wallet fetch error:', err);
      } finally {
        setIsLoadingWallet(false);
      }
    };

    const fetchUmkmStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('umkm')
          .select('approval_status')
          .eq('owner_id', user.id)
          .maybeSingle();

        if (!error && data) {
          setUmkmStatus((data as any).approval_status || 'pending');
        }
      } catch (err) {
        console.error('UMKM status fetch error:', err);
      }
    };

    fetchWallet();
    if (profile?.role === 'pelanggan') {
      fetchUmkmStatus();
    }
  }, [user?.id, profile, authVersion]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsUpdating(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          phone: phoneNumber,
          updated_at: new Date().toISOString(),
        } as any)
        .eq('id', user.id)
        .select()
        .maybeSingle();

      if (error) throw error;
      
      setProfile(data as any);
      toast.success('Profil berhasil diperbarui!');
    } catch (err) {
      toast.error('Gagal memperbarui profil.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validasi file
    if (file.size > 2 * 1024 * 1024) {
      toast.warning('Ukuran file maksimal 2MB.');
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`; // Folder based on UID

      // 1. Upload to Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // 3. Update Profile
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl } as any)
        .eq('id', user.id)
        .select()
        .maybeSingle();

      if (updateError) throw updateError;

      setProfile(updatedProfile as any);
      toast.success('Foto profil diperbarui!');
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('Gagal mengunggah foto.');
    } finally {
      setIsUploading(false);
    }
  };

  const onLogout = async () => {
    await handleLogout(navigate);
    toast.success('Berhasil keluar.');
  };

  return (
    <PageTransition>
      <div className="max-w-3xl mx-auto space-y-8 pb-32 md:pb-8">
        {/* Header & Avatar */}
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="relative group">
            <div className={`
              w-32 h-32 rounded-full overflow-hidden border-4 border-surface-card shadow-lg
              bg-primary-500 flex items-center justify-center text-4xl font-bold text-white
            `}>
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                profile?.full_name?.charAt(0) || 'U'
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
              aria-label="Unggah foto profil"
            >
              <Camera size={16} />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleAvatarUpload} 
              className="hidden" 
              accept="image/*"
            />
          </div>
          
          <div className="text-center">
            <h1 className="text-2xl font-bold text-content-primary">{profile?.full_name}</h1>
            <p className="text-content-placeholder text-sm">{user?.email}</p>
            <span className="mt-2 inline-block px-3 py-0.5 bg-primary-500/10 text-primary-500 text-[10px] font-bold uppercase tracking-widest rounded-full">
              {profile?.role}
            </span>
          </div>
        </div>

        {/* Desktop: Layout Dashboard Simetris */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
          {/* Left Column: Wallet Brief & Settings */}
          <div className="space-y-6">
            
            {/* Wallet Brief */}
            <Card 
              className="p-5 sm:p-6 bg-gradient-to-br from-primary-500 to-primary-600 border-none text-white overflow-hidden relative shadow-lg shadow-primary-500/20"
              onClick={() => navigate('/dompet')}
              hoverable
            >
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-white/80 uppercase tracking-wider mb-1">Saldo Dompet DigiDO</p>
                  <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                    {isLoadingWallet ? '...' : formatRupiah(walletBalance || 0)}
                  </h2>
                </div>
                <div className="shrink-0 hidden md:block">
                  <span className="bg-white/20 hover:bg-white/30 transition-colors px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 backdrop-blur-sm cursor-pointer">
                    Lihat Detail <ChevronRight size={16} />
                  </span>
                </div>
                {/* Mobile version of detail link */}
                <div className="mt-2 md:hidden">
                  <span className="text-xs font-bold uppercase tracking-widest flex items-center gap-1 opacity-80">
                    Lihat Detail <ChevronRight size={12} />
                  </span>
                </div>
              </div>
              {/* Decorative Patterns */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary-400/30 rounded-full translate-y-1/2 -translate-x-1/4 blur-xl pointer-events-none" />
            </Card>

            {/* Pengaturan Akun Form */}
            <section className="space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-widest text-content-secondary px-1">Pengaturan Akun</h2>
              <Card className="p-5 sm:p-6 shadow-sm border-border">
                <form onSubmit={handleUpdateProfile} className="space-y-5">
                  <Input 
                    label="Nama Lengkap" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Masukkan nama lengkap"
                  />
                  <Input 
                    label="Nomor WhatsApp" 
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Contoh: 08123456789"
                  />
                  <div className="pt-2">
                    <Button 
                      variant="primary" 
                      fullWidth 
                      type="submit" 
                      isLoading={isUpdating}
                      disabled={isUpdating || (fullName === profile?.full_name && phoneNumber === profile?.phone)}
                    >
                      Simpan Perubahan
                    </Button>
                  </div>
                </form>
              </Card>
            </section>

          </div>

          {/* Right Column: Other items (Menu navigasi) */}
          <div className="space-y-4 lg:sticky lg:top-24">
            <h2 className="text-sm font-bold uppercase tracking-wider text-content-placeholder px-1">Lainnya</h2>
            <Card className="divide-y divide-border overflow-hidden">
              
              {/* Mitra Link */}
              {profile?.role === 'pelanggan' && umkmStatus !== 'approved' ? (
                <button 
                  onClick={() => {
                    if (umkmStatus === 'pending') return;
                    navigate('/daftar-mitra');
                  }}
                  className={`w-full p-4 flex items-center justify-between transition-colors ${umkmStatus === 'pending' ? 'opacity-60 cursor-not-allowed bg-surface-secondary' : 'hover:bg-surface-secondary'}`}
                  disabled={umkmStatus === 'pending'}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${umkmStatus === 'pending' ? 'bg-gray-100 text-gray-500 dark:bg-gray-800' : umkmStatus === 'rejected' ? 'bg-red-100 text-red-600 dark:bg-red-900/30' : 'bg-orange-100 text-orange-600 dark:bg-orange-900/30'}`}>
                      <Store size={20} />
                    </div>
                    <div className="text-left">
                      <p className={`text-sm font-bold ${umkmStatus === 'pending' ? 'text-content-secondary' : umkmStatus === 'rejected' ? 'text-red-600 dark:text-red-400' : 'text-content-primary'}`}>
                        {umkmStatus === 'pending' ? 'Menunggu Persetujuan Mitra' : umkmStatus === 'rejected' ? 'Daftar Ulang Mitra' : 'Daftar sebagai Mitra'}
                      </p>
                      <p className="text-[10px] text-content-secondary">
                        {umkmStatus === 'pending' ? 'Tim kami sedang meninjau data Anda' : umkmStatus === 'rejected' ? 'Pendaftaran sebelumnya ditolak' : 'Mulai jualan produk UMKM Anda'}
                      </p>
                    </div>
                  </div>
                  {umkmStatus !== 'pending' && <span className="text-content-placeholder"><ChevronRight size={16} /></span>}
                </button>
              ) : profile?.role === 'mitra' || profile?.role === 'superadmin' ? (
                <>
                  <button 
                    onClick={() => navigate('/mitra')}
                    className="w-full p-4 flex items-center justify-between hover:bg-surface-secondary transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 flex items-center justify-center shrink-0">
                        <BarChart3 size={20} />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold text-content-primary">Dashboard Mitra</p>
                        <p className="text-[10px] text-content-secondary">Kelola toko dan pesanan</p>
                      </div>
                    </div>
                    <span className="text-content-placeholder"><ChevronRight size={16} /></span>
                  </button>
                  <button 
                    onClick={() => navigate('/katalog')}
                    className="w-full p-4 flex items-center justify-between hover:bg-surface-secondary transition-colors border-t border-border"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 flex items-center justify-center shrink-0">
                        <ShoppingBag size={20} />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold text-content-primary">Jelajahi Katalog</p>
                        <p className="text-[10px] text-content-secondary">Belanja produk dari UMKM lain</p>
                      </div>
                    </div>
                    <span className="text-content-placeholder"><ChevronRight size={16} /></span>
                  </button>
                </>
              ) : null}

              {/* Theme Toggle */}
              <div className="w-full p-4 flex items-center justify-between border-b border-border hover:bg-surface-secondary/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center text-blue-600 shrink-0">
                    <Settings size={20} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold">Tema Aplikasi</p>
                    <p className="text-[10px] text-content-secondary">Ubah tampilan aplikasi</p>
                  </div>
                </div>
                <ThemeToggle />
              </div>

              {/* Laporkan Website */}
              <button 
                onClick={() => setIsReportModalOpen(true)}
                className="w-full p-4 flex items-center justify-between hover:bg-surface-secondary transition-colors border-b border-border"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-950/30 flex items-center justify-center text-orange-600 shrink-0">
                    <AlertTriangle size={20} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-content-primary">Laporkan Website</p>
                    <p className="text-[10px] text-content-secondary">Beri masukan atau laporkan kendala</p>
                  </div>
                </div>
                <span className="text-content-placeholder"><ChevronRight size={16} /></span>
              </button>

              {/* Logout */}
              <button 
                onClick={() => setIsLogoutModalOpen(true)}
                className="w-full p-4 flex items-center justify-between hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/30 flex items-center justify-center text-red-600 shrink-0">
                    <LogOut size={20} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold">Keluar dari Akun</p>
                    <p className="text-[10px] opacity-70 text-red-400">Sesi akan dihapus</p>
                  </div>
                </div>
                <span className="opacity-50"><ChevronRight size={16} /></span>
              </button>

            </Card>
          </div>

        </div>

        {/* App Version Info */}
        <div className="text-center pb-8">
          <p className="text-[10px] text-content-placeholder font-bold uppercase tracking-[0.2em]">DigiDO v1.0.0-Prototype</p>
          <p className="text-[10px] text-content-placeholder mt-1">Made with ❤️ for UMKM Indonesia</p>
        </div>
      </div>
      
      <ConfirmLogoutModal 
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={onLogout}
      />

      {isReportModalOpen && user && (
        <ReportModal
          targetType="website"
          targetId={user.id}
          targetName="DigiDO System"
          onClose={() => setIsReportModalOpen(false)}
        />
      )}
    </PageTransition>
  );
}
