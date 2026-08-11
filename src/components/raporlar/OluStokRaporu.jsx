import { useEffect, useState } from 'react';

import { apiGet } from '../../services/api';
import { paraBicimle, sayiBicimle } from '../../utils/bicimlendir';

import Yukleniyor from '../Yukleniyor';
import HataKutusu from '../HataKutusu';
import Tablo from '../Tablo';
import OzetKart from '../OzetKart';

import { csvIndir, sayiCsv } from '../../utils/disaAktar';
import RaporUstBilgi from './RaporUstBilgi';

// ⭐ YENİ (4.7) — emoji yerine çizgi ikon. Gerekçe PanelDuzeni'nde:
// emoji her işletim sisteminde farklı çiziliyor ve rengi tema ile
// değişmiyor. Tek tek import — toplu import ağaç sallamayı engeller.
import { Lock, Snowflake } from 'lucide-react';

// ============================================================
//  ÖLÜ STOK — seçilen aralıkta HİÇ satılmayan aktif ürünler
//
//  Bu raporun sorduğu soru: "Hangi ürünlere para bağladım ve
//  karşılığını alamadım?"
//
//  Kararı "kaç adet kaldı" değil, "kaç TL bekliyor" sayısı
//  verdirir. 20 adet kalmış bilgisi tek başına anlamsız;
//  20 × 800 TL = 16.000 TL beklemede bilgisi harekete geçirir.
// ============================================================


export default function OluStokRaporu({ baslangic, bitis }) {
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

      setVeri(await apiGet('/admin/reports/olu-stok?' + p.toString()));
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
    const basliklar = ['Ürün', 'Stok', 'Satış Fiyatı', 'Bağlı Sermaye', 'Maliyet Girilmiş'];

    const satirlar = veri.urunler.map((u) => [
      u.urunAdi,
      u.stok,
      sayiCsv(u.fiyat),
      sayiCsv(u.bagliSermaye),
      u.maliyetVarMi ? 'Evet' : 'Hayır',
    ]);

    csvIndir('olu-stok-raporu', basliklar, satirlar);
  }

  if (yukleniyor) {
    return <Yukleniyor yazi="Ölü stok taranıyor..." />;
  }

  if (hata !== '') {
    return <HataKutusu mesaj={hata} tekrarDene={getir} />;
  }

  if (!veri) {
    return null;
  }

  const sutunlar = [
    {
      baslik: 'Ürün',
      hucre: (u) => <span className="musteri-ad">{u.urunAdi}</span>,
    },
    {
      baslik: 'Stok',
      hizala: 'sag',
      hucre: (u) => <span className="rapor-sayi">{sayiBicimle(u.stok)}</span>,
    },
    {
      baslik: 'Satış Fiyatı',
      hizala: 'sag',
      hucre: (u) => <span className="rapor-sayi">{paraBicimle(u.fiyat)}</span>,
    },
    {
      baslik: 'Bağlı Sermaye',
      hizala: 'sag',
      hucre: (u) => (
        <span className="rapor-sayi">
          {paraBicimle(u.bagliSermaye)}

          {/* Maliyet yoksa hesap satış fiyatından yapıldı — bu bir
              TAHMİN, gerçek bağlı sermaye değil. Kullanıcıya
              söylemezsek rakamı kesin sanır. */}
          {!u.maliyetVarMi && (
            <span className="rapor-bos-deger" title="Maliyet girilmemiş, satış fiyatı kullanıldı">
              {' '}≈
            </span>
          )}
        </span>
      ),
    },
  ];

  return (
    <div>
      <div className="ozet-izgara">
        <OzetKart
          ikon={<Snowflake size={20} />}
          etiket="Satılmayan Ürün"
          deger={sayiBicimle(veri.urunSayisi)}
          renk="#8e44ad"
        />

        <OzetKart
          ikon={<Lock size={20} />}
          etiket="Bağlı Sermaye"
          deger={paraBicimle(veri.toplamBagliSermaye)}
          renk="#e74c3c"
        />
      </div>

      <RaporUstBilgi
        baslangic={veri.baslangic}
        bitis={veri.bitis}
        ekBilgi="Bu aralıkta hiç satılmayan aktif ürünler."
        disaAktar={disaAktar}
      />

      <Tablo
        sutunlar={sutunlar}
        veriler={veri.urunler}
        anahtar={(u) => u.urunId}
        bosMesaj="Harika — bu dönemde tüm aktif ürünlerden en az bir satış olmuş."
      />
    </div>
  );
}