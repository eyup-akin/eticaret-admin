import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { rolYeterliMi } from '../utils/roller';

// BEKÇİ
//
// İki farklı iş yapar:
//   1) Panele girme hakkı var mı?  (admin veya superadmin olmalı)
//   2) Bu sayfaya özel bir rol şartı varsa onu da karşılıyor mu?
//
// Kullanımı:
//   <KorumaliRota />                       → panele giren herkes geçer
//   <KorumaliRota gerekenRol="superadmin" /> → sadece süperadmin geçer
//
// ⚠️ Bu bekçi tarayıcıda çalışır, GÜVENLİK DEĞİLDİR.
// Asıl kilit backend'deki [Authorize(Roles = "...")] özniteliğidir.
// Buradaki amaç, yetkisi olmayanı boş/hatalı ekranda bırakmamak.
export default function KorumaliRota({ gerekenRol }) {
  const { token, kullanici, yukleniyor } = useAuth();

  // 1) Henüz localStorage'a bakılmadı — ekranı titretme, bekle
  if (yukleniyor) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        Yükleniyor...
      </div>
    );
  }

  // 2) Token yok VEYA panele girecek seviyede değil → giriş ekranına
  const yonetici = rolYeterliMi(kullanici?.role, 'admin');

  if (!token || !yonetici) {
    return <Navigate to="/giris" replace />;
  }

  // 3) Sayfaya özel ek şart varsa kontrol et.
  //    Burada /giris'e ATMIYORUZ — kullanıcı zaten giriş yapmış durumda,
  //    sadece bu sayfaya yetkisi yok. Onu dashboard'a geri gönderiyoruz.
  if (!rolYeterliMi(kullanici.role, gerekenRol)) {
    return <Navigate to="/" replace />;
  }

  // 4) Geçebilirsin. <Outlet /> = "iç sayfa buraya gelsin"
  return <Outlet />;
}