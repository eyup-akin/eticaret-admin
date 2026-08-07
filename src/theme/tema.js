// ============================================================
//  TEMA — RENK VE GÖLGE TOKEN'LARI
//
//  Rol bazlı isimler kullanıyoruz ("beyaz" değil "arkaPlan"),
//  çünkü koyu temada aynı rol farklı renge dönüşecek.
//
//  ⚠️ BURAYA SADECE TEMAYA GÖRE DEĞİŞEN ŞEYLER GİRER.
//
//  Boşluk, köşe yarıçapı ve punto ölçekleri açık ve koyu temada
//  AYNI — onlar index.css'teki :root bloğunda yaşıyor. Buraya
//  koysaydık iki nesnede birden tanımlamak gerekirdi ve biri
//  güncellenip diğeri unutulurdu.
//
//  Kural: bir değer temaya göre değişmiyorsa temada durmaz.
//
//  ⚠️ NESNE YAPISI DÜZ OLMALI — iç içe nesne KOYMA.
//  TemaContext her anahtarı doğrudan CSS değişkenine yazıyor
//  (--anaRenk gibi). İç içe bir nesne "[object Object]" olarak
//  yazılır ve sessizce bozulur.
//
//  ⚠️ DEĞERLER BİRİMİYLE YAZILIR ('8px', '0 1px 2px ...').
//  CSS değişkeni ham metin taşır; birimi burada vermezsek her
//  kullanım yerinde calc() veya elle px eklemek gerekirdi.
// ============================================================

