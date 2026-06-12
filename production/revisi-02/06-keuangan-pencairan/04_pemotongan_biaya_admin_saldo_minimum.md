# 04. Pemotongan Biaya Admin Pencairan & Saldo Minimum

## Prioritas: 🟡 Sedang (Logika Bisnis)

Mengimplementasikan logika pemotongan biaya admin pencairan dan validasi saldo minimum.

---

## Perubahan

### Ketentuan Saldo Minimum
Mitra harus memiliki saldo yang cukup untuk menutup:
- Nominal pencairan.
- Biaya admin metode pencairan yang dipilih.

### Contoh Perhitungan
Pencairan Rp10.000 melalui DANA:
- Nominal pencairan: Rp10.000
- Biaya admin E-Wallet: Rp2.500
- **Saldo minimum yang diperlukan: Rp12.500**

### Biaya Admin per Metode

| Metode | Biaya Admin |
|--------|-------------|
| QRIS | Gratis (Rp0) |
| E-Wallet (GoPay/OVO/DANA) | Rp2.500 |
| Bank (BCA/BRI/BSI/SeaBank) | Rp4.000 |

### Pendapatan Platform
- Biaya admin pencairan tercatat pada sisi superadmin sebagai pendapatan platform.
- Data disimpan di tabel `withdrawals` atau tabel pendapatan terpisah.

### Riwayat Penarikan Mitra
Tampilkan informasi tambahan pada setiap entri riwayat:
- Nominal yang dicairkan.
- Biaya admin yang dipotong.
- Metode pencairan.
- Tujuan pencairan (contoh: DANA – 085117495817).

---

## Implementasi Teknis

### File yang Kemungkinan Terpengaruh
- `src/pages/mitra/FinansialPage.tsx` — logika validasi + tampilan riwayat

### Logika Validasi
```typescript
const adminFee = getWithdrawalFee(method); // 0 | 2500 | 4000
const minimumBalance = amount + adminFee;

if (balance < minimumBalance) {
  toast.error(`Saldo tidak cukup. Minimal Rp${minimumBalance.toLocaleString()}`);
  return;
}

// Proses pencairan
const netBalance = balance - amount - adminFee;
```

### Perubahan Tabel `withdrawals`
```sql
ALTER TABLE withdrawals
ADD COLUMN IF NOT EXISTS admin_fee INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS method TEXT,
ADD COLUMN IF NOT EXISTS provider TEXT,
ADD COLUMN IF NOT EXISTS destination TEXT;
```

---

## Kriteria Selesai

- [ ] Validasi saldo minimum berfungsi (nominal + biaya admin)
- [ ] Biaya admin dipotong dari saldo saat pencairan
- [ ] Biaya admin tercatat sebagai pendapatan platform
- [ ] Riwayat penarikan menampilkan detail lengkap (nominal, admin, metode, tujuan)
- [ ] Pesan error informatif jika saldo tidak cukup
