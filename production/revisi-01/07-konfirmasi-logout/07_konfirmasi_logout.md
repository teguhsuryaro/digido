# 07. Konfirmasi Logout

## Prioritas: 🟢 Rendah (Perbaikan UX Kecil)

Perubahan kecil tapi penting untuk mencegah logout tidak disengaja.

---

## Perubahan

Tambahkan pop-up konfirmasi sebelum logout pada **seluruh mode**:

| Mode | Lokasi Tombol Logout |
|------|---------------------|
| Pelanggan | Halaman profil / menu navigasi |
| Mitra | Sidebar / halaman pengaturan |
| Superadmin | Sidebar navigasi admin |

---

## Desain Pop-up

```
┌─────────────────────────────────┐
│                                 │
│     🚪 Keluar dari DigiDO?     │
│                                 │
│  Anda yakin ingin keluar dari   │
│  akun Anda?                     │
│                                 │
│  ┌─────────┐  ┌──────────────┐  │
│  │  Batal  │  │ Ya, Keluar   │  │
│  └─────────┘  └──────────────┘  │
│                                 │
└─────────────────────────────────┘
```

### Spesifikasi
- Gunakan komponen modal/dialog yang sudah ada (atau buat `ConfirmDialog` reusable).
- Tombol "Batal" = secondary, menutup dialog.
- Tombol "Ya, Keluar" = destructive/merah, menjalankan logout.
- Backdrop gelap, klik di luar dialog = menutup dialog.

---

## File yang Kemungkinan Terpengaruh

- `src/utils/logout.ts` — mungkin perlu di-wrap dengan konfirmasi
- `src/components/layout/MitraLayout.tsx` — tombol logout mitra
- `src/components/layout/CustomerLayout.tsx` — tombol logout pelanggan
- `src/components/layout/SuperadminLayout.tsx` — tombol logout admin
- Komponen baru (opsional): `ConfirmLogoutDialog.tsx`

---

## Kriteria Selesai

- [ ] Pop-up konfirmasi muncul saat klik logout di mode pelanggan
- [ ] Pop-up konfirmasi muncul saat klik logout di mode mitra
- [ ] Pop-up konfirmasi muncul saat klik logout di mode superadmin
- [ ] Tombol "Batal" menutup dialog tanpa logout
- [ ] Tombol "Ya, Keluar" menjalankan proses logout
