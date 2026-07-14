import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { apiGet, apiPut } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { paraBicimle, sayiBicimle, tarihBicimle } from '../utils/bicimlendir';

import Yukleniyor from '../components/Yukleniyor';
import HataKutusu from '../components/HataKutusu';
import Buton from '../components/Buton';
import Rozet from '../components/Rozet';
import OzetKart from '../components/OzetKart';
import OnayPenceresi from '../components/OnayPenceresi';

import { basHarfler } from './MusterilerSayfasi';

import './MusteriDetaySayfasi.css';

export default function MusteriDetaySayfasi() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { kullanici: girisYapan } = useAuth();

  const [musteri, setMusteri] = useState(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState('');
  const [basari, setBasari] = useState('');

  // Yetki yönetimi
  const [yeniRol, setYeniRol] = useState('');
  const [islemde, setIslemde] = useState(false);
  const [onayPenceresi, setOnayPenceresi] = useState(null); // 'rol' | 'pasif' | null

  // ==========================================================
  //  VERİ ÇEKME
  // ==========================================================
  async function musteriyiGetir() {
    setYukleniyor(true);
    setHata('');

    try {
      const veri = await apiGet('/admin/users/' + id);

      setMusteri(veri);
      setYeniRol(veri.rol); // açılışta mevcut rolü seç
    } catch (e) {
      setHata(e.message);
    } finally {
      setYukleniyor(false);
    }
  }

  useEffect(() => {
    musteriyiGetir();
  }, [id]);

  // ==========================================================
  //  YETKİ İŞLEMLERİ
  // ==========================================================
  async function roluDegistir() {
    setIslemde(true);
    setHata('');
    setBasari('');

    try {
      const cevap = await apiPut('/admin/users/' + id + '/role', { role: yeniRol });

      setBasari(cevap.mesaj);
      setOnayPenceresi(null);

      await musteriyiGetir();
    } catch (e) {
      setHata(e.message);
      setOnayPenceresi(null);
    } finally {
      setIslemde(false);
    }
  }

  async function durumuDegistir(aktif) {
    setIslemde(true);
    setHata('');
    setBasari('');

    try {
      const cevap = await apiPut('/admin/users/' + id + '/status', { isActive: aktif });

      setBasari(cevap.mesaj);
      setOnayPenceresi(null);

      await musteriyiGetir();
    } catch (e) {
      setHata(e.message);
      setOnayPenceresi(null);
    } finally {
      setIslemde(false);
    }
  }

  // ==========================================================
  //  DURUMLAR
  // ==========================================================
  if (yukleniyor) {
    return <Yukleniyor yazi="Kullanıcı bilgileri getiriliyor..." />;
  }

  if (musteri === null) {
    return (
      <div>
        <HataKutusu mesaj={hata} tekrarDene={musteriyiGetir} />

        <div style={{ marginTop: 16 }}>
          <Buton tip="ikincil" onClick={() => navigate('/kullanicilar')}>
            ← Kullanıcılara Dön
          </Buton>
        </div>
      </div>
    );
  }

  // Yetki kartı kimlere görünecek?
  const superAdminMi = girisYapan?.role === 'superadmin';
  const kendisiMi =
    girisYapan && String(musteri.id) === String(girisYapan.id);

  return (
    <div>
      {/* ================= ÜST ================= */}
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

            <div style={{ display: 'flex', gap: 8 }}>
              <Rozet durum={musteri.rol} />
              <Rozet durum={musteri.aktifMi ? 'aktif' : 'pasif'} />
            </div>
          </div>
        </div>

        <Buton tip="ikincil" onClick={() => navigate('/kullanicilar')}>
          ← Kullanıcılara Dön
        </Buton>
      </div>

      {/* ================= MESAJLAR ================= */}
      {basari !== '' && (
        <div
          style={{
            backgroundColor: 'rgba(39, 174, 96, 0.1)',
            border: '1px solid var(--basari)',
            color: 'var(--basari)',
            borderRadius: 10,
            padding: '12px 14px',
            fontSize: 14,
            marginBottom: 16,
          }}
        >
          {basari}
        </div>
      )}

      {hata !== '' && (
        <div style={{ marginBottom: 16 }}>
          <HataKutusu mesaj={hata} />
        </div>
      )}

      {/* ================= ÖZET KARTLAR ================= */}
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

        {/* ============ SOL SÜTUN ============ */}
        <div>

          {/* --- SİPARİŞ GEÇMİŞİ --- */}
          <div className="kutu">
            <div className="kutu-baslik">🧾 Sipariş Geçmişi</div>

            {musteri.siparisler.length === 0 ? (
              <div className="bos-yazi">Bu kullanıcı henüz sipariş vermemiş.</div>
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

        {/* ============ SAĞ SÜTUN ============ */}
        <div>

          {/* --- 🛡️ YETKİ YÖNETİMİ (sadece süper admin görür) --- */}
          {superAdminMi && (
            <div className="yetki-kutu">
              <div className="yetki-baslik">🛡️ Yetki Yönetimi</div>

              {musteri.rol === 'superadmin' ? (
                <div className="yetki-aciklama">
                  Bu hesap <b>süper yönetici</b>. Rolü ve durumu panelden
                  değiştirilemez — sistemin kök yetkisi uygulamanın içinden
                  yönetilmez.
                </div>
              ) : kendisiMi ? (
                <div className="yetki-aciklama">
                  Bu senin hesabın. Kendi rolünü değiştiremez veya kendini
                  devre dışı bırakamazsın.
                </div>
              ) : (
                <>
                  <div className="yetki-aciklama">
                    Rolü değiştirdiğinde bu kullanıcının <b>mevcut oturumu anında
                    sonlanır</b> ve tekrar giriş yapması gerekir.
                  </div>

                  <select
                    className="yetki-secim"
                    value={yeniRol}
                    onChange={(e) => setYeniRol(e.target.value)}
                    disabled={islemde}
                  >
                    <option value="customer">Müşteri</option>
                    <option value="admin">Yönetici</option>
                  </select>

                  <Buton
                    onClick={() => setOnayPenceresi('rol')}
                    disabled={islemde || yeniRol === musteri.rol}
                    style={{ width: '100%' }}
                  >
                    {islemde ? 'İşleniyor...' : '💾 Rolü Güncelle'}
                  </Buton>

                  <div className="uyari-notu">
                    <b>Yönetici:</b> ürün, kategori, sipariş ve raporları yönetir.
                    <br />
                    <b>Süper Yönetici</b> yetkisi panelden verilemez.
                  </div>

                  <hr className="yetki-ayirac" />

                  {musteri.aktifMi ? (
                    <>
                      <Buton
                        tip="tehlike"
                        onClick={() => setOnayPenceresi('pasif')}
                        disabled={islemde}
                        style={{ width: '100%' }}
                      >
                        🚫 Hesabı Devre Dışı Bırak
                      </Buton>

                      <div className="uyari-notu">
                        Hesap <b>silinmez</b>, pasifleştirilir. Siparişleri ve
                        geçmişi korunur; sadece giriş yapamaz.
                      </div>
                    </>
                  ) : (
                    <>
                      <Buton
                        onClick={() => durumuDegistir(true)}
                        disabled={islemde}
                        style={{ width: '100%' }}
                      >
                        ✅ Hesabı Yeniden Aktifleştir
                      </Buton>

                      <div className="uyari-notu">
                        Bu hesap şu an <b>devre dışı</b>. Kullanıcı giriş yapamıyor.
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          )}

          {/* --- 📜 YETKİ GEÇMİŞİ --- */}
          {superAdminMi && musteri.loglar && musteri.loglar.length > 0 && (
            <div className="kutu">
              <div className="kutu-baslik">📜 Yetki Geçmişi</div>

              {musteri.loglar.map((l) => (
                <div key={l.id} className="log-satiri">
                  <div className="log-islem">
                    {l.islem === 'rol_degisti' && '🛡️ Rol değiştirildi'}
                    {l.islem === 'pasiflestirildi' && '🚫 Devre dışı bırakıldı'}
                    {l.islem === 'aktiflestirildi' && '✅ Aktifleştirildi'}
                  </div>

                  <div className="log-detay">
                    {l.eski} → <b>{l.yeni}</b> · {l.yapan} tarafından
                  </div>

                  <div className="log-tarih">{tarihBicimle(l.tarih)}</div>
                </div>
              ))}
            </div>
          )}

          {/* --- HESAP BİLGİLERİ --- */}
          <div className="kutu">
            <div className="kutu-baslik">👤 Hesap Bilgileri</div>

            <div className="mini-kart-metin">
              <div style={{ marginBottom: 8 }}>
                <b>Kullanıcı No:</b> #{musteri.id}
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

      {/* ================= ONAY PENCERESİ ================= */}
      <OnayPenceresi
        acik={onayPenceresi !== null}
        baslik={
          onayPenceresi === 'rol' ? 'Rolü değiştir' : 'Hesabı devre dışı bırak'
        }
        mesaj={
          onayPenceresi === 'rol'
            ? `${musteri.adSoyad} kullanıcısının rolü "${
                yeniRol === 'admin' ? 'Yönetici' : 'Müşteri'
              }" olarak değiştirilecek. Mevcut oturumu anında sonlanacak.`
            : `${musteri.adSoyad} artık giriş yapamayacak. Hesap silinmez; siparişleri ve geçmişi korunur.`
        }
        onayla={() => {
          if (onayPenceresi === 'rol') {
            roluDegistir();
          } else {
            durumuDegistir(false);
          }
        }}
        iptal={() => setOnayPenceresi(null)}
        islemde={islemde}
      />
    </div>
  );
}