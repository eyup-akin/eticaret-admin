import { useState, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

import { rolYeterliMi } from '../utils/roller';
import KullaniciMenusu from './KullaniciMenusu';
import './PanelDuzeni.css';

// SOL MENÜ
//
// gerekenRol alanı OPSİYONEL:
//   - yoksa   → panele girebilen herkes görür
//   - varsa   → sadece o seviyedeki (ve üstündeki) roller görür
//
// ⚠️ Buradan gizlemek güvenlik değildir. Adres elle yazılabilir.
// Rota tarafında KorumaliRota, sunucu tarafında [Authorize] de olmalı.
const MENU = [
  { yol: '/',                  ikon: '📊', yazi: 'Dashboard' },
  { yol: '/urunler',           ikon: '📦', yazi: 'Ürünler' },
  { yol: '/kategoriler',       ikon: '🏷️', yazi: 'Kategoriler' },
  { yol: '/siparisler',        ikon: '🧾', yazi: 'Siparişler' },
  { yol: '/odemeler',          ikon: '💳', yazi: 'Ödemeler / Gelir' },
  { yol: '/kullanicilar',      ikon: '👥', yazi: 'Kullanıcılar' },
  { yol: '/kuponlar',          ikon: '🎟️', yazi: 'Kuponlar' },
  { yol: '/raporlar',          ikon: '📈', yazi: 'Raporlar' },
  { yol: '/destek',            ikon: '🎫', yazi: 'Destek Talepleri' },
  {
    yol: '/admin-basvurulari',
    ikon: '🛡️',
    yazi: 'Admin Başvuruları',
    gerekenRol: 'superadmin',
  },
  {
    yol: '/denetim-kaydi',
    ikon: '🔍',
    yazi: 'Denetim Kaydı',
    gerekenRol: 'superadmin',
  },
];

// ⭐ YENİ — tercih localStorage'da bu anahtarla saklanıyor.
//
// Sabit olarak dışarı çıkardık çünkü iki yerde geçiyor (okuma ve yazma).
// Birinde yazım hatası yapılsa tercih hiç hatırlanmaz ve hata sessiz
// olurdu — hiçbir yerde patlamaz, sadece çalışmaz. Sihirli metinleri
// isimlendirmek bu tür hataları imkânsız kılıyor.
const MENU_DURUM_ANAHTARI = 'panel-menu-daraltilmis';

// ⭐ YENİ — kayıtlı tercihi oku.
//
// Neden try/catch? localStorage üç durumda hata fırlatır:
//   • Tarayıcı gizli sekmede ve depolama kapalıysa
//   • Kullanıcı site verilerini engellemişse
//   • Kota dolmuşsa
// Bunlardan biri olursa panel AÇILMAMALI diye bir kural yok — menü
// tercihi kritik bir şey değil. Hata olursa varsayılana düşüyoruz.
//
// Neden 'evet' metni, neden true/false değil? localStorage sadece metin
// saklar. Boolean yazarsan "true" metnine dönüşür ve okurken
// JSON.parse ya da === 'true' karşılaştırması gerekir. Baştan metin
// kullanmak bu dönüşümü ortadan kaldırıyor.
function kayitliDurumuOku() {
  try {
    return localStorage.getItem(MENU_DURUM_ANAHTARI) === 'evet';
  } catch {
    return false;
  }
}

export default function PanelDuzeni() {
  // cikisYap artık KullaniciMenusu'nun içinde çağrılıyor.
  // Buradan sadece rol süzmesi için kullanici lazım.
  const { kullanici } = useAuth();

  // ⭐ YENİ — menü dar mı?
  //
  // ⚠️ useState'e fonksiyonu ÇAĞIRMADAN veriyoruz: kayitliDurumuOku
  // (parantezsiz). Buna "tembel başlangıç" denir — fonksiyon sadece
  // ilk render'da bir kez çalışır.
  //
  // useState(kayitliDurumuOku()) yazsaydık parantezler yüzünden fonksiyon
  // HER render'da çalışırdı. Sonuç yine doğru olurdu (React ilk değer
  // dışındakileri yok sayar) ama her tıklamada boşuna localStorage
  // okunurdu. Pahalı başlangıç hesaplarında bu fark ciddileşir.
  const [daraltilmis, setDaraltilmis] = useState(kayitliDurumuOku);

  // ⭐ YENİ — tercih değişince kaydet.
  //
  // Neden setDaraltilmis'in yanında değil de ayrı bir effect?
  // Durum ileride başka bir yerden de değişebilir (klavye kısayolu,
  // dar ekranda otomatik daralma). Kaydetme mantığını tıklama olayına
  // bağlasaydık her yeni değiştirme noktasında kaydetmeyi tekrar
  // yazmak gerekirdi. Effect "durum ne şekilde değişirse değişsin
  // kaydet" diyor — tek nokta.
  useEffect(() => {
    try {
      localStorage.setItem(MENU_DURUM_ANAHTARI, daraltilmis ? 'evet' : 'hayir');
    } catch {
      // Kaydedilemezse sorun değil — menü yine çalışır, sadece
      // yenilemede varsayılana döner. Kullanıcıyı bu yüzden
      // rahatsız etmeye değmez.
    }
  }, [daraltilmis]);

  // Kullanıcının rolüne göre menüyü süz.
  // Türetilmiş değer — state'te tutmuyoruz, her render'da hesaplanıyor.
  const gorunenMenu = MENU.filter((oge) =>
    rolYeterliMi(kullanici?.role, oge.gerekenRol)
  );

  return (
    <div className="panel">

      {/* ---------- SOL MENÜ ---------- */}
      {/* ⭐ Daraltılmış hâlde ek bir sınıf alıyor. Genişlik, hizalama ve
          yazı gizleme kararlarının hepsi CSS'te — JSX sadece "hangi
          durumdayım" bilgisini veriyor. Böylece görünüm değişikliği
          için JavaScript'e dokunmak gerekmiyor. */}
      <aside className={'yan-menu' + (daraltilmis ? ' yan-menu-dar' : '')}>

        <div className="yan-menu-logo">
          <span className="logo-ikon">🛒</span>
          <span className="logo-yazi">E-Ticaret</span>
        </div>

        {gorunenMenu.map((oge) => (
          <NavLink
            key={oge.yol}
            to={oge.yol}
            end={oge.yol === '/'}
            className="menu-link"
            /* ⭐ İpucu SADECE daraltılmışken.
               Genişken yazı zaten görünüyor; balon göstermek gereksiz
               tekrar ve fare gezdirirken can sıkıcı olurdu.
               undefined vermek özniteliği hiç eklemiyor. */
            title={daraltilmis ? oge.yazi : undefined}
          >
            <span className="menu-ikon">{oge.ikon}</span>
            <span className="menu-yazi">{oge.yazi}</span>
          </NavLink>
        ))}

      </aside>

      {/* ---------- SAĞ TARAF ---------- */}
      <div className="panel-sag">

        <header className="ust-bar">

          {/* ⭐ YENİ — daraltma butonu.
              
              Menünün İÇİNDE değil ÜST BARDA duruyor: menü 68px'e
              daraldığında logo ile aynı satıra sığmazdı ve buton yer
              değiştirirdi. Bir kontrolün yeri, kontrol ettiği şeyin
              durumuna göre kaymamalı.
              
              aria-expanded: ekran okuyucuya menünün açık mı kapalı mı
              olduğunu söylüyor. Görsel oku göremeyen kullanıcı için
              butonun ne yaptığı ancak bu şekilde anlaşılır. */}
          <button
            className="menu-daralt-buton"
            onClick={() => setDaraltilmis((onceki) => !onceki)}
            title={daraltilmis ? 'Menüyü genişlet' : 'Menüyü daralt'}
            aria-label={daraltilmis ? 'Menüyü genişlet' : 'Menüyü daralt'}
            aria-expanded={!daraltilmis}
          >
            {daraltilmis ? '»' : '«'}
          </button>

          {/* Selamlama artık BAĞLANTI DEĞİL, düz bilgi. */}
          <span className="ust-bar-isim">
            Hoş geldin, <b>{kullanici?.fullName}</b>
          </span>

          <KullaniciMenusu />
        </header>

        {/* Aktif sayfa buraya yerleşir */}
        <main className="icerik">
          <Outlet />
        </main>

      </div>
    </div>
  );
}