# 03. Filter Periode Keuangan & Penarikan Saldo (Mode Mitra)

## Prioritas: 🟠 Tinggi

Bergantung pada fase 02 (biaya admin) karena kalkulasi pendapatan bersih memerlukan data `admin_fee`.

---

## A. Filter Periode Keuangan

Pada halaman keuangan mitra, tambahkan filter periode untuk melihat statistik pendapatan.

### Pilihan Periode
| Opsi | Rentang Waktu |
|------|---------------|
| Harian | Hari ini (00:00 – 23:59) |
| Mingguan | 7 hari terakhir **(default)** |
| Bulanan | 30 hari terakhir |
| Tahunan | 365 hari terakhir |

### Tampilan
- Selector berupa tombol pill/tab horizontal di atas grafik/statistik.
- Saat periode berubah, data langsung di-refresh tanpa reload halaman.

---

## B. Penarikan Saldo (Pencairan Dana Manual)

Ubah mekanisme pencairan dana dari otomatis menjadi **manual**.

### Alur Penarikan
1. Mitra menekan tombol **"Cairkan Dana"**.
2. Muncul pop-up konfirmasi.
3. Mitra memilih salah satu opsi:
   - **Tarik sejumlah tertentu** — input nominal.
   - **Tarik seluruh saldo** — satu tombol cepat.
4. Konfirmasi → Saldo berkurang, riwayat penarikan tercatat.

### Informasi yang Ditampilkan di Halaman Keuangan
| Metrik | Keterangan |
|--------|------------|
| **Total Pendapatan** | Akumulasi seluruh pendapatan bersih (sudah dikurangi admin fee) |
| **Saldo di DigiDO** | Dana yang belum dicairkan |
| **Total Dana Ditarik** | Akumulasi seluruh penarikan yang sudah dilakukan |

---

## Perubahan Database

### Tabel Baru: `withdrawals`
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| `id` | `uuid` | PK, default `gen_random_uuid()` |
| `umkm_id` | `uuid` | FK ke `umkm.id` |
| `amount` | `integer` | Nominal penarikan |
| `status` | `text` | `pending` / `completed` / `failed` |
| `created_at` | `timestamptz` | Waktu penarikan |

### Tabel `umkm` — Tambah Kolom (Opsional)
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| `balance` | `integer` | Saldo saat ini (cache, bisa dihitung dari orders - withdrawals) |

> **Catatan:** Saldo bisa dihitung real-time dari `SUM(orders.total - admin_fee) - SUM(withdrawals.amount)`, tapi kolom `balance` bisa digunakan sebagai cache untuk performa.

---

## File yang Kemungkinan Terpengaruh

- `src/pages/mitra/FinansialPage.tsx` — rombak total: filter periode, info saldo, tombol cairkan
- Komponen baru: `WithdrawalModal.tsx` — pop-up cairkan dana
- Komponen baru: `PeriodFilter.tsx` — selector filter periode

---

## Kriteria Selesai

- [ ] Filter periode (harian/mingguan/bulanan/tahunan) berfungsi di halaman keuangan
- [ ] Default filter adalah "Mingguan"
- [ ] Tiga metrik utama (Total Pendapatan, Saldo, Dana Ditarik) ditampilkan
- [ ] Tombol "Cairkan Dana" membuka modal dengan opsi tarik sebagian/seluruh
- [ ] Tabel `withdrawals` dibuat di database
- [ ] Riwayat penarikan tercatat dengan benar
