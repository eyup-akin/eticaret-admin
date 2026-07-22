import { API_URL } from './config';
import {
  tokenAl, tokenKaydet,
  refreshTokenAl, refreshTokenKaydet,
  oturumuTemizle,
} from './tokenStorage';

// ============================================
// AuthContext açılışta buraya kendi çıkış fonksiyonunu bırakır.
// Oturum gerçekten düştüğünde onu çağırıp React state'ini de temizleriz.
//
// NEDEN BÖYLE? api.js düz bir modül, React bileşeni değil — içinden
// useAuth() çağıramayız. O yüzden fonksiyonu dışarıdan "kaydettiriyoruz".
// ============================================
let oturumBittiBildir = null;

export function oturumBittiKaydet(fonksiyon) {
  oturumBittiBildir = fonksiyon;
}

// ============================================
// ⭐ TEK REFRESH KİLİDİ
// Aynı anda birçok istek 401 yerse HEPSİ ayrı ayrı refresh denemesin diye
// tek bir yenileme işlemi tutuyoruz; diğerleri onu bekler.
//
// NEDEN ŞART? Refresh "rotating" — ilk yenileme eski token'ı iptal eder.
// İkinci istek o iptalli token'la /refresh'e giderse sunucu "hırsızlık"
// sanıp TÜM oturumu uçurur. Tek işlem paylaşınca bu çakışma yaşanmaz.
// ============================================
let yenilemeIslemi = null;

// Refresh token ile taze access + taze refresh alır, kasaya yazar.
// true = yenilendi, false = yenilenemedi (refresh yok/geçersiz/ağ hatası).
async function tokenYenile() {
  const refresh = refreshTokenAl(); // senkron — await yok

  if (!refresh) {
    return false;
  }

  let cevap;

  try {
    // Bu isteği apiIstek'ten GEÇİRMİYORUZ — sonsuz döngüye girerdi
    // (401 → yenile → 401 → yenile...). Düz fetch kullanıyoruz.
    cevap = await fetch(API_URL + '/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: refresh }),
    });
  } catch {
    return false; // ağ hatası
  }

  if (!cevap.ok) {
    return false; // refresh geçersiz / süresi dolmuş / iptal edilmiş
  }

  const veri = await cevap.json();

  tokenKaydet(veri.token);
  refreshTokenKaydet(veri.refreshToken); // rotation: yenisini üzerine yaz

  return true;
}

// Oturumu tamamen kapatır: kasayı boşalt + AuthContext'e haber ver.
function oturumuKapat() {
  oturumuTemizle();

  if (oturumBittiBildir) {
    oturumBittiBildir();
  }
}

// ============================================
// Bütün istekler buradan geçer.
// Token'ı otomatik ekler, 401'de sessiz yenileme yapar.
//
// yenidenDenendi: bu istek yenilemeden sonra bir kez tekrarlandı mı?
//                 (sonsuz döngü kalkanı)
// ============================================
export async function apiIstek(yol, secenekler = {}, yenidenDenendi = false) {
  const token = tokenAl();

  // ⚠️ ÖNEMLİ TUZAK:
  // FormData (dosya) gönderirken Content-Type'ı ELLE KOYMA!
  // Tarayıcı onu kendisi ayarlamalı, çünkü sonuna bir "boundary" eklemesi gerekir:
  //    multipart/form-data; boundary=----WebKitFormBoundaryX7Yz...
  // Biz elle "multipart/form-data" yazarsak boundary olmaz, sunucu dosyayı çözemez.
  const formVeriMi = secenekler.body instanceof FormData;

  const headers = {
    ...(formVeriMi ? {} : { 'Content-Type': 'application/json' }),
    ...(secenekler.headers || {}),
  };

  // Token varsa "bilek bandını" isteğe iliştir
  if (token) {
    headers['Authorization'] = 'Bearer ' + token;
  }

  let cevap;

  try {
    cevap = await fetch(API_URL + yol, { ...secenekler, headers });
  } catch {
    // Buraya düşüyorsa: backend kapalı veya adres yanlış
    throw new Error('Sunucuya ulaşılamadı. Backend çalışıyor mu?');
  }

  // login/refresh/logout gibi /auth/ istekleri "oturum düştü" mantığından muaf:
  // oradaki 401 "şifre yanlış" / "hesabın kilitli" demek, "access bayat" değil.
  const authIstegi = yol.startsWith('/auth/');

  // ---------- ACCESS BAYATLADI → SESSİZCE YENİLE ----------
  if (cevap.status === 401 && !authIstegi && !yenidenDenendi) {
    // Yenileme sürüyorsa ona katıl; yoksa başlat.
    // finally: iş bitince kilidi bırak ki bir sonraki sefer çalışabilsin.
    if (!yenilemeIslemi) {
      yenilemeIslemi = tokenYenile().finally(() => { yenilemeIslemi = null; });
    }

    const basarili = await yenilemeIslemi;

    if (basarili) {
      // Taze access ile isteği AYNEN bir kez tekrarla.
      return apiIstek(yol, secenekler, true);
    }

    // Yenileyemedik → oturumu kapat.
    oturumuKapat();
    throw new Error('Oturumun sona erdi. Lütfen tekrar giriş yapın.');
  }

  // Backend'in gönderdiği metni JSON'a çevirmeye çalış
  const metin = await cevap.text();
  let veri = null;

  if (metin) {
    try {
      veri = JSON.parse(metin);
    } catch {
      veri = metin;
    }
  }

  // Yenilemeden SONRA hâlâ 401 ise (yenidenDenendi=true durumu) → gerçekten düştük.
  if (cevap.status === 401 && !authIstegi) {
    oturumuKapat();
    throw new Error('Oturumun sona erdi. Lütfen tekrar giriş yapın.');
  }

  // 403 artık ÇIKIŞA ATMIYOR. 403 = "kimliğin geçerli ama bu işe yetkin yok"
  // (örn. admin'in superadmin işine el atması). Oturum sağlam, sadece bu iş
  // yasak. Aşağıdaki genel bloğa düşüp backend'in gerçek mesajını gösterir.
  if (!cevap.ok) {
    const hataMesaji = veri && veri.mesaj ? veri.mesaj : 'Bir hata oluştu';
    throw new Error(hataMesaji);
  }

  return veri;
}

// ---------- KISA YOLLAR ----------
// Ekranlarda hep bunları kullanıyoruz; imzaları DEĞİŞMEDİ.
export function apiGet(yol) {
  return apiIstek(yol, { method: 'GET' });
}

export function apiPost(yol, govde) {
  return apiIstek(yol, { method: 'POST', body: JSON.stringify(govde) });
}

export function apiPut(yol, govde) {
  return apiIstek(yol, { method: 'PUT', body: JSON.stringify(govde) });
}

export function apiDelete(yol) {
  return apiIstek(yol, { method: 'DELETE' });
}

// Dosya yükleme — backend [FromForm] IFormFile bekliyor
export function apiYukle(yol, dosya, alanAdi = 'dosya') {
  const govde = new FormData();
  govde.append(alanAdi, dosya);

  return apiIstek(yol, { method: 'POST', body: govde });
}