import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { apiGet, apiDelete } from '../services/api';
import { paraBicimle, sayiBicimle } from '../utils/bicimlendir';
import { resimUrl } from '../utils/resim';

import Yukleniyor from '../components/Yukleniyor';
import HataKutusu from '../components/HataKutusu';
import Tablo from '../components/Tablo';
import Buton from '../components/Buton';
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

  const [silinecek, setSilinecek] = useState(null);
  const [siliniyor, setSiliniyor] = useState(false);


  // Excel içe aktarma modalı açık mı?
  const [iceAktarAcik, setIceAktarAcik] = useState(false);


  // Kategorileri bir kez çek
  useEffect(() => {
    apiGet('/categories')
      .then(setKategoriler)
      .catch(() => setKategoriler([]));
  }, []);

  // Ürünleri çek (arama + kategori filtresi backend'de)
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

  // Debounce: kullanıcı yazmayı bırakalı 400ms geçtiyse iste
  useEffect(() => {
    const sayac = setTimeout(() => {
      urunleriGetir();
    }, 400);

    return () => clearTimeout(sayac);
  }, [arama, kategoriId]);

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
      // ⭐ DEĞİŞTİ — eski "#" (id) yerine artık barkod
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
      baslik: 'Kategori',
      hucre: (u) => kategoriAdi(u.categoryId),
    },
    {
      baslik: 'Fiyat',
      hizala: 'sag',
      hucre: (u) => paraBicimle(u.price),
    },
    {
      // ⭐ YENİ — kâr sütunu (fiyat − maliyet), marjı altında küçük yazı
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

        if (u.stock < 5) {
          return <span className="stok-az">{sayiBicimle(u.stock)}</span>;
        }

        return sayiBicimle(u.stock);
      },
    },
    {
      baslik: 'İşlemler',
      hizala: 'sag',
      hucre: (u) => (
        <div className="islem-butonlari">
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
            bosMesaj={
              arama !== '' || kategoriId !== ''
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
            ? `"${silinecek.name}" ürününü ve tüm resimlerini silmek üzeresin. Bu işlem geri alınamaz.`
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