export const acikTema = {
  ad: 'acik',

  anaRenk: '#2563eb',
  anaRenkKoyu: '#1d4ed8',
  anaRenkUstuYazi: '#ffffff',

  // ⭐ DEĞİŞTİ — sayfa zemini bir tık daha nötr.
  // #f5f6fa hafif mor çalıyordu; beyaz kartların yanında kirli
  // görünüyordu. Referans tasarımlardaki zemin nötr gri-mavi.
  // ⭐ DEĞİŞTİ (referans tasarım) — zemin hafif lavanta.
  //
  // Nötr gri (#f4f6f9) beyaz kartların yanında "boş" duruyordu.
  // Referanslardaki zemin hafif mor-mavi çalıyor ve beyaz kartları
  // öne çıkarıyor: kart ile zemin arasındaki fark renk tonundan da
  // geliyor, sadece parlaklıktan değil.
  arkaPlan: '#eef0f7',
  kartArka: '#ffffff',
  acikKart: '#f6f7fb',
  acikGri: '#f0f2f7',

  // ⭐ DEĞİŞTİ — nötrler soğutuldu ve kontrastı artırıldı.
  //
  // Eski değerler saf gri idi (#333/#666/#999). Saf gri, mavi bir
  // ana renkle birlikte kullanıldığında "solmuş" görünür. Hafif
  // mavi-gri tonlar hem daha okunaklı hem referanslardaki dile
  // yakın.
  //
  // ⚠️ Bu üç satır uygulamanın TAMAMINI etkiliyor — rol bazlı
  // token'ın anlamı bu. Tek yerden değişiyor olması, değişikliğin
  // riskini değil MALİYETİNİ düşürüyor; sonucu her ekranda
  // kontrol etmek yine gerekiyor.
  yaziKoyu: '#1a1d23',
  yaziOrta: '#5a6270',
  yaziGri: '#8b93a1',

  kenarlik: '#e6e9ee',
  inputKenar: '#d7dce4',

  basari: '#16a34a',
  uyari: '#d97706',
  hata: '#dc2626',
  pasif: '#c9ced6',

  // ⭐ YENİ — YUMUŞAK ZEMİNLER (rozet ve bilgi kutuları için)
  //
  // Bunlar 8+6+2 yerde rgba(39,174,96,0.1) gibi ELLE yazılıydı.
  // Elle yazılmalarının iki sorunu vardı:
  //   1) Koyu temada da aynı kalıyorlardı — tema değişince rozet
  //      zemini değişmiyordu
  //   2) Ton tutarsızdı: bazı yerde 0.1, bazı yerde 0.08
  //
  // rgba tercih edildi (düz hex değil): altındaki zemin beyaz da
  // olsa açık gri de olsa doğal görünüyor. Kart içindeki rozet ile
  // sayfa zeminindeki rozet aynı renkte çıksın diye.
  yumusakBasari: 'rgba(22, 163, 74, 0.10)',
  yumusakUyari: 'rgba(217, 119, 6, 0.10)',
  yumusakHata: 'rgba(220, 38, 38, 0.10)',
  yumusakVurgu: 'rgba(37, 99, 235, 0.10)',

  // ⭐ YENİ — yükleme iskeleti zemini (Aşama 7'de kullanılacak)
  iskeletArka: '#e9ecf1',

  // ⭐ YENİ — İADE TUTARI RENGİ
  //
  // Ödemeler tablosunda iade satırları mor gösteriliyor. Bu renk
  // durum paletinde yok ve olmamalı: iade bir HATA değil, bir
  // uyarı da değil — ayrı bir olay türü.
  //
  // ⚠️ Neden tek kullanımlık bir token açıyoruz?
  // Aynı gerekçeyle favoriRenk zaten var: uygulamanın semantik
  // bir rengi varsa ve durum paletine girmiyorsa kendi token'ını
  // alır. Alternatif, koda gömülü #8e44ad bırakmaktı — o da koyu
  // temada koyu mor olarak zemine karışıyordu.
  iadeRenk: '#8e44ad',

  // ⭐ YENİ — GÖLGE ÖLÇEĞİ
  //
  // Neden temada? Koyu zeminde siyah gölge GÖRÜNMEZ. Açık temanın
  // gölgesini koyu temada kullansaydık kartlar düz bir şekilde
  // zemine yapışırdı. Koyu temada gölge daha koyu ve daha yayvan.
  //
  // Referans tasarımlarda kartların kenarlığı yok, ayrımı gölge
  // yapıyor — bu yüzden gölgenin doğru olması kenarlıktan önemli.
  // ⭐ DEĞİŞTİ — daha yumuşak ve daha yayvan.
  //
  // Referans tasarımlardaki kartlar "yüzüyor" ama gölgeleri sert
  // değil: geniş yarıçap, düşük opaklık. Önceki değerler kısa ve
  // belirgindi (2px yayılma), kartları zemine yapıştırıyordu.
  //
  // İki katmanlı gölge: yakın ve keskin olan kenarı tanımlıyor,
  // uzak ve yumuşak olan derinliği veriyor. Tek katmanla ikisi
  // aynı anda elde edilemiyor.
  golgeSm: '0 1px 2px rgba(16, 24, 40, 0.04), 0 1px 3px rgba(16, 24, 40, 0.04)',
  golgeMd: '0 2px 4px rgba(16, 24, 40, 0.04), 0 8px 20px rgba(16, 24, 40, 0.06)',
  golgeLg: '0 4px 8px rgba(16, 24, 40, 0.04), 0 20px 48px rgba(16, 24, 40, 0.12)',

  // ⭐ YENİ — GRAFİK SERİ RENKLERİ (kategorik palet)
  //
  // ⚠️ SIRA SABİT, ASLA DÖNDÜRÜLMEZ.
  // Aynı seri her grafikte aynı rengi alır. Sıra bozulursa
  // kullanıcı "geçen sefer mavi olan neydi" diye sorar.
  //
  // ⚠️ ESKİ PALET RENK KÖRLÜĞÜ TESTİNDEN GEÇMİYORDU.
  // Önceki dizi (#2563eb, #27ae60, #f39c12, #8e44ad, ...) ölçüldü:
  //   • turuncu ↔ yeşil, protanopide ΔE 5.8 — ayırt EDİLEMİYOR
  //   • #7f8c8d kroma tabanının altında — gri okunuyor
  // Yeni dizi doğrulayıcıdan geçti: en kötü komşu çift ΔE 9.1
  // (protan), normal görüşte ΔE 19.6.
  //
  // ⚠️ Bu renkler METİN İÇİN DEĞİL. Üçü (aqua, sarı, magenta) açık
  // zeminde 3:1 kontrastın altında; işaret rengi olarak sorun değil
  // ama etiket yazısı bunlarla yazılmaz — yazı her zaman metin
  // token'larını kullanır.
  grafik1: '#2a78d6',  // mavi
  grafik2: '#eb6834',  // turuncu
  grafik3: '#1baf7a',  // aqua
  grafik4: '#eda100',  // sarı
  grafik5: '#e87ba4',  // magenta
  grafik6: '#008300',  // yeşil
  grafik7: '#4a3aa7',  // menekşe
  grafik8: '#e34948',  // kırmızı

  // Admin panele özel
  menuArka: '#161b22',
  menuYazi: '#c9d1d9',
  menuAktifArka: '#2563eb',
  menuAktifYazi: '#ffffff',
};

