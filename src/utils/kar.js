// ============================================================
//  KÂR HESABI — TEK DOĞRU KAYNAK
//
//  ⚠️ NEDEN AYRI DOSYA?
//
//  Bu formül panelde ÜÇ yerde kullanılıyordu ve üçü de birbirinden
//  habersiz kopyalardı:
//    1) UrunlerSayfasi'ndaki urunKari()
//    2) UrunlerSayfasi'ndaki "kâra göre sırala" (aynı formül, ikinci kopya)
//    3) UrunFormSayfasi'ndaki canlı önizleme
//
//  KDV eklendiğinde ilk ikisi güncellenmeyi ATLADI ve liste ekranı
//  aylarca yanlış kâr göstermeye devam edecekti. Hiçbir hata mesajı
//  çıkmazdı — sadece rakam yanlış olurdu.
//
//  "İki yerde yazılan gerçek er ya da geç ikiye ayrılır."
//
//  ⚠️ BACKEND'DE DE AYNI FORMÜL VAR (ReportsController).
//  Onu buraya taşıyamayız — farklı dil, farklı çalışma ortamı.
//  Bu, kabul ettiğimiz tek kopya. Değiştirilirse İKİSİ birden
//  değiştirilmeli; bu yüzden her iki tarafa da bu notu düştük.
// ============================================================

// KDV DAHİL fiyat ve maliyetten NET kârı hesaplar.
//
// ⚠️ FİYAT VE MALİYETİN İKİSİ DE KDV DAHİLDİR.
//
// Mağaza satışta topladığı KDV'yi devlete öder, alışta ödediğini
// indirir. Aradaki fark mağazanın cebinden çıkar — yani kâr değildir.
//
//     net KDV = (fiyat − maliyet) × oran / (100 + oran)
//     kâr     = fiyat − maliyet − net KDV
//
// Örnek: 1.200 fiyat, 800 maliyet, %20
//     Ham fark : 400,00
//     net KDV  :  66,67
//     Kâr      : 333,33
//
// Maliyet girilmemişse null döner — 0 DEĞİL. Sıfır "maliyeti yok"
// demek olurdu ve kâr = fiyat çıkardı, yani %100 marj. Uydurma bir
// rakam göstermektense "bilinmiyor" demek doğru.
//
// oran verilmezse 20 varsayılır: ProductDto'da vatRate her zaman
// dolu geliyor ama eski bir API sürümüne karşı savunmacı olmak
// bedava. 0 varsaysaydık KDV hiç düşülmez ve kâr şişerdi.
export function urunKari(fiyat, maliyet, kdvOrani = 20) {
  if (maliyet == null) {
    return null;
  }

  const f = Number(fiyat);
  const m = Number(maliyet);
  const oran = Number(kdvOrani);

  if (Number.isNaN(f) || Number.isNaN(m) || Number.isNaN(oran)) {
    return null;
  }

  const hamFark = f - m;
  const netKdv = (hamFark * oran) / (100 + oran);

  return hamFark - netKdv;
}


// Devlete ödenecek net KDV — kâr dökümünde ayrı satır olarak
// gösteriliyor ki "kâr neden bu kadar?" sorusu ekranda cevaplansın.
export function netKdv(fiyat, maliyet, kdvOrani = 20) {
  if (maliyet == null) {
    return null;
  }

  const hamFark = Number(fiyat) - Number(maliyet);
  const oran = Number(kdvOrani);

  return (hamFark * oran) / (100 + oran);
}


// Kâr marjı (%).
//
// ⚠️ PAYDA KDV DAHİL FİYAT — bilinçli, backend'deki marj hesabıyla
// aynı tercih.
//
// Saf muhasebede marj KDV hariç ciroya bölünür. Burada KDV dahil
// fiyatı kullanıyoruz çünkü bu sütun ürünleri BİRBİRİYLE
// KIYASLAMAK için var, mutlak bir muhasebe rakamı olarak değil.
// Tüm satırlarda aynı payda kullanıldığı için sıralama doğru
// kalıyor; rakam sadece bir miktar muhafazakâr çıkıyor.
export function karMarji(fiyat, maliyet, kdvOrani = 20) {
  const kar = urunKari(fiyat, maliyet, kdvOrani);

  if (kar == null) {
    return null;
  }

  const f = Number(fiyat);

  // Sıfıra bölme koruması: fiyatı 0 olan ürün teorik olarak mümkün.
  if (f <= 0) {
    return 0;
  }

  return (kar / f) * 100;
}
