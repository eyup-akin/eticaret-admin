import { useEffect, useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

import { apiGet } from '../services/api';
import { useTema } from '../context/TemaContext';
import { paraBicimle, sayiBicimle, tarihBicimle, kisaTarih } from '../utils/bicimlendir';

import Yukleniyor from '../components/Yukleniyor';
import HataKutusu from '../components/HataKutusu';
import OzetKart from '../components/OzetKart';
import Rozet from '../components/Rozet';

import './DashboardSayfasi.css';

export default function DashboardSayfasi() {
  const { renkler } = useTema(); // grafik renkleri temadan gelsin

  const [ozet, setOzet] = useState(null);
  const [stats, setStats] = useState(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState('');

  // İki endpoint'i AYNI ANDA çağırıyoruz (sırayla değil) — Promise.all
  async function verileriGetir() {
    setYukleniyor(true);
    setHata('');

    try {
      const [ozetVeri, statsVeri] = await Promise.all([
        apiGet('/admin/dashboard'),
        apiGet('/admin/stats'),
      ]);

      setOzet(ozetVeri);
      setStats(statsVeri);
    } catch (e) {
      setHata(e.message);
    } finally {
      setYukleniyor(false);
    }
  }

  useEffect(() => {
    verileriGetir();
  }, []);

  if (yukleniyor) {
    return <Yukleniyor yazi="İstatistikler hesaplanıyor..." />;
  }

  if (hata !== '') {
    return <HataKutusu mesaj={hata} tekrarDene={verileriGetir} />;
  }

  // Grafiğin istediği formata çevir: [{ gun: "13 Tem", gelir: 1250 }, ...]
  const grafikVerisi = stats.gunlukGelir.map((g) => ({
    gun: kisaTarih(g.tarih),
    gelir: g.gelir,
  }));

  const artiyorMu = stats.degisimYuzde >= 0;

  return (
    <div>
      <h1 className="sayfa-baslik">Dashboard</h1>
      <p className="sayfa-altyazi">Mağazanın genel durumu ve bu ayki performans</p>

      {/* ================= GELİR KUTUSU ================= */}
      <div className="gelir-kutusu">
        <div className="gelir-etiket">💰 Toplam Gelir (tüm zamanlar)</div>
        <div className="gelir-tutar">{paraBicimle(ozet.toplamGelir)}</div>

        <div className="gelir-alt-satir">
          <div className="gelir-alt-oge">
            Bu ayki gelir
            <b>{paraBicimle(stats.buAyGelir)}</b>
          </div>

          <div className="gelir-alt-oge">
            Bu ayki sipariş
            <b>{sayiBicimle(stats.buAySiparis)}</b>
          </div>

          <div className="gelir-alt-oge">
            Geçen aya göre
            <b>
              <span className="degisim">
                {artiyorMu ? '▲' : '▼'} %{Math.abs(stats.degisimYuzde)}
              </span>
            </b>
          </div>
        </div>
      </div>

      {/* ================= ÖZET KARTLAR ================= */}
      <div className="kart-izgara">
        <OzetKart
          ikon="🧾"
          etiket="Toplam Sipariş"
          deger={sayiBicimle(ozet.toplamSiparis)}
          renk="#2563eb"
        />

        <OzetKart
          ikon="📦"
          etiket="Toplam Ürün"
          deger={sayiBicimle(ozet.toplamUrun)}
          renk="#f39c12"
        />

        <OzetKart
          ikon="👥"
          etiket="Toplam Müşteri"
          deger={sayiBicimle(ozet.toplamMusteri)}
          renk="#27ae60"
        />

        <OzetKart
          ikon="💳"
          etiket="Ortalama Sipariş"
          deger={paraBicimle(
            ozet.toplamSiparis > 0 ? ozet.toplamGelir / ozet.toplamSiparis : 0
          )}
          renk="#8e44ad"
        />
      </div>

      {/* ================= GELİR GRAFİĞİ ================= */}
      <div className="bolum">
        <div className="bolum-baslik">Son 7 Günün Geliri</div>
        <div className="bolum-altyazi">Yalnızca başarılı ödemeler</div>

        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={grafikVerisi}>
            {/* Alanın içindeki mavi geçiş */}
            <defs>
              <linearGradient id="gelirRengi" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={renkler.anaRenk} stopOpacity={0.35} />
                <stop offset="95%" stopColor={renkler.anaRenk} stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke={renkler.kenarlik} />

            <XAxis
              dataKey="gun"
              stroke={renkler.yaziGri}
              fontSize={12}
              tickLine={false}
            />

            <YAxis
              stroke={renkler.yaziGri}
              fontSize={12}
              tickLine={false}
              width={80}
              tickFormatter={(v) => paraBicimle(v)}
            />

            <Tooltip
              formatter={(v) => [paraBicimle(v), 'Gelir']}
              contentStyle={{
                backgroundColor: renkler.kartArka,
                border: '1px solid ' + renkler.kenarlik,
                borderRadius: 8,
                color: renkler.yaziKoyu,
              }}
            />

            <Area
              type="monotone"
              dataKey="gelir"
              stroke={renkler.anaRenk}
              strokeWidth={2}
              fill="url(#gelirRengi)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ================= İKİLİ BÖLÜM ================= */}
      <div className="ikili-izgara">

        {/* --- EN ÇOK SATANLAR --- */}
        <div className="bolum">
          <div className="bolum-baslik">🔥 En Çok Satan Ürünler</div>
          <div className="bolum-altyazi">Tüm zamanlar, satılan adede göre</div>

          {stats.enCokSatanlar.length === 0 ? (
            <p className="bos-yazi">Henüz satış yok.</p>
          ) : (
            <table className="mini-tablo">
              <thead>
                <tr>
                  <th>Ürün</th>
                  <th className="sag-hizali">Adet</th>
                  <th className="sag-hizali">Ciro</th>
                </tr>
              </thead>
              <tbody>
                {stats.enCokSatanlar.map((u) => (
                  <tr key={u.urunId}>
                    <td>{u.urunAdi}</td>
                    <td className="sag-hizali">{sayiBicimle(u.adet)}</td>
                    <td className="sag-hizali">{paraBicimle(u.ciro)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* --- KRİTİK STOK --- */}
        <div className="bolum">
          <div className="bolum-baslik">⚠️ Stoğu Azalan Ürünler</div>
          <div className="bolum-altyazi">5 adetten az kalanlar</div>

          {stats.kritikStok.length === 0 ? (
            <p className="bos-yazi">Tüm ürünlerin stoğu yeterli. 👍</p>
          ) : (
            <table className="mini-tablo">
              <thead>
                <tr>
                  <th>Ürün</th>
                  <th className="sag-hizali">Kalan Stok</th>
                </tr>
              </thead>
              <tbody>
                {stats.kritikStok.map((u) => (
                  <tr key={u.urunId}>
                    <td>{u.urunAdi}</td>
                    <td className="sag-hizali">
                      <span className={u.stok === 0 ? 'stok-kritik' : 'stok-uyari'}>
                        {u.stok === 0 ? 'TÜKENDİ' : u.stok}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>

      {/* ================= SON SİPARİŞLER ================= */}
      <div className="bolum">
        <div className="bolum-baslik">🧾 Son Siparişler</div>
        <div className="bolum-altyazi">En son verilen 5 sipariş</div>

        {stats.sonSiparisler.length === 0 ? (
          <p className="bos-yazi">Henüz sipariş yok.</p>
        ) : (
          <table className="mini-tablo">
            <thead>
              <tr>
                <th>No</th>
                <th>Müşteri</th>
                <th>Tarih</th>
                <th>Kargo</th>
                <th>Ödeme</th>
                <th className="sag-hizali">Tutar</th>
              </tr>
            </thead>
            <tbody>
              {stats.sonSiparisler.map((s) => (
                <tr key={s.id}>
                  <td>#{s.id}</td>
                  <td>{s.musteri}</td>
                  <td>{tarihBicimle(s.tarih)}</td>
                  <td><Rozet durum={s.durum} /></td>
                  <td><Rozet durum={s.odemeDurumu} /></td>
                  <td className="sag-hizali">{paraBicimle(s.tutar)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ================= DURUM DAĞILIMI ================= */}
      <div className="bolum">
        <div className="bolum-baslik">📊 Sipariş Durum Dağılımı</div>
        <div className="bolum-altyazi">Kargo durumuna göre sipariş sayısı</div>

        {stats.durumDagilimi.length === 0 ? (
          <p className="bos-yazi">Henüz sipariş yok.</p>
        ) : (
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {stats.durumDagilimi.map((d) => (
              <div
                key={d.durum}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '12px 18px',
                  border: '1px solid var(--kenarlik)',
                  borderRadius: 10,
                }}
              >
                <Rozet durum={d.durum} />
                <b style={{ fontSize: 20, color: 'var(--yaziKoyu)' }}>{d.adet}</b>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}