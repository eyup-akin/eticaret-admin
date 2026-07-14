import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import KorumaliRota from './components/KorumaliRota';
import PanelDuzeni from './components/PanelDuzeni';

import GirisSayfasi from './pages/GirisSayfasi';
import DashboardSayfasi from './pages/DashboardSayfasi';
import UrunlerSayfasi from './pages/UrunlerSayfasi';
import KategorilerSayfasi from './pages/KategorilerSayfasi';
import SiparislerSayfasi from './pages/SiparislerSayfasi';
import OdemelerSayfasi from './pages/OdemelerSayfasi';
import MusterilerSayfasi from './pages/MusterilerSayfasi';

import MusteriDetaySayfasi from './pages/MusteriDetaySayfasi';

import SiparisDetaySayfasi from './pages/SiparisDetaySayfasi';

import UrunFormSayfasi from './pages/UrunFormSayfasi';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* HERKESE AÇIK */}
        <Route path="/giris" element={<GirisSayfasi />} />

        {/* BEKÇİ — buradan aşağısı sadece admin'e açık */}
        <Route element={<KorumaliRota />}>

          {/* Sol menülü kabuk — içindeki sayfalar <Outlet />'e oturur */}
          <Route element={<PanelDuzeni />}>
            <Route path="/"                     element={<DashboardSayfasi />} />
            <Route path="/urunler"              element={<UrunlerSayfasi />} />
            <Route path="/urunler/yeni"         element={<UrunFormSayfasi />} />
            <Route path="/urunler/:id/duzenle"  element={<UrunFormSayfasi />} />
            <Route path="/kategoriler"          element={<KategorilerSayfasi />} />
            <Route path="/siparisler"           element={<SiparislerSayfasi />} />

            <Route path="/siparisler/:id" element={<SiparisDetaySayfasi />} />

            <Route path="/odemeler"             element={<OdemelerSayfasi />} />
            
            <Route path="/musteriler"           element={<MusterilerSayfasi />} />

            <Route path="/musteriler/:id" element={<MusteriDetaySayfasi />} />

          </Route>

        </Route>

        {/* Olmayan bir adres yazıldıysa → ana sayfaya at */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  );
}