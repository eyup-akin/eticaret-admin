import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { apiGet, apiPut } from '../services/api';
import { paraBicimle, sayiBicimle, tarihBicimle } from '../utils/bicimlendir';

import Yukleniyor from '../components/Yukleniyor';
import HataKutusu from '../components/HataKutusu';
import Buton from '../components/Buton';
import Rozet from '../components/Rozet';

import './SiparisDetaySayfasi.css';

// Backend'in kabul ettiği durumlar (whitelist ile birebir aynı olmalı)
const DURUMLAR = [
  { deger: 'hazirlaniyor',  yazi: 'Hazırlanıyor' },
  { deger: 'kargoda',       yazi: 'Kargoda' },
  { deger: 'teslim_edildi', yazi: 'Teslim Edildi' },
  { deger: 'iptal',         yazi: 'İptal' },
];

export default function SiparisDetaySayfasi() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [siparis, setSiparis] = useState(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState('');

  // Durum değiştirme
  const [seciliDurum, setSeciliDurum] = useState('');
  const [guncelleniyor, setGuncelleniyor] = useState(false);
  const [basari, setBasari] = useState('');

  async function siparisiGetir() {
    setYukleniyor(true);
    setHata('');

    try {
      const veri = await apiGet('/admin/orders/' + id);

      setSiparis(veri);
      setSeciliDurum(veri.durum); // açılışta mevcut durumu seç
    } catch (e) {
      setHata(e.message);
    } finally {
      setYukleniyor(false);
    }
  }

  useEffect(() => {
    siparisiGetir();
  }, [id]);

  async function durumuGuncelle() {
    setGuncelleniyor(true);
    setHata('');
    setBasari('');

    try {
      await apiPut('/admin/orders/' + id + '/status', { status: seciliDurum });

      setBasari('Kargo durumu güncellendi. ✅');

      // Siparişi tekrar çek — stok iadesi olduysa da yansısın
      await siparisiGetir();
    } catch (e) {
      setHata(e.message);

      // Hata olduysa seçimi eski haline döndür (yanlış izlenim vermesin)
      if (siparis) {
        setSeciliDurum(siparis.durum);
      }
    } finally {
      setGuncelleniyor(false);
    }
  }

  if (yukleniyor) {
    return <Yukleniyor yazi="Sipariş detayı getiriliyor..." />;
  }

  if (hata !== '' && siparis === null) {
    return (
      <div>
        <HataKutusu mesaj={hata} tekrarDene={siparisiGetir} />

        <div style={{ marginTop: 16 }}>
          <Buton tip="ikincil" onClick={() => navigate('/siparisler')}>
            ← Siparişlere Dön
          </Buton>
        </div>
      </div>
    );
  }

  const durumDegistiMi = seciliDurum !== siparis.durum;

  return (
    <div>
      {/* ---------- ÜST ---------- */}
      <div className="detay-ust">
        <div>
          <h1 className="sayfa-baslik">Sipariş #{siparis.id}</h1>

          <p className="sayfa-altyazi" style={{ marginBottom: 0 }}>
            {tarihBicimle(siparis.tarih)}
          </p>
        </div>

        <Buton tip="ikincil" onClick={() => navigate('/siparisler')}>
          ← Siparişlere Dön
        </Buton>
      </div>

      {basari !== '' && <div className="basari-kutusu">{basari}</div>}

      {hata !== '' && (
        <div style={{ marginBottom: 16 }}>
          <HataKutusu mesaj={hata} />
        </div>
      )}

      <div className="detay-izgara">

        {/* ================= SOL: ÜRÜNLER ================= */}
        <div>
          <div className="kutu">
            <div className="kutu-baslik">📦 Sipariş Edilen Ürünler</div>

            <table className="kalem-tablo">
              <thead>
                <tr>
                  <th>Ürün</th>
                  <th className="sag">Adet</th>
                  <th className="sag">Birim Fiyat</th>
                  <th className="sag">Ara Toplam</th>
                </tr>
              </thead>

              <tbody>
                {siparis.kalemler.map((k) => (
                  <tr key={k.urunId}>
                    <td><b>{k.urunAdi}</b></td>
                    <td className="sag">{sayiBicimle(k.adet)}</td>
                    <td className="sag">{paraBicimle(k.birimFiyat)}</td>
                    <td className="sag">{paraBicimle(k.araToplam)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="toplam-satiri">
              <span className="toplam-etiket">Sipariş Toplamı</span>
              <span className="toplam-tutar">{paraBicimle(siparis.tutar)}</span>
            </div>

            <div className="durum-ipucu">
              💡 Buradaki fiyatlar <b>sipariş anındaki</b> fiyatlardır.
              Ürünün fiyatı sonradan değişse bile bu kayıt değişmez.
            </div>
          </div>
        </div>

        {/* ================= SAĞ: BİLGİ KARTLARI ================= */}
        <div>

          {/* --- KARGO DURUMU --- */}
          <div className="kutu">
            <div className="kutu-baslik">🚚 Kargo Durumu</div>

            <div style={{ marginBottom: 14 }}>
              <Rozet durum={siparis.durum} />
            </div>

            <select
              className="durum-secim"
              value={seciliDurum}
              onChange={(e) => setSeciliDurum(e.target.value)}
              disabled={guncelleniyor}
            >
              {DURUMLAR.map((d) => (
                <option key={d.deger} value={d.deger}>
                  {d.yazi}
                </option>
              ))}
            </select>

            <Buton
              onClick={durumuGuncelle}
              disabled={!durumDegistiMi || guncelleniyor}
              style={{ width: '100%' }}
            >
              {guncelleniyor ? 'Güncelleniyor...' : '💾 Durumu Güncelle'}
            </Buton>

            <div className="durum-ipucu">
              ⚠️ Siparişi <b>iptal</b> edersen ürünlerin stoğu otomatik olarak
              geri eklenir. İptalden geri dönersen stok tekrar düşülür.
            </div>
          </div>

          {/* --- MÜŞTERİ --- */}
          <div className="kutu">
            <div className="kutu-baslik">👤 Müşteri</div>

            <div className="bilgi-satiri">
              <span className="bilgi-etiket">Ad Soyad</span>
              <span className="bilgi-deger">{siparis.musteri?.fullName || '—'}</span>
            </div>

            <div className="bilgi-satiri">
              <span className="bilgi-etiket">E-posta</span>
              <span className="bilgi-deger">{siparis.musteri?.email || '—'}</span>
            </div>

            <div className="bilgi-satiri">
              <span className="bilgi-etiket">Müşteri No</span>
              <span className="bilgi-deger">#{siparis.musteri?.id || '—'}</span>
            </div>
          </div>

          {/* --- TESLİMAT ADRESİ --- */}
          <div className="kutu">
            <div className="kutu-baslik">📍 Teslimat Adresi</div>

            {siparis.adres ? (
              <>
                <div className="bilgi-satiri">
                  <span className="bilgi-etiket">Başlık</span>
                  <span className="bilgi-deger">{siparis.adres.title}</span>
                </div>

                <div className="bilgi-satiri">
                  <span className="bilgi-etiket">Şehir</span>
                  <span className="bilgi-deger">{siparis.adres.city}</span>
                </div>

                <div className="bilgi-satiri">
                  <span className="bilgi-etiket">Adres</span>
                  <span className="bilgi-deger">{siparis.adres.fullAddress}</span>
                </div>
              </>
            ) : (
              <div style={{ color: 'var(--yaziGri)', fontSize: 14 }}>
                Adres kaydı bulunamadı (silinmiş olabilir).
              </div>
            )}
          </div>

          {/* --- ÖDEME --- */}
          <div className="kutu">
            <div className="kutu-baslik">💳 Ödeme</div>

            <div className="bilgi-satiri">
              <span className="bilgi-etiket">Durum</span>
              <span className="bilgi-deger">
                <Rozet durum={siparis.odemeDurumu} />
              </span>
            </div>

            <div className="bilgi-satiri">
              <span className="bilgi-etiket">Kart</span>
              <span className="bilgi-deger kart-mono">
                •••• •••• •••• {siparis.kartSon4 || '????'}
              </span>
            </div>

            {siparis.odeme && (
              <>
                <div className="bilgi-satiri">
                  <span className="bilgi-etiket">Ödenen Tutar</span>
                  <span className="bilgi-deger">{paraBicimle(siparis.odeme.tutar)}</span>
                </div>

                <div className="bilgi-satiri">
                  <span className="bilgi-etiket">Ödeme Tarihi</span>
                  <span className="bilgi-deger">
                    {tarihBicimle(siparis.odeme.odemeTarihi)}
                  </span>
                </div>
              </>
            )}

            <div className="durum-ipucu">
              🔒 Kartın yalnızca son 4 hanesi saklanır. Tam numara ve CVV
              hiçbir zaman veritabanına yazılmaz.
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}