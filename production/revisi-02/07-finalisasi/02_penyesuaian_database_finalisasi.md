# 02. Penyesuaian Database Finalisasi (Batch 2)

## Prioritas: 🟢 Rendah (Finalisasi)

Memastikan struktur database mendukung seluruh perubahan yang diimplementasikan pada Batch 2.

---

## Hal yang Perlu Diperiksa

### Kolom Baru
- [ ] `umkm.withdrawal_method` — metode pencairan (qris/ewallet/bank)
- [ ] `umkm.withdrawal_provider` — provider (gopay/ovo/dana/bca/bri/bsi/seabank)
- [ ] `umkm.withdrawal_account` — nomor akun/rekening
- [ ] `umkm.withdrawal_qris_url` — URL foto QRIS
- [ ] `umkm.approval_status` — status persetujuan mitra (pending/approved/rejected)
- [ ] `umkm.rejection_reason` — alasan penolakan
- [ ] `withdrawals.admin_fee` — biaya admin pencairan
- [ ] `withdrawals.method` — metode pencairan
- [ ] `withdrawals.provider` — provider
- [ ] `withdrawals.destination` — tujuan pencairan

### RLS Policies
- [ ] Policy untuk tabel `withdrawals` sudah sesuai
- [ ] Policy untuk tabel `umkm` mendukung alur approval
- [ ] Mitra hanya bisa melihat data mereka sendiri
- [ ] Superadmin bisa mengakses semua data

### Index Database
- [ ] Index pada `umkm.owner_id`
- [ ] Index pada `umkm.approval_status`
- [ ] Index pada `withdrawals.umkm_id`

---

## Query Verifikasi

```sql
-- Cek kolom metode pencairan di umkm
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'umkm' AND column_name IN ('withdrawal_method', 'approval_status');

-- Cek kolom tambahan di withdrawals
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'withdrawals' AND column_name IN ('admin_fee', 'method', 'provider', 'destination');

-- Cek RLS aktif
SELECT tablename, rowsecurity FROM pg_tables 
WHERE tablename IN ('umkm', 'withdrawals', 'orders', 'profiles');
```

---

## Kriteria Selesai

- [ ] Semua kolom baru sudah ditambahkan
- [ ] RLS policies sudah diperbarui
- [ ] Index database sudah dibuat
- [ ] Query verifikasi mengembalikan hasil yang benar
- [ ] Tidak ada foreign key constraint yang rusak
