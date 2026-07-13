import './OzetKart.css';

// ikon   : emoji
// etiket : "Toplam Sipariş"
// deger  : "28"  ya da  "5.847,50 ₺"
// renk   : ikonun arkasındaki renk (CSS değişkeni adı)
export default function OzetKart({ ikon, etiket, deger, renk = 'var(--anaRenk)' }) {
  return (
    <div className="ozet-kart">
      <div
        className="ozet-ikon"
        style={{
          backgroundColor: renk + '22', // sonundaki 22 = %13 saydamlık
          color: renk,
        }}
      >
        {ikon}
      </div>

      <div className="ozet-metin">
        <span className="ozet-etiket">{etiket}</span>
        <span className="ozet-deger">{deger}</span>
      </div>
    </div>
  );
}