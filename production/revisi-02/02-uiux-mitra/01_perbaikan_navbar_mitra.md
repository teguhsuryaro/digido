# 01. Perbaikan Navbar Mode Mitra

## Prioritas: 🟡 Sedang (UI/UX)

Merapikan navbar mode Mitra, terutama pada tampilan mobile, dan menghapus tombol "Belanja" dari navbar.

---

## Perubahan

### Hapus Tombol "Belanja"
- Tombol **"Belanja"** dihapus dari navbar mitra.
- Opsi beralih ke mode pelanggan hanya tersedia di halaman **Pengaturan**.

### Rapikan Tampilan Mobile
- Pastikan navbar tidak overflow atau tumpang tindih di layar kecil.
- Ikon dan label harus proporsional.
- Active state harus jelas terlihat.

---

## Implementasi Teknis

### File yang Kemungkinan Terpengaruh
- `src/components/layout/MitraLayout.tsx` — navbar utama mitra
- `src/pages/mitra/MitraSettingsPage.tsx` — tambah opsi "Mode Pelanggan" di sini

### Perubahan Spesifik
1. Hapus item `Belanja` / `ShoppingBag` dari `sidenavItems` / bottom nav di `MitraLayout.tsx`.
2. Pastikan item navigasi mitra tersisa rapi pada viewport mobile (360px).
3. Pastikan opsi beralih ke mode pelanggan ada di `MitraSettingsPage.tsx`.

---

## Kriteria Selesai

- [ ] Tombol "Belanja" tidak lagi muncul di navbar mitra
- [ ] Opsi beralih mode pelanggan tersedia di halaman Pengaturan
- [ ] Navbar mitra rapi di mobile (360px) dan desktop
- [ ] Active state navigasi jelas terlihat
