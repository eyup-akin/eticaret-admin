import { useEffect, useState } from 'react';

import { apiGet, apiPost, apiPut, apiDelete } from '../services/api';
import { sayiBicimle } from '../utils/bicimlendir';

import Yukleniyor from '../components/Yukleniyor';
import HataKutusu from '../components/HataKutusu';
import Tablo from '../components/Tablo';
import Buton from '../components/Buton';
import OnayPenceresi from '../components/OnayPenceresi';

import './KategorilerSayfasi.css';

export default function KategorilerSayfasi() {
  const [kategoriler, setKategoriler] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState('');

  // --- YENİ KATEGORİ EKLEME ---
  const [yeniAd, setYeniAd] = useState('');
  const [ekleniyor, setEkleniyor] = useState(false);

  // --- SATIR İÇİ DÜZENLEME ---
  // Hangi satır düzenleme modunda? (id) — hiçbiri ise null
  const [duzenlenenId, setDuzenlenenId] = useState(null);
  const [duzenlenenAd, setDuzenlenenAd] = useState('');
  const [kaydediliyor, setKaydediliyor] = useState(false);

  // --- SİLME ---
  const [silinecek, setSilinecek] = useState(null);
  const [siliniyor, setSiliniyor] = useState(false);

  // ==========================================================
  //  VERİ ÇEKME
  // ==========================================================
  async function kategorileriGetir() {
    setYukleniyor(true);
    setHata('');

    try {
      const veri = await apiGet('/categories');
      setKategoriler(veri);
    } catch (e) {
      setHata(e.message);
    } finally {
      setYukleniyor(false);
    }
  }

  useEffect(() => {
    kategorileriGetir();
  }, []);

  // ==========================================================
  //  EKLEME
  // ==========================================================
  async function kategoriEkle(e) {
    e.preventDefault();

    const ad = yeniAd.trim();

    if (ad === '') {
      return;
    }

    setEkleniyor(true);
    setHata('');

    try {
      await apiPost('/categories', { name: ad });

      setYeniAd('');
      await kategorileriGetir(); // listeyi tazele
    } catch (e) {
      setHata(e.message);
    } finally {
      setEkleniyor(false);
    }
  }

  // ==========================================================
  //  SATIR İÇİ DÜZENLEME
  // ==========================================================
  function duzenlemeyeBasla(kategori) {
    setDuzenlenenId(kategori.id);
    setDuzenlenenAd(kategori.name);
    setHata('');
  }

  function duzenlemeyiIptalEt() {
    setDuzenlenenId(null);
    setDuzenlenenAd('');
  }

  async function duzenlemeyiKaydet() {
    const ad = duzenlenenAd.trim();

    if (ad === '') {
      return;
    }

    setKaydediliyor(true);
    setHata('');

    try {
      await apiPut('/categories/' + duzenlenenId, { name: ad });

      // Sunucuya tekrar gitmeye gerek yok — listeyi yerelde güncelle.
      // Sadece isim değişti, ürün sayısı zaten aynı.
      setKategoriler(
        kategoriler.map((k) =>
          k.id === duzenlenenId ? { ...k, name: ad } : k
        )
      );

      duzenlemeyiIptalEt();
    } catch (e) {
      setHata(e.message);
    } finally {
      setKaydediliyor(false);
    }
  }

  // Klavye kısayolları: Enter = kaydet, Esc = vazgeç
  function tusaBasildi(e) {
    if (e.key === 'Enter') {
      duzenlemeyiKaydet();
    }

    if (e.key === 'Escape') {
      duzenlemeyiIptalEt();
    }
  }

  // ==========================================================
  //  SİLME
  // ==========================================================
  async function silmeyiOnayla() {
    setSiliniyor(true);
    setHata('');

    try {
      await apiDelete('/categories/' + silinecek.id);

      setKategoriler(kategoriler.filter((k) => k.id !== silinecek.id));
      setSilinecek(null);
    } catch (e) {
      // Backend "içinde ürün var" diyorsa mesajı burada gösteriyoruz
      setHata(e.message);
      setSilinecek(null);
    } finally {
      setSiliniyor(false);
    }
  }

  // ==========================================================
  //  TABLO SÜTUNLARI
  // ==========================================================
  const sutunlar = [
    {
      baslik: '#',
      hucre: (k) => <span style={{ color: 'var(--yaziGri)' }}>{k.id}</span>,
    },
    {
      baslik: 'Kategori Adı',
      hucre: (k) => {
        // Bu satır düzenleme modundaysa input göster, değilse düz metin
        if (duzenlenenId === k.id) {
          return (
            <input
              className="satir-input"
              type="text"
              value={duzenlenenAd}
              onChange={(e) => setDuzenlenenAd(e.target.value)}
              onKeyDown={tusaBasildi}
              autoFocus
              maxLength={100}
            />
          );
        }

        return <b>{k.name}</b>;
      },
    },
    {
      baslik: 'Ürün Sayısı',
      hizala: 'orta',
      hucre: (k) => (
        <span
          className={
            'urun-sayisi' + (k.productCount === 0 ? ' urun-sayisi-bos' : '')
          }
        >
          {sayiBicimle(k.productCount)} ürün
        </span>
      ),
    },
    {
      baslik: 'İşlemler',
      hizala: 'sag',
      hucre: (k) => {
        // DÜZENLEME MODU → Kaydet / Vazgeç
        if (duzenlenenId === k.id) {
          return (
            <div className="islem-butonlari">
              <Buton
                boyut="kucuk"
                onClick={duzenlemeyiKaydet}
                disabled={kaydediliyor}
              >
                {kaydediliyor ? 'Kaydediliyor...' : '✓ Kaydet'}
              </Buton>

              <Buton
                tip="ikincil"
                boyut="kucuk"
                onClick={duzenlemeyiIptalEt}
                disabled={kaydediliyor}
              >
                Vazgeç
              </Buton>
            </div>
          );
        }

        // NORMAL MOD → Düzenle / Sil
        return (
          <div className="islem-butonlari">
            <Buton
              tip="ikincil"
              boyut="kucuk"
              onClick={() => duzenlemeyeBasla(k)}
            >
              ✏️ Düzenle
            </Buton>

            <Buton
              tip="tehlike"
              boyut="kucuk"
              onClick={() => setSilinecek(k)}
              // İçinde ürün varsa buton kapalı — kullanıcıyı boşuna uğraştırma
              disabled={k.productCount > 0}
              title={
                k.productCount > 0
                  ? 'Bu kategoride ürün var, silinemez'
                  : 'Kategoriyi sil'
              }
            >
              🗑️ Sil
            </Buton>
          </div>
        );
      },
    },
  ];

  return (
    <div>
      <div className="sayfa-ust">
        <div>
          <h1 className="sayfa-baslik">Kategoriler</h1>
          <p className="sayfa-altyazi" style={{ marginBottom: 0 }}>
            Kategori ekle, adını değiştir veya boş kategorileri sil
          </p>
        </div>
      </div>

      {/* ---------- YENİ KATEGORİ EKLEME ---------- */}
      <form className="ekle-cubugu" onSubmit={kategoriEkle}>
        <input
          className="ekle-input"
          type="text"
          value={yeniAd}
          onChange={(e) => setYeniAd(e.target.value)}
          placeholder="Yeni kategori adı... (örn: Kitap)"
          maxLength={100}
        />

        <Buton type="submit" disabled={ekleniyor || yeniAd.trim() === ''}>
          {ekleniyor ? 'Ekleniyor...' : '➕ Ekle'}
        </Buton>
      </form>

      {/* ---------- HATA ---------- */}
      {hata !== '' && (
        <div style={{ marginBottom: 18 }}>
          <HataKutusu mesaj={hata} />
        </div>
      )}

      {/* ---------- TABLO ---------- */}
      {yukleniyor ? (
        <Yukleniyor yazi="Kategoriler getiriliyor..." />
      ) : (
        <>
          <Tablo
            sutunlar={sutunlar}
            veriler={kategoriler}
            anahtar={(k) => k.id}
            bosMesaj="Henüz kategori yok. Yukarıdan ilkini ekleyebilirsin."
          />

          <p className="sonuc-sayisi">
            Toplam {sayiBicimle(kategoriler.length)} kategori.
          </p>

          <p className="silinemez-ipucu">
            💡 İçinde ürün olan kategoriler silinemez. Önce ürünleri taşı veya sil.
          </p>
        </>
      )}

      {/* ---------- SİLME ONAYI ---------- */}
      <OnayPenceresi
        acik={silinecek !== null}
        baslik="Kategoriyi sil"
        mesaj={
          silinecek
            ? `"${silinecek.name}" kategorisini silmek üzeresin. Bu işlem geri alınamaz.`
            : ''
        }
        onayla={silmeyiOnayla}
        iptal={() => setSilinecek(null)}
        islemde={siliniyor}
      />
    </div>
  );
}