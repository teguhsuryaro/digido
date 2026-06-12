# 05. Rombak Navigasi Mode Mitra

## Prioritas: 🟡 Sedang

Merapikan navigasi mitra agar lebih bersih dan terstruktur. Berkaitan erat dengan fase 04 (katalog).

---

## Perubahan Navigasi

### Sidebar/Bottom Nav Utama (Disederhanakan)
Menu navigasi utama mitra hanya berisi:

| Menu | Ikon | Route |
|------|------|-------|
| Dashboard | `LayoutDashboard` | `/mitra` |
| Pesanan | `ClipboardList` | `/mitra/pesanan` |
| Chat | `MessageCircle` | `/mitra/chat` |
| Pengaturan | `Settings` | `/mitra/pengaturan` |

### Halaman Pengaturan (Satu Halaman Tersendiri)
Halaman `/mitra/pengaturan` berisi daftar menu dalam bentuk list/card, masing-masing mengarah ke halaman sub-pengaturan:

| Sub-menu | Route | Keterangan |
|----------|-------|------------|
| Profil Toko | `/mitra/pengaturan/profil` | Edit nama, deskripsi, foto |
| Operasional | `/mitra/pengaturan/operasional` | Jam buka, status toko |
| Pengiriman | `/mitra/pengaturan/pengiriman` | Radius, tarif delivery |
| Keuangan | `/mitra/pengaturan/keuangan` | Statistik & penarikan saldo |
| Langganan | `/mitra/pengaturan/langganan` | Paket premium |
| Katalog | `/mitra/pengaturan/katalog` | Manajemen produk |
| Beralih ke Mode Belanja | — | Navigasi ke `/` (mode pelanggan) |

### Tambahan: Toggle Tema
- Tambahkan toggle dark/light mode di halaman Pengaturan.
- Toggle berada di bagian paling bawah daftar menu pengaturan.

---

## Perubahan dari Fase 7 Sebelumnya

Fase 7 sudah memindahkan beberapa sub-halaman ke dalam tab di pengaturan, tapi revisi ini mengubah pendekatan:
- **Sebelumnya:** Tab horizontal di dalam satu halaman pengaturan.
- **Sekarang:** Halaman pengaturan sebagai "menu utama" yang berisi daftar link ke sub-halaman masing-masing.

Ini memberikan ruang lebih besar untuk setiap sub-halaman dan navigasi yang lebih jelas.

---

## File yang Kemungkinan Terpengaruh

- `src/components/layout/MitraLayout.tsx` — sidebar/bottom nav
- `src/components/mitra/SettingsTabs.tsx` — mungkin dihapus/diganti
- Komponen baru: `MitraSettingsPage.tsx` — halaman daftar menu pengaturan
- `src/App.tsx` — routing update

---

## Kriteria Selesai

- [ ] Sidebar/bottom nav hanya menampilkan 4 menu utama
- [ ] Halaman Pengaturan berisi daftar menu yang navigable
- [ ] Katalog dipindahkan ke sub-menu Pengaturan
- [ ] Toggle tema dark/light ada di halaman Pengaturan
- [ ] Tombol "Beralih ke Mode Belanja" berfungsi
- [ ] Responsif di mobile dan desktop
