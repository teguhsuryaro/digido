# 02. Perbaikan Halaman Pengaturan Pengiriman (Mode Mitra)

## Prioritas: 🟡 Sedang (UI/UX)

Memperbaiki tata letak dan responsivitas halaman pengaturan pengiriman agar lebih rapi, mudah dibaca, dan nyaman digunakan.

---

## Perubahan

### Tata Letak
- Rapikan susunan form input (jarak antar elemen, padding, margin).
- Gunakan Card component untuk mengelompokkan pengaturan terkait.
- Label dan input harus sejajar atau tertata rapi.

### Responsivitas
- Halaman harus responsif di semua ukuran layar (360px – 1920px).
- Tidak boleh ada horizontal scroll.
- Form input tidak boleh terpotong atau terlalu kecil di mobile.

### Keterbacaan
- Gunakan heading/subheading yang jelas untuk setiap seksi pengaturan.
- Tambahkan deskripsi singkat di bawah label jika diperlukan.

---

## Implementasi Teknis

### File yang Kemungkinan Terpengaruh
- `src/pages/mitra/DeliverySettingsPage.tsx` — halaman utama pengaturan pengiriman

---

## Kriteria Selesai

- [ ] Tata letak form rapi dan terstruktur
- [ ] Responsif di viewport 360px, 768px, 1024px, 1440px
- [ ] Mudah dibaca dan nyaman digunakan
- [ ] Tidak ada horizontal scroll atau elemen terpotong
