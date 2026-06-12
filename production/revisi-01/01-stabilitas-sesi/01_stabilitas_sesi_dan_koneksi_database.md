# 01. Stabilitas Sesi & Koneksi Database

## Prioritas: 🔴 Kritis (Fondasi)

Perbaikan ini harus dilakukan **pertama** karena menjadi fondasi stabilitas seluruh fitur lain.

---

## Permasalahan

Website terkadang kehilangan sesi terhadap database setelah beberapa waktu tidak digunakan.

### Dampak
- Halaman terus melakukan loading.
- Skeleton loading tampil tanpa henti.
- Pengguna harus menghapus history browser dan login ulang.

### Catatan
Kondisi ini berbeda dengan database kosong yang hanya menampilkan pesan:
> Belum ada data.

---

## Solusi yang Direncanakan

### 1. Auto Reconnect Supabase Client
- Deteksi kegagalan koneksi pada setiap request Supabase.
- Implementasi retry logic dengan exponential backoff.
- Tampilkan indikator "Mencoba menghubungkan kembali..." alih-alih skeleton infinite.

### 2. Refresh Token Otomatis
- Pastikan `supabase.auth.onAuthStateChange` menangani event `TOKEN_REFRESHED` dan `SIGNED_OUT` dengan benar.
- Tangani kasus token expired secara graceful (redirect ke login dengan pesan jelas, bukan blank screen).

### 3. Menjaga Sesi Tetap Aktif
- Implementasi heartbeat interval untuk menjaga koneksi tetap hidup.
- Gunakan `supabase.auth.getSession()` secara periodik untuk memvalidasi sesi.

### 4. Penanganan Kegagalan Koneksi
- Tambahkan error boundary global yang menangkap network errors.
- Tampilkan UI fallback yang informatif (bukan blank/infinite loading).
- Tombol "Coba Lagi" untuk retry manual.

---

## File yang Kemungkinan Terpengaruh

- `src/lib/supabase.ts` — konfigurasi client
- `src/store/useAuthStore.ts` — state management auth
- `src/App.tsx` — auth listener & error boundary
- Seluruh halaman yang melakukan fetch data (fallback UI)

---

## Kriteria Selesai

- [ ] Sesi tidak hilang setelah idle 30+ menit
- [ ] Token refresh berjalan otomatis tanpa intervensi user
- [ ] Koneksi gagal ditangani dengan UI yang informatif (bukan infinite skeleton)
- [ ] User tidak perlu clear history untuk login ulang
