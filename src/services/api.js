import { API_URL } from './config';
import { tokenAl } from './tokenStorage';




// ============================================
// Bütün istekler buradan geçer.
// Token'ı otomatik ekler, hataları tek yerde yakalar.
// ============================================
export async function apiIstek(yol, secenekler = {}) {
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

  // Token süresi dolduysa / yetki yoksa: kasayı boşalt
  if (cevap.status === 401 || cevap.status === 403) {
    localStorage.clear();
    throw new Error('Oturum geçersiz. Lütfen tekrar giriş yapın.');
  }

  // İstek başarısızsa (400, 404, 500...) hata fırlat
  if (!cevap.ok) {
    const hataMesaji = veri && veri.mesaj ? veri.mesaj : 'Bir hata oluştu';
    throw new Error(hataMesaji);
  }

  return veri;
}

// Kısa yollar — ekranlarda hep bunları kullanacağız
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