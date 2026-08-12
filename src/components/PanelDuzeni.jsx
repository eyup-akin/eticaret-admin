import { useState, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

import { rolYeterliMi } from '../utils/roller';

// ⭐ YENİ — çizgi ikonlar (lucide-react).
//
// ⚠️ Neden emoji bırakılmadı?
// Emoji her işletim sisteminde FARKLI çiziliyor: Windows'ta düz,
// macOS'ta parlak, Android'de bambaşka. Menü gibi her ekranda
// duran bir yerde bu tutarsızlık göze batıyor. Ayrıca emojinin
// rengi kontrol edilemiyor — tema değişince ikon aynı kalıyor.
//
// Çizgi ikonlar SVG: rengi currentColor'dan, kalınlığı prop'tan
// geliyor. Yani tema token'larına bağlanabiliyorlar.
//
// ⚠️ Tek tek import ediliyor, "import * as Icons" DEĞİL.
// Toplu import ağaç sallamayı engeller ve 1000+ ikonun tamamı
// pakete girer.
import {
  LayoutDashboard, Package, Tags, Receipt, CreditCard,
  Users, Ticket, TrendingUp, LifeBuoy, ShieldCheck, ScrollText,
  ChevronLeft, ChevronRight, Undo2, FileText,
} from 'lucide-react';

import BildirimZili from './BildirimZili';   // ⭐ YENİ

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
// ⭐ DEĞİŞTİ — "ikon" artık emoji metni değil, BİLEŞEN.
// Render sırasında <Ikon size={18} /> olarak çiziliyor.
const MENU = [
  { yol: '/',                  ikon: LayoutDashboard, yazi: 'Dashboard' },
  { yol: '/urunler',           ikon: Package,         yazi: 'Ürünler' },
  { yol: '/kategoriler',       ikon: Tags,            yazi: 'Kategoriler' },
  { yol: '/siparisler',        ikon: Receipt,         yazi: 'Siparişler' },
  { yol: '/odemeler',          ikon: CreditCard,      yazi: 'Ödemeler / Gelir' },
  { yol: '/kullanicilar',      ikon: Users,           yazi: 'Kullanıcılar' },
  { yol: '/kuponlar',          ikon: Ticket,          yazi: 'Kuponlar' },
  { yol: '/raporlar',          ikon: TrendingUp,      yazi: 'Raporlar' },
  { yol: '/destek',            ikon: LifeBuoy,        yazi: 'Destek Talepleri' },
  { yol: '/iadeler',           ikon: Undo2,           yazi: 'İade Talepleri' },
  { yol: '/sozlesmeler',       ikon: FileText,        yazi: 'Sözleşmeler',       gerekenRol: 'superadmin' },
  {
    yol: '/admin-basvurulari',
    ikon: ShieldCheck,
    yazi: 'Admin Başvuruları',
    gerekenRol: 'superadmin',
  },
  {
    yol: '/denetim-kaydi',
    ikon: ScrollText,
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

// ⭐ YENİ — rol kodunu okunabilir yazıya çevirir.
//
// Kullanıcı kartında "superadmin" değil "Süper Yönetici" yazsın diye.
// Rol kodları sistemin dili, ekranda görünen ise kullanıcının dili;
// ikisini karıştırmak paneli "geliştirici aracı" gibi gösterir.
//
// Bilinmeyen bir rol gelirse kodun kendisini gösteriyoruz — boş
// bırakmaktansa ham değeri göstermek, sorunu görünür kılıyor.
const ROL_YAZILARI = {
  superadmin: 'Süper Yönetici',
  admin: 'Yönetici',
  customer: 'Müşteri',
};

function rolYazisi(rol) {
  return ROL_YAZILARI[rol] || rol || '';
}

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

        {/* ⭐ DEĞİŞTİ — marka: "Satık"

            Eski Türkçe "satığ": satılık mal, meta, alım satım.
            Kutadgu Bilig'de geçiyor; modern "satış" ve "satmak"
            bu kökten türüyor.

            Logo işareti bir tamga gibi geometrik: "S" harfini
            çağrıştıran ama harf olmayan bir işaret. Emoji
            kullanmıyoruz — her platformda farklı çiziliyor. */}
        <div className="yan-menu-logo">
          <span className="logo-isaret" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M14.5 5.5H8.2a2.7 2.7 0 0 0 0 5.4h3.6a2.7 2.7 0 0 1 0 5.4H5.5"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <span className="logo-yazi">Satık</span>
        </div>

        {/* ⭐ DEĞİŞTİ — menü artık kendi kaydırma alanında.
            Alttaki kullanıcı kartı sabit kalsın, sadece bağlantılar
            kaysın diye ayrı bir sarmalayıcı gerekiyordu. */}
        <nav className="menu-liste">
          {gorunenMenu.map((oge) => {
            const Ikon = oge.ikon;

            return (
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
                {/* ⭐ YENİ — ikon dairesel rozet içinde (referans tasarım).

                    Rozet, ikonu menü yazısından görsel olarak ayırıyor
                    ve aktif öğede rengi değişerek ikinci bir seçim
                    işareti veriyor — yani seçim yalnızca arka plan
                    rengiyle anlatılmıyor. */}
                <span className="menu-ikon">
                  <Ikon size={17} strokeWidth={2} />
                </span>

                <span className="menu-yazi">{oge.yazi}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* ⭐ YENİ — KULLANICI KARTI (referans tasarım)

            Menünün en altında, avatar + ad + rol.

            ⚠️ Bu bir MENÜ DEĞİL, sadece kimlik göstergesi. Çıkış ve
            profil eylemleri üst bardaki KullaniciMenusu'nda kalıyor —
            aynı işi yapan iki kontrol koymuyoruz.

            Daraltılmış menüde yalnızca avatar görünüyor. */}
        <div className="menu-kullanici">
          <span className="menu-avatar" aria-hidden="true">
            {(kullanici?.fullName || '?').charAt(0).toUpperCase()}
          </span>

          <span className="menu-kullanici-metin">
            <span className="menu-kullanici-ad">{kullanici?.fullName}</span>
            <span className="menu-kullanici-rol">{rolYazisi(kullanici?.role)}</span>
          </span>
        </div>

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
            {/* ⭐ DEĞİŞTİ — « » metin karakterleri yerine ikon.
                O karakterler fontlara göre farklı yükseklikte
                çiziliyor ve butonun içinde hep bir tık kaymış
                duruyorlardı. */}
            {daraltilmis ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>

          {/* Selamlama artık BAĞLANTI DEĞİL, düz bilgi. */}
          <span className="ust-bar-isim">
            Hoş geldin, <b>{kullanici?.fullName}</b>
          </span>

          {/* ⭐ YENİ — bildirim zili.
          
              Konum: profil menüsünün SOLUNDA.
              
              Neden? Üst barın en sağı, kullanıcının kendi hesabına
              ait alan (profil, çıkış). Zil ise mağazaya ait bir
              bilgi. İkisini karıştırmamak için sınır koruyoruz.
              
              Sıralama .ust-bar'daki flex akışından geliyor:
              isim (margin-right: auto ile sola yapışık) → zil →
              profil menüsü. */}
          <BildirimZili />

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