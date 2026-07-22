import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import KorumaliRota from './components/KorumaliRota';
import PanelDuzeni from './components/PanelDuzeni';

import GirisSayfasi from './pages/GirisSayfasi';

import SifremiUnuttumSayfasi from './pages/SifremiUnuttumSayfasi';
import SifreYenileSayfasi from './pages/SifreYenileSayfasi';

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

        {/* HERKESE AÇIK — bu üçü KorumaliRota'nın DIŞINDA olmalı.
            Sebep: şifresini unutan kişi zaten giriş yapamıyor. Bu sayfaları
            bekçinin arkasına koyarsak, girmek için giriş yapması gerekirdi. */}
        <Route path="/giris"            element={<GirisSayfasi />} />
        <Route path="/sifremi-unuttum"  element={<SifremiUnuttumSayfasi />} />
        <Route path="/sifre-yenile"     element={<SifreYenileSayfasi />} />

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
            
            <Route path="/kullanicilar"     element={<MusterilerSayfasi />} />
            <Route path="/kullanicilar/:id" element={<MusteriDetaySayfasi />} />

          </Route>

        </Route>

        {/* Olmayan bir adres yazıldıysa → ana sayfaya at */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  );
}