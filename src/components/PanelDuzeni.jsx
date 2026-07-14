import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTema } from '../context/TemaContext';
import './PanelDuzeni.css';

// Sol menüdeki 6 ana ekran (plan dosyasındaki liste)
const MENU = [
  { yol: '/',           ikon: '📊', yazi: 'Dashboard' },
  { yol: '/urunler',    ikon: '📦', yazi: 'Ürünler' },
  { yol: '/kategoriler',ikon: '🏷️', yazi: 'Kategoriler' },
  { yol: '/siparisler', ikon: '🧾', yazi: 'Siparişler' },
  { yol: '/odemeler',   ikon: '💳', yazi: 'Ödemeler / Gelir' },
  { yol: '/kullanicilar', ikon: '👥', yazi: 'Kullanıcılar' },
];

export default function PanelDuzeni() {
  const { kullanici, cikisYap } = useAuth();
  const { temaAdi, temayiDegistir } = useTema();

  return (
    <div className="panel">

      {/* ---------- SOL MENÜ ---------- */}
      <aside className="yan-menu">
        <div className="yan-menu-logo">🛒 E-Ticaret</div>

        {MENU.map((oge) => (
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