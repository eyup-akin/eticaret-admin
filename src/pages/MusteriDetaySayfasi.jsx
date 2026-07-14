import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { apiGet } from '../services/api';
import { paraBicimle, sayiBicimle, tarihBicimle } from '../utils/bicimlendir';

import Yukleniyor from '../components/Yukleniyor';
import HataKutusu from '../components/HataKutusu';
import Buton from '../components/Buton';
import Rozet from '../components/Rozet';
import OzetKart from '../components/OzetKart';

import { basHarfler } from './MusterilerSayfasi';

import './MusteriDetaySayfasi.css';

export default function MusteriDetaySayfasi() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [musteri, setMusteri] = useState(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState('');

  async function musteriyiGetir() {
    setYukleniyor(true);
    setHata('');

    try {
      const veri = await apiGet('/admin/users/' + id);
      setMusteri(veri);
    } catch (e) {
      setHata(e.message);
    } finally {
      setYukleniyor(false);
    }
  }

  useEffect(() => {
    musteriyiGetir();
  }, [id]);

  if (yukleniyor) {
    return <Yukleniyor yazi="Müşteri bilgileri getiriliyor..." />;
  }

  if (musteri === null) {
    return (
      <div>
        <HataKutusu mesaj={hata} tekrarDene={musteriyiGetir} />

        <div style={{ marginTop: 16 }}>
          <Buton tip="ikincil" onClick={() => navigate('/musteriler')}>
            ← Müşterilere Dön
          </Buton>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* ---------- ÜST ---------- */}
      <div className="detay-ust">
        <div className="musteri-basligi">
          <div className="avatar-buyuk">{basHarfler(musteri.adSoyad)}</div>

          <div>
            <h1 className="sayfa-baslik" style={{ marginBottom: 4 }}>
              {musteri.adSoyad}
            </h1>

            <p className="sayfa-altyazi" style={{ marginBottom: 6 }}>
              {musteri.email}
            </p>

            <Rozet durum={musteri.rol} />
          </div>
        </div>

        <Buton tip="ikincil" onClick={() => navigate('/musteriler')}>
          ← Müşterilere Dön
        </Buton>
      </div>

      {/* ---------- ÖZET KARTLAR ---------- */}
      <div className="ozet-izgara">
        <OzetKart
          ikon="🧾"
          etiket="Toplam Sipariş"
          deger={sayiBicimle(musteri.ozet.siparisSayisi)}
          renk="#2563eb"
        />

        <OzetKart
          ikon="💰"
          etiket="Net Harcama"
          deger={paraBicimle(musteri.ozet.netHarcama)}
          renk="#27ae60"
        />

        <OzetKart
          ikon="↩️"
          etiket="İade Edilen"
          deger={paraBicimle(musteri.ozet.iadeToplam)}
          renk="#8e44ad"
        />

        <OzetKart
          ikon="📊"
          etiket="Ortalama Sepet"
          deger={paraBicimle(musteri.ozet.ortalamaSepet)}
          renk="#f39c12"
        />
      </div>

      <div className="detay-izgara">

        {/* ============ SOL: SİPARİŞLER ============ */}
        <div>
          <div className="kutu">
            <div className="kutu-baslik">🧾 Sipariş Geçmişi</div>

            {musteri.siparisler.length === 0 ? (
              <div className="bos-yazi">Bu müşteri henüz sipariş vermemiş.</div>
            ) : (
              <table className="mini-tablo">
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Tarih</th>
                    <th>İçerik</th>
                    <th>Kargo</th>
                    <th>Ödeme</th>
                    <th className="sag">Tutar</th>
                  </tr>
                </thead>

                <tbody>
                  {musteri.siparisler.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <button
                          className="siparis-link"
                          onClick={() => navigate('/siparisler/' + s.id)}
                        >
                          #{s.id} →
                        </button>
                      </td>

                      <td>{tarihBicimle(s.tarih)}</td>
                      <td>{sayiBicimle(s.urunCesidi)} ürün</td>
                      <td><Rozet durum={s.durum} /></td>
                      <td><Rozet durum={s.odemeDurumu} /></td>
                      <td className="sag"><b>{paraBicimle(s.tutar)}</b></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* --- EN ÇOK ALDIĞI ÜRÜNLER --- */}
          <div className="kutu">
            <div className="kutu-baslik">🔥 En Çok Aldığı Ürünler</div>

            {musteri.enCokAldiklari.length === 0 ? (
              <div className="bos-yazi">Henüz veri yok.</div>
            ) : (
              <table className="mini-tablo">
                <thead>
                  <tr>
                    <th>Ürün</th>
                    <th className="sag">Toplam Adet</th>
                  </tr>
                </thead>

                <tbody>
                  {musteri.enCokAldiklari.map((u) => (
                    <tr key={u.urunId}>
                      <td><b>{u.urunAdi}</b></td>
                      <td className="sag">{sayiBicimle(u.adet)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* ============ SAĞ: BİLGİLER ============ */}
        <div>

          {/* --- HESAP --- */}
          <div className="kutu">
            <div className="kutu-baslik">👤 Hesap Bilgileri</div>

            <div className="mini-kart-metin">
              <div style={{ marginBottom: 8 }}>
                <b>Müşteri No:</b> #{musteri.id}
              </div>

              <div style={{ marginBottom: 8 }}>
                <b>Kayıt Tarihi:</b> {tarihBicimle(musteri.kayitTarihi)}
              </div>

              <div>
                <b>Brüt Harcama:</b> {paraBicimle(musteri.ozet.brutHarcama)}
              </div>
            </div>
          </div>

          {/* --- ADRESLER --- */}
          <div className="kutu">
            <div className="kutu-baslik">
              📍 Adresleri ({sayiBicimle(musteri.ozet.adresSayisi)})
            </div>

            {musteri.adresler.length === 0 ? (
              <div className="bos-yazi">Kayıtlı adres yok.</div>
            ) : (
              musteri.adresler.map((a) => (
                <div key={a.id} className="mini-kart">
                  <div className="mini-kart-baslik">{a.title}</div>

                  <div className="mini-kart-metin">
                    {a.fullAddress}
                    <br />
                    {a.city}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* --- KARTLAR --- */}
          <div className="kutu">
            <div className="kutu-baslik">
              💳 Kayıtlı Kartları ({sayiBicimle(musteri.ozet.kartSayisi)})
            </div>

            {musteri.kartlar.length === 0 ? (
              <div className="bos-yazi">Kayıtlı kart yok.</div>
            ) : (
              musteri.kartlar.map((k) => (
                <div key={k.id} className="mini-kart">
                  <div className="mini-kart-baslik">{k.cardHolderName}</div>

                  <div className="kart-mono">
                    •••• •••• •••• {k.last4Digits}
                  </div>
                </div>
              ))
            )}

            <div className="gizlilik-notu">
              🔒 Kartların yalnızca son 4 hanesi saklanır. Tam numara ve CVV
              hiçbir zaman veritabanına yazılmaz — bu yüzden admin bile göremez.
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}