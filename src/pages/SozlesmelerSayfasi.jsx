import { useEffect, useState } from 'react';

import { apiGet } from '../services/api';
import { tarihBicimle } from '../utils/bicimlendir';

import Yukleniyor from '../components/Yukleniyor';
import HataKutusu from '../components/HataKutusu';

import './SozlesmelerSayfasi.css';

import { AlertTriangle, FileText } from 'lucide-react';

const BASLIKLAR = {
  gizlilik: 'Gizlilik Politikası',
  kullanim: 'Kullanım Koşulları',
  mesafeli_satis: 'Mesafeli Satış Sözleşmesi',
  on_bilgilendirme: 'Ön Bilgilendirme Formu',
};

// ⭐ YENİ (Aşama 10) — sözleşme metinleri, SALT OKUNUR.
// Düzenleme faz 2: metin değiştirmek yeni sürüm eklemek demek ve
// eski onayların eski metne bağlı kalması gerekiyor.
export default function SozlesmelerSayfasi() {
  const [liste, setListe] = useState([]);
  const [seciliTip, setSeciliTip] = useState(null);
  const [metin, setMetin] = useState(null);

  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState('');

  useEffect(() => {
    let iptal = false;

    (async () => {
      try {
        const veri = await apiGet('/sozlesmeler');
        if (iptal) return;

        setListe(veri);
        if (veri.length > 0) setSeciliTip(veri[0].tip);
      } catch (e) {
        if (!iptal) setHata(e.message);
      } finally {
        if (!iptal) setYukleniyor(false);
      }
    })();

    return () => { iptal = true; };
  }, []);

  useEffect(() => {
    if (!seciliTip) return;

    let iptal = false;

    (async () => {
      try {
        const veri = await apiGet('/sozlesmeler/' + seciliTip);
        if (!iptal) setMetin(veri);
      } catch (e) {
        if (!iptal) setHata(e.message);
      }
    })();

    return () => { iptal = true; };
  }, [seciliTip]);

  if (yukleniyor) {
    return <Yukleniyor yazi="Sözleşmeler getiriliyor..." />;
  }

  return (
    <div>
      <div className="sayfa-ust">
        <div>
          <h1 className="sayfa-baslik">Sözleşmeler</h1>
          <p className="sayfa-altyazi">
            Kayıt ve sipariş sırasında müşteriye gösterilen metinler.
          </p>
        </div>
      </div>

      {hata && <HataKutusu mesaj={hata} />}

      {/* ⚠️ Uyarı MÜŞTERİYE değil mağaza sahibine görünüyor: metinler
          taslak ve yayına çıkmadan hukuki inceleme gerekiyor. */}
      <div className="sozlesme-uyari">
        <AlertTriangle size={16} />
        <span>
          Bu metinler taslaktır. Yayına çıkmadan önce bir hukukçu tarafından
          incelenmeli; mağaza unvanı, adres ve iletişim bilgileri eklenmeli.
        </span>
      </div>

      <div className="sozlesme-duzen">
        <div className="sozlesme-liste">
          {liste.map((s) => (
            <button
              key={s.tip}
              type="button"
              className={'sozlesme-satir' + (seciliTip === s.tip ? ' sozlesme-satir-aktif' : '')}
              onClick={() => setSeciliTip(s.tip)}
            >
              <FileText size={15} />
              <span className="sozlesme-ad">{BASLIKLAR[s.tip] ?? s.tip}</span>
              <span className="sozlesme-surum">v{s.surum}</span>
            </button>
          ))}
        </div>

        <div className="kart sozlesme-metin-kart">
          {metin ? (
            <>
              <div className="sozlesme-metin-ust">
                <b>{BASLIKLAR[metin.tip] ?? metin.tip}</b>
                <span>Sürüm {metin.surum} · {tarihBicimle(metin.yayinTarihi)}</span>
              </div>

              {/* pre-wrap: metindeki satır sonları korunuyor. */}
              <div className="sozlesme-metin">{metin.icerik}</div>
            </>
          ) : (
            <div className="sozlesme-bos">Soldan bir sözleşme seç.</div>
          )}
        </div>
      </div>
    </div>
  );
}
