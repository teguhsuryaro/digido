import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from '@/components/ui/Toast';
import { Lightbulb, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PageTransition from '@/components/ui/PageTransition';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import LocationPicker from '@/components/LocationPicker';

const DAYS = [
  { key: 'monday', label: 'Senin' },
  { key: 'tuesday', label: 'Selasa' },
  { key: 'wednesday', label: 'Rabu' },
  { key: 'thursday', label: 'Kamis' },
  { key: 'friday', label: 'Jumat' },
  { key: 'saturday', label: 'Sabtu' },
  { key: 'sunday', label: 'Minggu' },
];

interface ScheduleItem {
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

export default function OperasionalPage() {
  const user = useAuthStore((s) => s.user);
  const authVersion = useAuthStore((s) => s.authVersion);
  const navigate = useNavigate();
  const [umkm, setUmkm] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [schedule, setSchedule] = useState<Record<string, ScheduleItem>>({});
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [overrideStatus, setOverrideStatus] = useState<boolean | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!user) return;
        const { data, error } = await supabase
          .from('umkm')
          .select('*')
          .eq('owner_id', user.id)
          .maybeSingle();

        if (error) throw error;
        setUmkm(data);
        
        // Initialize form
        const umkmData = data as any;
        setLocation({ lat: umkmData.latitude, lng: umkmData.longitude });
        setOverrideStatus(umkmData.is_override_open);
        
        const initialSchedule = umkmData.operating_hours || DAYS.reduce((acc, day) => ({
          ...acc,
          [day.key]: { isOpen: true, openTime: '08:00', closeTime: '17:00' }
        }), {});
        setSchedule(initialSchedule);

      } catch (err) {
        console.error('Error fetching operational data:', err);
        toast.error('Gagal memuat data operasional.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user?.id, authVersion]);

  const handleSave = async () => {
    if (!umkm || !location) return;
    setIsSaving(true);

    try {
      const { error } = await supabase
        .from('umkm')
        .update({
          operating_hours: schedule,
          latitude: location.lat,
          longitude: location.lng,
          is_override_open: overrideStatus,
          // If override is set, force is_open to match it
          ...(overrideStatus !== null && { is_open: overrideStatus })
        } as any)
        .eq('id', umkm.id);

      if (error) throw error;
      toast.success('Pengaturan operasional berhasil disimpan.');
    } catch (err) {
      toast.error('Gagal menyimpan pengaturan.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOverride = async (status: boolean | null) => {
    setOverrideStatus(status);
    // Auto-save override status for instant feedback
    try {
      const { error } = await supabase
        .from('umkm')
        .update({ 
          is_override_open: status,
          ...(status !== null && { is_open: status })
        } as any)
        .eq('id', umkm.id);

      if (error) throw error;
      toast.success(
        status === true ? 'Toko dipaksa BUKA.' : 
        status === false ? 'Toko dipaksa TUTUP.' : 
        'Toko kembali mengikuti JADWAL.'
      );
    } catch (err) {
      toast.error('Gagal memperbarui status darurat.');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full rounded-card" />
        <Skeleton className="h-96 w-full rounded-card" />
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto space-y-8 pb-20 md:pb-8">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <button onClick={() => navigate('/mitra/pengaturan')} className="flex items-center gap-2 text-content-secondary hover:text-content-primary font-medium w-fit transition-colors">
            <ChevronLeft size={20} />
            Kembali ke Pengaturan
          </button>
          <div>
            <h1 className="text-2xl font-black text-content-primary">Operasional Toko</h1>
            <p className="text-sm text-content-secondary mt-1">Kelola jadwal buka tutup dan lokasi toko Anda.</p>
          </div>
        </div>

        {/* Emergency Override */}
        <section className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-content-placeholder px-1">Status Darurat</h2>
          <Card className="p-6 border-border flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full animate-pulse ${umkm.is_open ? 'bg-green-500' : 'bg-red-500'}`} />
                <p className="font-bold text-content-primary">
                  Saat ini: {umkm.is_open ? 'BUKA' : 'TUTUP'}
                </p>
              </div>
              <p className="text-xs text-content-secondary">
                {overrideStatus === null ? 'Mengikuti jadwal otomatis.' : 'Status dikunci secara manual.'}
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant={overrideStatus === true ? 'primary' : 'secondary'} 
                size="sm"
                onClick={() => handleOverride(true)}
              >
                Buka Paksa
              </Button>
              <Button 
                variant={overrideStatus === false ? 'danger' : 'secondary'} 
                size="sm"
                onClick={() => handleOverride(false)}
              >
                Tutup Paksa
              </Button>
              <Button 
                variant={overrideStatus === null ? 'accent' : 'ghost'} 
                size="sm"
                onClick={() => handleOverride(null)}
              >
                Ikuti Jadwal
              </Button>
            </div>
          </Card>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Schedule Form */}
          <section className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-content-placeholder px-1">Jadwal Mingguan</h2>
            <Card className="p-4 border-border space-y-4">
              {DAYS.map((day) => {
                const item = schedule[day.key] || { isOpen: false, openTime: '08:00', closeTime: '17:00' };
                return (
                  <div key={day.key} className="flex items-center gap-4 py-2 first:pt-0 last:pb-0 border-b last:border-0 border-border/50">
                    <div className="w-20">
                      <p className="text-sm font-bold text-content-primary">{day.label}</p>
                    </div>
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 rounded-md border-border text-primary-500 focus:ring-primary-500"
                      checked={item.isOpen}
                      onChange={(e) => setSchedule({
                        ...schedule,
                        [day.key]: { ...item, isOpen: e.target.checked }
                      })}
                      aria-label={`Jadwal untuk ${day.label}`}
                    />
                    <div className={`flex items-center gap-2 flex-1 ${!item.isOpen ? 'opacity-30 pointer-events-none' : ''}`}>
                      <input 
                        type="time" 
                        className="flex-1 p-2 bg-surface-secondary border border-border rounded-lg text-xs"
                        value={item.openTime}
                        onChange={(e) => setSchedule({
                          ...schedule,
                          [day.key]: { ...item, openTime: e.target.value }
                        })}
                        aria-label={`Waktu buka ${day.label}`}
                      />
                      <span className="text-content-placeholder">-</span>
                      <input 
                        type="time" 
                        className="flex-1 p-2 bg-surface-secondary border border-border rounded-lg text-xs"
                        value={item.closeTime}
                        onChange={(e) => setSchedule({
                          ...schedule,
                          [day.key]: { ...item, closeTime: e.target.value }
                        })}
                        aria-label={`Waktu tutup ${day.label}`}
                      />
                    </div>
                  </div>
                );
              })}
            </Card>
          </section>

          {/* Location Update */}
          <section className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-content-placeholder px-1">Lokasi Jualan</h2>
            <Card className="p-4 border-border overflow-hidden">
              <div className="h-[440px] -mx-4 -mt-4 mb-4">
                <LocationPicker 
                  value={location}
                  onChange={(lat, lng) => setLocation({ lat, lng })}
                />
              </div>
              <p className="text-xs text-content-secondary leading-relaxed bg-primary-50 dark:bg-primary-950/20 p-3 rounded-lg border border-primary-100 dark:border-primary-900/30 flex items-start gap-1.5">
                <Lightbulb size={14} className="text-primary-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Penting:</strong> Bagi pedagang keliling, selalu perbarui lokasi Anda agar pelanggan terdekat dapat menemukan toko Anda di peta.
                </span>
              </p>
            </Card>
          </section>
        </div>

        {/* Action Button */}
        <div className="fixed bottom-20 left-0 right-0 p-4 bg-surface-card border-t border-border flex justify-center z-30 md:static md:bg-transparent md:border-0 md:p-0">
          <Button 
            variant="primary" 
            size="lg" 
            className="w-full md:w-80 shadow-lg shadow-primary-500/20"
            isLoading={isSaving}
            onClick={handleSave}
          >
            Simpan Perubahan
          </Button>
        </div>
      </div>
    </PageTransition>
  );
}
