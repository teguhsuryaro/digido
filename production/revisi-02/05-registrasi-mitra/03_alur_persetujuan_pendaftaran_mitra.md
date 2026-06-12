# 03. Alur Persetujuan Pendaftaran Mitra

## Prioritas: 🟠 Tinggi (Fitur Inti)

Mengubah alur pendaftaran mitra dari otomatis diterima menjadi memerlukan persetujuan superadmin.

---

## Perubahan

### Alur Baru
```
Registrasi Mitra → Menunggu Persetujuan → Data Masuk ke Validasi Mitra (Superadmin) → Superadmin Meninjau → Terima / Tolak
```

### Perubahan Tombol di Sisi Pelanggan

| Status | Tampilan Tombol | Kondisi |
|--------|----------------|---------|
| Belum Mendaftar | "Daftar Jadi Mitra" | Aktif, bisa diklik |
| Sudah Mengirim Dokumen | "Menunggu Persetujuan" | Non-aktif (disabled) |
| Ditolak | "Daftar Jadi Mitra" | Aktif, bisa diklik ulang |
| Diterima | "Buka Mode Mitra" | Aktif, navigasi ke mode mitra |

---

## Implementasi Teknis

### Perubahan Database
Tabel `umkm` perlu kolom status persetujuan:
```sql
approval_status TEXT DEFAULT 'pending'  -- 'pending' | 'approved' | 'rejected'
rejection_reason TEXT                    -- alasan penolakan (jika ditolak)
```

### File yang Kemungkinan Terpengaruh
- `src/pages/auth/MitraRegisterPage.tsx` — submit form set status 'pending'
- `src/pages/customer/ProfilePage.tsx` — tampilkan tombol sesuai status
- `src/pages/superadmin/SuperadminMitraApproval.tsx` — halaman review + approve/reject
- `src/components/guards/RoleGuard.tsx` — logika pengecekan status approval
- `src/store/useAuthStore.ts` — state approval_status

### Logika di Sisi Pelanggan
```typescript
// Di ProfilePage, cek status pendaftaran mitra
const umkmData = await supabase.from('umkm').select('approval_status').eq('owner_id', user.id).single();

if (!umkmData.data) → "Daftar Jadi Mitra"
if (umkmData.data.approval_status === 'pending') → "Menunggu Persetujuan" (disabled)
if (umkmData.data.approval_status === 'rejected') → "Daftar Jadi Mitra"
if (umkmData.data.approval_status === 'approved') → "Buka Mode Mitra"
```

### Logika di Sisi Superadmin
- Halaman `SuperadminMitraApproval` sudah ada, perlu diperbarui untuk:
  - Menampilkan daftar pendaftar dengan status 'pending'.
  - Tombol Terima / Tolak per pendaftar.
  - Input alasan penolakan (jika ditolak).

---

## Kriteria Selesai

- [ ] Pendaftaran mitra tidak lagi otomatis diterima
- [ ] Status pendaftaran tersimpan di database (pending/approved/rejected)
- [ ] Tombol di profil pelanggan berubah sesuai status
- [ ] Superadmin dapat menerima/menolak pendaftaran
- [ ] Alasan penolakan dapat diisi dan dilihat
- [ ] Mitra yang ditolak bisa mendaftar ulang
