import './Rozet.css';

// Backend'den gelen ham durum metinlerini
// güzel yazı + renk çiftine çeviriyoruz.
const DURUMLAR = {
  hazirlaniyor: { yazi: 'Hazırlanıyor', renk: '#f39c12' },
  kargoda:      { yazi: 'Kargoda',      renk: '#2563eb' },
  teslim_edildi:{ yazi: 'Teslim Edildi', renk: '#27ae60' },
  iptal:        { yazi: 'İptal',        renk: '#e74c3c' },

  odendi:       { yazi: 'Ödendi',       renk: '#27ae60' },
  beklemede:    { yazi: 'Beklemede',    renk: '#f39c12' },

  iade:         { yazi: 'İade',         renk: '#8e44ad' },
  iade_edildi:  { yazi: 'İade Edildi',  renk: '#8e44ad' },

  admin:    { yazi: 'Admin',    renk: '#8e44ad' },
  customer: { yazi: 'Müşteri',  renk: '#2563eb' },


  basarili:     { yazi: 'Başarılı',     renk: '#27ae60' },
  basarisiz:    { yazi: 'Başarısız',    renk: '#e74c3c' },


  superadmin: { yazi: 'Süper Yönetici', renk: '#e67e22' },
  admin:      { yazi: 'Yönetici',       renk: '#8e44ad' },
  customer:   { yazi: 'Müşteri',        renk: '#2563eb' },
  pasif:      { yazi: 'Pasif',          renk: '#e74c3c' },
  aktif:      { yazi: 'Aktif',          renk: '#27ae60' },

  // ---- Ürün arşivi (Aşama 4.8) ----
  //
  // ⚠️ 'pasif' anahtarını YENİDEN KULLANMADIK. İkisi farklı şeyler:
  // pasif = "satılmıyor ama listemde duruyor", arşivli = "listemden
  // de çıktı". Aynı rozeti paylaşsalardı admin ikisini ayırt
  // edemezdi.
  //
  // Gri: arşiv bir hata ya da uyarı değil, sadece bir durum —
  // dikkat çekmesi gerekmiyor.
  arsivli:    { yazi: 'Arşivli',        renk: '#64748b' },

  // ---- Kupon durumları (Aşama 5C) ----
  // 'aktif' ve 'pasif' yukarıda zaten tanımlı, tekrar yazmıyoruz.
  // 'baslamadi' için 'beklemede' anahtarını KULLANMADIK — o ödeme
  // durumuna ait. Aynı sözlükte iki iş alanı aynı kelimeyi
  // kullanamaz, yoksa birini değiştirince diğeri de değişir.
  baslamadi:     { yazi: 'Başlamadı',     renk: '#64748b' },
  tukendi:       { yazi: 'Tükendi',       renk: '#f39c12' },
  suresi_dolmus: { yazi: 'Süresi Doldu',  renk: '#94a3b8' },


  // ---- Stok hareket sebepleri (Aşama 1.3) ----
  //
  // Renk BİLGİ TAŞIMALI — her sebep farklı bir olay tipi:
  //   satis        → normal iş akışı, beklenen çıkış      (mavi)
  //   iptal_iadesi → plansız geri dönüş, dikkat çeker     (turuncu)
  //   manuel       → İNSAN ELİ DEĞDİ, denetimde en çok    (turkuaz)
  //                  bakılan satır bu
  //   excel        → rutin toplu sistem işi               (gri)
  //
  // ⚠️ 'iade' anahtarını BİLEREK EKLEMİYORUZ — yukarıda
  //    ödeme durumu olarak zaten tanımlı (mor, "İade").
  //    Kupon durumlarındaki uyarıyı hatırla: aynı sözlükte
  //    iki iş alanı aynı kelimeyi kullanamaz. Burada kontrol
  //    ettik: stok iadesi ile para iadesi AYNI kavramı
  //    anlatıyor ve ikisi de "İade" yazısını istiyor. Yani
  //    bu kaza değil, bilinçli paylaşım. (Aşama 9'da stok
  //    iadesi geldiğinde bu satırı tekrar gözden geçir.)
  satis:        { yazi: 'Satış',        renk: '#2563eb' },
  iptal_iadesi: { yazi: 'İptal İadesi', renk: '#f39c12' },
  manuel:       { yazi: 'Manuel',       renk: '#0891b2' },
  excel:        { yazi: 'Excel',        renk: '#64748b' },


  // ---- Başvuru durumları (Aşama 3) ----
  //
  // ⚠️ 'beklemede' anahtarı ÇAKIŞMA RİSKİ taşıyordu — sipariş
  //    durumlarında da benzer bir kavram var. Kontrol ettim:
  //    sipariş tarafında 'hazirlaniyor' kullanılıyor, 'beklemede'
  //    boştaydı. Yine de sözlüğe yeni anahtar eklerken bu kontrolü
  //    HER SEFERİNDE yap.
  beklemede:   { yazi: 'Beklemede',   renk: '#f39c12' },
  onaylandi:   { yazi: 'Onaylandı',   renk: '#27ae60' },
  reddedildi:  { yazi: 'Reddedildi',  renk: '#e74c3c' },


  // ---- Telefon defteri (Aşama 4.9) ----
  //
  // Müşterinin asıl numarası: hesap kurtarma, bildirim ve OTP bunu
  // kullanacak. Adres telefonundan farkı bu — biri "kurye bu
  // teslimat için kimi arasın", diğeri "hesap sahibine nasıl
  // ulaşırız".
  //
  // ⚠️ Anahtar çakışması kontrol edildi: 'asil' sözlükte yok.
  //
  // ⚠️ "Doğrulanmadı" diye bir rozet BİLEREK EKLENMEDİ. SMS
  //    doğrulaması henüz yok, yani bugün HER numara doğrulanmamış;
  //    her satırda görünen bir işaret hiçbir şey söylemez (5.4b'de
  //    "Stokta var" rozetinin kaldırılma gerekçesi). Doğrulama
  //    geldiğinde sapma "doğrulandı" olacak ve rozet o zaman
  //    anlam taşıyacak.
  asil:        { yazi: 'Asıl',        renk: '#2563eb' },


  // ---- Destek talepleri (Aşama 8) ----
  //
  // ⚠️ Anahtar çakışması kontrol edildi: sözlükte 'acik',
  // 'yanitlandi', 'kapali' yoktu.
  //
  // Renk BİLGİ TAŞIYOR ve buradaki bilgi "sıra kimde":
  //   acik       → sıra BİZDE, iş bekliyor        (turuncu, uyarı)
  //   yanitlandi → sıra müşteride, iş bizde değil (mavi, nötr akış)
  //   kapali     → iş bitti                       (gri, sakin)
  //
  // ⚠️ 'acik' KIRMIZI DEĞİL: cevap bekleyen talep bir hata değil,
  // olağan iş akışı. "Kırmızıyı gerçekten geri alınamaz işlemlere
  // sakla" — her uyarıyı kırmızı yapmak kırmızının gücünü zayıflatır.
  //
  // ⚠️ 'kapali' YEŞİL DEĞİL: kapanmış talep iyi bir sonuç olmak
  // zorunda değil (müşteri vazgeçmiş de olabilir). Yeşil "olumlu
  // durum" demek; buradaki gerçek sadece "artık açık değil".
  acik:        { yazi: 'Cevap Bekliyor', renk: '#f39c12' },
  yanitlandi:  { yazi: 'Yanıtlandı',     renk: '#2563eb' },
  kapali:      { yazi: 'Kapalı',         renk: '#64748b' },

  // ---- Destek kategorileri ----
  //
  // ⚠️ ÖNEKLİ ANAHTAR ('destek_kargo'), çıplak 'kargo' DEĞİL.
  // Sözlük tek ve paylaşımlı; "kargo" gibi genel bir kelimeyi
  // kategoriye ayırmak, yarın kargo durumları eklendiğinde
  // çakışırdı. Kupon ve stok bölümlerinde aynı uyarı zaten var.
  //
  // ⚠️ Kategoriler HEPSİ GRİ TONDA — bilerek. Kategori bir aciliyet
  // değil bir etiket; renklendirseydik durum rozetiyle yarışır ve
  // satırda hangisinin önemli olduğu anlaşılmazdı.
  destek_kargo: { yazi: 'Kargo',  renk: '#64748b' },
  destek_urun:  { yazi: 'Ürün',   renk: '#64748b' },
  destek_odeme: { yazi: 'Ödeme',  renk: '#64748b' },
  destek_diger: { yazi: 'Diğer',  renk: '#64748b' },


  // ---- İade durumları (Aşama 9) ----
  // ⚠️ 'iade' ve 'iade_edildi' zaten ödeme durumu olarak var;
  // çakışmasın diye buradaki anahtarlar farklı.
  talep_edildi:     { yazi: 'Karar Bekliyor',  renk: '#f39c12' },
  teslim_alindi:    { yazi: 'Teslim Alındı',   renk: '#0891b2' },
  para_iade_edildi: { yazi: 'Ödendi',          renk: '#27ae60' },
  kismi_iade:       { yazi: 'Kısmi İade',      renk: '#8e44ad' },


  // ---- Ödeme akışı (iyzico) ----
  //
  // ⚠️ Anahtar çakışması kontrol edildi: üçü de sözlükte yoktu.
  // 'beklemede' YENİDEN KULLANILMADI — o eski siparişlerin ödeme
  // durumu ve "hiç ödeme akışı yoktu" anlamına geliyor.
  //
  // odeme_bekliyor    → sıra müşteride, stok rezerve  (turuncu)
  // odeme_incelemede  → para çekildi ama KESİN DEĞİL  (turkuaz)
  // odeme_basarisiz   → kart reddetti, tekrar denenebilir (kırmızı)
  //
  // ⚠️ 'odeme_incelemede' YEŞİL DEĞİL: iyzico fraud kontrolü
  // sürüyor, ret gelebilir. Yeşil görüp kargoya vermek en pahalı
  // hata olurdu.
  odeme_bekliyor:   { yazi: 'Ödeme Bekliyor',  renk: '#f39c12' },
  odeme_incelemede: { yazi: 'Doğrulanıyor',    renk: '#0891b2' },
  odeme_basarisiz:  { yazi: 'Ödeme Başarısız', renk: '#e74c3c' },

  // Ödeme denemesi durumları (OdemeIslemi.Durum).
  // ⚠️ 'basarili'/'basarisiz' zaten var; yalnızca eksik ikisi.
  baslatildi:    { yazi: 'Başlatıldı',   renk: '#64748b' },
  suresi_doldu:  { yazi: 'Süresi Doldu', renk: '#94a3b8' },

};

export default function Rozet({ durum }) {
  // Tanımadığımız bir durum gelirse ham halini gri göster
  const bilgi = DURUMLAR[durum] || { yazi: durum, renk: '#999999' };

  return (
    <span
      className="rozet"
      style={{
        backgroundColor: bilgi.renk + '22', // saydam arka plan
        color: bilgi.renk,
      }}
    >
      {bilgi.yazi}
    </span>
  );
}