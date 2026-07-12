// Yemek görselleri — her temel besine soldaki karede bir görsel.
// Piksel temada pixelSprites'taki el çizimi ikonlar önceliklidir; burada
// diğer temalar (ve pikselde sprite'ı olmayanlar) için isimden emoji eşlenir.
// Liste sıralıdır: İLK eşleşen kazanır — özel adlar genel adlardan önce gelir
// ("hindistan cevizi" cevizden, "çikolata" koladan önce).
// '^' önekli anahtarlar tam kelime ister ("su"nun "sucuk"la eşleşmemesi için).

function fold(s) {
  return (s || '')
    .toLocaleLowerCase('tr')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
}

const MAP = [
  // içecek özel adları (meyve adlarından önce)
  ['meyve suyu', '🧃'], ['portakal suyu', '🧃'], ['elma suyu', '🧃'], ['visne suyu', '🧃'],
  ['maden suyu', '💧'], ['limonata', '🍋'], ['smoothie', '🥤'],
  // kahvaltılık gevrekler
  ['gevrek', '🥣'], ['musli', '🥣'], ['granola', '🥣'], ['corn flakes', '🥣'],
  // tatlılar (süt/kola çakışmalarından önce)
  ['cikolata', '🍫'], ['gofret', '🍫'], ['kakao', '🍫'], ['browni', '🍫'],
  ['kurabiye', '🍪'], ['biskuvi', '🍪'], ['kraker', '🍘'], ['galeta', '🍘'],
  ['^kek', '🍰'], ['kek ', '🍰'], ['pasta', '🍰'], ['dondurma', '🍨'],
  ['sutlac', '🍮'], ['puding', '🍮'], ['tatli', '🍮'], ['muhallebi', '🍮'], ['salep', '🍮'],
  ['baklava', '🥧'], ['helva', '🍬'], ['lokum', '🍬'], ['jelibon', '🍬'], ['sekerleme', '🍬'],
  ['^bal', '🍯'], ['recel', '🍯'], ['marmelat', '🍯'], ['pekmez', '🍯'],
  // fast food & hamur işi
  ['pizza', '🍕'], ['hamburger', '🍔'], ['burger', '🍔'], ['doner', '🥙'], ['durum', '🌯'],
  ['lahmacun', '🫓'], ['kebap', '🍢'], ['kebab', '🍢'], ['^sis', '🍢'], ['kokorec', '🥙'],
  ['manti', '🥟'], ['borek', '🥐'], ['pogaca', '🥐'], ['acma', '🥐'], ['kruvasan', '🥐'],
  ['gozleme', '🫓'], ['krep', '🥞'], ['pankek', '🥞'], ['waffle', '🧇'],
  ['tost', '🥪'], ['sandvic', '🥪'], ['sandwich', '🥪'],
  // çorbalar (mercimek vb. kurulardan önce)
  ['corba', '🍲'],
  // et & balık
  ['tavuk', '🍗'], ['hindi', '🍗'], ['pilic', '🍗'],
  ['sosis', '🌭'], ['sucuk', '🍖'], ['salam', '🍖'], ['pastirma', '🥓'], ['jambon', '🥓'], ['bacon', '🥓'],
  ['kofte', '🍖'], ['kavurma', '🥩'], ['pirzola', '🥩'], ['biftek', '🥩'], ['bonfile', '🥩'],
  ['antrikot', '🥩'], ['kiyma', '🥩'], ['dana', '🥩'], ['kuzu', '🥩'], ['sigir', '🥩'], ['ciger', '🥩'],
  ['karides', '🦐'], ['kalamar', '🦑'], ['midye', '🦪'],
  ['somon', '🐟'], ['hamsi', '🐟'], ['sardalya', '🐟'], ['uskumru', '🐟'], ['levrek', '🐟'],
  ['cipura', '🐟'], ['alabalik', '🐟'], ['palamut', '🐟'], ['ton bal', '🐟'], ['balik', '🐟'],
  // yumurta
  ['omlet', '🍳'], ['menemen', '🍳'], ['sahanda', '🍳'], ['yumurta', '🥚'],
  // süt ürünleri
  ['peynir', '🧀'], ['^lor', '🧀'], ['cokelek', '🧀'], ['labne', '🧀'],
  ['tereyag', '🧈'], ['kaymak', '🧈'], ['margarin', '🧈'],
  ['yogurt', '🥣'], ['ayran', '🥛'], ['kefir', '🥛'], ['^sut', '🥛'], ['sut ', '🥛'], ['sutu', '🥛'],
  ['krema', '🥛'],
  // yağlar & yağlı tohumlar
  ['zeytinyag', '🫒'], ['zeytin', '🫒'],
  ['hindistan cevizi', '🥥'],
  ['findik', '🥜'], ['ceviz', '🥜'], ['badem', '🥜'], ['kaju', '🥜'], ['fistik', '🥜'],
  ['tahin', '🥜'], ['susam', '🥜'], ['cekirdek', '🌻'], ['chia', '🌾'], ['keten', '🌾'],
  ['avokado', '🥑'],
  // temel karblar
  ['patates kizartmasi', '🍟'], ['cips', '🍟'], ['patates', '🥔'],
  ['ekmek', '🍞'], ['simit', '🥯'], ['bazlama', '🫓'], ['lavas', '🫓'], ['yufka', '🫓'], ['pide', '🫓'],
  ['makarna', '🍝'], ['eriste', '🍝'], ['spagetti', '🍝'], ['sehriye', '🍝'],
  ['pirinc', '🍚'], ['pilav', '🍚'], ['kuskus', '🍚'],
  ['bulgur', '🌾'], ['yulaf', '🌾'], ['irmik', '🌾'], ['kinoa', '🌾'], ['^un', '🌾'],
  ['sut misir', '🌽'], ['misir', '🌽'], ['patlamis', '🍿'],
  // baklagiller
  ['bezelye', '🫛'], ['taze fasulye', '🫛'],
  ['mercimek', '🫘'], ['nohut', '🫘'], ['fasulye', '🫘'], ['barbunya', '🫘'], ['bakla', '🫘'],
  ['soya', '🫘'], ['humus', '🫘'],
  // sebzeler
  ['domates', '🍅'], ['salatalik', '🥒'], ['biber', '🫑'], ['patlican', '🍆'],
  ['havuc', '🥕'], ['brokoli', '🥦'], ['karnabahar', '🥦'],
  ['ispanak', '🥬'], ['marul', '🥬'], ['roka', '🥬'], ['lahana', '🥬'], ['pazi', '🥬'],
  ['semizotu', '🥬'], ['maydanoz', '🥬'], ['kereviz', '🥬'], ['enginar', '🥬'], ['pancar', '🥬'],
  ['sogan', '🧅'], ['sarimsak', '🧄'], ['mantar', '🍄'],
  ['balkabagi', '🎃'], ['kabak', '🥒'], ['salata', '🥗'], ['sarma', '🥬'], ['dolma', '🫑'],
  // meyveler
  ['elma', '🍎'], ['^muz', '🍌'], ['muzlu', '🍌'], ['portakal', '🍊'], ['mandalina', '🍊'],
  ['greyfurt', '🍊'], ['limon', '🍋'], ['cilek', '🍓'], ['uzum', '🍇'], ['karpuz', '🍉'],
  ['kavun', '🍈'], ['seftali', '🍑'], ['kayisi', '🍑'], ['armut', '🍐'], ['kiraz', '🍒'],
  ['visne', '🍒'], ['ananas', '🍍'], ['mango', '🥭'], ['kivi', '🥝'], ['yaban mersini', '🫐'],
  ['bogurtlen', '🫐'], ['ahududu', '🫐'], ['^nar', '🍎'], ['erik', '🍑'], ['incir', '🍑'],
  ['hurma', '🍯'], ['meyve', '🍎'],
  // soslar & konserve
  ['ketcap', '🥫'], ['mayonez', '🥫'], ['salca', '🥫'], ['^sos', '🥫'], ['soslu', '🥫'],
  ['hardal', '🥫'], ['konserve', '🥫'],
  // içecekler
  ['kahve', '☕'], ['^cay', '🍵'], ['nescafe', '☕'], ['latte', '☕'], ['espresso', '☕'],
  ['cola', '🥤'], ['^kola', '🥤'], ['gazoz', '🥤'], ['^soda', '🥤'], ['fanta', '🥤'],
  ['sprite', '🥤'], ['ice tea', '🥤'], ['enerji icecegi', '🥤'], ['icecek', '🥤'],
  ['^su', '💧'], ['protein toz', '🥤'], ['whey', '🥤'],
  // atıştırmalık
  ['protein bar', '🍫'], ['^bar', '🍫'],
  // ek kapsama — Türkçe yumuşamış ekler (ekmeği, fıstığı) ve kalanlar
  ['ekmeg', '🍞'], ['fistig', '🥜'], ['cekirdeg', '🌻'],
  ['leblebi', '🫘'], ['salgam', '🥤'], ['kazandibi', '🍮'], ['asure', '🍮'],
  ['bitter', '🍫'], ['coco pops', '🥣'], ['tortilla', '🫓'], ['kuruyemis', '🥜'],
  ['aycicek', '🌻'], ['mezgit', '🐟'], ['kuark', '🧀'],
  ['karabugday', '🌾'], ['borulce', '🫘'],
  ['dereotu', '🌿'], ['^nane', '🌿'], ['feslegen', '🌿'],
  ['pirasa', '🥬'], ['kuskonmaz', '🥬'], ['ayva', '🍐'],
  ['kreatin', '🥤'], ['bcaa', '🥤'], ['kolajen', '🥤'],
  ['americano', '☕'], ['flat white', '☕'], ['surub', '🍯'], ['stevia', '🍬'],
]

function nameMatches(name, kw) {
  if (kw.startsWith('^')) return name.split(/\s+/).includes(kw.slice(1))
  return name.includes(kw)
}

// Eşleşen emojiyi döndürür; bulunamazsa savoryFallback true ise 🥘, değilse null.
export function foodEmoji(rawName, { fallback = true } = {}) {
  const name = fold(rawName)
  const hit = MAP.find(([kw]) => nameMatches(name, kw))
  if (hit) return hit[1]
  return fallback ? '🥘' : null
}
