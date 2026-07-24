import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { apiGet, apiPut } from '../services/api';
import { paraBicimle, sayiBicimle, tarihBicimle } from '../utils/bicimlendir';

import Yukleniyor from '../components/Yukleniyor';
import HataKutusu from '../components/HataKutusu';
import Buton from '../components/Buton';
import Rozet from '../components/Rozet';
import OnayPenceresi from '../components/OnayPenceresi';

import './SiparisDetaySayfasi.css';

// Durum kodlarını okunabilir yazıya çeviriyoruz.
// Hangi geçişin MÜMKÜN olduğuna backend karar veriyor (izinliGecisler),
// biz sadece onu güzel gösteriyoruz.
const DURUM_YAZILARI = {
  hazirlaniyor: 'Hazırlanıyor',
  kargoda: 'Kargoya Ver',
  teslim_edildi: 'Teslim Edildi Olarak İşaretle',
  iptal: 'İptal',
};

export default function SiparisDetaySayfasi() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [siparis, setSiparis] = useState(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState('');
  const [basari, setBasari] = useState('');

  const [islemde, setIslemde] = useState(false);

  // İptal
  const [iptalSebebi, setIptalSebebi] = useState('');
  const [iptalOnayi, setIptalOnayi] = useState(false);

  async function siparisiGetir() {
    setYukleniyor(true);
    setHata('');

    try {
      const veri = await apiGet('/admin/orders/' + id);
      setSiparis(veri);
    } catch (e) {
      setHata(e.message);
    } finally {
      setYukleniyor(false);
    }
  }

  useEffect(() => {
    siparisiGetir();
  }, [id]);

  // ---------- DURUMU İLERLET ----------
  async function durumuIlerlet(yeniDurum) {
    setIslemde(true);
    setHata('');
    setBasari('');

    try {
      await apiPut('/admin/orders/' + id + '/status', { status: yeniDurum });

      setBasari('Kargo durumu güncellendi. ✅');
      await siparisiGetir();
    } catch (e) {
      setHata(e.message);
    } finally {
      setIslemde(false);
    }
  }

  // ---------- İPTAL ----------
  async function siparisiIptalEt() {
    setIslemde(true);
    setHata('');
    setBasari('');

    try {
      await apiPut('/admin/orders/' + id + '/cancel', {
        reason: iptalSebebi.trim(),
      });

      setBasari('Sipariş iptal edildi. Stok iade edildi, ödeme geri alındı. ✅');
      setIptalOnayi(false);
      setIptalSebebi('');

      await siparisiGetir();
    } catch (e) {
      setHata(e.message);
      setIptalOnayi(false);
    } finally {
      setIslemde(false);
    }
  }

  if (yukleniyor) {
    return <Yukleniyor yazi="Sipariş detayı getiriliyor..." />;
  }

  if (siparis === null) {
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

  const sebepGecerli =
    iptalSebebi.trim().length >= 5 && iptalSebebi.trim().length <= 500;

  return (
    <div>
      {/* ---------- ÜST ---------- */}
      <div className="detay-ust">
        <div>
          <h1 className="sayfa-baslik">Sipariş {siparis.siparisNo}</h1>

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

        {/* ============ SOL SÜTUN ============ */}
        <div>

          {/* --- ÜRÜNLER --- */}
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

          {/* --- 3 BİLGİ KARTI YAN YANA --- */}
          <div className="bilgi-izgara">

            {/* MÜŞTERİ */}
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

            {/* ADRES */}
            <div className="kutu">
              <div className="kutu-baslik">📍 Teslimat Adresi</div>

              {siparis.adres ? (
                <>
                  <div className="bilgi-satiri">
                    <span className="bilgi-etiket">Alıcı</span>
                    <span className="bilgi-deger">
                      {siparis.adres.aliciAdi || '—'}
                    </span>
                  </div>

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
                  Adres kaydı bulunamadı.
                </div>
              )}
            </div>

            {/* ÖDEME */}
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
                  •••• {siparis.kartSon4 || '????'}
                </span>
              </div>

              {siparis.odeme && (
                <div className="bilgi-satiri">
                  <span className="bilgi-etiket">Ödeme Tarihi</span>
                  <span className="bilgi-deger">
                    {tarihBicimle(siparis.odeme.odemeTarihi)}
                  </span>
                </div>
              )}

              <div className="durum-ipucu">
                🔒 Kartın yalnızca son 4 hanesi saklanır.
              </div>
            </div>

          </div>
        </div>

        {/* ============ SAĞ SÜTUN ============ */}
        <div>

          {/* --- KARGO DURUMU --- */}
          <div className="kutu">
            <div className="kutu-baslik">🚚 Kargo Durumu</div>

            <div style={{ marginBottom: 16 }}>
              <Rozet durum={siparis.durum} />
            </div>

            {/* Sunucu hangi geçişlere izin veriyorsa O butonlar çıkar.
                Kural burada değil, backend'de. Biz sadece uyguluyoruz. */}
            {siparis.izinliGecisler.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {siparis.izinliGecisler.map((d) => (
                  <Buton
                    key={d}
                    onClick={() => durumuIlerlet(d)}
                    disabled={islemde}
                    style={{ width: '100%' }}
                  >
                    {islemde ? 'İşleniyor...' : '➡️ ' + (DURUM_YAZILARI[d] || d)}
                  </Buton>
                ))}
              </div>
            ) : (
              <div className="son-durum">
                Bu sipariş <b>son durumunda</b>. Kargo durumu artık değiştirilemez.
              </div>
            )}

            <div className="durum-ipucu">
              Sipariş yalnızca ileri gider:
              <br />
              Hazırlanıyor → Kargoda → Teslim Edildi
            </div>
          </div>

          {/* --- İPTAL --- */}
          {siparis.durum === 'iptal' ? (
            // ZATEN İPTAL EDİLMİŞ → sebebi göster
            <div className="iptal-bilgi-kutu">
              <div className="iptal-baslik">⛔ Sipariş İptal Edildi</div>

              <div className="bilgi-satiri" style={{ padding: '4px 0' }}>
                <span className="bilgi-etiket">İptal Tarihi</span>
                <span className="bilgi-deger">
                  {tarihBicimle(siparis.iptalTarihi)}
                </span>
              </div>

              <div style={{ fontSize: 13, color: 'var(--yaziOrta)', marginTop: 10 }}>
                İptal sebebi:
              </div>

              <div className="iptal-sebep-metin">
                "{siparis.iptalSebebi}"
              </div>
            </div>
          ) : siparis.iptalEdilebilir ? (
            // İPTAL EDİLEBİLİR → form göster
            <div className="iptal-kutu">
              <div className="iptal-baslik">⛔ Siparişi İptal Et</div>

              <div className="iptal-aciklama">
                İptal edilince: ürünlerin <b>stoğu geri eklenir</b>,
                ödeme <b>iade</b> olarak işaretlenir ve tutar <b>gelirden düşer</b>.
                Bu işlem geri alınamaz.
              </div>

              <textarea
                className="iptal-alan"
                value={iptalSebebi}
                onChange={(e) => setIptalSebebi(e.target.value)}
                placeholder="İptal sebebini yaz... (örn: Müşteri telefonla iptal talep etti)"
                maxLength={500}
                disabled={islemde}
              />

              <div className="karakter-sayaci">
                {iptalSebebi.trim().length} / 500 (en az 5 karakter)
              </div>

              <Buton
                tip="tehlike"
                onClick={() => setIptalOnayi(true)}
                disabled={!sebepGecerli || islemde}
                style={{ width: '100%' }}
              >
                {islemde ? 'İptal ediliyor...' : '⛔ Siparişi İptal Et'}
              </Buton>
            </div>
          ) : (
            // İPTAL EDİLEMEZ (teslim edilmiş)
            <div className="kutu">
              <div className="kutu-baslik">⛔ İptal</div>

              <div className="son-durum">
                Bu sipariş <b>teslim edilmiş</b>. Teslim edilen siparişler
                iptal edilemez — iade süreci ayrı yürütülür.
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ---------- İPTAL ONAY PENCERESİ ---------- */}
      <OnayPenceresi
        acik={iptalOnayi}
        baslik="Siparişi iptal et"
        mesaj={
          `${siparis.siparisNo} numaralı siparişi iptal etmek üzeresin. ` +
          `Stok geri eklenecek, ${paraBicimle(siparis.tutar)} tutarındaki ödeme iade edilecek. ` +
          `Bu işlem geri alınamaz.`
        }
        onayla={siparisiIptalEt}
        iptal={() => setIptalOnayi(false)}
        islemde={islemde}
      />
    </div>
  );
}