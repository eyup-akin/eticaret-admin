import { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiPost } from '../services/api';
import './KimlikSayfalari.css';

export default function SifremiUnuttumSayfasi() {
  const [email, setEmail] = useState('');
  const [hata, setHata] = useState('');
  const [basari, setBasari] = useState('');       // backend'in dönen mesajı
  const [gonderiliyor, setGonderiliyor] = useState(false);

  async function formGonder(e) {
    e.preventDefault(); // sayfanın yenilenmesini engelle (web'e özel!)

    setHata('');
    setBasari('');
    setGonderiliyor(true);

    try {
      const veri = await apiPost('/auth/forgot-password', { email: email });

      // ⚠️ Backend email kayıtlı OLSA DA OLMASA DA aynı 200'ü döndürür
      // (user enumeration koruması). Bu yüzden burada "bulunamadı" gibi
      // bir dal YOK — gelen mesajı olduğu gibi gösteriyoruz.
      setBasari(veri.mesaj);
    } catch (err) {
      // Buraya sadece gerçek hatalar düşer: ağ kopukluğu, 500, rate limit...
      setHata(err.message);
    } finally {
      setGonderiliyor(false);
    }
  }

  return (
    <div className="kimlik-kapsayici">
      <form className="kimlik-kutu" onSubmit={formGonder}>
        <h1 className="kimlik-baslik">Şifremi Unuttum</h1>
        <p className="kimlik-altyazi">
          Hesabının e-posta adresini gir, sıfırlama linkini gönderelim.
        </p>

        {hata !== '' && <div className="kimlik-hata">{hata}</div>}
        {basari !== '' && <div className="kimlik-basari">{basari}</div>}

        {/* Link gönderildiyse formu gizle — kullanıcı üst üste tıklamasın.
            Her tıklama yeni token üretir ve öncekini geçersiz kılar; kullanıcı
            eski maildeki linke tıklarsa "geçersiz link" hatası alır. */}
        {basari === '' && (
          <>
            <label className="kimlik-etiket">E-posta</label>
            <input
              className="kimlik-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@site.com"
              required
            />

            <button className="kimlik-buton" type="submit" disabled={gonderiliyor}>
              {gonderiliyor ? 'Gönderiliyor...' : 'Sıfırlama Linki Gönder'}
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