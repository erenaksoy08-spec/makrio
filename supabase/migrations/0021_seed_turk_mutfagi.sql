-- Türk mutfağı çekirdek veritabanı (küratörlü seed).
--
-- Kapsam: 80 yaygın ev yemeği + 13 marka/paketli ürün + 7 zincir restoran örneği.
-- Hepsi is_verified = true (küratörlü), created_by = null (sistem kaydı).
--
-- Değer mantığı:
--  * 100 g pişmiş/servise hazır hal baz alınır; ortalama ev tarifi varsayılır.
--  * Kaynak: TürKomp (Türkiye besin kompozisyonu) + USDA eşdeğerleri + standart
--    tarif hesabı. Makrolar 4/4/9 kcal kuralıyla tutarlı olacak şekilde ayarlandı.
--  * Marka/zincir değerleri halka açık etiket ve besin tablolarından YAKLAŞIKTIR;
--    tarif/gramaj değişebilir. Şüpheli görülen kayıt food_flags ile bildirilebilir.
--  * default_serving_g: tipik porsiyon (kase çorba 250 g, tabak yemek 250 g,
--    dilim börek 120 g vb.) — hızlı eklemede kullanılır.
--
-- Mükerrer koruması: tr_fold'lanmış isim + marka birebir eşleşiyorsa satır atlanır.

insert into public.foods
  (name_tr, name_search, brand, category, calories_per_100g, protein_per_100g,
   carbs_per_100g, fat_per_100g, fiber_per_100g, default_serving_g,
   default_serving_name, is_verified, created_by)
select
  v.name_tr, public.tr_fold(v.name_tr), v.brand, v.category, v.kcal, v.p, v.c,
  v.f, v.fiber, v.serving_g, v.serving_name, true, null
