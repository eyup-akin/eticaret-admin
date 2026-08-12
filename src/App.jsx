import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import KorumaliRota from './components/KorumaliRota';
import PanelDuzeni from './components/PanelDuzeni';

import GirisSayfasi from './pages/GirisSayfasi';

import SifremiUnuttumSayfasi from './pages/SifremiUnuttumSayfasi';
import SifreYenileSayfasi from './pages/SifreYenileSayfasi';

import AdminBasvuruFormuSayfasi from './pages/AdminBasvuruFormuSayfasi';

import DashboardSayfasi from './pages/DashboardSayfasi';
import UrunlerSayfasi from './pages/UrunlerSayfasi';
import KategorilerSayfasi from './pages/KategorilerSayfasi';
import SiparislerSayfasi from './pages/SiparislerSayfasi';
import OdemelerSayfasi from './pages/OdemelerSayfasi';
import MusterilerSayfasi from './pages/MusterilerSayfasi';

import MusteriDetaySayfasi from './pages/MusteriDetaySayfasi';

import SiparisDetaySayfasi from './pages/SiparisDetaySayfasi';

import UrunFormSayfasi from './pages/UrunFormSayfasi';

import KuponFormSayfasi from './pages/KuponFormSayfasi';

// İskeletler — sırası gelen aşamada içleri dolacak
import KuponlarSayfasi from './pages/KuponlarSayfasi';
import RaporlarSayfasi from './pages/RaporlarSayfasi';
import DestekTalepleriSayfasi from './pages/DestekTalepleriSayfasi';
import DestekDetaySayfasi from './pages/DestekDetaySayfasi';   // ⭐ YENİ (Aşama 8)
import IadelerSayfasi from './pages/IadelerSayfasi';           // ⭐ YENİ (Aşama 9)
import SozlesmelerSayfasi from './pages/SozlesmelerSayfasi';   // ⭐ YENİ (Aşama 10)
import KombinlerSayfasi from './pages/KombinlerSayfasi';       // ⭐ YENİ
import AdminBasvurulariSayfasi from './pages/AdminBasvurulariSayfasi';

import HesabimSayfasi from './pages/HesabimSayfasi';   // ⭐ YENİ

import OturumlarimSayfasi from './pages/OturumlarimSayfasi';   // ⭐ YENİ

import DenetimKaydiSayfasi from './pages/DenetimKaydiSayfasi';

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

        {/* ⭐ YENİ — yönetici başvuru formu.
        
            Bu üçlüyle aynı sebeple bekçinin DIŞINDA: başvuran kişi
            henüz admin değil, panele giremiyor.
            
            ⚠️ Adres benzerliğine dikkat:
              /admin-basvuru      → HERKESE AÇIK form (bu)
              /admin-basvurulari  → SÜPERADMİN inceleme ekranı
            Biri tekil biri çoğul. */}
        <Route path="/admin-basvuru" element={<AdminBasvuruFormuSayfasi />} />

        {/* BEKÇİ — buradan aşağısı sadece admin ve üstüne açık */}
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

            {/* Kupon rotaları — form iki iş yapıyor:
                /kuponlar/yeni        → id yok  → oluşturma modu
                /kuponlar/5/duzenle   → id var  → düzenleme modu
                Aynı bileşen, useParams ile hangi modda olduğunu anlıyor.
                İki ayrı sayfa yazsaydık %90'ı birebir aynı olurdu. */}
            <Route path="/kuponlar"              element={<KuponlarSayfasi />} />
            <Route path="/kuponlar/yeni"         element={<KuponFormSayfasi />} />
            <Route path="/kuponlar/:id/duzenle"  element={<KuponFormSayfasi />} />
            <Route path="/raporlar"  element={<RaporlarSayfasi />} />
            <Route path="/destek"     element={<DestekTalepleriSayfasi />} />
            <Route path="/destek/:id" element={<DestekDetaySayfasi />} />
            <Route path="/iadeler"    element={<IadelerSayfasi />} />
            <Route path="/kombinler" element={<KombinlerSayfasi />} />


            {/* ⭐ YENİ — Hesabım.
                PanelDuzeni'nin İÇİNDE, yani sol menü ve üst bar korunuyor.
                Sol menüde bağlantısı YOK — üst bardaki isimden erişiliyor.
                Sebep: sol menü mağaza yönetimi için, bu sayfa kişisel. */}
            <Route path="/hesabim"   element={<HesabimSayfasi />} />

            <Route path="/oturumlarim" element={<OturumlarimSayfasi />} />


            {/* İKİNCİ BEKÇİ — sadece süperadmin.
                PanelDuzeni'nin İÇİNDE duruyor ki sol menü kaybolmasın;
                yetkisi olmayan buraya gelirse dashboard'a geri döner. */}
            <Route element={<KorumaliRota gerekenRol="superadmin" />}>
              <Route
                path="/admin-basvurulari"
                element={<AdminBasvurulariSayfasi />}
              />

              {/* ⭐ YENİ (Aşama 10) — sözleşme metinleri.
                  Süperadmin bekçisinin altında: yasal metin mağazanın
                  taahhüdü, her adminin bakması gereken bir şey değil. */}
              <Route path="/sozlesmeler" element={<SozlesmelerSayfasi />} />

              {/* ⭐ YENİ — denetim kaydı.
                  Aynı süperadmin bekçisinin altında: denetim
                  mekanizması, denetlenen kişiye kapalı olmalı. */}
              <Route
                path="/denetim-kaydi"
                element={<DenetimKaydiSayfasi />}
              />
            </Route>

          </Route>

        </Route>

        {/* Olmayan bir adres yazıldıysa → ana sayfaya at */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  );
}