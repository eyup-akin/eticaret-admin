import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { apiGet } from '../services/api';
import { paraBicimle, sayiBicimle, tarihBicimle } from '../utils/bicimlendir';

import Yukleniyor from '../components/Yukleniyor';
import HataKutusu from '../components/HataKutusu';
import Tablo from '../components/Tablo';
import Buton from '../components/Buton';
import Rozet from '../components/Rozet';
import AramaKutusu from '../components/AramaKutusu';
import Sayfalama from '../components/Sayfalama';

import './SiparislerSayfasi.css';

export default function SiparislerSayfasi() {
  const navigate = useNavigate();

  const [siparisler, setSiparisler] = useState([]);
  const [ozet, setOzet] = useState({
    toplam: 0,
    toplamTutar: 0,
    toplamSayfa: 1,
  });

  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState('');

  // FİLTRELER — hepsi BACKEND'e gidiyor
  const [arama, setArama] = useState('');
  const [durumFiltre, setDurumFiltre] = useState('');
  const [odemeFiltre, setOdemeFiltre] = useState('');

  // SAYFALAMA
  const [sayfa, setSayfa] = useState(1);
  const [sayfaBoyutu, setSayfaBoyutu] = useState(10);

  async function siparisleriGetir() {
    setYukleniyor(true);
    setHata('');

    try {
      // Query string'i güvenli şekilde kur
      const p = new URLSearchParams();

      if (arama.trim() !== '') {
        p.append('search', arama.trim());
      }

      if (durumFiltre !== '') {
        p.append('status', durumFiltre);
      }

      if (odemeFiltre !== '') {
        p.append('paymentStatus', odemeFiltre);
      }

      p.append('page', sayfa);
      p.append('pageSize', sayfaBoyutu);

      const veri = await apiGet('/admin/orders?' + p.toString());

      setSiparisler(veri.siparisler);
      setOzet({
        toplam: veri.toplam,
        toplamTutar: veri.toplamTutar,
        toplamSayfa: veri.toplamSayfa,
      });
    } catch (e) {
      setHata(e.message);
    } finally {
      setYukleniyor(false);
    }
  }

  // Filtre veya sayfa değişince yeniden çek (aramada 400ms debounce)
  useEffect(() => {
    const sayac = setTimeout(() => {
      siparisleriGetir();
    }, 400);

    return () => clearTimeout(sayac);
  }, [arama, durumFiltre, odemeFiltre, sayfa, sayfaBoyutu]);

  // ⚠️ ÖNEMLİ: Filtre değişince 1. sayfaya dön.
  // Yoksa 5. sayfadayken filtre uygularsın, sonuç 2 sayfa çıkar,
  // sen hâlâ 5. sayfadasındır → boş ekran görürsün.
  useEffect(() => {
    setSayfa(1);
  }, [arama, durumFiltre, odemeFiltre, sayfaBoyutu]);

  const sutunlar = [
    {
      baslik: 'No',
      hucre: (s) => <b>#{s.id}</b>,
    },
    {
      baslik: 'Müşteri',
      hucre: (s) => (
        <div>
          <div className="musteri-ad">{s.musteriAdi}</div>
          <div className="musteri-mail">{s.musteriEmail}</div>
        </div>
      ),
    },
    {
      baslik: 'Tarih',
      hucre: (s) => tarihBicimle(s.tarih),
    },
    {
      baslik: 'İçerik',
      hizala: 'orta',
      hucre: (s) => (
        <div>
          <div>{sayiBicimle(s.urunCesidi)} ürün</div>

          <div className="alt-bilgi">
            {sayiBicimle(s.toplamAdet)} adet
          </div>
        </div>
      ),
    },
    {
      baslik: 'Kargo',
      hucre: (s) => <Rozet durum={s.durum} />,
    },
    {
      baslik: 'Ödeme',
      hucre: (s) => (
        <div>
          <Rozet durum={s.odemeDurumu} />

          {s.kartSon4 && (
            <div className="kart-no">•••• {s.kartSon4}</div>
          )}
        </div>
      ),
    },
    {
      baslik: 'Tutar',
      hizala: 'sag',
      hucre: (s) => <b>{paraBicimle(s.tutar)}</b>,
    },
    {
      baslik: '',
      hizala: 'sag',
      hucre: (s) => (
        <div className="islem-butonlari">
          <Buton
            tip="ikincil"
            boyut="kucuk"
            onClick={() => navigate('/siparisler/' + s.id)}
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
        <h1 className="sayfa-baslik">Siparişler</h1>
        <p className="sayfa-altyazi" style={{ marginBottom: 0 }}>
          Tüm siparişleri görüntüle, detaya gir, kargo durumunu ilerlet
        </p>
      </div>

      {/* ---------- FİLTRELER ---------- */}
      <div className="filtre-cubugu">
        <AramaKutusu
          deger={arama}
          degistir={setArama}
          ipucu="Sipariş no, müşteri adı veya e-posta..."
        />

        <select
          className="filtre-secim"
          value={durumFiltre}
          onChange={(e) => setDurumFiltre(e.target.value)}
        >
          <option value="">Tüm kargo durumları</option>
          <option value="hazirlaniyor">Hazırlanıyor</option>
          <option value="kargoda">Kargoda</option>
          <option value="teslim_edildi">Teslim Edildi</option>
          <option value="iptal">İptal</option>
        </select>

        <select
          className="filtre-secim"
          value={odemeFiltre}
          onChange={(e) => setOdemeFiltre(e.target.value)}
        >
          <option value="">Tüm ödeme durumları</option>
          <option value="odendi">Ödendi</option>
          <option value="beklemede">Beklemede</option>
          <option value="iade_edildi">İade Edildi</option>
        </select>
      </div>

      {/* ---------- ÖZET ---------- */}
      <div className="ozet-cubugu">
        <span>
          Filtreye uyan <b>{sayiBicimle(ozet.toplam)}</b> sipariş
        </span>

        <span>
          Toplam tutar: <b>{paraBicimle(ozet.toplamTutar)}</b>
        </span>
      </div>

      {hata !== '' && <HataKutusu mesaj={hata} tekrarDene={siparisleriGetir} />}

      {yukleniyor ? (
        <Yukleniyor yazi="Siparişler getiriliyor..." />
      ) : (
        <>
          <Tablo
            sutunlar={sutunlar}
            veriler={siparisler}
            anahtar={(s) => s.id}
            bosMesaj="Bu filtreye uyan sipariş yok."
          />

          <Sayfalama
            sayfa={sayfa}
            toplamSayfa={ozet.toplamSayfa}
            toplam={ozet.toplam}
            sayfaBoyutu={sayfaBoyutu}
            sayfaDegistir={setSayfa}
            boyutDegistir={setSayfaBoyutu}
          />
        </>
      )}
    </div>
  );
}