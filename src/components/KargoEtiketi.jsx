import { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import { paraBicimle, tarihBicimle } from '../utils/bicimlendir';
import './KargoEtiketi.css';

// TEK BİR KARGO ETİKETİ
//
// 10x15 cm termal etiket boyutuna göre tasarlandı (kargo standardı).
// Renk KULLANMIYORUZ — termal yazıcılar tek renk basar, renkli tasarım
// çıktıda gri lekeye dönüşür.
export default function KargoEtiketi({ etiket, magaza }) {
  const barkodRef = useRef(null);

  // Barkodu çiz. Sipariş numarası değişirse yeniden çiz.
  useEffect(() => {
    if (!barkodRef.current) {
      return;
    }

    JsBarcode(barkodRef.current, etiket.siparisNo, {
      format: 'CODE128',   // harf+rakam karışık verileri destekler
      width: 1.6,          // çubuk kalınlığı
      height: 45,
      displayValue: false, // numarayı altında ayrıca kendimiz yazıyoruz
      margin: 0,
    });
  }, [etiket.siparisNo]);

  return (
    <div className="etiket">

      {/* ---------- ÜST: GÖNDERİCİ ---------- */}
      <div className="etiket-ust">
        <div className="etiket-gonderici">
          <div className="etiket-kucuk-baslik">GÖNDERİCİ</div>
          <div className="etiket-magaza-ad">{magaza.ad}</div>
          <div className="etiket-kucuk">{magaza.adres}</div>
          <div className="etiket-kucuk">Tel: {magaza.telefon}</div>
        </div>

        <div className="etiket-tarih">
          {tarihBicimle(etiket.tarih)}
        </div>
      </div>

      {/* ---------- ORTA: ALICI (en önemli kısım, en büyük) ---------- */}
      <div className="etiket-alici">
        <div className="etiket-kucuk-baslik">ALICI</div>

        <div className="etiket-alici-ad">{etiket.aliciAdi || '—'}</div>

        <div className="etiket-adres">{etiket.acikAdres || '—'}</div>

        <div className="etiket-sehir">{etiket.sehir || '—'}</div>

        
      </div>

      {/* ---------- ALT: BARKOD ---------- */}
      <div className="etiket-alt">
        <svg ref={barkodRef} className="etiket-barkod"></svg>

        <div className="etiket-no">{etiket.siparisNo}</div>

        <div className="etiket-ozet">
          {etiket.urunCesidi} çeşit · {etiket.toplamAdet} adet · {paraBicimle(etiket.tutar)}
        </div>
      </div>

    </div>
  );
}