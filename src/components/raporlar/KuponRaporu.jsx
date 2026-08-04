import { useEffect, useState } from 'react';

import { apiGet } from '../../services/api';
import { paraBicimle, sayiBicimle } from '../../utils/bicimlendir';

import Yukleniyor from '../Yukleniyor';
import HataKutusu from '../HataKutusu';
import Tablo from '../Tablo';
import OzetKart from '../OzetKart';

// ============================================================
//  KUPON PERFORMANSI
//
//  ⭐ ASIL SORU: "Bu kampanya kâr getirdi mi?"
//
//  İndirim tek başına bir MALİYETTİR. Getirdiği ciroyla birlikte
//  bakılmadan anlamsızdır:
//    5.000 TL indirim → 80.000 TL ciro  = iyi kampanya
//    5.000 TL indirim →  6.000 TL ciro  = zarar
//
//  Bu yüzden tabloda "verimlilik" sütunu var: 1 TL indirim başına
//  kaç TL ciro geldi. Ham sayılar ölçeğe bağlıdır, oran değildir —
//  küçük kupon az indirim az ciro getirir ama oranı yüksek olabilir.
// ============================================================
export default function KuponRaporu({ baslangic, bitis }) {
  const [veri, setVeri] = useState(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState('');

  async function getir() {
    setYukleniyor(true);
    setHata('');

    try {
      const p = new URLSearchParams();

      if (baslangic !== '') {
        p.append('baslangic', baslangic);
      }

      if (bitis !== '') {
        p.append('bitis', bitis);
      }

      setVeri(await apiGet('/admin/reports/kuponlar?' + p.toString()));
    } catch (e) {
      setHata(e.message);
    } finally {
      setYukleniyor(false);
    }
  }

  useEffect(() => {
    getir();
  }, [baslangic, bitis]);

  if (yukleniyor) {
    return <Yukleniyor yazi="Kupon performansı hesaplanıyor..." />;
  }

  if (hata !== '') {
    return <HataKutusu mesaj={hata} tekrarDene={getir} />;
  }

  if (!veri) {
    return null;
  }

  const sutunlar = [
    {
      baslik: 'Kod',

      // Kupon kodu karakter karakter okunur (1/l, 0/O ayrımı) —
      // sabit genişlikli font zorunlu.
      hucre: (k) => (
        <div>
          <div className="kart-mono">{k.kod}</div>

          {k.aciklama !== '' && (
            <div className="musteri-mail">{k.aciklama}</div>
          )}
        </div>
      ),
    },
    {
      baslik: 'Kullanım',
      hizala: 'sag',
      hucre: (k) => <span className="rapor-sayi">{sayiBicimle(k.kullanimSayisi)}</span>,
    },
    {
      baslik: 'Farklı Müşteri',
      hizala: 'sag',

      // Kullanım sayısından FARKLI bir bilgi: aynı kişi 5 kez
      // kullandıysa kampanya kitleye ulaşmamış demektir.
      hucre: (k) => <span className="rapor-sayi">{sayiBicimle(k.farkliMusteri)}</span>,
    },
    {
      baslik: 'Verilen İndirim',
      hizala: 'sag',
      hucre: (k) => (
        <span className="rapor-sayi rapor-kar-eksi">
          {paraBicimle(k.toplamIndirim)}
        </span>
      ),
    },
    {
      baslik: 'Getirilen Ciro',
      hizala: 'sag',
      hucre: (k) => (
        <span className="rapor-sayi rapor-kar-arti">
          {paraBicimle(k.getirilenCiro)}
        </span>
      ),
    },
    {
      baslik: 'Verimlilik',
      hizala: 'sag',

      // "1 TL indirim başına X TL ciro" — kampanyaları
      // kıyaslamanın en sade yolu.
      hucre: (k) =>
        k.verimlilik === null ? (
          <span className="rapor-bos-deger">—</span>
        ) : (
          <span className="rapor-sayi">{k.verimlilik}×</span>
        ),
    },
  ];

  return (
    <div>
      <div className="ozet-izgara">
        <OzetKart
          ikon="🎟️"
          etiket="Kullanılan Kupon"
          deger={sayiBicimle(veri.kuponSayisi)}
          renk="#8e44ad"
        />

        <OzetKart
          ikon="🔢"
          etiket="Toplam Kullanım"
          deger={sayiBicimle(veri.toplamKullanim)}
          renk="#2563eb"
        />

        <OzetKart
          ikon="💸"
          etiket="Verilen İndirim"
          deger={paraBicimle(veri.toplamIndirim)}
          renk="#e74c3c"
        />

        <OzetKart
          ikon="💵"
          etiket="Getirilen Ciro"
          deger={paraBicimle(veri.toplamCiro)}
          renk="#27ae60"
        />
      </div>

      <div className="rapor-bilgi">
        <span>
          Dönem: <b>{veri.baslangic}</b> – <b>{veri.bitis}</b>
          {' '}(kuponun kullanıldığı tarihe göre)
        </span>

        <span>
          <b>Verimlilik</b> = getirilen ciro ÷ verilen indirim.
          Yüksek olması iyidir.
        </span>
      </div>

      <Tablo
        sutunlar={sutunlar}
        veriler={veri.kuponlar}
        anahtar={(k) => k.couponId}
        bosMesaj="Bu dönemde hiç kupon kullanılmamış."
      />
    </div>
  );
}