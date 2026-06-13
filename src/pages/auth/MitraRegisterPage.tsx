import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Store, QrCode, Lightbulb, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { uploadFile } from '@/lib/supabase-helpers';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from '@/components/ui/Toast';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import PageTransition from '@/components/ui/PageTransition';
import LocationPicker from '@/components/LocationPicker';

interface UMKMFormData {
  name: string;
  businessType: string;
  description: string;
  latitude: number | null;
  longitude: number | null;
  // ===== FIELD BARU =====
  shopPhotoFile: File | null;       // Foto profil toko
  phoneNumber: string;              // Nomor HP Toko (Menggantikan WhatsApp)
  // ===== END FIELD BARU =====
  ktpFile: File | null;
  businessPhotoFile: File | null;
  qrisFile: File | null;
  faqs: Array<{ question: string; answer: string }>;
}

const INITIAL_DATA: UMKMFormData = {
  name: '', businessType: '', description: '',
  latitude: null, longitude: null,
  shopPhotoFile: null,
  phoneNumber: '',
  ktpFile: null, businessPhotoFile: null, qrisFile: null,
  faqs: [
    { question: 'Apa menu andalan di sini?', answer: '' },
    { question: 'Apakah menerima pesanan partai besar?', answer: '' },
    { question: 'Apakah bisa custom tingkat kepedasan?', answer: '' },
    { question: 'Berapa lama estimasi pembuatan makanan?', answer: '' },
    { question: 'Apakah bahan yang digunakan halal?', answer: '' },
  ],
};

const STEPS = ['Data UMKM', 'Dokumen', 'FAQ Chatbot', 'Preview'];

