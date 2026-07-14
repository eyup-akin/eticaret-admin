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

import './SiparislerSayfasi.css';

export default function SiparislerSayfasi() {
  const navigate = useNavigate();

  const [siparisler, setSiparisler] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState('');

  // Filtreler — HEPSİ TARAYICIDA çalışıyor.
  // Neden? Backend /api/admin/orders için filtre parametresi kabul etmiyor
  // ve sipariş sayısı az. Veri binlerce olsaydı backend'e taşırdık.
  const [arama, setArama] = useState('');
  const [durumFiltre, setDurumFiltre] = useState('');
  const [odemeFiltre, setOdemeFiltre] = useState('');

  async function siparisleriGetir() {
    setYukleniyor(true);
    setHata('');

    try {
      const veri = await apiGet('/admin/orders');
      setSiparisler(veri);
    } catch (e) {
      setHata(e.message);
    } finally {
      setYukleniyor(false);
    }
  }

  useEffect(() => {
    siparisleriGetir();
  }, []);

  // ---------- FİLTRELEME ----------
  const filtreliSiparisler = siparisler.filter((s) => {
    // Arama: sipariş no VEYA müşteri adı VEYA e-posta
    const aramaMetni = arama.trim().toLowerCase();

    const aramaUyuyor =
      aramaMetni === '' ||
      String(s.id).includes(aramaMetni) ||
      s.musteriAdi.toLowerCase().includes(aramaMetni) ||
      s.musteriEmail.toLowerCase().includes(aramaMetni);

    const durumUyuyor = durumFiltre === '' || s.durum === durumFiltre;
    const odemeUyuyor = odemeFiltre === '' || s.odemeDurumu === odemeFiltre;

    return aramaUyuyor && durumUyuyor && odemeUyuyor;
  });

  // Filtrelenen siparişlerin toplam cirosu
  const toplamTutar = filtreliSiparisler.reduce((toplam, s) => toplam + s.tutar, 0);

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
      baslik: 'Ürün',
      hizala: 'orta',
      hucre: (s) => sayiBicimle(s.urunAdedi) + ' kalem',
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
            <div className="kart-no" style={{ marginTop: 4, fontSize: 12 }}>
              •••• {s.kartSon4}
            </div>
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
          Tüm siparişleri görüntüle, detaya gir, kargo durumunu değiştir
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
        </select>
      </div>

      {hata !== '' && <HataKutusu mesaj={hata} tekrarDene={siparisleriGetir} />}

      {yukleniyor ? (
        <Yukleniyor yazi="Siparişler getiriliyor..." />
      ) : (
        <>
          <Tablo
            sutunlar={sutunlar}
            veriler={filtreliSiparisler}
            anahtar={(s) => s.id}
            bosMesaj={
              siparisler.length === 0
                ? 'Henüz sipariş yok.'
                : 'Bu filtreye uyan sipariş yok.'
            }
          />

          <p className="sonuc-sayisi">
            {sayiBicimle(filtreliSiparisler.length)} sipariş ·
            Toplam tutar: <b>{paraBicimle(toplamTutar)}</b>
          </p>
        </>
      )}
    </div>
  );
}