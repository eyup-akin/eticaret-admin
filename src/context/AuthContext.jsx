import { createContext, useContext, useState, useEffect } from 'react';
import { apiPost } from '../services/api';
import {
  tokenKaydet, tokenAl, tokenSil,
  kullaniciKaydet, kullaniciAl, kullaniciSil,
} from '../services/tokenStorage';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [kullanici, setKullanici] = useState(null); // { fullName, role }
  const [yukleniyor, setYukleniyor] = useState(true); // açılışta kasa kontrolü

  // SAYFA AÇILINCA: kasada token var mı bak (BEKÇİNİN İLK İŞİ)
  useEffect(() => {
    const kayitliToken = tokenAl();
    const kayitliKullanici = kullaniciAl();

    if (kayitliToken && kayitliKullanici) {
      setToken(kayitliToken);
      setKullanici(kayitliKullanici);
    }

    setYukleniyor(false); // kontrol bitti
  }, []);

  // GİRİŞ YAP
  async function girisYap(email, sifre) {
    const veri = await apiPost('/auth/login', {
      email: email,
      password: sifre,
    });

    // ⭐ ADMIN PANELE ÖZEL KURAL: müşteri buraya giremez
    if (veri.role !== 'admin') {
      throw new Error('Bu panele sadece admin girebilir.');
    }

    const kul = { fullName: veri.fullName, role: veri.role };

    tokenKaydet(veri.token);
    kullaniciKaydet(kul);

    setToken(veri.token);
    setKullanici(kul);
  }

  // ÇIKIŞ YAP
  function cikisYap() {
    tokenSil();
    kullaniciSil();

    setToken(null);
    setKullanici(null);
  }

  return (
    <AuthContext.Provider value={{ token, kullanici, yukleniyor, girisYap, cikisYap }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}