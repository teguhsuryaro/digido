# 09. Manajemen Pengguna (Mode Admin)

## Prioritas: 🟡 Sedang (Fitur Baru Admin)

Fitur ini terintegrasi dengan sistem laporan yang sudah ada (fase sebelumnya).

---

## Fitur Utama

Tambahkan halaman manajemen pengguna di dashboard admin yang memungkinkan tindakan moderasi.

---

## Pengelompokan Pengguna

### Tab/Filter di Halaman Manajemen

| Kelompok | Keterangan |
|----------|------------|
| **Klien (Pelanggan)** | Semua akun pengguna biasa |
| **Mitra** | Semua akun yang telah mendaftar sebagai mitra |

> **Catatan:** Satu akun dapat berada di kedua kelompok sekaligus (pelanggan yang juga mitra).

### Informasi yang Ditampilkan per Pengguna
- Nama lengkap
- Email
- Role (pelanggan/mitra/keduanya)
- Status akun (aktif/banned sementara/banned permanen)
- Tanggal registrasi
- Jumlah laporan yang diterima (link ke detail laporan)

---

## Tindakan Admin

### 1. Banned Sementara
- Pengguna tidak dapat mengakses **mode tertentu** (mitra atau pelanggan).
- Mode lain yang tidak diblokir tetap dapat digunakan.
- Saat login, tampilkan pesan:
  > Akun Anda sedang dibatasi untuk mode [mitra/pelanggan].

### 2. Banned Permanen
- Pengguna tidak dapat mengakses sistem secara keseluruhan.
- Saat login, tampilkan pesan:
  > Akun Anda telah dinonaktifkan secara permanen. Hubungi admin untuk informasi lebih lanjut.

### 3. Hapus Akun
- Akun dan **seluruh data terkait** dihapus dari sistem.
- Termasuk: profil, UMKM (jika mitra), produk, pesanan, laporan, dll.
- **Tindakan ini tidak dapat dibatalkan (irreversible).**

### Konfirmasi Tindakan
Semua tindakan administratif **wajib** melalui pop-up konfirmasi sebelum dieksekusi:
- Tampilkan deskripsi dampak tindakan.
- Untuk "Hapus Akun", minta admin mengetik nama user sebagai konfirmasi ekstra.

---

## Perubahan Database

### Tabel `profiles` — Tambah Kolom
| Kolom | Tipe | Default | Keterangan |
|-------|------|---------|------------|
| `ban_status` | `text` | `'active'` | `active` / `banned_pelanggan` / `banned_mitra` / `banned_permanent` |
| `ban_reason` | `text` | `null` | Alasan ban (opsional) |
| `banned_at` | `timestamptz` | `null` | Waktu ban |

### Perubahan RLS / Auth Logic
- Pada saat login, periksa `ban_status` dari `profiles`.
- Jika `banned_permanent` → tolak login, tampilkan pesan.
- Jika `banned_pelanggan` / `banned_mitra` → izinkan login tapi blokir akses ke mode tertentu via `RoleGuard`.

---

## Komponen Baru

| Komponen | Keterangan |
|----------|------------|
| `SuperadminUsers.tsx` | Halaman utama manajemen pengguna |
| `UserDetailModal.tsx` | Detail user + tindakan admin |
| `BanConfirmDialog.tsx` | Dialog konfirmasi ban |
| `DeleteUserDialog.tsx` | Dialog konfirmasi hapus akun (dengan input nama) |

---

## File yang Kemungkinan Terpengaruh

- `src/App.tsx` — route baru superadmin
- `src/components/layout/SuperadminLayout.tsx` — menu navigasi baru
- `src/components/guards/RoleGuard.tsx` — pengecekan ban_status
- `src/store/useAuthStore.ts` — pengecekan ban saat login

---

## Kriteria Selesai

- [ ] Halaman manajemen pengguna tersedia di dashboard admin
- [ ] Pengguna dapat dikelompokkan berdasarkan Klien dan Mitra
- [ ] Admin dapat melakukan banned sementara (per mode)
- [ ] Admin dapat melakukan banned permanen
- [ ] Admin dapat menghapus akun beserta seluruh data terkait
- [ ] Semua tindakan melalui pop-up konfirmasi
- [ ] Kolom `ban_status` ditambahkan ke tabel `profiles`
- [ ] Login flow memeriksa status ban
- [ ] User yang di-ban mendapat pesan yang jelas
