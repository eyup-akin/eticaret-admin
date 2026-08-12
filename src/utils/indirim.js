// ============================================================
//  İNDİRİM GÖSTERİMİ (B1 tamamlama) — panel tarafı
//
//  Sunucu yalnızca iki sayı gönderiyor: price ve eskiFiyat.
//  "İndirim var mı" ve "yüzde kaç" soruları istemcide cevaplanıyor.
//
//  ⚠️ MOBİLDEKİ `src/utils/indirim.js` İLE AYNI KURAL.
//  Bu, kabul ettiğimiz bir kopya: iki ayrı depo, iki ayrı derleme.
//  Kâr formülünde (`kar.js`) backend için verilen kararın aynısı.
//  ⚠️ Biri değişirse İKİSİ birden değişmeli — özellikle yuvarlama
//  yönü: panelde "-%16", mobilde "-%17" görünmesi aynı ürün için
//  iki farklı indirim iddiası demektir.
//
//  ⚠️ Yüzde neden sunucudan gelmiyor? Aynı gerçek iki alanda
//  yaşasaydı, fiyat değişip yüzde bayatladığında ekranda çelişki
//  çıkardı. Tek satırlık bir bölme için ağa alan koymanın anlamı yok.
// ============================================================

/**
 * urun → { indirimliMi, eskiFiyat, yuzde }
 */
export function indirimBilgisi(urun) {
  const fiyat = Number(urun?.price) || 0;

  // ⚠️ null ile 0 farkı kritik: backend "indirim yok" durumunu null
  // ile anlatıyor, 0 yazsaydı her ürün "%100 indirimli" görünürdü.
  const ham = urun?.eskiFiyat;
  const eskiFiyat = ham === null || ham === undefined ? null : Number(ham);

  // ⚠️ "eskiFiyat > fiyat" şartı savunma amaçlı: sunucu bu kuralı
  // uyguluyor (IndirimKurali) ama panel eski bir cevabı da
  // çizebilir. Saçma bir rozet ("-%-12") göstermektense hiçbir şey
  // göstermemek doğru.
  const indirimliMi = eskiFiyat !== null && eskiFiyat > fiyat && fiyat > 0;

  if (!indirimliMi) {
    return { indirimliMi: false, eskiFiyat: null, yuzde: 0 };
  }

  // ⚠️ AŞAĞI yuvarlanıyor: 15,6'lık indirimi "%16" diye yazmak
  // olmayan bir indirim iddia etmek olur (Fiyat Etiketi Yönetmeliği).
  const yuzde = Math.floor(((eskiFiyat - fiyat) / eskiFiyat) * 100);

  // ⚠️ %1'in altında rozet yok — "-%0" bilgi değil gürültü.
  return { indirimliMi: true, eskiFiyat, yuzde: yuzde >= 1 ? yuzde : 0 };
}
