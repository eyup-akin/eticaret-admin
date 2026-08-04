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
//  EN ÇOK HARCAYAN MÜŞTERİLER
//
//  Bu raporun sorusu: "Ciromun ne kadarı kimden geliyor?"
//  Çoğu perakendede cironun büyük kısmı müşterilerin küçük bir
//  kısmından gelir; kimlerin olduğunu bilmek sadakat programı
//  veya özel iletişim için başlangıç noktasıdır.
// ============================================================




export default function MusteriRaporu({ baslangic, bitis }) {
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

      setVeri(await apiGet('/admin/reports/musteriler?' + p.toString()));
    } catch (e) {
      setHata(e.message);
    } finally {
      setYukleniyor(false);
    }
  }

  useEffect(() => {
    getir();
  }, [baslangic, bitis]);

  // Bileşenin İÇİNDE olmalı — "veri" state'ine erişiyor.
  function disaAktar() {
    const basliklar = [
      'Müşteri', 'E-posta', 'Sipariş Sayısı',
      'Toplam Harcama', 'Ortalama Sepet', 'Son Sipariş',
    ];

    const satirlar = veri.musteriler.map((m) => [
      m.musteri,
      m.email,
      m.siparisSayisi,
      sayiCsv(m.toplamHarcama),
      sayiCsv(m.ortalamaSepet),

      // Tarihi ISO'nun gün kısmıyla yazıyoruz (2026-08-04).
      // tarihBicimle() ekran için güzel ama Excel'de sıralanamaz;
      // ISO biçimi hem sıralanır hem her yerde aynı okunur.
      m.sonSiparis ? m.sonSiparis.slice(0, 10) : '',
    ]);

    csvIndir('musteri-raporu', basliklar, satirlar);
  }

  if (yukleniyor) {
    return <Yukleniyor yazi="Müşteri analizi hazırlanıyor..." />;
  }

  if (hata !== '') {
    return <HataKutusu mesaj={hata} tekrarDene={getir} />;
  }

  if (!veri) {
    return null;
  }

  const sutunlar = [
    {
      baslik: 'Müşteri',
      hucre: (m) => (
        <div>
          <div className="musteri-ad">{m.musteri}</div>
          <div className="musteri-mail">{m.email}</div>
        </div>
      ),
    },
    {
      baslik: 'Sipariş',
      hizala: 'sag',
      hucre: (m) => <span className="rapor-sayi">{sayiBicimle(m.siparisSayisi)}</span>,
    },
    {
      baslik: 'Toplam Harcama',
      hizala: 'sag',
      hucre: (m) => (
        <span className="rapor-sayi rapor-kar-arti">
          {paraBicimle(m.toplamHarcama)}
        </span>
      ),
    },
    {
      baslik: 'Ortalama Sepet',
      hizala: 'sag',
      hucre: (m) => <span className="rapor-sayi">{paraBicimle(m.ortalamaSepet)}</span>,
    },
    {
      baslik: 'Son Sipariş',
      hucre: (m) => tarihBicimle(m.sonSiparis),
    },
  ];

  return (
    <div>
      <div className="ozet-izgara">
        <OzetKart
          ikon="👥"
          etiket="Alışveriş Yapan"
          deger={sayiBicimle(veri.musteriSayisi)}
          renk="#2563eb"
        />

        <OzetKart
          ikon="💵"
          etiket="Toplam Ciro"
          deger={paraBicimle(veri.toplamCiro)}
          renk="#27ae60"
        />

        <OzetKart
          ikon="🧾"
          etiket="Müşteri Başına"

          // Türetilmiş değer — sunucudan gelmiyor, burada
          // hesaplanıyor. Sıfıra bölme kontrolü şart.
          deger={
            veri.musteriSayisi > 0
              ? paraBicimle(veri.toplamCiro / veri.musteriSayisi)
              : paraBicimle(0)
          }
          renk="#f39c12"
        />
      </div>

      <RaporUstBilgi
        baslangic={veri.baslangic}
        bitis={veri.bitis}
        ekBilgi="İptal edilen siparişler dahil değildir."
        disaAktar={disaAktar}
      />

      <Tablo
        sutunlar={sutunlar}
        veriler={veri.musteriler}
        anahtar={(m) => m.userId}
        bosMesaj="Bu dönemde sipariş veren müşteri yok."
      />
    </div>
  );
}