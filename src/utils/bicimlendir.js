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