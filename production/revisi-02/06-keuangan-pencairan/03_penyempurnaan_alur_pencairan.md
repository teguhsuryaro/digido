# 03. Penyempurnaan Alur Pencairan Dana

## Prioritas: 🟡 Sedang (Penyempurnaan)

Menyempurnakan label dan status pada alur pencairan dana agar sesuai dengan mekanisme sebenarnya.

---

## Perubahan

### Perubahan Label Tombol
- Ubah label tombol dari **"Ajukan"** menjadi **"Cairkan"**.
- Alasan: Dana langsung cair ke tujuan tanpa proses manual dari admin.

### Perubahan Status Riwayat
- Ubah status **"Diproses"** menjadi **"Selesai"** atau padanan lain yang sesuai.
- Status yang lebih tepat mencerminkan bahwa dana sudah dicairkan.

---

## Implementasi Teknis

### File yang Kemungkinan Terpengaruh
- `src/pages/mitra/FinansialPage.tsx` — tombol dan status di halaman keuangan

### Perubahan Spesifik
1. Ganti teks tombol "Ajukan" → "Cairkan".
2. Ganti status badge "Diproses" → "Selesai".
3. Pastikan perubahan konsisten di seluruh tampilan riwayat.

---

## Kriteria Selesai

- [ ] Label tombol berubah menjadi "Cairkan"
- [ ] Status riwayat berubah menjadi "Selesai"
- [ ] Konsisten di seluruh halaman keuangan
