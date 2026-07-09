// Şirket bilgileri (unvan, adres, MERSİS/vergi no, KEP) netleşince aşağıdaki
// köşeli parantezli alanları güncelleyin. İçerikler yayına alınmadan önce
// bir hukuk danışmanı tarafından teyit edilmelidir.
const COMPANY = '[ŞİRKET UNVANI] (Makrio)'
const ADDRESS = '[ŞİRKET ADRESİ]'
const MERSIS = '[MERSİS NO]'
const TAX = '[VERGİ DAİRESİ / VERGİ NO]'
const EMAIL = 'destek@makrio.app'

export const LEGAL_PAGES = {
  kvkk: {
    title: 'KVKK Aydınlatma Metni',
    sections: [
      {
        heading: 'Veri Sorumlusu',
        paragraphs: [
          `6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca, kişisel verileriniz veri sorumlusu sıfatıyla ${COMPANY} (${ADDRESS}, MERSİS: ${MERSIS}) tarafından aşağıda açıklanan kapsamda işlenmektedir.`,
        ],
      },
      {
        heading: 'İşlenen Kişisel Veriler',
        paragraphs: [
          'Hesabınızı oluşturmanız ve Makrio uygulamasını kullanmanız sırasında; ad-soyad, e-posta adresi, doğum tarihi/yaş, cinsiyet gibi kimlik ve iletişim verileriniz,',
          'boy, kilo, hedef kilo, aktivite seviyesi, günlük besin ve su tüketim kayıtları gibi sağlık ve beslenmeye ilişkin özel nitelikli verileriniz,',
          'cihaz bilgisi, uygulama içi kullanım istatistikleri ve hata kayıtları gibi teknik veriler işlenmektedir.',
        ],
      },
      {
        heading: 'İşleme Amaçları',
        paragraphs: [
          'Kişisel verileriniz; hesabınızın oluşturulması ve kimlik doğrulaması, kalori/makro hedeflerinizin hesaplanması ve ilerleme takibinizin sağlanması, uygulama içi bildirim, seri (streak) ve ödül mekanizmalarının yürütülmesi, Makrio Gold aboneliğine ilişkin faturalandırma ve müşteri desteği süreçlerinin yürütülmesi, hizmet kalitesinin artırılması ve hataların giderilmesi amaçlarıyla sınırlı olarak işlenir.',
        ],
      },
      {
        heading: 'Hukuki Sebep',
        paragraphs: [
          'Kimlik ve iletişim verileriniz KVKK m.5/2 kapsamında sözleşmenin kurulması ve ifası hukuki sebebine dayanılarak; sağlık ve beslenmeye ilişkin özel nitelikli verileriniz ise KVKK m.6/2 uyarınca açık rızanıza dayanılarak işlenmektedir. Uygulamayı kullanmaya devam etmeniz veya kayıt sırasında onay vermeniz açık rızanızın alınması anlamına gelir; bu rızayı istediğiniz zaman geri çekebilirsiniz.',
        ],
      },
      {
        heading: 'Aktarım',
        paragraphs: [
          'Kişisel verileriniz; uygulamanın barındırma ve veritabanı altyapısını sağlayan yurt içi/yurt dışı bulut hizmet sağlayıcılarına (ör. sunucu barındırma hizmeti), ödeme ve abonelik işlemlerinin yürütülmesi için ilgili ödeme kuruluşlarına ve yasal yükümlülüklerimiz kapsamında yetkili kamu kurum ve kuruluşlarına, KVKK\'da öngörülen güvenlik önlemleri sağlanmak kaydıyla aktarılabilir.',
        ],
      },
      {
        heading: 'Saklama Süresi',
        paragraphs: [
          'Kişisel verileriniz, hesabınız aktif olduğu sürece ve ilgili mevzuatta öngörülen zamanaşımı süreleri boyunca saklanır. Hesabınızı silmeniz halinde verileriniz, yasal saklama yükümlülüklerimiz saklı kalmak kaydıyla makul bir süre içinde silinir, yok edilir veya anonim hale getirilir.',
        ],
      },
      {
        heading: 'Haklarınız',
        paragraphs: [
          'KVKK m.11 uyarınca; kişisel verilerinizin işlenip işlenmediğini öğrenme, işlenmişse buna ilişkin bilgi talep etme, işlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme, yurt içinde/yurt dışında aktarıldığı üçüncü kişileri bilme, eksik/yanlış işlenmişse düzeltilmesini isteme, KVKK\'da öngörülen şartlar çerçevesinde silinmesini/yok edilmesini isteme, düzeltme ve silme işlemlerinin verilerin aktarıldığı üçüncü kişilere bildirilmesini isteme, işlenen verilerin münhasıran otomatik sistemlerle analiz edilmesi suretiyle aleyhinize bir sonucun ortaya çıkmasına itiraz etme ve kanuna aykırı işleme sebebiyle zarara uğramanız hâlinde zararın giderilmesini talep etme haklarına sahipsiniz.',
          `Bu haklarınızı kullanmak için ${EMAIL} adresinden veya uygulama içindeki "Hesabı Sil / Destek" kanallarından bizimle iletişime geçebilirsiniz.`,
        ],
      },
    ],
  },

  'kullanim-sartlari': {
    title: 'Kullanım Şartları',
    sections: [
      {
        heading: '1. Taraflar ve Kabul',
        paragraphs: [
          `İşbu Kullanım Şartları, ${COMPANY} tarafından işletilen Makrio mobil/web uygulaması ("Uygulama") ile kullanıcı arasındaki hukuki ilişkiyi düzenler. Uygulamaya hesap oluşturarak veya kullanarak bu şartları okuduğunuzu, anladığınızı ve kabul ettiğinizi beyan etmiş sayılırsınız.`,
        ],
      },
      {
        heading: '2. Hizmetin Kapsamı',
        paragraphs: [
          'Makrio; kullanıcıların günlük besin, kalori ve makro besin (protein/yağ/karbonhidrat) tüketimini, su alımını, kiloyu ve hedeflerine olan ilerlemesini takip etmesine imkân tanıyan bir kişisel takip ve motivasyon uygulamasıdır.',
          'Uygulama içeriği tıbbi teşhis, tedavi veya profesyonel diyetisyen/doktor tavsiyesi niteliği taşımaz; yalnızca bilgilendirme ve kişisel takip amaçlıdır. Sağlık durumunuza ilişkin kararları almadan önce bir sağlık profesyoneline danışmanız önerilir.',
        ],
      },
      {
        heading: '3. Hesap ve Kullanıcı Yükümlülükleri',
        paragraphs: [
          'Hesabınızı oluştururken verdiğiniz bilgilerin doğru, güncel ve eksiksiz olmasından siz sorumlusunuz. Hesap bilgilerinizin (e-posta, şifre) gizliliğini korumak ve hesabınız üzerinden gerçekleşen tüm işlemlerden sorumlu olmak sizin yükümlülüğünüzdedir.',
          'Uygulamayı yasa dışı amaçlarla kullanmak, sistemin işleyişine müdahale etmek, başkalarının hesaplarına yetkisiz erişim sağlamaya çalışmak veya Uygulama üzerinden elde edilen içerikleri izinsiz çoğaltmak/dağıtmak yasaktır.',
        ],
      },
      {
        heading: '4. Makrio Gold Aboneliği',
        paragraphs: [
          'Uygulama, ücretsiz olarak sunulan temel özelliklerin yanı sıra "Makrio Gold" adıyla ücretli bir abonelik planı sunar. Abonelik kapsamındaki özellikler, ücret ve süre bilgileri satın alma ekranında açıkça gösterilir ve satın alma anında kabul edilmiş sayılır.',
          'Abonelik, aksi belirtilmedikçe seçilen dönem sonunda otomatik olarak yenilenir; aboneliğinizi dönem bitiminden önce iptal etmediğiniz sürece bir sonraki dönem için ücretlendirme yapılır. Aboneliği dilediğiniz zaman uygulama içi ayarlardan veya ilgili mağaza (App Store/Google Play) hesap ayarlarından iptal edebilirsiniz.',
        ],
      },
      {
        heading: '5. Fikri Mülkiyet',
        paragraphs: [
          `Uygulamanın tasarımı, yazılımı, logosu, marka adı ve içeriği ${COMPANY}'ye aittir ve fikri mülkiyet mevzuatı kapsamında korunmaktadır. Kullanıcılar, Uygulamayı yalnızca kişisel ve ticari olmayan amaçlarla kullanabilir.`,
        ],
      },
      {
        heading: '6. Sorumluluğun Sınırlandırılması',
        paragraphs: [
          `${COMPANY}, Uygulamada yer alan besin veritabanı bilgilerinin veya kullanıcı tarafından girilen verilerin doğruluğuna ilişkin mutlak bir garanti vermez. Uygulamanın kesintisiz veya hatasız çalışacağı taahhüt edilmez; mevzuatın izin verdiği azami ölçüde, Uygulamanın kullanımından doğabilecek dolaylı zararlardan sorumluluk kabul edilmez.`,
        ],
      },
      {
        heading: '7. Fesih',
        paragraphs: [
          'Kullanıcı, hesabını dilediği zaman uygulama içi ayarlardan silebilir. Bu şartların ihlali hâlinde hesabınız askıya alınabilir veya sonlandırılabilir.',
        ],
      },
      {
        heading: '8. Değişiklikler ve Uyuşmazlık Çözümü',
        paragraphs: [
          'Bu Kullanım Şartları zaman zaman güncellenebilir; güncel sürüm Uygulama içinden erişilebilir olacaktır. İşbu şartlardan doğan uyuşmazlıklarda Türkiye Cumhuriyeti kanunları uygulanır ve tüketici işlemlerinde Tüketici Hakem Heyetleri ile Tüketici Mahkemeleri yetkilidir.',
        ],
      },
    ],
  },

  'mesafeli-satis': {
    title: 'Mesafeli Satış Sözleşmesi',
    sections: [
      {
        heading: 'Madde 1 — Taraflar',
        paragraphs: [
          `SATICI: ${COMPANY} — ${ADDRESS} — ${TAX} — E-posta: ${EMAIL}`,
          'ALICI: Makrio uygulaması üzerinden Makrio Gold aboneliğini satın alan kullanıcı (uygulama içi hesap bilgileriyle tanımlanır).',
        ],
      },
      {
        heading: 'Madde 2 — Sözleşmenin Konusu',
        paragraphs: [
          'İşbu sözleşmenin konusu, ALICI\'nın Makrio uygulaması üzerinden elektronik ortamda sipariş verdiği "Makrio Gold" dijital abonelik hizmetinin satışı ve ifasına ilişkin olarak, 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği hükümleri uyarınca tarafların hak ve yükümlülüklerinin belirlenmesidir.',
        ],
      },
      {
        heading: 'Madde 3 — Hizmetin Niteliği, Süresi ve Ücreti',
        paragraphs: [
          'Makrio Gold; sınırsız yemek kaydı, detaylı raporlar, özel temalar/rozetler, reklamsız kullanım ve öncelikli destek gibi ek özellikleri kapsayan dijital bir aboneliktir. Hizmetin süresi (aylık/yıllık) ve güncel ücreti, satın alma ekranında ALICI\'ya açıkça gösterilir ve ödeme onayı ile birlikte kabul edilmiş sayılır.',
          'Abonelik ücreti, ALICI\'nın işlemi gerçekleştirdiği App Store/Google Play hesabı üzerinden, seçilen dönem başında tahsil edilir ve aksi iptal edilmediği sürece dönem sonunda otomatik olarak yenilenir.',
        ],
      },
      {
        heading: 'Madde 4 — Ödeme Şekli',
        paragraphs: [
          'Ödeme, ALICI\'nın mobil cihazında oturum açtığı ilgili uygulama mağazası (Apple App Store veya Google Play) altyapısı üzerinden gerçekleştirilir. SATICI, ödeme kartı bilgilerini görüntülemez veya saklamaz; ödeme işlemi tamamen ilgili mağaza sağlayıcısının güvenli altyapısında yürütülür.',
        ],
      },
      {
        heading: 'Madde 5 — Cayma Hakkı',
        paragraphs: [
          'Mesafeli Sözleşmeler Yönetmeliği\'nin 15. maddesi uyarınca, ALICI\'nın onayı ile ifasına başlanan ve elektronik ortamda anında ifa edilen hizmetlere ve tüketiciye anında teslim edilen gayrimaddi mallara (dijital içerik/hizmetlere) ilişkin sözleşmelerde cayma hakkı bulunmamaktadır.',
          'Satın alma onayı sırasında ALICI, aboneliğin hemen aktifleştirilmesini talep ederek cayma hakkının bu kapsamda kullanılamayacağını kabul etmiş sayılır. Bu durum, ALICI\'nın aboneliği dilediği zaman ileriye dönük olarak iptal etme hakkını (mevcut dönem sonuna kadar hizmetin kullanılmaya devam etmesi kaydıyla) etkilemez.',
        ],
      },
      {
        heading: 'Madde 6 — İptal ve Fesih',
        paragraphs: [
          'ALICI, aboneliğini dilediği zaman uygulama içi ayarlardan veya ilgili mağaza hesap ayarlarından iptal edebilir. İptal, cari ödeme döneminin sonunda geçerli olur; iptal tarihine kadar geçen süre için ücret iadesi yapılmaz, ancak dönem sonuna kadar hizmetten yararlanmaya devam edilir.',
        ],
      },
      {
        heading: 'Madde 7 — Uyuşmazlıkların Çözümü',
        paragraphs: [
          'İşbu sözleşmenin uygulanmasından doğan uyuşmazlıklarda, Ticaret Bakanlığı\'nca her yıl ilan edilen parasal sınırlar dâhilinde ALICI\'nın yerleşim yerindeki Tüketici Hakem Heyetleri, bu sınırları aşan uyuşmazlıklarda ise Tüketici Mahkemeleri yetkilidir.',
        ],
      },
    ],
  },
}
