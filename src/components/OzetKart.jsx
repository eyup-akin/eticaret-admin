import './OzetKart.css';

// ============================================================
//  ÖZET KART — büyük bir sayıyı bağlamıyla gösterir
//
//  ikon   : emoji
//  etiket : "Toplam Sipariş"
//  deger  : "28"  ya da  "5.847,50 ₺"
//  renk   : ikonun arkasındaki renk (CSS değişkeni adı)
//  trend  : ⭐ YENİ, isteğe bağlı — { yon, yazi }
//             yon  : 'artis' | 'dusus' | 'notr'
//             yazi : '%9.97', '+120' gibi
//
//  ⚠️ TREND İSTEĞE BAĞLI VE VARSAYILANI "YOK".
//
//  Bu bileşenin 39 kullanım yeri var ve hiçbiri trend
//  göndermiyor. Zorunlu yapsaydık 39 dosyaya birden dokunmak
//  gerekirdi; varsayılanı null yapınca hepsi eskisi gibi
//  çalışmaya devam ediyor.
//
//  "Yeni prop eklerken varsayılanı ESKİ davranış yap."
// ============================================================
export default function OzetKart({
  ikon,
  etiket,
  deger,
  renk = 'var(--anaRenk)',
  trend = null,
}) {
  return (
    <div className="ozet-kart">
      {/* ---------- ÜST: bağlam ---------- */}
      <div className="ozet-ust">
        <div
          className="ozet-ikon"
          style={{
            // Sondaki "22" = %13 saydamlık (hex alfa).
            //
            // ⚠️ Bu, renk bir HEX ise çalışır. Çağıranların çoğu
            // '#2563eb' gibi düz hex gönderiyor. CSS değişkeni
            // gönderilirse ("var(--anaRenk)") alfa eki geçersiz
            // bir değer üretir ve tarayıcı ARKA PLANI HİÇ ÇİZMEZ —
            // patlamaz, sadece renksiz kalır.
            //
            // Varsayılanı bu yüzden şeffafa düşürüyoruz: renksiz
            // bir kutu, bozuk bir kutudan iyi.
            backgroundColor: renk.startsWith('#') ? renk + '22' : 'var(--acikGri)',
            color: renk,
          }}
        >
          {ikon}
        </div>

        <span className="ozet-etiket">{etiket}</span>
      </div>

      {/* ---------- ALT: asıl bilgi ---------- */}
      <div className="ozet-alt">
        <span className="ozet-deger">{deger}</span>

        {/* Trend verilmediyse rozet hiç çizilmiyor.
            Boş bir rozet yeri tutmak, kartların yüksekliğini
            eşitlemek için cazip ama yanlış: olmayan bir bilginin
            yerini göstermek okuyanı "burada bir şey mi eksik?"
            diye durdurur. */}
        {trend && (
          <span className={'trend-rozet trend-' + trend.yon}>
            {/* Ok yönü metinden BAĞIMSIZ, "yon" alanından geliyor.
                Metne bakıp ok seçseydik ("%-5 ise düşüş") eksi
                işaretinin biçimi değiştiğinde ok sessizce yanlışa
                dönerdi. */}
            {trend.yon === 'artis' ? '▲' : trend.yon === 'dusus' ? '▼' : '•'}
            {trend.yazi}
          </span>
        )}
      </div>
    </div>
  );
}
