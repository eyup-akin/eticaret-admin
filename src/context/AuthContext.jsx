import { createContext, useContext, useState, useEffect } from 'react';
import { apiPost, oturumBittiKaydet } from '../services/api';
import {
  tokenKaydet, tokenAl,
  refreshTokenKaydet, refreshTokenAl,
  kullaniciKaydet, kullaniciAl,
  oturumuTemizle,
} from '../services/tokenStorage';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [kullanici, setKullanici] = useState(null); // { id, fullName, role }
  const [yukleniyor, setYukleniyor] = useState(true); // açılışta kasa kontrolü

  // ---------- SAYFA AÇILINCA: kasada token var mı bak ----------
  // localStorage senkron olduğu için async fonksiyona gerek yok.
  useEffect(() => {
    const kayitliToken = tokenAl();
    const kayitliKullanici = kullaniciAl();

    if (kayitliToken && kayitliKullanici) {
      setToken(kayitliToken);
      setKullanici(kayitliKullanici);
    }

    setYukleniyor(false); // kontrol bitti
  }, []);

  // ---------- OTURUM DÜŞERSE HABER AL ---------- ⭐ YENİ
  // api.js düz bir modül, React bileşeni değil — içinden useAuth() çağıramaz.
  // Bu yüzden ona bir fonksiyon "kaydediyoruz": refresh de başarısız olunca
  // bunu çağıracak ve KorumaliRota kullanıcıyı giriş ekranına atacak.
  useEffect(() => {
    oturumBittiKaydet(() => {
      setToken(null);
      setKullanici(null);
    });
  }, []);

  // ---------- GİRİŞ YAP ----------
  async function girisYap(email, sifre) {
    const veri = await apiPost('/auth/login', {
      email: email,
      password: sifre,
    });

    // Hem admin hem süper admin panele girebilir
    if (veri.role !== 'admin' && veri.role !== 'superadmin') {
      throw new Error('Bu panele sadece yöneticiler girebilir.');
    }

    const kul = { id: veri.id, fullName: veri.fullName, role: veri.role };

    tokenKaydet(veri.token);
    refreshTokenKaydet(veri.refreshToken); // ⭐ YENİ — refresh'i de sakla
    kullaniciKaydet(kul);

    setToken(veri.token);
    setKullanici(kul);
  }

  // ---------- ÇIKIŞ YAP ---------- ⭐ ARTIK ASYNC
  async function cikisYap() {
    // Sunucuya haber ver: bu cihazın refresh token'ını iptal et (gerçek çıkış).
    // Ağ hatası olsa bile yerel çıkış mutlaka olsun diye try/catch.
    try {
      const refresh = refreshTokenAl();

      if (refresh) {
        await apiPost('/auth/logout', { refreshToken: refresh });
      }
    } catch {
      // sunucuya ulaşılamasa bile aşağıda yerel kasayı boşaltıyoruz
    }

    oturumuTemizle();

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