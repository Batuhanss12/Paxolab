# Paxolab — Proje Mimarisi

## Dizin Yapısı

```
PAXOLAB/
├── site/           → Marketing sitesi (Next.js, port 3000) — ANA SAYFA
├── src/            → Tasarım stüdyosu (Vite + React, port 5173) — TASARIM ARACI
├── server/         → Backend API (Hono, port 8787) — AUTH + CREDITS + BILLING
├── docs/           → Dokümantasyon
└── scripts/        → Engine smoke testleri ve yardımcı scriptler
```

## Servisler

| Servis | Port | URL | Teknoloji | Rol |
|--------|------|-----|-----------|-----|
| **Site** | 3000 | http://localhost:3000 | Next.js 16 | Ana sayfa, blog, fiyatlandırma, giriş/kayıt |
| **Stüdyo** | 5173 | http://localhost:5173 | Vite + React 19 | Tasarım aracı (workspace) |
| **API** | 8787 | http://localhost:8787 | Hono + SQLite | Auth, credits, billing, projects |

## Akış

```
Kullanıcı → Site (port 3000) → Giriş/Kayıt (AuthModal)
  ↓ handoff token ile
Stüdyo (port 5173) → Tasarım üretimi
  ↓ API çağrıları
API (port 8787) → Auth, kredi, ödeme
```

1. Kullanıcı site'ı açar (port 3000) — marketing ana sayfa.
2. Header'da Giriş/Kayıt yapar (AuthModal — API'ye gider).
3. Başarılı girişten sonra "Stüdyoya git" butonu → stüdyo (port 5173) handoff token ile açılır.
4. Stüdyo token'ı okur, kullanıcıyı tanır, tasarım yapmaya başlar.
5. Tasarım operasyonları kredi çalar (API → SQLite).

## Komutlar

```bash
# Tüm servisleri başlat (site + stüdyo + API)
npm run dev:all

# Sadece site
npm run dev:site

# Sadece stüdyo
npm run dev

# Sadece API
npm run server

# Test
npm run test:all
```

## Önemli Notlar

- **Site ana giriş noktasıdır.** Stüdyo doğrudan açılmamalı — site üzerinden handoff ile gelinir.
- **Stüdyo (src/) sadece tasarım aracıdır.** Marketing içerikleri site/ klasöründedir.
- **API (server/) paylaşılan backend'tir.** Hem site hem stüdyo aynı API'yi kullanır.
- **Deterministik motor değiştirilmez.** src/engine/ altındaki tasarım motoru dokunulmaz.
- **Kredi sistemi Phase 10'dur.** server/credit/ altında katalog, bucket, abonelik, sınıflandırma.
