import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// BEKÇİ:
// - Kasa kontrolü bitmediyse → bekle
// - Token yoksa → giriş ekranına fırlat
// - Token var ama admin değilse → giriş ekranına fırlat
// - Her şey tamamsa → içerideki sayfayı göster
export default function KorumaliRota() {
  const { token, kullanici, yukleniyor } = useAuth();

  // 1) Henüz localStorage'a bakılmadı — ekranı titretme, bekle
  if (yukleniyor) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        Yükleniyor...
      </div>
    );
  }

  // 2) Token yok VEYA admin değil → kapı dışarı
  const yonetici =
    kullanici &&
    (kullanici.role === 'admin' || kullanici.role === 'superadmin');

  if (!token || !yonetici) {
    return <Navigate to="/giris" replace />;
  }

  // 3) Geçebilirsin. <Outlet /> = "iç sayfa buraya gelsin"
  return <Outlet />;
}