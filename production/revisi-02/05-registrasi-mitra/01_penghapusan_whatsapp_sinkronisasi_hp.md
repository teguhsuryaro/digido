# 01. Penghapusan Kolom WhatsApp & Sinkronisasi Nomor HP

## Prioritas: 🟠 Tinggi (Fitur Inti)

Menghapus kolom WhatsApp dari formulir registrasi mitra dan menggantinya dengan mekanisme sinkronisasi nomor HP otomatis dari profil pengguna.

---

## Perubahan

### Hapus Kolom WhatsApp
- Hapus kolom pengisian nomor WhatsApp toko beserta keterangannya dari formulir registrasi mitra.

### Mekanisme Baru

#### Jika Profil Pengguna Sudah Memiliki Nomor HP
- Nomor HP profil pengguna otomatis digunakan sebagai nomor HP toko mitra.
- Kolom tidak perlu ditampilkan (atau tampilkan sebagai read-only).

#### Jika Profil Pengguna Belum Memiliki Nomor HP
- Kolom nomor HP **wajib diisi** saat registrasi mitra.
- Nilai yang diisi otomatis menjadi:
  - Nomor HP profil pengguna.
  - Nomor HP profil mitra (toko).

### Prinsip
> **Nomor HP Profil Pengguna = Nomor HP Profil Mitra**

---

## Implementasi Teknis

### File yang Kemungkinan Terpengaruh
- `src/pages/auth/MitraRegisterPage.tsx` — form registrasi mitra
- `src/store/useAuthStore.ts` — profile state (phone_number)
- Supabase: tabel `umkm` (kolom `whatsapp_number` → bisa di-rename atau di-map ke `phone`)

### Logika
```
if (profile.phone_number) {
  // Auto-fill, user tidak perlu input
  umkm.phone = profile.phone_number
} else {
  // Tampilkan input wajib
  // Simpan ke profiles.phone_number DAN umkm.phone
}
```

---

## Kriteria Selesai

- [ ] Kolom WhatsApp dihapus dari form registrasi mitra
- [ ] Nomor HP otomatis terisi jika profil sudah punya
- [ ] Kolom nomor HP wajib muncul jika profil belum punya
- [ ] Nomor HP tersinkronisasi antara profil dan toko
- [ ] Data tersimpan benar di database
