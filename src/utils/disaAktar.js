// ============================================================
//  CSV DIŞA AKTARMA
//
//  NEDEN BACKEND'DE DEĞİL?
//  Rapor verisi zaten ekranda. Sunucudan istemek aynı sorguyu
//  ikinci kez çalıştırmak ve aynı mantığı iki yerde yaşatmak
//  demekti — biri değişince diğeri unutulurdu.
//
//  NEDEN GERÇEK .xlsx DEĞİL?
//  Kullanıcı bu dosyayı Excel'de açıp kendi hesabını yapacak.
//  Renk, formül, çoklu sayfa gerekmiyor. Gerçekten gerekirse
//  ClosedXML zaten projede var, o gün backend'e taşınır.
// ============================================================


// Bir hücrenin içeriğini CSV kurallarına göre kaçırır.
//
// Neden gerekli? Hücre içinde ayraç (;), tırnak (") veya satır
// sonu varsa dosya bozulur — Excel o noktadan itibaren sütunları
// yanlış sayar. Kupon açıklaması veya müşteri yorumu gibi serbest
// metinlerde bu çok olası.
//
// CSV kuralı: içeriği tırnağa al, içindeki her tırnağı ikile.
function hucreKacir(deger) {
  // null/undefined → boş hücre. "null" yazmak amatörce durur.
  if (deger === null || deger === undefined) {
    return '';
  }

  const metin = String(deger);

  // Sorunlu karakter yoksa dokunma — dosya gereksiz şişmesin.
  if (!/[";\n\r]/.test(metin)) {
    return metin;
  }

  return '"' + metin.replace(/"/g, '""') + '"';
}


// Sayıyı Excel'in Türkçe sürümünün anlayacağı biçime çevirir.
//
// ⚠️ 1234.56 yazarsak Excel TR bunu SAYI olarak tanımaz — noktayı
// binlik ayracı sanar ve hücreyi metin yapar. Toplama yapılamaz.
// Ondalık ayracı virgül olmalı: 1234,56
export function sayiCsv(deger) {
  if (deger === null || deger === undefined) {
    return '';
  }

  // toFixed(2): kuruş her zaman iki hane. Para sütunlarında
  // "12,5" ile "12,50" karışık görünmesin.
  return Number(deger).toFixed(2).replace('.', ',');
}


// ============================================================
//  ASIL FONKSİYON
//
//  basliklar : ['Ürün', 'Adet', 'Ciro']
//  satirlar  : [['Akıllı Saat', 12, '21594,00'], ...]
//  dosyaAdi  : 'satis-raporu' (uzantı otomatik eklenir)
// ============================================================
export function csvIndir(dosyaAdi, basliklar, satirlar) {
  // 1) Başlık satırı + veri satırları, hepsi kaçırılmış halde.
  //
  // ⚠️ AYRAÇ NOKTALI VİRGÜL (;), VİRGÜL DEĞİL.
  // Türkçe Windows'ta ondalık ayracı virgül olduğu için Excel
  // CSV ayracı olarak noktalı virgül bekler. Virgül kullanırsak
  // tüm satır tek hücreye yapışır.
  const satirMetinleri = [
    basliklar.map(hucreKacir).join(';'),
    ...satirlar.map((satir) => satir.map(hucreKacir).join(';')),
  ];

  // \r\n neden? Windows satır sonu. Excel \n ile de açar ama
  // Not Defteri gibi eski araçlarda tek satır görünür.
  const govde = satirMetinleri.join('\r\n');

  // 2) ⚠️ BOM — dosyanın başındaki görünmez UTF-8 işareti.
  //
  // Bu olmadan Excel dosyayı Windows-1254 sanar ve Türkçe
  // karakterler bozulur: "Kulaklık" → "KulaklÄ±k".
  // Tek karakter, ama olmazsa olmaz.
  const bom = '\uFEFF';

  // 3) Blob: tarayıcıda bellekte yaşayan bir "dosya" nesnesi.
  const dosya = new Blob([bom + govde], {
    type: 'text/csv;charset=utf-8;',
  });

  // 4) İndirme işlemi.
  //
  // Tarayıcıda "dosya indir" diye bir API yok; bir <a> etiketi
  // oluşturup programatik olarak tıklıyoruz. Standart yöntem bu.
  const url = URL.createObjectURL(dosya);
  const link = document.createElement('a');

  link.href = url;

  // Dosya adına tarih ekliyoruz: kullanıcı üç farklı dönem
  // indirdiğinde hepsi "rapor.csv" olmasın, birbirini ezmesin.
  link.download = dosyaAdi + '-' + new Date().toISOString().slice(0, 10) + '.csv';

  // Firefox link DOM'da olmadan tıklamayı yok sayar — ekleyip
  // tıklayıp hemen siliyoruz.
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // ⚠️ TEMİZLİK ŞART.
  // createObjectURL bellekte bir referans tutar; serbest
  // bırakılmazsa sekme kapanana kadar orada kalır. Kullanıcı
  // 20 rapor indirirse 20 dosya bellekte birikir.
  URL.revokeObjectURL(url);
}