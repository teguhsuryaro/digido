# 01. Perbaikan Halaman Toko / UMKM (Mode Pelanggan)

## Prioritas: 🟡 Sedang (UI/UX)

Memperbaiki layout halaman toko yang berantakan dan tumpang tindih, terutama pada tampilan mobile.

---

## Permasalahan

Layout halaman toko saat ini masih berantakan dan tumpang tindih, terutama pada tampilan mobile.

---

## Perubahan

### Tombol Interaktif
Tombol berikut saat ini tidak terlihat sebagai elemen interaktif:
- **Laporkan Toko** — harus terlihat jelas sebagai tombol yang bisa diklik.
- **Ulasan** — harus terlihat jelas sebagai tombol yang bisa diklik.

Perbaiki tampilannya agar:
- Memiliki visual yang jelas (border, background, atau ikon).
- Terlihat sebagai elemen yang dapat diklik.
- Memiliki hover/tap effect.

### Tampilan Keseluruhan
- Halaman harus **rapi** — tidak ada elemen yang tumpang tindih.
- Tetap **sederhana** — tidak berlebihan informasinya.
- **Tidak berlebihan** — hindari ornamen atau elemen dekoratif yang tidak perlu.

---

## Implementasi Teknis

### File yang Kemungkinan Terpengaruh
- `src/pages/customer/UMKMDetailPage.tsx` — halaman detail toko
- `src/components/ReportModal.tsx` — modal laporan toko

### Perubahan Spesifik
1. Rapikan layout grid/flex untuk info toko.
2. Styling tombol "Laporkan Toko" dan "Ulasan" agar terlihat interaktif.
3. Perbaiki spacing dan padding agar tidak tumpang tindih di mobile.

---

## Kriteria Selesai

- [ ] Halaman toko rapi di mobile (360px) dan desktop
- [ ] Tidak ada elemen tumpang tindih
- [ ] Tombol "Laporkan Toko" dan "Ulasan" terlihat jelas sebagai elemen interaktif
- [ ] Tampilan sederhana dan tidak berlebihan
