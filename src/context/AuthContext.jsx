import { createContext, useContext, useState, useEffect } from 'react';
import { apiPost, apiPut, oturumBittiKaydet } from '../services/api';
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


  // ---------- ⭐ YENİ — PROFİL GÜNCELLE ----------
  //
  // Ad soyad İKİ yerde saklı:
  //   1. Bu context'teki 'kullanici' state'i (üst bar ve sayfalar okuyor)
  //   2. localStorage'daki kalıcı kopya (sayfa yenilenince kaybolmaması için)
  //
  // Sayfa doğrudan apiPut çağırsaydı ikisini de güncellemeyi hatırlaması
  // gerekirdi. Unutursa F5'e basınca eski ad geri gelirdi — bulunması zor
  // bir hata. Kimlik durumunun sahibi burası.
  //
  // ⚠️ Mobildeki AuthContext'te AYNI mantık var. İki katmanda aynı işi
  //    aynı isimle yapmak bilinçli — birini okuyan diğerini de anlar.
  async function profilGuncelle(adSoyad) {
    const veri = await apiPut('/auth/profil', { fullName: adSoyad });

    // Sunucunun döndürdüğü değeri kullanıyoruz, kullanıcının yazdığını DEĞİL.
    // Sunucu Trim() uyguluyor; "  Ali  " gönderdiysek "Ali" dönüyor.
    const guncel = {
      id: veri.id,
      fullName: veri.fullName,
      role: veri.role,
    };

    // localStorage senkron — await gerekmiyor (mobildeki SecureStore async'ti).
    kullaniciKaydet(guncel);
    setKullanici(guncel);

    return veri;
  }

  // ---------- ⭐ YENİ — ŞİFRE DEĞİŞTİR ----------
  //
  // ⚠️ TOKEN KAYDETME ZORUNLU, İSTEĞE BAĞLI DEĞİL.
  //
  //   Backend şifre değişince:
  //     · Tüm refresh token'ları iptal ediyor
  //     · SecurityStamp'i yeniliyor → eldeki access token ANINDA ölüyor
  //     · Bu oturum için YENİ token çifti üretip cevapta döndürüyor
  //
  //   Yeni token'ları kaydetmezsek:
  //     sonraki istek → ölü access token → 401
  //       → api.js sessiz yenileme dener → İPTAL EDİLMİŞ refresh token
  //       → backend bunu TOKEN HIRSIZLIĞI sanar (reuse detection)
  //       → oturum uçar, admin giriş ekranına düşer
  //
  //   Yani kendi güvenlik korumamız kendi kullanıcımızı vurur.
  async function sifreDegistir(eskiSifre, yeniSifre) {
    const veri = await apiPost('/auth/change-password', {
      eskiSifre: eskiSifre,
      yeniSifre: yeniSifre,
    });

    // Taze token çiftini kasaya yaz.
    tokenKaydet(veri.token);
    refreshTokenKaydet(veri.refreshToken);

    // React state'ini de güncelle — kasada yeni, state'te eski token
    // kalmasın. api.js kasadan okuyor ama KorumaliRota state'e bakıyor;
    // iki gerçek bırakmıyoruz.
    setToken(veri.token);

    return veri;
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
    <AuthContext.Provider
      value={{
        token,
        kullanici,
        yukleniyor,
        girisYap,
        cikisYap,

        // ⭐ YENİ
        profilGuncelle,
        sifreDegistir,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}