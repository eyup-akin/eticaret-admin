// ============================================
// Sunucu adresi TEK YERDE durur.
//
// IP artık kodun içinde gömülü DEĞİL — proje kökündeki .env'den geliyor.
// Sebep: telefondan test ederken "localhost" telefonun KENDİSİ demek,
// bilgisayar değil. O yüzden ağdaki gerçek IP gerekiyor.
//
// Ağ değişince: .env'deki IP'yi düzelt + npm run dev'i yeniden başlat.
// ============================================

// Vite yalnızca VITE_ önekli değişkenleri tarayıcıya taşır.
// .env yoksa veya boşsa sağdaki yedek devreye girer (bilgisayardan geliştirme).
const IP = import.meta.env.VITE_API_IP || 'localhost';

// Sunucunun kökü — resim adresleri için lazım (/uploads/... buna eklenecek)
export const SUNUCU_URL = 'http://' + IP + ':5289';

// API'nin kökü
export const API_URL = SUNUCU_URL + '/api';

// Token'ı tarayıcıda hangi isimle saklayacağız
export const TOKEN_ANAHTAR = 'admin_token';
export const KULLANICI_ANAHTAR = 'admin_kullanici';
export const REFRESH_ANAHTAR = 'admin_refresh';