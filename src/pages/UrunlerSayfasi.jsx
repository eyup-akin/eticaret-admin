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

  // Sıralama tarayıcıda (veri zaten elimizde)
  const siraliUrunler = [...urunler].sort((a, b) => {
    if (siralama === 'ad')          return a.name.localeCompare(b.name, 'tr');
    if (siralama === 'fiyatArtan')  return a.price - b.price;
    if (siralama === 'fiyatAzalan') return b.price - a.price;
    if (siralama === 'stokArtan')   return a.stock - b.stock;
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
      baslik: '#',
      hucre: (u) => <span style={{ color: 'var(--yaziGri)' }}>{u.id}</span>,
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

        <Buton onClick={() => navigate('/urunler/yeni')}>➕ Yeni Ürün</Buton>
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
    </div>
  );
}