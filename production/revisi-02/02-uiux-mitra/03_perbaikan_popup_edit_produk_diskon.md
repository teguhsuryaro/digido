# 03. Perbaikan Pop-up Edit Produk & Indikator Diskon (Manajemen Inventaris)

## Prioritas: 🟡 Sedang (UI/UX)

Memperbaiki tampilan pop-up edit produk dan menambahkan indikator diskon pada card produk di halaman manajemen inventaris.

---

## Perubahan

### Pop-up Edit Produk
- Perbaiki tampilan agar lebih rapi dan nyaman digunakan.
- Pastikan responsif di desktop dan mobile.
- Gunakan max-height + scroll jika konten terlalu panjang.
- Tombol aksi (Simpan, Batal) harus selalu terlihat (sticky di bawah).

### Indikator Diskon pada Card Produk
- Produk yang sedang didiskon harus menampilkan badge/indikator diskon langsung pada card.
- Informasi yang ditampilkan:
  - Persentase atau nominal diskon.
  - Harga asli (dicoret) dan harga setelah diskon.
- Mitra dapat langsung melihat produk mana yang sedang didiskon tanpa membuka satu per satu.

---

## Implementasi Teknis

### File yang Kemungkinan Terpengaruh
- `src/pages/mitra/InventarisPage.tsx` — halaman inventaris + modal edit
- `src/components/ProductCard.tsx` — jika card produk di-reuse
- Komponen modal edit produk (inline atau terpisah)

### Desain Indikator Diskon
- Badge warna hijau/merah di pojok card: "Diskon 20%"
- Harga asli dicoret, harga diskon di bawahnya
- Gunakan warna kontras agar mudah terlihat

---

## Kriteria Selesai

- [ ] Pop-up edit produk rapi dan responsif
- [ ] Pop-up memiliki scroll jika konten panjang
- [ ] Tombol aksi selalu terlihat di pop-up
- [ ] Card produk menampilkan indikator diskon
- [ ] Mitra dapat melihat produk didiskon tanpa membuka detail
