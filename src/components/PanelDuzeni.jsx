import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTema } from '../context/TemaContext';
import { rolYeterliMi } from '../utils/roller';
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
];

export default function PanelDuzeni() {
  const { kullanici, cikisYap } = useAuth();
  const { temaAdi, temayiDegistir } = useTema();

  // Kullanıcının rolüne göre menüyü süz.
  // Türetilmiş değer — state'te tutmuyoruz, her render'da hesaplanıyor.
  const gorunenMenu = MENU.filter((oge) =>
    rolYeterliMi(kullanici?.role, oge.gerekenRol)
  );

  return (
    <div className="panel">

      {/* ---------- SOL MENÜ ---------- */}
      <aside className="yan-menu">
        <div className="yan-menu-logo">🛒 E-Ticaret</div>

        {gorunenMenu.map((oge) => (
          <NavLink
            key={oge.yol}
            to={oge.yol}
            end={oge.yol === '/'}
            className="menu-link"
          >
            <span className="menu-ikon">{oge.ikon}</span>
            <span>{oge.yazi}</span>
          </NavLink>
        ))}
      </aside>

      {/* ---------- SAĞ TARAF ---------- */}
      <div className="panel-sag">

        <header className="ust-bar">
          <span className="ust-bar-isim">
            Hoş geldin, <b>{kullanici?.fullName}</b>
          </span>

          <button className="ust-buton" onClick={temayiDegistir}>
            {temaAdi === 'acik' ? '🌙 Koyu' : '☀️ Açık'}
          </button>

          <button className="ust-buton cikis-buton" onClick={cikisYap}>
            Çıkış
          </button>
        </header>

        {/* Aktif sayfa buraya yerleşir */}
        <main className="icerik">
          <Outlet />
        </main>

      </div>
    </div>
  );
}