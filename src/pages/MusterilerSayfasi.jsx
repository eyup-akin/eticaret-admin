
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { apiGet } from '../services/api';
import { paraBicimle, sayiBicimle, tarihBicimle } from '../utils/bicimlendir';

import Yukleniyor from '../components/Yukleniyor';
import HataKutusu from '../components/HataKutusu';
import Tablo from '../components/Tablo';
import Buton from '../components/Buton';
import Rozet from '../components/Rozet';
import OzetKart from '../components/OzetKart';
import AramaKutusu from '../components/AramaKutusu';
import Sayfalama from '../components/Sayfalama';

import './MusterilerSayfasi.css';

// "Eyüp Akın" → "EA"
export function basHarfler(ad) {
  if (!ad) {
    return '?';
  }

  return ad
    .trim()
    .split(' ')
    .slice(0, 2)
    .map((k) => k.charAt(0).toUpperCase())
    .join('');
}

export default function MusterilerSayfasi() {
  const navigate = useNavigate();

  const [kullanicilar, setKullanicilar] = useState([]);
  const [ozet, setOzet] = useState(null);
  const [sayfaBilgi, setSayfaBilgi] = useState({ toplam: 0, toplamSayfa: 1 });

  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState('');

  const [arama, setArama] = useState('');
  const [rolFiltre, setRolFiltre] = useState('');
  const [siralama, setSiralama] = useState('yeni');

  const [sayfa, setSayfa] = useState(1);
  const [sayfaBoyutu, setSayfaBoyutu] = useState(10);

  async function kullanicilariGetir() {
    setYukleniyor(true);
    setHata('');

    try {
      const p = new URLSearchParams();

      if (arama.trim() !== '') {
        p.append('search', arama.trim());
      }

      if (rolFiltre !== '') {
        p.append('role', rolFiltre);
      }

      p.append('sortBy', siralama);
      p.append('page', sayfa);
      p.append('pageSize', sayfaBoyutu);

      const veri = await apiGet('/admin/users?' + p.toString());

      setKullanicilar(veri.kullanicilar);
      setOzet(veri.ozet);
      setSayfaBilgi({ toplam: veri.toplam, toplamSayfa: veri.toplamSayfa });
    } catch (e) {
      setHata(e.message);
    } finally {
      setYukleniyor(false);
    }
  }

  useEffect(() => {
    const sayac = setTimeout(() => {
      kullanicilariGetir();
    }, 400);

    return () => clearTimeout(sayac);
  }, [arama, rolFiltre, siralama, sayfa, sayfaBoyutu]);

  useEffect(() => {
    setSayfa(1);
  }, [arama, rolFiltre, siralama, sayfaBoyutu]);

  const sutunlar = [
    {
      baslik: 'Müşteri',
      hucre: (k) => (
        <div className="musteri-hucre">
          <div className="avatar">{basHarfler(k.fullName)}</div>

          <div>
            <div className="musteri-ad">{k.fullName}</div>
            <div className="musteri-mail">{k.email}</div>
          </div>
        </div>
      ),
    },
    {
      baslik: 'Rol',
      hucre: (k) => <Rozet durum={k.role} />,
    },
    {
      baslik: 'Kayıt',
      hucre: (k) => tarihBicimle(k.createdAt),
    },
    {
      baslik: 'Sipariş',
      hizala: 'orta',
      hucre: (k) => (
        <div>
          <b>{sayiBicimle(k.siparisSayisi)}</b>

          {k.sonSiparisTarihi && (
            <div className="alt-bilgi">
              son: {tarihBicimle(k.sonSiparisTarihi)}
            </div>
          )}
        </div>
      ),
    },
    {
      baslik: 'Toplam Harcama',
      hizala: 'sag',
      hucre: (k) => (
        <b style={{ color: k.toplamHarcama > 0 ? 'var(--basari)' : 'var(--yaziGri)' }}>
          {paraBicimle(k.toplamHarcama)}
        </b>
      ),
    },
    {
      baslik: '',
      hizala: 'sag',
      hucre: (k) => (
        <div className="islem-butonlari">
          <Buton
            tip="ikincil"
            boyut="kucuk"
            onClick={() => navigate('/musteriler/' + k.id)}
          >
            Detay →
          </Buton>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="sayfa-ust">
        <h1 className="sayfa-baslik">Müşteriler</h1>
        <p className="sayfa-altyazi" style={{ marginBottom: 0 }}>
          Kayıtlı kullanıcılar, sipariş geçmişleri ve harcamaları
        </p>
      </div>

      {/* ---------- ÖZET ---------- */}
      {ozet && (
        <div className="ozet-izgara">
          <OzetKart
            ikon="👥"
            etiket="Toplam Müşteri"
            deger={sayiBicimle(ozet.musteriSayisi)}
            renk="#2563eb"
          />

          <OzetKart
            ikon="🆕"
            etiket="Bu Ay Katılan"
            deger={sayiBicimle(ozet.buAyYeni)}
            renk="#27ae60"
          />

          <OzetKart
            ikon="🛡️"
            etiket="Yönetici"
            deger={sayiBicimle(ozet.adminSayisi)}
            renk="#8e44ad"
          />
        </div>
      )}

      {/* ---------- FİLTRELER ---------- */}
      <div className="filtre-cubugu">
        <AramaKutusu
          deger={arama}
          degistir={setArama}
          ipucu="Ad veya e-posta ara..."
        />

        <select
          className="filtre-secim"
          value={rolFiltre}
          onChange={(e) => setRolFiltre(e.target.value)}
        >
          <option value="">Tüm roller</option>
          <option value="customer">Müşteri</option>
          <option value="admin">Yönetici</option>
        </select>

        <select
          className="filtre-secim"
          value={siralama}
          onChange={(e) => setSiralama(e.target.value)}
        >
          <option value="yeni">En yeni üyeler</option>
          <option value="eski">En eski üyeler</option>
          <option value="harcama">En çok harcayan</option>
          <option value="siparis">En çok sipariş veren</option>
          <option value="isim">İsme göre (A-Z)</option>
        </select>
      </div>

      {hata !== '' && <HataKutusu mesaj={hata} tekrarDene={kullanicilariGetir} />}

      {yukleniyor ? (
        <Yukleniyor yazi="Müşteriler getiriliyor..." />
      ) : (
        <>
          <Tablo
            sutunlar={sutunlar}
            veriler={kullanicilar}
            anahtar={(k) => k.id}
            bosMesaj="Bu filtreye uyan kullanıcı yok."
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
    </div>
  );
}