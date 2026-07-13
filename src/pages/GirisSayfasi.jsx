import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './GirisSayfasi.css';

export default function GirisSayfasi() {
  const { girisYap, token, kullanici } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [sifre, setSifre] = useState('');
  const [hata, setHata] = useState('');
  const [gonderiliyor, setGonderiliyor] = useState(false);

  // Zaten giriş yapmışsa burada oyalanma, dashboard'a git
  if (token && kullanici && kullanici.role === 'admin') {
    return <Navigate to="/" replace />;
  }

  async function formGonder(e) {
    e.preventDefault(); // sayfanın yenilenmesini engelle (web'e özel!)

    setHata('');
    setGonderiliyor(true);

    try {
      await girisYap(email, sifre);
      navigate('/'); // başarılı → dashboard'a götür
    } catch (err) {
      setHata(err.message);
    } finally {
      setGonderiliyor(false);
    }
  }

  return (
    <div className="giris-kapsayici">
      <form className="giris-kutu" onSubmit={formGonder}>
        <h1 className="giris-baslik">Admin Panel</h1>
        <p className="giris-altyazi">Yönetici hesabınızla giriş yapın</p>

        {hata !== '' && <div className="giris-hata">{hata}</div>}

        <label className="giris-etiket">E-posta</label>
        <input
          className="giris-input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@site.com"
          required
        />

        <label className="giris-etiket">Şifre</label>
        <input
          className="giris-input"
          type="password"
          value={sifre}
          onChange={(e) => setSifre(e.target.value)}
          placeholder="••••••••"
          required
        />

        <button className="giris-buton" type="submit" disabled={gonderiliyor}>
          {gonderiliyor ? 'Giriş yapılıyor...' : 'Giriş Yap'}
        </button>
      </form>
    </div>
  );
}