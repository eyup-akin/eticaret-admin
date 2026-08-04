import { useEffect, useState } from 'react';

import { apiGet } from '../../services/api';
import { paraBicimle, sayiBicimle } from '../../utils/bicimlendir';

import Yukleniyor from '../Yukleniyor';
import HataKutusu from '../HataKutusu';
import Tablo from '../Tablo';
import OzetKart from '../OzetKart';

// ============================================================
//  KRİTİK STOK — eşiğin altındaki aktif ürünler
//
//  ⚠️ BU RAPOR TARİH ARALIĞI KULLANMIYOR — bilerek.
//
//  Stok ANLIK bir değerdir; "geçen ayki stok" diye bir kayıt
//  tutmuyoruz (o Aşama 3'teki StockMovement işi). Tarih
//  parametresini tutarlılık uğruna eklemek, gönderen tarafı
//  yanıltırdı: "filtre uyguladım ama sonuç değişmedi."
//
//  Bunun yerine kendi filtresi var: EŞİK.
// ============================================================
export default function KritikStokRaporu() {
  // Eşik bu bileşenin KENDİ durumu, kabuktan gelmiyor.
  //
  // Sebep: sadece bu sekmeyi ilgilendiriyor. Kabuğa taşısaydık
  // diğer 8 sekme hiç kullanmadığı bir state'i taşırdı.
  // Kural: sekmeler arası paylaşılan durum kabukta, sekmeye
  // özel durum yaprakta.
  const [esik, setEsik] = useState(5);

  const [veri, setVeri] = useState(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState('');

  async function getir() {
    setYukleniyor(true);
    setHata('');

    try {
      setVeri(await apiGet('/admin/reports/kritik-stok?esik=' + esik));
    } catch (e) {
      setHata(e.message);
    } finally {
      setYukleniyor(false);
    }
  }

  useEffect(() => {
    getir();
  }, [esik]);

  const sutunlar = [
    {
      baslik: 'Ürün',
      hucre: (u) => <span className="musteri-ad">{u.urunAdi}</span>,
    },
    {
      baslik: 'Barkod',

      // Barkod karakter karakter okunur (1/l, 0/O ayrımı) —
      // sabit genişlikli font şart.
      hucre: (u) =>
        u.barkod ? (
          <span className="kart-mono">{u.barkod}</span>
        ) : (
          <span className="rapor-bos-deger">—</span>
        ),
    },
    {
      baslik: 'Stok',
      hizala: 'sag',

      // Renk BİLGİ taşıyor: tükendi (kırmızı, satış durdu) ile
      // azaldı (turuncu, hâlâ satılıyor ama acele et) farklı
      // aciliyetler. İkisini aynı renk yapmak bilgi kaybıdır.
      hucre: (u) => (
        <span className={'rapor-sayi ' + (u.tukendi ? 'rapor-kar-eksi' : '')}>
          {u.tukendi ? 'Tükendi' : sayiBicimle(u.stok)}
        </span>
      ),
    },
    {
      baslik: 'Fiyat',
      hizala: 'sag',
      hucre: (u) => <span className="rapor-sayi">{paraBicimle(u.fiyat)}</span>,
    },
  ];

  return (
    <div>
      <div className="ozet-izgara">
        <OzetKart
          ikon="🚨"
          etiket="Tükenen Ürün"
          deger={sayiBicimle(veri?.tukenenSayisi ?? 0)}
          renk="#e74c3c"
        />

        <OzetKart
          ikon="⚠️"
          etiket="Eşik Altı Ürün"
          deger={sayiBicimle(veri?.urunSayisi ?? 0)}
          renk="#f39c12"
        />
      </div>

      {/* ---- EŞİK SEÇİCİ ---- */}
      <div className="rapor-bilgi">
        <label className="tarih-etiket">
          Stok Eşiği

          <input
            className="tarih-girdi"
            type="number"
            min="1"
            max="100"
            value={esik}

            /* ⚠️ Sayısal alanı METİN olarak değil SAYI olarak
               tutuyoruz ama boş girdiye dikkat: Number('') = 0
               ve backend 0'ı 1'e yuvarlıyor. Kullanıcı alanı
               silince ekranda "0" belirmesin diye boşta eski
               değeri koruyoruz. */
            onChange={(e) => {
              const yeni = Number(e.target.value);

              if (yeni >= 1 && yeni <= 100) {
                setEsik(yeni);
              }
            }}
            style={{ width: 80 }}
          />
        </label>

        <span>
          Stoğu <b>{esik}</b> ve altında olan aktif ürünler.
          Bu rapor <b>anlık</b> durumu gösterir, tarih filtresinden
          etkilenmez.
        </span>
      </div>

      {hata !== '' && <HataKutusu mesaj={hata} tekrarDene={getir} />}

      {yukleniyor ? (
        <Yukleniyor yazi="Stok kontrol ediliyor..." />
      ) : (
        <Tablo
          sutunlar={sutunlar}
          veriler={veri?.urunler ?? []}
          anahtar={(u) => u.urunId}
          bosMesaj="Bu eşiğin altında ürün yok."
        />
      )}
    </div>
  );
}