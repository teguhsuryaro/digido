# 01. Pembaruan UI/UX Mode Superadmin

## Prioritas: 🟡 Sedang (UI/UX)

Menambahkan identitas halaman yang jelas dan memperbaiki navbar superadmin agar lebih rapi dan responsif.

---

## Perubahan

### Identitas Halaman
- Tambahkan identitas atau label yang jelas bahwa halaman yang sedang dibuka adalah mode **Superadmin**.
- Contoh: badge "Superadmin Mode" atau header yang mencolok.
- Pastikan pengguna selalu sadar bahwa mereka berada di mode admin.

### Navbar Superadmin
- Perbaiki navbar agar lebih rapi.
- Pastikan responsif pada tampilan mobile.
- Di mobile, gunakan hamburger menu atau bottom navigation yang proporsional.
- Active state navigasi harus jelas terlihat.

---

## Implementasi Teknis

### File yang Kemungkinan Terpengaruh
- `src/components/layout/SuperadminLayout.tsx` — layout utama superadmin

### Perubahan Spesifik
1. Tambahkan badge/identitas "Superadmin" yang selalu terlihat.
2. Perbaiki sidebar layout untuk desktop.
3. Buat mobile navigation yang responsif (hamburger / bottom nav).
4. Pastikan active state navigasi jelas.

---

## Kriteria Selesai

- [ ] Identitas "Superadmin Mode" terlihat jelas di halaman
- [ ] Navbar rapi di desktop
- [ ] Navbar responsif dan rapi di mobile (360px)
- [ ] Active state navigasi jelas terlihat
