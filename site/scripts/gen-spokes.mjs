/**
 * Generate 15 spoke ServicePages + routes + i18n patches for paxolab-site.
 */
import fs from "fs";
import path from "path";

const ROOT = "/workspace/paxolab-site";
const TR = path.join(ROOT, "src/content/tr.ts");
const EN = path.join(ROOT, "src/content/en.ts");
const I18N = path.join(ROOT, "src/lib/i18n.ts");

/** @typedef {{ title: string, body: string }} Section */
/** @typedef {{ q: string, a: string }} Faq */
/** @typedef {{
 *  trSlug: string, enSlug: string,
 *  tr: { metaTitle: string, metaDesc: string, heroTitle: string, heroLead: string, sections: Section[], related: {href:string,label:string}[], faqs: Faq[], serviceName: string, serviceType: string },
 *  en: { metaTitle: string, metaDesc: string, heroTitle: string, heroLead: string, sections: Section[], related: {href:string,label:string}[], faqs: Faq[], serviceName: string, serviceType: string },
 *  navLabelTr: string, navLabelEn: string,
 *  parentTr: string, parentEn: string
 * }} Spoke */

/** @type {Spoke[]} */
const spokes = [
  // 1
  {
    trSlug: "private-label-gida-kutusu-brief",
    enSlug: "private-label-food-box-brief",
    parentTr: "gida-ambalaj-tasarimi",
    parentEn: "food-packaging-design",
    navLabelTr: "Private label gıda brief",
    navLabelEn: "Private-label food brief",
    tr: {
      metaTitle: "Private label gıda kutusu brief’i",
      metaDesc:
        "Private label gıda kutusu brief’inde ölçü, panel, yasal alan ve marka kitini netleştirin. FORMA ile brief’ten dieline + vektöre.",
      heroTitle: "Private label gıda kutusu brief’i",
      heroLead:
        "Matbaaya gitmeden önce ürün adı, net miktar, SKU, ölçü ve panel rezervlerini brief’te toplayın. Paxolab’da FORMA brief’ten dieline + vektör yüzey üretir — görsel model değil, tasarım motoru.",
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
    en: {
      metaTitle: "Private-label food box brief",
      metaDesc:
        "Clarify size, panels, legal space, and brand kit in a private-label food box brief. FORMA: brief → dieline + vector.",
      heroTitle: "Private-label food box brief",
      heroLead:
        "Before print, capture product name, net quantity, SKU, dimensions, and panel reserves in the brief. On Paxolab, FORMA turns brief into dieline + vector art — a design engine, not an image model.",
      sections: [
        {
          title: "Must-haves in the brief",
          body: "Without product name, net quantity, SKU, target shelf, and box dimensions (L/W/H or a dieline reference), artwork will not sit on panels. If unknown, note printer/die dimensions in the brief.",
        },
        {
          title: "Structure vs surface",
          body: "Dieline / carton style is structure; color, type, and logo are surface. Separate them in the brief. See dieline and print-ready dieline pages for structure.",
        },
        {
          title: "Legal-field panel reserve",
          body: "Reserve panels for mandatory info fields. Content accuracy is the brand’s and adviser’s responsibility; the studio helps with readable layout.",
        },
        {
          title: "Brand kit and FORMA flow",
          body: "Attach logo, color, and type notes to the brief. Flow: chat → brief → dieline + vector artwork. The marketing site informs; production opens in the studio. Questions: merhaba@paxolab.com.",
        },
      ],
      related: [
        { href: "/en/food-packaging-design", label: "Food packaging" },
        { href: "/en/food-label-mandatory-info-fields", label: "Mandatory info fields" },
        { href: "/en/snack-box-vs-pouch", label: "Box vs pouch" },
        { href: "/en/box-design", label: "Box design" },
        { href: "/en/dieline", label: "Dieline" },
      ],
      faqs: [
        {
          q: "Are dimensions required in a private-label brief?",
          a: "Yes — without L/W/H or a dieline reference, artwork will not fit panels. If you do not know them yet, note printer/die size in the brief.",
        },
        {
          q: "Does FORMA fill the brief for me?",
          a: "Chat helps clarify needs; legal copy and brand decisions stay yours. Output is dieline + vector surface.",
        },
        {
          q: "For private label, label or box?",
          a: "Depends on format. If unsure, see label vs box and the food hub; a common pattern is bottle label + outer carton.",
        },
      ],
      serviceName: "Private-label food box brief",
      serviceType: "PrivateLabelFoodBoxBrief",
    },
  },
  // 2
  {
    trSlug: "gida-etiket-zorunlu-bilgi-alanlari",
    enSlug: "food-label-mandatory-info-fields",
    parentTr: "gida-ambalaj-tasarimi",
    parentEn: "food-packaging-design",
    navLabelTr: "Gıda etiket zorunlu alanlar",
    navLabelEn: "Food label mandatory fields",
    tr: {
      metaTitle: "Gıda etiket zorunlu bilgi alanları",
      metaDesc:
        "Gıda etiketinde tipik zorunlu bilgi alanları için tasarım checklist’i. Hukuki tavsiye değil; FORMA alan düzeni üretir.",
      heroTitle: "Gıda etiket zorunlu bilgi alanları",
      heroLead:
        "Etiket yüzeyinde hangi alanların yer bulması gerektiğini tasarım diliyle çerçeveleyin. Bu sayfa hukuki tavsiye değildir — FORMA panel düzeni ve vektör yüzey üretir; metin doğruluğu sizde kalır.",
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
    en: {
      metaTitle: "Mandatory food label info fields",
      metaDesc:
        "A designer checklist for typical mandatory food-label fields. Not legal advice; FORMA helps with layout space.",
      heroTitle: "Mandatory food label info fields",
      heroLead:
        "Frame which fields need space on the label surface in design language. This page is not legal advice — FORMA produces panel layout and vector art; you own content accuracy.",
      sections: [
        {
          title: "Design vs compliance",
          body: "This is a layout and readability checklist; current regulation is the brand’s and adviser’s responsibility. There is no “automatically compliant label” claim.",
        },
        {
          title: "Typical fields",
          body: "Product name, ingredients, net quantity, origin, storage, and manufacturer/importer often need space. Lists vary by sales country — verify locally.",
        },
        {
          title: "Readability and hierarchy",
          body: "On small labels, mandatory fields come first. If they do not fit, note moving content to a back panel, carton, or secondary label in the brief.",
        },
        {
          title: "Panel reserve and FORMA",
          body: "FORMA helps reserve space and produce print-oriented vector surfaces; you approve content. Open the studio or email merhaba@paxolab.com.",
        },
      ],
      related: [
        { href: "/en/food-packaging-design", label: "Food packaging" },
        { href: "/en/private-label-food-box-brief", label: "Private-label brief" },
        { href: "/en/snack-box-vs-pouch", label: "Box vs pouch" },
        { href: "/en/label-design", label: "Label design" },
        { href: "/en/print-ready-dieline", label: "Print-ready dieline" },
      ],
      faqs: [
        {
          q: "Does Paxolab auto-write legal copy?",
          a: "No. The studio helps reserve readable panel space; content accuracy stays with you and your adviser.",
        },
        {
          q: "What if everything does not fit a small label?",
          a: "Set hierarchy: mandatory fields first. Note moving overflow to a secondary face (back panel, carton, extra label) in the brief.",
        },
        {
          q: "Which country is this checklist for?",
          a: "It is a general design checklist; requirements vary by sales market. Verify local regulation separately.",
        },
      ],
      serviceName: "Mandatory food label info fields",
      serviceType: "FoodLabelMandatoryFields",
    },
  },
  // 3
  {
    trSlug: "atistirmalik-kutu-vs-poset",
    enSlug: "snack-box-vs-pouch",
    parentTr: "gida-ambalaj-tasarimi",
    parentEn: "food-packaging-design",
    navLabelTr: "Atıştırmalık kutu vs poşet",
    navLabelEn: "Snack box vs pouch",
    tr: {
      metaTitle: "Atıştırmalık: kutu mu, poşet mi?",
      metaDesc:
        "Atıştırmalık ambalajında kutu ve poşet karar kriterleri: raf, koruma, marka algısı. FORMA ile brief’ten vektöre.",
      heroTitle: "Atıştırmalık ambalaj: kutu mu, poşet mi?",
      heroLead:
        "Raf duruşu, koruma, doldurma hattı ve marka algısı formatı belirler. Paxolab’da seçimi brief’e yazın; FORMA yapı + vektör yüzey üretir — image-gen değil.",
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
    en: {
      metaTitle: "Snack packaging: box or pouch?",
      metaDesc:
        "Decision criteria for snack box vs pouch: shelf, protection, brand feel. FORMA: brief → vector surface.",
      heroTitle: "Snack packaging: box or pouch?",
      heroLead:
        "Shelf stance, protection, filling line, and brand feel drive the format. Write the choice into the Paxolab brief; FORMA produces structure + vector surface — not image-gen.",
      sections: [
        {
          title: "Decision criteria",
          body: "Weigh shelf silhouette, barrier needs, line fit, and gift/set feel in one brief. There is no hard claim that “pouch is always cheaper.”",
        },
        {
          title: "Box options",
          body: "Folding cartons offer structure, dieline, and set/gift potential. Box design and dieline pages complete the structure side.",
        },
        {
          title: "Pouch / flexible and both",
          body: "Pouches can excel for surface area and barrier; inner pouch + outer carton is common. If unsure, see the label vs box guide.",
        },
        {
          title: "Write the format into the brief",
          body: "State format, size, and print method clearly. FORMA advances each surface with dieline + vector logic. Studio CTA · merhaba@paxolab.com.",
        },
      ],
      related: [
        { href: "/en/food-packaging-design", label: "Food packaging" },
        { href: "/en/private-label-food-box-brief", label: "Private-label brief" },
        { href: "/en/food-label-mandatory-info-fields", label: "Mandatory info fields" },
        { href: "/en/label-vs-box", label: "Label vs box" },
        { href: "/en/box-design", label: "Box design" },
      ],
      faqs: [
        {
          q: "Which snack format looks more “premium”?",
          a: "It depends on shelf and brand language. Folding cartons often read as gift/set; pouches can be strong for fast consumption and barrier.",
        },
        {
          q: "Inner pouch + outer carton in one Paxolab project?",
          a: "Separate the two surfaces clearly in the brief. FORMA proceeds per surface with dieline + vector logic; keep one brand system.",
        },
        {
          q: "Do pouches have a dieline too?",
          a: "Flexible packs may use a different die/template language. Put size and print method in the brief; see the print-ready hub.",
        },
      ],
      serviceName: "Snack box vs pouch",
      serviceType: "SnackBoxVsPouch",
    },
  },
  // 4
  {
    trSlug: "serum-kutusu-olcu-brief",
    enSlug: "serum-box-size-brief",
    parentTr: "serum-krem-kutusu-tasarimi",
    parentEn: "serum-cream-box-design",
    navLabelTr: "Serum kutusu ölçü brief",
    navLabelEn: "Serum box size brief",
    tr: {
      metaTitle: "Serum kutusu ölçü brief’i",
      metaDesc:
        "Serum şişesine oturan kutu için ölçü brief’i: tolerans, paneller, dropper notları. FORMA ile dieline + vektör.",
      heroTitle: "Serum kutusu ölçü brief’i",
      heroLead:
        "Şişe ölçüleri ile kutu iç boşluğunu toleransla düşünün. Paxolab’da brief’e panel listesini yazın; FORMA dieline + vektör yüzey üretir — uydurma “her serum X mm” tablosu yoktur.",
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
    en: {
      metaTitle: "Serum box size brief",
      metaDesc:
        "Size brief for a serum carton that fits the bottle: tolerance, panels, dropper notes. FORMA: dieline + vector.",
      heroTitle: "Serum box size brief",
      heroLead:
        "Think bottle dimensions versus inner clearance with tolerance. On Paxolab, list panels in the brief; FORMA produces dieline + vector — no invented “every serum is X mm” table.",
      sections: [
        {
          title: "Bottle vs inner clearance",
          body: "Note height including cap, body diameter/width, and protrusions. Clearance tolerance is finalized with die and material; printer approval is a separate step.",
        },
        {
          title: "Panel list",
          body: "Enumerate front, back, side, and lid/tuck panels in the brief. Add a protection note for dropper or pump protrusion.",
        },
        {
          title: "Brief template",
          body: "Write volume (ml), rough size, brand language, and regulatory fields. Guessing structure without size is risky — update the dieline when the die is final.",
        },
        {
          title: "Dieline + surface in FORMA",
          body: "FORMA is a vector design engine. Bridge to cosmetic, box, and dieline pages. Studio · merhaba@paxolab.com.",
        },
      ],
      related: [
        { href: "/en/serum-cream-box-design", label: "Serum / cream box" },
        { href: "/en/cream-jar-label", label: "Cream jar label" },
        { href: "/en/skincare-set-box", label: "Skincare set box" },
        { href: "/en/cosmetic-packaging-design", label: "Cosmetic packaging" },
        { href: "/en/dieline", label: "Dieline" },
      ],
      faqs: [
        {
          q: "How should I measure the bottle?",
          a: "Note height including cap, body diameter/width, and the most critical protrusion. Add a physical sample or tech drawing to the brief when possible.",
        },
        {
          q: "Can FORMA make a box without dimensions?",
          a: "Guessing structure is risky. At least give target volume (ml) and rough size; update the dieline when the die is locked.",
        },
        {
          q: "Is a serum box the same as a perfume box?",
          a: "Structure can be similar; panel copy, regulation, and product silhouette differ. See the related cosmetic / perfume pages.",
        },
      ],
      serviceName: "Serum box size brief",
      serviceType: "SerumBoxSizeBrief",
    },
  },
  // 5
  {
    trSlug: "krem-kavanoz-etiketi",
    enSlug: "cream-jar-label",
    parentTr: "serum-krem-kutusu-tasarimi",
    parentEn: "serum-cream-box-design",
    navLabelTr: "Krem kavanoz etiketi",
    navLabelEn: "Cream jar label",
    tr: {
      metaTitle: "Krem kavanoz etiketi tasarımı",
      metaDesc:
        "Krem kavanoz etiketi: eğri yüzey, wrap/spot, INCI hiyerarşisi. FORMA ile baskıya yönelik vektör yüzey.",
      heroTitle: "Krem kavanoz etiketi tasarımı",
      heroLead:
        "Kavanoz geometrisinde wrap veya spot etiket seçin; içerik/INCI alanlarını hiyerarşiyle yerleştirin. FORMA image-gen değil — baskıya yönelik vektör yüzey üretir.",
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
    en: {
      metaTitle: "Cream jar label design",
      metaDesc:
        "Cream jar labels: curved surface, wrap/spot, INCI hierarchy. FORMA produces print-oriented vector art.",
      heroTitle: "Cream jar label design",
      heroLead:
        "Choose wrap or spot for jar geometry; place ingredients/INCI with hierarchy. FORMA is not image-gen — it produces print-oriented vector surfaces.",
      sections: [
        {
          title: "Wrap vs spot",
          body: "Add diameter, label height, and overlap notes to the brief. Validate with a physical mock or printer template before press.",
        },
        {
          title: "Ingredients / INCI hierarchy",
          body: "Balance benefit, variant, and legal copy on a small face. Content accuracy is the brand’s responsibility.",
        },
        {
          title: "Lid / base labels and outer carton",
          body: "Note lid-top or base-label scenarios in the brief. Ecommerce and gift sets often add an outer carton — see label vs box.",
        },
        {
          title: "Vector surface with FORMA",
          body: "Keep one brand language with label design and the serum/cream hub. Studio · merhaba@paxolab.com.",
        },
      ],
      related: [
        { href: "/en/serum-cream-box-design", label: "Serum / cream box" },
        { href: "/en/serum-box-size-brief", label: "Serum size brief" },
        { href: "/en/skincare-set-box", label: "Skincare set box" },
        { href: "/en/label-design", label: "Label design" },
        { href: "/en/label-vs-box", label: "Label vs box" },
      ],
      faqs: [
        {
          q: "How is jar curvature accounted for?",
          a: "Add diameter, label height, and overlap to the brief. Validate with a physical mock or printer template before print.",
        },
        {
          q: "Is a label enough, or do I need a box too?",
          a: "Depends on channel and brand language. Ecommerce and gift sets often add an outer carton — see the decision page.",
        },
        {
          q: "Does FORMA produce a 3D jar?",
          a: "Focus is print-oriented vector surface and structure language; the marketing site informs, design happens in the studio.",
        },
      ],
      serviceName: "Cream jar label design",
      serviceType: "CreamJarLabel",
    },
  },
  // 6
  {
    trSlug: "skincare-set-kutusu",
    enSlug: "skincare-set-box",
    parentTr: "serum-krem-kutusu-tasarimi",
    parentEn: "serum-cream-box-design",
    navLabelTr: "Skincare set kutusu",
    navLabelEn: "Skincare set box",
    tr: {
      metaTitle: "Skincare set kutusu tasarımı",
      metaDesc:
        "Skincare set kutusu: çoklu SKU, insert, hediye ve unboxing. FORMA ile brief’ten dieline + artwork.",
      heroTitle: "Skincare set kutusu tasarımı",
      heroLead:
        "Çoklu ürünü tek marka yüzeyinde toplayın. Set içeriği, insert ihtiyacı ve dış panel metinlerini brief’e yazın; FORMA dieline + vektör üretir.",
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
    en: {
      metaTitle: "Skincare set box design",
      metaDesc:
        "Skincare set boxes: multi-SKU, inserts, gift and unboxing. FORMA: brief → dieline + artwork.",
      heroTitle: "Skincare set box design",
      heroLead:
        "Gather multiple products on one brand surface. Write set contents, insert needs, and outer panel copy into the brief; FORMA produces dieline + vector.",
      sections: [
        {
          title: "Set contents and layout",
          body: "Clarify which SKUs sit in which order. Keep component labels and outer carton copy as separate brief lines.",
        },
        {
          title: "Insert vs plain carton",
          body: "Inserts are common for fragile bottles and unboxing. Note materials in the brief; final die is validated with the printer.",
        },
        {
          title: "Gift and ecommerce face",
          body: "The outer face can carry gift feel and opening experience. For ecommerce, think durability alongside the related spoke.",
        },
        {
          title: "Brief → FORMA",
          body: "Bridge to the cosmetic hub, box design, and dieline pages. Studio · merhaba@paxolab.com.",
        },
      ],
      related: [
        { href: "/en/serum-cream-box-design", label: "Serum / cream box" },
        { href: "/en/serum-box-size-brief", label: "Serum size brief" },
        { href: "/en/cream-jar-label", label: "Cream jar label" },
        { href: "/en/cosmetic-packaging-design", label: "Cosmetic packaging" },
        { href: "/en/ecommerce-box-design", label: "Ecommerce box" },
      ],
      faqs: [
        {
          q: "Is each product label designed separately in a set box?",
          a: "Usually yes — primary pack labels and outer carton panels are separate brief lines. Keep one brand system.",
        },
        {
          q: "Is an insert required?",
          a: "Often preferred for fragile bottles and unboxing. Write insert need and material notes into the brief.",
        },
        {
          q: "Should a set box be ecommerce-ship ready?",
          a: "Depends on channel. If ecommerce-led, add durability and opening experience to the brief; see the ecommerce spoke.",
        },
      ],
      serviceName: "Skincare set box design",
      serviceType: "SkincareSetBox",
    },
  },
];

// Continue remaining spokes in part 2 file to keep this manageable
fs.writeFileSync("/tmp/spokes-part1.json", JSON.stringify(spokes, null, 0));
console.log("part1", spokes.length);
