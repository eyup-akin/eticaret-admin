import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import { useTema } from '../context/TemaContext';

import './KullaniciMenusu.css';

// Rol kodunu okunabilir metne çevirir.
// Bileşen dışında sabit — her render'da yeniden oluşturulmasın.
const ROL_ADLARI = {
  superadmin: 'Süper Yönetici',
  admin: 'Yönetici',
};

// Panel sürümü.
//
// Neden burada duruyor? Kullanıcı hata bildirdiğinde "hangi sürümü
// kullanıyorsun" sorusunun cevabı olsun. Tek kullanıcılı bir projede
// gereksiz görünür ama ticarileştirdiğinde ilk isteyeceğin bilgi bu olur.
//
// İleride package.json'dan otomatik okunabilir (Vite'ın define ayarıyla);
// şimdilik elle güncelliyoruz.
const PANEL_SURUM = '1.0.0';

export default function KullaniciMenusu() {
  const { kullanici, cikisYap } = useAuth();
  const { temaAdi, temayiDegistir } = useTema();

  const [acik, setAcik] = useState(false);

  // ⭐ useRef nedir?
  //
  //   Bir DOM elemanına doğrudan erişmemizi sağlar. Aşağıda "tıklanan yer
  //   menünün İÇİNDE mi DIŞINDA mı" sorusunu cevaplamak için gerekli.
  //
  //   Neden useState değil? Çünkü ref değeri değişince yeniden render
  //   OLMAZ. DOM referansı görsel bir veri değil, bir işaretçi — her
  //   değişiminde ekranı yeniden çizmek gereksiz olurdu.
  const sarmalRef = useRef(null);

  // ---------- DIŞARI TIKLAYINCA KAPAT ----------
  //
  // Açılır menülerin olmazsa olmazı. Kullanıcı menüyü açtı, sonra
  // sayfanın başka bir yerine tıkladı — menü kapanmalı. Kapanmasa
  // ekranda takılı kalır ve kullanıcı tekrar butona basmak zorunda kalır.
  useEffect(() => {
    // Menü kapalıysa dinleyici kurmuyoruz.
    // Sürekli dinlemek boşa iş; kapalıyken tıklamaların bizi ilgilendiren
    // tarafı yok.
    if (!acik) {
      return;
    }

    function disariTiklandi(olay) {
      // sarmalRef.current → menünün en dış <div>'i
      // .contains(olay.target) → tıklanan eleman onun içinde mi?
      //
      // İçindeyse dokunmuyoruz (menü satırına basılmış olabilir).
      // Dışındaysa kapatıyoruz.
      if (sarmalRef.current && !sarmalRef.current.contains(olay.target)) {
        setAcik(false);
      }
    }

    function esceBasildi(olay) {
      // Klavyeyle kapatma. Açılır bir katmanın ESC ile kapanması
      // kullanıcıların beklediği davranış; olmayınca "kapanmıyor" denir.
      if (olay.key === 'Escape') {
        setAcik(false);
      }
    }

    // 'mousedown' seçtik, 'click' DEĞİL.
    //
    // Fark: mousedown fareye BASILDIĞI anda, click BIRAKILDIĞI anda tetiklenir.
    // 'click' kullansaydık, kullanıcı bir menü satırına basıp fareyi
    // kaydırarak dışarıda bıraksa tuhaf sıralamalar oluşabilirdi.
    // mousedown daha öngörülebilir.
    document.addEventListener('mousedown', disariTiklandi);
    document.addEventListener('keydown', esceBasildi);

    // ⚠️ TEMİZLİK FONKSİYONU — ATLANAMAZ.
    //
    // useEffect'in döndürdüğü fonksiyon, effect tekrar çalışmadan önce
    // ve bileşen ekrandan kalkarken çağrılır.
    //
    // Bunu yazmasaydık: menü her açıldığında document'a YENİ bir dinleyici
    // eklenir, eskiler hiç kaldırılmazdı. 20 kez açıp kapatınca 20 dinleyici
    // birikirdi — bellek sızıntısı (memory leak). Ayrıca bileşen ekrandan
    // kalktıktan sonra bile dinleyici setAcik çağırmaya çalışır.
    return () => {
      document.removeEventListener('mousedown', disariTiklandi);
      document.removeEventListener('keydown', esceBasildi);
    };
  }, [acik]);

  // Kullanıcının baş harfi — avatar yerine.
  //
  // ?. ve ?? zinciri: kullanici null olabilir (açılış anı),
  // fullName boş olabilir. charAt(0) boş metinde '' döner,
  // o yüzden son çare '?' koyuyoruz.
  const basHarf = (kullanici?.fullName ?? '').trim().charAt(0).toUpperCase() || '?';

  const rolAdi = ROL_ADLARI[kullanici?.role] ?? kullanici?.role ?? '';

  // Tema geçişi menüyü KAPATMIYOR — bilinçli.
  //
  // Kullanıcı temayı değiştirip sonucu görmek isteyebilir, hatta geri
  // almak isteyebilir. Menü kapanırsa tekrar açması gerekir.
  // Gezinme satırları (Profilim) ise menüyü kapatıyor çünkü zaten
  // başka bir sayfaya gidiyoruz.
  function temaSatiriTiklandi() {
    temayiDegistir();
  }

  async function cikisTiklandi() {
    setAcik(false);
    await cikisYap();
  }

  return (
    <div className="km-sarmal" ref={sarmalRef}>

      <button
        className={'km-buton ' + (acik ? 'km-buton-acik' : '')}
        onClick={() => setAcik(!acik)}
        /* aria-* öznitelikleri ekran okuyucular için.
           haspopup: "bu buton bir menü açıyor"
           expanded: "menü şu an açık/kapalı"
           Görsel kullanıcı bunu oktan anlıyor; görme engelli kullanıcı
           bu özniteliklerden anlıyor. */
        aria-haspopup="menu"
        aria-expanded={acik}
      >
        <span className="km-avatar">{basHarf}</span>
        <span>Profil</span>
        <span className={'km-ok ' + (acik ? 'km-ok-acik' : '')}>▼</span>
      </button>

      {/* Kapalıyken hiç çizmiyoruz.
          Alternatif: çizip CSS ile gizlemek (display: none). Onu seçmedik
          çünkü gizli de olsa DOM'da durur ve klavyeyle sekmelenebilir —
          görünmeyen bir öğeye odak gitmesi kafa karıştırıcıdır. */}
      {acik && (
        <div className="km-panel" role="menu">

          {/* ---- BAŞLIK: KİM OLDUĞUN ---- */}
          {/* Paylaşılan bilgisayarda "doğru hesapla mı girmişim?"
              sorusunun cevabı. Rol de burada çünkü ne yapabileceğini
              belirleyen şey o. */}
          <div className="km-baslik">
            <div className="km-baslik-ad">{kullanici?.fullName}</div>
            <div className="km-baslik-rol">{rolAdi}</div>
          </div>

          {/* ---- GEZİNME ---- */}
          <div className="km-grup">
            <Link
              to="/hesabim"
              className="km-satir"
              role="menuitem"
              onClick={() => setAcik(false)}
            >
              <span className="km-satir-ikon">👤</span>
              <span>Profilim</span>
            </Link>
          </div>

          {/* ---- TERCİHLER ---- */}
          <div className="km-grup">
            <button
              className="km-satir"
              role="menuitem"
              onClick={temaSatiriTiklandi}
            >
              <span className="km-satir-ikon">
                {temaAdi === 'acik' ? '🌙' : '☀️'}
              </span>
              <span>{temaAdi === 'acik' ? 'Koyu tema' : 'Açık tema'}</span>
            </button>
          </div>

          {/* ---- OTURUM ---- */}
          <div className="km-grup">
            <button
              className="km-satir km-satir-cikis"
              role="menuitem"
              onClick={cikisTiklandi}
            >
              <span className="km-satir-ikon">🚪</span>
              <span>Çıkış Yap</span>
            </button>
          </div>

          {/* ---- SÜRÜM ---- */}
          <div className="km-alt">Panel sürümü {PANEL_SURUM}</div>

        </div>
      )}
    </div>
  );
}