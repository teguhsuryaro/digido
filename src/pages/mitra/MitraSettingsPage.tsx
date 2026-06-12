import { useNavigate } from 'react-router-dom';
import { User, Settings, Truck, CreditCard, Shield, Package, ShoppingBag } from 'lucide-react';
import PageTransition from '@/components/ui/PageTransition';
import Card from '@/components/ui/Card';
import ThemeToggle from '@/components/ui/ThemeToggle';

export default function MitraSettingsPage() {
  const navigate = useNavigate();

  const settingsItems = [
    { to: '/mitra/pengaturan/profil', label: 'Profil Toko', desc: 'Edit nama, deskripsi, foto', icon: User },
    { to: '/mitra/pengaturan/operasional', label: 'Operasional', desc: 'Jam buka, status toko', icon: Settings },
    { to: '/mitra/pengaturan/pengiriman', label: 'Pengiriman', desc: 'Radius, tarif delivery', icon: Truck },
    { to: '/mitra/pengaturan/finansial', label: 'Keuangan', desc: 'Statistik & penarikan saldo', icon: CreditCard },
    { to: '/mitra/pengaturan/langganan', label: 'Langganan', desc: 'Paket premium', icon: Shield },
    { to: '/mitra/pengaturan/katalog', label: 'Katalog', desc: 'Manajemen produk', icon: Package },
  ];

  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto space-y-8 pb-20 md:pb-8">
        <div>
          <h1 className="text-2xl font-black text-content-primary">Pengaturan Utama</h1>
          <p className="text-sm text-content-secondary mt-1">Kelola seluruh konfigurasi toko Anda di sini.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {settingsItems.map(item => {
            const Icon = item.icon;
            return (
              <Card 
                key={item.to}
                className="p-4 border-border hover:border-primary-500/50 cursor-pointer transition-colors group flex items-start gap-4"
                onClick={() => navigate(item.to)}
              >
                <div className="w-10 h-10 rounded-full bg-surface-secondary text-content-secondary group-hover:bg-primary-50 group-hover:text-primary-500 flex items-center justify-center shrink-0 transition-colors">
                  <Icon size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-content-primary group-hover:text-primary-500 transition-colors text-sm">{item.label}</h3>
                  <p className="text-xs text-content-secondary mt-0.5">{item.desc}</p>
                </div>
              </Card>
            );
          })}
        </div>

        <hr className="border-border" />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Theme Toggle */}
          <Card className="p-0 overflow-hidden border-border">
            <div className="p-4 flex items-center justify-between border-b border-border hover:bg-surface-secondary/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-950/30 flex items-center justify-center text-indigo-600 shrink-0">
                  <Shield size={20} />
                </div>
                <div>
                  <p className="font-bold text-content-primary text-sm">Tema Aplikasi</p>
                  <p className="text-[10px] text-content-secondary">Pilih tema terang atau gelap</p>
                </div>
              </div>
              <ThemeToggle />
            </div>
          </Card>

          {/* Switch to Shop Mode */}
          <Card 
            className="p-4 border-border hover:border-primary-500/50 cursor-pointer transition-colors group flex items-start gap-4 bg-primary-50/50 dark:bg-primary-950/20"
            onClick={() => navigate('/')}
          >
            <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-500 dark:bg-primary-900/50 flex items-center justify-center shrink-0">
              <ShoppingBag size={20} />
            </div>
            <div>
              <h3 className="font-bold text-primary-500 text-sm">Beralih ke Mode Belanja</h3>
              <p className="text-xs text-content-secondary mt-0.5">Kembali sebagai pelanggan</p>
            </div>
          </Card>
        </div>
      </div>
    </PageTransition>
  );
}
