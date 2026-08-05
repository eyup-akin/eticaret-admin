import { useState } from 'react';
import { Link } from 'react-router-dom';

import { apiPost } from '../services/api';
import './KimlikSayfalari.css';

// ============================================================
//  ADMİN BAŞVURU FORMU — HERKESE AÇIK
//
//  ⚠️ NEDEN KorumaliRota'NIN DIŞINDA?
//
//  Başvuran kişi henüz admin DEĞİL — panele giremiyor. Bu sayfayı
//  bekçinin arkasına koysaydık, admin olmak için başvurmak isteyen
//  birinin önce admin olması gerekirdi.
//
//  "Şifremi Unuttum" sayfasıyla aynı mantık: giriş yapamayan
//  kişinin ihtiyaç duyduğu sayfa, girişin arkasında olamaz.
//
//  ⚠️ NEDEN ŞİFRE İSTİYORUZ?
//  Sadece e-posta alsaydık herkes başkasının adına başvurabilirdi.
//  Şifre, hesabın sahibi olduğunun kanıtı.
// ============================================================
export default function AdminBasvuruFormuSayfasi() {
  const [email, setEmail] = useState('');
  const [sifre, setSifre] = useState('');
  const [gerekce, setGerekce] = useState('');

  const [hata, setHata] = useState('');
  const [basari, setBasari] = useState('');
  const [gonderiliyor, setGonderiliyor] = useState(false);

  async function formGonder(e) {
    // Sayfanın yenilenmesini engelle (web'e özel — mobilde yok)
    e.preventDefault();

    setHata('');
    setGonderiliyor(true);

    try {
      const veri = await apiPost('/auth/admin-basvuru', {
        email: email,
        sifre: sifre,
        gerekce: gerekce,
      });

      // ⚠️ Backend HER DURUMDA aynı 200'ü döndürüyor: hesap yok,
      // şifre yanlış, zaten admin, bekleyen başvuru var...
      //
      // Bu yüzden burada "hesap bulunamadı" gibi bir dal YOK.
      // Gelen mesajı olduğu gibi gösteriyoruz — user enumeration
      // koruması ön yüzde bozulamaz.
      setBasari(veri.mesaj);
    } catch (err) {
      // Buraya sadece GERÇEK hatalar düşer: ağ kopukluğu, 500,
      // rate limit (429), doğrulama hatası (gerekçe çok kısa).
      setHata(err.message);
    } finally {
      setGonderiliyor(false);
    }
  }

  return (
    <div className="kimlik-kapsayici">
      <form className="kimlik-kutu" onSubmit={formGonder}>

        <h1 className="kimlik-baslik">Yönetici Başvurusu</h1>
        <p className="kimlik-altyazi">
          Mağaza hesabınla giriş bilgilerini gir ve neden yönetici
          olmak istediğini anlat.
        </p>

        {/* ⭐ YENİ — hesap zorunluluğunu AÇIKÇA söylüyoruz.
        
            Neden gerekli? Backend güvenlik gereği HER DURUMDA aynı
            cevabı dönüyor ("Başvurunuz alındı"). Yani hesabı olmayan
            biri formu doldurup gönderiyor, yeşil mesajı görüyor ve
            bekliyor — ama hiçbir şey olmadı.
            
            Bu, tek tip cevabın kaçınılmaz bedeli: saldırgan bilgi
            alamıyor ama meşru kullanıcı da alamıyor. Cevabı
            değiştiremeyiz (sızıntı olur), ama kullanıcıyı ÖNCEDEN
            bilgilendirebiliriz. Sorunu doğduğu yerde değil,
            doğmadan önce çözüyoruz. */}
        <div className="kimlik-bilgi">
          Yöneticilik başvurusu, <b>mevcut bir mağaza hesabı</b> gerektirir.
          Hesabın yoksa önce mobil uygulamadan üye ol ve e-postanı doğrula.
        </div>

        {hata !== '' && <div className="kimlik-hata">{hata}</div>}
        {basari !== '' && <div className="kimlik-basari">{basari}</div>}

        {/* Başvuru gönderildiyse formu gizliyoruz.
            
            Açık bırakırsak kullanıcı "acaba gitti mi" diye tekrar
            gönderir; her denemesi rate limit kotasından yer. Üstelik
            ikinci başvuru zaten kabul edilmeyecek (bekleyen başvuru
            kuralı) ama aynı cevabı alacağı için bunu anlayamaz. */}
        {basari === '' && (
          <>
            <label className="kimlik-etiket">E-posta</label>
            <input
              className="kimlik-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="hesabin@mail.com"
              required
            />

            <label className="kimlik-etiket">Şifre</label>
            <input
              className="kimlik-input"
              type="password"
              value={sifre}
              onChange={(e) => setSifre(e.target.value)}
              placeholder="••••••••"
              required
            />

            <label className="kimlik-etiket">Gerekçe</label>
            <textarea
              className="kimlik-input kimlik-metin-alan"
              value={gerekce}
              onChange={(e) => setGerekce(e.target.value)}
              placeholder="Örn: Depo sorumlusuyum, stok ve sipariş takibi için panele erişmem gerekiyor."
              rows={5}

              /* minLength/maxLength ÖN YÜZ kolaylığı.
                 Gerçek doğrulama backend'deki [StringLength(1000,
                 MinimumLength = 20)] — bu form Postman'den de
                 gönderilebilir. */
              minLength={20}
              maxLength={1000}
              required
            />

            <div className="kimlik-sayac">
              {gerekce.length} / 1000
              {gerekce.length < 20 && ' — en az 20 karakter'}
            </div>

            <button
              className="kimlik-buton"
              type="submit"
              disabled={gonderiliyor}
            >
              {gonderiliyor ? 'Gönderiliyor...' : 'Başvuruyu Gönder'}
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