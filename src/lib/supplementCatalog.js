// Takviye kataloğu — kullanıcılar serbest metin girmez, bu listeden seçer.
// Kategoriler seçim ekranında başlık olur; brand'li ürünler markasıyla etiketlenir.

export const SUPPLEMENT_CATEGORIES = [
  'Vitaminler',
  'Mineraller',
  'Magnezyum Formları',
  'Kolajen',
  'Kombinasyonlar',
  'Omega & Yağlar',
  'Aminoasitler',
  'Performans',
  'Sağlık & Sindirim',
  'Protein Ocean',
  'HIQ',
]

const V = 'Vitaminler'
const M = 'Mineraller'
const MG = 'Magnezyum Formları'
const K = 'Kolajen'
const C = 'Kombinasyonlar'
const O = 'Omega & Yağlar'
const A = 'Aminoasitler'
const P = 'Performans'
const S = 'Sağlık & Sindirim'
const PO = 'Protein Ocean'
const HQ = 'HIQ'

export const SUPPLEMENT_CATALOG = [
  // Vitaminler
  { id: 'multivitamin', name: 'Multivitamin', cat: V },
  { id: 'vit-c', name: 'C Vitamini', cat: V },
  { id: 'ester-c', name: 'Ester-C', cat: V },
  { id: 'lipozomal-c', name: 'Lipozomal C Vitamini', cat: V },
  { id: 'vit-b12', name: 'B12 Vitamini', cat: V },
  { id: 'vit-b9', name: 'B9 Vitamini (Folat)', cat: V },
  { id: 'vit-b7', name: 'B7 Vitamini (Biotin)', cat: V },
  { id: 'b-complex', name: 'B Kompleks', cat: V },
  { id: 'vit-a', name: 'A Vitamini', cat: V },
  { id: 'vit-e', name: 'E Vitamini', cat: V },
  { id: 'vit-d3', name: 'D3 Vitamini', cat: V },
  { id: 'vit-k2', name: 'K2 Vitamini', cat: V },

  // Mineraller
  { id: 'cinko', name: 'Çinko', cat: M },
  { id: 'demir', name: 'Demir', cat: M },
  { id: 'selenyum', name: 'Selenyum', cat: M },
  { id: 'iyot', name: 'İyot', cat: M },
  { id: 'kalsiyum', name: 'Kalsiyum', cat: M },
  { id: 'potasyum', name: 'Potasyum', cat: M },
  { id: 'krom', name: 'Krom', cat: M },
  { id: 'bakir', name: 'Bakır', cat: M },

  // Magnezyum Formları
  { id: 'mg-sitrat', name: 'Magnezyum Sitrat', cat: MG },
  { id: 'mg-bisglisinat', name: 'Magnezyum Bisglisinat', cat: MG },
  { id: 'mg-malat', name: 'Magnezyum Malat', cat: MG },
  { id: 'mg-l-treonat', name: 'Magnezyum L-Treonat', cat: MG },
  { id: 'mg-taurat', name: 'Magnezyum Taurat', cat: MG },
  { id: 'mg-kompleks', name: 'Magnezyum Kompleks', cat: MG, desc: 'Sitrat, Malat ve Glisinat karışımları' },

  // Kolajen
  { id: 'kolajen-tip1', name: 'Tip 1 Kolajen', cat: K },
  { id: 'kolajen-tip2', name: 'Tip 2 Kolajen', cat: K },
  { id: 'kolajen-tip3', name: 'Tip 3 Kolajen', cat: K },

  // Kombinasyonlar
  { id: 'd3-k2', name: 'Vitamin D3 + K2', cat: C, desc: 'Kemik ve kalp sağlığı kombinasyonu' },
  { id: 'c-cinko', name: 'Vitamin C + Çinko', cat: C },
  { id: 'c-d3-cinko', name: 'Vitamin C + D3 + Çinko', cat: C },
  { id: 'ca-mg-zn', name: 'Kalsiyum + Magnezyum + Çinko', cat: C, desc: 'Kemik ve kas destek kompleksi' },
  { id: 'ca-mg-zn-d3', name: 'Kalsiyum + Magnezyum + Çinko + D3', cat: C },
  { id: 'demir-c', name: 'Demir + C Vitamini', cat: C, desc: 'Emilimi artıran ikili' },
  { id: 'zma', name: 'ZMA', cat: C, desc: 'Çinko + Magnezyum + B6 Vitamini' },
  { id: 'gluko-kondro-msm', name: 'Glukozamin + Kondroitin + MSM', cat: C, desc: 'Eklem destek kompleksi' },
  { id: 'gluko-kondro-msm-tip2', name: 'Glukozamin + Kondroitin + MSM + Tip 2 Kolajen', cat: C },
  { id: 'omega3-coq10', name: 'Omega-3 + CoQ10', cat: C, desc: 'Kalp sağlığı kombinasyonu' },
  { id: 'multi-multimineral', name: 'Multivitamin ve Multimineral', cat: C, desc: 'Genel takviye' },

  // Omega & Yağlar
  { id: 'omega3', name: 'Omega 3', cat: O },
  { id: 'cla', name: 'CLA', cat: O },
  { id: 'mct-oil', name: 'MCT Oil', cat: O },

  // Aminoasitler
  { id: 'l-theanine', name: 'L-Theanine', cat: A },
  { id: 'l-karnitin', name: 'L-Karnitin', cat: A },
  { id: 'l-glutamin', name: 'L-Glutamin', cat: A },
  { id: 'l-sitrulin', name: 'L-Sitrülin', cat: A },
  { id: 'l-arjinin', name: 'L-Arjinin', cat: A },
  { id: 'l-tirozin', name: 'L-Tirozin', cat: A },
  { id: 'l-tryptophan', name: 'L-Tryptophan', cat: A },
  { id: 'l-lysine', name: 'L-Lysine', cat: A },
  { id: 'nac', name: 'NAC', cat: A },

  // Performans
  { id: 'kreatin', name: 'Kreatin', cat: P },
  { id: 'kafein', name: 'Kafein', cat: P },
  { id: 'bcaa', name: 'BCAA', cat: P },
  { id: 'eaa', name: 'EAA', cat: P },
  { id: 'maltodekstrin', name: 'Maltodekstrin', cat: P },
  { id: 'cluster-dextrin', name: 'Cluster Dextrin', cat: P },
  { id: 'fat-burner', name: 'Termojenik Yağ Yakıcı', cat: P, desc: 'Fat Burner' },
  { id: 'elektrolit', name: 'Elektrolit', cat: P },

  // Sağlık & Sindirim
  { id: 'melatonin', name: 'Melatonin', cat: S },
  { id: 'probiyotik', name: 'Probiyotik', cat: S },
  { id: 'ashwagandha', name: 'Ashwagandha', cat: S },
  { id: 'lions-mane', name: "Lion's Mane", cat: S },
  { id: 'inulin', name: 'Inulin', cat: S },
  { id: 'psyllium-husk', name: 'Psyllium Husk', cat: S },
  { id: 'maca', name: 'Maca Kökü Tozu', cat: S },
  { id: 'greens-superfoods', name: 'Greens & Superfoods', cat: S },

  // Protein Ocean — markalı ürünler
  { id: 'po-thermo-burner', name: 'Thermo Burner', cat: PO, brand: 'Protein Ocean' },
  { id: 'po-lvr', name: 'LVR', cat: PO, brand: 'Protein Ocean' },
  { id: 'po-kdny', name: 'KDNY', cat: PO, brand: 'Protein Ocean' },
  { id: 'po-green-detox', name: 'Green Detox', cat: PO, brand: 'Protein Ocean' },
  { id: 'po-t-prime', name: 'T-Prime', cat: PO, brand: 'Protein Ocean' },
  { id: 'po-sleep-formula', name: 'Sleep Formula', cat: PO, brand: 'Protein Ocean' },
  { id: 'po-hunger-buster', name: 'Hunger Buster', cat: PO, brand: 'Protein Ocean' },
  { id: 'po-relax', name: 'Relax', cat: PO, brand: 'Protein Ocean' },
  { id: 'po-beauty-formula', name: 'Beauty Formula', cat: PO, brand: 'Protein Ocean' },
  { id: 'po-focus-formula', name: 'Focus Formula', cat: PO, brand: 'Protein Ocean' },
  { id: 'po-c-blocker', name: 'C-Blocker', cat: PO, brand: 'Protein Ocean' },
  { id: 'po-good-night', name: 'Good Night', cat: PO, brand: 'Protein Ocean' },
  { id: 'po-digestion', name: 'Digestion', cat: PO, brand: 'Protein Ocean' },

  // HIQ — markalı ürünler
  { id: 'hiq-gh-up', name: 'Gh-Up', cat: HQ, brand: 'HIQ' },
  { id: 'hiq-alpha-t-man', name: 'Alpha T-Man', cat: HQ, brand: 'HIQ' },
  { id: 'hiq-curcumin', name: 'Curcumin', cat: HQ, brand: 'HIQ' },
  { id: 'hiq-glucoflex', name: 'Glucoflex', cat: HQ, brand: 'HIQ' },
  { id: 'hiq-cycle-pak', name: 'Cycle Pak', cat: HQ, brand: 'HIQ' },
  { id: 'hiq-amino-rage', name: 'Amino Rage', cat: HQ, brand: 'HIQ' },
]

// Türkçe karakterlere duyarsız arama için normalize.
export function normalizeTr(s) {
  return (s ?? '')
    .toLocaleLowerCase('tr-TR')
    .replaceAll('ı', 'i')
    .replaceAll('ş', 's')
    .replaceAll('ç', 'c')
    .replaceAll('ğ', 'g')
    .replaceAll('ü', 'u')
    .replaceAll('ö', 'o')
}
