# 01. Detail Pendapatan Platform (Dashboard Superadmin)

## Prioritas: 🟡 Sedang (Fitur Baru)

Membuat halaman detail pendapatan platform yang dapat diakses dari widget "Pendapatan Platform" di dashboard superadmin.

---

## Perubahan

### Widget Pendapatan Platform
- Widget **"Pendapatan Platform"** pada dashboard superadmin dapat diklik.
- Klik mengarah ke halaman detail pendapatan.

### Sumber Pendapatan yang Dicatat

| Sumber | Detail |
|--------|--------|
| Biaya Admin Transaksi | Rp500 per transaksi |
| Biaya Admin Penarikan Dana | Sesuai metode pencairan (QRIS: Gratis, E-Wallet: Rp2.500, Bank: Rp4.000) |
| Pembelian Paket Promosi | Silver, Gold, dan paket lainnya |

### Halaman Detail Pendapatan
Menampilkan:
- **Riwayat pendapatan** — daftar transaksi pendapatan per item.
- **Statistik pendapatan** — total, per kategori, grafik tren.
- **Filter periode** — harian, mingguan, bulanan.

---

## Implementasi Teknis

### File yang Kemungkinan Terpengaruh
- `src/pages/superadmin/SuperadminDashboard.tsx` — widget klik navigasi
- `src/pages/superadmin/SuperadminRevenuePage.tsx` — halaman baru detail pendapatan
- `src/App.tsx` — route baru
- `src/pages/index.ts` — export baru
- `src/components/layout/SuperadminLayout.tsx` — tambah nav item (opsional)

### Database
Kemungkinan perlu tabel `platform_revenue` atau query agregasi dari:
- `orders.admin_fee`
- `withdrawals` (biaya admin pencairan)
- `subscriptions` (pembelian paket)

---

## Kriteria Selesai

- [ ] Widget "Pendapatan Platform" dapat diklik
- [ ] Halaman detail pendapatan menampilkan riwayat
- [ ] Statistik pendapatan per kategori tersedia
- [ ] Filter periode berfungsi
- [ ] Responsif di mobile dan desktop
