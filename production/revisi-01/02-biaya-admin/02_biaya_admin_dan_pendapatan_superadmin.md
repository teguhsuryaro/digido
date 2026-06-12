# 02. Biaya Admin & Pendapatan Superadmin

## Prioritas: 🟠 Tinggi (Perubahan Skema Data Core)

Fitur ini mengubah alur transaksi secara fundamental dan harus diimplementasikan sebelum fitur keuangan mitra lainnya.

---

## A. Biaya Admin (Sisi Pelanggan)

Setiap transaksi dikenakan biaya admin sebesar **Rp500** yang ditanggung oleh pembeli.

### Ketentuan
- Tampilkan rincian biaya admin secara eksplisit pada halaman konfirmasi/ringkasan transaksi.
- Biaya admin harus terlihat **terpisah** dari harga produk/jasa.
- Biaya admin **tidak** masuk ke pendapatan mitra.

### Rincian Tampilan di Checkout
```
Subtotal Produk     : Rp 50.000
Ongkos Kirim        : Rp  5.000
Biaya Admin DigiDO  : Rp    500
─────────────────────────────────
Total Pembayaran    : Rp 55.500
```

---

## B. Pendapatan Biaya Admin (Sisi Superadmin)

Superadmin dapat memantau total pendapatan website yang berasal dari akumulasi biaya admin per transaksi.

### Ketentuan
- Mitra hanya menerima nilai bersih transaksi (total - biaya admin - ongkir).
- Tambahkan statistik **total pendapatan biaya admin** pada dashboard superadmin.
- Tampilkan breakdown: hari ini, minggu ini, bulan ini, total keseluruhan.

---

## Perubahan Database

### Tabel `orders` — Tambah Kolom
| Kolom | Tipe | Default | Keterangan |
|-------|------|---------|------------|
| `admin_fee` | `integer` | `500` | Biaya admin per transaksi |

### Atau: Tabel Baru `platform_revenue`
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| `id` | `uuid` | PK |
| `order_id` | `uuid` | FK ke orders |
| `amount` | `integer` | Nominal biaya admin |
| `created_at` | `timestamptz` | Waktu pencatatan |

> **Keputusan:** Cukup tambah kolom `admin_fee` di tabel `orders` untuk kesederhanaan. Superadmin bisa SUM dari situ.

---

## File yang Kemungkinan Terpengaruh

- `src/pages/customer/CheckoutPage.tsx` — tampilkan rincian biaya admin
- `src/pages/customer/CartPage.tsx` — preview total dengan biaya admin
- `src/pages/superadmin/SuperadminDashboard.tsx` — statistik pendapatan admin
- `src/pages/mitra/FinansialPage.tsx` — pendapatan bersih mitra (dikurangi admin fee)

---

## Kriteria Selesai

- [ ] Biaya admin Rp500 tampil eksplisit di halaman checkout
- [ ] Total pembayaran = subtotal + ongkir + biaya admin
- [ ] Kolom `admin_fee` ditambahkan ke tabel `orders`
- [ ] Dashboard superadmin menampilkan total pendapatan dari biaya admin
- [ ] Pendapatan mitra di halaman finansial sudah dikurangi biaya admin
