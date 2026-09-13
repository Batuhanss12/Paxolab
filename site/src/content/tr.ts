import type { SiteContent } from "@/content/types";

/** Turkish copy — default locale at root (no /tr prefix). */

const content: SiteContent = {
  brand: {
    name: "Paxolab",
    tagline: "Profesyonel ambalaj ve etiket tasarım stüdyosu",
    engine: "FORMA",
    email: "merhaba@paxolab.com",
  },

  nav: {
    services: "Hizmetler",
    how: "Nasıl çalışır",
    examples: "Örnekler",
    pricing: "Fiyatlandırma",
    faq: "SSS",
    contact: "İletişim",
    openStudio: "Stüdyoyu aç",
    menu: "Menü",
    primary: [
      { href: "/ambalaj-tasarimi", label: "Ambalaj" },
      { href: "/kutu-tasarimi", label: "Kutu" },
      { href: "/etiket-tasarimi", label: "Etiket" },
      { href: "/nasil-calisir", label: "Nasıl çalışır" },
      { href: "/fiyatlandirma", label: "Fiyatlandırma" },
      { href: "/sss", label: "SSS" },
    ],
    links: [
      { href: "/ambalaj-tasarimi", label: "Ambalaj tasarımı" },
      { href: "/kutu-tasarimi", label: "Kutu tasarımı" },
      { href: "/etiket-tasarimi", label: "Etiket tasarımı" },
      { href: "/bicki-cizimi", label: "Bıçak çizimi" },
      { href: "/kozmetik-ambalaj-tasarimi", label: "Kozmetik ambalaj" },
      { href: "/parfum-kutusu-tasarimi", label: "Parfüm kutusu" },
      { href: "/gida-ambalaj-tasarimi", label: "Gıda ambalaj" },
      { href: "/serum-krem-kutusu-tasarimi", label: "Serum / krem kutusu" },
      { href: "/etiket-mi-kutu-mu", label: "Etiket mi kutu mu" },
      { href: "/baskiya-hazir-dieline", label: "Baskıya hazır dieline" },
      { href: "/ai-ambalaj-tasarimi", label: "AI ambalaj tasarımı" },
      { href: "/nasil-calisir", label: "Nasıl çalışır" },
      { href: "/ornekler", label: "Örnekler" },
      { href: "/fiyatlandirma", label: "Fiyatlandırma" },
      { href: "/sss", label: "SSS" },
      { href: "/iletisim", label: "İletişim" },
    ],
  },

  footer: {
    blurb:
      "Paxolab, FORMA motoru ile baskıya hazır ambalaj, kutu ve etiket tasarımı sunar. Nihai çıktı vektördür.",
    product: "Ürün",
    company: "Kurumsal",
    legal: "Yasal",
    legalLinks: [
      { href: "/gizlilik", label: "Gizlilik" },
      { href: "/kvkk", label: "KVKK" },
      { href: "/kullanim-kosullari", label: "Kullanım koşulları" },
    ],
    contactLabel: "İletişim",
    copyright: (y: number) => `© ${y} Paxolab. Tüm hakları saklıdır.`,
  },

  home: {
    meta: {
      title: "Ambalaj & etiket tasarım stüdyosu",
      description:
        "Paxolab ile kutu, etiket ve bıçak çizimini profesyonelce tasarlayın. FORMA motoru baskıya hazır vektör üretir. Stüdyoyu hemen deneyin.",
    },
    hero: {
      eyebrow: "FORMA motoru ile",
      title: "Ambalajı konuşarak tasarlayın",
      lead: "Kutu, etiket ve dieline ihtiyacınızı netleştirin; Paxolab stüdyosu brief’i alır, baskıya uygun vektör yüzeyi üretir. Görsel üretim modeli değil — tasarım motoru.",
      primaryCta: "Stüdyoyu aç",
      secondaryCta: "Nasıl çalışır?",
    },
    valueProps: [
      {
        href: "/kutu-tasarimi",
        title: "Kutu tasarımı",
        text: "Tuck-end, kilitli taban ve özel formlar için yapı + grafik birlikte.",
      },
      {
        href: "/etiket-tasarimi",
        title: "Etiket tasarımı",
        text: "Şişe, kavanoz ve ürün etiketlerinde okunaklı, baskıya uygun düzen.",
      },
      {
        href: "/bicki-cizimi",
        title: "Bıçak çizimi (dieline)",
        text: "Kesim, kat ve yapışkan hatları üretim dilinde netleştirilir.",
      },
      {
        href: "/nasil-calisir",
        title: "Revizyon döngüsü",
        text: "Brief → üretim → revizyon. Kredilerle ölçülen, tekrarlanabilir iş akışı.",
      },
    ],
    hubsTitle: "Hizmet sayfaları",
    hubsLead: "Ürün tipinize göre derinleşin; her sayfa stüdyoya bağlanır.",
    hubs: [
      { href: "/ambalaj-tasarimi", label: "Ambalaj tasarımı" },
      { href: "/kozmetik-ambalaj-tasarimi", label: "Kozmetik ambalaj" },
      { href: "/gida-ambalaj-tasarimi", label: "Gıda ambalaj" },
      { href: "/parfum-kutusu-tasarimi", label: "Parfüm kutusu" },
    ],
    extraHubs: [
      { href: "/serum-krem-kutusu-tasarimi", label: "Serum / krem kutusu" },
      { href: "/etiket-mi-kutu-mu", label: "Etiket mi kutu mu" },
      { href: "/baskiya-hazir-dieline", label: "Baskıya hazır dieline" },
      { href: "/ai-ambalaj-tasarimi", label: "AI ambalaj tasarımı" },
      { href: "/fiyatlandirma", label: "Fiyatlandırma" },
      { href: "/ornekler", label: "Örnekler" },
      { href: "/iletisim", label: "İletişim" },
    ],
    ctaTitle: "Stüdyoda üretmeye başlayın",
    ctaLead:
      "Brief’inizi yazın, FORMA motoru baskıya uygun vektör yüzeyi üretsin. Krediler ve paketler stüdyo içinde.",
  },

  services: {
    "ambalaj-tasarimi": {
      slug: "ambalaj-tasarimi",
      meta: {
        title: "Ambalaj tasarımı",
        description:
          "Marka ambalajınızı Paxolab ile yapılandırın: form, yüzey ve baskı hazırlığı tek stüdyoda. FORMA ile vektör çıktı.",
      },
      hero: {
        title: "Ambalaj tasarımı",
        lead: "Ürün koruması, rafta ayrışma ve baskı gerçekliği aynı brief’te buluşur. Paxolab, ambalajın hem yapısını hem yüzünü stüdyoda ilerletmenizi sağlar.",
      },
      sections: [
        {
          title: "Ne sunuyoruz?",
          body: "Kutu, etiket ve ilgili dieline ihtiyaçlarını tek akışta ele alın. Brief’i yazın veya konuşarak netleştirin; motor baskıya uygun yüzey üretir. Nihai çıktı vektör odaklıdır — rastgele görsel üretimi değil.",
        },
        {
          title: "Kimler için?",
          body: "Kozmetik, gıda, elektronik aksesuar ve perakende markaları; ajanslar ve iç tasarım ekipleri. Prototip öncesi net yapı ve grafik isterseniz doğru yerdesiniz.",
        },
        {
          title: "Sonraki adım",
          body: "Stüdyoda bir proje açın, ürün tipini seçin ve ilk üretimi deneyin. Kredi paketleri fiyatlandırma sayfasında özetlenir; satın alma stüdyo içinde tamamlanır.",
        },
      ],
      related: [
        { href: "/kutu-tasarimi", label: "Kutu tasarımı" },
        { href: "/etiket-tasarimi", label: "Etiket tasarımı" },
        { href: "/gida-ambalaj-tasarimi", label: "Gıda ambalaj" },
        { href: "/etiket-mi-kutu-mu", label: "Etiket mi kutu mu" },
      ],
      serviceName: "Ambalaj tasarımı",
      serviceType: "PackagingDesign",
    },
    "kutu-tasarimi": {
      slug: "kutu-tasarimi",
      meta: {
        title: "Kutu tasarımı",
        description:
          "Profesyonel kutu tasarımı: yapı, yüzey grafiği ve bıçak çizimi. Paxolab stüdyosunda baskıya hazır ilerleyin.",
      },
      hero: {
        title: "Kutu tasarımı",
        lead: "Katlanır kutu formları, logo yerleşimi ve üretim hatları birlikte düşünülür. Paxolab ile kutu brief’inizi stüdyoda somutlaştırın.",
      },
      sections: [
        {
          title: "Yapı + yüzey",
          body: "Tuck-end, otomatik kilitli taban ve benzeri yaygın formlarda dieline mantığı korunur. Grafik, panellere ve katlara göre yerleştirilir.",
        },
        {
          title: "Üretim dili",
          body: "Kesim ve kat hatları net tutulur; böylece matbaa veya prototip aşamasına geçiş daha az sürprizle ilerler.",
        },
        {
          title: "İlgili kullanım alanları",
          body: "Parfüm kutusu, kozmetik set ve hediye ambalajı gibi dikey sayfalarımızı da inceleyebilirsiniz.",
        },
      ],
      related: [
        { href: "/ambalaj-tasarimi", label: "Ambalaj tasarımı" },
        { href: "/etiket-mi-kutu-mu", label: "Etiket mi kutu mu" },
        { href: "/bicki-cizimi", label: "Bıçak çizimi" },
        { href: "/baskiya-hazir-dieline", label: "Baskıya hazır dieline" },
      ],
      serviceName: "Kutu tasarımı",
      serviceType: "BoxDesign",
    },
    "etiket-tasarimi": {
      slug: "etiket-tasarimi",
      meta: {
        title: "Etiket tasarımı",
        description:
          "Şişe ve ürün etiketleri için okunaklı, baskıya uygun etiket tasarımı. Paxolab stüdyosunda brief’ten vektöre.",
      },
      hero: {
        title: "Etiket tasarımı",
        lead: "Küçük yüzeyde hiyerarşi, yasal metin alanı ve marka kimliği dengelenir. Etiketlerinizi Paxolab ile düzenli ve üretilebilir tutun.",
      },
      sections: [
        {
          title: "Odak noktaları",
          body: "Ürün adı, varyant, hacim ve zorunlu bilgiler için net bölgeler. Aşırı süsleme yerine okunabilirlik ve baskı toleransı.",
        },
        {
          title: "Ambalaj ile birlikte",
          body: "Etiket çoğu zaman kutu veya şişe ambalajıyla aynı marka sisteminin parçasıdır. Gerekirse kutu ve etiket sayfalarını birlikte kullanın.",
        },
      ],
      related: [
        { href: "/ambalaj-tasarimi", label: "Ambalaj tasarımı" },
        { href: "/etiket-mi-kutu-mu", label: "Etiket mi kutu mu" },
        { href: "/kutu-tasarimi", label: "Kutu tasarımı" },
        { href: "/gida-ambalaj-tasarimi", label: "Gıda ambalaj" },
      ],
      serviceName: "Etiket tasarımı",
      serviceType: "LabelDesign",
    },
    "bicki-cizimi": {
      slug: "bicki-cizimi",
      meta: {
        title: "Bıçak çizimi (dieline)",
        description:
          "Ambalaj bıçak çizimi ve dieline: kesim, kat ve yapışkan hatları. Paxolab ile üretim odaklı yapı.",
      },
      hero: {
        title: "Bıçak çizimi / dieline",
        lead: "Dieline, ambalajın üretim dilidir. Paxolab stüdyosu tasarımı bu yapı üzerinde ilerletir; rastgele bir görsel değil, panelli bir yüzey üretir.",
      },
      sections: [
        {
          title: "Neden önemli?",
          body: "Yanlış kat veya kesim hatları prototip ve baskıda maliyet yaratır. Brief’te ölçü ve form netliği, çıktının kullanılabilirliğini artırır.",
        },
        {
          title: "Stüdyoda nasıl kullanırsınız?",
          body: "Ürün tipini ve ölçüleri paylaşın; motor yapıya uygun yüzey üretir. Revizyonlarla metin ve grafik yerleşimini sıkılaştırın.",
        },
      ],
      related: [
        { href: "/kutu-tasarimi", label: "Kutu tasarımı" },
        { href: "/baskiya-hazir-dieline", label: "Baskıya hazır dieline" },
        { href: "/ambalaj-tasarimi", label: "Ambalaj tasarımı" },
        { href: "/sss", label: "SSS" },
      ],
      serviceName: "Bıçak çizimi",
      serviceType: "Dieline",
    },
    "kozmetik-ambalaj-tasarimi": {
      slug: "kozmetik-ambalaj-tasarimi",
      meta: {
        title: "Kozmetik ambalaj tasarımı",
        description:
          "Kozmetik kutu ve etiket tasarımı: raf görünümü, marka dili ve baskı hazırlığı. Paxolab stüdyosu.",
      },
      hero: {
        title: "Kozmetik ambalaj tasarımı",
        lead: "Serum, krem ve set kutularında sade hiyerarşi ve premium his. Paxolab ile kozmetik brief’inizi stüdyoda üretin.",
      },
      sections: [
        {
          title: "Kategori ihtiyaçları",
          body: "İçerik listesi, uyarılar ve marka vaadi küçük panellere sığmalı. Kozmetikte malzeme ve finish seçimiyle uyumlu sade bir dil genelde daha etkili olur.",
        },
        {
          title: "Etiket + kutu",
          body: "Şişe etiketi ile dış kutu aynı sistemde düşünülür. İlgili sayfalar: etiket tasarımı ve kutu tasarımı.",
        },
      ],
      related: [
        { href: "/serum-krem-kutusu-tasarimi", label: "Serum / krem kutusu" },
        { href: "/etiket-tasarimi", label: "Etiket tasarımı" },
        { href: "/kutu-tasarimi", label: "Kutu tasarımı" },
        { href: "/parfum-kutusu-tasarimi", label: "Parfüm kutusu" },
      ],
      serviceName: "Kozmetik ambalaj tasarımı",
      serviceType: "CosmeticPackaging",
    },
    "parfum-kutusu-tasarimi": {
      slug: "parfum-kutusu-tasarimi",
      meta: {
        title: "Parfüm kutusu tasarımı",
        description:
          "Parfüm kutusu ve ikincil ambalaj tasarımı. Paxolab ile yapı, yüzey ve dieline birlikte.",
      },
      hero: {
        title: "Parfüm kutusu tasarımı",
        lead: "Parfüm kutusu rafta ve hediye anında markayı taşır. Paxolab stüdyosunda form ve tipografi dengeli bir yüzey üretin.",
      },
      sections: [
        {
          title: "Odak",
          body: "Şişe silueti, marka adı ve varyant bilgisi için net paneller. Aşırı efekt yerine malzeme ve baskı kalitesine yer bırakan düzen.",
        },
        {
          title: "İlgili hizmetler",
          body: "Genel kutu tasarımı ve bıçak çizimi sayfalarımız sürecin yapı tarafını açıklar.",
        },
      ],
      related: [
        { href: "/kutu-tasarimi", label: "Kutu tasarımı" },
        { href: "/bicki-cizimi", label: "Bıçak çizimi" },
        { href: "/kozmetik-ambalaj-tasarimi", label: "Kozmetik ambalaj" },
        { href: "/fiyatlandirma", label: "Fiyatlandırma" },
      ],
      serviceName: "Parfüm kutusu tasarımı",
      serviceType: "PerfumeBoxDesign",
    },
    "gida-ambalaj-tasarimi": {
      slug: "gida-ambalaj-tasarimi",
      meta: {
        title: "Gıda ambalaj tasarımı",
        description:
          "Gıda kutusu ve etiketini Paxolab stüdyosunda brief’ten vektöre taşıyın. FORMA dieline mantığıyla baskıya uygun yüzey üretir.",
      },
      hero: {
        title: "Gıda ambalaj tasarımı",
        lead: "Gıda markaları için kutu ve etiket brief’ini stüdyoda netleştirin; FORMA panelli vektör yüzey üretir.",
      },
      sections: [
        {
          title: "Ne sunuyoruz?",
          body: "Gıda kutusu ve etiketini aynı stüdyo akışında ele alın. Brief’i yazın veya konuşarak netleştirin; FORMA dieline mantığıyla panelli vektör yüzey üretir. Rastgele görsel üretimi değil — yapı ve grafik birlikte.",
        },
        {
          title: "Gıda için dikkat",
          body: "Alerjen, içerik ve zorunlu bilgiler için panelde yer bırakın. Barkod yalnızca siz verirseniz yerleşir; motor numara uydurmaz. Net ölçü ve form, baskıya geçişi kolaylaştırır. Matbaa spesifikasyonu projenize göre sizde doğrulanır.",
        },
        {
          title: "Kimler için?",
          body: "Atıştırmalık, sos, yağ, içecek ve benzeri gıda markaları; ajanslar ve iç ekipler. Prototip öncesi net kutu veya etiket yüzeyi istediğinizde kullanışlıdır.",
        },
        {
          title: "Sonraki adım",
          body: "Stüdyoda bir proje açın, ürün tipini ve ölçüleri paylaşın. Kredi paketleri fiyatlandırma sayfasında özetlenir; satın alma stüdyo içinde tamamlanır.",
        },
      ],
      related: [
        { href: "/kutu-tasarimi", label: "Kutu tasarımı" },
        { href: "/etiket-tasarimi", label: "Etiket tasarımı" },
        { href: "/bicki-cizimi", label: "Bıçak çizimi" },
        { href: "/ambalaj-tasarimi", label: "Ambalaj tasarımı" },
      ],
      serviceName: "Gıda ambalaj tasarımı",
      serviceType: "FoodPackaging",
    },
    "serum-krem-kutusu-tasarimi": {
      slug: "serum-krem-kutusu-tasarimi",
      meta: {
        title: "Serum ve krem kutusu tasarımı",
        description:
          "Serum ve krem kutusu brief’ini Paxolab stüdyosunda panelli vektöre taşıyın. Kozmetik dil, hiyerarşi ve dieline birlikte.",
      },
      hero: {
        title: "Serum ve krem kutusu tasarımı",
        lead: "Tek ürün kozmetik kutularında sade hiyerarşi ve okunaklı paneller. Paxolab ile serum veya krem brief’inizi stüdyoda üretin.",
      },
      sections: [
        {
          title: "Serum kutusu",
          body: "Dar veya dikey formlarda ürün adı, hacim ve varyant için net ön panel. Serum dilinde sade tipografi ve malzeme hissine yer bırakan düzen.",
        },
        {
          title: "Krem kutusu",
          body: "Kavanoz veya tüp kutularında kapak, ön ve yan paneller aynı sistemde durur. İçerik ve uyarı metinleri için yer planlanır; grafik katlara göre yerleşir.",
        },
        {
          title: "Kozmetik dil",
          body: "İçerik listesi, uyarılar ve marka vaadi küçük yüzeylere sığmalı. Aşırı efekt yerine finish ve baskı kalitesine yer bırakan sade bir dil genelde daha işe yarar.",
        },
        {
          title: "İlgili sayfalar",
          body: "Genel kozmetik ambalaj, parfüm kutusu, etiket ve kutu sayfalarımız aynı marka sistemini tamamlar. Stüdyoda ürün tipini seçip üretin.",
        },
      ],
      related: [
        { href: "/kozmetik-ambalaj-tasarimi", label: "Kozmetik ambalaj" },
        { href: "/parfum-kutusu-tasarimi", label: "Parfüm kutusu" },
        { href: "/etiket-tasarimi", label: "Etiket tasarımı" },
        { href: "/kutu-tasarimi", label: "Kutu tasarımı" },
      ],
      serviceName: "Serum ve krem kutusu tasarımı",
      serviceType: "SerumCreamBox",
    },
    "ai-ambalaj-tasarimi": {
      slug: "ai-ambalaj-tasarimi",
      meta: {
        title: "AI ambalaj tasarımı nedir?",
        description:
          "AI brief’i netleştirir ve iterasyonu hızlandırır; nihai baskı yüzeyi FORMA vektör motorudur. Görsel üretim modeli kullanılmaz.",
      },
      hero: {
        title: "AI ambalaj tasarımı nedir?",
        lead: "AI konuşur ve brief çıkarır; nihai baskı yüzeyi FORMA’nın vektör motorudur. Rastgele görsel üretimi değil — dieline mantığıyla panelli yüzey.",
      },
      sections: [
        {
          title: "AI ne işe yarar?",
          body: "Sohbet ve brief çıkarımı: ürün tipi, ölçü, marka notları ve eksik alanlar netleşir. İterasyon niyeti de buradan gelir. AI rastgele bir ambalaj görseli üretmez.",
        },
        {
          title: "Nihai yüzey FORMA’dır",
          body: "Kesim, kat ve grafik panelli vektör motorda birleşir. Çıktı yapıya bağlıdır; görsel üretim modeli kullanılmaz. Bu ayrım, matbaaya giden dosyanın üretim dili taşıması içindir.",
        },
        {
          title: "Nasıl ilerlersiniz?",
          body: "Nasıl çalışır sayfasındaki akış: brief → FORMA üretimi → revizyon. Stüdyoda deneyin; kredi kullanımı hesaplı oturumda geçerlidir.",
        },
      ],
      related: [
        { href: "/nasil-calisir", label: "Nasıl çalışır" },
        { href: "/ambalaj-tasarimi", label: "Ambalaj tasarımı" },
        { href: "/bicki-cizimi", label: "Bıçak çizimi" },
        { href: "/sss", label: "SSS" },
      ],
      serviceName: "AI ambalaj tasarımı",
      serviceType: "AiPackagingExplainer",
    },
    "baskiya-hazir-dieline": {
      slug: "baskiya-hazir-dieline",
      meta: {
        title: "Baskıya hazır dieline",
        description:
          "Dieline preflight ve SVG/vektör dışa aktarım. Paxolab stüdyosu üretim kontrolü sunar; nihai matbaa onayı sizde ve matbaada kalır.",
      },
      hero: {
        title: "Baskıya hazır dieline",
        lead: "Bıçak çizimi yapıyı kurar; bu sayfa preflight ve vektör dışa aktarımın kullanılabilirliğine odaklanır. Nihai onay matbaanızdadır.",
      },
      sections: [
        {
          title: "Bıçak çiziminden farkı",
          body: "Bıçak çizimi sayfası kesim, kat ve yapışkan hatlarını açıklar. Burada odak, stüdyo preflight’ı ve SVG/vektör çıktının matbaa veya prototip aşamasında kullanılabilir olmasıdır.",
        },
        {
          title: "Preflight ve dışa aktarım",
          body: "Stüdyo marka, ölçü, kesim/kat tutarlılığı ve çarpışma gibi kontroller çalıştırır; birleşik SVG ve yazdır-PDF üretebilir. 2 mm güvenli alan ve bleed kılavuzu gösterim katmanıdır. PDF/X veya belirli bir matbaa profili iddiası yoktur.",
        },
        {
          title: "Dürüst sınır",
          body: "Nihai yazıcı onayı sizde ve matbaanızda kalır. CMYK profili, gerçek bleed, özel finish ve kalıp onayı projenize göre doğrulanmalıdır. Stüdyo üretim kapısı, uydurma barkod veya tutarsız dieline ile dışa aktarımı durdurur.",
        },
      ],
      related: [
        { href: "/bicki-cizimi", label: "Bıçak çizimi" },
        { href: "/kutu-tasarimi", label: "Kutu tasarımı" },
        { href: "/ambalaj-tasarimi", label: "Ambalaj tasarımı" },
        { href: "/sss", label: "SSS" },
      ],
      serviceName: "Baskıya hazır dieline",
      serviceType: "PrintReadyDieline",
    },
    "etiket-mi-kutu-mu": {
      slug: "etiket-mi-kutu-mu",
      meta: {
        title: "Etiket mi, kutu mu?",
        description:
          "Etiket, kutu veya ikisi birden: Paxolab stüdyosunda packagingMode box veya label ile ilerleyin. Kısa karar rehberi.",
      },
      hero: {
        title: "Etiket mi, kutu mu?",
        lead: "Şişe yüzeyi mi, katlanır kutu mu, yoksa ikisi birden mi? Brief’te packagingMode’u box veya label seçin; FORMA o yapıya göre üretir.",
      },
      sections: [
        {
          title: "Ne zaman etiket?",
          body: "Şişe, kavanoz veya mevcut bir kabın üzerine yapışan yüzey. Ölçü genelde genişlik × yükseklik; derinlik (W) yok. Yasal metin ve barkod küçük alanda dengelenir.",
        },
        {
          title: "Ne zaman kutu?",
          body: "Katlanır karton, ikincil ambalaj veya hediye formu. L × W × H ve dieline panelleri gerekir. Serum, krem ve parfüm kutuları bu tarafa düşer.",
        },
        {
          title: "İkisi birden",
          body: "Kozmetik ve gıdada sık: şişe etiketi + dış kutu aynı marka sistemi. Stüdyoda iki proje açın veya önce bir yüzeyi bitirip diğerine geçin. packagingMode her üretimde box veya label’dır.",
        },
        {
          title: "Kısa kontrol listesi",
          body: "Kabın üzerine mi yapışıyor, yoksa kendi formu mu var? Ölçülerde derinlik var mı? Raf ve hediye anı kutu mu istiyor? Emin değilseniz etiket ve kutu sayfalarını yan yana okuyun, sonra stüdyoda tipi seçin.",
        },
      ],
      related: [
        { href: "/etiket-tasarimi", label: "Etiket tasarımı" },
        { href: "/kutu-tasarimi", label: "Kutu tasarımı" },
        { href: "/kozmetik-ambalaj-tasarimi", label: "Kozmetik ambalaj" },
        { href: "/gida-ambalaj-tasarimi", label: "Gıda ambalaj" },
      ],
      serviceName: "Etiket mi kutu mu",
      serviceType: "LabelVsBox",
    },
  },

  howItWorks: {
    meta: {
      title: "Nasıl çalışır?",
      description:
        "Paxolab stüdyosu: brief, FORMA üretimi, revizyon ve kredi kullanımı. Adım adım iş akışı.",
    },
    title: "Nasıl çalışır?",
    lead: "Paxolab pazarlama sitesi bilgilendirir; asıl tasarım işi stüdyoda (FORMA) yapılır. Aşağıdaki akış tipik bir oturumu özetler.",
    steps: [
      {
        n: "01",
        title: "Brief’i netleştirin",
        text: "Ürün tipi, ölçü, marka notları ve kısıtları yazın veya sohbetle ilerleyin. Motor yalnızca yapılandırılmış brief üzerinden üretir.",
      },
      {
        n: "02",
        title: "FORMA üretimi",
        text: "Nihai baskı yüzeyi vektör motorudur. Rastgele görsel üretim modeli kullanılmaz; dieline mantığı korunur.",
      },
      {
        n: "03",
        title: "Revizyon",
        text: "Metin, yerleşim ve varyantları revizyonlarla sıkılaştırın. Her üretim ve revizyon kredi harcar.",
      },
      {
        n: "04",
        title: "Kredi & hesap",
        text: "Kayıtta başlangıç kredisi; ek paketler stüdyo içinden alınır. Misafir kullanım yerel kalabilir — kredi ölçümü hesaplı oturumda geçerlidir.",
      },
    ],
    cta: "Stüdyoda dene",
  },

  examples: {
    meta: {
      title: "Örnekler",
      description:
        "Paxolab ambalaj ve etiket örnekleri (gösterim amaçlı). Gerçek projeler stüdyoda üretilir.",
    },
    title: "Örnekler",
    lead: "Aşağıdakiler gösterim amaçlı örnek senaryolardır — gerçek müşteri işi değildir. Stüdyoda kendi brief’inizle deneyin.",
    badge: "Örnek",
    items: [
      {
        title: "Serum kutusu — mat yüzey",
        category: "Kozmetik",
        text: "Tek ürün kutusu, sade tipografi, ön panelde ürün adı ve hacim. Dieline: tuck-end.",
      },
      {
        title: "Zeytinyağı şişe etiketi",
        category: "Etiket",
        text: "Dikey etiket, menşei ve litre bilgisi için ayrılmış bölgeler, sınırlı renk paleti.",
      },
      {
        title: "Niche parfüm dış kutusu",
        category: "Parfüm",
        text: "Minimal marka bloğu, yan panelde not ailesi özeti, hediye raftı için dengeli boşluk.",
      },
      {
        title: "Aksesuar e-ticaret kutusu",
        category: "Kutu",
        text: "Kompakt kilitli taban formu, kargo toleransı düşünülmüş paneller, tek renk baskı senaryosu.",
      },
    ],
  },

  pricing: {
    meta: {
      title: "Fiyatlandırma",
      description:
        "Paxolab kredi paketleri: 50, 150 ve 400 kredi. Satın alma stüdyo faturalamasından yapılır.",
    },
    title: "Fiyatlandırma",
    lead: "Tasarım üretimi ve revizyonlar kredi ile ölçülür. Paketler stüdyo içi faturalamaya bağlıdır; güncel ödeme stüdyoda tamamlanır.",
    note: "Fiyatlar stüdyo kataloğu ile uyumludur (TRY). Kampanya veya değişiklik için stüdyo paneline bakın.",
    packs: [
      {
        id: "pack_50",
        credits: 50,
        priceTry: 99,
        label: "50 Kredi",
        hint: "Deneme ve kısa işler",
      },
      {
        id: "pack_150",
        credits: 150,
        priceTry: 249,
        label: "150 Kredi",
        hint: "Düzenli proje akışı",
        featured: true,
      },
      {
        id: "pack_400",
        credits: 400,
        priceTry: 599,
        label: "400 Kredi",
        hint: "Yoğun üretim dönemi",
      },
    ],
    usage: [
      { action: "Üretim (generate)", cost: "3 kredi" },
      { action: "Revizyon (revise)", cost: "2 kredi" },
      { action: "Kayıt bonusu", cost: "50 başlangıç kredisi" },
    ],
    usageTitle: "Kredi kullanımı",
    creditsUnit: "kredi",
    studioCta: "Stüdyoda paketleri gör",
  },

  faq: {
    meta: {
      title: "Sıkça sorulan sorular",
      description:
        "Paxolab, FORMA, kredi, dieline ve stüdyo kullanımı hakkında SSS.",
    },
    title: "Sıkça sorulan sorular",
    lead: "Paxolab, stüdyo ve krediler hakkında kısa yanıtlar.",
    items: [
      {
        q: "Paxolab ile FORMA arasındaki fark nedir?",
        a: "Paxolab, ürün ve pazarlama markasıdır. FORMA, stüdyonun arkasındaki tasarım motorudur. Bu site bilgilendirir; üretim stüdyoda yapılır.",
      },
      {
        q: "Çıktı gerçekten baskıya uygun mu?",
        a: "Motor vektör yüzey ve dieline mantığıyla üretir. Matbaa spesifikasyonu (CMYK profili, bleed, özel finish) projenize göre doğrulanmalıdır.",
      },
      {
        q: "Krediler nasıl işler?",
        a: "Hesaplı oturumda üretim ve revizyon kredi harcar. Paketler 50 / 150 / 400 kredidir; satın alma stüdyo faturalamasından yapılır.",
      },
      {
        q: "Misafir olarak deneyebilir miyim?",
        a: "Stüdyo yerel kullanım sunabilir. Kredi cüzdanı ve bulut senkronu hesaplı oturum gerektirir.",
      },
      {
        q: "Ajanslar için uygun mu?",
        a: "Evet — brief’i net tutup hızlı varyant üretmeniz gereken durumlarda faydalıdır. Nihai müşteri onayı ve matbaa kontrolü sizde kalır.",
      },
      {
        q: "İngilizce arayüz var mı?",
        a: "Evet — pazarlama sitesinin İngilizce karşılıkları /en altında yayınlanır. Stüdyo arayüz dili ayrı olarak gelişebilir.",
      },
    ],
  },

  contact: {
    meta: {
      title: "İletişim",
      description: "Paxolab ile iletişime geçin. Destek ve iş birliği için e-posta formu.",
    },
    title: "İletişim",
    lead: "Ürün, ortaklık veya destek için yazın. Form backend gerektirmez; e-posta istemciniz açılır.",
    emailLabel: "E-posta",
    subjects: ["Genel soru", "Kurumsal / ajans", "Teknik destek", "Diğer"],
    form: {
      name: "Adınız",
      subject: "Konu",
      message: "Mesajınız",
      submit: "E-posta ile gönder",
    },
    aside:
      "Acil üretim ihtiyacınız varsa doğrudan stüdyoyu açıp brief ile ilerleyin; yanıt süreleri iş günlerine göre değişir.",
  },

  legal: {
    privacy: {
      meta: {
        title: "Gizlilik politikası",
        description: "Paxolab gizlilik politikası özeti.",
      },
      title: "Gizlilik politikası",
      updated: "Son güncelleme: Eylül 2026",
      sections: [
        {
          title: "Kapsam",
          body: "Bu metin Paxolab pazarlama sitesi için kısa bir özetdir. Stüdyo (FORMA) hesabı ve ödeme işlemleri ayrı gizlilik / KVKK metinlerine tabi olabilir.",
        },
        {
          title: "Toplanan veriler",
          body: "İletişim e-postası gönderirseniz ad, e-posta ve mesaj içeriği e-posta iletilir. Site analitiği eklenirse çerez bildirimi güncellenir.",
        },
        {
          title: "İletişim",
          body: "Gizlilik talepleri için merhaba@paxolab.com adresine yazın.",
        },
      ],
    },
    kvkk: {
      meta: {
        title: "KVKK aydınlatma metni",
        description: "Paxolab KVKK aydınlatma metni özeti.",
      },
      title: "KVKK aydınlatma metni",
      updated: "Son güncelleme: Eylül 2026",
      sections: [
        {
          title: "Veri sorumlusu",
          body: "Paxolab markası altında işletilen pazarlama sitesi. İletişim: merhaba@paxolab.com.",
        },
        {
          title: "İşleme amacı",
          body: "İletişim taleplerini yanıtlamak, yasal yükümlülükleri yerine getirmek ve hizmeti geliştirmek.",
        },
        {
          title: "Haklarınız",
          body: "KVKK md. 11 kapsamındaki haklarınız için yukarıdaki e-posta adresine başvurabilirsiniz. Bu sayfa özet niteliğindedir; bağlayıcı metin güncellenebilir.",
        },
      ],
    },
    terms: {
      meta: {
        title: "Kullanım koşulları",
        description: "Paxolab site kullanım koşulları özeti.",
      },
      title: "Kullanım koşulları",
      updated: "Son güncelleme: Eylül 2026",
      sections: [
        {
          title: "Hizmet ayrımı",
          body: "Bu web sitesi bilgilendirme amaçlıdır. Tasarım üretimi, krediler ve ödeme stüdyo uygulamasında gerçekleşir ve kendi koşullarına tabidir.",
        },
        {
          title: "İçerik",
          body: "Örnekler gösterim amaçlıdır. Marka adları ve görseller üçüncü taraf haklarına saygı gösterecek şekilde kullanılmalıdır.",
        },
        {
          title: "Sorumluluk",
          body: "Matbaa ve üretim kararları kullanıcıya aittir. Site içeriği hukuki veya teknik garanti oluşturmaz.",
        },
      ],
    },
  },

  ui: {
    relatedTitle: "İlgili sayfalar",
    openStudio: "Stüdyoyu aç",
    backHome: "Ana sayfa",
    fromPrice: "başlayan",
    tryMonth: "TRY",
    howSecondary: "Nasıl çalışır?",
  },
};

export default content;

export const brand = content.brand;
export const nav = content.nav;
export const footer = content.footer;
export const home = content.home;
export const services = content.services;
export const howItWorks = content.howItWorks;
export const examples = content.examples;
export const pricing = content.pricing;
export const faq = content.faq;
export const contact = content.contact;
export const legal = content.legal;
export const ui = content.ui;

export type { ServicePage } from "@/content/types";
