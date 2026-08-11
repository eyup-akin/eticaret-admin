import './Buton.css';

// ============================================================
//  BUTON
//
//  tip       : 'ana' | 'ikincil' | 'tehlike'
//  boyut     : 'normal' | 'kucuk'
//  ikonRengi : ⭐ YENİ — 'ana' | 'uyari' | 'basari' | yok
//
//  ...digerleri : onClick, disabled, type, title gibi her şey
//                 <button>'a aynen geçer
//
//  ============================================================
//  ⭐ YENİ — ikonRengi: İKONUN RENGİ, EYLEMİN ANLAMINI SÖYLER
//  ============================================================
//
//  SORUN: İkincil butonun metni "yaziKoyu" ve ikon currentColor
//  miras aldığı için "Düzenle", "Satıştan Kaldır", "Onayla" gibi
//  bambaşka ağırlıktaki eylemler AYNI gri ikonla görünüyordu.
//  Emoji döneminde bu ayrımı emojinin kendi rengi yapıyordu; çizgi
//  ikona geçince o bilgi kayboldu.
//
//  ÇÖZÜM: İkona eylemin anlamına göre rol rengi veriyoruz.
//
//    'uyari'  (turuncu) → geri alınabilir OLUMSUZ değişiklik
//                         (satıştan kaldır, duraklat, gizle, reddet)
//    'basari' (yeşil)   → OLUMLU değişiklik
//                         (satışa aç, aktifleştir, onayla, göster)
//    'ana'    (mavi)    → nötr eylem
//                         (düzenle, kopyala, indir, yazdır, arşivle)
//
//  ⚠️ RENK TEK BİLGİ KANALI DEĞİL — her butonun metni zaten ne
//  yapacağını yazıyor. Renk körü ya da parlak ışıkta bakan kullanıcı
//  hiçbir şey kaybetmiyor; renk yalnızca HIZLI tarama için ikinci
//  bir ipucu. Bu, projedeki "renk tek başına bilgi taşımamalı"
//  kuralının gereği.
//
//  ⚠️ SADECE İKON RENKLENİYOR, METİN DEĞİL. Metni de renklendirmek
//  butonu "durum rozeti"ne benzetirdi; buton bir EYLEM, rozet bir
//  DURUM. İkisi aynı görünmemeli.
//
//  ⚠️ 'ana' ve 'tehlike' TİPLERİNDE ETKİSİZ — bilerek:
//    • ana     → dolu mavi zemin, ikon beyaz. Renk vermek okunmazlık.
//    • tehlike → ikon zaten kırmızı (currentColor) ve hover'da zemin
//                kırmızıya, yazı beyaza dönüyor. Sabit renk verseydik
//                ikon hover'da kaybolurdu.
//  Kural CSS'te; burada engellemeye gerek yok ama bilerek böyle.
// ============================================================
export default function Buton({
  tip = 'ana',
  boyut = 'normal',
  ikonRengi,
  className = '',
  children,
  ...digerleri
}) {
  const siniflar = [
    'buton',
    'buton-' + tip,
    boyut === 'kucuk' ? 'buton-kucuk' : '',
    ikonRengi ? 'buton-ikon-' + ikonRengi : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  // ⚠️ className AYRI BİR PROP OLARAK ALINIYOR, digerleri'nin
  // içinde bırakılmıyor.
  //
  // Eski hali <button className={siniflar} {...digerleri}> idi ve
  // digerleri SONRA yayıldığı için, çağıran bir className
  // gönderdiğinde bileşenin kendi sınıflarının TAMAMINI eziyordu —
  // buton stilsiz kalırdı. Hiç kimse denemediği için ortaya
  // çıkmamış sessiz bir tuzaktı.
  return (
    <button className={siniflar} {...digerleri}>
      {children}
    </button>
  );
}
