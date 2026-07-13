import { TOKEN_ANAHTAR, KULLANICI_ANAHTAR } from './config';

// ============================================
// Tarayıcının kasası: localStorage
// Sayfa yenilense/kapansa bile içindekiler durur.
// Mobildeki SecureStore'un web karşılığı.
// ============================================

// --- TOKEN ---
export function tokenKaydet(token) {
  localStorage.setItem(TOKEN_ANAHTAR, token);
}

export function tokenAl() {
  return localStorage.getItem(TOKEN_ANAHTAR); // yoksa null döner
}

export function tokenSil() {
  localStorage.removeItem(TOKEN_ANAHTAR);
}

// --- KULLANICI ({ fullName, role }) ---
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