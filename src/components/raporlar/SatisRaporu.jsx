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
import { Banknote, Package, Tag, TrendingUp } from 'lucide-react';
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

  // Tabloyu CSV'ye çevirir.
  //
  // ⚠️ Sütunlar TABLODAKİYLE AYNI SIRADA olmalı — kullanıcı
  // ekranda gördüğüyle dosyada gördüğünü eşleştirebilsin.
  //
  // Neden sutunlar dizisini yeniden kullanmıyoruz? Oradaki
  // "hucre" fonksiyonları JSX döndürüyor (<span>...</span>);
  // CSV'ye yazılamaz. Ham veriden ayrı bir dönüşüm gerekiyor.
  function disaAktar() {
    const basliklar = ['Ürün', 'Adet', 'Ciro', 'Maliyet', 'KDV', 'Kâr', 'Marj %'];

    const satirlar = veri.urunler.map((u) => [
      u.urunAdi,
      u.adet,
      sayiCsv(u.ciro),

      // Maliyet bilinmiyorsa boş hücre bırakıyoruz, 0 değil.
      // 0 yazsaydık Excel'de toplama girer ve kâr şişerdi.
      u.maliyetEksik ? '' : sayiCsv(u.maliyet),

      // ⭐ DEĞİŞTİ — artık "kar == null" kontrolü.
      //
      // Eskiden maliyetEksik'e bakılıyordu. Kâr artık İKİ sebeple
      // hesaplanamıyor olabilir: maliyet eksik VEYA KDV oranı
      // bilinmiyor. Eski kontrol kalsaydı, KDV'si bilinmeyen bir
      // satırda kar null olur ve sayiCsv(null) hücreye 0 yazardı —
      // Excel'de toplanır, kâr uydurma şekilde şişerdi.
      //
      // Değere bakmak burada bayrağa bakmaktan sağlam: "kâr yok"
      // durumunun kaç sebebi olursa olsun tek kontrol yeterli.
      u.kar == null ? '' : sayiCsv(u.kdv),
      u.kar == null ? '' : sayiCsv(u.kar),
      u.kar == null ? '' : sayiCsv(u.marj),
    ]);

    csvIndir('satis-raporu', basliklar, satirlar);
  }

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
      // ⭐ YENİ — devlete ödenen net KDV.
      //
      // Ciro ile Kâr sütunlarının ARASINDA duruyor çünkü hesabın ara
      // adımı: ciro − maliyet − KDV = kâr. Sütun sırası hesabın
      // sırasını izlerse admin rakamı gözle doğrulayabiliyor.
      //
      // Bu sütun olmasaydı kâr rakamının neden düştüğü ekranda
      // görünmezdi ve "rapor bozuldu mu?" sorusu doğardı.
      baslik: 'KDV',
      hizala: 'sag',
      hucre: (u) =>
        u.kar == null ? (
          <span className="rapor-bos-deger">—</span>
        ) : (
          <span className="rapor-sayi">{paraBicimle(u.kdv)}</span>
        ),
    },
    {
      baslik: 'Kâr',
      hizala: 'sag',

      // ⭐ DEĞİŞTİ — koşul "maliyetEksik" değil "kar == null".
      //
      // Kâr artık İKİ sebeple hesaplanamıyor olabilir: maliyet eksik
      // VEYA KDV oranı bilinmiyor (bu alan eklenmeden önceki
      // siparişler). Eski kontrol kalsaydı KDV'si bilinmeyen satırda
      // paraBicimle(null) çalışır ve ekranda "0,00 ₺" yazardı —
      // yani "bu üründen hiç kâr edilmedi" gibi YANLIŞ bir bilgi.
      hucre: (u) => {
        if (u.kar == null) {
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
        u.kar == null ? (
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
          ikon={<Banknote size={20} />}
          etiket="Toplam Ciro"
          deger={paraBicimle(veri.toplamCiro)}
          renk="#2563eb"
        />

        <OzetKart
          ikon={<TrendingUp size={20} />}
          etiket="Toplam Kâr"
          deger={paraBicimle(veri.toplamKar)}
          renk="#27ae60"
        />

        <OzetKart
          ikon={<Package size={20} />}
          etiket="Satılan Adet"
          deger={sayiBicimle(veri.toplamAdet)}
          renk="#f39c12"
        />

        <OzetKart
          ikon={<Tag size={20} />}
          etiket="Ürün Çeşidi"
          deger={sayiBicimle(veri.urunler.length)}
          renk="#8e44ad"
        />
      </div>

      {/* ---------- DÖNEM BİLGİSİ + UYARI ---------- */}
      {/* ⭐ YENİ — kârı hesaplanamayan satırları AÇIKÇA söylüyoruz.

          ⚠️ BU AÇIKLAMA OLMADAN RAPOR BOZUK GÖRÜNÜR.

          KDV alanı eklenmeden önceki tüm sipariş kalemlerinde oran
          null. Yani bu özellik devreye girdiği anda geçmiş dönem
          raporlarındaki kâr sütunu baştan aşağı "—" oluyor.

          Sebebini yazmazsak admin "rapor çalışmıyor" diye düşünür ve
          haklı olur — ekranda bir açıklama yoksa boş sütun bir hatadır.

          İki sebep AYRI sayılıyor çünkü çözümleri farklı: maliyet
          eksikse ürün kartına maliyet girilir, KDV eksikse yapılacak
          bir şey yok (geçmiş veri). */}
      <RaporUstBilgi
        baslangic={veri.baslangic}
        bitis={veri.bitis}
        disaAktar={disaAktar}
        ekBilgi={
          veri.maliyetEksikSatirSayisi > 0 || veri.kdvEksikSatirSayisi > 0 ? (
            <>
              {veri.kdvEksikSatirSayisi > 0 && (
                <>
                  <b>{veri.kdvEksikSatirSayisi}</b> üründe KDV oranı
                  kayıtlı değil (bu özellik eklenmeden önceki siparişler),
                  kârları hesaplanamıyor.
                </>
              )}

              {veri.maliyetEksikSatirSayisi > 0 && (
                <>
                  {' '}
                  <b>{veri.maliyetEksikSatirSayisi}</b> üründe maliyet
                  bilgisi eksik.
                </>
              )}
            </>
          ) : null
        }
      />

      <Tablo
        sutunlar={sutunlar}
        veriler={veri.urunler}
        anahtar={(u) => u.urunId}
        bosMesaj="Bu dönemde satış yok."
      />
    </div>
  );
}