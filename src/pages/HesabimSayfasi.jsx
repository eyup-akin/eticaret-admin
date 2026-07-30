import { useEffect, useState } from 'react';

import { apiGet } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { tarihBicimle } from '../utils/bicimlendir';

import Buton from '../components/Buton';
import HataKutusu from '../components/HataKutusu';
import Yukleniyor from '../components/Yukleniyor';

import './HesabimSayfasi.css';

// Sunucudaki kuralla AYNI sayı.
// Farklı olsaydı arayüzde kabul edilen şifre sunucuda reddedilirdi.
const MIN_SIFRE = 6;

// Rol kodunu okunabilir metne çevirir.
// Bileşen dışında sabit — her render'da yeniden oluşturulmasın.
const ROL_ADLARI = {
  superadmin: 'Süper Yönetici',
  admin: 'Yönetici',
  customer: 'Müşteri',
};

export default function HesabimSayfasi() {
  const { kullanici, profilGuncelle, sifreDegistir } = useAuth();

  // Salt okunur bilgiler (e-posta, üyelik tarihi) buradan geliyor.
  // AuthContext'teki 'kullanici' sadece id/ad/rol tutuyor.
  const [profil, setProfil] = useState(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [sayfaHatasi, setSayfaHatasi] = useState('');

  // ---------- PROFİL FORMU ----------
  const [adSoyad, setAdSoyad] = useState('');
  const [profilKaydediliyor, setProfilKaydediliyor] = useState(false);
  const [profilHatasi, setProfilHatasi] = useState('');
  const [profilBasari, setProfilBasari] = useState('');

  // ---------- ŞİFRE FORMU ----------
  const [eskiSifre, setEskiSifre] = useState('');
  const [yeniSifre, setYeniSifre] = useState('');
  const [yeniTekrar, setYeniTekrar] = useState('');
  const [sifreKaydediliyor, setSifreKaydediliyor] = useState(false);
  const [sifreHatasi, setSifreHatasi] = useState('');
  const [sifreBasari, setSifreBasari] = useState('');


  // Açılışta profili çek
  useEffect(() => {
    async function profiliGetir() {
      setYukleniyor(true);
      setSayfaHatasi('');

      try {
        const veri = await apiGet('/auth/ben-kimim');
        setProfil(veri);

        // Form başlangıç değeri: sunucudan gelen ad.
        // AuthContext'teki kopya yerine sunucuyu kaynak alıyoruz —
        // başka bir sekmeden değişmiş olabilir.
        setAdSoyad(veri.fullName);
      } catch (e) {
        setSayfaHatasi(e.message);
      } finally {
        setYukleniyor(false);
      }
    }

    profiliGetir();
  }, []);


  // Ad değişti mi? Türetilmiş değer — ayrı state tutmuyoruz.
  // Değişiklik yoksa Kaydet butonu soluk kalsın, boşa istek atmayalım.
  const profilDegistiMi =
    profil !== null && adSoyad.trim() !== profil.fullName.trim();

  // Üç şifre alanı da dolu mu?
  const sifreHepsiDolu =
    eskiSifre.length > 0 && yeniSifre.length > 0 && yeniTekrar.length > 0;


  // ================= PROFİL KAYDET =================

  async function profilKaydet(e) {
    // Formun sayfayı yeniden yüklemesini engelle
    e.preventDefault();

    const temiz = adSoyad.trim();

    // İstemci tarafı doğrulama — sunucudaki kuralın aynısı.
    // Bu bir GÜVENLİK katmanı değil, kullanıcıyı gereksiz ağ turundan
    // kurtaran kolaylık katmanı. Asıl kural ProfilGuncelleDto'daki
    // [StringLength(100, MinimumLength = 2)] attribute'unda.
    if (temiz.length < 2) {
      setProfilHatasi('Ad soyad en az 2 karakter olmalı.');
      return;
    }

    setProfilHatasi('');
    setProfilBasari('');
    setProfilKaydediliyor(true);

    try {
      const veri = await profilGuncelle(temiz);

      // Sunucunun döndürdüğü değeri ekrana yaz — Trim() sonrası hâli.
      // Böylece "  Ali  " yazdıysa kutuda "Ali" görünür.
      setAdSoyad(veri.fullName);
      setProfil({ ...profil, fullName: veri.fullName });

      setProfilBasari('Profilin güncellendi. ✅');
    } catch (e) {
      setProfilHatasi(e.message);
    } finally {
      setProfilKaydediliyor(false);
    }
  }


  // ================= ŞİFRE DEĞİŞTİR =================

  async function sifreKaydet(e) {
    e.preventDefault();

    if (yeniSifre.length < MIN_SIFRE) {
      setSifreHatasi(`Yeni şifre en az ${MIN_SIFRE} karakter olmalı.`);
      return;
    }

    // ⭐ Bu kontrol SADECE burada var, sunucuda yok — olmasına da gerek yok.
    //    "Tekrar" alanı yazım hatası yakalamak için var, güvenlik kuralı
    //    değil. Sunucuya aynı veriyi iki kez göndermek boşa taşımadır.
    if (yeniSifre !== yeniTekrar) {
      setSifreHatasi('Yeni şifreler birbiriyle eşleşmiyor.');
      return;
    }

    if (yeniSifre === eskiSifre) {
      setSifreHatasi('Yeni şifre eskisiyle aynı olamaz.');
      return;
    }

    setSifreHatasi('');
    setSifreBasari('');
    setSifreKaydediliyor(true);

    try {
      // AuthContext bu çağrıda sunucudan dönen YENİ token çiftini
      // kasaya yazıyor — o adım atlanırsa oturum düşer.
      await sifreDegistir(eskiSifre, yeniSifre);

      // Formu temizle — şifreler ekranda kalmasın.
      // Biri omzundan bakıyor olabilir, ayrıca tarayıcı otomatik
      // doldurma önerisi de üretmesin.
      setEskiSifre('');
      setYeniSifre('');
      setYeniTekrar('');

      setSifreBasari(
        'Şifren güncellendi. Diğer cihazlardaki oturumların kapatıldı. ✅'
      );
    } catch (e) {
      setSifreHatasi(e.message);
    } finally {
      setSifreKaydediliyor(false);
    }
  }


  if (yukleniyor) {
    return <Yukleniyor yazi="Hesap bilgileri getiriliyor..." />;
  }

  if (sayfaHatasi !== '') {
    return <HataKutusu mesaj={sayfaHatasi} />;
  }


  // ================= EKRAN =================

  return (
    <div>
      <h1 className="sayfa-baslik">Hesabım</h1>

      <p className="sayfa-altyazi">
        Kendi profil bilgilerini ve şifreni buradan yönetebilirsin
      </p>

      <div className="hesabim-izgara">

        {/* ================= SOL: PROFİL ================= */}
        <div className="hesabim-kart">
          <div className="hesabim-kart-baslik">👤 Profil Bilgileri</div>
          <div className="hesabim-kart-altyazi">
            Ad soyadını güncelleyebilirsin
          </div>

          {/* ---- SALT OKUNUR BİLGİLER ---- */}
          <div style={{ marginBottom: 22 }}>
            <div className="hesabim-bilgi-satir">
              <span className="hesabim-bilgi-etiket">Rol</span>
              <span className="hesabim-rol">
                {/* ?? yerine || olmaz mıydı? Burada fark etmez çünkü
                    rol asla boş string olmuyor. Ama ?? alışkanlığı
                    doğru: sadece null/undefined'ı yakalar. */}
                {ROL_ADLARI[profil.role] ?? profil.role}
              </span>
            </div>

            <div className="hesabim-bilgi-satir">
              <span className="hesabim-bilgi-etiket">Üyelik</span>
              <span className="hesabim-bilgi-deger">
                {tarihBicimle(profil.createdAt)}
              </span>
            </div>
          </div>

          {profilBasari !== '' && (
            <div className="hesabim-basari">{profilBasari}</div>
          )}

          <form onSubmit={profilKaydet}>
            <div className="hesabim-alan">
              <label className="hesabim-etiket">Ad Soyad</label>

              <input
                className="hesabim-input"
                type="text"
                value={adSoyad}
                onChange={(e) => {
                  setAdSoyad(e.target.value);
                  if (profilHatasi) setProfilHatasi('');
                  if (profilBasari) setProfilBasari('');
                }}
                minLength={2}
                maxLength={100}
                required
              />
            </div>

            {/* ---- E-POSTA: KİLİTLİ ---- */}
            {/* Alanı hiç göstermemek "acaba nerede" sorusu yaratır.
                Kilitli gösterip sebebini yazmak durumu net söyler.
                Kupon formundaki kod alanıyla aynı yaklaşım. */}
            <div className="hesabim-alan">
              <label className="hesabim-etiket">E-posta</label>

              <input
                className="hesabim-input"
                type="text"
                value={profil.email}
                /* readOnly, disabled DEĞİL:
                   disabled → metin seçilip kopyalanamaz
                   readOnly → görünür ve kopyalanabilir, sadece değişmez
                   Adminin e-postasını kopyalayabilmesi işine yarar. */
                readOnly
              />

              <div className="hesabim-ipucu">
                E-posta adresi değiştirilemiyor. Adres kimlik doğrulama
                anahtarı olduğu için değiştirmek yeni bir doğrulama akışı
                gerektiriyor (yeni adrese onay maili, bekleyen değişiklik
                durumu, benzersizlik kontrolü).
              </div>
            </div>

            {profilHatasi !== '' && (
              <div style={{ marginBottom: 16 }}>
                <HataKutusu mesaj={profilHatasi} />
              </div>
            )}

            <Buton
              type="submit"
              disabled={!profilDegistiMi || profilKaydediliyor}
            >
              {profilKaydediliyor ? 'Kaydediliyor...' : '💾 Kaydet'}
            </Buton>
          </form>
        </div>


        {/* ================= SAĞ: ŞİFRE ================= */}
        <div className="hesabim-kart">
          <div className="hesabim-kart-baslik">🔒 Şifre Değiştir</div>
          <div className="hesabim-kart-altyazi">
            Güvenliğin için mevcut şifreni de istiyoruz
          </div>

          {/* Kullanıcıya NE OLACAĞINI önceden söylüyoruz.
              "Şifre değişti, neden çıkış yaptım?" sorusu doğmasın. */}
          <div className="hesabim-bilgi-kutu">
            <span>🛡️</span>
            <span>
              Şifre değişince <b>diğer tüm cihaz ve tarayıcılardaki</b>{' '}
              oturumlar kapatılır. Bu oturumun açık kalmaya devam eder.
            </span>
          </div>

          {sifreBasari !== '' && (
            <div className="hesabim-basari">{sifreBasari}</div>
          )}

          <form onSubmit={sifreKaydet}>
            <div className="hesabim-alan">
              <label className="hesabim-etiket">Mevcut Şifre</label>
              <input
                className="hesabim-input"
                type="password"
                value={eskiSifre}
                onChange={(e) => {
                  setEskiSifre(e.target.value);
                  if (sifreHatasi) setSifreHatasi('');
                  if (sifreBasari) setSifreBasari('');
                }}
                /* autoComplete ipuçları: tarayıcının şifre yöneticisine
                   hangi alanın ne olduğunu söylüyor. Böylece kayıtlı
                   şifreyi doğru kutuya doldurur ve yeni şifreyi
                   güncellemeyi teklif eder. */
                autoComplete="current-password"
                required
              />
            </div>

            <div className="hesabim-alan">
              <label className="hesabim-etiket">Yeni Şifre</label>
              <input
                className="hesabim-input"
                type="password"
                value={yeniSifre}
                onChange={(e) => {
                  setYeniSifre(e.target.value);
                  if (sifreHatasi) setSifreHatasi('');
                  if (sifreBasari) setSifreBasari('');
                }}
                minLength={MIN_SIFRE}
                autoComplete="new-password"
                required
              />
              <div className="hesabim-ipucu">
                En az {MIN_SIFRE} karakter.
              </div>
            </div>

            <div className="hesabim-alan">
              <label className="hesabim-etiket">Yeni Şifre (Tekrar)</label>
              <input
                className="hesabim-input"
                type="password"
                value={yeniTekrar}
                onChange={(e) => {
                  setYeniTekrar(e.target.value);
                  if (sifreHatasi) setSifreHatasi('');
                }}
                minLength={MIN_SIFRE}
                autoComplete="new-password"
                required
              />
            </div>

            {sifreHatasi !== '' && (
              <div style={{ marginBottom: 16 }}>
                <HataKutusu mesaj={sifreHatasi} />
              </div>
            )}

            <Buton
              type="submit"
              disabled={!sifreHepsiDolu || sifreKaydediliyor}
            >
              {sifreKaydediliyor ? 'Değiştiriliyor...' : '🔒 Şifreyi Değiştir'}
            </Buton>
          </form>
        </div>

      </div>
    </div>
  );
}