// ============================================
// Ekranda gösterilecek verileri güzelleştiren yardımcılar.
// Tek yerde dursun ki her sayfada aynı görünsün.
// ============================================

// 5847.5  →  "5.847,50 ₺"
export function paraBicimle(sayi) {
  const deger = Number(sayi) || 0;

  return deger.toLocaleString('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2,
  });
}

// 28  →  "28"     |     1250  →  "1.250"
export function sayiBicimle(sayi) {
  const deger = Number(sayi) || 0;

  return deger.toLocaleString('tr-TR');
}

// "2026-07-13T14:30:00"  →  "13.07.2026 14:30"
export function tarihBicimle(tarihMetni) {
  if (!tarihMetni) {
    return '-';
  }

  const tarih = new Date(tarihMetni);

  return tarih.toLocaleString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// "2026-07-13"  →  "13 Tem"   (grafik ekseni için kısa tarih)
export function kisaTarih(tarihMetni) {
  const tarih = new Date(tarihMetni);

  return tarih.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'short',
  });
}


// "2026-07"  →  "Tem 2026"   (grafik ekseni için)
export function ayBicimle(ayMetni) {
  const [yil, ay] = ayMetni.split('-');
  const tarih = new Date(Number(yil), Number(ay) - 1, 1);

  return tarih.toLocaleDateString('tr-TR', {
    month: 'short',
    year: 'numeric',
  });
}

// "2026-07-13T14:30:00"  →  "13.07.2026"
//
// tarihBicimle'nin saatsiz kardeşi. Kupon geçerlilik aralığı gibi
// saatin anlamsız olduğu yerlerde kullanılır.
//
// Adı mobildeki fonksiyonla AYNI — iki katmanda aynı iş için farklı
// isim kullanmak, ilerde birini arayan kişinin diğerini bulamamasına
// yol açar.
export function gunBicimle(tarihMetni) {
  if (!tarihMetni) {
    return '-';
  }

  const tarih = new Date(tarihMetni);

  return tarih.toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}
// 0 → ""   |   3 → "3"   |   9 → "9"   |   47 → "9+"
//
// ⭐ YENİ — Bildirim rozetlerinin metni.
//
// ⚠️ NEDEN ORTAK YERE TAŞINDI?
// Kural BildirimZili'nin içinde yazılıydı ve tek tüketicisi vardı.
// Yan menüdeki rozetler ikinci tüketici oldu; ikisinde ayrı ayrı
// yazsaydık biri "9+" derken diğeri "99+" diyebilirdi ve aynı ekranda
// iki farklı eşik görünürdü.
//
// ⚠️ NEDEN 9'DAN SONRA KESİLİYOR?
// İki haneli sayı rozeti genişletir; menüde ve üst barda hizayı bozar.
// Yönetici için "9'dan fazla" ile "23" arasındaki fark eyleme
// dönüşmüyor — ikisinde de listeye gidip bakacak.
//
// Mobildeki RozetliIkon bileşeninde de aynı eşik var.
export function rozetYazisi(sayi) {
  const deger = Number(sayi) || 0;

  // ⚠️ Sıfırda BOŞ dönüyor, "0" değil.
  // "0" yazan bir rozet dikkat çeker ama hiçbir bilgi vermez; üstelik
  // her bakışta "bir şey mi var?" diye baktırır. Çağıran taraf zaten
  // sayı 0 ise rozeti hiç çizmiyor — bu, o kararın ikinci kapısı.
  if (deger <= 0) {
    return '';
  }

  return deger > 9 ? '9+' : String(deger);
}
