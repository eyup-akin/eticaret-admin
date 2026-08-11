import { useEffect, useState } from 'react';

import { apiGet } from '../../services/api';
import { paraBicimle, sayiBicimle } from '../../utils/bicimlendir';

import Yukleniyor from '../Yukleniyor';
import HataKutusu from '../HataKutusu';
import Tablo from '../Tablo';
import Rozet from '../Rozet';
import OzetKart from '../OzetKart';

// ⭐ YENİ (4.7) — emoji yerine çizgi ikon. Gerekçe PanelDuzeni'nde:
// emoji her işletim sisteminde farklı çiziliyor ve rengi tema ile
// değişmiyor. Tek tek import — toplu import ağaç sallamayı engeller.
import { Banknote, CheckCircle2, Hash, Info } from 'lucide-react';

// ============================================================
//  ÖDEME BAŞARI ORANI
//
//  ⚠️ Ödeme şu an SİMÜLE ediliyor, gerçek PSP yok. Bu rapor
//  bugün çok az şey söylüyor — başarı oranı muhtemelen %100
//  çıkacak.
//
//  Peki neden yazdık? Gerçek ödeme entegrasyonu geldiğinde
//  (Faz 2) bu en kritik rapor olacak: başarısız ödeme oranının
//  yükselmesi doğrudan kaybedilen satış demektir ve fark etmek
//  için bir yere bakıyor olman gerekir.
//
//  Yapıyı şimdi kurmak, o gün sıfırdan yazmaktan ucuz.
// ============================================================
export default function OdemeRaporu({ baslangic, bitis }) {
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

      setVeri(await apiGet('/admin/reports/odemeler?' + p.toString()));
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
    return <Yukleniyor yazi="Ödeme istatistikleri getiriliyor..." />;
  }

  if (hata !== '') {
    return <HataKutusu mesaj={hata} tekrarDene={getir} />;
  }

  if (!veri) {
    return null;
  }

  const sutunlar = [
    {
      baslik: 'Durum',

      // Rozet bileşeni ham durum metnini ("basarili") güzel
      // yazı + renge çeviriyor. Aynı çeviriyi burada tekrar
      // yazsaydık iki farklı gerçek olurdu.
      hucre: (d) => <Rozet durum={d.durum} />,
    },
    {
      baslik: 'İşlem Sayısı',
      hizala: 'sag',
      hucre: (d) => <span className="rapor-sayi">{sayiBicimle(d.adet)}</span>,
    },
    {
      baslik: 'Toplam Tutar',
      hizala: 'sag',
      hucre: (d) => <span className="rapor-sayi">{paraBicimle(d.tutar)}</span>,
    },
    {
      baslik: 'Pay',
      hizala: 'sag',

      // Yüzdeyi burada hesaplıyoruz çünkü sunucu durum bazında
      // oran göndermiyor — toplam elimizde, bölmek yeterli.
      hucre: (d) => (
        <span className="rapor-sayi">
          %
          {veri.toplamIslem > 0
            ? Math.round((d.adet / veri.toplamIslem) * 100)
            : 0}
        </span>
      ),
    },
  ];

  return (
    <div>
      <div className="ozet-izgara">
        <OzetKart
          ikon={<CheckCircle2 size={20} />}
          etiket="Başarı Oranı"
          deger={'%' + veri.basariOrani}
          renk="#27ae60"
        />

        <OzetKart
          ikon={<Hash size={20} />}
          etiket="Toplam İşlem"
          deger={sayiBicimle(veri.toplamIslem)}
          renk="#2563eb"
        />

        <OzetKart
          ikon={<Banknote size={20} />}
          etiket="Başarılı Tutar"
          deger={paraBicimle(veri.basariliTutar)}
          renk="#f39c12"
        />
      </div>

      <div className="rapor-bilgi">
        <span>
          Dönem: <b>{veri.baslangic}</b> – <b>{veri.bitis}</b>
        </span>

        <span>
          <Info size={14} /> Ödeme şu an simüle ediliyor. Gerçek ödeme sağlayıcısı
          eklendiğinde bu rapor başarısız işlemleri de gösterecek.
        </span>
      </div>

      <Tablo
        sutunlar={sutunlar}
        veriler={veri.durumlar}
        anahtar={(d) => d.durum}
        bosMesaj="Bu dönemde ödeme işlemi yok."
      />
    </div>
  );
}