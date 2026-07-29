import { useEffect, useState } from 'react';

import { apiGet } from '../services/api';
import { paraBicimle, sayiBicimle, tarihBicimle } from '../utils/bicimlendir';

import Buton from './Buton';
import Yukleniyor from './Yukleniyor';
import Sayfalama from './Sayfalama';

import './KuponKullanimlariModal.css';

// "Bu kuponu kim, ne zaman, hangi siparişte kullandı?" penceresi.
//
// Neden ayrı bir SAYFA değil de modal?
//   Bu bilgi bir "yan bakış" — admin listeden ayrılmadan bakıp
//   kapatmak ister. Ayrı sayfa yapsaydık yeni rota, geri butonu
//   yönetimi ve sayfa yükleme maliyeti gelirdi. Modal daha hafif.
//
// props:
//   kupon : { id, code } — null ise pencere kapalı
//   kapat : pencereyi kapatan fonksiyon
export default function KuponKullanimlariModal({ kupon, kapat }) {
  const [kullanimlar, setKullanimlar] = useState([]);
  const [sayfaBilgi, setSayfaBilgi] = useState({ toplam: 0, toplamSayfa: 1 });

  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState('');

  const [sayfa, setSayfa] = useState(1);
  const [sayfaBoyutu, setSayfaBoyutu] = useState(10);

  // Pencere açıldığında veya sayfa değiştiğinde veriyi çek.
  //
  // ⚠️ Bağımlılık dizisinde kupon?.id var, kupon nesnesi değil.
  //    Sebebi: her render'da yeni bir nesne referansı gelirse
  //    useEffect sonsuz döngüye girer. İlkel değer (sayı) karşılaştırması
  //    güvenlidir, nesne referansı karşılaştırması değildir.
  useEffect(() => {
    if (!kupon) {
      return;
    }

    async function getir() {
      setYukleniyor(true);
      setHata('');

      try {
        const p = new URLSearchParams();
        p.append('page', sayfa);
        p.append('pageSize', sayfaBoyutu);

        const veri = await apiGet(
          '/admin/coupons/' + kupon.id + '/kullanimlar?' + p.toString()
        );

        setKullanimlar(veri.kullanimlar);
        setSayfaBilgi({ toplam: veri.toplam, toplamSayfa: veri.toplamSayfa });
      } catch (e) {
        setHata(e.message);
      } finally {
        setYukleniyor(false);
      }
    }

    getir();
  }, [kupon?.id, sayfa, sayfaBoyutu]);

  // Farklı bir kupona geçildiğinde 1. sayfaya dön.
  // Olmasaydı 3. sayfadayken başka kupona geçince boş liste görürdük.
  useEffect(() => {
    setSayfa(1);
  }, [kupon?.id]);

  // Kapalıysa hiçbir şey çizme.
  // Bu satır TÜM hook'lardan SONRA gelmeli — React'in hook kuralı:
  // hook sayısı her render'da aynı olmalı, koşullu çağrılamaz.
  if (!kupon) {
    return null;
  }

  return (
    <div className="kk-perde" onClick={kapat}>
      {/* stopPropagation: kutunun içine tıklayınca pencere kapanmasın */}
      <div className="kk-kutu" onClick={(e) => e.stopPropagation()}>

        <div className="kk-baslik">
          <div>
            <div className="kk-baslik-yazi">
              🎟️ {kupon.code} — Kullanımlar
            </div>

            <div className="kk-baslik-alt">
              Toplam {sayiBicimle(sayfaBilgi.toplam)} kullanım kaydı
            </div>
          </div>

          <Buton tip="ikincil" boyut="kucuk" onClick={kapat}>
            ✕
          </Buton>
        </div>

        <div className="kk-govde">
          {hata !== '' && (
            <div className="kk-bos" style={{ color: 'var(--hata)' }}>
              {hata}
            </div>
          )}

          {yukleniyor && <Yukleniyor yazi="Kullanımlar getiriliyor..." />}

          {!yukleniyor && hata === '' && kullanimlar.length === 0 && (
            <div className="kk-bos">
              Bu kupon henüz hiç kullanılmamış.
            </div>
          )}

          {!yukleniyor &&
            kullanimlar.map((k) => (
              <div className="kk-satir" key={k.id}>
                <div>
                  <div className="kk-kisi">{k.kullaniciAdi || 'Bilinmiyor'}</div>

                  <div className="kk-detay">
                    {k.kullaniciEmail}
                  </div>

                  <div className="kk-detay">
                    {/* Siparişi Id ile değil NUMARA ile gösteriyoruz —
                        Id teknik anahtar, OrderNumber iş anahtarı. */}
                    {k.siparisNo} · {tarihBicimle(k.usedAt)}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div className="kk-indirim">
                    −{paraBicimle(k.discountAmount)}
                  </div>

                  <div className="kk-detay">
                    sipariş {paraBicimle(k.siparisTutari)}
                  </div>
                </div>
              </div>
            ))}

          {/* Tek sayfaya sığıyorsa sayfalama çubuğu görünmesin —
              gereksiz gürültü. Türetilmiş koşul, ayrı state değil. */}
          {!yukleniyor && sayfaBilgi.toplamSayfa > 1 && (
            <Sayfalama
              sayfa={sayfa}
              toplamSayfa={sayfaBilgi.toplamSayfa}
              toplam={sayfaBilgi.toplam}
              sayfaBoyutu={sayfaBoyutu}
              sayfaDegistir={setSayfa}
              boyutDegistir={setSayfaBoyutu}
            />
          )}
        </div>

        <div className="kk-alt">
          <Buton tip="ikincil" onClick={kapat}>
            Kapat
          </Buton>
        </div>

      </div>
    </div>
  );
}