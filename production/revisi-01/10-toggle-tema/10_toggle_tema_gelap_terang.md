# 10. Toggle Tema Gelap/Terang

## Prioritas: 🟢 Rendah (Polish UI)

Menambahkan fitur pergantian tema pada mode Admin dan mode Mitra.

---

## Perubahan

### Mode Admin
- Tambahkan toggle tema di sidebar/header navigasi admin.
- Admin bisa beralih antara tema gelap dan terang.

### Mode Mitra
- Toggle tema sudah direncanakan ada di halaman Pengaturan (fase 05).
- Pastikan toggle ini juga diimplementasikan di sini.

### Mode Pelanggan
- Jika sudah ada toggle tema, pastikan konsisten.
- Jika belum ada, tambahkan di halaman profil/pengaturan pelanggan.

---

## Implementasi Teknis

### State Management
- Gunakan zustand store (`useThemeStore`) atau localStorage.
- Simpan preferensi tema di `localStorage` agar persisten.
- Key: `digido-theme` → value: `'light'` | `'dark'`

### Penerapan Tema
- Gunakan class `dark` pada elemen `<html>` untuk mengaktifkan dark mode (Tailwind dark mode strategy: `class`).
- Pastikan semua komponen sudah mendukung `dark:` variant.

### Toggle Component
- Komponen toggle reusable: `ThemeToggle.tsx`
- Ikon: ☀️ (light) ↔ 🌙 (dark)
- Animasi transisi halus saat berpindah tema.

---

## File yang Kemungkinan Terpengaruh

- `src/components/ui/ThemeToggle.tsx` — komponen toggle (baru atau perbaikan)
- `src/store/useThemeStore.ts` — state tema (jika belum ada)
- `src/components/layout/SuperadminLayout.tsx` — pasang toggle di admin
- `src/pages/mitra/MitraSettingsPage.tsx` — pasang toggle di pengaturan mitra
- `tailwind.config.js` — pastikan `darkMode: 'class'`

---

## Kriteria Selesai

- [ ] Toggle tema berfungsi di mode Admin
- [ ] Toggle tema berfungsi di mode Mitra
- [ ] Preferensi tema tersimpan di localStorage
- [ ] Tema persisten setelah refresh halaman
- [ ] Transisi tema halus (tidak flickering)
- [ ] Semua halaman dan komponen mendukung dark/light mode
