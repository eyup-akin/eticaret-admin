import { useEffect, useState } from 'react';

import { apiGet } from '../../services/api';
import { paraBicimle, sayiBicimle, tarihBicimle } from '../../utils/bicimlendir';

import Yukleniyor from '../Yukleniyor';
import HataKutusu from '../HataKutusu';
import Tablo from '../Tablo';
import OzetKart from '../OzetKart';


import { csvIndir, sayiCsv } from '../../utils/disaAktar';
import RaporUstBilgi from './RaporUstBilgi';


// ============================================================
//  İPTALLER — sebep dağılımı ve kaybedilen ciro
//
//  ⚠️ Bu rapor, siparişin VERİLDİĞİ tarihe değil İPTAL EDİLDİĞİ
//  tarihe göre filtreleniyor. Admin buraya "bu ay ne kadar ciro
//  kaybettim" sorusuyla bakar; kaybın gerçekleştiği an iptal
//  anıdır. Ocak'ta verilip Şubat'ta iptal edilen sipariş
//  Şubat'ın kaybıdır.
//
//  Aşama 9'da iade sistemi gelince bu rapor "İptaller ve
//  İadeler" olacak.
// ============================================================

function disaAktar() {
    const basliklar = ['Sipariş No', 'Müşteri', 'Sebep', 'İptal Tarihi', 'Tutar'];

    const satirlar = veri.siparisler.map((o) => [
      o.siparisNo,
      o.musteri,
      o.sebep || 'Belirtilmemiş',
      o.iptalTarihi ? o.iptalTarihi.slice(0, 10) : '',
      sayiCsv(o.tutar),
    ]);

    csvIndir('iptal-raporu', basliklar, satirlar);
  }

export default function IptalRaporu({ baslangic, bitis }) {
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

      setVeri(await apiGet('/admin/reports/iptaller?' + p.toString()));
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
    return <Yukleniyor yazi="İptaller hesaplanıyor..." />;
  }

  if (hata !== '') {
    return <HataKutusu mesaj={hata} tekrarDene={getir} />;
  }

  if (!veri) {
    return null;
  }

  const sebepSutunlari = [
    {
      baslik: 'İptal Sebebi',
      hucre: (s) => s.sebep,
    },
    {
      baslik: 'Adet',
      hizala: 'sag',
      hucre: (s) => <span className="rapor-sayi">{sayiBicimle(s.adet)}</span>,
    },
    {
      baslik: 'Kaybedilen Tutar',
      hizala: 'sag',
      hucre: (s) => <span className="rapor-sayi">{paraBicimle(s.tutar)}</span>,
    },
  ];

  const siparisSutunlari = [
    {
      baslik: 'Sipariş No',

      // Sipariş numarası karakter karakter okunan bir metin —
      // monospace font 1/l ve 0/O ayrımını mümkün kılar.
      hucre: (o) => <span className="kart-mono">{o.siparisNo}</span>,
    },
    {
      baslik: 'Müşteri',
      hucre: (o) => <span className="musteri-ad">{o.musteri}</span>,
    },
    {
      baslik: 'Sebep',
      hucre: (o) =>
        o.sebep ? o.sebep : <span className="rapor-bos-deger">Belirtilmemiş</span>,
    },
    {
      baslik: 'İptal Tarihi',
      hucre: (o) =>
        o.iptalTarihi ? (
          tarihBicimle(o.iptalTarihi)
        ) : (
          <span className="rapor-bos-deger">—</span>
        ),
    },
    {
      baslik: 'Tutar',
      hizala: 'sag',
      hucre: (o) => (
        <span className="rapor-sayi rapor-kar-eksi">{paraBicimle(o.tutar)}</span>
      ),
    },
  ];

  return (
    <div>
      <div className="ozet-izgara">
        <OzetKart
          ikon="❌"
          etiket="İptal Sayısı"
          deger={sayiBicimle(veri.iptalSayisi)}
          renk="#e74c3c"
        />

        <OzetKart
          ikon="📉"
          etiket="İptal Oranı"

          // Ham sayı tek başına anlamsız: "12 iptal" iyi mi kötü mü?
          // 1000 siparişte 12 mükemmel, 30 siparişte 12 felaket.
          deger={'%' + veri.iptalOrani}
          renk="#f39c12"
        />

        <OzetKart
          ikon="💸"
          etiket="Kaybedilen Ciro"
          deger={paraBicimle(veri.kaybedilenCiro)}
          renk="#8e44ad"
        />

        <OzetKart
          ikon="🧾"
          etiket="Dönem Toplam Sipariş"
          deger={sayiBicimle(veri.donemToplamSiparis)}
          renk="#2563eb"
        />
      </div>

      <RaporUstBilgi
        baslangic={veri.baslangic}
        bitis={veri.bitis}
        ekBilgi="İptal tarihine göre filtrelenmiştir."
        disaAktar={disaAktar}
      />

      {/* Sebep dağılımı önce: "neden iptal ediliyor" sorusu
          "hangi siparişler iptal edildi" sorusundan daha
          eyleme dönüştürülebilir. */}
      <h3 className="rapor-bolum-baslik">Sebep Dağılımı</h3>

      <Tablo
        sutunlar={sebepSutunlari}
        veriler={veri.sebepler}
        anahtar={(s) => s.sebep}
        bosMesaj="Bu dönemde iptal yok."
      />

      <h3 className="rapor-bolum-baslik" style={{ marginTop: 24 }}>
        İptal Edilen Siparişler
      </h3>

      <Tablo
        sutunlar={siparisSutunlari}
        veriler={veri.siparisler}
        anahtar={(o) => o.siparisId}
        bosMesaj="Bu dönemde iptal yok."
      />
    </div>
  );
}