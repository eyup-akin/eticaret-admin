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