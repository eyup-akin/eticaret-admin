// ============================================
// Sunucu adresi TEK YERDE durur.
// ============================================

// Sunucunun kökü — resim adresleri için lazım (/uploads/... buna eklenecek)
export const SUNUCU_URL = 'http://localhost:5289';

// API'nin kökü
export const API_URL = SUNUCU_URL + '/api';

// Token'ı tarayıcıda hangi isimle saklayacağız
export const TOKEN_ANAHTAR = 'admin_token';
export const KULLANICI_ANAHTAR = 'admin_kullanici';

// Refresh token'ın localStorage'daki anahtarı.
// Access ile aynı kutuda durmuyor; ayrı anahtar = ayrı ömür, ayrı silme.
export const REFRESH_ANAHTAR = 'admin_refresh';