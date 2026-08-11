import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { apiGet, apiPut, apiDelete } from '../services/api';
import { paraBicimle, sayiBicimle, gunBicimle } from '../utils/bicimlendir';

import Yukleniyor from '../components/Yukleniyor';
import HataKutusu from '../components/HataKutusu';
import Tablo from '../components/Tablo';
import Buton from '../components/Buton';
import Rozet from '../components/Rozet';
import AramaKutusu from '../components/AramaKutusu';
import Sayfalama from '../components/Sayfalama';
import OnayPenceresi from '../components/OnayPenceresi';
import KuponKullanimlariModal from '../components/KuponKullanimlariModal';

import './KuponlarSayfasi.css';

// ⭐ YENİ (4.7) — emoji yerine çizgi ikon. Gerekçe PanelDuzeni'nde.
import { Copy, Pause, Pencil, Play, Plus, Tag, Trash2 } from 'lucide-react';

// Durum filtresi seçenekleri.
//
// Neden bileşenin DIŞINDA sabit olarak duruyor?
//   İçeride tanımlasaydık her render'da yeni bir dizi üretilirdi.
//   Değişmeyen veri bileşen dışında durur — hem performans hem okunurluk.
//
// ⚠️ Buradaki 'deger' değerleri backend'in DurumHesapla metodunun
//    döndürdüğü metinlerle BİREBİR aynı olmak zorunda.
const DURUM_SECENEKLERI = [
  { deger: '',              yazi: 'Tüm durumlar' },
  { deger: 'aktif',         yazi: 'Aktif' },
  { deger: 'baslamadi',     yazi: 'Başlamadı' },
  { deger: 'tukendi',       yazi: 'Tükendi' },
  { deger: 'suresi_dolmus', yazi: 'Süresi doldu' },
  { deger: 'pasif',         yazi: 'Pasif' },
];

