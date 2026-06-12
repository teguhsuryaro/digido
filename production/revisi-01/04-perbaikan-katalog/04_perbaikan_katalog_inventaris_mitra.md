# 04. Perbaikan Katalog / Manajemen Inventaris (Mode Mitra)

## Prioritas: 🟡 Sedang (Bug Fix UI)

Perbaikan tampilan yang tidak memerlukan perubahan database.

---

## A. Perbaikan Layout Katalog

### Permasalahan
- Halaman katalog masih mengalami tumpang tindih elemen (overlap).
- Tampilan mobile belum optimal.

### Solusi
- Audit seluruh layout `InventarisPage.tsx`.
- Perbaiki grid/flex layout agar tidak saling menimpa.
- Pastikan card produk tampil rapi di mobile (1 kolom) dan desktop (2-3 kolom).
- Gunakan `overflow-hidden` dan `truncate` untuk teks yang terlalu panjang.

---

## B. Perbaikan Pop-up Edit Katalog (ProductForm)

### Permasalahan
- Ukuran pop-up terlalu besar.
- Pop-up saat ini tidak dapat di-scroll.
- Tidak responsif di layar kecil.

### Solusi
- Batasi `max-height` pop-up ke `90vh`.
- Tambahkan `overflow-y: auto` pada body modal.
- Buat layout form lebih compact (kurangi padding, gunakan grid 2 kolom untuk field kecil).
- Pastikan tombol aksi (Simpan/Batal) selalu terlihat (sticky di bawah atau di luar scroll area).

---

## File yang Kemungkinan Terpengaruh

- `src/pages/mitra/InventarisPage.tsx` — layout utama katalog
- `src/components/mitra/ProductForm.tsx` — form edit/tambah produk
- Modal wrapper yang digunakan (jika ada komponen modal global)

---

## Kriteria Selesai

- [ ] Tidak ada elemen yang tumpang tindih di halaman katalog
- [ ] Tampilan mobile rapi (card 1 kolom, teks tidak overflow)
- [ ] Pop-up edit produk dapat di-scroll
- [ ] Pop-up tidak melebihi 90% tinggi viewport
- [ ] Tombol Simpan/Batal selalu terlihat saat scroll
- [ ] Responsif di berbagai ukuran layar (360px–1920px)
