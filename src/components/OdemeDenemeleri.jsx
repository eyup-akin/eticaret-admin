import { useEffect, useState } from 'react';

import { apiGet } from '../services/api';
import { paraBicimle, tarihBicimle } from '../utils/bicimlendir';

import Rozet from './Rozet';

import { ChevronDown, ChevronRight, CreditCard, ShieldAlert } from 'lucide-react';

import './OdemeDenemeleri.css';

// iyzico'nun fraud kodları. 0 "onaylandı" DEĞİL — inceleme sürüyor
// ve ret gelebilir, o yüzden ayrı bir metin.
const FRAUD = {
  1: { yazi: 'Onaylandı', sinif: 'fraud-onay' },
  0: { yazi: 'İncelemede — para kesin değil', sinif: 'fraud-inceleme' },
  '-1': { yazi: 'Reddedildi', sinif: 'fraud-ret' },
};

export default function OdemeDenemeleri({ siparisId }) {
  const [denemeler, setDenemeler] = useState(null);
  const [hata, setHata] = useState('');
  const [acikHam, setAcikHam] = useState(null);

  useEffect(() => {
    apiGet('/admin/orders/' + siparisId + '/odeme-denemeleri')
      .then(setDenemeler)
      .catch((e) => setHata(e.message));
  }, [siparisId]);

  // Denemesi olmayan siparişlerde kutu hiç çizilmiyor: boş bir kutu
  // "veri gelmedi mi, yok mu?" sorusunu doğurur.
  if (hata !== '' || denemeler === null || denemeler.length === 0) {
    return null;
  }

  return (
    <div className="kutu">
      <div className="kutu-baslik">
        <CreditCard size={18} /> Ödeme Denemeleri ({denemeler.length})
      </div>

      {denemeler.map((d) => {
        const fraud = FRAUD[String(d.fraudDurumu)];
        const hamAcik = acikHam === d.id;

        return (
          <div key={d.id} className="deneme">
            <div className="deneme-ust">
              <Rozet durum={d.durum} />

              <span className="deneme-tarih">
                {tarihBicimle(d.olusturmaZamani)}
              </span>
            </div>

            <div className="deneme-izgara">
              <div className="deneme-alan">
                <span className="deneme-etiket">Tutar</span>
                <span className="deneme-deger">{paraBicimle(d.price)}</span>
              </div>

              {/* ⚠️ Taksitte ödenen tutar sipariş toplamından BÜYÜK olur;
                  fark banka komisyonu ve ciroya girmez. Bu yüzden ikisi
                  yan yana gösteriliyor. */}
              <div className="deneme-alan">
                <span className="deneme-etiket">Çekilen</span>
                <span className="deneme-deger">
                  {d.paidPrice === null ? '—' : paraBicimle(d.paidPrice)}
                </span>
              </div>

              <div className="deneme-alan">
                <span className="deneme-etiket">Taksit</span>
                <span className="deneme-deger">
                  {d.taksit > 1 ? d.taksit + ' taksit' : 'Tek çekim'}
                </span>
              </div>

              <div className="deneme-alan">
                <span className="deneme-etiket">Kart</span>
                <span className="deneme-deger kart-mono">
                  {d.binNumarasi ? d.binNumarasi + '•• •••• ' : '•••• '}
                  {d.son4Hane || '????'}
                </span>
              </div>

              <div className="deneme-alan">
                <span className="deneme-etiket">Kart Tipi</span>
                <span className="deneme-deger">
                  {[d.kartAilesi, d.kartTipi].filter(Boolean).join(' · ') || '—'}
                </span>
              </div>

              <div className="deneme-alan">
                <span className="deneme-etiket">iyzico No</span>
                <span className="deneme-deger kart-mono">
                  {d.iyzicoPaymentId || '—'}
                </span>
              </div>
            </div>

            {fraud && (
              <div className={'fraud-satiri ' + fraud.sinif}>
                <ShieldAlert size={14} /> Fraud: {fraud.yazi}
              </div>
            )}

            {d.hataMesaji && (
              <div className="deneme-hata">
                {d.hataKodu ? d.hataKodu + ': ' : ''}{d.hataMesaji}
              </div>
            )}

            {d.kalemler.length > 0 && (
              <table className="kalem-tablo">
                <thead>
                  <tr>
                    <th>Kalem</th>
                    <th className="sag">Tutar</th>
                    <th className="sag">İade Edilen</th>
                  </tr>
                </thead>
                <tbody>
                  {d.kalemler.map((k) => (
                    <tr key={k.iyzicoPaymentTransactionId}>
                      {/* orderItemId null = kargo satırı */}
                      <td>{k.orderItemId === null ? 'Kargo' : (k.urunAdi || '#' + k.orderItemId)}</td>
                      <td className="sag">{paraBicimle(k.paidPrice)}</td>
                      <td className="sag">
                        {k.iadeEdilenTutar > 0 ? paraBicimle(k.iadeEdilenTutar) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {d.hamCevap && (
              <>
                <button
                  className="ham-buton"
                  onClick={() => setAcikHam(hamAcik ? null : d.id)}
                >
                  {hamAcik ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  iyzico ham cevabı
                </button>

                {hamAcik && <pre className="ham-cevap">{d.hamCevap}</pre>}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
