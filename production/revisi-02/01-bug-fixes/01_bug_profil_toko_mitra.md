# 01. Bug: Profil Toko di Pengaturan Mitra

## Prioritas: 🔴 Tinggi (Bug Kritis)

Memperbaiki bug yang menyebabkan data toko tidak dapat dimuat saat membuka halaman Profil Toko di pengaturan mitra.

---

## Permasalahan

Saat menekan **"Profil Toko"** di pengaturan mitra:
1. Muncul alert: **"Gagal memuat data toko"**
2. Halaman hanya menampilkan teks: **"Data toko tidak ditemukan."**

---

## Investigasi yang Diperlukan

### Kemungkinan Penyebab
- Query Supabase gagal mengambil data `umkm` berdasarkan `owner_id`.
- RLS (Row Level Security) memblokir akses baca ke tabel `umkm`.
- Relasi antara `profiles.id` dan `umkm.owner_id` tidak cocok.
- State `profile` belum tersedia saat komponen melakukan fetch.

### Langkah Investigasi
1. Periksa komponen `MitraProfilePage.tsx` — logika fetch dan error handling.
2. Periksa query Supabase — apakah sudah benar filter `owner_id`.
3. Periksa RLS policy di tabel `umkm`.
4. Periksa apakah ada race condition pada state auth.

---

## Implementasi Teknis

### File yang Kemungkinan Terpengaruh
- `src/pages/mitra/MitraProfilePage.tsx` — komponen utama profil toko
- RLS policies di Supabase (tabel `umkm`)

---

## Kriteria Selesai

- [ ] Halaman Profil Toko menampilkan data toko dengan benar
- [ ] Tidak ada alert error saat membuka halaman
- [ ] Data dapat diedit dan disimpan ulang
- [ ] Berfungsi baik di mobile dan desktop