from (
  values
  -- ============ ÇORBALAR (kase ~250 g) ============
  ('Mercimek çorbası',            null::text, null::text,  58::numeric,  3.0::numeric,  7.5::numeric,  1.8::numeric, 2.4::numeric, 250::numeric, '1 kase'::text),
  ('Ezogelin çorbası',            null, null,  63,  3.0,  8.5,  1.9, 2.2, 250, '1 kase'),
  ('Tarhana çorbası',             null, null,  57,  2.2,  8.8,  1.5, 1.0, 250, '1 kase'),
  ('Yayla çorbası',               null, null,  59,  2.4,  6.5,  2.6, 0.4, 250, '1 kase'),
  ('Domates çorbası',             null, null,  48,  1.3,  6.8,  1.7, 1.0, 250, '1 kase'),
  ('Tavuk suyu çorbası',          null, null,  41,  3.2,  4.0,  1.4, 0.2, 250, '1 kase'),
  ('İşkembe çorbası',             null, null,  68,  4.4,  3.2,  4.2, null, 250, '1 kase'),
  ('Şehriye çorbası',             null, null,  49,  1.7,  7.8,  1.2, 0.5, 250, '1 kase'),
  -- ============ ANA YEMEKLER ============
  ('Kuru fasulye (etli)',         null, null, 108,  6.5, 12.0,  3.8, 3.5, 250, '1 porsiyon'),
  ('Nohut yemeği (etli)',         null, null, 106,  6.0, 12.5,  3.6, 3.5, 250, '1 porsiyon'),
  ('Türlü (etli)',                null, null,  67,  3.5,  6.5,  3.0, 2.0, 250, '1 porsiyon'),
  ('Karnıyarık',                  null, null,  97,  4.2,  7.0,  5.8, 2.5, 220, '1 adet'),
  ('İmam bayıldı',                null, null,  87,  1.6,  7.5,  5.6, 2.8, 200, '1 adet'),
  ('Patlıcan musakka',            null, null,  93,  4.6,  6.0,  5.6, 2.2, 250, '1 porsiyon'),
  ('Biber dolması (etli)',        null, null,  90,  4.0, 10.0,  3.8, 1.8, 200, '2 adet'),
  ('Kabak dolması (etli)',        null, null,  71,  3.4,  7.6,  3.0, 1.2, 200, '2 adet'),
  ('Yaprak sarma (etli)',         null, null, 118,  4.8, 13.0,  5.2, 1.8, 150, '5 adet'),
  ('Lahana sarma (etli)',         null, null,  96,  4.4,  9.8,  4.4, 1.9, 200, '4 adet'),
  ('Etli güveç',                  null, null, 114,  8.5,  5.5,  6.4, 1.5, 250, '1 porsiyon'),
  ('Tas kebabı',                  null, null, 131, 10.0,  6.5,  7.2, 1.0, 250, '1 porsiyon'),
  ('Orman kebabı',                null, null, 110,  8.0,  7.0,  5.6, 1.4, 250, '1 porsiyon'),
  ('Hünkar beğendi',              null, null, 122,  7.0,  7.0,  7.3, 1.2, 250, '1 porsiyon'),
  ('İzmir köfte',                 null, null, 140,  8.0,  8.0,  8.4, 1.2, 250, '1 porsiyon'),
  ('Terbiyeli köfte',             null, null, 112,  7.5,  6.5,  6.2, 0.8, 250, '1 porsiyon'),
  ('Kadınbudu köfte',             null, null, 180,  9.0, 10.5, 11.3, 0.6, 150, '2 adet'),
  ('Kuru köfte',                  null, null, 220, 13.0,  9.0, 14.7, 0.8, 120, '4 adet'),
  ('Çiğ köfte (etsiz)',           null, null, 190,  6.0, 33.5,  3.6, 4.0, 150, '1 porsiyon'),
  ('İçli köfte',                  null, null, 220,  8.0, 25.0,  9.8, 2.2, 100, '1 adet'),
  ('Mantı (yoğurtlu)',            null, null, 164,  7.0, 23.0,  4.9, 1.2, 250, '1 porsiyon'),
  ('Menemen',                     null, null,  97,  4.6,  4.4,  6.8, 1.0, 200, '1 porsiyon'),
  -- ============ BÖREK / HAMUR İŞİ ============
  ('Su böreği (peynirli)',        null, null, 244,  9.0, 26.0, 11.6, 1.0, 120, '1 dilim'),
  ('Sigara böreği',               null, null, 295,  8.0, 26.5, 17.4, 1.2,  90, '3 adet'),
  ('Ispanaklı börek',             null, null, 234,  6.5, 26.0, 11.6, 1.8, 120, '1 dilim'),
  ('Patatesli börek',             null, null, 237,  5.5, 29.0, 11.0, 1.6, 120, '1 dilim'),
  ('Gözleme (peynirli)',          null, null, 230,  8.0, 30.0,  8.7, 1.4, 180, '1 adet'),
  ('Kıymalı pide',                null, null, 243, 10.5, 30.0,  9.0, 1.5, 220, '1 adet'),
  ('Kaşarlı pide',                null, null, 274, 11.5, 31.0, 11.6, 1.3, 220, '1 adet'),
  ('Lahmacun',                    null, null, 210,  9.0, 27.5,  7.1, 1.8, 130, '1 adet'),
  ('Peynirli poğaça',             null, null, 330,  8.0, 38.0, 16.2, 1.4,  70, '1 adet'),
  ('Açma (sade)',                 null, null, 324,  7.5, 43.0, 13.6, 1.5,  80, '1 adet'),
  ('Pişi',                        null, null, 347,  7.0, 42.0, 16.8, 1.4, 100, '2 adet'),
  ('Kaşarlı tost',                null, null, 292, 12.0, 28.0, 14.7, 1.5, 150, '1 adet'),
  ('Ramazan pidesi',              null, null, 266,  8.5, 51.5,  2.9, 2.0, 100, '1 dilim'),
  ('Kuymak (mıhlama)',            null, null, 285,  8.0, 11.5, 23.0, 0.4, 150, '1 porsiyon'),
  ('Kumpir (karışık)',            null, null, 148,  4.5, 16.0,  7.3, 1.6, 400, '1 adet'),
  -- ============ PİLAV / BULGUR ============
  ('Tereyağlı pirinç pilavı',     null, null, 164,  2.6, 27.0,  5.1, 0.4, 180, '1 porsiyon'),
  ('Bulgur pilavı',               null, null, 120,  3.4, 19.5,  3.1, 3.4, 180, '1 porsiyon'),
  ('İç pilav',                    null, null, 166,  3.4, 25.0,  5.8, 0.8, 180, '1 porsiyon'),
  ('Kısır',                       null, null, 147,  3.6, 19.0,  6.3, 3.2, 150, '1 porsiyon'),
  ('Keşkek',                      null, null, 132,  6.5, 16.5,  4.4, 1.6, 250, '1 porsiyon'),
  -- ============ ZEYTİNYAĞLILAR / MEZE / SALATA ============
  ('Kıymalı ıspanak',             null, null,  67,  4.0,  4.0,  3.9, 1.8, 250, '1 porsiyon'),
  ('Zeytinyağlı pırasa',          null, null,  63,  1.4,  8.0,  2.8, 1.9, 200, '1 porsiyon'),
  ('Zeytinyağlı taze fasulye',    null, null,  60,  1.8,  6.4,  3.0, 2.6, 200, '1 porsiyon'),
  ('Zeytinyağlı enginar',         null, null,  65,  2.0,  7.6,  3.0, 3.4, 200, '1 porsiyon'),
  ('Barbunya pilaki',             null, null, 104,  5.5, 13.0,  3.3, 4.2, 200, '1 porsiyon'),
  ('Fava',                        null, null, 112,  5.8, 14.0,  3.6, 3.8, 150, '1 porsiyon'),
  ('Piyaz',                       null, null, 121,  5.5, 11.5,  5.9, 3.6, 200, '1 porsiyon'),
  ('Cacık',                       null, null,  46,  2.6,  3.4,  2.4, 0.3, 200, '1 kase'),
  ('Haydari',                     null, null, 122,  5.5,  4.5,  9.1, 0.3, 100, '1 porsiyon'),
  ('Ezme salata',                 null, null,  45,  1.4,  5.6,  1.9, 1.8, 100, '1 porsiyon'),
  ('Çoban salatası (zeytinyağlı)',null, null,  58,  1.1,  4.0,  4.2, 1.4, 150, '1 porsiyon'),
  -- ============ ET / TAVUK / SOKAK ============
  ('Tavuk sote',                  null, null, 121, 14.0,  4.5,  5.2, 0.8, 250, '1 porsiyon'),
  ('Et sote',                     null, null, 144, 16.0,  3.0,  7.6, 0.6, 250, '1 porsiyon'),
  ('Tavuk şiş (ızgara)',          null, null, 148, 24.0,  1.5,  5.1, 0.2, 150, '1 şiş'),
  ('Adana kebap',                 null, null, 228, 16.0,  2.0, 17.3, 0.3, 150, '1 şiş'),
  ('Urfa kebap',                  null, null, 209, 16.5,  2.0, 15.0, 0.3, 150, '1 şiş'),
  ('İskender kebap',              null, null, 189, 11.0, 12.0, 10.8, 0.8, 350, '1 porsiyon'),
  ('Tantuni (dürüm)',             null, null, 183, 10.0, 17.0,  8.3, 1.2, 180, '1 dürüm'),
  ('Kokoreç',                     null, null, 199, 14.5,  2.5, 14.6, null, 120, 'yarım ekmek içi'),
  ('Midye dolma',                 null, null, 138,  6.5, 18.0,  4.4, 0.6, 125, '5 adet'),
  ('Mücver (kabak)',              null, null, 152,  5.0, 11.0,  9.8, 1.4, 120, '2 adet'),
  -- ============ TATLILAR ============
  ('Cevizli baklava',             null, null, 434,  6.0, 48.0, 24.2, 1.8,  65, '1 dilim'),
  ('Künefe',                      null, null, 354,  7.0, 42.0, 17.6, 0.8, 150, '1 porsiyon'),
  ('Revani',                      null, null, 328,  4.4, 52.0, 11.4, 0.6,  90, '1 dilim'),
  ('Şekerpare',                   null, null, 375,  4.5, 56.0, 14.8, 0.8,  80, '2 adet'),
  ('Tulumba tatlısı',             null, null, 341,  3.5, 48.0, 15.0, 0.5,  90, '3 adet'),
  ('Lokma tatlısı',               null, null, 330,  4.0, 46.0, 14.4, 0.6, 100, '1 porsiyon'),
  ('Güllaç',                      null, null, 158,  3.5, 25.0,  4.9, 0.3, 150, '1 porsiyon'),
  ('Kabak tatlısı',               null, null, 140,  1.0, 31.0,  1.3, 1.8, 150, '1 porsiyon'),
  ('Ayva tatlısı',                null, null, 154,  0.6, 36.0,  0.9, 2.2, 150, 'yarım ayva'),
  -- ============ MARKA / PAKETLİ (etiketten, yaklaşık) ============
  ('Çikolatalı Gofret',           'Ülker',        'hazır', 527,  5.5, 61.0, 29.0, 1.6,  36, '1 adet'),
  ('Albeni',                      'Ülker',        'hazır', 467,  4.5, 64.0, 21.5, 1.2,  40, '1 adet'),
  ('Halley',                      'Ülker',        'hazır', 433,  4.8, 64.0, 17.5, 1.4,  30, '1 adet'),
  ('Çubuk Kraker',                'Ülker',        'hazır', 405, 10.0, 72.0,  8.5, 2.4,  40, '1 küçük paket'),
  ('Burçak',                      'Eti',          'hazır', 471,  8.5, 62.0, 21.0, 4.6,  28, '2 adet'),
  ('Cin',                         'Eti',          'hazır', 413,  4.0, 70.0, 13.0, 1.2,  36, '1 adet'),
  ('Crax Baharatlı Çubuk',        'Eti',          'hazır', 459,  9.0, 63.0, 19.0, 2.4,  45, '1 paket'),
  ('Banada Fındık Kreması',       'Torku',        'hazır', 533,  6.5, 57.0, 31.0, 2.6,  20, '1 tatlı kaşığı'),
  ('Kakaolu Fındık Kreması',      'Sarelle',      'hazır', 536,  6.0, 56.0, 32.0, 2.8,  20, '1 tatlı kaşığı'),
  ('Doritos Taco',                'Doritos',      'hazır', 502,  7.0, 60.0, 26.0, 3.6,  44, '1 küçük paket'),
  ('Originals Patates Cipsi',     'Ruffles',      'hazır', 521,  6.0, 50.0, 33.0, 4.0,  45, '1 küçük paket'),
  ('Kaymaklı Yoğurt',             'Sütaş',        'süt',    89,  3.2,  4.3,  6.5, null, 200, '1 kase'),
  ('Labne',                       'Pınar',        'süt',   225,  4.5,  4.5, 21.0, null,  30, '1 kaşık'),
  -- ============ ZİNCİR RESTORAN (besin tablolarından, yaklaşık) ============
  ('Whopper',                     'Burger King',  'restoran', 233,  9.5, 17.5, 13.5, 1.2, 270, '1 adet'),
  ('Chicken Royale',              'Burger King',  'restoran', 259, 11.0, 25.0, 12.6, 1.1, 220, '1 adet'),
  ('Big Mac',                     'McDonald''s',  'restoran', 230, 12.0, 19.0, 11.8, 1.6, 215, '1 adet'),
  ('Patates Kızartması (orta)',   'McDonald''s',  'restoran', 310,  3.8, 41.0, 14.5, 3.8, 115, 'orta boy'),
  ('Çıtır Tavuk',                 'KFC',          'restoran', 285, 17.0, 15.0, 17.5, 0.8, 130, '2 parça'),
  ('Sucuklu Pizza',               'Domino''s',    'restoran', 269, 11.5, 31.0, 11.0, 1.8,  85, '1 dilim'),
  ('Çiğ Köfte',                   'Komagene',     'restoran', 184,  5.5, 34.0,  2.9, 4.2, 150, '1 porsiyon')
) as v(name_tr, brand, category, kcal, p, c, f, fiber, serving_g, serving_name)
where not exists (
  select 1
  from public.foods f2
  where public.tr_fold(f2.name_tr) = public.tr_fold(v.name_tr)
    and coalesce(public.tr_fold(f2.brand), '') = coalesce(public.tr_fold(v.brand), '')
);
