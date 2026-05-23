import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, Check, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from '@/components/ui/Toast';
import { formatRupiah } from '@/utils/format';
import PageTransition from '@/components/ui/PageTransition';
import Skeleton from '@/components/ui/Skeleton';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import QRISDisplay from '@/components/QRISDisplay';

interface Plan {
  id: string;
  name: string;
  duration_days: number;
  price: number;
  description: string;
}

interface ActiveSub {
  id: string;
  plan_name: string;
  expires_at: string;
}

export default function SubscriptionPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const [plans, setPlans] = useState<Plan[]>([]);
  const [activeSub, setActiveSub] = useState<ActiveSub | null>(null);
  const [umkmId, setUmkmId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        // 1. Get UMKM milik user
        const { data: umkm } = await supabase
          .from('umkm')
          .select('id')
          .eq('owner_id', user.id)
          .eq('is_active', true)
          .single();

        if (!umkm) return;
        setUmkmId((umkm as any).id);

        // 2. Get all plans
        const { data: plansData } = await supabase
          .from('subscription_plans')
          .select('*')
          .order('price');
        setPlans((plansData as any) || []);

        // 3. Get active subscription
        const { data: subData } = await supabase
          .from('subscriptions')
          .select('id, plan_id, expires_at, subscription_plans(name)')
          .eq('umkm_id', (umkm as any).id)
          .eq('status', 'active')
          .gte('expires_at', new Date().toISOString())
          .order('expires_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (subData) {
          setActiveSub({
            id: (subData as any).id,
            plan_name: (subData as any).subscription_plans?.name || 'Unknown',
            expires_at: (subData as any).expires_at,
          });
        }
      } catch (err) {
        console.error('Error fetching subscription data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user, refreshTrigger]);

  const handleSelectPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setShowPayment(true);
  };

  const handleConfirmPayment = async () => {
    if (!selectedPlan || !umkmId) return;

    setIsSubmitting(true);
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + selectedPlan.duration_days);

      const { error } = await supabase
        .from('subscriptions')
        .insert({
          umkm_id: umkmId,
          plan_id: selectedPlan.id,
          status: 'active',
          started_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
        } as any);

      if (error) throw error;

      toast.success(`Paket ${selectedPlan.name} berhasil diaktifkan!`);
      setShowPayment(false);
      setSelectedPlan(null);

      // Refresh data tanpa reload halaman penuh
      setRefreshTrigger(prev => prev + 1);
    } catch (err: any) {
      console.error('Payment Error:', err);
      toast.error(err.message || 'Gagal mengaktifkan paket. Coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-40 w-full rounded-card" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-64 w-full rounded-card" />)}
        </div>
      </div>
    );
  }

  // Modal Pembayaran
  if (showPayment && selectedPlan) {
    return (
      <PageTransition>
        <div className="max-w-lg mx-auto space-y-6 pb-20 md:pb-8">
          <button
            onClick={() => { setShowPayment(false); setSelectedPlan(null); }}
            className="flex items-center gap-2 text-sm text-content-secondary hover:text-content-primary transition-colors"
          >
            <ArrowLeft size={16} /> Kembali ke Pilihan Paket
          </button>

          <Card className="p-6 border-2 border-primary-500/30">
            <div className="text-center mb-6">
              <Crown size={40} className="text-yellow-500 mx-auto mb-2" />
              <h2 className="text-xl font-bold text-content-primary">Paket {selectedPlan.name}</h2>
              <p className="text-sm text-content-secondary mt-1">{selectedPlan.description}</p>
              <p className="text-2xl font-extrabold text-primary-500 mt-3">
                {formatRupiah(selectedPlan.price)}
              </p>
              <p className="text-xs text-content-placeholder">untuk {selectedPlan.duration_days} hari</p>
            </div>

            {/* Benefit List */}
            <div className="space-y-2 mb-6">
              <p className="text-xs font-bold uppercase tracking-widest text-content-placeholder">Benefit:</p>
              {[
                'Badge "Premium" di card toko Anda',
                'Tampil di section UMKM Premium di beranda',
                'Prioritas tampil di hasil pencarian',
              ].map((benefit, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-content-secondary">
                  <Check size={14} className="text-green-500 shrink-0" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>

            {/* QRIS Simulasi */}
            <QRISDisplay total={selectedPlan.price} />

            <Button
              variant="primary"
              fullWidth
              size="lg"
              className="mt-6 shadow-lg shadow-primary-500/30"
              onClick={handleConfirmPayment}
              isLoading={isSubmitting}
            >
              Konfirmasi Pembayaran
            </Button>

            <p className="text-[10px] text-content-placeholder text-center mt-3 italic">
              (Prototype: Pembayaran langsung dikonfirmasi tanpa verifikasi nyata)
            </p>
          </Card>
        </div>
      </PageTransition>
    );
  }

  // Halaman Utama — Pilihan Paket
  const planColors: Record<string, string> = {
    Bronze: 'from-amber-600 to-amber-700',
    Silver: 'from-slate-400 to-slate-500',
    Gold: 'from-yellow-400 to-yellow-600',
  };

  return (
    <PageTransition>
      <div className="max-w-3xl mx-auto space-y-8 pb-20 md:pb-8">
        <header>
          <h1 className="text-2xl font-bold text-content-primary flex items-center gap-2">
            <Crown size={24} className="text-yellow-500" /> Paket Premium
          </h1>
          <p className="text-content-secondary text-sm mt-1">
            Tingkatkan visibilitas toko Anda di DigiDO dengan paket premium.
          </p>
        </header>

        {/* Status Paket Aktif */}
        <Card className={`p-4 ${activeSub ? 'border-2 border-yellow-500/30 bg-yellow-500/5' : ''}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-content-placeholder">Paket Aktif</p>
              <p className="text-xl font-extrabold text-content-primary mt-1">
                {activeSub ? activeSub.plan_name : 'Free'}
              </p>
              {activeSub && (
                <p className="text-xs text-content-secondary mt-1">
                  Berlaku hingga: {new Date(activeSub.expires_at).toLocaleDateString('id-ID', {
                    day: 'numeric', month: 'long', year: 'numeric'
                  })}
                </p>
              )}
            </div>
            {activeSub && <Crown size={32} className="text-yellow-500" />}
          </div>
        </Card>

        {/* Grid Paket */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((plan) => {
            const isActive = activeSub?.plan_name === plan.name;
            return (
              <Card
                key={plan.id}
                className={`p-6 flex flex-col ${isActive ? 'border-2 border-primary-500 ring-2 ring-primary-500/20' : ''}`}
              >
                {/* Plan Header */}
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${planColors[plan.name] || 'from-gray-400 to-gray-500'} flex items-center justify-center text-white mb-4`}>
                  <Crown size={24} />
                </div>
                <h3 className="text-lg font-bold text-content-primary">{plan.name}</h3>
                <p className="text-xs text-content-secondary mt-1 flex-1">{plan.description}</p>

                <div className="mt-4">
                  <p className="text-2xl font-extrabold text-primary-500">{formatRupiah(plan.price)}</p>
                  <p className="text-[10px] text-content-placeholder">/ {plan.duration_days} hari</p>
                </div>

                <Button
                  variant={isActive ? 'secondary' : 'primary'}
                  fullWidth
                  className="mt-4"
                  disabled={isActive}
                  onClick={() => handleSelectPlan(plan)}
                >
                  {isActive ? 'Paket Aktif' : 'Pilih Paket'}
                </Button>
              </Card>
            );
          })}
        </div>
      </div>
    </PageTransition>
  );
}
