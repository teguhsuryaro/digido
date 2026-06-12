# 08. Perbaikan Navigasi & Dashboard Admin

## Prioritas: 🟡 Sedang (Bug Fix)

Menggabungkan perbaikan tata letak navigasi admin (#9) dan bug counter dashboard (#10).

---

## A. Perbaikan Navigasi Admin (#9)

### Permasalahan
- Tata letak navigasi admin belum stabil.
- Penempatan konten tidak konsisten pada seluruh halaman.

### Solusi
- Audit `SuperadminLayout.tsx` dan pastikan sidebar/topbar konsisten.
- Standarisasi spacing, padding, dan max-width konten.
- Pastikan navigasi aktif (active state) terlihat jelas.
- Responsif: sidebar collapse di mobile, topbar di desktop.

---

## B. Perbaikan Dashboard Admin (#10)

### Permasalahan
Counter **"Transaksi Selesai"** tidak bertambah meskipun transaksi telah terjadi.

### Kemungkinan Penyebab
1. Query filter status tidak sesuai (misal: filter `completed` tapi status di DB adalah `done` atau `selesai`).
2. RLS (Row Level Security) memblokir akses superadmin ke tabel `orders`.
3. Data tidak masuk ke tabel `orders` dengan benar.

### Tindakan
- Periksa query di `SuperadminDashboard.tsx` — pastikan filter status sesuai dengan nilai aktual di database.
- Periksa RLS policy pada tabel `orders` — superadmin harus bisa SELECT semua.
- Cross-check langsung di Supabase Dashboard: `SELECT count(*) FROM orders WHERE status = 'completed'`.
- Pastikan data dashboard sinkron dengan database secara real-time (atau saat halaman dimuat).

---

## File yang Kemungkinan Terpengaruh

- `src/components/layout/SuperadminLayout.tsx` — layout & navigasi
- `src/pages/superadmin/SuperadminDashboard.tsx` — query counter
- Supabase Dashboard — RLS policies pada tabel `orders`

---

## Kriteria Selesai

- [ ] Navigasi admin konsisten di semua halaman (spacing, alignment)
- [ ] Sidebar responsif: collapse di mobile
- [ ] Counter "Transaksi Selesai" menampilkan angka yang benar
- [ ] Data dashboard sinkron dengan database
- [ ] RLS policy memperbolehkan superadmin membaca semua data orders
