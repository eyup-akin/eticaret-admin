import { TOKEN_ANAHTAR, KULLANICI_ANAHTAR, REFRESH_ANAHTAR } from './config';

// ============================================
// Tarayıcının kasası: localStorage
// Sayfa yenilense/kapansa bile içindekiler durur.
// Mobildeki SecureStore'un web karşılığı.
//
// ⚠️ MOBİLDEN TEK FARK: localStorage SENKRON çalışır.
// Mobilde "await tokenAl()" yazıyorduk, burada düz "tokenAl()".
// ============================================

// --- ACCESS TOKEN (15 dakika) ---
export function tokenKaydet(token) {
  localStorage.setItem(TOKEN_ANAHTAR, token);
}

export function tokenAl() {
  return localStorage.getItem(TOKEN_ANAHTAR); // yoksa null döner
}

export function tokenSil() {
  localStorage.removeItem(TOKEN_ANAHTAR);
}

// --- REFRESH TOKEN (30 gün) --- ⭐ YENİ
// Bu token istekle birlikte GİTMEZ; sadece /auth/refresh'e gönderilir.
// Backend onun SHA-256 hash'ini saklıyor, ham hâlini biz tutuyoruz.
export function refreshTokenKaydet(token) {
  localStorage.setItem(REFRESH_ANAHTAR, token);
}

export function refreshTokenAl() {
  return localStorage.getItem(REFRESH_ANAHTAR);
}

export function refreshTokenSil() {
  localStorage.removeItem(REFRESH_ANAHTAR);
}

// --- KULLANICI ({ id, fullName, role }) ---
// localStorage sadece METİN saklar,
// o yüzden nesneyi JSON'a çevirip koyuyoruz.
export function kullaniciKaydet(kullanici) {
  localStorage.setItem(KULLANICI_ANAHTAR, JSON.stringify(kullanici));
}

export function kullaniciAl() {
  const metin = localStorage.getItem(KULLANICI_ANAHTAR);

  if (!metin) {
    return null;
  }

  try {
    return JSON.parse(metin);
  } catch {
    return null; // bozuk kayıt varsa yok say
  }
}

export function kullaniciSil() {
  localStorage.removeItem(KULLANICI_ANAHTAR);
}

// --- OTURUMU TEMİZLE --- ⭐ YENİ
// Çıkışta üç anahtarı da siler.
//
// ⚠️ localStorage.clear() KULLANMIYORUZ. clear() TÜM localStorage'ı siler —
// TemaContext'in sakladığı 'admin_tema' anahtarı da dahil. Yani her oturum
// düşüşünde kullanıcının koyu/açık tema tercihi de uçuyordu.
// Hedefli silme = sadece bizim anahtarlarımız gider.
export function oturumuTemizle() {
  tokenSil();
  refreshTokenSil();
  kullaniciSil();
}