export default function MitraRegisterPage() {
  const navigate = useNavigate();
  const { user, profile, setProfile } = useAuthStore();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<UMKMFormData>(INITIAL_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect jika user sudah merupakan mitra aktif
  useEffect(() => {
    if (profile?.role === 'mitra') {
      navigate('/mitra', { replace: true });
    } else if (profile && !data.phoneNumber && profile.phone) {
      setData(prev => ({ ...prev, phoneNumber: profile.phone! }));
    }
  }, [profile, navigate]);

  const ktpInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const qrisInputRef = useRef<HTMLInputElement>(null);
  const shopPhotoInputRef = useRef<HTMLInputElement>(null);

  const handleNext = () => {
    // Validation for Step 0
    if (step === 0) {
      if (!data.name || !data.businessType || !data.latitude || !data.longitude) {
        toast.warning('Mohon lengkapi data toko dan lokasi.');
        return;
      }
      // VALIDASI BARU
      if (!data.shopPhotoFile) {
        toast.warning('Mohon unggah foto profil toko.');
        return;
      }
      if (!data.phoneNumber || data.phoneNumber.trim().length < 10) {
        toast.warning('Mohon masukkan nomor HP yang valid (minimal 10 digit).');
        return;
      }
    }
    // Validation for Step 1
    if (step === 1) {
      if (!data.ktpFile || !data.businessPhotoFile || !data.qrisFile) {
        toast.warning('Mohon unggah semua dokumen yang diperlukan.');
        return;
      }
    }
    // Validation for Step 2
    if (step === 2) {
      const isFaqComplete = data.faqs.every(f => f.question && f.answer);
      if (!isFaqComplete) {
        toast.warning('Mohon lengkapi semua 5 FAQ untuk chatbot.');
        return;
      }
    }
    setStep(prev => prev + 1);
  };

  const handleSubmit = async () => {
    if (!user) return;
    setIsSubmitting(true);
    let umkmId: string | null = null;

    try {
      // 0. Bersihkan data pendaftaran toko menggantung (incomplete) milik user jika ada
      const { data: existingUmkm } = await supabase
        .from('umkm')
        .select('*')
        .eq('owner_id', user.id)
        .eq('is_active', false)
        .maybeSingle();

      if (existingUmkm) {
        console.log('Membersihkan sisa pendaftaran toko menggantung:', (existingUmkm as any).id);
        await supabase
          .from('umkm')
          .delete()
          .eq('id', (existingUmkm as any).id);
      }

      // 1. Insert UMKM
      const { data: umkm, error: umkmError } = await supabase
        .from('umkm')
        .insert({
          owner_id: user.id,
          name: data.name,
          business_type: data.businessType,
          description: data.description,
          latitude: data.latitude,
          longitude: data.longitude,
          whatsapp_number: data.phoneNumber,
          is_open: false,
          has_delivery: false,
          is_active: false,
        } as any)
        .select()
        .single();

      if (umkmError) throw umkmError;
      umkmId = (umkm as any).id;

      // 2. Upload dokumen
      const uploadPromises: Promise<any>[] = [];

      if (data.ktpFile) {
        uploadPromises.push(
          uploadFile('documents', `${(umkm as any).id}/ktp-${Date.now()}`, data.ktpFile)
            .then((url) => {
              if (url) return supabase.from('umkm_documents').insert({ umkm_id: (umkm as any).id, document_type: 'ktp', file_url: url });
            })
        );
      }

      if (data.businessPhotoFile) {
        uploadPromises.push(
          uploadFile('business-photos', `${(umkm as any).id}/photo-${Date.now()}`, data.businessPhotoFile)
            .then((url) => {
              if (url) return supabase.from('umkm_documents').insert({ umkm_id: (umkm as any).id, document_type: 'business_photo', file_url: url });
            })
        );
      }

      if (data.qrisFile) {
        uploadPromises.push(
          uploadFile('qris', `${(umkm as any).id}/qris-${Date.now()}`, data.qrisFile)
            .then((url) => {
              if (url) {
                return Promise.all([
                  supabase.from('umkm_documents').insert({ umkm_id: (umkm as any).id, document_type: 'qris', file_url: url }),
                  supabase.from('umkm').update({ qris_image_url: url } as any).eq('id', (umkm as any).id),
                ]);
              }
            })
        );
      }

      if (data.shopPhotoFile) {
        uploadPromises.push(
          uploadFile('business-photos', `${(umkm as any).id}/shop-profile-${Date.now()}`, data.shopPhotoFile)
            .then((url) => {
              if (url) {
                return supabase
                  .from('umkm')
                  .update({ photo_url: url } as any)
                  .eq('id', (umkm as any).id);
              }
            })
        );
      }

      await Promise.all(uploadPromises);

      // 3. Insert FAQ
      const faqInserts = data.faqs
        .filter((faq) => faq.question && faq.answer)
        .map((faq, index) => ({
          umkm_id: (umkm as any).id,
          question: faq.question,
          answer: faq.answer,
          sort_order: index + 1,
        }));

      if (faqInserts.length > 0) {
        await supabase.from('umkm_faq').insert(faqInserts);
      }

      // 4. Insert default delivery settings
      await supabase.from('delivery_settings').insert({
        umkm_id: (umkm as any).id,
        is_active: false,
        max_radius_km: 5.0,
        fee_type: 'free',
      } as any);

      // 5. Update role ke mitra dan set nomor handphone jika sebelumnya kosong
      const profileUpdates: any = { role: 'mitra' };
      if (!profile?.phone) {
        profileUpdates.phone = data.phoneNumber;
      }

      await supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('id', user.id);

      // 5.5. Set is_active = true and complete the registration
      await supabase
        .from('umkm')
        .update({ 
          is_active: true,
          registration_completed_at: new Date().toISOString()
        } as any)
        .eq('id', umkmId);

      // 6. Update local profile store
      if (profile) {
        setProfile({ 
          ...profile, 
          role: 'mitra',
          ...( !profile.phone ? { phone: data.phoneNumber } : {} )
        });
      }

      toast.success('Pendaftaran mitra berhasil! Selamat berjualan.');
      navigate('/mitra');
    } catch (err: any) {
      if (umkmId) {
        // CLEANUP: Hapus UMKM jika proses pendaftaran gagal di tengah jalan
        await supabase.from('umkm').delete().eq('id', umkmId);
      }
      console.error('Registration error:', err);
      toast.error(err.message || 'Gagal mendaftarkan toko.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageTransition>
      <div className="max-w-2xl mx-auto py-8 px-4 pb-20 md:pb-8">
        <header className="mb-8 text-center sm:text-left flex flex-col sm:flex-row items-center sm:items-start gap-4">
          <img src="/logo.png" alt="DigiDO Logo" className="h-16 w-16 object-contain shrink-0" />
          <div>
            <h1 className="text-3xl font-black text-content-primary">Gabung Sebagai Mitra</h1>
            <p className="text-content-secondary mt-1">Lengkapi data untuk mulai berjualan di DigiDO.</p>
          </div>
        </header>

        {/* Progress Bar */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
          {STEPS.map((label, i) => (
            <div key={label} className="flex-1 min-w-[75px]">
              <div className={`h-1.5 rounded-full transition-all duration-500 ${i <= step ? 'bg-primary-500' : 'bg-surface-secondary'}`} />
              <p className={`text-[9px] sm:text-[10px] uppercase font-black tracking-tighter sm:tracking-widest mt-2 whitespace-nowrap text-center sm:text-left ${i <= step ? 'text-primary-500' : 'text-content-placeholder'}`}>
                {label}
              </p>
            </div>
          ))}
        </div>

        <Card className="p-6 md:p-8 border-border shadow-soft">
          {/* STEP 0: Data UMKM */}
          {step === 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Left Column */}
              <div className="space-y-6">
                <Input 
                  label="Nama Toko" 
                  placeholder="Contoh: Warung Berkah" 
                  value={data.name}
                  onChange={(e) => setData({ ...data, name: e.target.value })}
                />
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-content-secondary uppercase tracking-widest px-1">Jenis Usaha</label>
                  <select 
                    className="w-full p-4 rounded-card bg-surface-secondary border border-border text-sm outline-none focus:ring-2 focus:ring-primary-500/20"
                    value={data.businessType}
                    onChange={(e) => setData({ ...data, businessType: e.target.value })}
                    aria-label="Pilih jenis usaha"
                  >
                    <option value="">Pilih Jenis Usaha</option>
                    <option value="Kuliner">Kuliner</option>
                    <option value="Sembako">Sembako</option>
                    <option value="Kerajinan">Kerajinan</option>
                    <option value="Jasa">Jasa</option>
                  </select>
                </div>
                <div>
                  <Input
                    label="Nomor Handphone Toko"
                    placeholder="Contoh: 081234567890"
                    value={data.phoneNumber}
                    onChange={(e) => setData({ ...data, phoneNumber: e.target.value })}
                    disabled={!!profile?.phone}
                    required
                  />
                  <p className="text-[10px] text-content-placeholder px-1 mt-1.5">
                    {profile?.phone 
                      ? 'Tersinkronisasi otomatis dengan nomor handphone profil Anda.' 
                      : 'Nomor ini akan digunakan sebagai kontak utama WhatsApp toko sekaligus disimpan di profil Anda.'}
                  </p>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-content-secondary uppercase tracking-widest px-1">Deskripsi Singkat</label>
                  <textarea 
                    className="w-full p-4 rounded-card bg-surface-secondary border border-border text-sm outline-none focus:ring-2 focus:ring-primary-500/20 min-h-[120px] resize-none"
                    placeholder="Jelaskan apa yang Anda jual..."
                    value={data.description}
                    onChange={(e) => setData({ ...data, description: e.target.value })}
                    aria-label="Deskripsi toko"
                  />
                </div>
                
                {/* Foto Profil Toko */}
                <div className="space-y-1.5">
                  <p className="text-xs font-bold uppercase tracking-widest text-content-secondary px-1">
                    Foto Profil Toko <span className="text-red-500">*</span>
                  </p>
                  <div
                    onClick={() => shopPhotoInputRef.current?.click()}
                    className={`h-32 rounded-card border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors overflow-hidden relative ${
                      data.shopPhotoFile
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/20'
                        : 'border-border bg-surface-secondary hover:border-primary-500'
                    }`}
                  >
                    {data.shopPhotoFile ? (
                      <>
                        <img
                          src={URL.createObjectURL(data.shopPhotoFile)}
                          alt="Preview foto toko"
                          className="absolute inset-0 w-full h-full object-cover opacity-30"
                        />
                        <p className="text-xs font-bold text-primary-500 flex items-center gap-1 z-10">
                          <CheckCircle size={14} /> Foto Terpilih
                        </p>
                      </>
                    ) : (
                      <>
                        <Store size={24} className="text-content-placeholder mb-1" />
                        <span className="text-[10px] font-bold text-content-placeholder text-center px-4">KLIK UNTUK UPLOAD FOTO TOKO</span>
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    ref={shopPhotoInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => setData({ ...data, shopPhotoFile: e.target.files?.[0] || null })}
                  />
                  <p className="text-[10px] text-content-placeholder px-1 mt-1">
                    Upload foto logo atau gerai UMKM. Foto ini akan muncul di card katalog.
                  </p>
                </div>
              </div>

              {/* Full Width */}
              <div className="md:col-span-2 pt-2">
                <LocationPicker 
                  value={data.latitude ? { lat: data.latitude, lng: data.longitude! } : null}
                  onChange={(lat, lng) => setData({ ...data, latitude: lat, longitude: lng })}
                />
              </div>
            </div>
          )}

          {/* STEP 1: Dokumen */}
          {step === 1 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* KTP */}
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-widest text-content-secondary">Foto KTP Pemilik</p>
                  <div 
                    onClick={() => ktpInputRef.current?.click()}
                    className={`h-40 rounded-card border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors overflow-hidden relative ${data.ktpFile ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/20' : 'border-border bg-surface-secondary hover:border-primary-500'}`}
                  >
                    {data.ktpFile ? (
                      <p className="text-xs font-bold text-primary-500 flex items-center gap-1">
                        <CheckCircle size={14} /> KTP Terpilih
                      </p>
                    ) : (
                      <>
                        <FileText size={28} className="text-content-placeholder mb-1" />
                        <span className="text-[10px] font-bold text-content-placeholder">KLIK UNTUK UPLOAD</span>
                      </>
                    )}
                  </div>
                  <input type="file" ref={ktpInputRef} className="hidden" accept="image/*" onChange={(e) => setData({ ...data, ktpFile: e.target.files?.[0] || null })} />
                </div>

                {/* Business Photo */}
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-widest text-content-secondary">Foto Tempat Usaha</p>
                  <div 
                    onClick={() => photoInputRef.current?.click()}
                    className={`h-40 rounded-card border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors overflow-hidden relative ${data.businessPhotoFile ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/20' : 'border-border bg-surface-secondary hover:border-primary-500'}`}
                  >
                    {data.businessPhotoFile ? (
                      <p className="text-xs font-bold text-primary-500 flex items-center gap-1">
                        <CheckCircle size={14} /> Foto Terpilih
                      </p>
                    ) : (
                      <>
                        <Store size={28} className="text-content-placeholder mb-1" />
                        <span className="text-[10px] font-bold text-content-placeholder">KLIK UNTUK UPLOAD</span>
                      </>
                    )}
                  </div>
                  <input type="file" ref={photoInputRef} className="hidden" accept="image/*" onChange={(e) => setData({ ...data, businessPhotoFile: e.target.files?.[0] || null })} />
                </div>
              </div>

              {/* QRIS */}
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-widest text-content-secondary">Gambar QRIS Pembayaran</p>
                <div 
                  onClick={() => qrisInputRef.current?.click()}
                  className={`h-40 rounded-card border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors overflow-hidden relative ${data.qrisFile ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/20' : 'border-border bg-surface-secondary hover:border-primary-500'}`}
                >
                  {data.qrisFile ? (
                    <p className="text-xs font-bold text-primary-500 flex items-center gap-1">
                      <CheckCircle size={14} /> QRIS Terpilih
                    </p>
                  ) : (
                    <>
                      <QrCode size={28} className="text-content-placeholder mb-1" />
                      <span className="text-[10px] font-bold text-content-placeholder">KLIK UNTUK UPLOAD QRIS</span>
                    </>
                  )}
                </div>
                <input type="file" ref={qrisInputRef} className="hidden" accept="image/*" onChange={(e) => setData({ ...data, qrisFile: e.target.files?.[0] || null })} />
              </div>
            </div>
          )}

          {/* STEP 2: FAQ */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-primary-50 dark:bg-primary-950/20 p-4 rounded-card border border-primary-100 dark:border-primary-900/30 mb-4 flex items-start gap-1.5">
                <Lightbulb size={16} className="text-primary-500 shrink-0 mt-0.5" />
                <p className="text-xs text-primary-700 dark:text-primary-400 leading-relaxed">
                  <strong>Tips:</strong> Isi FAQ ini untuk membantu Chatbot AI menjawab pertanyaan pelanggan Anda secara otomatis.
                </p>
              </div>
              <div className="space-y-6 divide-y divide-border">
                {data.faqs.map((faq, idx) => (
                  <div key={idx} className="pt-6 first:pt-0 space-y-4">
                    <p className="text-[10px] font-black text-primary-500 uppercase tracking-tighter">Pertanyaan #{idx + 1}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input 
                        placeholder="Pertanyaan" 
                        value={faq.question}
                        onChange={(e) => {
                          const newFaqs = [...data.faqs];
                          newFaqs[idx].question = e.target.value;
                          setData({ ...data, faqs: newFaqs });
                        }}
                      />
                      <textarea 
                        className="w-full p-4 rounded-card bg-surface-secondary border border-border text-sm outline-none focus:ring-2 focus:ring-primary-500/20 min-h-[50px] resize-none"
                        placeholder="Jawaban"
                        value={faq.answer}
                        onChange={(e) => {
                          const newFaqs = [...data.faqs];
                          newFaqs[idx].answer = e.target.value;
                          setData({ ...data, faqs: newFaqs });
                        }}
                        aria-label={`Jawaban FAQ ${idx + 1}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: Preview */}
          {step === 3 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <section className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-widest text-content-placeholder px-1">Ringkasan Data UMKM</p>
                <div className="bg-surface-secondary p-4 rounded-card space-y-2">
                  <p className="text-sm"><strong>Nama:</strong> {data.name}</p>
                  <p className="text-sm"><strong>Jenis:</strong> {data.businessType}</p>
                  <p className="text-sm"><strong>Lokasi:</strong> {data.latitude?.toFixed(4)}, {data.longitude?.toFixed(4)}</p>
                  <p className="text-sm"><strong>WhatsApp:</strong> {data.phoneNumber}</p>
                  <p className="text-sm"><strong>Foto Toko:</strong> {data.shopPhotoFile ? '✅ Terlampir' : '❌ Belum ada'}</p>
                </div>
              </section>

              <section className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-widest text-content-placeholder px-1">Dokumen Terlampir</p>
                <div className="flex gap-2">
                  {['KTP', 'Foto Usaha', 'QRIS'].map(doc => (
                    <div key={doc} className="flex-1 py-2 px-3 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 text-[10px] font-bold rounded-full text-center border border-green-100 dark:border-green-900/30">
                      ✅ {doc} Siap
                    </div>
                  ))}
                </div>
              </section>

              <div className="bg-yellow-50 dark:bg-yellow-950/20 p-4 rounded-card border border-yellow-100 dark:border-yellow-900/30">
                <p className="text-xs text-yellow-800 dark:text-yellow-500 leading-relaxed italic">
                  "Dengan mengklik tombol submit, saya menyatakan bahwa data yang diberikan adalah benar dan saya setuju dengan syarat dan ketentuan DigiDO."
                </p>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3 mt-10 border-t border-border pt-8">
            {step > 0 && (
              <Button 
                variant="secondary" 
                fullWidth 
                onClick={() => setStep(step - 1)}
                disabled={isSubmitting}
              >
                Kembali
              </Button>
            )}
            {step < STEPS.length - 1 ? (
              <Button variant="primary" fullWidth onClick={handleNext}>
                Lanjutkan
              </Button>
            ) : (
              <Button 
                variant="primary" 
                fullWidth 
                isLoading={isSubmitting}
                onClick={handleSubmit}
                className="shadow-lg shadow-primary-500/30"
              >
                Submit & Mulai Berjualan
              </Button>
            )}
          </div>
        </Card>
      </div>
    </PageTransition>
  );
}
