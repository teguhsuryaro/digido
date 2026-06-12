# 06. Fitur Chat & Chatbot

## Prioritas: 🟡 Sedang (Fitur Baru Besar)

Fitur ini menggantikan integrasi chat langsung ke WhatsApp mitra dengan sistem chat in-app yang dilengkapi chatbot.

---

## Perubahan Utama

**Hapus:** Integrasi chat langsung ke WhatsApp mitra.
**Tambah:** Sistem chat in-app dengan alur chatbot → live chat mitra.

---

## Alur Chat (User/Pelanggan)

```
User membuka chat di halaman toko
        │
        ▼
Chatbot memberikan respons pertama
(FAQ otomatis, info toko, dll)
        │
        ▼
Muncul tombol "Chat Langsung dengan Mitra"
+ Notifikasi: "Respons mitra mungkin tidak secepat chatbot"
        │
        ├── User TIDAK menekan tombol
        │   └── Percakapan tetap dengan chatbot saja
        │       Tidak masuk ke dashboard mitra
        │
        └── User menekan tombol
            ├── Riwayat percakapan chatbot diteruskan ke mitra
            └── Mitra menerima notifikasi "Chat Masuk"
                dengan tombol "Tanggapi"
```

---

## Ketentuan Sesi Chat

| Aturan | Detail |
|--------|--------|
| **Tombol "Tanggapi"** | Otomatis hilang saat user menutup sesi chat |
| **Timeout sesi** | Sesi chat berakhir otomatis setelah user tidak aktif **1 menit** |
| **Real-time** | Seluruh percakapan berlangsung secara real-time |
| **Penyimpanan** | Riwayat chat **TIDAK** disimpan ke database |
| **Pembersihan** | Saat sesi berakhir, seluruh riwayat chat **dihapus otomatis** |

---

## Teknologi yang Digunakan

### Supabase Realtime (Channels)
Karena riwayat tidak disimpan ke DB, gunakan **Supabase Realtime Broadcast** untuk komunikasi:
- Buat channel per sesi: `chat:{umkm_id}:{session_id}`
- User dan mitra subscribe ke channel yang sama.
- Pesan dikirim via broadcast event, bukan insert ke tabel.

### Chatbot
- Implementasi sederhana: pattern matching / FAQ berbasis data toko.
- Respons chatbot berupa template: jam buka, lokasi, produk populer, dll.
- Tidak perlu AI/LLM untuk versi awal.

---

## Komponen Baru

| Komponen | Keterangan |
|----------|------------|
| `ChatWidget.tsx` | Widget chat floating di halaman toko (sisi pelanggan) |
| `ChatWindow.tsx` | Jendela percakapan (bubble chat) |
| `ChatBotEngine.ts` | Logika chatbot (FAQ matching) |
| `MitraChatInbox.tsx` | Inbox chat di dashboard mitra |
| `MitraChatWindow.tsx` | Jendela chat mitra untuk menanggapi |

---

## File yang Kemungkinan Terpengaruh

- `src/pages/customer/UMKMDetailPage.tsx` — hapus tombol WhatsApp, tambah tombol chat
- `src/pages/mitra/LiveChatPage.tsx` — rombak total: inbox + chat window
- `src/components/layout/MitraLayout.tsx` — notifikasi chat masuk di nav

---

## Kriteria Selesai

- [ ] Tombol WhatsApp dihapus dari detail toko
- [ ] Chat widget muncul di halaman toko
- [ ] Chatbot memberikan respons otomatis
- [ ] Tombol "Chat Langsung dengan Mitra" muncul setelah respons chatbot
- [ ] Percakapan diteruskan ke mitra secara real-time saat user memilih live chat
- [ ] Mitra melihat notifikasi dan tombol "Tanggapi" di dashboard
- [ ] Sesi chat berakhir otomatis setelah 1 menit idle
- [ ] Riwayat chat dihapus saat sesi berakhir
- [ ] Tidak ada data chat yang tersimpan di database
