# 03. Perbaikan Tampilan Halaman Registrasi Mitra

## Prioritas: 🟡 Sedang (UI/UX)

Memperbaiki halaman registrasi mitra yang mengalami tumpang tindih elemen, khususnya pada tampilan mobile.

---

## Permasalahan

Halaman registrasi mitra masih mengalami tumpang tindih elemen, khususnya pada tampilan mobile.

---

## Perubahan

### Tata Letak
- Perbaiki spacing antar elemen form.
- Pastikan form input tidak saling tumpang tindih.
- Gunakan layout vertikal penuh di mobile (1 kolom).
- Di desktop, bisa menggunakan 2 kolom jika sesuai.

### Keterbacaan
- Label form harus jelas dan mudah dibaca.
- Placeholder text harus informatif.
- Error message tampil di bawah field yang bermasalah.

### Kenyamanan
- Langkah-langkah form terasa natural (step-by-step).
- Tombol submit mudah dijangkau di mobile.
- Loading state jelas saat proses pendaftaran.

---

## Implementasi Teknis

### File yang Kemungkinan Terpengaruh
- `src/pages/auth/MitraRegisterPage.tsx` — halaman registrasi mitra

### Perubahan Spesifik
1. Perbaiki CSS grid/flex layout agar tidak overlap di mobile.
2. Tambahkan proper spacing dan margin antar section.
3. Pastikan semua input field memiliki ukuran yang sesuai.

---

## Kriteria Selesai

- [ ] Tidak ada elemen tumpang tindih di mobile (360px)
- [ ] Form rapi dan nyaman diisi
- [ ] Responsif di semua ukuran layar
- [ ] Label dan error message jelas
