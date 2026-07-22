import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { apiPost } from '../services/api';
import './KimlikSayfalari.css';

export default function SifreYenileSayfasi() {
  // URL'deki ?token=... değerini okur.
  // Adres:  http://localhost:5173/sifre-yenile?token=aX9k2mQ...
  const [aramaParametreleri] = useSearchParams();
  const token = aramaParametreleri.get('token'); // yoksa null

  const navigate = useNavigate();

  const [yeniSifre, setYeniSifre] = useState('');
  const [tekrarSifre, setTekrarSifre] = useState('');
  const [hata, setHata] = useState('');
  const [basari, setBasari] = useState('');
  const [gonderiliyor, setGonderiliyor] = useState(false);

  // ---------- BAŞARIDAN SONRA OTOMATİK YÖNLENDİRME ----------
  // Token tek kullanımlık: kullanıcı burada F5'e basarsa ikinci istek
  // "link geçersiz" hatası verir. O yüzden 3 saniye sonra giriş sayfasına alıyoruz.
  useEffect(() => {
    if (basari === '') {
      return; // henüz başarı yok, sayaç başlatma
    }

    const sayac = setTimeout(() => {
      navigate('/giris');
    }, 3000);

    // TEMİZLİK FONKSİYONU: kullanıcı 3 saniye dolmadan sayfadan çıkarsa
    // sayacı iptal et. Yoksa React "kaldırılmış bileşende işlem" uyarısı verir.
    return () => clearTimeout(sayac);
  }, [basari, navigate]);

  async function formGonder(e) {
    e.preventDefault();

    setHata('');

    // ---------- İSTEMCİ TARAFI KONTROLLER ----------
    // Bunlar backend'in yerine GEÇMEZ, sadece kullanıcıyı boşa
    // sunucuya gitmekten kurtarır (anında geri bildirim).
    if (yeniSifre.length < 6) {
      setHata('Şifre en az 6 karakter olmalı.');
      return;
    }

    if (yeniSifre !== tekrarSifre) {
      setHata('Şifreler birbiriyle uyuşmuyor.');
      return;
    }

    setGonderiliyor(true);

    try {
      // ⚠️ Alan adları backend'deki SifreYenileDto ile birebir aynı olmalı:
      // { Token, YeniSifre } → JSON'da { token, yeniSifre }
      const veri = await apiPost('/auth/reset-password', {
        token: token,
        yeniSifre: yeniSifre,
      });

      setBasari(veri.mesaj + ' Giriş sayfasına yönlendiriliyorsun...');
    } catch (err) {
      setHata(err.message);
    } finally {
      setGonderiliyor(false);
    }
  }

  // ---------- TOKEN YOKSA FORMU HİÇ GÖSTERME ----------
  // Kullanıcı adresi elle yazdıysa veya link bozuk kopyalandıysa buraya düşer.
  // Boş token'ı sunucuya göndermenin anlamı yok — baştan uyaralım.
  if (!token) {
    return (
      <div className="kimlik-kapsayici">
        <div className="kimlik-kutu">
          <h1 className="kimlik-baslik">Geçersiz Link</h1>
          <div className="kimlik-hata">
            Bu sayfaya sıfırlama linkiyle gelinmeli. Linkin tamamını
            kopyaladığından emin ol veya yeni bir link iste.
          </div>

          <Link to="/sifremi-unuttum" className="kimlik-alt-link">
            Yeni sıfırlama linki iste
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="kimlik-kapsayici">
      <form className="kimlik-kutu" onSubmit={formGonder}>
        <h1 className="kimlik-baslik">Yeni Şifre Belirle</h1>
        <p className="kimlik-altyazi">
          Yeni şifreni iki kez gir. En az 6 karakter olmalı.
        </p>

        {hata !== '' && <div className="kimlik-hata">{hata}</div>}
        {basari !== '' && <div className="kimlik-basari">{basari}</div>}

        {/* Başarılıysa formu kaldır — token zaten harcandı, tekrar denenemez */}
        {basari === '' && (
          <>
            <label className="kimlik-etiket">Yeni Şifre</label>
            <input
              className="kimlik-input"
              type="password"
              value={yeniSifre}
              onChange={(e) => setYeniSifre(e.target.value)}
              placeholder="••••••••"
              required
            />

            <label className="kimlik-etiket">Yeni Şifre (Tekrar)</label>
            <input
              className="kimlik-input"
              type="password"
              value={tekrarSifre}
              onChange={(e) => setTekrarSifre(e.target.value)}
              placeholder="••••••••"
              required
            />

            <button className="kimlik-buton" type="submit" disabled={gonderiliyor}>
              {gonderiliyor ? 'Kaydediliyor...' : 'Şifremi Değiştir'}
            </button>
          </>
        )}

        <Link to="/giris" className="kimlik-alt-link">
          ← Giriş sayfasına dön
        </Link>
      </form>
    </div>
  );
}