export default function KuponlarSayfasi() {
  const navigate = useNavigate();

  const [kuponlar, setKuponlar] = useState([]);
  const [sayfaBilgi, setSayfaBilgi] = useState({ toplam: 0, toplamSayfa: 1 });

  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState('');

  const [arama, setArama] = useState('');
  const [durumFiltre, setDurumFiltre] = useState('');

  const [sayfa, setSayfa] = useState(1);
  const [sayfaBoyutu, setSayfaBoyutu] = useState(10);

  // Hangi kuponun aktif/pasif işlemi sürüyor?
  // Sadece o satırın butonunu kilitlemek için — tüm tabloyu değil.
  const [islemdekiId, setIslemdekiId] = useState(null);

  // Silme onay penceresi için: silinecek kupon nesnesi (null = kapalı)
  const [silinecek, setSilinecek] = useState(null);
  const [siliniyor, setSiliniyor] = useState(false);

  // Kullanımlar penceresi için: gösterilecek kupon (null = kapalı)
  const [kullanimlariGosterilen, setKullanimlariGosterilen] = useState(null);


  // ================= VERİ ÇEKME =================

  async function kuponlariGetir() {
    setYukleniyor(true);
    setHata('');

    try {
      // URLSearchParams: elle string birleştirmek yerine bunu kullanıyoruz
      // çünkü özel karakterleri (boşluk, &, = gibi) otomatik kodluyor.
      // "ARA & KAZAN" gibi bir kupon kodu elle birleştirmede sorguyu bozardı.
      const p = new URLSearchParams();

      if (arama.trim() !== '') {
        p.append('search', arama.trim());
      }

      if (durumFiltre !== '') {
        p.append('durum', durumFiltre);
      }

      p.append('page', sayfa);
      p.append('pageSize', sayfaBoyutu);

      const veri = await apiGet('/admin/coupons?' + p.toString());

      setKuponlar(veri.kuponlar);
      setSayfaBilgi({ toplam: veri.toplam, toplamSayfa: veri.toplamSayfa });
    } catch (e) {
      setHata(e.message);
    } finally {
      // finally: hata olsa da olmasa da çalışır.
      // Buraya koymazsak hata durumunda spinner sonsuza kadar döner.
      setYukleniyor(false);
    }
  }

  // DEBOUNCE — kullanıcı yazmayı bırakalı 400ms geçtiyse iste.
  //
  // Olmasaydı "KAMPANYA" yazarken 8 harf = 8 ayrı HTTP isteği giderdi.
  // Üstelik cevaplar sırasız dönerse ekranda yanlış sonuç kalabilirdi.
  //
  // return () => clearTimeout(...) kısmı ÇOK önemli: React bir sonraki
  // effect'i çalıştırmadan önce bunu çağırır, yani bekleyen zamanlayıcı
  // iptal edilir. Bu olmadan debounce hiç çalışmaz, sadece gecikme olur.
  useEffect(() => {
    const sayac = setTimeout(() => {
      kuponlariGetir();
    }, 400);

    return () => clearTimeout(sayac);
  }, [arama, durumFiltre, sayfa, sayfaBoyutu]);

  // Filtre değişince 1. sayfaya dön.
  //
  // Neden ayrı bir useEffect? Senaryo: 5. sayfadasın, arama yazıyorsun,
  // sonuç 2 sayfa. Sayfa hâlâ 5 olduğu için backend boş liste döner ve
  // "sonuç yok" sanırsın. Filtre değişimi = yeni sonuç kümesi = baştan.
  //
  // ⚠️ Bağımlılık listesinde 'sayfa' YOK — olsaydı sayfa değiştirdiğin
  //    anda tekrar 1'e dönerdi ve sayfalama hiç çalışmazdı.
  useEffect(() => {
    setSayfa(1);
  }, [arama, durumFiltre, sayfaBoyutu]);


  // ================= İŞLEMLER =================

  // Aktif ↔ Pasif
  async function durumDegistir(kupon) {
    setIslemdekiId(kupon.id);

    try {
      await apiPut('/admin/coupons/' + kupon.id + '/durum', {
        isActive: !kupon.isActive,
      });

      // ⚠️ Neden listeyi yeniden çekiyoruz da yerelde güncellemiyoruz?
      //
      //   Çünkü 'durum' alanını BACKEND hesaplıyor. Burada sadece
      //   isActive'i false yapsaydık, satırdaki rozet hâlâ "Aktif"
      //   yazardı — isActive ile durum tutarsız kalırdı.
      //
      //   Sunucuda türetilen değerin bedeli budur: yerel değişiklik
      //   yapamazsın, yeniden sormak zorundasın.
      //
      //   Alternatif: durumu ön yüzde hesaplamak. Onu seçmedik çünkü
      //   o zaman aynı mantık hem C#'ta hem JS'te yaşardı ve biri
      //   güncellenip diğeri unutulurdu.
      await kuponlariGetir();
    } catch (e) {
      setHata(e.message);
    } finally {
      setIslemdekiId(null);
    }
  }

  async function silmeyiOnayla() {
    setSiliniyor(true);

    try {
      await apiDelete('/admin/coupons/' + silinecek.id);
      setSilinecek(null);
      await kuponlariGetir();
    } catch (e) {
      // Backend "bu kupon kullanılmış, silinemez" derse mesajı gösteriyoruz.
      // Ön yüz butonu gizliyor ama asıl kilit backend'de — biri butonu
      // devtools'tan görünür yapsa bile kapı kilitli.
      setHata(e.message);
      setSilinecek(null);
    } finally {
      setSiliniyor(false);
    }
  }


  // ================= GÖSTERİM YARDIMCILARI =================

  // "%10 (en fazla 150 ₺)" veya "50,00 ₺"
  function indirimHucresi(k) {
    if (k.discountType === 'yuzde') {
      return (
        <div>
          <b>%{k.discountValue}</b>

          {/* != null → hem null hem undefined'ı yakalar.
              !== null yazsaydık undefined geçerdi.
              Burada 0 zaten geçerli bir tavan değil, o yüzden
              ?? yerine != null kontrolü yeterli. */}
          {k.maxDiscountAmount != null && (
            <div className="kupon-alt-bilgi">
              en fazla {paraBicimle(k.maxDiscountAmount)}
            </div>
          )}
        </div>
      );
    }

    return <b>{paraBicimle(k.discountValue)}</b>;
  }


  // ================= TABLO SÜTUNLARI =================

  const sutunlar = [
    {
      baslik: 'Kod',
      hucre: (k) => (
        <div>
          <div className="kupon-kod">{k.code}</div>

          <div className="kupon-alt-bilgi">
            {/* Kategori boşsa kupon her üründe geçerli demektir */}
            {k.kategoriAdi ? <><Tag size={13} /> {k.kategoriAdi}</> : 'Tüm ürünler'}
          </div>
        </div>
      ),
    },
    {
      baslik: 'Açıklama',
      hucre: (k) => k.description,
    },
    {
      baslik: 'İndirim',
      hizala: 'sag',
      hucre: indirimHucresi,
    },
    {
      baslik: 'Alt Sınır',
      hizala: 'sag',
      hucre: (k) =>
        k.minOrderAmount > 0 ? (
          paraBicimle(k.minOrderAmount)
        ) : (
          <span style={{ color: 'var(--yaziGri)' }}>—</span>
        ),
    },
    {
      baslik: 'Geçerlilik',
      hucre: (k) => (
        <div>
          <div>{gunBicimle(k.startsAt)}</div>
          <div className="kupon-alt-bilgi">↓ {gunBicimle(k.endsAt)}</div>
        </div>
      ),
    },
    {
      baslik: 'Kullanım',
      hizala: 'orta',
      hucre: (k) => (
        <div>
          <b>{sayiBicimle(k.usedCount)}</b>

          <span className="kupon-limit">
            {/* Limit yoksa sonsuz işareti — "0" yazmak yanıltıcı olurdu */}
            {k.usageLimit == null ? ' / ∞' : ' / ' + sayiBicimle(k.usageLimit)}
          </span>

          <div className="kupon-alt-bilgi">
            kişi başı {k.usageLimitPerUser}
          </div>
        </div>
      ),
    },
    {
      baslik: 'Durum',
      hizala: 'orta',
      hucre: (k) => <Rozet durum={k.durum} />,
    },
    {
      baslik: 'İşlemler',
      hizala: 'sag',
      hucre: (k) => (
        <div className="kupon-islemler">
          <Buton
            tip="ikincil"
            boyut="kucuk"
            ikonRengi="ana"
            onClick={() => navigate('/kuponlar/' + k.id + '/duzenle')}
          >
            <Pencil size={15} />
          </Buton>

          <Buton
            tip="ikincil"
            boyut="kucuk"
            ikonRengi="ana"
            onClick={() => setKullanimlariGosterilen(k)}
            title="Kullanımları gör"
          >
            <Copy size={15} />
          </Buton>

          <Buton
            tip="ikincil"
            boyut="kucuk"
            // Aktif kuponu duraklatmak olumsuz (turuncu), duraklatılmışı
            // yeniden başlatmak olumlu (yeşil).
            ikonRengi={k.isActive ? 'uyari' : 'basari'}
            onClick={() => durumDegistir(k)}
            disabled={islemdekiId === k.id}
            title={k.isActive ? 'Pasifleştir' : 'Aktifleştir'}
          >
            {/* Türetilmiş metin — ayrı state tutmuyoruz, isActive'den okuyoruz */}
            {islemdekiId === k.id ? '...' : k.isActive ? <Pause size={15} /> : <Play size={15} />}
          </Buton>

          {/* SİL butonu SADECE hiç kullanılmamış kuponlarda görünür.
              Bu ÖN YÜZ katmanı — kullanıcıyı yanlış işlemden korur.
              Asıl kilit backend'deki DELETE endpoint'inde:
              o da CouponUsages'a bakıp reddediyor.
              Üç katmanlı yetkinin küçük ölçekli hali. */}
          {k.usedCount === 0 && (
            <Buton
              tip="tehlike"
              boyut="kucuk"
              onClick={() => setSilinecek(k)}
              title="Sil"
            >
              <Trash2 size={15} />
            </Buton>
          )}
        </div>
      ),
    },
  ];


  // ================= EKRAN =================

  return (
    <div>
      <div className="kupon-ust">
        <div>
          <h1 className="sayfa-baslik">Kuponlar</h1>

          <p className="sayfa-altyazi" style={{ marginBottom: 0 }}>
            İndirim kuponlarını oluştur, düzenle ve kullanımlarını izle
          </p>
        </div>

        <Buton onClick={() => navigate('/kuponlar/yeni')}>
          <Plus size={15} /> Yeni Kupon
        </Buton>
      </div>

      <div className="kupon-filtreler">
        <AramaKutusu
          deger={arama}
          degistir={setArama}
          ipucu="Kod veya açıklamada ara..."
        />

        <select
          className="kupon-secim"
          value={durumFiltre}
          onChange={(e) => setDurumFiltre(e.target.value)}
        >
          {DURUM_SECENEKLERI.map((s) => (
            <option key={s.deger} value={s.deger}>
              {s.yazi}
            </option>
          ))}
        </select>
      </div>

      {hata !== '' && <HataKutusu mesaj={hata} tekrarDene={kuponlariGetir} />}

      {yukleniyor ? (
        <Yukleniyor yazi="Kuponlar getiriliyor..." />
      ) : (
        <>
          <Tablo
            sutunlar={sutunlar}
            veriler={kuponlar}
            anahtar={(k) => k.id}
            bosMesaj={
              arama !== '' || durumFiltre !== ''
                ? 'Bu filtreye uyan kupon yok.'
                : 'Henüz kupon oluşturulmamış. Sağ üstten ekleyebilirsin.'
            }
          />

          <Sayfalama
            sayfa={sayfa}
            toplamSayfa={sayfaBilgi.toplamSayfa}
            toplam={sayfaBilgi.toplam}
            sayfaBoyutu={sayfaBoyutu}
            sayfaDegistir={setSayfa}
            boyutDegistir={setSayfaBoyutu}
          />
        </>
      )}

      <OnayPenceresi
        acik={silinecek !== null}
        baslik="Kuponu sil"
        mesaj={
          silinecek
            ? `"${silinecek.code}" kuponunu silmek üzeresin. Bu işlem geri alınamaz. ` +
              `Kuponu tamamen silmek yerine pasifleştirebilirsin de.`
            : ''
        }
        onayla={silmeyiOnayla}
        iptal={() => setSilinecek(null)}
        islemde={siliniyor}
      />

      <KuponKullanimlariModal
        kupon={kullanimlariGosterilen}
        kapat={() => setKullanimlariGosterilen(null)}
      />
    </div>
  );
}