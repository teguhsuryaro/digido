# 🎨 DigiDO Redesign Planning

## Overview
Folder ini berisi **23 planning files** yang harus diimplementasikan **secara berurutan** untuk melakukan redesign tampilan website DigiDO.

## Goals
- ✅ Color palette dominan **biru & oranye** yang cerah dan menarik
- ✅ Design modern, minimalis, dan elegan (e-commerce vibes)
- ✅ Responsif: **full-width di desktop**, tetap compact di mobile
- ✅ Icon bersih dan modern menggunakan **Lucide React** (menggantikan emoji)
- ✅ Dukungan **dark mode & light mode**
- ✅ Spot foto perusahaan (placeholder yang bisa diganti manual)
- ✅ Card UMKM **seragam** di Beranda dan Katalog (dengan avatar/inisial toko)
- ✅ Mencakup **seluruh halaman** termasuk Mitra Dashboard

## Execution Order

| # | File | Scope | Estimasi |
|---|------|-------|----------|
| 001 | Install Dependencies | `npm install lucide-react` | 2 min |
| 002 | Design Tokens & Tailwind Config | `tailwind.config.ts` | 10 min |
| 003 | Global CSS & Theme Variables | `index.css` | 10 min |
| 004 | Core UI Components | Button, Card, Avatar, Skeleton, Modal | 15 min |
| 005 | Icon Migration | Mapping 30+ emoji → Lucide icons | 30 min |
| 006 | Customer Layout & Navbar | Full-width desktop, logo slot | 20 min |
| 007 | Auth Layout & Pages | Split-screen login, company photo | 15 min |
| 008 | UMKMCard Unified | Avatar/inisial, shared component | 15 min |
| 009 | Shared Components | ProductCard, CartItem, OrderCard, StarRating | 15 min |
| 010 | HomePage | Hero, search, grid UMKM, photo spot | 20 min |
| 011 | Katalog Page | Grid layout, filter bar | 10 min |
| 012 | UMKM Detail Page | 2-column desktop layout | 15 min |
| 013 | Search Results Page | Responsive grid | 10 min |
| 014 | Cart & Checkout Pages | 2-column cart, centered checkout | 15 min |
| 015 | Orders & Detail Pages | Grid orders, centered detail | 10 min |
| 016 | Wallet & Profile Pages | Centered wallet, 2-col profile | 15 min |
| 017 | Mitra Layout | Sidebar icons, bottom nav | 15 min |
| 018 | Mitra: Inventaris & Pesanan | Grid layout, icon migration | 15 min |
| 019 | Mitra: Delivery, Operasional, Finansial | Minor tweaks, icon migration | 10 min |
| 020 | Mitra: LiveChat | Icon migration, send button | 10 min |
| 021 | MitraRegister & Misc | Form responsif, chatbot | 10 min |
| 022 | 404 Page & PageLoader | Visual upgrade | 5 min |
| 023 | Placeholder Assets & Final QA | Logo, photo, testing | 30 min |

**Total Estimasi: ~5 jam**

## Aturan Penting
1. **Implementasikan berurutan** — setiap step memiliki dependensi pada step sebelumnya.
2. **JANGAN ubah business logic** — hanya ubah visual/styling/layout.
3. **Backward compatible** — semua interface dan props harus tetap kompatibel.
4. **Test setelah setiap step** — jalankan `npm run dev` dan pastikan tidak ada error.
5. **Dark mode** — setiap perubahan harus memperhatikan dark mode.

## Files yang Perlu Disiapkan Manual
- `public/logo.png` — Logo DigiDO (akan ditaruh di sebelah kiri teks "DigiDO")
- `public/company-photo.jpg` — Foto perusahaan (untuk hero beranda & auth page)