export const koyuTema = {
  ad: 'koyu',

  anaRenk: '#3b82f6',
  anaRenkKoyu: '#2563eb',
  anaRenkUstuYazi: '#ffffff',

  // ⭐ DEĞİŞTİ — saf siyah yerine hafif mavi-gri.
  // #121212 saf nötr siyahtı; beyaz metinle birlikte sert bir
  // kontrast veriyordu. Referanslardaki koyu paneller hafif
  // renkli koyu tonlar kullanıyor, gözü daha az yoruyor.
  arkaPlan: '#0f1218',
  kartArka: '#171b22',
  acikKart: '#1e232c',
  acikGri: '#1e232c',

  yaziKoyu: '#f0f2f5',   // koyu temada "koyu yazı" aslında açık renk
  yaziOrta: '#a8b0bd',
  yaziGri: '#767f8c',

  kenarlik: '#272d38',
  inputKenar: '#333b48',

  basari: '#2ecc71',
  uyari: '#fbbf24',
  hata: '#ff6b6b',
  pasif: '#4a515c',

  // ⭐ YENİ — yumuşak zeminler, koyu tema karşılıkları.
  //
  // Opaklık açık temadakinden YÜKSEK (0.16 vs 0.10) — bilinçli.
  // Koyu zeminde düşük opaklıklı bir renk neredeyse kaybolur;
  // aynı sayıyı kullansaydık rozetler koyu temada görünmez olurdu.
  yumusakBasari: 'rgba(46, 204, 113, 0.16)',
  yumusakUyari: 'rgba(251, 191, 36, 0.16)',
  yumusakHata: 'rgba(255, 107, 107, 0.16)',
  yumusakVurgu: 'rgba(59, 130, 246, 0.16)',

  iskeletArka: '#232932',

  // ⭐ YENİ — iade rengi, koyu tema basamağı.
  // Açık temanın #8e44ad'si koyu zeminde neredeyse okunmuyordu;
  // aynı mor, koyu banda göre açıldı.
  iadeRenk: '#a569bd',

  // ⭐ YENİ — gölge ölçeği, koyu tema.
  //
  // Açık temadakinden çok daha koyu: koyu zeminde %5'lik bir siyah
  // gölge hiç görünmez. Buradaki değerler kartın zeminden
  // ayrılmasını sağlayacak kadar güçlü ama "yüzen kutu" hissi
  // verecek kadar abartılı değil.
  golgeSm: '0 1px 2px rgba(0, 0, 0, 0.40)',
  golgeMd: '0 2px 10px rgba(0, 0, 0, 0.45)',
  golgeLg: '0 12px 32px rgba(0, 0, 0, 0.60)',

  // ⭐ YENİ — grafik serileri, KOYU TEMA basamakları.
  //
  // ⚠️ AYNI SEKİZ RENK TONU, koyu zemine göre YENİDEN
  // BASAMAKLANMIŞ hali — açık temanın renklerinin otomatik
  // çevrilmişi DEĞİL.
  //
  // Açık tema renklerini olduğu gibi kullansaydık koyu zeminde
  // hepsi 3:1 kontrastın altına düşerdi. Bu dizi koyu yüzeye karşı
  // ayrıca doğrulandı: sekizi de 3:1 üstünde, en kötü komşu çift
  // ΔE 8.4 (protan).
  //
  // Yeşil (#008300) iki temada da aynı: her iki bantta da geçiyor,
  // değiştirmek için bir sebep yok.
  grafik1: '#3987e5',  // mavi
  grafik2: '#d95926',  // turuncu
  grafik3: '#199e70',  // aqua
  grafik4: '#c98500',  // sarı
  grafik5: '#d55181',  // magenta
  grafik6: '#008300',  // yeşil
  grafik7: '#9085e9',  // menekşe
  grafik8: '#e66767',  // kırmızı

  // Admin panele özel
  menuArka: '#0b0e13',
  menuYazi: '#a8b0bd',
  menuAktifArka: '#3b82f6',
  menuAktifYazi: '#ffffff',
};

export const temalar = {
  acik: acikTema,
  koyu: koyuTema,
};


// ============================================================
//  ⭐ YENİ — GELİŞTİRME ZAMANI KORUMASI
//
//  ⚠️ İKİ TEMANIN ANAHTARLARI BİREBİR AYNI OLMAK ZORUNDA.
//
//  Neden? TemaContext her anahtarı CSS değişkenine yazıyor ama
//  ESKİLERİ SİLMİYOR. Bir token sadece açık temada tanımlıysa:
//    1) Açık temada değer yazılır
//    2) Koyu temaya geçilir — o anahtar yazılmaz
//    3) Açık temanın değeri <html> üzerinde ASILI KALIR
//
//  Sonuç: koyu temada beyaz bir kart zemini. Hata mesajı yok,
//  konsol temiz — sadece ekran yanlış. Bu projede en çok
//  kaçındığımız hata türü.
//
//  Neden throw değil console.error?
//  Eksik bir token yüzünden panelin hiç açılmaması, biraz yanlış
//  renkli açılmasından daha kötü. Geliştirici konsolu görür ve
//  düzeltir; kullanıcı bu koda hiç ulaşmaz.
//
//  import.meta.env.DEV: Vite bu bloğu üretim paketinden tamamen
//  çıkarır, çalışma maliyeti sıfır.
// ============================================================
if (import.meta.env.DEV) {
  const acikAnahtarlar = Object.keys(acikTema);
  const koyuAnahtarlar = Object.keys(koyuTema);

  const koyudaEksik = acikAnahtarlar.filter((a) => !koyuAnahtarlar.includes(a));
  const aciktaEksik = koyuAnahtarlar.filter((a) => !acikAnahtarlar.includes(a));

  if (koyudaEksik.length > 0) {
    console.error('[tema] Koyu temada eksik token:', koyudaEksik.join(', '));
  }

  if (aciktaEksik.length > 0) {
    console.error('[tema] Açık temada eksik token:', aciktaEksik.join(', '));
  }
}
