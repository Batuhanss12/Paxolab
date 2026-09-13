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
    logIn: "Giriş",
    signUp: "Kayıt ol",
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
      { href: "/baskiya-hazir-dieline", label: "Baskıya hazır dieline" },
      { href: "/kozmetik-ambalaj-tasarimi", label: "Kozmetik ambalaj" },
      { href: "/serum-krem-kutusu-tasarimi", label: "Serum / krem kutusu" },
      { href: "/parfum-kutusu-tasarimi", label: "Parfüm kutusu" },
      { href: "/gida-ambalaj-tasarimi", label: "Gıda ambalaj" },
      { href: "/etiket-mi-kutu-mu", label: "Etiket mi kutu mu?" },
      { href: "/ai-ambalaj-tasarimi", label: "AI ambalaj tasarımı" },
      { href: "/nasil-calisir", label: "Nasıl çalışır" },
      { href: "/ornekler", label: "Örnekler" },
      { href: "/fiyatlandirma", label: "Fiyatlandırma" },
      { href: "/sss", label: "SSS" },
      { href: "/private-label-gida-kutusu-brief", label: "Private label gıda brief" },
      { href: "/serum-kutusu-olcu-brief", label: "Serum ölçü brief" },
      { href: "/forma-vektor-motoru-nasil-calisir", label: "FORMA nasıl çalışır?" },
      { href: "/ambalaj-preflight-checklist", label: "Preflight checklist" },
      { href: "/e-ticaret-kutusu-tasarimi", label: "E-ticaret kutusu" },
      { href: "/iletisim", label: "İletişim" },
    ],
  },

  footer: {
    blurb:
      "Paxolab, stüdyo ve tasarım motorunu tek isim altında sunar: baskıya hazır ambalaj, kutu ve etiket. Nihai çıktı vektördür.",
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
        "Paxolab ile kutu, etiket ve bıçak çizimini profesyonelce tasarlayın. Tasarım motoru baskıya hazır vektör üretir. Stüdyoyu hemen deneyin.",
    },
    hero: {
      eyebrow: "Stüdyo + tasarım motoru",
      title: "Ambalajı konuşarak tasarlayın",
      lead: "Brief verin — kutu, etiket ve dieline baskıya hazır vektör olarak çıksın. Görsel model değil; tasarım motoru.",
      primaryCta: "Stüdyoyu aç",
      secondaryCta: "Nasıl çalışır?",
      askPlaceholder: "Paxolab’ya sor…",
      stageHint: "Dieline önizleme",
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
      { href: "/serum-krem-kutusu-tasarimi", label: "Serum / krem kutusu" },
      { href: "/gida-ambalaj-tasarimi", label: "Gıda ambalaj" },
      { href: "/parfum-kutusu-tasarimi", label: "Parfüm kutusu" },
      { href: "/fiyatlandirma", label: "Fiyatlandırma" },
    ],
    extraHubs: [
      { href: "/etiket-mi-kutu-mu", label: "Etiket mi kutu mu?" },
      { href: "/baskiya-hazir-dieline", label: "Baskıya hazır dieline" },
      { href: "/ai-ambalaj-tasarimi", label: "AI ambalaj tasarımı" },
      { href: "/ornekler", label: "Örnekler" },
      { href: "/iletisim", label: "İletişim" },
    ],
    ctaTitle: "Stüdyoda üretmeye başlayın",
    ctaLead:
      "Brief’inizi yazın, FORMA baskıya uygun vektör yüzeyi üretsin. Krediler ve paketler stüdyo içinde.",
  },

  services: {
    "ambalaj-tasarimi": {
      slug: "ambalaj-tasarimi",
      meta: {
        title: "Profesyonel ambalaj tasarım stüdyosu",
        description:
          "Marka ambalajınızı Paxolab ile yapılandırın: form, yüzey ve baskı hazırlığı tek stüdyoda. vektör çıktı.",
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
        { href: "/kozmetik-ambalaj-tasarimi", label: "Kozmetik ambalaj" },
      ],
      faqs: [
        {
          q: "FORMA ambalajı nasıl üretir?",
          a: "Chat veya brief ile ihtiyacı netleştirirsiniz; FORMA dieline üzerinde vektör yüzey üretir. Görsel üretim modeli değil, tasarım motorudur. Asıl iş stüdyoda açılır.",
        },
        {
          q: "Çıktı vektör mü, yoksa görsel mi?",
          a: "Nihai çıktı vektör odaklıdır. Rastgele görsel üretimi kullanılmaz; panelli bir yüzey ve dieline mantığı korunur.",
        },
        {
          q: "Kimler için uygun?",
          a: "Kozmetik, gıda, aksesuar ve perakende markaları; ajanslar ve iç ekipler. Prototip öncesi yapı ve grafik isteyenler stüdyoyu deneyebilir.",
        },
        {
          q: "Fiyatı nerede görürüm?",
          a: "Kredi paketleri fiyatlandırma sayfasında özetlenir; satın alma stüdyo içinden tamamlanır. Bu site bilgilendirir.",
        },
      ],
      serviceName: "Ambalaj tasarımı",
      serviceType: "PackagingDesign",
    },
    "kutu-tasarimi": {
      slug: "kutu-tasarimi",
      meta: {
        title: "Profesyonel kutu tasarımı stüdyosu",
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
        { href: "/serum-krem-kutusu-tasarimi", label: "Serum / krem kutusu" },
        { href: "/etiket-mi-kutu-mu", label: "Etiket mi kutu mu?" },
        { href: "/bicki-cizimi", label: "Bıçak çizimi" },
      ],
      faqs: [
        {
          q: "Kutu tasarımında yapı ve grafik birlikte mi ilerler?",
          a: "Evet. Tuck-end ve kilitli taban gibi yaygın formlarda dieline mantığı korunur; grafik panellere ve katlara göre yerleştirilir.",
        },
        {
          q: "Çıktı matbaaya hazır mı?",
          a: "Motor vektör yüzey ve kesim/kat hatlarını üretim diline yakın tutar. Malzeme, renk ve preflight onayı matbaanızla ayrıca yapılır.",
        },
        {
          q: "Hangi kutu formlarını kullanabilirim?",
          a: "Yaygın katlanır kutu formlarını (örneğin tuck-end, otomatik kilitli taban) brief’te belirtin. Özel formlar için ölçü ve kısıtları stüdyoda paylaşın.",
        },
        {
          q: "Nasıl başlarım?",
          a: "Stüdyoda bir proje açın, ürün tipini seçin ve brief yazın. Pazarlama sitesi bilgilendirir — üretim stüdyoda yapılır.",
        },
      ],
      serviceName: "Kutu tasarımı",
      serviceType: "BoxDesign",
    },
    "etiket-tasarimi": {
      slug: "etiket-tasarimi",
      meta: {
        title: "Baskıya uygun etiket tasarımı",
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
        { href: "/etiket-mi-kutu-mu", label: "Etiket mi kutu mu?" },
        { href: "/ambalaj-tasarimi", label: "Ambalaj tasarımı" },
        { href: "/gida-ambalaj-tasarimi", label: "Gıda ambalaj" },
        { href: "/kutu-tasarimi", label: "Kutu tasarımı" },
      ],
      faqs: [
        {
          q: "Etiket tasarımı kutu tasarımından nasıl ayrılır?",
          a: "Etiket şişe, kavanoz veya tüpün birincil yüzeyidir; kutu katlanır ikinci ambalajdır. Kararsızsanız etiket mi kutu mu sayfasına bakın.",
        },
        {
          q: "Yasal metinler otomatik mi yazılır?",
          a: "Hayır. Zorunlu bilgiler markanın ve danışmanının sorumluluğundadır. Stüdyo okunaklı bölgeler bırakmanıza yardımcı olur; doğruluk sizde kalır.",
        },
        {
          q: "Çıktı baskıya uygun mu?",
          a: "Amaç baskı toleranslı vektör düzendir. Malzeme ve renk onayı matbaa ile ayrıca yapılır. FORMA görsel model değil, tasarım motorudur.",
        },
        {
          q: "Kozmetik şişe etiketi yapabilir miyim?",
          a: "Evet — etiket modunda brief verin. Dış kutu da gerekiyorsa kozmetik ve kutu sayfalarını birlikte kullanın; iş stüdyoda açılır.",
        },
      ],
      serviceName: "Etiket tasarımı",
      serviceType: "LabelDesign",
    },
    "bicki-cizimi": {
      slug: "bicki-cizimi",
      meta: {
        title: "Ambalaj bıçak çizimi ve dieline",
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
        { href: "/baskiya-hazir-dieline", label: "Baskıya hazır dieline" },
        { href: "/kutu-tasarimi", label: "Kutu tasarımı" },
        { href: "/ambalaj-tasarimi", label: "Ambalaj tasarımı" },
        { href: "/sss", label: "SSS" },
      ],
      faqs: [
        {
          q: "Dieline / bıçak çizimi nedir?",
          a: "Dieline, kesim, kat ve yapışkan hatlarının üretim dilidir. Paxolab tasarımı bu yapı üzerinde ilerletir; rastgele bir görsel değildir.",
        },
        {
          q: "FORMA dieline’i nasıl kullanır?",
          a: "Brief’te ürün tipi ve ölçüleri paylaşın; motor yapıya uygun vektör yüzey üretir. Revizyonlarla metin ve grafiği sıkılaştırırsınız.",
        },
        {
          q: "Baskıya hazır dieline sayfasından farkı nedir?",
          a: "Bu sayfa kavram ve yapıyı açıklar. Export ve preflight odağı için baskıya hazır dieline sayfasına bakın; aynı içeriğin kopyası değildir.",
        },
        {
          q: "Her matbaada garanti var mı?",
          a: "Hayır. Amaç üretim diline yakın vektör yapıdır; malzeme ve preflight onayı matbaanıza aittir.",
        },
      ],
            howto: {
        name: 'Bıçak çizimi (dieline) ile ilerleme',
        description: 'Dieline odaklı stüdyo akışı — kavramsal hub için HowTo.',
        steps: [
        { name: 'Formu seçin', text: 'Kutu veya etiket yapısını belirleyin.' },
        { name: 'Ölçüleri girin', text: 'mm cinsinden net değerler.' },
        { name: 'Üretimi çalıştırın', text: 'Dieline üzerinde vektör yüzey.' },
        { name: 'Kontrol edin', text: 'Kesim/kat tutarlılığı.' },
        { name: 'İlgili export sayfasına geçin', text: 'Baskıya hazır dieline / SVG spoke’una bakın.' },
      ],
      },
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
      faqs: [
        {
          q: "Serum ve krem kutusu da bu sayfada mı?",
          a: "Kozmetik hub genel çerçeveyi verir. Serum/krem kutusu dikey sayfası o SKU’lara iner; her iki sayfa da stüdyoya bağlanır.",
        },
        {
          q: "Etiket ve kutu aynı anda mı düşünülür?",
          a: "Çoğu kozmetik SKU’da şişe etiketi ile dış kutu aynı marka sistemindedir. Gerekirse etiket ve kutu sayfalarını birlikte kullanın.",
        },
        {
          q: "Paxolab görsel mi üretir?",
          a: "Hayır. Paxolab vektör tasarım motorudur: brief → dieline + artwork. Moodboard görseli arıyorsanız başka araçlar daha uygun olabilir.",
        },
        {
          q: "İçerik listesi (INCI) otomatik mi eklenir?",
          a: "Hayır. Metin doğruluğu markanın sorumluluğundadır. Stüdyo küçük panellerde okunaklı alan bırakmanıza yardımcı olur.",
        },
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
        { href: "/serum-krem-kutusu-tasarimi", label: "Serum / krem kutusu" },
      ],
      faqs: [
        {
          q: "Parfüm kutusu genel kutu tasarımından nasıl ayrılır?",
          a: "Aynı kutu ve dieline mantığıdır; odak şişe silueti, marka adı ve hediye anı panellerindedir.",
        },
        {
          q: "Yapı nerede netleşir?",
          a: "Bıçak çizimi ve baskıya hazır dieline sayfaları kesim/kat dilini açıklar. Grafik stüdyoda dieline üzerinde üretilir.",
        },
        {
          q: "Çıktı vektör mü?",
          a: "Evet. Paxolab görsel model değil, vektör tasarım motorudur. Asıl iş stüdyoda açılır.",
        },
        {
          q: "Fiyatı nerede görürüm?",
          a: "Krediler fiyatlandırma sayfasında özetlenir; satın alma stüdyo içindedir.",
        },
      ],
      serviceName: "Parfüm kutusu tasarımı",
      serviceType: "PerfumeBoxDesign",
    },
    "gida-ambalaj-tasarimi": {
      slug: "gida-ambalaj-tasarimi",
      meta: {
        title: "Gıda ambalaj tasarımı",
        description:
          "Gıda kutu ve etiket tasarımını Paxolab stüdyosunda brief’ten vektöre taşıyın. Paxolab baskıya hazır yüzey üretir — görsel model değil, tasarım motoru.",
      },
      hero: {
        title: "Gıda ambalaj tasarımı",
        lead: "Gıda markaları için kutu ve etiket yüzeyini brief’ten vektöre taşıyın. Paxolab, rafta okunaklı ve baskıya yönelik bir düzen üretir — görsel üretim modeli değil, tasarım motoru.",
      },
      sections: [
        {
          title: "Raf ve okunaklılık",
          body: "Gıda ambalajında ürün adı, net miktar ve temel bilgiler hızlı okunmalıdır. Paxolab stüdyosunda brief’i panellere böler, hiyerarşiyi sade tutarsınız.",
        },
        {
          title: "Kutu ve etiket birlikte",
          body: "Şişe etiketi ile dış kutu çoğu SKU’da aynı marka sisteminin parçasıdır. İhtiyaca göre kutu tasarımı veya etiket tasarımı sayfalarından ilerleyin; kararsızsanız etiket mi kutu mu rehberine bakın.",
        },
        {
          title: "Brief’ten dieline + vektöre",
          body: "Akış sohbet veya brief ile başlar; FORMA dieline üzerinde vektör artwork üretir. Pazarlama sitesi bilgilendirir — asıl iş stüdyoda açılır.",
        },
        {
          title: "Baskıya hazırlık",
          body: "Amaç rastgele bir görsel değil, üretim diline yakın bir yüzeydir. Yapı tarafı için bıçak çizimi ve baskıya hazır dieline sayfalarını inceleyin; sorularınız için merhaba@paxolab.com.",
        },
      ],
      related: [
        { href: "/private-label-gida-kutusu-brief", label: "Private label gıda brief" },
        { href: "/gida-etiket-zorunlu-bilgi-alanlari", label: "Zorunlu bilgi alanları" },
        { href: "/atistirmalik-kutu-vs-poset", label: "Kutu vs poşet" },
        { href: "/ambalaj-tasarimi", label: "Ambalaj tasarımı" },
        { href: "/etiket-tasarimi", label: "Etiket tasarımı" },
      ],
      faqs: [
        {
          q: "Paxolab gıda ambalajını nasıl üretir?",
          a: "Chat veya brief ile ihtiyacı netleştirirsiniz; FORMA dieline + vektör yüzey üretir. Rastgele bir görsel modeli değil, baskıya yönelik bir tasarım motorudur.",
        },
        {
          q: "Gıda için yasal metinler stüdyoda otomatik mi yazılır?",
          a: "Yasal ve uygunluk metinleri markanın ve danışmanının sorumluluğundadır. Stüdyo panel düzeni ve okunaklılık için alan bırakmanıza yardımcı olur; içerik doğruluğunu siz kontrol edersiniz.",
        },
        {
          q: "Çıktı matbaaya gidebilir mi?",
          a: "Amaç baskıya uygun vektör yüzey ve dieline uyumudur. Matbaa preflight ve malzeme seçimi ayrıca doğrulanmalıdır; bıçak çizimi ve baskıya hazır dieline sayfalarına bakın.",
        },
        {
          q: "Etiket mi kutu mu seçmeliyim?",
          a: "Ürün formuna göre değişir. Kararsızsanız etiket mi kutu mu rehberini ve ilgili hizmet sayfalarını kullanın; gerekirse ikisini aynı marka sisteminde ilerletin.",
        },
        {
          q: "Paxolab bir görsel üretim modeli mi?",
          a: "Hayır. Paxolab bir ambalaj tasarım motorudur: brief → dieline + vektör artwork. Pazarlama sitesi açıklar; tasarım stüdyoda yapılır.",
        },
      ],
      serviceName: "Gıda ambalaj tasarımı",
      serviceType: "FoodPackaging",
    },
    "serum-krem-kutusu-tasarimi": {
      slug: "serum-krem-kutusu-tasarimi",
      meta: {
        title: "Serum ve krem kutusu tasarımı",
        description:
          "Serum ve krem kutusu tasarımını Paxolab stüdyosunda brief’ten vektöre taşıyın. FORMA dieline üzerinde baskıya yönelik yüzey üretir.",
      },
      hero: {
        title: "Serum ve krem kutusu tasarımı",
        lead: "Serum ve krem SKU’ları için sade hiyerarşili kutu yüzeyi. Brief’i Paxolab stüdyosunda dieline + vektöre taşıyın — Paxolab bir tasarım motorudur, görsel model değil.",
      },
      sections: [
        {
          title: "Serum kutusu odakları",
          body: "Dar şişe silueti, ürün tipi ve hacim bilgisi net panellerde durmalı. Aşırı efekt yerine tipografi ve boşluk, premium hissi daha güvenli taşır.",
        },
        {
          title: "Krem kutusu odakları",
          body: "Kavanoz veya tüp ikinci ambalajında benefit satırları ve varyant ayrımı okunaklı olmalı. Set kutularında SKU’ları aynı dilde tutun.",
        },
        {
          title: "Etiket ve kutu aynı sistemde",
          body: "Şişe veya kavanoz etiketi ile dış kutu aynı marka dilini paylaşır. Gerekirse etiket tasarımı ve kozmetik ambalaj sayfalarını birlikte kullanın.",
        },
        {
          title: "Brief’ten vektöre",
          body: "Sohbet veya brief ile başlayın; FORMA dieline üzerinde vektör artwork üretir. Pazarlama sitesi bilgilendirir — tasarım stüdyoda açılır. Sorular: merhaba@paxolab.com.",
        },
      ],
      related: [
        { href: "/serum-kutusu-olcu-brief", label: "Serum ölçü brief" },
        { href: "/krem-kavanoz-etiketi", label: "Krem kavanoz etiketi" },
        { href: "/skincare-set-kutusu", label: "Skincare set kutusu" },
        { href: "/kozmetik-ambalaj-tasarimi", label: "Kozmetik ambalaj" },
        { href: "/kutu-tasarimi", label: "Kutu tasarımı" },
      ],
      faqs: [
        {
          q: "Serum ve krem için ayrı sayfa mı var?",
          a: "Bu hub her iki ürün tipini kapsar; serum ve krem için ayrı bölümler vardır. Genel kozmetik ihtiyaçları için kozmetik ambalaj sayfasını da kullanın.",
        },
        {
          q: "Paxolab görsel mi üretir?",
          a: "Hayır. Paxolab brief’ten dieline + vektör artwork üreten bir tasarım motorudur; image-gen modeli değildir. İş stüdyoda açılır.",
        },
        {
          q: "İçerik listesi (INCI) otomatik mi eklenir?",
          a: "Metin doğruluğu markanın sorumluluğundadır. Stüdyo küçük panellerde okunaklı alan bırakmanıza yardımcı olur.",
        },
        {
          q: "Etiket de gerekir mi?",
          a: "Şişe veya kavanoz etiketi çoğu zaman dış kutuyla aynı dilde çalışır. Kararsızsanız etiket mi kutu mu rehberine bakın.",
        },
        {
          q: "Parfüm kutusuyla farkı nedir?",
          a: "Parfüm kutusu ayrı bir dikey sayfadır; serum/krem bakım hattı ve benefit hiyerarşisine odaklanır. İkisini de kutu + bıçak çizimi akışıyla üretebilirsiniz.",
        },
      ],
      serviceName: "Serum ve krem kutusu tasarımı",
      serviceType: "SerumCreamBox",
    },
    "ai-ambalaj-tasarimi": {
      slug: "ai-ambalaj-tasarimi",
      meta: {
        title: "AI ambalaj tasarımı nedir?",
        description:
          "AI ambalaj tasarımı nedir? Paxolab bir vektör tasarım motorudur: brief’ten dieline + artwork — görsel üretim modeli değil.",
      },
      hero: {
        title: "AI ambalaj tasarımı nedir?",
        lead: "“AI ambalaj” çoğu zaman görsel üretimle karıştırılır. Paxolab’da, chat ve brief’ten dieline + vektör artwork üreten bir tasarım motorudur — image-gen modeli değil.",
      },
      sections: [
        {
          title: "Görsel model ile vektör motor farkı",
          body: "Görsel modeller stilize piksel görüntü üretir. Paxolab ise ambalaj panelleri ve dieline üzerinde baskıya yönelik vektör yüzey üretir. Bu ayrım matbaaya giden dosya kalitesini belirler.",
        },
        {
          title: "Paxolab akışı",
          body: "Sohbet veya brief ile ihtiyacı netleştirirsiniz; stüdyo dieline + artwork üretir ve revizyonu orada sürdürürsünüz. Bu pazarlama sitesi bilgilendirir — asıl iş stüdyoda açılır.",
        },
        {
          title: "Ne zaman bu yaklaşım?",
          body: "Kutu, etiket ve bıçak çizimi aynı sistemde ilerleyecekse vektör motor mantıklıdır. Yalnızca moodboard görseli arıyorsanız farklı araçlar daha uygun olabilir.",
        },
      ],
      related: [
        { href: "/ai-vs-grafik-ajans-ambalaj", label: "AI vs grafik ajans" },
        { href: "/forma-vektor-motoru-nasil-calisir", label: "FORMA nasıl çalışır?" },
        { href: "/ai-ambalaj-mitleri", label: "AI ambalaj mitleri" },
        { href: "/nasil-calisir", label: "Nasıl çalışır?" },
        { href: "/baskiya-hazir-dieline", label: "Baskıya hazır dieline" },
      ],
      faqs: [
        {
          q: "AI ambalaj tasarımı görsel üretim midir?",
          a: "Çoğu araçta öyle sanılır. Paxolab’da vektör tasarım motorudur: sohbet veya brief → dieline + artwork. Image-gen modeli değildir.",
        },
        {
          q: "Chat ile mi çalışıyor?",
          a: "Evet. Sohbet veya brief ile ihtiyacı netleştirirsiniz; üretim ve revizyon stüdyoda devam eder. Bu pazarlama sitesi yalnızca bilgilendirir.",
        },
        {
          q: "Dieline neden önemli?",
          a: "Dieline ambalajın üretim dilidir; paneller, kesim ve katlama bu yapıya bağlıdır. Bıçak çizimi sayfamız yapı tarafını açıklar.",
        },
        {
          q: "Ne zaman bu yaklaşım uygun?",
          a: "Kutu, etiket ve bıçak çizimi aynı sistemde ilerleyecekse vektör motor mantıklıdır. Yalnızca moodboard görseli arıyorsanız başka araçlar daha uygun olabilir.",
        },
        {
          q: "Ücretsiz midir?",
          a: "Kredi kullanımı fiyatlandırma sayfasında anlatılır. Güncel paketler için stüdyoya bakın; sorular için merhaba@paxolab.com.",
        },
      ],
      serviceName: "AI ambalaj tasarımı nedir",
      serviceType: "AiPackagingExplainer",
    },
    "baskiya-hazir-dieline": {
      slug: "baskiya-hazir-dieline",
      meta: {
        title: "Baskıya hazır dieline",
        description:
          "Baskıya hazır dieline ve SVG odaklı export. Paxolab ile brief’ten vektör yüzeye; bıçak çizimi sayfasının üretim tamamlayıcısı.",
      },
      hero: {
        title: "Baskıya hazır dieline",
        lead: "Dieline’i yalnızca kavram olarak değil, vektör export ve preflight bilinciyle ele alın. Paxolab brief’ten dieline + vektör artwork üretir — görsel model değil, tasarım motoru.",
      },
      sections: [
        {
          title: "Baskıya hazır ne demek?",
          body: "Burada amaç, panelli bir yüzeyin kesim/katlama diliyle uyumlu ve vektör olarak taşınabilir olmasıdır. Matbaanın malzeme ve renk onayı ayrıca yapılır; “her matbaada garantili” veya sahte PDF/X iddiası yoktur.",
        },
        {
          title: "SVG ve vektör bilinci",
          body: "Ölçeklenebilir yollar, kesim ile grafiği ayırma ve panel düzeni baskı sürecinde kritiktir. Raster “sahte dieline” görselleri üretim dilinin yerini tutmaz.",
        },
        {
          title: "Bıçak çizimi sayfasıyla ilişki",
          body: "Kavram ve yapı için bıçak çizimi (/bicki-cizimi) sayfamıza bakın. Bu sayfa export / preflight odağını tamamlar; aynı içeriğin kopyası değildir. Üretim Paxolab stüdyosunda başlar.",
        },
        {
          title: "Yüksek seviye kontrol başlıkları",
          body: "Güvenli alan, kesim-grafik ayrımı ve metin okunaklılığını matbaaya sormadan önce gözden geçirin. Güncel export seçenekleri için stüdyoyu açın veya merhaba@paxolab.com yazın.",
        },
      ],
      related: [
        { href: "/svg-dieline-matbaaya-nasil-verilir", label: "SVG matbaaya verme" },
        { href: "/tuck-end-dieline-okuma", label: "Tuck-end dieline okuma" },
        { href: "/ambalaj-preflight-checklist", label: "Preflight checklist" },
        { href: "/bicki-cizimi", label: "Bıçak çizimi" },
        { href: "/kutu-tasarimi", label: "Kutu tasarımı" },
      ],
      faqs: [
        {
          q: "Bu sayfa bıçak çizimi sayfasından nasıl farklı?",
          a: "Bıçak çizimi sayfası dieline kavramını ve stüdyo yapı rolünü anlatır. Bu sayfa export, SVG/vektör bilinci ve yüksek seviye preflight başlıklarına odaklanır.",
        },
        {
          q: "Çıktı SVG mi olur?",
          a: "Paxolab vektör odaklı üretim yapar; export ayrıntıları stüdyo sürümüne göre değişebilir. Güncel formatlar için stüdyoyu açın veya merhaba@paxolab.com yazın.",
        },
        {
          q: "Preflight’ı Paxolab mı yapar?",
          a: "Stüdyo baskıya yönelik yüzey ve dieline uyumu için tasarlanmıştır. Nihai matbaa preflight’ı ve malzeme onayı üretim partnerinizle doğrulanmalıdır.",
        },
        {
          q: "Paxolab görsel mi çiziyor?",
          a: "Hayır. Paxolab brief’ten dieline + vektör artwork üreten bir tasarım motorudur; image-gen modeli değildir.",
        },
        {
          q: "Baskıya hazır ne demek?",
          a: "Panelli yüzeyin kesim/katlama diliyle uyumlu ve vektör olarak taşınabilir olması. “Her matbaada garantili” veya PDF/X iddiası yoktur.",
        },
      ],
            howto: {
        name: 'Baskıya hazır dieline adımları',
        description: 'Dieline kavramından export ve preflight’a kısa HowTo.',
        steps: [
        { name: 'Dieline ihtiyacını tanımlayın', text: 'Kesim, kat, yapışkan hatları üretim dilidir.' },
        { name: 'Brief ve ölçüyü girin', text: 'Stüdyoda formu ve mm değerlerini netleştirin.' },
        { name: 'Üretimi alın', text: 'FORMA panelli vektör yüzey üretir.' },
        { name: 'Preflight ve export', text: 'Kontrol listesini geçip SVG/vektör alın.' },
        { name: 'Matbaa onayı', text: 'Nihai onay sizde/matbaada; abartılı garanti yok.' },
      ],
      },
serviceName: "Baskıya hazır dieline",
      serviceType: "PrintReadyDieline",
    },
    "etiket-mi-kutu-mu": {
      slug: "etiket-mi-kutu-mu",
      meta: {
        title: "Etiket mi kutu mu? Karar rehberi",
        description:
          "Etiket mi kutu mu emin değil misiniz? Paxolab’da iki modu karşılaştırın; brief’ten dieline + vektöre Paxolab ile ilerleyin.",
      },
      hero: {
        title: "Etiket mi, kutu mu?",
        lead: "Ürün formu ve satış anı seçimi belirler. Paxolab’da etiket ve kutu ayrı modlardır; gerekirse aynı marka sisteminde birlikte ilerlersiniz. Paxolab brief’ten vektör üretir — görsel model değil.",
      },
      sections: [
        {
          title: "Etiket seçin eğer…",
          body: "Şişe, kavanoz veya tüpün birincil yüzeyi tasarlanacaksa etiket modu doğrudur. Okunaklı hiyerarşi ve baskıya uygun düzen için etiket tasarımı sayfasına gidin.",
        },
        {
          title: "Kutu seçin eğer…",
          body: "Katlanır kutu, set, hediye veya rafta kutu silueti gerekiyorsa kutu modu ve dieline düşünülür. Kutu tasarımı ve bıçak çizimi sayfaları yapı tarafını tamamlar.",
        },
        {
          title: "Sıkça ikisi birden",
          body: "Kozmetik ve gıdada şişe etiketi ile dış kutu aynı dilde çalışır. Ambalaj tasarımı hub’ı ve kategori sayfaları bu birleşik ihtiyacı çerçeveler.",
        },
        {
          title: "Stüdyoda netleştirin",
          body: "Chat veya brief ile formu ve hedefi yazın; FORMA dieline + vektör artwork üretir. Pazarlama sitesi bilgilendirir — iş stüdyoda açılır. Sorular: merhaba@paxolab.com.",
        },
      ],
      related: [
        { href: "/etiket-ve-kutu-ne-zaman-birlikte", label: "Etiket ve kutu birlikte" },
        { href: "/e-ticaret-kutusu-tasarimi", label: "E-ticaret kutusu" },
        { href: "/sise-wrap-etiket", label: "Şişe wrap etiket" },
        { href: "/etiket-tasarimi", label: "Etiket tasarımı" },
        { href: "/kutu-tasarimi", label: "Kutu tasarımı" },
      ],
      faqs: [
        {
          q: "Şişe için etiket yeterli mi, kutu da gerekir mi?",
          a: "Şişe veya kavanoz birincil yüzeyi için etiket çoğu zaman yeterlidir. Rafta kutu silueti, set veya hediye deneyimi gerekiyorsa kutu (ikincil ambalaj) eklenir.",
        },
        {
          q: "İkisini aynı stüdyo oturumunda yapabilir miyim?",
          a: "Brief’te her iki ihtiyacı belirtebilirsiniz; etiket ve kutu ayrı stüdyo modlarıdır ve aynı marka sistemini destekler. Akış chat → brief → vektör yüzey şeklindedir.",
        },
        {
          q: "Dieline yalnızca kutuda mı gerekir?",
          a: "Katlanır kutu ve benzeri yapılarda dieline / bıçak çizimi merkezidir. Etiketlerde biçim ve kesim farklıdır; yine de baskıya uygun vektör düzen önemlidir.",
        },
        {
          q: "Paxolab hangisini otomatik seçer?",
          a: "Siz brief’te ürün formunu ve hedefi netleştirirsiniz. Paxolab görsel model değil; verdiğiniz brief’e göre dieline + vektör artwork üreten tasarım motorudur.",
        },
        {
          q: "Kararsızsam nereye bakayım?",
          a: "Bu sayfadaki ölçütleri kullanın, ardından etiket veya kutu sayfasına geçin. Hâlâ net değilse merhaba@paxolab.com yazın veya stüdyoda sohbetle ilerleyin.",
        },
      ],
      serviceName: "Etiket mi kutu mu",
      serviceType: "LabelVsBox",
    },
    "private-label-gida-kutusu-brief": {
      slug: "private-label-gida-kutusu-brief",
      meta: {
        title: "Private label gıda kutusu brief’i",
        description:
          "Private label gıda kutusu brief’inde ölçü, panel, yasal alan ve marka kitini netleştirin. FORMA ile brief’ten dieline + vektöre.",
      },
      hero: {
        title: "Private label gıda kutusu brief’i",
        lead: "Matbaaya gitmeden önce ürün adı, net miktar, SKU, ölçü ve panel rezervlerini brief’te toplayın. Paxolab’da FORMA brief’ten dieline + vektör yüzey üretir — görsel model değil, tasarım motoru.",
      },
      sections: [
        {
          title: "Brief’te mutlaka olanlar",
          body: "Ürün adı, net miktar, SKU kodu, hedef raf ve kutu ölçüleri (en/boy/yükseklik veya dieline referansı) olmadan yüzey panellere oturmaz. Bilmiyorsanız matbaa/kalıp notunu brief’e ekleyin.",
        },
        {
          title: "Yapı vs yüzey",
          body: "Dieline / kutu tipi yapı tarafıdır; renk, tipografi ve logo yüzey tarafıdır. İkisini brief’te ayırın. Yapı için bıçak çizimi ve baskıya hazır dieline sayfalarına bakın.",
        },
        {
          title: "Yasal alan paneli",
          body: "Zorunlu bilgi alanları için panel rezervi bırakın. Metin doğruluğu markanın ve danışmanın sorumluluğundadır; stüdyo okunaklı alan düzenine yardımcı olur.",
        },
        {
          title: "Marka kiti ve FORMA akışı",
          body: "Logo, renk ve tipografi notlarını brief’e bağlayın. Akış chat → brief → dieline + vektör artwork. Pazarlama sitesi bilgilendirir; üretim stüdyoda açılır. Sorular: merhaba@paxolab.com.",
        },
      ],
      related: [
        { href: "/gida-ambalaj-tasarimi", label: "Gıda ambalaj" },
        { href: "/gida-etiket-zorunlu-bilgi-alanlari", label: "Zorunlu bilgi alanları" },
        { href: "/atistirmalik-kutu-vs-poset", label: "Kutu vs poşet" },
        { href: "/kutu-tasarimi", label: "Kutu tasarımı" },
        { href: "/bicki-cizimi", label: "Bıçak çizimi" },
      ],
      faqs: [
        {
          q: "Private label brief’inde ölçü şart mı?",
          a: "Evet — en/boy/yükseklik veya dieline referansı yoksa yüzey panellere oturmaz. Bilmiyorsanız matbaa/kalıp ölçüsünü brief’e not edin.",
        },
        {
          q: "FORMA brief’i benim yerime doldurur mu?",
          a: "Chat ile ihtiyacı netleştirmenize yardım eder; ürün yasal metinleri ve marka kararları sizindir. Çıktı dieline + vektör yüzeydir.",
        },
        {
          q: "Private label’da etiket mi kutu mu?",
          a: "Formata bağlı. Kararsızsanız etiket mi kutu mu rehberine ve gıda hub’ına bakın; sık senaryo şişe etiketi + dış kutu.",
        },
      ],
      serviceName: "Private label gıda kutusu brief’i",
      serviceType: "PrivateLabelFoodBoxBrief",
    },
    "gida-etiket-zorunlu-bilgi-alanlari": {
      slug: "gida-etiket-zorunlu-bilgi-alanlari",
      meta: {
        title: "Gıda etiket zorunlu bilgi alanları",
        description:
          "Gıda etiketinde tipik zorunlu bilgi alanları için tasarım checklist’i. Hukuki tavsiye değil; FORMA alan düzeni üretir.",
      },
      hero: {
        title: "Gıda etiket zorunlu bilgi alanları",
        lead: "Etiket yüzeyinde hangi alanların yer bulması gerektiğini tasarım diliyle çerçeveleyin. Bu sayfa hukuki tavsiye değildir — FORMA panel düzeni ve vektör yüzey üretir; metin doğruluğu sizde kalır.",
      },
      sections: [
        {
          title: "Tasarım vs uygunluk",
          body: "Bu sayfa alan yerleşimi ve okunaklılık checklist’idir; güncel mevzuat marka + danışman sorumluluğundadır. “Otomatik yasal uyumlu etiket” iddiası yoktur.",
        },
        {
          title: "Tipik alanlar",
          body: "Ürün adı, içerik listesi, net miktar, menşei, saklama koşulları, üretici/ithalatçı bilgisi sıkça yer ister. Satış ülkesine göre liste değişir — yerelde doğrulayın.",
        },
        {
          title: "Okunaklılık ve hiyerarşi",
          body: "Küçük etiketlerde zorunlu alanlar önce gelir. Sığmazsa arka panel, kutu veya ek etikete taşımayı brief’te belirtin.",
        },
        {
          title: "Panel rezervi ve FORMA",
          body: "FORMA alan bırakmanıza ve baskıya yönelik vektör yüzey üretmeye yardımcı olur; içeriği siz onaylarsınız. Stüdyoyu açın veya merhaba@paxolab.com yazın.",
        },
      ],
      related: [
        { href: "/gida-ambalaj-tasarimi", label: "Gıda ambalaj" },
        { href: "/private-label-gida-kutusu-brief", label: "Private label brief" },
        { href: "/atistirmalik-kutu-vs-poset", label: "Kutu vs poşet" },
        { href: "/etiket-tasarimi", label: "Etiket tasarımı" },
        { href: "/baskiya-hazir-dieline", label: "Baskıya hazır dieline" },
      ],
      faqs: [
        {
          q: "Paxolab yasal metinleri otomatik yazar mı?",
          a: "Hayır. Stüdyo panel ve okunaklılık için alan bırakmanıza yardımcı olur; içerik doğruluğu sizde ve danışmanınızdadır.",
        },
        {
          q: "Küçük etikette her şey sığmazsa?",
          a: "Hiyerarşi kurun: zorunlu alanlar önce. Gerekirse ikincil yüzeye (arka panel, kutu, ek etiket) taşımayı brief’te belirtin.",
        },
        {
          q: "Bu checklist hangi ülkeye göre?",
          a: "Genel tasarım checklist’idir; satış ülkesine göre zorunluluklar değişir. Yerel mevzuatı ayrıca doğrulayın.",
        },
      ],
      serviceName: "Gıda etiket zorunlu bilgi alanları",
      serviceType: "FoodLabelMandatoryFields",
    },
    "atistirmalik-kutu-vs-poset": {
      slug: "atistirmalik-kutu-vs-poset",
      meta: {
        title: "Atıştırmalık: kutu mu, poşet mi?",
        description:
          "Atıştırmalık ambalajında kutu ve poşet karar kriterleri: raf, koruma, marka algısı. FORMA ile brief’ten vektöre.",
      },
      hero: {
        title: "Atıştırmalık ambalaj: kutu mu, poşet mi?",
        lead: "Raf duruşu, koruma, doldurma hattı ve marka algısı formatı belirler. Paxolab’da seçimi brief’e yazın; FORMA yapı + vektör yüzey üretir — image-gen değil.",
      },
      sections: [
        {
          title: "Karar kriterleri",
          body: "Raf silueti, bariyer ihtiyacı, hat uyumu ve hediye/set algısını aynı brief’te tartın. Kesin “poşet her zaman daha ucuz” iddiası yoktur.",
        },
        {
          title: "Kutu seçenekleri",
          body: "Katlanır kutu yapı, dieline ve set/hediye potansiyeli sunar. Kutu tasarımı ve bıçak çizimi sayfaları yapı tarafını tamamlar.",
        },
        {
          title: "Poşet / esnek ve ikisi birden",
          body: "Poşet yüzey alanı ve bariyer için güçlü olabilir; iç poşet + dış kutu sık birleşimdir. Kararsızsanız etiket mi kutu mu rehberine bakın.",
        },
        {
          title: "Brief’e formatı yazmak",
          body: "Formatı, ölçüyü ve baskı yöntemini net yazın. FORMA her yüzey için dieline + vektör mantığıyla ilerler. Stüdyo CTA · merhaba@paxolab.com.",
        },
      ],
      related: [
        { href: "/gida-ambalaj-tasarimi", label: "Gıda ambalaj" },
        { href: "/private-label-gida-kutusu-brief", label: "Private label brief" },
        { href: "/gida-etiket-zorunlu-bilgi-alanlari", label: "Zorunlu bilgi alanları" },
        { href: "/etiket-mi-kutu-mu", label: "Etiket mi kutu mu?" },
        { href: "/kutu-tasarimi", label: "Kutu tasarımı" },
      ],
      faqs: [
        {
          q: "Atıştırmalıkta hangi format daha “premium” durur?",
          a: "Raf ve marka diline bağlıdır. Katlanır kutu genelde hediye/set algısı verir; poşet hızlı tüketim ve bariyer için güçlü olabilir.",
        },
        {
          q: "İç poşet + dış kutu Paxolab’da tek projede mi?",
          a: "Brief’te iki yüzeyi net ayırın. FORMA her yüzey için dieline + vektör mantığıyla ilerler; marka sistemini tutarlı tutun.",
        },
        {
          q: "Poşet için de dieline var mı?",
          a: "Esnek ambalajda kalıp/şablon dili farklı olabilir. Brief’e ölçü ve baskı yöntemini yazın; baskıya hazırlık hub’ına bakın.",
        },
      ],
      serviceName: "Atıştırmalık kutu vs poşet",
      serviceType: "SnackBoxVsPouch",
    },
    "serum-kutusu-olcu-brief": {
      slug: "serum-kutusu-olcu-brief",
      meta: {
        title: "Serum kutusu ölçü brief’i",
        description:
          "Serum şişesine oturan kutu için ölçü brief’i: tolerans, paneller, dropper notları. FORMA ile dieline + vektör.",
      },
      hero: {
        title: "Serum kutusu ölçü brief’i",
        lead: "Şişe ölçüleri ile kutu iç boşluğunu toleransla düşünün. Paxolab’da brief’e panel listesini yazın; FORMA dieline + vektör yüzey üretir — uydurma “her serum X mm” tablosu yoktur.",
      },
      sections: [
        {
          title: "Şişe vs iç boşluk",
          body: "Cap dahil yükseklik, gövde çapı/genişlik ve çıkıntıları not edin. İç boşluk toleransı kalıp ve malzeme ile netleşir; matbaa onayı ayrı adımdır.",
        },
        {
          title: "Panel listesi",
          body: "Ön, arka, yan ve kapak/tuck panellerini brief’te sayın. Dropper veya pompa çıkıntısı için koruma notu ekleyin.",
        },
        {
          title: "Brief şablonu",
          body: "Hacim (ml), kabaca boyut, marka dili ve regülasyon alanlarını yazın. Ölçü yoksa tahmini yapı risklidir — kalıp kesinleşince dieline’ı güncelleyin.",
        },
        {
          title: "FORMA’da dieline + yüzey",
          body: "FORMA vektör tasarım motorudur. Kozmetik, kutu ve bıçak çizimi sayfalarıyla köprüleyin. Stüdyo · merhaba@paxolab.com.",
        },
      ],
      related: [
        { href: "/serum-krem-kutusu-tasarimi", label: "Serum / krem kutusu" },
        { href: "/krem-kavanoz-etiketi", label: "Krem kavanoz etiketi" },
        { href: "/skincare-set-kutusu", label: "Skincare set kutusu" },
        { href: "/kozmetik-ambalaj-tasarimi", label: "Kozmetik ambalaj" },
        { href: "/bicki-cizimi", label: "Bıçak çizimi" },
      ],
      faqs: [
        {
          q: "Şişe ölçümünü nasıl almalıyım?",
          a: "Cap dahil yükseklik, gövde çapı/genişlik ve en kritik çıkıntıyı not edin. Mümkünse fiziksel numune veya teknik çizim brief’e eklenir.",
        },
        {
          q: "Ölçü yoksa FORMA kutu üretir mi?",
          a: "Tahmini yapı ile ilerlemek risklidir. En azından hedef hacim (ml) ve kabaca boyut verin; kalıp kesinleşince dieline’ı güncelleyin.",
        },
        {
          q: "Serum kutusu ile parfüm kutusu aynı mı?",
          a: "Yapı benzer olabilir; panel metinleri, regülasyon ve ürün silüeti farklıdır. İlgili kozmetik / parfüm sayfalarına bakın.",
        },
      ],
      serviceName: "Serum kutusu ölçü brief’i",
      serviceType: "SerumBoxSizeBrief",
    },
    "krem-kavanoz-etiketi": {
      slug: "krem-kavanoz-etiketi",
      meta: {
        title: "Krem kavanoz etiketi tasarımı",
        description:
          "Krem kavanoz etiketi: eğri yüzey, wrap/spot, INCI hiyerarşisi. FORMA ile baskıya yönelik vektör yüzey.",
      },
      hero: {
        title: "Krem kavanoz etiketi tasarımı",
        lead: "Kavanoz geometrisinde wrap veya spot etiket seçin; içerik/INCI alanlarını hiyerarşiyle yerleştirin. FORMA image-gen değil — baskıya yönelik vektör yüzey üretir.",
      },
      sections: [
        {
          title: "Wrap vs spot",
          body: "Brief’e çap, etiket yüksekliği ve overlap (bindirme) notunu ekleyin. Baskı öncesi fiziksel mock veya matbaa şablonu doğrulanmalıdır.",
        },
        {
          title: "İçerik / INCI hiyerarşisi",
          body: "Küçük yüzeyde benefit, varyant ve yasal metin dengelenir. Metin doğruluğu marka sorumluluğundadır.",
        },
        {
          title: "Kapak / alt etiket ve dış kutu",
          body: "Kapak üstü veya alt etiket senaryolarını brief’te belirtin. E-ticaret ve hediye setlerinde dış kutu sık eklenir — etiket mi kutu mu rehberine bakın.",
        },
        {
          title: "FORMA ile vektör yüzey",
          body: "Etiket tasarımı ve serum/krem hub’ı ile aynı marka dilinde ilerleyin. Stüdyo · merhaba@paxolab.com.",
        },
      ],
      related: [
        { href: "/serum-krem-kutusu-tasarimi", label: "Serum / krem kutusu" },
        { href: "/serum-kutusu-olcu-brief", label: "Serum ölçü brief" },
        { href: "/skincare-set-kutusu", label: "Skincare set kutusu" },
        { href: "/etiket-tasarimi", label: "Etiket tasarımı" },
        { href: "/etiket-mi-kutu-mu", label: "Etiket mi kutu mu?" },
      ],
      faqs: [
        {
          q: "Kavanoz etiketinde eğrilik nasıl hesaba katılır?",
          a: "Brief’e çap, etiket yüksekliği ve overlap (bindirme) notunu ekleyin. Baskı öncesi fiziksel mock veya matbaa şablonu doğrulanmalıdır.",
        },
        {
          q: "Sadece etiket yeterli mi, kutu da gerekir mi?",
          a: "Kanal ve marka diline bağlı. E-ticaret ve hediye setlerinde dış kutu sık eklenir — karar sayfasına bakın.",
        },
        {
          q: "FORMA kavanoz 3D’si mi üretir?",
          a: "Odak baskıya yönelik vektör yüzey ve yapı dilidir; pazarlama sitesi bilgilendirir, tasarım stüdyoda yapılır.",
        },
      ],
      serviceName: "Krem kavanoz etiketi tasarımı",
      serviceType: "CreamJarLabel",
    },
    "skincare-set-kutusu": {
      slug: "skincare-set-kutusu",
      meta: {
        title: "Skincare set kutusu tasarımı",
        description:
          "Skincare set kutusu: çoklu SKU, insert, hediye ve unboxing. FORMA ile brief’ten dieline + artwork.",
      },
      hero: {
        title: "Skincare set kutusu tasarımı",
        lead: "Çoklu ürünü tek marka yüzeyinde toplayın. Set içeriği, insert ihtiyacı ve dış panel metinlerini brief’e yazın; FORMA dieline + vektör üretir.",
      },
      sections: [
        {
          title: "Set içeriği ve yerleşim",
          body: "Hangi SKU’ların hangi sırada duracağını netleştirin. Bileşen etiketleri ile dış kutu metinlerini ayrı brief satırları olarak tutun.",
        },
        {
          title: "Insert vs sade kutu",
          body: "Kırılgan şişeler ve unboxing için insert sık tercih edilir. Malzeme notunu brief’e ekleyin; kesin kalıp matbaada doğrulanır.",
        },
        {
          title: "Hediye ve e-ticaret yüzeyi",
          body: "Dış yüzey hediye algısı ve açılış deneyimini taşıyabilir. E-ticaret odaklıysa dayanıklılığı ayrı spoke ile birlikte düşünün.",
        },
        {
          title: "Brief → FORMA",
          body: "Kozmetik hub, kutu ve bıçak çizimi sayfalarıyla köprüleyin. Stüdyo · merhaba@paxolab.com.",
        },
      ],
      related: [
        { href: "/serum-krem-kutusu-tasarimi", label: "Serum / krem kutusu" },
        { href: "/serum-kutusu-olcu-brief", label: "Serum ölçü brief" },
        { href: "/krem-kavanoz-etiketi", label: "Krem kavanoz etiketi" },
        { href: "/kozmetik-ambalaj-tasarimi", label: "Kozmetik ambalaj" },
        { href: "/e-ticaret-kutusu-tasarimi", label: "E-ticaret kutusu" },
      ],
      faqs: [
        {
          q: "Set kutusunda her ürünün etiketi ayrı mı tasarlanır?",
          a: "Genelde evet — birincil ambalaj etiketleri + dış kutu panelleri ayrı brief satırlarıdır. Marka sistemini tutarlı tutun.",
        },
        {
          q: "Insert şart mı?",
          a: "Kırılgan şişeler ve unboxing deneyimi için sık tercih edilir. Brief’e insert ihtiyacını ve malzeme notunu yazın.",
        },
        {
          q: "Set kutusu e-ticaret kargosuna uygun mu olmalı?",
          a: "Satış kanalına göre. E-ticaret odaklıysa dayanıklılık ve açılış deneyimini brief’e ekleyin; ilgili e-ticaret spoke’una bakın.",
        },
      ],
      serviceName: "Skincare set kutusu tasarımı",
      serviceType: "SkincareSetBox",
    },
    "ai-vs-grafik-ajans-ambalaj": {
      slug: "ai-vs-grafik-ajans-ambalaj",
      meta: {
        title: "AI ambalaj mı, grafik ajans mı?",
        description:
          "AI ambalaj ile grafik ajansı ne zaman? FORMA vektör motoru vs image-gen; dürüst sınırlar, hibrit senaryolar.",
      },
      hero: {
        title: "AI ambalaj mı, grafik ajans mı?",
        lead: "Hız, dieline/yapı, marka stratejisi ve revizyon ekseninde karşılaştırın. Paxolab ajansın yerini alan sihir iddiası taşımaz; FORMA brief’ten baskıya yönelik vektör yüzey üretir.",
      },
      sections: [
        {
          title: "Karşılaştırma eksenleri",
          body: "Hız, yapı/dieline, marka stratejisi ve revizyon döngüsünü aynı çerçevede tartın. “Her zaman daha ucuz/hızlı” kesin iddiası yoktur.",
        },
        {
          title: "Image-gen vs FORMA",
          body: "Image-gen stilize piksel üretir. FORMA Midjourney/DALL·E değildir; ambalaj panelleri ve dieline üzerinde vektör tasarım motorudur.",
        },
        {
          title: "Ajansın ve Paxolab’ın güçleri",
          body: "Ajans strateji, kampanya ve kompleks sistemlerde güçlüdür. Paxolab brief → baskıya yönelik yüzey stüdyo motorunda güçlüdür. Hibrit kullanım sık görülür.",
        },
        {
          title: "Hibrit senaryolar",
          body: "Ajans marka dilini kurar; FORMA dieline + vektör yüzeyi üretir — veya tersi. Parent hub ve mitler spoke’u ayrımı netleştirir. merhaba@paxolab.com.",
        },
      ],
      related: [
        { href: "/ai-ambalaj-tasarimi", label: "AI ambalaj tasarımı" },
        { href: "/forma-vektor-motoru-nasil-calisir", label: "FORMA nasıl çalışır?" },
        { href: "/ai-ambalaj-mitleri", label: "AI ambalaj mitleri" },
        { href: "/ambalaj-tasarimi", label: "Ambalaj tasarımı" },
        { href: "/nasil-calisir", label: "Nasıl çalışır?" },
      ],
      faqs: [
        {
          q: "Paxolab bir ajansın yerini alır mı?",
          a: "Hayır iddiası yok. Ambalaj brief’inden vektör yüzeye giden stüdyo motorudur; geniş marka stratejisi için ajans hâlâ gerekebilir.",
        },
        {
          q: "Ajans çıktısını FORMA’ya aktarabilir miyim?",
          a: "Marka kiti ve ölçüleri brief’e taşıyabilirsiniz. Amaç baskıya yönelik yapı + yüzey üretmektir.",
        },
        {
          q: "“AI ambalaj” arayanlar neyi karıştırıyor?",
          a: "Sıkça görsel üretim ile dieline/vektör tasarımı. Parent hub ve mitler spoke’u bu ayrımı netleştirir.",
        },
      ],
      serviceName: "AI vs grafik ajans ambalaj",
      serviceType: "AiVsDesignAgencyPackaging",
    },
    "forma-vektor-motoru-nasil-calisir": {
      slug: "forma-vektor-motoru-nasil-calisir",
      meta: {
        title: "FORMA vektör motoru nasıl çalışır?",
        description:
          "FORMA vektör motoru: chat → brief → dieline + artwork. Image-gen değil; Paxolab stüdyo tasarım motoru.",
      },
      hero: {
        title: "FORMA vektör motoru nasıl çalışır?",
        lead: "FORMA, brief’ten dieline + vektör artwork üreten bir ambalaj tasarım motorudur — görsel üretim modeli değil. Pazarlama sitesi bilgilendirir; stüdyo tasarlar.",
      },
      sections: [
        {
          title: "Vektör motor vs görsel model",
          body: "Görsel modeller stilize piksel üretir. FORMA panelli yüzey ve dieline dilinde baskıya yönelik vektör üretir.",
        },
        {
          title: "Akış: chat → brief → dieline + artwork",
          body: "İhtiyacı sohbet veya brief ile netleştirirsiniz; üretim ve revizyon stüdyoda sürer. Nasıl çalışır sayfasıyla uyumludur.",
        },
        {
          title: "Ne üretir / ne üretmez?",
          body: "Üretir: dieline mantıklı vektör yüzey. Üretmez: rastgele moodboard görseli, otomatik yasal metin, “saniyede matbaa garantisi”.",
        },
        {
          title: "Sonraki adım: preflight",
          body: "Baskıya hazır dieline hub’ı ve preflight checklist ile matbaa onayına hazırlanın. merhaba@paxolab.com.",
        },
      ],
      related: [
        { href: "/ai-ambalaj-tasarimi", label: "AI ambalaj tasarımı" },
        { href: "/ai-vs-grafik-ajans-ambalaj", label: "AI vs grafik ajans" },
        { href: "/ai-ambalaj-mitleri", label: "AI ambalaj mitleri" },
        { href: "/nasil-calisir", label: "Nasıl çalışır?" },
        { href: "/baskiya-hazir-dieline", label: "Baskıya hazır dieline" },
      ],
      faqs: [
        {
          q: "FORMA bir image generator mı?",
          a: "Hayır. Brief’ten dieline + vektör artwork üreten bir ambalaj tasarım motorudur.",
        },
        {
          q: "Chat zorunlu mu?",
          a: "İhtiyacı netleştirmek için sohbet/brief kullanılır; nihai kararlar ve yasal metinler sizde kalır.",
        },
        {
          q: "Çıktıyı matbaaya hemen gönderebilir miyim?",
          a: "Amaç baskıya uygun vektördür; matbaa preflight ve malzeme onayı ayrıca yapılır — baskıya hazır dieline hub’ına bakın.",
        },
      ],
            howto: {
        name: 'FORMA vektör motoru nasıl kullanılır?',
        description: 'Chat ve brief’ten dieline üzerinde vektör artwork’e giden akış.',
        steps: [
        { name: 'Brief’i netleştirin', text: 'Ürün tipi, ölçü, marka notları; sohbet yardımcı olur.' },
        { name: 'Şablon / dieline seçin', text: 'Yapı panelleri üretim dilinde kurulur.' },
        { name: 'FORMA üretimi', text: 'Nihai baskı yüzeyi vektör motordur; rastgele görsel model değil.' },
        { name: 'Revize edin', text: 'Metin ve yerleşimi iterasyonlarla sıkılaştırın.' },
        { name: 'Export / stüdyo devamı', text: 'Krediler ve paketler stüdyo içindedir.' },
      ],
      },
serviceName: "FORMA vektör motoru nasıl çalışır",
      serviceType: "FormaVectorEngineExplainer",
    },
    "ai-ambalaj-mitleri": {
      slug: "ai-ambalaj-mitleri",
      meta: {
        title: "AI ambalaj mitleri",
        description:
          "AI ambalaj mitleri: görsel ≠ matbaa, dieline şart, yasal metin otomatik değil. Paxolab + FORMA gerçekçi beklenti.",
      },
      hero: {
        title: "AI ambalaj mitleri",
        lead: "Doğru bilinen yanlışları kısa “gerçek” cevaplarıyla ayıklayın. Paxolab FORMA’yı vektör tasarım motoru olarak konumlandırır — marketing açıklar, stüdyo üretir.",
      },
      sections: [
        {
          title: "Mit: AI = rastgele güzel görsel → matbaa",
          body: "Gerçek: Görsel model çıktısı ile dieline + vektör yüzey farklıdır. Baskı öncesi preflight gerekir.",
        },
        {
          title: "Mit: Dieline’a gerek kalmaz",
          body: "Gerçek: Kesim/katlama dili olmadan panelli üretim risklidir. Bıçak çizimi ve baskıya hazır hub’lara bakın.",
        },
        {
          title: "Mit: Yasal metinler otomatik doğru çıkar",
          body: "Gerçek: Metin doğruluğu marka ve danışman sorumluluğundadır. Stüdyo alan bırakır, içerik onayı sizdedir.",
        },
        {
          title: "Mit: Ajans / tasarımcı tamamen biter",
          body: "Gerçek: Geniş strateji ve kampanya için ajans hâlâ gerekebilir. FORMA ambalaj brief → vektör yüzeye odaklanır. merhaba@paxolab.com.",
        },
      ],
      related: [
        { href: "/ai-ambalaj-tasarimi", label: "AI ambalaj tasarımı" },
        { href: "/forma-vektor-motoru-nasil-calisir", label: "FORMA nasıl çalışır?" },
        { href: "/ai-vs-grafik-ajans-ambalaj", label: "AI vs grafik ajans" },
        { href: "/baskiya-hazir-dieline", label: "Baskıya hazır dieline" },
        { href: "/sss", label: "SSS" },
      ],
      faqs: [
        {
          q: "AI ile üretilen her ambalaj baskıya hazır mı?",
          a: "Hayır. Görsel model çıktısı ile dieline + vektör yüzey farklıdır. Baskı öncesi preflight gerekir.",
        },
        {
          q: "Paxolab bu mitleri nasıl ele alıyor?",
          a: "FORMA’yı vektör tasarım motoru olarak konumlandırır; marketing site açıklar, stüdyo üretir.",
        },
        {
          q: "Mitleri okuduktan sonra ne yapmalıyım?",
          a: "Parent hub’ı ve “FORMA nasıl çalışır?” spoke’unu okuyun; ardından stüdyoda brief ile deneyin.",
        },
      ],
      serviceName: "AI ambalaj mitleri",
      serviceType: "AiPackagingMyths",
    },
    "svg-dieline-matbaaya-nasil-verilir": {
      slug: "svg-dieline-matbaaya-nasil-verilir",
      meta: {
        title: "SVG dieline matbaaya nasıl verilir?",
        description:
          "SVG dieline teslim notları: paket içeriği, katman/stroke/mm, matbaaya sorular. Garantili format iddiası yok.",
      },
      hero: {
        title: "SVG dieline matbaaya nasıl verilir?",
        lead: "Export ve iletişim checklist’i — “SVG her matbaada sorunsuz” iddiası yoktur. FORMA baskıya yönelik vektör/dieline üretir; dosyayı siz iletir ve preflight’tan geçirirsiniz.",
      },
      sections: [
        {
          title: "SVG ve diğer formatlar",
          body: "SVG ölçeklenebilir vektör kaynağıdır; birçok matbaa PDF tercih eder. Kaynağı saklayıp istedikleri export’a çevirin.",
        },
        {
          title: "Teslim paketinde ne olmalı?",
          body: "Dieline, artwork, ölçü birimi (mm), kesim/crease ayrımı ve malzeme notları. Sadece SVG genelde yetmez.",
        },
        {
          title: "Katman / stroke / birim",
          body: "Kesim ile grafiği karıştırmayın; stroke’ları ve mm birimini kontrol edin. Preflight checklist spoke’una bakın.",
        },
        {
          title: "Matbaaya 5 soru ve sonraki adım",
          body: "Tercih format, renk profili, bleed, malzeme ve proof sürecini sorun. Paxolab çıktısından sonra dosyayı siz iletirsiniz. merhaba@paxolab.com.",
        },
      ],
      related: [
        { href: "/baskiya-hazir-dieline", label: "Baskıya hazır dieline" },
        { href: "/tuck-end-dieline-okuma", label: "Tuck-end dieline okuma" },
        { href: "/ambalaj-preflight-checklist", label: "Preflight checklist" },
        { href: "/bicki-cizimi", label: "Bıçak çizimi" },
        { href: "/kutu-tasarimi", label: "Kutu tasarımı" },
      ],
      faqs: [
        {
          q: "Sadece SVG göndermek yeterli mi?",
          a: "Genelde hayır. Artwork, ölçü birimi, kesim/crease ayrımı ve malzeme notları da gerekir; matbaanın tercih formatını sorun.",
        },
        {
          q: "FORMA doğrudan matbaa hesabına mı yükler?",
          a: "Hayır. Stüdyo baskıya yönelik vektör/dieline üretir; dosyayı siz matbaaya iletir ve preflight’tan geçirirsiniz.",
        },
        {
          q: "PDF isterlerse ne olur?",
          a: "Birçok matbaa PDF tercih eder. SVG’yi kaynak/vektör olarak saklayıp onların istediği export’a çevirin.",
        },
      ],
            howto: {
        name: 'SVG dieline dosyasını matbaaya hazırlama',
        description: 'Paxolab/FORMA çıktısını matbaaya iletmeden önce kontrol edin. Nihai matbaa onayı sizde ve matbaadadır.',
        steps: [
        { name: 'Ölçü ve formu netleştirin', text: 'Kutu tipi ve mm ölçülerini brief’e yazın; dieline panellere oturur.' },
        { name: 'Stüdyoda üretin', text: 'FORMA vektör yüzey ve dieline mantığıyla üretir; image-gen değildir.' },
        { name: 'Preflight’ı okuyun', text: 'Uyarıları giderin; tutarsız panel/ölçü maliyet yaratır.' },
        { name: 'SVG/vektör export alın', text: 'Dosyayı matbaanın istediği formatta paketleyin.' },
        { name: 'Matbaa ile doğrulayın', text: 'Kesim, kat, malzeme ve renk profili onayı matbaada tamamlanır.' },
      ],
      },
serviceName: "SVG dieline matbaaya nasıl verilir",
      serviceType: "SvgDielineToPrinter",
    },
    "tuck-end-dieline-okuma": {
      slug: "tuck-end-dieline-okuma",
      meta: {
        title: "Tuck-end dieline nasıl okunur?",
        description:
          "Tuck-end dieline: kesim, crease, bleed ve paneller. Eğitim rehberi; evrensel çizgi rengi standardı yok.",
      },
      hero: {
        title: "Tuck-end dieline nasıl okunur?",
        lead: "Katlanır kutu dieline dilini öğrenin: kesim, crease, bleed ve ön/arka/yan/flap panelleri. Matbaalar çizgi kodlarını farklı kullanabilir — tek evrensel standart iddiası yoktur.",
      },
      sections: [
        {
          title: "Tuck-end nedir?",
          body: "Uçları içeri kıvrılan yaygın katlanır kutu tipidir. Temel flap mantığı benzerdir; ölçü ve yapıştırma kalıba göre değişir.",
        },
        {
          title: "Kesim, crease, bleed",
          body: "Kesim dış sınır, crease kat yeri, bleed taşmadır. Artwork panellerin basılacak yüzüne oturur; çizgilerle karıştırmayın.",
        },
        {
          title: "Paneller ve yapıştırma",
          body: "Ön / arka / yan / flap panellerini tanıyın. Grain ve yapıştırma kulağı yüksek seviyede brief notudur.",
        },
        {
          title: "Brief’te tuck-end (FORMA)",
          body: "Kutu tipini brief’te belirtin; motor dieline + vektör yüzey mantığıyla çalışır. Kesin kalıp matbaa ile doğrulanır. merhaba@paxolab.com.",
        },
      ],
      related: [
        { href: "/baskiya-hazir-dieline", label: "Baskıya hazır dieline" },
        { href: "/svg-dieline-matbaaya-nasil-verilir", label: "SVG matbaaya verme" },
        { href: "/ambalaj-preflight-checklist", label: "Preflight checklist" },
        { href: "/bicki-cizimi", label: "Bıçak çizimi" },
        { href: "/kutu-tasarimi", label: "Kutu tasarımı" },
      ],
      faqs: [
        {
          q: "Tuck-end her kutuda aynı mı görünür?",
          a: "Temel flap mantığı benzerdir; ölçü, grain ve yapıştırma detayı kalıba göre değişir.",
        },
        {
          q: "Dieline’da yazı nereye gelir?",
          a: "Artwork panellerin basılacak yüzüne oturur; kesim çizgisi ve bleed’i karıştırmayın. Preflight checklist’e bakın.",
        },
        {
          q: "FORMA tuck-end mi üretir?",
          a: "Brief’te kutu tipini belirtirsiniz; motor dieline + vektör yüzey mantığıyla çalışır. Kesin kalıp matbaa ile doğrulanır.",
        },
      ],
            howto: {
        name: 'Tuck-end dieline nasıl okunur?',
        description: 'Tuck-end kutuda ön/arka, yan ve kapak panellerini ayırt etme adımları.',
        steps: [
        { name: 'Yapıyı tanıyın', text: 'Tuck-end: ön/arka L×H, yan W×H, kapak L×W mantığı.' },
        { name: 'Ön paneli bulun', text: 'Marka ve ürün adının durduğu ana yüz.' },
        { name: 'Yan ve sırtı ayırın', text: 'Derinlik panelleri; varyant bilgisi sık buraya gelir.' },
        { name: 'Kapak ve kilitleri kontrol edin', text: 'Tuck flap ve tutarlılık hatları.' },
        { name: 'Stüdyoda uygulayın', text: 'Brief’te tuck-end şablonunu seçip vektör üretin.' },
      ],
      },
serviceName: "Tuck-end dieline okuma",
      serviceType: "TuckEndDielineReading",
    },
    "ambalaj-preflight-checklist": {
      slug: "ambalaj-preflight-checklist",
      meta: {
        title: "Ambalaj preflight checklist",
        description:
          "Baskıdan önce ambalaj preflight checklist: ölçü, bleed, font, renk soruları. Matbaa onayı şart; %100 garanti yok.",
      },
      hero: {
        title: "Ambalaj preflight checklist",
        lead: "Maliyetli hataları önlemek için yapı ve artwork kontrollerini tarayın. Checklist başlangıçtır; matbaa onayı şarttır. FORMA doğru yapı/yüzey üretir — otomatik “preflight geçer” iddiası yoktur.",
      },
      sections: [
        {
          title: "Neden preflight?",
          body: "Yanlış ölçü, bleed veya font baskıda pahalıya mal olur. Bu liste başlangıçtır; matbaa standartları değişir.",
        },
        {
          title: "Yapı kontrolleri",
          body: "Ölçü, dieline eşleşmesi ve bleed’i kontrol edin. Bıçak çizimi ve SVG teslim spoke’larıyla köprüleyin.",
        },
        {
          title: "Artwork ve renk",
          body: "Font, overprint notu ve varsa raster çözünürlüğünü gözden geçirin. Renk profili/spot’u matbaaya sorun — evrensel profil vaadi yok.",
        },
        {
          title: "Paxolab sonrası sizin adımlarınız",
          body: "Stüdyo çıktısından sonra checklist + matbaa preflight. merhaba@paxolab.com.",
        },
      ],
      related: [
        { href: "/baskiya-hazir-dieline", label: "Baskıya hazır dieline" },
        { href: "/svg-dieline-matbaaya-nasil-verilir", label: "SVG matbaaya verme" },
        { href: "/tuck-end-dieline-okuma", label: "Tuck-end dieline okuma" },
        { href: "/bicki-cizimi", label: "Bıçak çizimi" },
        { href: "/ambalaj-tasarimi", label: "Ambalaj tasarımı" },
      ],
      faqs: [
        {
          q: "Preflight’ı kim yapar?",
          a: "Siz + matbaa. Paxolab baskıya yönelik vektör/dieline üretir; nihai preflight matbaa standartlarına göre yapılır.",
        },
        {
          q: "Checklist’te renk profili var mı?",
          a: "Evet, soru olarak: matbaanın istediği profil/spot’u sorun. Tek bir evrensel profil vaadi yok.",
        },
        {
          q: "FORMA preflight’ı otomatik geçer mi?",
          a: "Hayır iddiası yok. Amaç doğru yapı ve yüzey; siz checklist ve matbaa ile doğrularsınız.",
        },
      ],
            howto: {
        name: 'Ambalaj preflight kontrol listesi',
        description: 'Baskıya geçmeden önce dieline ve yüzey kontrolü. Paxolab dürüst kapılarla uyarır; garanti yerine kontrol listesi.',
        steps: [
        { name: 'Ölçüleri doğrulayın', text: 'En/boy/yükseklik veya dieline referansı brief ile uyumlu mu?' },
        { name: 'Panel metinlerini kontrol edin', text: 'Marka, ürün, zorunlu alanlar doğru panellerde mi?' },
        { name: 'Kesim ve kat hatlarını gözden geçirin', text: 'Dieline üretim dili net mi?' },
        { name: 'Barcode/logo dürüstlüğü', text: 'Barcode yalnızca sizin verdiğiniz veriyle; uydurma yok.' },
        { name: 'Export öncesi son geçiş', text: 'SVG/vektör çıktısını açıp görsel kontrol yapın.' },
      ],
      },
serviceName: "Ambalaj preflight checklist",
      serviceType: "PackagingPreflightChecklist",
    },
    "etiket-ve-kutu-ne-zaman-birlikte": {
      slug: "etiket-ve-kutu-ne-zaman-birlikte",
      meta: {
        title: "Etiket ve kutu ne zaman birlikte?",
        description:
          "Etiket ve kutu ne zaman birlikte? Şişe+dış kutu, set, hediye senaryoları. FORMA ile paralel yüzeyler.",
      },
      hero: {
        title: "Etiket ve kutu ne zaman birlikte?",
        lead: "Birincil (ürün) ve ikincil (kutu) yüzeyleri aynı marka dilinde, farklı bilgi yoğunluğuyla çalıştırın. “Her üründe ikisi şart” değildir — senaryoya göre karar verin.",
      },
      sections: [
        {
          title: "Tipik senaryolar",
          body: "Şişe + dış kutu, kavanoz + set, hediye ve e-ticaret unboxing sık birleşimlerdir.",
        },
        {
          title: "Rol ayrımı",
          body: "Etiket birincil ürün yüzeyi; kutu ikincil koruma ve raf/hediye yüzüdür. Bilgi yoğunluğunu buna göre dağıtın.",
        },
        {
          title: "Marka sistemi",
          body: "Aynı dil, farklı paneller. Brief’te iki yüzeyi ayrı satırlarda yazın; etiket ve kutu sayfalarına bakın.",
        },
        {
          title: "FORMA ile paralel yüzeyler",
          body: "FORMA her yüzey için dieline/vektör mantığıyla ilerler. Parent karar hub’ı ile başlayın. merhaba@paxolab.com.",
        },
      ],
      related: [
        { href: "/etiket-mi-kutu-mu", label: "Etiket mi kutu mu?" },
        { href: "/e-ticaret-kutusu-tasarimi", label: "E-ticaret kutusu" },
        { href: "/sise-wrap-etiket", label: "Şişe wrap etiket" },
        { href: "/etiket-tasarimi", label: "Etiket tasarımı" },
        { href: "/kutu-tasarimi", label: "Kutu tasarımı" },
      ],
      faqs: [
        {
          q: "Sadece etiketle başlayıp sonra kutu ekleyebilir miyim?",
          a: "Evet. Marka dilini baştan tutarlı kurun; kutu eklenince panel metinlerini yeniden dağıtın.",
        },
        {
          q: "İkisi birden maliyeti ikiye mi katlar?",
          a: "Kesin rakam yok; iki üretim kalemi demektir. Fiyatlandırma sayfasına bakın, matbaadan teklif alın.",
        },
        {
          q: "Paxolab ikisini aynı marka sisteminde üretebilir mi?",
          a: "Brief’te her yüzeyi ayırın. FORMA her biri için dieline/vektör mantığıyla ilerler.",
        },
      ],
      serviceName: "Etiket ve kutu ne zaman birlikte",
      serviceType: "LabelAndBoxTogether",
    },
    "e-ticaret-kutusu-tasarimi": {
      slug: "e-ticaret-kutusu-tasarimi",
      meta: {
        title: "E-ticaret kutusu tasarımı",
        description:
          "E-ticaret kutusu: unboxing, koruma, raf vs kargo. FORMA ile brief’ten dieline + vektör; kargo testi yok.",
      },
      hero: {
        title: "E-ticaret kutusu tasarımı",
        lead: "DTC / online satışta unboxing ve korumayı birlikte düşünün. FORMA yapı + vektör üretir; drop/kargo testleri sizde / lojistik partnerinizde — “hasarı %0’a indirir” iddiası yoktur.",
      },
      sections: [
        {
          title: "Raf kutusu vs kargo kutusu",
          body: "Raftaki siluet ile kargo dayanıklılığı farklı öncelikler taşıyabilir; aynı olmak zorunda değildir.",
        },
        {
          title: "Unboxing panelleri",
          body: "İlk izlenim, insert ve sticker’ı brief’te planlayın. Marka deneyimi istiyorsanız özel kutu veya sleeve düşünün.",
        },
        {
          title: "Koruma ve birincil ambalaj",
          body: "Boşluk ve kırılgan ürün notlarını yazın. Ürün etiketi ile dış kutu ilişkisini etiket/kutu karar hub’ında netleştirin.",
        },
        {
          title: "Brief → FORMA",
          body: "Kutu tasarımı, bıçak çizimi ve baskıya hazır sayfalarla köprüleyin. Stüdyo · merhaba@paxolab.com.",
        },
      ],
      related: [
        { href: "/etiket-mi-kutu-mu", label: "Etiket mi kutu mu?" },
        { href: "/etiket-ve-kutu-ne-zaman-birlikte", label: "Etiket ve kutu birlikte" },
        { href: "/sise-wrap-etiket", label: "Şişe wrap etiket" },
        { href: "/kutu-tasarimi", label: "Kutu tasarımı" },
        { href: "/skincare-set-kutusu", label: "Skincare set kutusu" },
      ],
      faqs: [
        {
          q: "E-ticaret kutusu ile raftaki kutu aynı mı olmalı?",
          a: "Olabilir ama şart değil. Kargo dayanıklılığı ve unboxing, raftan farklı öncelikler taşıyabilir.",
        },
        {
          q: "Sadece koli üzerine etiket yeter mi?",
          a: "Bazı SKU’larda evet. Marka deneyimi istiyorsanız özel kutu veya sleeve düşünün — karar hub’ına bakın.",
        },
        {
          q: "FORMA kargo testi yapar mı?",
          a: "Hayır. Tasarım motoru yapı + vektör üretir; drop/kargo testleri sizde / lojistik partnerinizde.",
        },
      ],
      serviceName: "E-ticaret kutusu tasarımı",
      serviceType: "EcommerceBoxDesign",
    },
    "sise-wrap-etiket": {
      slug: "sise-wrap-etiket",
      meta: {
        title: "Şişe wrap etiket tasarımı",
        description:
          "Şişe wrap etiket: ölçü, overlap, bindirme ve yüzey düzeni. FORMA ile baskıya yönelik vektör; malzeme garantisi yok.",
      },
      hero: {
        title: "Şişe wrap etiket tasarımı",
        lead: "Wrap ile front/back farkını bilin; çap × yükseklikten açık etiket boyutu ve overlap hesaplayın. FORMA baskıya yönelik vektör üretir — “her şişeye otomatik wrap” iddiası yoktur.",
      },
      sections: [
        {
          title: "Wrap vs front/back",
          body: "360° wrap tek yüzeydir; front/back iki panelli sistemdir. Brief’te hangisini istediğinizi yazın.",
        },
        {
          title: "Ölçü ve overlap",
          body: "Çap × yükseklik → açık etiket boyutu + overlap. Hedef overlap’i brief’e yazın; matbaa/uygulama hattı ile doğrulayın.",
        },
        {
          title: "Bindirme ve yasal alanlar",
          body: "Dikiş/bindirme bölgesinde kritik logo veya barkod olmamalı. Yasal/içerik alanları ve okuma yönünü planlayın; metin sorumluluğu sizde.",
        },
        {
          title: "Wrap + dış kutu",
          body: "Bilgi sığmazsa ikinci etiket veya dış kutu panelleri kullanın — “ikisi birden” spoke’una bakın. merhaba@paxolab.com.",
        },
      ],
      related: [
        { href: "/etiket-mi-kutu-mu", label: "Etiket mi kutu mu?" },
        { href: "/etiket-ve-kutu-ne-zaman-birlikte", label: "Etiket ve kutu birlikte" },
        { href: "/e-ticaret-kutusu-tasarimi", label: "E-ticaret kutusu" },
        { href: "/etiket-tasarimi", label: "Etiket tasarımı" },
        { href: "/krem-kavanoz-etiketi", label: "Krem kavanoz etiketi" },
      ],
      faqs: [
        {
          q: "Wrap etikette overlap ne kadar olmalı?",
          a: "Malzeme ve uygulamaya göre değişir. Brief’e hedef overlap’i yazın; matbaa/uygulama hattı ile doğrulayın.",
        },
        {
          q: "Wrap yeterince bilgi sığdırmıyorsa?",
          a: "Tipografi hiyerarşisi, ikinci etiket veya dış kutu panelleri kullanın — “ikisi birden” spoke’una bakın.",
        },
        {
          q: "FORMA şişe 360° mock’u mu verir?",
          a: "Odak baskıya yönelik vektör yüzeydir. Pazarlama sitesi bilgilendirir; üretim stüdyoda, fiziksel doğrulama matbaada.",
        },
      ],
      serviceName: "Şişe wrap etiket tasarımı",
      serviceType: "BottleWrapLabel",
    },
  },
  howItWorks: {
    meta: {
      title: "Paxolab stüdyosu nasıl çalışır?",
      description:
        "Paxolab stüdyosu: brief, üretim, revizyon ve kredi kullanımı. Adım adım iş akışı.",
    },
    title: "Nasıl çalışır?",
    lead: "Paxolab pazarlama sitesi bilgilendirir; asıl tasarım işi stüdyoda yapılır. Aşağıdaki akış tipik bir oturumu özetler.",
    steps: [
      {
        n: "01",
        title: "Brief’i netleştirin",
        text: "Ürün tipi, ölçü, marka notları ve kısıtları yazın veya sohbetle ilerleyin. Motor yalnızca yapılandırılmış brief üzerinden üretir.",
      },
      {
        n: "02",
        title: "Motor üretimi",
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
      title: "Ambalaj ve etiket tasarım örnekleri",
      description:
        "Paxolab gösterim amaçlı ambalaj ve etiket senaryoları. Gerçek projeler stüdyoda üretilir; rastgele görsel model değildir.",
    },
    title: "Örnekler",
    lead: "Aşağıdakiler gösterim amaçlı senaryolardır — gerçek müşteri işi değildir. Her kart ilgili hub veya spoke’a bağlanır; asıl üretim stüdyoda brief’inizle yapılır.",
    badge: "Örnek",
    items: [
      {
        title: "Serum kutusu — mat yüzey",
        category: "Kozmetik",
        text: "Tek ürün tuck-end kutusu; ön panelde ürün adı ve hacim, sade tipografi. FORMA vektör yüzey üretir.",
        href: "/serum-krem-kutusu-tasarimi",
      },
      {
        title: "Zeytinyağı şişe etiketi",
        category: "Gıda / etiket",
        text: "Dikey etiket; menşei ve litre için ayrılmış bölgeler, sınırlı palet. Gıda okunabilirliği öncelikli.",
        href: "/gida-ambalaj-tasarimi",
      },
      {
        title: "Niche parfüm dış kutusu",
        category: "Parfüm",
        text: "Minimal marka bloğu, yan panelde not özeti, hediye raftı için boşluk. Yapı + yüzey birlikte.",
        href: "/parfum-kutusu-tasarimi",
      },
      {
        title: "Aksesuar e-ticaret kutusu",
        category: "E-ticaret",
        text: "Kompakt kargo dostu kutu; tek renk baskı senaryosu, net marka paneli.",
        href: "/e-ticaret-kutusu-tasarimi",
      },
      {
        title: "Private label atıştırmalık kutusu",
        category: "Gıda",
        text: "PL markası için brief odaklı kutu: ürün adı, net miktar alanı, sade hiyerarşi.",
        href: "/private-label-gida-kutusu-brief",
      },
      {
        title: "Krem kavanoz sargı etiketi",
        category: "Kozmetik / etiket",
        text: "Kavanoz çevresi wrap etiket; içerik listesi ve marka bloğu ayrı bölgelerde.",
        href: "/krem-kavanoz-etiketi",
      },
      {
        title: "Şişe wrap etiket — tek renk",
        category: "Etiket",
        text: "Silindirik şişe wrap; yapışkan overlap ve okuma yönü düşünülmüş panel.",
        href: "/sise-wrap-etiket",
      },
      {
        title: "Skincare set kutusu",
        category: "Kozmetik",
        text: "İki ürünlü set kutusu; iç düzen ve dış marka yüzü net ayrılmış paneller.",
        href: "/skincare-set-kutusu",
      },
    ],
  },

  pricing: {
    meta: {
      title: "Paxolab kredi paketleri ve fiyatlar",
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
      title: "Paxolab SSS: stüdyo, kredi, dieline",
      description:
        "Paxolab, kredi, dieline ve stüdyo kullanımı hakkında SSS.",
    },
    title: "Sıkça sorulan sorular",
    lead: "Paxolab, stüdyo ve krediler hakkında kısa yanıtlar.",
    items: [
      {
        q: "Paxolab nedir?",
        a: "Paxolab tek üründür: ambalaj tasarım stüdyosu ve tasarım motoru aynı isim altında. Bu pazarlama sitesi bilgilendirir; üretim stüdyoda yapılır.",
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
      title: "Paxolab ile iletişime geçin",
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
        title: "Paxolab gizlilik politikası",
        description: "Paxolab gizlilik politikası özeti.",
      },
      title: "Gizlilik politikası",
      updated: "Son güncelleme: Eylül 2026",
      sections: [
        {
          title: "Kapsam",
          body: "Bu metin Paxolab pazarlama sitesi için kısa bir özetdir. Stüdyo hesabı ve ödeme işlemleri ayrı gizlilik / KVKK metinlerine tabi olabilir.",
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
        title: "Paxolab kullanım koşulları",
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
    faqTitle: "Sıkça sorulan sorular",
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
