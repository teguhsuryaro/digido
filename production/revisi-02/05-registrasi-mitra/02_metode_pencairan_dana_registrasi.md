# 02. Perubahan Metode Pencairan Dana (Registrasi Mitra – Bagian Dokumen)

## Prioritas: 🟠 Tinggi (Fitur Inti)

Mengganti kolom upload foto QRIS dengan sistem pemilihan metode pencairan dana pada saat registrasi mitra.

---

## Perubahan

### Ganti Upload QRIS → Pilih Metode Pencairan

Saat registrasi mitra, bagian dokumen yang sebelumnya hanya upload QRIS diganti dengan sistem pemilihan metode pencairan dana.

### Pilihan Metode

| Metode   | Detail                                               | Potongan Admin |
|----------|------------------------------------------------------|----------------|
| QRIS     | Upload foto QRIS                                     | Gratis         |
| E-Wallet | Pilih GoPay / OVO / DANA + isi nomor                 | Rp2.500        |
| Bank     | Pilih BCA / BRI / BSI / SeaBank + isi nomor rekening | Rp4.000        |

### Ketentuan
- Setiap metode harus menampilkan keterangan biaya admin yang berlaku untuk setiap pencairan dana.
- UI harus jelas menunjukkan perbedaan biaya admin antar metode.

---

## Implementasi Teknis

### File yang Kemungkinan Terpengaruh
- `src/pages/auth/MitraRegisterPage.tsx` — form registrasi mitra (bagian dokumen)
- Supabase: tabel `umkm` — kolom baru untuk metode pencairan

### Kolom Database Baru (tabel `umkm`)
```sql
withdrawal_method TEXT       -- 'qris' | 'ewallet' | 'bank'
withdrawal_provider TEXT     -- 'gopay' | 'ovo' | 'dana' | 'bca' | 'bri' | 'bsi' | 'seabank'
withdrawal_account TEXT      -- nomor akun/rekening
withdrawal_qris_url TEXT     -- URL foto QRIS (jika metode QRIS)
```

### UI Flow
1. User memilih metode: QRIS / E-Wallet / Bank.
2. Berdasarkan pilihan, form dinamis muncul:
   - **QRIS**: Upload foto QRIS.
   - **E-Wallet**: Dropdown provider + input nomor.
   - **Bank**: Dropdown bank + input nomor rekening.
3. Tampilkan keterangan biaya admin di bawah setiap opsi.

---

## Kriteria Selesai

- [ ] Kolom upload QRIS diganti dengan pemilihan metode
- [ ] Tiga metode tersedia: QRIS, E-Wallet, Bank
- [ ] Keterangan biaya admin ditampilkan per metode
- [ ] Form dinamis sesuai pilihan metode
- [ ] Data tersimpan benar di database
- [ ] Responsif di mobile dan desktop
