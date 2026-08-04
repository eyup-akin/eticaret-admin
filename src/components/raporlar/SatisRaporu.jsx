import { useEffect, useState } from 'react';

import { apiGet } from '../../services/api';
import { paraBicimle, sayiBicimle } from '../../utils/bicimlendir';

import Yukleniyor from '../Yukleniyor';
import HataKutusu from '../HataKutusu';
import Tablo from '../Tablo';
import OzetKart from '../OzetKart';

// ============================================================
//  SATIŞLAR & KÂR RAPORU
//
//  Bu bileşen KENDİ verisini çekiyor. Kabuk sadece tarih aralığını
//  props olarak veriyor.
//
//  Dün eklediğimiz OrderItem.UnitCost ve ProductName alanları
//  olmadan bu rapor yazılamazdı — kâr canlı maliyetten hesaplansaydı
//  geçmiş aylar bugünkü maliyete göre değişirdi.
// ============================================================
export default function SatisRaporu({ baslangic, bitis }) {
  const [veri, setVeri] = useState(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState('');

  async function getir() {
    setYukleniyor(true);
    setHata('');

    try {
      // URLSearchParams: parametreleri elle string birleştirmek
      // yerine kullanıyoruz. Özel karakterleri kendisi kaçırıyor
      // ve boş parametre eklemeyi unutma riski kalmıyor.
      const p = new URLSearchParams();

      // ⚠️ Boş değerleri GÖNDERMİYORUZ.
      // "?baslangic=" şeklinde boş göndersek backend bunu geçerli
      // bir tarih sanıp ayrıştırmaya çalışırdı. Göndermezsek
      // sunucudaki varsayılan (son 30 gün) devreye girer.
      if (baslangic !== '') {
        p.append('baslangic', baslangic);
      }

      if (bitis !== '') {
        p.append('bitis', bitis);
      }

      const sonuc = await apiGet('/admin/reports/satislar?' + p.toString());
      setVeri(sonuc);
    } catch (e) {
      setHata(e.message);
    } finally {
      setYukleniyor(false);
    }
  }

  // ⚠️ BAĞIMLILIK DİZİSİNDE İLKEL DEĞERLER VAR (metin), NESNE DEĞİL.
  //
  // { baslangic, bitis } gibi bir nesne geçseydik referansı her
  // render'da değişir ve effect sonsuz döngüye girerdi.
  // Metinler değere göre karşılaştırılır — güvenli.
  useEffect(() => {
    getir();
  }, [baslangic, bitis]);

  if (yukleniyor) {
    return <Yukleniyor yazi="Satış raporu hesaplanıyor..." />;
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
      baslik: 'Adet',
      hizala: 'sag',
      hucre: (u) => <span className="rapor-sayi">{sayiBicimle(u.adet)}</span>,
    },
    {
      baslik: 'Ciro',
      hizala: 'sag',
      hucre: (u) => <span className="rapor-sayi">{paraBicimle(u.ciro)}</span>,
    },
    {
      baslik: 'Maliyet',
      hizala: 'sag',

      // ⚠️ maliyetEksik bayrağına bakıyoruz, maliyet === null'a değil.
      // Sunucu ikisini de gönderiyor ama bayrak NİYETİ anlatıyor:
      // "bu satırda maliyet bilgisi eksik". null kontrolü ise sadece
      // teknik bir durum — ileride 0 maliyetli ürün çıkarsa ayrım
      // bayrakta korunur.
      hucre: (u) =>
        u.maliyetEksik ? (
          <span className="rapor-bos-deger">—</span>
        ) : (
          <span className="rapor-sayi">{paraBicimle(u.maliyet)}</span>
        ),
    },
    {
      baslik: 'Kâr',
      hizala: 'sag',
      hucre: (u) => {
        if (u.maliyetEksik) {
          return <span className="rapor-bos-deger">—</span>;
        }

        // Kâr negatif olabilir: zararına satış. Renk bunu anlatmalı,
        // yoksa admin eksi rakamı gözden kaçırır.
        return (
          <span
            className={
              'rapor-sayi ' +
              (u.kar >= 0 ? 'rapor-kar-arti' : 'rapor-kar-eksi')
            }
          >
            {paraBicimle(u.kar)}
          </span>
        );
      },
    },
    {
      baslik: 'Marj',
      hizala: 'sag',
      hucre: (u) =>
        u.maliyetEksik ? (
          <span className="rapor-bos-deger">—</span>
        ) : (
          <span className="rapor-sayi">%{u.marj}</span>
        ),
    },
  ];

  return (
    <div>
      {/* ---------- ÖZET KARTLAR ---------- */}
      <div className="ozet-izgara">
        <OzetKart
          ikon="💵"
          etiket="Toplam Ciro"
          deger={paraBicimle(veri.toplamCiro)}
          renk="#2563eb"
        />

        <OzetKart
          ikon="📈"
          etiket="Toplam Kâr"
          deger={paraBicimle(veri.toplamKar)}
          renk="#27ae60"
        />

        <OzetKart
          ikon="📦"
          etiket="Satılan Adet"
          deger={sayiBicimle(veri.toplamAdet)}
          renk="#f39c12"
        />

        <OzetKart
          ikon="🏷️"
          etiket="Ürün Çeşidi"
          deger={sayiBicimle(veri.urunler.length)}
          renk="#8e44ad"
        />
      </div>

      {/* ---------- DÖNEM BİLGİSİ + UYARI ---------- */}
      <div className="rapor-bilgi">
        {/* Dönemi SUNUCUDAN gelen değerle yazıyoruz, ön yüzde
            hesaplamıyoruz. Kullanıcı tarih seçmediyse "son 30 gün"
            kuralı sunucuda yaşıyor — burada tahmin etmek iki farklı
            gerçek yaratırdı. */}
        <span>
          Dönem: <b>{veri.baslangic}</b> – <b>{veri.bitis}</b>
        </span>

        {/* Kâr sayısının ne kadar güvenilir olduğunu SÖYLÜYORUZ.
            Bu uyarı olmasa admin "toplam kâr" rakamının eksik
            olduğunu asla anlamazdı. */}
        {veri.maliyetEksikSatirSayisi > 0 && (
          <span className="rapor-uyari">
            ⚠️ {veri.maliyetEksikSatirSayisi} üründe maliyet bilgisi yok —
            kâr toplamına dahil edilmedi
          </span>
        )}
      </div>

      <Tablo
        sutunlar={sutunlar}
        veriler={veri.urunler}
        anahtar={(u) => u.urunId}
        bosMesaj="Bu dönemde satış yok."
      />
    </div>
  );
}