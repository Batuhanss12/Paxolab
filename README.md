# FORMA — AI Tasarım Atölyesi

Tek sayfalık, ön yüzde çalışan bir **tasarım motoru** arayüzü. Bu bir görsel üretici değil.

Akış: **Konuş → Motor üretir → Kullanıcı iterasyon yapar → Baskıya hazırla.**

Proje yolu: `/workspace/ai-design-workspace`

## Çalıştırma

```bash
cd /workspace/ai-design-workspace
npm install
npm run dev
```

Tarayıcıda açın: [http://localhost:5173](http://localhost:5173)

Üretim derlemesi:

```bash
npm run build
npm run preview
```

## Ne yapar

1. Karşılama ekranı: *Ne tasarlamak istiyorsunuz?*
2. Prompt veya hızlı chip (Kozmetik kutusu, Etiket, Kutu ambalaj, Landing page).
3. Sol sohbet eksik alanları konuşarak sorar (gerçek LLM yok, sezgisel motor).
4. **Girdiler** paneli doldukça açılır.
5. Marka + ürün + ambalaj (veya eşdeğeri) hazır olunca mock motor:
   - 2D SVG ambalaj / etiket / landing
   - CSS 3D hacim
   - Üretim checklist’i
6. Sekmeler yalnızca önizleme sonrası görünür: Konuşma · 2D Vektör · 3D Önizleme · Üretim Bilgisi.
7. İterasyon: `logoyu büyüt`, `daha premium`, `metni … yap`, `baskıya hazırla`.

## Alanlar

`markaAdi`, `urunAdi`, `kategori`, `ambalajTipi`, `olculer`, `metinler`, `renkler`, `stil`, `logo`, `gorseller`, `icerik`, `uyarilar`, `barkodQr`, `diger`.

## Yığın

Vite · React 19 · TypeScript. Ekstra UI kütüphanesi yok.

## Not

Tasarım motoru belirleyicidir: aynı brief aynı palet, ölçü ve kopyayı üretir. Ağ çağrısı yoktur.
