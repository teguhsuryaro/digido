# 02. Manajemen Metode Pencairan Dana (Keuangan Pengaturan Mitra)

## Prioritas: 🟡 Sedang (Fitur Baru)

Menambahkan fitur untuk melihat dan mengubah metode pencairan dana pada halaman keuangan/pengaturan mitra.

---

## Perubahan

### Fitur Baru
- Mitra dapat melihat metode pencairan dana yang aktif.
- Mitra dapat mengubah metode pencairan melalui pop-up.

### Pilihan Metode
- **QRIS** — Upload foto QRIS (Gratis)
- **E-Wallet** — GoPay / OVO / DANA (Rp2.500/pencairan)
- **Bank** — BCA / BRI / BSI / SeaBank (Rp4.000/pencairan)

### Ketentuan Pop-up
- Pop-up harus proporsional.
- Responsif pada desktop maupun mobile.
- Menampilkan metode saat ini dan opsi ganti.

### Informasi Saat Pencairan
Saat menekan tombol **"Cairkan Dana"**, tampilkan tujuan pencairan secara eksplisit:
> Dana akan dicairkan ke: DANA – 085117495817

---

## Implementasi Teknis

### File yang Kemungkinan Terpengaruh
- `src/pages/mitra/FinansialPage.tsx` — halaman keuangan mitra
- `src/pages/mitra/MitraSettingsPage.tsx` — opsi pengaturan keuangan

### Komponen Baru
- Modal/pop-up untuk edit metode pencairan.
- Tampilan info metode aktif (card compact).

---

## Kriteria Selesai

- [ ] Metode pencairan aktif terlihat di halaman keuangan
- [ ] Pop-up edit metode berfungsi dan responsif
- [ ] Informasi tujuan pencairan tampil saat cairkan dana
- [ ] Data metode tersimpan dan tersinkronisasi
