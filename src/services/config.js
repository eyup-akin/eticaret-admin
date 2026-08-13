// ============================================
// Sunucu adresi TEK YERDE durur.
//
// ⭐ DEĞİŞTİ — artık IP değil, TAM ADRES tutuluyor.
//
// Eskiden 'http://' + IP + ':5289' kuruluyordu; şema ve port koda
// gömülüydü, dolayısıyla HTTPS'li bir alan adına geçmek imkânsızdı.
// ============================================

// Boş bırakılırsa adresler GÖRELİ olur (/api/..., /uploads/...).
// Panel API ile aynı origin'den servis edildiğinde doğrusu bu:
// CORS tamamen devreden çıkar ve adres değişince yeniden derlemek
// gerekmez. Üretim derlemesi (.env.production) bilerek boş.
const TABAN = import.meta.env.VITE_API_TABAN ?? '';

// ⚠️ Geliştirmede Vite 5173'te, API başka portta — göreli adres
// Vite'ın kendisine gider ve 404 alırsın. O yüzden dev'de yedek var.
const YEDEK = import.meta.env.DEV ? 'http://localhost:5289' : '';

// Sunucunun kökü — resim adresleri için (/uploads/... buna eklenir)
export const SUNUCU_URL = TABAN || YEDEK;

// API'nin kökü
export const API_URL = SUNUCU_URL + '/api';

// Token'ı tarayıcıda hangi isimle saklayacağız
export const TOKEN_ANAHTAR = 'admin_token';
export const KULLANICI_ANAHTAR = 'admin_kullanici';
export const REFRESH_ANAHTAR = 'admin_refresh';
