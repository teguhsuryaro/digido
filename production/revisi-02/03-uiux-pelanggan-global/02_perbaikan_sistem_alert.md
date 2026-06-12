# 02. Perbaikan Sistem Alert (Semua Mode)

## Prioritas: 🟡 Sedang (UI/UX)

Merombak desain alert di seluruh mode agar lebih soft, konsisten, dan responsif.

---

## Permasalahan

Alert di seluruh mode saat ini terlihat tidak proper dan tampilannya janggal.

---

## Perubahan

### Desain Alert Baru
Rombak desain alert agar:
- **Lebih soft** — warna tidak terlalu mencolok, gunakan pastel/muted tone.
- **Konsisten** — semua alert di semua mode menggunakan style yang sama.
- **Responsif** — tampil rapi di desktop dan mobile.

### Jenis Alert
| Jenis | Warna | Penggunaan |
|-------|-------|------------|
| Success | Hijau soft | Operasi berhasil |
| Error | Merah soft | Operasi gagal |
| Warning | Kuning soft | Peringatan |
| Info | Biru soft | Informasi umum |

### Posisi & Animasi
- Alert tampil di atas layar (top-center) atau sesuai posisi saat ini.
- Animasi masuk: slide-in dari atas.
- Animasi keluar: fade-out.
- Auto-dismiss setelah 3-5 detik.

---

## Implementasi Teknis

### File yang Kemungkinan Terpengaruh
- `src/components/ui/Toast.tsx` — komponen toast/alert utama
- `src/index.css` — styling global untuk alert

### Perubahan Spesifik
1. Redesain komponen Toast/Alert.
2. Standardisasi warna dan animasi.
3. Pastikan konsistensi di semua halaman.

---

## Kriteria Selesai

- [ ] Desain alert soft dan konsisten di semua mode
- [ ] Alert responsif di mobile dan desktop
- [ ] Animasi masuk/keluar halus
- [ ] Auto-dismiss berfungsi
- [ ] Tidak ada alert yang terlihat janggal
