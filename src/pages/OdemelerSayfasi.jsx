import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

import { apiGet } from '../services/api';
import { useTema } from '../context/TemaContext';
import { paraBicimle, sayiBicimle, tarihBicimle, ayBicimle } from '../utils/bicimlendir';

import Yukleniyor from '../components/Yukleniyor';
import HataKutusu from '../components/HataKutusu';
import Tablo from '../components/Tablo';
import Buton from '../components/Buton';
import Rozet from '../components/Rozet';
import OzetKart from '../components/OzetKart';
import AramaKutusu from '../components/AramaKutusu';
import Sayfalama from '../components/Sayfalama';

import './OdemelerSayfasi.css';

// Bugünün tarihini "2026-07-14" formatına çevirir (HTML date input bunu ister)
function bugun() {
  return new Date().toISOString().slice(0, 10);
}

function gunOnce(gun) {
  const t = new Date();
  t.setDate(t.getDate() - gun);
  return t.toISOString().slice(0, 10);
}

function ayBasi() {
  const t = new Date();
  return new Date(t.getFullYear(), t.getMonth(), 1).toISOString().slice(0, 10);
}

export default function OdemelerSayfasi() {
  const navigate = useNavigate();
  const { renkler } = useTema();

  const [odemeler, setOdemeler] = useState([]);
  const [ozet, setOzet] = useState(null);
  const [sayfaBilgi, setSayfaBilgi] = useState({ toplam: 0, toplamSayfa: 1 });

  const [gelir, setGelir] = useState(null); // aylık grafik verisi

  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState('');

  // Filtreler
  const [arama, setArama] = useState('');
  const [durumFiltre, setDurumFiltre] = useState('');
  const [baslangic, setBaslangic] = useState('');
  const [bitis, setBitis] = useState('');

  // Sayfalama
  const [sayfa, setSayfa] = useState(1);
  const [sayfaBoyutu, setSayfaBoyutu] = useState(10);

  // ---------- AYLIK GELİR (bir kez, filtreden bağımsız) ----------
  useEffect(() => {
    apiGet('/admin/revenue?months=6')
      .then(setGelir)
      .catch(() => setGelir(null));
  }, []);

  // ---------- ÖDEMELER (filtreye bağlı) ----------
  async function odemeleriGetir() {
    setYukleniyor(true);
    setHata('');

    try {
      const p = new URLSearchParams();

      if (arama.trim() !== '') {
        p.append('search', arama.trim());
      }

      if (durumFiltre !== '') {
        p.append('status', durumFiltre);
      }

      if (baslangic !== '') {
        p.append('startDate', baslangic);
      }

      if (bitis !== '') {
        p.append('endDate', bitis);
      }

      p.append('page', sayfa);
      p.append('pageSize', sayfaBoyutu);

      const veri = await apiGet('/admin/payments?' + p.toString());

      setOdemeler(veri.odemeler);
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
      odemeleriGetir();
    }, 400);

    return () => clearTimeout(sayac);
  }, [arama, durumFiltre, baslangic, bitis, sayfa, sayfaBoyutu]);

  // Filtre değişince 1. sayfaya dön
  useEffect(() => {
    setSayfa(1);
  }, [arama, durumFiltre, baslangic, bitis, sayfaBoyutu]);

  // Hızlı tarih seçimi
  function tarihAraligiSec(tip) {
    if (tip === 'temizle') {
      setBaslangic('');
      setBitis('');
      return;
    }

    if (tip === 'bugun') {
      setBaslangic(bugun());
      setBitis(bugun());
      return;
    }

    if (tip === '7gun') {
      setBaslangic(gunOnce(6));
      setBitis(bugun());
      return;
    }

    if (tip === '30gun') {
      setBaslangic(gunOnce(29));
      setBitis(bugun());
      return;
    }

    if (tip === 'buAy') {
      setBaslangic(ayBasi());
      setBitis(bugun());
    }
  }

  // Grafik verisi
  const grafikVerisi = gelir
    ? gelir.aylik.map((a) => ({
        ay: ayBicimle(a.ay),
        Brüt: a.brut,
        İade: a.iade,
        Net: a.net,
      }))
    : [];

  const sutunlar = [
    {
      baslik: 'Ödeme',
      hucre: (o) => <span style={{ color: 'var(--yaziGri)' }}>#{o.id}</span>,
    },
    {
      baslik: 'Sipariş',
      hucre: (o) => (
        <button
          className="siparis-link"
          onClick={() => navigate('/siparisler/' + o.siparisId)}
        >
          #{o.siparisId} →
        </button>
      ),
    },
    {
      baslik: 'Müşteri',
      hucre: (o) => (
        <div>
          <div className="musteri-ad">{o.musteriAdi}</div>
          <div className="musteri-mail">{o.musteriEmail}</div>
        </div>
      ),
    },
    {
      baslik: 'Kart',
      hucre: (o) => <span className="kart-mono">•••• {o.kartSon4}</span>,
    },
    {
      baslik: 'Tarih',
      hucre: (o) => tarihBicimle(o.tarih),
    },
    {
      baslik: 'Durum',
      hucre: (o) => <Rozet durum={o.durum} />,
    },
    {
      baslik: 'Tutar',
      hizala: 'sag',
      hucre: (o) => (
        <span className={o.durum === 'iade' ? 'tutar-iade' : 'tutar-basarili'}>
          {o.durum === 'iade' ? '−' : '+'} {paraBicimle(o.tutar)}
        </span>
      ),
    },
  ];

  return (
    <div>
      <div className="sayfa-ust">
        <h1 className="sayfa-baslik">Ödemeler / Gelir</h1>
        <p className="sayfa-altyazi" style={{ marginBottom: 0 }}>
          Tüm ödeme hareketleri, iadeler ve gelir raporu
        </p>
      </div>

      {/* ================= ÖZET KARTLAR ================= */}
      {ozet && (
        <div className="ozet-izgara">
          <OzetKart
            ikon="💰"
            etiket="Brüt Gelir"
            deger={paraBicimle(ozet.brutGelir)}
            renk="#27ae60"
          />

          <OzetKart
            ikon="↩️"
            etiket="İadeler"
            deger={paraBicimle(ozet.iadeToplam)}
            renk="#8e44ad"
          />

          <OzetKart
            ikon="🏦"
            etiket="Net Gelir"
            deger={paraBicimle(ozet.netGelir)}
            renk="#2563eb"
          />

          <OzetKart
            ikon="🧾"
            etiket="Ortalama Sepet"
            deger={paraBicimle(ozet.ortalamaSepet)}
            renk="#f39c12"
          />
        </div>
      )}

      {/* ================= AYLIK GELİR GRAFİĞİ ================= */}
      {gelir && (
        <div className="grafik-kutu">
          <div className="grafik-ust">
            <div>
              <div className="grafik-baslik">📊 Aylık Gelir (son 6 ay)</div>

              <div className="grafik-altyazi">
                Tüm zamanlar net gelir:{' '}
                <b>{paraBicimle(gelir.tumZamanlar.netGelir)}</b>
              </div>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={grafikVerisi}>
              <CartesianGrid strokeDasharray="3 3" stroke={renkler.kenarlik} />

              <XAxis
                dataKey="ay"
                stroke={renkler.yaziGri}
                fontSize={12}
                tickLine={false}
              />

              <YAxis
                stroke={renkler.yaziGri}
                fontSize={12}
                tickLine={false}
                width={90}
                tickFormatter={(v) => paraBicimle(v)}
              />

              <Tooltip
                formatter={(v) => paraBicimle(v)}
                contentStyle={{
                  backgroundColor: renkler.kartArka,
                  border: '1px solid ' + renkler.kenarlik,
                  borderRadius: 8,
                  color: renkler.yaziKoyu,
                }}
              />

              <Legend />

              <Bar dataKey="Brüt" fill={renkler.basari} radius={[4, 4, 0, 0]} />
              <Bar dataKey="İade" fill="#8e44ad" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Net"  fill={renkler.anaRenk} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ================= HIZLI TARİH ================= */}
      <div className="hizli-tarihler">
        <Buton tip="ikincil" boyut="kucuk" onClick={() => tarihAraligiSec('bugun')}>
          Bugün
        </Buton>

        <Buton tip="ikincil" boyut="kucuk" onClick={() => tarihAraligiSec('7gun')}>
          Son 7 Gün
        </Buton>

        <Buton tip="ikincil" boyut="kucuk" onClick={() => tarihAraligiSec('30gun')}>
          Son 30 Gün
        </Buton>

        <Buton tip="ikincil" boyut="kucuk" onClick={() => tarihAraligiSec('buAy')}>
          Bu Ay
        </Buton>

        <Buton tip="ikincil" boyut="kucuk" onClick={() => tarihAraligiSec('temizle')}>
          ✕ Temizle
        </Buton>
      </div>

      {/* ================= FİLTRELER ================= */}
      <div className="filtre-cubugu">
        <div className="filtre-grup" style={{ flex: 1, minWidth: 220 }}>
          <span className="filtre-etiket">Ara</span>

          <AramaKutusu
            deger={arama}
            degistir={setArama}
            ipucu="Müşteri, sipariş no veya kart son 4..."
          />
        </div>

        <div className="filtre-grup">
          <span className="filtre-etiket">Durum</span>

          <select
            className="filtre-secim"
            value={durumFiltre}
            onChange={(e) => setDurumFiltre(e.target.value)}
          >
            <option value="">Tümü</option>
            <option value="basarili">Başarılı</option>
            <option value="iade">İade</option>
          </select>
        </div>

        <div className="filtre-grup">
          <span className="filtre-etiket">Başlangıç</span>

          <input
            className="filtre-tarih"
            type="date"
            value={baslangic}
            onChange={(e) => setBaslangic(e.target.value)}
            max={bitis || undefined}
          />
        </div>

        <div className="filtre-grup">
          <span className="filtre-etiket">Bitiş</span>

          <input
            className="filtre-tarih"
            type="date"
            value={bitis}
            onChange={(e) => setBitis(e.target.value)}
            min={baslangic || undefined}
          />
        </div>
      </div>

      {hata !== '' && <HataKutusu mesaj={hata} tekrarDene={odemeleriGetir} />}

      {yukleniyor ? (
        <Yukleniyor yazi="Ödemeler getiriliyor..." />
      ) : (
        <>
          <Tablo
            sutunlar={sutunlar}
            veriler={odemeler}
            anahtar={(o) => o.id}
            bosMesaj="Bu filtreye uyan ödeme yok."
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