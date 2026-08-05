import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// ⭐ apiPut eklendi — durum aç/kapa endpoint'i için
import { apiGet, apiDelete, apiPut } from '../services/api';
import { paraBicimle, sayiBicimle } from '../utils/bicimlendir';
import { resimUrl } from '../utils/resim';

import Yukleniyor from '../components/Yukleniyor';
import HataKutusu from '../components/HataKutusu';
import Tablo from '../components/Tablo';
import Buton from '../components/Buton';
import Rozet from '../components/Rozet';          // ⭐ YENİ — durum rozeti
import AramaKutusu from '../components/AramaKutusu';
import OnayPenceresi from '../components/OnayPenceresi';

import ExcelIceAktar from '../components/ExcelIceAktar';

import './UrunlerSayfasi.css';

export default function UrunlerSayfasi() {
  const navigate = useNavigate();

  const [urunler, setUrunler] = useState([]);
  const [kategoriler, setKategoriler] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState('');

  const [arama, setArama] = useState('');
  const [kategoriId, setKategoriId] = useState('');
  const [siralama, setSiralama] = useState('ad');
  // ⭐ YENİ — mağaza ayarları (stok eşiği için).
  //
  // Başlangıç değeri null, 5 DEĞİL.
  //
  // Neden? 5 koysaydık ayarlar yüklenene kadar sayfa 5'e göre
  // boyar, sonra ayar gelince renkler değişirdi. Kullanıcı
  // gözünün önünde değişen bir arayüz görürdü — "acaba yanlış mı
  // gördüm?" dedirten türden. null iken vurgulama yapmıyoruz.
  const [stokEsigi, setStokEsigi] = useState(null);
  // ⭐ YENİ — durum filtresi.
  // '' = hepsi, 'true' = sadece satıştakiler, 'false' = sadece kaldırılanlar.
  //
  // Neden boolean değil de STRING tutuyoruz?
  // Bu değer doğrudan bir <select>'in value'su. HTML'de select değerleri
  // her zaman string'tir; boolean tutsaydık her okuma ve yazmada
  // dönüştürme yapmak zorunda kalırdık. Ayrıca üç durumumuz var
  // (hepsi / aktif / pasif) ve boolean bunu karşılamıyor.
  const [durumFiltre, setDurumFiltre] = useState('');

  const [silinecek, setSilinecek] = useState(null);
  const [siliniyor, setSiliniyor] = useState(false);

  // ⭐ YENİ — şu an durumu değiştirilen ürünün id'si (yoksa null).
  //
  // Neden ayrı bir "yukleniyor" boolean'ı değil?
  // Sayfada 40 ürün var; hangi satırın butonunun kilitleneceğini
  // bilmemiz lazım. Boolean tutsaydık istek atılınca 40 butonun HEPSİ
  // kilitlenirdi. id tutunca sadece ilgili satır etkileniyor.
  const [durumDegisen, setDurumDegisen] = useState(null);

  // Excel içe aktarma modalı açık mı?
  const [iceAktarAcik, setIceAktarAcik] = useState(false);

  // Kategorileri bir kez çek
  useEffect(() => {
    apiGet('/categories')
      .then(setKategoriler)
      .catch(() => setKategoriler([]));
  }, []);

  // ⭐ YENİ — mağaza ayarlarını bir kez çek.
  //
  // Bağımlılık dizisi BOŞ: ayarlar sayfa açıkken değişmez.
  // Her ürün listesi yenilemesinde tekrar çekmenin anlamı yok.
  useEffect(() => {
    let iptal = false;

    async function ayarlariGetir() {
      try {
        const veri = await apiGet('/ayarlar/yonetim');

        if (!iptal) {
          setStokEsigi(veri.stokAzEsigi);
        }
      } catch {
        // ⚠️ SESSİZCE GEÇİYORUZ — bilinçli.
        //
        // Bu bir GÖRSEL VURGU ayarı. Alınamazsa stok sayıları
        // renksiz görünür, o kadar. Sayfanın asıl işi (ürün
        // listesi) etkilenmiyor.
        //
        // Kırmızı bir hata kutusu göstermek, aslında çalışan bir
        // sayfada "bir şeyler bozuk" izlenimi yaratırdı.
      }
    }

    ayarlariGetir();

    return () => {
      iptal = true;
    };
  }, []);

  // Ürünleri çek (arama + kategori + durum filtresi backend'de)
  async function urunleriGetir() {
    setYukleniyor(true);
    setHata('');

    try {
      const parametreler = new URLSearchParams();

      if (arama.trim() !== '') {
        parametreler.append('search', arama.trim());
      }

      if (kategoriId !== '') {
        parametreler.append('categoryId', kategoriId);
      }

      // ⭐ YENİ — durum filtresi.
      //
      // Boş bırakırsak parametreyi HİÇ göndermiyoruz. Backend'de
      // "aktif" parametresi bool? (nullable) — gelmezse admin tüm
      // ürünleri görüyor. "aktif=" gibi boş bir değer göndermek
      // model binding hatası üretirdi.
      if (durumFiltre !== '') {
        parametreler.append('aktif', durumFiltre);
      }

      const sorgu = parametreler.toString();
      const yol = sorgu === '' ? '/products' : '/products?' + sorgu;

      const veri = await apiGet(yol);
      setUrunler(veri);
    } catch (e) {
      setHata(e.message);
    } finally {
      setYukleniyor(false);
    }
  }

  // Debounce: kullanıcı yazmayı bırakalı 400ms geçtiyse iste.
  //
  // ⭐ durumFiltre bağımlılık dizisine eklendi — eklemeseydik filtreyi
  // değiştirince liste yenilenmezdi. React bağımlılık dizisinde olmayan
  // bir değer değişince effect'i tekrar çalıştırmaz.
  useEffect(() => {
    const sayac = setTimeout(() => {
      urunleriGetir();
    }, 400);

    return () => clearTimeout(sayac);
  }, [arama, kategoriId, durumFiltre]);

  async function silmeyiOnayla() {
    setSiliniyor(true);

    try {
      await apiDelete('/products/' + silinecek.id);
      setUrunler(urunler.filter((u) => u.id !== silinecek.id));
      setSilinecek(null);
    } catch (e) {
      setHata(e.message);
      setSilinecek(null);
    } finally {
      setSiliniyor(false);
    }
  }

  // ⭐ YENİ — ürünü satışa aç / satıştan kaldır
  async function durumDegistir(urun) {
    setDurumDegisen(urun.id);
    setHata('');

    try {
      // Yeni durum = mevcut durumun tersi.
      // Tersini İSTEMCİDE hesaplayıp gönderiyoruz ama sunucuya
      // "tersine çevir" demiyoruz — açıkça true/false gönderiyoruz.
      // Böylece iki admin aynı anda basarsa sonuç belirsiz kalmıyor:
      // ikisi de aynı hedef değeri gönderiyorsa sonuç aynı, farklı
      // gönderiyorsa son yazan kazanıyor. "Tersine çevir" deseydik
      // iki istek üst üste gelince ürün başladığı yere dönerdi.
      const cevap = await apiPut('/products/' + urun.id + '/durum', {
        isActive: !urun.isActive,
      });

      // Listeyi baştan çekmiyoruz — sadece o satırı güncelliyoruz.
      // Tüm listeyi yenilemek 40 ürünü tekrar indirmek ve tablonun
      // gözle görülür şekilde titremesi demek olurdu.
      //
      // Yeni değeri kendi hesabımızdan değil SUNUCUNUN CEVABINDAN
      // alıyoruz (cevap.isActive). Sunucu son sözü söyleyen taraf.
      setUrunler((oncekiler) =>
        oncekiler.map((u) =>
          u.id === urun.id ? { ...u, isActive: cevap.isActive } : u
        )
      );
    } catch (e) {
      setHata(e.message);
    } finally {
      setDurumDegisen(null);
    }
  }

  // Bir ürünün kârını hesapla. Maliyeti yoksa (eski ürün) null döner.
  function urunKari(u) {
    if (u.cost == null) {
      return null;
    }
    return u.price - u.cost;
  }

  // Sıralama tarayıcıda (veri zaten elimizde)
  const siraliUrunler = [...urunler].sort((a, b) => {
    if (siralama === 'ad')          return a.name.localeCompare(b.name, 'tr');
    if (siralama === 'fiyatArtan')  return a.price - b.price;
    if (siralama === 'fiyatAzalan') return b.price - a.price;
    if (siralama === 'stokArtan')   return a.stock - b.stock;

    if (siralama === 'karAzalan') {
      // Maliyeti olmayan ürünler en dibe insin (-Infinity)
      const ka = a.cost != null ? a.price - a.cost : -Infinity;
      const kb = b.cost != null ? b.price - b.cost : -Infinity;
      return kb - ka;
    }

    return 0;
  });

  function kategoriAdi(id) {
    const kategori = kategoriler.find((k) => k.id === id);
    return kategori ? kategori.name : '—';
  }

  const sutunlar = [
    {
      baslik: '',
      hucre: (u) =>
        u.mainImageUrl ? (
          <img className="satir-resim" src={resimUrl(u.mainImageUrl)} alt="" />
        ) : (
          <div className="satir-resim-yok">📷</div>
        ),
    },
    {
      baslik: 'Barkod',
      hucre: (u) => (
        <span style={{ fontFamily: 'monospace', color: 'var(--yaziOrta)' }}>
          {u.barcode || '—'}
        </span>
      ),
    },
    {
      baslik: 'Ürün Adı',
      hucre: (u) => (
        <div>
          <b>{u.name}</b>

          {u.images.length > 1 && (
            <div style={{ fontSize: 12, color: 'var(--yaziGri)', marginTop: 2 }}>
              {u.images.length} resim
            </div>
          )}
        </div>
      ),
    },
    {
      // ⭐ YENİ — satış durumu.
      //
      // Neden ayrı bir kolon? Rengi soluk satırdan da anlaşılıyor ama
      // renk tek başına bilgi taşımamalı: renk körü bir kullanıcı ya da
      // ekranı parlak ışıkta bakan biri farkı göremez. Yazıyla da
      // söylemek erişilebilirliğin temel kuralı.
      baslik: 'Durum',
      hucre: (u) => <Rozet durum={u.isActive ? 'aktif' : 'pasif'} />,
    },
    {
      baslik: 'Kategori',
      hucre: (u) => kategoriAdi(u.categoryId),
    },
    {
      baslik: 'Fiyat',
      hizala: 'sag',
      hucre: (u) => paraBicimle(u.price),
    },
    {
      baslik: 'Kâr',
      hizala: 'sag',
      hucre: (u) => {
        const kar = urunKari(u);

        // Maliyeti girilmemiş eski ürün → çizgi
        if (kar == null) {
          return <span style={{ color: 'var(--yaziGri)' }}>—</span>;
        }

        const marj = u.price > 0 ? (kar / u.price) * 100 : 0;
        const renk =
          kar > 0 ? 'var(--basari)' : kar < 0 ? 'var(--hata)' : 'var(--yaziGri)';

        return (
          <div>
            <b style={{ color: renk }}>{paraBicimle(kar)}</b>
            <div style={{ fontSize: 12, color: 'var(--yaziGri)', marginTop: 2 }}>
              %{marj.toFixed(1)}
            </div>
          </div>
        );
      },
    },
    {
      baslik: 'Stok',
      hizala: 'sag',
      hucre: (u) => {
        if (u.stock === 0) {
          return <span className="stok-yok">TÜKENDİ</span>;
        }

        // ⚠️ stokEsigi !== null kontrolü ŞART.
        //
        // Ayarlar henüz gelmediyse (veya hata aldıysa) hiçbir şeyi
        // "az" diye boyamıyoruz. null ile karşılaştırma yapsaydık
        // JavaScript'te "u.stock < null" ifadesi null'ı 0'a
        // çevirirdi ve HİÇBİR ürün az görünmezdi — sessiz hata.
        //
        // Bu, "=== false" kuralının akrabası: eksik veriyi
        // varsayılan bir değermiş gibi davranmıyoruz.
        if (stokEsigi !== null && u.stock < stokEsigi) {
          return (
            <span
              className="stok-az"
              title={'Stok az (eşik: ' + stokEsigi + ')'}
            >
              {sayiBicimle(u.stock)}
            </span>
          );
        }

        return sayiBicimle(u.stock);
      },
    },
    {
      baslik: 'İşlemler',
      hizala: 'sag',
      hucre: (u) => (
        <div className="islem-butonlari">
          {/* ⭐ YENİ — satışa aç / satıştan kaldır */}
          <Buton
            tip="ikincil"
            boyut="kucuk"
            onClick={() => durumDegistir(u)}
            disabled={durumDegisen === u.id}
            title={
              u.isActive
                ? 'Müşteri artık bu ürünü göremez ve sipariş edemez'
                : 'Ürün tekrar satışa açılır'
            }
          >
            {durumDegisen === u.id
              ? '...'
              : u.isActive
                ? '🚫 Satıştan Kaldır'
                : '✅ Satışa Aç'}
          </Buton>

          <Buton
            tip="ikincil"
            boyut="kucuk"
            onClick={() => navigate('/urunler/' + u.id + '/duzenle')}
          >
            ✏️ Düzenle
          </Buton>

          <Buton tip="tehlike" boyut="kucuk" onClick={() => setSilinecek(u)}>
            🗑️ Sil
          </Buton>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="sayfa-ust">
        <div>
          <h1 className="sayfa-baslik">Ürünler</h1>
          <p className="sayfa-altyazi" style={{ marginBottom: 0 }}>
            Ürünleri görüntüle, düzenle veya sil
          </p>
        </div>

        <div className="sayfa-ust-butonlar">
          <Buton tip="ikincil" onClick={() => setIceAktarAcik(true)}>
            📥 Excel ile İçe Aktar
          </Buton>

          <Buton onClick={() => navigate('/urunler/yeni')}>➕ Yeni Ürün</Buton>
        </div>
      </div>

      <div className="filtre-cubugu">
        <AramaKutusu
          deger={arama}
          degistir={setArama}
          ipucu="Ürün adında ara..."
        />

        <select
          className="filtre-secim"
          value={kategoriId}
          onChange={(e) => setKategoriId(e.target.value)}
        >
          <option value="">Tüm kategoriler</option>

          {kategoriler.map((k) => (
            <option key={k.id} value={k.id}>
              {k.name}
            </option>
          ))}
        </select>

        {/* ⭐ YENİ — durum filtresi */}
        <select
          className="filtre-secim"
          value={durumFiltre}
          onChange={(e) => setDurumFiltre(e.target.value)}
        >
          <option value="">Tüm durumlar</option>
          <option value="true">Sadece satıştakiler</option>
          <option value="false">Sadece satıştan kaldırılanlar</option>
        </select>

        <select
          className="filtre-secim"
          value={siralama}
          onChange={(e) => setSiralama(e.target.value)}
        >
          <option value="ad">İsme göre (A-Z)</option>
          <option value="fiyatArtan">Fiyat (artan)</option>
          <option value="fiyatAzalan">Fiyat (azalan)</option>
          <option value="karAzalan">Kâr (çoktan aza)</option>
          <option value="stokArtan">Stok (azdan çoğa)</option>
        </select>
      </div>

      {hata !== '' && <HataKutusu mesaj={hata} tekrarDene={urunleriGetir} />}

      {yukleniyor ? (
        <Yukleniyor yazi="Ürünler getiriliyor..." />
      ) : (
        <>
          <Tablo
            sutunlar={sutunlar}
            veriler={siraliUrunler}
            anahtar={(u) => u.id}
            // ⭐ YENİ — pasif ürünün satırı soluk çizilsin
            satirSinifi={(u) => (u.isActive ? '' : 'satir-pasif')}
            bosMesaj={
              arama !== '' || kategoriId !== '' || durumFiltre !== ''
                ? 'Bu filtreye uyan ürün yok.'
                : 'Henüz ürün eklenmemiş.'
            }
          />

          <p className="sonuc-sayisi">
            Toplam {sayiBicimle(siraliUrunler.length)} ürün listeleniyor.
          </p>
        </>
      )}

      <OnayPenceresi
        acik={silinecek !== null}
        baslik="Ürünü sil"
        mesaj={
          silinecek
            ? `"${silinecek.name}" ürününü ve tüm resimlerini silmek üzeresin. Bu işlem geri alınamaz. Ürünü geçici olarak satıştan kaldırmak istiyorsan "Satıştan Kaldır" butonunu kullan.`
            : ''
        }
        onayla={silmeyiOnayla}
        iptal={() => setSilinecek(null)}
        islemde={siliniyor}
      />

      <ExcelIceAktar
        acik={iceAktarAcik}
        kapat={() => setIceAktarAcik(false)}
        iceAktarimBitti={urunleriGetir}
      />

    </div>
  );
}